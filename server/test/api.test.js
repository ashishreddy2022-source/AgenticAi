import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('Agentflow AI Full-Stack End-to-End Test Suite', async (t) => {
  let authToken = '';
  let userId = '';
  let createdWorkflowId = '';
  let executionId = '';

  // 1. Health check
  await t.test('GET /api/health should report healthy and ready', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'healthy');
    assert.equal(data.langGraphStatus, 'available');
    assert.ok(data.queue.engine);
  });

  // 2. User Registration
  await t.test('POST /api/auth/register should create user and return JWT', async () => {
    const email = `test_operator_${Date.now()}@agentflow.ai`;
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test Operator',
        email,
        password: 'SecurePassword2026!',
        role: 'operator'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.ok(body.data.user.id);
    authToken = body.data.token;
    userId = body.data.user.id;
  });

  // 3. User Profile /auth/me
  await t.test('GET /api/auth/me should return operator profile', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, userId);
  });

  // 4. Connect Mock Integration credentials
  await t.test('POST /api/integrations should save encrypted credentials', async () => {
    const res = await fetch(`${BASE_URL}/integrations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'slack',
        accessToken: 'mock_slack_test_token',
        accountName: 'Test Slack Workspace'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.isConnected, true);
  });

  // 5. AI Prompt-to-Workflow Generation
  await t.test('POST /api/workflows/generate should produce DAG graph from prompt', async () => {
    const res = await fetch(`${BASE_URL}/workflows/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Parse incoming invoice email with AI, extract vendor details, append to Google Sheets and notify Slack channel'
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.nodes.length >= 3);
    assert.ok(body.data.edges.length >= 2);
    assert.ok(body.data.name);
  });

  // 6. Workflow CRUD
  await t.test('POST /api/workflows should save workflow to MongoDB', async () => {
    const res = await fetch(`${BASE_URL}/workflows`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'E2E Test Pipeline',
        description: 'End to end testing workflow',
        tags: ['Testing', 'E2E'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 250, y: 50 },
            data: {
              label: 'Manual Ingress',
              category: 'trigger',
              provider: 'system',
              action: 'manual_trigger',
              config: {}
            }
          },
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 250, y: 180 },
            data: {
              label: 'AI Line Extractor',
              category: 'agent',
              provider: 'openrouter',
              action: 'ai_reasoning',
              config: { prompt: 'Extract order id and status' }
            }
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 250, y: 310 },
            data: {
              label: 'Slack Ops Broadcast',
              category: 'integration',
              provider: 'slack',
              action: 'post_message',
              config: { channel: '#ops-alerts', message: 'Order evaluated: {{node-2.output}}' }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2' },
          { id: 'e2-3', source: 'node-2', target: 'node-3' }
        ]
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data._id);
    assert.equal(body.data.version, 1);
    createdWorkflowId = body.data._id;
  });

  // 7. Workflow Execution Start
  await t.test('POST /api/workflows/:id/execute should start agentic execution', async () => {
    const res = await fetch(`${BASE_URL}/workflows/${createdWorkflowId}/execute`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: { testRun: true } })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data._id);
    executionId = body.data._id;
  });

  // 8. Wait for agent orchestration to complete
  await t.test('Execution should run through Planner, Execution, Validation, Monitoring and reach COMPLETED', async () => {
    let completed = false;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 400));
      const res = await fetch(`${BASE_URL}/executions/${executionId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const body = await res.json();
      if (body.data.status === 'COMPLETED' || body.data.status === 'FAILED') {
        completed = true;
        assert.equal(body.data.status, 'COMPLETED');
        assert.ok(body.data.duration >= 0);
        break;
      }
    }
    assert.ok(completed, 'Execution should reach COMPLETED state');
  });

  // 9. Execution Timeline Logs Verification
  await t.test('GET /api/executions/:id/timeline should return agent timeline logs', async () => {
    const res = await fetch(`${BASE_URL}/executions/${executionId}/timeline`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.length >= 4);

    const agentsPresent = new Set(body.data.map((l) => l.agent));
    assert.ok(agentsPresent.has('planner'), 'Planner agent must have logged events');
    assert.ok(agentsPresent.has('execution'), 'Execution agent must have logged events');
    assert.ok(agentsPresent.has('validation'), 'Validation agent must have logged events');
    assert.ok(agentsPresent.has('monitoring'), 'Monitoring agent must have logged events');
  });

  // 10. Integration List
  await t.test('GET /api/integrations should list all 4 providers', async () => {
    const res = await fetch(`${BASE_URL}/integrations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.length, 4);
    const providers = body.data.map((p) => p.provider);
    assert.ok(providers.includes('gmail'));
    assert.ok(providers.includes('slack'));
    assert.ok(providers.includes('discord'));
    assert.ok(providers.includes('google-sheets'));
  });

  // 11. Dashboard Aggregated Metrics
  await t.test('GET /api/workflows/dashboard should return operator metrics', async () => {
    const res = await fetch(`${BASE_URL}/workflows/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.metrics.totalWorkflows >= 1);
    assert.ok(body.data.metrics.totalExecutions >= 1);
    assert.equal(body.data.metrics.activeAgents, 5);
  });
});
