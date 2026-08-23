import { Execution } from '../models/Execution.js';
import { AgentMemory } from '../models/AgentMemory.js';
import { PlannerAgent } from './plannerAgent.js';
import { ExecutionAgent } from './executionAgent.js';
import { ValidationAgent } from './validationAgent.js';
import { RecoveryAgent } from './recoveryAgent.js';
import { MonitoringAgent } from './monitoringAgent.js';
import { emitExecutionEvent } from '../config/socket.js';

export class Orchestrator {
  /**
   * Main agentic execution engine loop
   */
  static async runExecution(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    if (execution.status === 'CANCELLED' || execution.status === 'COMPLETED') {
      return;
    }

    const workflowId = execution.workflowId;
    const userId = execution.owner;
    const workflowSnapshot = execution.workflowSnapshot || { nodes: [], edges: [] };

    // 1. Mark status RUNNING
    execution.status = 'RUNNING';
    execution.startTime = execution.startTime || new Date();
    await execution.save();

    emitExecutionEvent(executionId.toString(), 'execution:status_change', {
      executionId: executionId.toString(),
      status: 'RUNNING'
    });

    await MonitoringAgent.logEvent({
      executionId,
      workflowId,
      userId,
      agent: 'system',
      level: 'info',
      message: `Execution run initiated for workflow "${workflowSnapshot.name || 'Workflow'}" (Snapshot v${workflowSnapshot.version || 1})`
    });

    // 2. Planner Agent Phase
    await MonitoringAgent.logEvent({
      executionId,
      workflowId,
      userId,
      agent: 'planner',
      level: 'info',
      message: 'Planner Agent: Analyzing DAG graph topology and generating optimal node sequence...'
    });

    const { plan, confidenceScore, warnings } = await PlannerAgent.plan(workflowSnapshot);

    execution.agentConfidence = confidenceScore;
    await execution.save();

    await AgentMemory.create({
      workflowId,
      executionId,
      agentId: 'planner',
      key: 'execution_plan',
      value: plan.map((n) => ({ id: n.id, label: n.data?.label })),
      confidenceScore
    });

    await MonitoringAgent.logEvent({
      executionId,
      workflowId,
      userId,
      agent: 'planner',
      level: warnings.length > 0 ? 'warning' : 'success',
      message: `Planner Agent: Execution sequence computed (${plan.length} nodes). Confidence score: ${Math.round(confidenceScore * 100)}%`,
      metadata: { planLength: plan.length, confidenceScore, warnings }
    });

    // Context dictionary holding step outputs
    const executionContext = {
      inputs: execution.inputs || {},
      outputs: {}
    };

    let stepIndex = 0;

    // 3. Sequential Node Execution Loop
    for (const node of plan) {
      stepIndex++;

      // Check if paused or cancelled before proceeding to next node
      const freshExec = await Execution.findById(executionId).lean();
      if (freshExec.status === 'PAUSED') {
        await MonitoringAgent.logEvent({
          executionId,
          workflowId,
          userId,
          nodeId: node.id,
          agent: 'system',
          level: 'warning',
          message: `Execution paused by operator before executing step ${stepIndex} (${node.data?.label || node.id})`
        });
        return;
      }

      if (freshExec.status === 'CANCELLED') {
        await MonitoringAgent.logEvent({
          executionId,
          workflowId,
          userId,
          nodeId: node.id,
          agent: 'system',
          level: 'warning',
          message: `Execution cancelled by operator at step ${stepIndex}`
        });
        return;
      }

      // Update current active node
      await Execution.findByIdAndUpdate(executionId, { currentNode: node.id });
      emitExecutionEvent(executionId.toString(), 'execution:node_start', {
        executionId: executionId.toString(),
        nodeId: node.id,
        nodeLabel: node.data?.label || node.id,
        stepIndex,
        totalSteps: plan.length
      });

      // Execution Agent Phase
      await MonitoringAgent.logEvent({
        executionId,
        workflowId,
        userId,
        nodeId: node.id,
        agent: 'execution',
        level: 'info',
        message: `Execution Agent: Dispatching node "${node.data?.label || node.id}" [Provider: ${node.data?.provider || 'system'}, Action: ${node.data?.action || 'run'}]`
      });

      let nodeResult = null;
      let executedSuccessfully = false;
      let retriesForNode = 0;
      const maxRetries = 2;

      while (!executedSuccessfully && retriesForNode <= maxRetries) {
        try {
          nodeResult = await ExecutionAgent.executeNode(node, executionContext, userId);
          executedSuccessfully = true;
        } catch (nodeError) {
          retriesForNode++;
          // Recovery Agent Phase
          const recoveryAnalysis = RecoveryAgent.analyzeFailure(nodeError, retriesForNode, maxRetries);

          await MonitoringAgent.logEvent({
            executionId,
            workflowId,
            userId,
            nodeId: node.id,
            agent: 'recovery',
            level: 'warning',
            message: `Recovery Agent: Step failure detected. ${recoveryAnalysis.reason} [Error: ${nodeError.message}]`,
            metadata: { error: nodeError.message, code: nodeError.code, recovery: recoveryAnalysis }
          });

          if (recoveryAnalysis.strategy === 'retry_with_backoff' && retriesForNode <= maxRetries) {
            await new Promise((res) => setTimeout(res, Math.min(recoveryAnalysis.backoffMs, 3000)));
            await Execution.findByIdAndUpdate(executionId, { $inc: { retryCount: 1 } });
          } else {
            // Escalate & fail execution
            const endTime = new Date();
            const duration = endTime - execution.startTime;
            await Execution.findByIdAndUpdate(executionId, {
              status: 'FAILED',
              currentNode: node.id,
              endTime,
              duration,
              error: {
                nodeId: node.id,
                message: nodeError.message,
                code: nodeError.code || recoveryAnalysis.classification,
                classification: recoveryAnalysis.classification
              }
            });

            await MonitoringAgent.logEvent({
              executionId,
              workflowId,
              userId,
              nodeId: node.id,
              agent: 'recovery',
              level: 'error',
              message: `Recovery Agent: Failure escalated to human operator. Execution halted at node "${node.data?.label || node.id}".`
            });

            await MonitoringAgent.notify({
              userId,
              workflowId,
              executionId,
              type: 'escalation',
              title: `Execution Failed: ${workflowSnapshot.name || 'Workflow'}`,
              message: `Step "${node.data?.label || node.id}" encountered ${recoveryAnalysis.classification}: ${nodeError.message}`
            });

            emitExecutionEvent(executionId.toString(), 'execution:status_change', {
              executionId: executionId.toString(),
              status: 'FAILED',
              error: nodeError.message
            });

            return;
          }
        }
      }

      // Store node result into context
      executionContext[node.id] = nodeResult;
      executionContext.outputs[node.id] = nodeResult;

      // Validation Agent Phase
      await MonitoringAgent.logEvent({
        executionId,
        workflowId,
        userId,
        nodeId: node.id,
        agent: 'validation',
        level: 'info',
        message: `Validation Agent: Validating output schema and contract for step "${node.data?.label || node.id}"...`
      });

      const validation = ValidationAgent.validate(node, nodeResult);
      if (!validation.isValid) {
        await MonitoringAgent.logEvent({
          executionId,
          workflowId,
          userId,
          nodeId: node.id,
          agent: 'validation',
          level: 'warning',
          message: `Validation Agent Warning: ${validation.errors.join('; ')}`,
          metadata: validation
        });
      } else {
        await MonitoringAgent.logEvent({
          executionId,
          workflowId,
          userId,
          nodeId: node.id,
          agent: 'validation',
          level: 'success',
          message: `Validation Agent: Step output verified successfully against contract.`
        });
      }

      // Store in Agent Memory
      await AgentMemory.create({
        workflowId,
        executionId,
        agentId: 'execution',
        key: `step_output_${node.id}`,
        value: nodeResult,
        confidenceScore: 0.99
      });

      emitExecutionEvent(executionId.toString(), 'execution:node_complete', {
        executionId: executionId.toString(),
        nodeId: node.id,
        result: nodeResult
      });
    }

    // 4. Monitoring Agent Finalize & Completion
    const endTime = new Date();
    const duration = endTime - execution.startTime;

    await Execution.findByIdAndUpdate(executionId, {
      status: 'COMPLETED',
      currentNode: null,
      endTime,
      duration,
      outputs: executionContext.outputs
    });

    await MonitoringAgent.logEvent({
      executionId,
      workflowId,
      userId,
      agent: 'monitoring',
      level: 'success',
      message: `Monitoring Agent: Workflow executed successfully across all ${plan.length} steps in ${(duration / 1000).toFixed(2)}s.`,
      metadata: { duration, totalSteps: plan.length }
    });

    await MonitoringAgent.notify({
      userId,
      workflowId,
      executionId,
      type: 'success',
      title: `Workflow Completed Successfully`,
      message: `"${workflowSnapshot.name || 'Workflow'}" finished all ${plan.length} agent steps in ${(duration / 1000).toFixed(2)}s.`
    });

    emitExecutionEvent(executionId.toString(), 'execution:status_change', {
      executionId: executionId.toString(),
      status: 'COMPLETED',
      duration,
      outputs: executionContext.outputs
    });
  }
}
