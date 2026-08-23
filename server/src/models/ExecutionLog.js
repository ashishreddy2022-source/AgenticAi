import mongoose from 'mongoose';

const executionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true
    },
    nodeId: {
      type: String,
      default: null
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring', 'system'],
      required: true
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info'
    },
    message: {
      type: String,
      required: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

export const ExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);
