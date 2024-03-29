import 'reflect-metadata'; // We need this in order to use @Decorators
import express, { Application } from 'express';
// import { config } from 'src/config';
import { loaders } from './loaders/index';
import { loggerDev } from './utils/logger';
const startServer = async () => {
  const app: Application = express();
  await loaders(app);
  loggerDev.debug(`MODE ENV ${process.env.NODE_ENV}`);
  // app
  //   .listen(config.port, () => {
  //     loggerDev.info(`Server listening on port: ${config.port}`);
  //   })
  //   .on('error', err => {
  //     loggerDev.error(err);
  //     process.exit(1);
  //   });
};

startServer();