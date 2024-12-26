import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
dotenv.config();

import authRouter from './src/routes/auth';
import studentRouter from './src/routes/student';
import userRouter from './src/routes/user';
import transactionRouter from './src/routes/transaction';
import categoryRouter from './src/routes/category';
import organizationRouter from './src/routes/organization';

import { notFoundHandler } from './src/middlewares/not-found';
import { errorHandler } from './src/middlewares/error';
import { auth } from './src/middlewares/auth';
import {
	attachDatabaseModels,
	attachOriginalDatabaseModels,
} from './src/middlewares/attach-database-models';
import { PORT } from './src/constants/env';

const app = express();
app.use(
	cors({
		// origin: 'http://192.168.1.11:5173',
		origin: `http://localhost:5173`,
		credentials: true,
	})
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
	res.status(200).json({
		message: 'skibidi toilet i miss her',
	});
});
app.use(attachOriginalDatabaseModels);
app.use('/auth', authRouter);
// All routes from here requires the user to be authenticated
app.use(auth);
app.use(attachDatabaseModels);
app.use('/student', studentRouter);
app.use('/user', userRouter);
app.use('/transaction', transactionRouter);
app.use('/category', categoryRouter);
app.use('/organization', organizationRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));

export default app;
