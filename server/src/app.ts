import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import userAgent from 'express-useragent';

// Load server/.env first (Vercel + local shared vars)
dotenv.config();
// Fallback: also load root .env for desktop-only vars (IS_ELECTRON, SYNC_ENABLED, etc.)
// override:false means server/.env values always win if there's a conflict.
// On Vercel this is a harmless no-op (no root .env exists).
dotenv.config({
  path: require('path').resolve(process.cwd(), '..', '.env'),
  override: false,
});

import authRouter from './routes/auth.route';
import studentRouter from './routes/student.route';
import userRouter from './routes/user.route';
import transactionRouter from './routes/transaction.route';
import prelistingRouter from './routes/prelisting.route';
import categoryRouter from './routes/category.route';
import organizationRouter from './routes/organization.route';
import roleRouter from './routes/role.route';
import settingRouter from './routes/setting.route';
import adminRouter from './routes/admin.route';
import reportRouter from './routes/report.route';
import eventRouter from './routes/event.route';
import eventSessionRouter from './routes/event-session.route';
import attendanceRouter from './routes/attendance.route';
import attendanceReportRouter from './routes/attendance-report.route';
import studentPortalRouter from './routes/student-portal.route';
import paymentRequestRouter from './routes/payment-request.route';
import supportTicketRouter from './routes/support-ticket.route';
import gpoaRouter from './routes/gpoa.route';
import syncRouter from './routes/sync.route';
import {
  sync_health,
  sync_bootstrap,
  sync_user_bootstrap,
  sync_apply_bootstrap_batch,
} from './controllers/sync.controller';
import path from 'path';

import { NODE_ENV, PORT } from './constants/env';
import { notFoundHandler } from './middlewares/not-found';
import { errorHandler } from './middlewares/error';
import { auth } from './middlewares/authentication/auth';
import { healthcheck } from './middlewares/healthcheck';
import { corsOptions } from './utils/cors';
import { globalLimiter } from './middlewares/rateLimiter';
import { extractTenantContext } from './middlewares/attach-database-models';
import { seedAdmin } from './database/seedAdmin';
import connectToMongoDB from './database/mongodb';
connectToMongoDB();

const app = express();
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(userAgent.express());
app.set('trust proxy', true);
app.use(globalLimiter);

// Serve uploads folder locally
if (NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.get('/', healthcheck);

let isSeeded = false;
app.use(async (req, res, next) => {
  if (NODE_ENV !== 'test' && !isSeeded) {
    try {
      await seedAdmin();
      isSeeded = true;
    } catch (err) {
      console.error('[seed] Startup error:', err);
    }
  }
  next();
});

app.use('/auth', authRouter);
app.use('/student-portal', studentPortalRouter);
// /sync/health and /sync/bootstrap are pre-auth for SyncEngine startup
app.get('/sync/health', sync_health);
app.get('/sync/bootstrap', sync_bootstrap);
app.get('/sync/user-bootstrap', sync_user_bootstrap);
app.post('/sync/apply-bootstrap-batch', sync_apply_bootstrap_batch);
app.use(auth);
app.use('/admin', adminRouter);
app.use('/setting', settingRouter);
app.use(extractTenantContext);
app.use('/student', studentRouter);
app.use('/user', userRouter);
app.use('/transaction', transactionRouter);
app.use('/report', reportRouter);
app.use('/prelisting', prelistingRouter);
app.use('/category', categoryRouter);
app.use('/organization', organizationRouter);
app.use('/role', roleRouter);
app.use('/event', eventRouter);
app.use('/event-session', eventSessionRouter);
app.use('/attendance', attendanceRouter);
app.use('/attendance-report', attendanceReportRouter);
app.use('/payment-request', paymentRequestRouter);
app.use('/support-ticket', supportTicketRouter);
app.use('/gpoa', gpoaRouter);
app.use('/sync', syncRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

if (NODE_ENV !== 'test') {
  if (!process.env.VERCEL) {
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
}
