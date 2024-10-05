import express from 'express';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
	res.json({ message: 'Hello World!' });
});

app.listen(3000, () => console.log('Server is running on PORT 3000'));

export default app;
