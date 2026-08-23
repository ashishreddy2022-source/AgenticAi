import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { config } from '../config/env.js';
import { Orchestrator } from '../agents/orchestrator.js';

let executionQueue = null;
let queueWorker = null;
let isUsingRedis = false;

// In-memory queue fallback implementation
class InMemoryExecutionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(name, data, opts = {}) {
    const job = {
      id: `mem_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      data,
      opts
    };
    
    console.log(`[InMemoryQueue] Queued job: ${name} (ExecutionId: ${data.executionId})`);
    
    // Process asynchronously without blocking
    setTimeout(() => {
      this.processJob(job);
    }, opts.delay || 50);

    return job;
  }

  async processJob(job) {
    try {
      console.log(`[InMemoryQueue] Processing job: ${job.name} (ExecutionId: ${job.data.executionId})`);
      await Orchestrator.runExecution(job.data.executionId);
    } catch (err) {
      console.error(`[InMemoryQueue] Job failed for execution ${job.data.executionId}:`, err.message);
    }
  }
}

const inMemoryQueue = new InMemoryExecutionQueue();

export function initExecutionQueue() {
  if (config.redisUrl && config.redisUrl.trim() !== '') {
    try {
      console.log(`[Queue] Initializing BullMQ with Redis connection: ${config.redisUrl}`);
      const connection = new IORedis(config.redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      });

      connection.on('error', (err) => {
        console.warn(`[Queue] Redis connection error: ${err.message}. Falling back to In-Memory Queue.`);
        isUsingRedis = false;
      });

      connection.on('ready', () => {
        console.log('[Queue] Redis connected successfully for BullMQ.');
        isUsingRedis = true;
      });

      executionQueue = new Queue('agentflow-executions', { connection });

      queueWorker = new Worker(
        'agentflow-executions',
        async (job) => {
          console.log(`[BullMQ Worker] Processing job ${job.id} for execution ${job.data.executionId}`);
          await Orchestrator.runExecution(job.data.executionId);
        },
        { connection, concurrency: 5 }
      );

      queueWorker.on('completed', (job) => {
        console.log(`[BullMQ Worker] Job ${job.id} completed successfully`);
      });

      queueWorker.on('failed', (job, err) => {
        console.error(`[BullMQ Worker] Job ${job?.id} failed:`, err.message);
      });

      isUsingRedis = true;
      return;
    } catch (err) {
      console.warn(`[Queue] Failed to initialize BullMQ: ${err.message}. Using In-Memory fallback.`);
      isUsingRedis = false;
    }
  } else {
    console.log('[Queue] No REDIS_URL configured. Initializing High-Performance In-Memory Execution Queue.');
    isUsingRedis = false;
  }
}

/**
 * Enqueue an execution run to the queue
 */
export async function queueExecution(executionId, opts = {}) {
  if (isUsingRedis && executionQueue) {
    try {
      return await executionQueue.add('run-execution', { executionId }, opts);
    } catch (err) {
      console.warn('[Queue] BullMQ add failed, falling back to In-Memory queue:', err.message);
      return inMemoryQueue.add('run-execution', { executionId }, opts);
    }
  }
  return inMemoryQueue.add('run-execution', { executionId }, opts);
}

export function getQueueStatus() {
  return {
    engine: isUsingRedis ? 'BullMQ (Redis)' : 'In-Memory Async Queue',
    isUsingRedis
  };
}
