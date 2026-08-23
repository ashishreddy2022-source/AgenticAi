import { config } from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class AIService {
  /**
   * Generates a workflow graph (nodes & edges) from a natural language prompt.
   * Priority: OpenRouter -> Gemini -> Deterministic Rule Engine
   */
  static async generateWorkflowFromPrompt(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required for workflow generation');
    }

    const trimmedPrompt = prompt.trim();

    // 1. Try OpenRouter if API key is provided
    if (config.openRouterApiKey) {
      try {
        console.log('[AI Service] Attempting workflow generation with OpenRouter...');
        const result = await this.generateViaOpenRouter(trimmedPrompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generatedBy = 'OpenRouter AI (Claude/Llama)';
          return result;
        }
      } catch (err) {
        console.warn('[AI Service] OpenRouter generation failed, falling back to Gemini:', err.message);
      }
    }

    // 2. Try Gemini if API key is provided
    if (config.geminiApiKey) {
      try {
        console.log('[AI Service] Attempting workflow generation with Google Gemini...');
        const result = await this.generateViaGemini(trimmedPrompt);
        if (result && result.nodes && result.nodes.length > 0) {
          result.generatedBy = 'Google Gemini AI';
          return result;
        }
      } catch (err) {
        console.warn('[AI Service] Gemini generation failed, falling back to Deterministic Engine:', err.message);
      }
    }

    // 3. Deterministic Rule-Based Fallback
    console.log('[AI Service] Generating workflow using Deterministic Rule Engine...');
    const result = this.generateDeterministicWorkflow(trimmedPrompt);
    result.generatedBy = 'Agentflow Deterministic Rule Engine';
    return result;
  }

  /**
   * Calls OpenRouter API to produce valid workflow JSON
   */
  static async generateViaOpenRouter(prompt) {
    const systemPrompt = `You are an AI Workflow Architect for the Agentflow Operations Platform.
Convert user automation requests into a structured JSON workflow graph with nodes and edges compatible with React Flow.
Return ONLY valid JSON in this exact structure:
{
  "name": "Concise Workflow Title",
  "description": "Clear description of what this automation achieves",
  "tags": ["tag1", "tag2"],
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger", // one of: trigger, agent, integration, condition, action
      "position": { "x": 250, "y": 50 },
      "data": {
        "label": "Webhook / Event Trigger",
        "category": "trigger",
        "action": "webhook_receive",
        "provider": "system",
        "config": {}
      }
    },
    ...
  ],
  "edges": [
    {
      "id": "edge-1-2",
      "source": "node-1",
      "target": "node-2",
      "animated": true
    }
  ]
}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openRouterApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a workflow for: ${prompt}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return JSON.parse(content);
  }

  /**
   * Calls Google Gemini SDK
   */
  static async generateViaGemini(prompt) {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const instructions = `You are an AI Workflow Architect for the Agentflow Platform. Convert the user prompt into a structured JSON workflow.
Output strictly JSON without markdown fences. Format:
{
  "name": "string",
  "description": "string",
  "tags": ["tag1", "tag2"],
  "nodes": [
    {
      "id": "node-1",
      "type": "trigger",
      "position": { "x": 250, "y": 80 },
      "data": { "label": "string", "category": "trigger", "action": "string", "provider": "string", "config": {} }
    }
  ],
  "edges": [
    { "id": "edge-1-2", "source": "node-1", "target": "node-2", "animated": true }
  ]
}`;

    const result = await model.generateContent(`${instructions}\n\nPrompt: ${prompt}`);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleanJson);
  }

  /**
   * Deterministic rule-based workflow generator
   */
  static generateDeterministicWorkflow(prompt) {
    const lower = prompt.toLowerCase();

    // 1. Invoice Routing Template
    if (lower.includes('invoice') || lower.includes('receipt') || lower.includes('billing')) {
      return {
        name: 'Automated Invoice Processing & Ledger',
        description: 'Monitors incoming Gmail invoices, uses AI to extract line items, appends to Google Sheets, and sends approval alerts to Slack.',
        tags: ['Finance', 'Invoicing', 'Gmail', 'Google Sheets', 'Slack'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 280, y: 50 },
            data: {
              label: 'Gmail New Invoice Trigger',
              category: 'trigger',
              provider: 'gmail',
              action: 'read_emails',
              config: { query: 'subject:invoice has:attachment', interval: '5m' }
            }
          },
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 280, y: 180 },
            data: {
              label: 'AI Invoice Data Extractor',
              category: 'agent',
              provider: 'openrouter',
              action: 'ai_reasoning',
              config: {
                prompt: 'Extract vendor name, invoice date, due date, invoice number, and total amount from the email text.',
                model: 'claude-3-5-sonnet',
                temperature: 0.2
              }
            }
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 120, y: 320 },
            data: {
              label: 'Google Sheets Financial Ledger',
              category: 'integration',
              provider: 'google-sheets',
              action: 'append_row',
              config: {
                spreadsheetId: 'finance_ledger_2026',
                range: 'Invoices!A1',
                values: ['{{node-2.vendor}}', '{{node-2.invoiceNo}}', '{{node-2.amount}}', '{{node-2.dueDate}}', 'Pending Approval']
              }
            }
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 440, y: 320 },
            data: {
              label: 'Slack Finance Channel Alert',
              category: 'integration',
              provider: 'slack',
              action: 'post_message',
              config: {
                channel: '#finance-ops',
                message: '🧾 *New Invoice Detected*: Vendor `{{node-2.vendor}}` for amount `${{node-2.amount}}`. Logged to Google Sheets.'
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true }
        ]
      };
    }

    // 2. Incident & Error Alert Routing
    if (lower.includes('incident') || lower.includes('alert') || lower.includes('error') || lower.includes('crash') || lower.includes('bug')) {
      return {
        name: 'Multi-Channel Incident Dispatcher',
        description: 'Captures webhook error payload, evaluates severity using AI, broadcasts immediate alerts to Discord and dispatches urgent emails.',
        tags: ['DevOps', 'Incidents', 'Discord', 'Gmail', 'Urgent'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 280, y: 50 },
            data: {
              label: 'Webhook Error Listener',
              category: 'trigger',
              provider: 'system',
              action: 'webhook_receive',
              config: { webhookPath: '/webhooks/incident-events' }
            }
          },
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 280, y: 180 },
            data: {
              label: 'AI Severity Classifier',
              category: 'agent',
              provider: 'gemini',
              action: 'ai_reasoning',
              config: {
                prompt: 'Analyze stack trace, determine outage severity (P0, P1, P2), and draft incident summary.',
                temperature: 0.1
              }
            }
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 120, y: 320 },
            data: {
              label: 'Discord War-Room Broadcast',
              category: 'integration',
              provider: 'discord',
              action: 'send_message',
              config: {
                channelId: 'incidents-war-room',
                message: '🚨 **INCIDENT DETECTED** [Severity: {{node-2.severity}}]\nSummary: {{node-2.summary}}\nAwaiting responder confirmation.'
              }
            }
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 440, y: 320 },
            data: {
              label: 'Gmail On-Call Dispatch',
              category: 'integration',
              provider: 'gmail',
              action: 'send_email',
              config: {
                to: 'oncall-lead@agentflow.ai',
                subject: '[URGENT {{node-2.severity}}] System Incident Alert',
                body: 'Emergency incident logged:\n\n{{node-2.summary}}\n\nPlease acknowledge immediately.'
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true }
        ]
      };
    }

    // 3. Customer Lead Qualification & Sheets Sync
    if (lower.includes('lead') || lower.includes('customer') || lower.includes('sales') || lower.includes('crm')) {
      return {
        name: 'AI Lead Qualification & CRM Pipeline',
        description: 'Evaluates new inbound sales inquiries, assigns lead score, logs data to Google Sheets CRM, and notifies Slack channel.',
        tags: ['Sales', 'Leads', 'CRM', 'Google Sheets', 'Slack'],
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            position: { x: 280, y: 50 },
            data: {
              label: 'New Lead Submission Trigger',
              category: 'trigger',
              provider: 'system',
              action: 'webhook_receive',
              config: { webhookPath: '/webhooks/lead-form' }
            }
          },
          {
            id: 'node-2',
            type: 'agent',
            position: { x: 280, y: 180 },
            data: {
              label: 'AI Lead Scoring Agent',
              category: 'agent',
              provider: 'openrouter',
              action: 'ai_reasoning',
              config: {
                prompt: 'Assess company size, intent, budget, and assign a lead quality score (High/Medium/Low).',
                temperature: 0.3
              }
            }
          },
          {
            id: 'node-3',
            type: 'integration',
            position: { x: 280, y: 310 },
            data: {
              label: 'Append to Google Sheets CRM',
              category: 'integration',
              provider: 'google-sheets',
              action: 'append_row',
              config: {
                spreadsheetId: 'sales_crm_master',
                range: 'Leads!A1',
                values: ['{{node-1.name}}', '{{node-1.company}}', '{{node-2.score}}', '{{node-2.budget}}', 'New']
              }
            }
          },
          {
            id: 'node-4',
            type: 'integration',
            position: { x: 280, y: 440 },
            data: {
              label: 'Slack High Priority Lead Alert',
              category: 'integration',
              provider: 'slack',
              action: 'post_message',
              config: {
                channel: '#sales-leads',
                message: '🎯 *High Value Lead*: `{{node-1.company}}` scored *{{node-2.score}}*. Assigned to SDR team.'
              }
            }
          }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e3-4', source: 'node-3', target: 'node-4', animated: true }
        ]
      };
    }

    // 4. Default Dynamic Multi-Agent Workflow
    const hasSlack = lower.includes('slack');
    const hasDiscord = lower.includes('discord');
    const hasGmail = lower.includes('mail') || lower.includes('gmail');
    const hasSheets = lower.includes('sheet') || lower.includes('excel') || lower.includes('csv');

    const nodes = [
      {
        id: 'node-1',
        type: 'trigger',
        position: { x: 280, y: 50 },
        data: {
          label: 'Automation Ingress Trigger',
          category: 'trigger',
          provider: 'system',
          action: 'manual_trigger',
          config: { triggerType: 'manual_or_scheduled' }
        }
      },
      {
        id: 'node-2',
        type: 'agent',
        position: { x: 280, y: 180 },
        data: {
          label: 'AI Reasoning & Transformation',
          category: 'agent',
          provider: 'openrouter',
          action: 'ai_reasoning',
          config: {
            prompt: `Analyze incoming input and execute operational instruction: ${prompt}`,
            temperature: 0.5
          }
        }
      }
    ];

    const edges = [
      { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true }
    ];

    let yOffset = 310;
    let nodeIndex = 3;

    if (hasGmail || (!hasSlack && !hasDiscord && !hasSheets)) {
      const gNodeId = `node-${nodeIndex++}`;
      nodes.push({
        id: gNodeId,
        type: 'integration',
        position: { x: 120, y: yOffset },
        data: {
          label: 'Gmail Notification Dispatch',
          category: 'integration',
          provider: 'gmail',
          action: 'send_email',
          config: {
            to: 'operator@agentflow.ai',
            subject: 'Automated Operations Notification',
            body: 'Workflow execution processed successfully:\n\n{{node-2.output}}'
          }
        }
      });
      edges.push({ id: `e2-${gNodeId}`, source: 'node-2', target: gNodeId, animated: true });
    }

    if (hasSlack || hasDiscord) {
      const chatNodeId = `node-${nodeIndex++}`;
      const isSlack = hasSlack || !hasDiscord;
      nodes.push({
        id: chatNodeId,
        type: 'integration',
        position: { x: 440, y: yOffset },
        data: {
          label: isSlack ? 'Slack Ops Channel' : 'Discord Ops Channel',
          category: 'integration',
          provider: isSlack ? 'slack' : 'discord',
          action: isSlack ? 'post_message' : 'send_message',
          config: {
            channel: '#ops-stream',
            message: `🤖 *Agentflow Result*: {{node-2.output}}`
          }
        }
      });
      edges.push({ id: `e2-${chatNodeId}`, source: 'node-2', target: chatNodeId, animated: true });
    }

    if (hasSheets) {
      const sNodeId = `node-${nodeIndex++}`;
      nodes.push({
        id: sNodeId,
        type: 'integration',
        position: { x: 280, y: yOffset + 130 },
        data: {
          label: 'Google Sheets Audit Record',
          category: 'integration',
          provider: 'google-sheets',
          action: 'append_row',
          config: {
            spreadsheetId: 'ops_audit_log_2026',
            range: 'Audit!A1',
            values: ['{{timestamp}}', '{{node-2.summary}}', 'COMPLETED']
          }
        }
      });
      edges.push({ id: `e2-${sNodeId}`, source: 'node-2', target: sNodeId, animated: true });
    }

    return {
      name: prompt.length > 45 ? prompt.substring(0, 42) + '...' : prompt,
      description: `Generated automation workflow based on instruction: "${prompt}"`,
      tags: ['Agentic', 'Automated', 'Custom'],
      nodes,
      edges
    };
  }
}
