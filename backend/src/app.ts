import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import swaggerUi from 'swagger-ui-express';
// import swaggerJsdoc from 'swagger-jsdoc';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Import routes (to be created)
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import designationRoutes from './routes/designationRoutes';
import employeeRoutes from './routes/employeeRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import probationRoutes from './routes/probationRoutes';
import exitRoutes from './routes/exitRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import leaveRoutes from './routes/leaveRoutes';
import documentRoutes from './routes/documentRoutes';
import performanceRoutes from './routes/performanceRoutes';
import hrConnectRoutes from './routes/hrConnectRoutes';
import chatRoutes from './routes/chatRoutes';
import ticketRoutes from './routes/ticketRoutes';
import settingsRoutes from './routes/settingsRoutes';
import paymentMethodRoutes from './routes/paymentMethodRoutes';
import registrationRoutes from './routes/registrationRoutes';
import onboardingWizardRoutes from './routes/onboardingWizardRoutes';
import invitationRoutes from './routes/invitationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import professionalHistoryRoutes from './routes/professionalHistoryRoutes';
import compensationRoutes from './routes/compensationRoutes';
import calendarRoutes from './routes/calendarRoutes';
import activityRoutes from './routes/activityRoutes';
import reportingRoutes from './routes/reportingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import templateGenerationRoutes from './routes/templateGenerationRoutes';
import orgStructureRoutes from './routes/orgStructureRoutes';
import digitalLibraryRoutes from './routes/digitalLibraryRoutes';
import documentCategoryRoutes from './routes/documentCategoryRoutes';
import companyDocumentRoutes from './routes/companyDocumentRoutes';
import employeeDocumentRoutes from './routes/employeeDocumentRoutes';
import assistantRoutes from './routes/assistantRoutes';
import demoRoutes from './routes/demoRoutes';
import { uploadRoots } from './utils/uploadPaths';
// import pmsRoutes from './routes/pmsRoutes';
// import transferRoutes from './routes/transferRoutes';
// import confirmationRoutes from './routes/confirmationRoutes';
// import adminRoutes from './routes/adminRoutes';

const app: Application = express();

if (config.nodeEnv !== 'development') {
  app.set('trust proxy', 1);
}

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

// const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "http://localhost:5000"],
    },
  },
}));

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:3000',
  'https://aurorahr.in',
  config.corsOrigin
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);

      // In development, allow local browser testing through localhost or 127.0.0.1.
      if (
        config.nodeEnv === 'development' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true);
      }

      // Check if origin is in allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`⚠️  CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting (disabled in development/test for easier local and CI testing)
if (config.nodeEnv !== 'development' && config.nodeEnv !== 'test') {
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
  console.log(`⚠️  Rate limiting enabled: ${config.rateLimitMaxRequests} requests per ${config.rateLimitWindowMs / 1000}s`);
} else {
  console.log(`✅ Rate limiting DISABLED in ${config.nodeEnv} mode`);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware (commented out due to TypeScript type conflicts)
// app.use(compression() as any);

// Serve static files (uploaded files) with CORS headers
app.use('/uploads', (_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});
uploadRoots.forEach((root) => {
  app.use('/uploads', express.static(root));
});

// Request logging
app.use(requestLogger);

// API Documentation
// Disabled due to TypeScript type conflicts
// if (config.enableSwagger) {
//   app.use('/api/docs', swaggerUi.serve as any);
//   app.get('/api/docs', swaggerUi.setup(swaggerSpec) as any);
// }

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
apiRouter.use('/demo', demoRoutes);
apiRouter.use('/registration', registrationRoutes);
apiRouter.use('/onboarding-wizard', onboardingWizardRoutes);
apiRouter.use('/invitations', invitationRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/professional-history', professionalHistoryRoutes);
apiRouter.use('/compensation', compensationRoutes);
apiRouter.use('/calendar', calendarRoutes);
apiRouter.use('/activities', activityRoutes);
apiRouter.use('/departments', departmentRoutes);
apiRouter.use('/designations', designationRoutes);
apiRouter.use('/employees', employeeRoutes);
apiRouter.use('/onboarding', onboardingRoutes);
apiRouter.use('/probation', probationRoutes);
apiRouter.use('/exit', exitRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/leave', leaveRoutes);
apiRouter.use('/documents', documentRoutes);
apiRouter.use('/performance', performanceRoutes);
apiRouter.use('/hr-connect', hrConnectRoutes);
apiRouter.use('/chat', chatRoutes);
apiRouter.use('/helpdesk', ticketRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/payment-methods', paymentMethodRoutes);
apiRouter.use('/reports', reportingRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/document-templates', templateGenerationRoutes);
apiRouter.use('/org-structure', orgStructureRoutes);
apiRouter.use('/digital-library', digitalLibraryRoutes);
apiRouter.use('/document-categories', documentCategoryRoutes);
apiRouter.use('/company-documents', companyDocumentRoutes);
apiRouter.use('/employee-documents', employeeDocumentRoutes);
apiRouter.use('/assistant', assistantRoutes);
// apiRouter.use('/pms', pmsRoutes);
// apiRouter.use('/transfer', transferRoutes);
// apiRouter.use('/confirmation', confirmationRoutes);
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
