import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import userAgent from 'express-useragent';
dotenv.config();

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
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(userAgent.express());
app.set('trust proxy', true);
app.use(globalLimiter);

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
app.use(auth);
app.use('/admin', adminRouter);
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
app.use('/setting', settingRouter);

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
