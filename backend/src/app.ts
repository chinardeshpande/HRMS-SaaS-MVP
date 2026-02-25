import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes (to be created)
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import employeeRoutes from './routes/employeeRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import probationRoutes from './routes/probationRoutes';
import exitRoutes from './routes/exitRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
// import pmsRoutes from './routes/pmsRoutes';
// import transferRoutes from './routes/transferRoutes';
// import confirmationRoutes from './routes/confirmationRoutes';
// import reportRoutes from './routes/reportRoutes';
// import adminRoutes from './routes/adminRoutes';

const app: Application = express();

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HRMS SaaS API',
      version: '1.0.0',
      description: 'Multi-tenant HRMS SaaS Platform API',
      contact: {
        name: 'API Support',
        email: 'support@hrms-saas.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development server',
      },
      {
        url: `https://api.hrms-saas.com/api/${config.apiVersion}`,
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression() as any);

// Request logging
app.use(requestLogger);

// API Documentation
if (config.enableSwagger) {
  app.use('/api/docs', swaggerUi.serve as any);
  app.get('/api/docs', swaggerUi.setup(swaggerSpec) as any);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
    },
  });
});

// API routes
const apiRouter = express.Router();

// Mount routes (uncomment as you create them)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/onboarding', onboardingRoutes);
apiRouter.use('/probation', probationRoutes);
apiRouter.use('/exit', exitRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leave', leaveRoutes);
// apiRouter.use('/pms', pmsRoutes);
// apiRouter.use('/transfer', transferRoutes);
// apiRouter.use('/confirmation', confirmationRoutes);
// apiRouter.use('/reports', reportRoutes);
// apiRouter.use('/admin', adminRoutes);

// Welcome endpoint
apiRouter.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Welcome to HRMS SaaS API',
      version: config.apiVersion,
      documentation: `/api/docs`,
    },
  });
});

app.use(`/api/${config.apiVersion}`, apiRouter);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
