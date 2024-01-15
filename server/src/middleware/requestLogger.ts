import morgan from 'morgan';
import { logger } from '../utils/logger';

/**
 * Middleware logging every API calls
 */
export const requestLogger = morgan('tiny', {
  stream: {
    write(msg: string) {
      logger.http(msg.trimEnd());
    },
  },
});

export default requestLogger;
