import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';
import { User } from '../models/User.js';

let mongod = null;

async function seedDefaultUser() {
  try {
    const existing = await User.findOne({ email: 'operator@agentflow.ai' });
    if (!existing) {
      await User.create({
        name: 'Lead Operator',
        email: 'operator@agentflow.ai',
        password: 'OperatorPass2026!',
        role: 'admin',
        lastLogin: new Date()
      });
      console.log('[DB] Pre-seeded default demo user (operator@agentflow.ai)');
    }
  } catch (err) {
    // ignore duplicate or concurrency errors
  }
}

export async function connectDB() {
  const uri = config.mongoUri;

  if (uri && uri.trim() !== '') {
    if (uri.includes('<db_username>') || uri.includes('<') || uri.includes('>')) {
      console.warn('⚠️ [DB Notice] MONGODB_URI contains placeholder "<db_username>". Please replace it with your actual MongoDB username in server/.env.');
    } else {
      try {
        console.log(`[DB] Connecting to configured MongoDB instance...`);
        await mongoose.connect(uri);
        console.log(`[DB] MongoDB Connected: ${mongoose.connection.host}`);
        await seedDefaultUser();
        return;
      } catch (err) {
        console.warn(`[DB] Failed to connect to ${uri}: ${err.message}. Falling back to In-Memory MongoMemoryServer...`);
      }
    }
  }

  try {
    console.log('[DB] Initializing In-Memory MongoDB instance...');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[DB] In-Memory MongoDB Connected at: ${memoryUri}`);
    await seedDefaultUser();
  } catch (error) {
    console.error('[DB] Critical Database Connection Error:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
}
