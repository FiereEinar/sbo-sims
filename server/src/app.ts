import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

import authRouter from './routes/auth';
import studentRouter from './routes/student';
import userRouter from './routes/user';
import transactionRouter from './routes/transaction';
import categoryRouter from './routes/category';
import organizationRouter from './routes/organization';

import { notFoundHandler } from './middlewares/not-found';
import { errorHandler } from './middlewares/error';
import { auth } from './middlewares/auth';
import {
	attachDatabaseModels,
	attachOriginalDatabaseModels,
} from './middlewares/attach-database-models';
import { NODE_ENV, PORT as PORT_STRING } from './constants/env';
const PORT = Number(PORT_STRING);
import { healthcheck } from './middlewares/healthcheck';
import { corsOptions } from './utils/cors';

const app = express();

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', healthcheck);

// Attach global database models to the request object
app.use(attachOriginalDatabaseModels);
app.use('/auth', authRouter);

// All routes from here requires the user to be authenticated
app.use(auth);
app.use(attachDatabaseModels); // Attach dynamic database models to the request object
app.use('/student', studentRouter);
app.use('/user', userRouter);
app.use('/transaction', transactionRouter);
app.use('/category', categoryRouter);
app.use('/organization', organizationRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

if (NODE_ENV !== 'test') {
	app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));
}

export default app;
