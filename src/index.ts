import 'reflect-metadata';
import express, { Express, Request, Response } from 'express';
import winston from 'winston';
import agentsRouter from './api/agents/agents.router';
import tagsRouter from './api/tags/tags.router';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const app: Express = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Parlant-TS!');
});

app.use('/agents', agentsRouter);
app.use('/tags', tagsRouter);

// Only listen if not in a test environment
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        logger.info(`Server is running at http://localhost:${port}`);
    });
}

export default app;
