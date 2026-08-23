import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active'
    },
    triggerConfig: {
      type: {
        type: String,
        enum: ['manual', 'schedule', 'webhook', 'event', 'ai_prompt'],
        default: 'manual'
      },
      cron: String,
      webhookPath: String,
      eventSource: String,
      metadata: mongoose.Schema.Types.Mixed
    },
    nodes: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    edges: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    version: {
      type: Number,
      default: 1
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Workflow = mongoose.model('Workflow', workflowSchema);
