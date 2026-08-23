import mongoose from 'mongoose';

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true
    },
    executionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Execution',
      required: true,
      index: true
    },
    agentId: {
      type: String,
      required: true
    },
    key: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed
    },
    confidenceScore: {
      type: Number,
      default: 1.0
    }
  },
  {
    timestamps: true
  }
);

export const AgentMemory = mongoose.model('AgentMemory', agentMemorySchema);
