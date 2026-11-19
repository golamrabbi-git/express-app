import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import config from './config/index.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/error.js';

const app = express();

app.use(helmet());
// Only listed origins may call the API from a browser with cookies (credentials).
// Requests without an Origin header (Postman, curl, servers) are unaffected.
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.get('/', (req, res) => res.json({ message: 'Welcome to the Express API' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
