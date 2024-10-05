import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

import connectToDB from './src/database/mongodb';
connectToDB();

import studentRouter from './src/routes/student';
import { notFoundHandler } from './src/middlewares/not-found';
import { errorHandler } from './src/middlewares/error';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/student', studentRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => console.log('Server is running on PORT 3000'));

export default app;
