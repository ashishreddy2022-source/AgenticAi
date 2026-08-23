import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true
    },
    isConnected: {
      type: Boolean,
      default: false
    },
    scopes: {
      type: [String],
      default: []
    },
    encryptedAccessToken: {
      type: String,
      default: null
    },
    encryptedRefreshToken: {
      type: String,
      default: null
    },
    encryptedApiKey: {
      type: String,
      default: null
    },
    webhookUrl: {
      type: String,
      default: null
    },
    accountEmail: {
      type: String,
      default: null
    },
    accountName: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

integrationSchema.index({ owner: 1, provider: 1 }, { unique: true });

export const Integration = mongoose.model('Integration', integrationSchema);
