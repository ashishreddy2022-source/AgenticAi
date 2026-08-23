import mongoose from 'mongoose';

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workflowSnapshot: {
      nodes: [mongoose.Schema.Types.Mixed],
      edges: [mongoose.Schema.Types.Mixed],
      name: String,
      version: Number
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING'
    },
    currentNode: {
      type: String,
      default: null
    },
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // milliseconds
      default: 0
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    retryCount: {
      type: Number,
      default: 0
    },
    agentConfidence: {
      type: Number,
      default: 0.95
    },
    langGraphStatus: {
      type: String,
      enum: ['available', 'not-installed'],
      default: 'available'
    }
  },
  {
    timestamps: true
  }
);

export const Execution = mongoose.model('Execution', executionSchema);
