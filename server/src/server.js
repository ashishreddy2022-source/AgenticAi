import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { initExecutionQueue, getQueueStatus } from './queues/executionQueue.js';

import authRoutes from './routes/authRoutes.js';
import workflowRoutes from './routes/workflowRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

// 1. Security Headers & CORS
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, configured CLIENT_URL, localhost, or vercel.app domains
      if (!origin || origin === config.clientUrl || origin.includes('localhost') || origin.includes('vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  })
);

// 2. Request Parsing & Optimization
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 3. Rate limiting on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts from this IP, please try again later.'
  }
});
app.use('/api/auth', authLimiter);

// 4. Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'Agentflow AI Operations Automation Platform API',
    version: '1.0.0',
    message: 'Backend server is running smoothly. Access API endpoints under /api or view frontend application.',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'Agentflow AI Operations Automation Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    queue: getQueueStatus(),
    langGraphStatus: 'available'
  });
});

// 5. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 6. 404 Route Catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `API Route [${req.method} ${req.originalUrl}] does not exist on Agentflow Server`
  });
});

// 7. Global Error Handler
app.use(errorHandler);

// 8. Start Server & Bootstrap Subsystems
async function startServer() {
  try {
    console.log('==============================================');
    console.log('🚀 Bootstrapping Agentflow AI Platform Server');
    console.log('==============================================');

    // Initialize Database
    await connectDB();

    // Initialize Real-time Socket.IO
    initSocket(server);
    console.log('[Socket.IO] Real-time engine initialized');

    // Initialize Execution Background Queue
    initExecutionQueue();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [Server Error] Port ${config.port} is already in use by another process.`);
        console.error(`👉 Please terminate any existing process on port ${config.port} or change PORT in server/.env.\n`);
      } else {
        console.error('[Server Error]:', err.message);
      }
    });

    // Listen on configured port
    server.listen(config.port, () => {
      console.log(`[HTTP] Server listening on http://localhost:${config.port}`);
      console.log(`[HTTP] Client Origin: ${config.clientUrl}`);
      console.log(`[Health] Status available at http://localhost:${config.port}/api/health`);
      console.log('==============================================\n');
    });
  } catch (err) {
    console.error('[Server] Critical bootstrap error:', err);
    process.exit(1);
  }
}

startServer();

export { app, server };
