import mongoose from 'mongoose';
import { config } from '../config';
import { loggerDev } from '../utils/logger';
export const mongooseLoader = async () => {
  console.log(config.dbUrl)
  const db = config.dbUrl;
  try {
    const mongoConnection = await mongoose.connect(db);
    loggerDev.info('MongoDB has been connected');
    return mongoConnection.connection.db;
  } catch (err) {
    loggerDev.error(err);
    process.exit(1);
  }
};
