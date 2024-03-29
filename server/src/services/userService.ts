import { Service, Inject } from 'typedi';
import { AppEvents } from '../subscribers/event';
import { MailerService } from '../services/mailer';
import { config } from '../config';
import { IUser, IUserInput, IUserService } from '../types/user';
import {
  EventDispatcher,
  EventDispatcherInterface,
} from '../decorators/eventDispatcher';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import httpStatus from 'http-status-codes';
import createError from 'http-errors';
import { Logger } from 'winston';

/* User service */
@Service()
export class UserService implements IUserService {
  constructor(
    @Inject('userModel')
    private userModel: mongoose.Model<IUser & mongoose.Document>,
    private mailer: MailerService,
    @Inject('logger') private logger: Logger,
    @EventDispatcher()
    private eventDispatcher: EventDispatcherInterface,
  ) {}

  /* Get user from id*/
  public async getUser(id: string): Promise<IUser> {
    try {
      const user = await this.userModel.findById(id).select('-password');
      return user;
    } catch (error) {
      throw createError(httpStatus.NOT_FOUND, `User ${id} doesn't exist`);
    }
  }

  /* Login user */

  public async loginUser(userInput: IUserInput) {
    try {
      // Get user from db
      const userCheck =
        (await this.userModel.findOne({ username: userInput.username })) ||
        (await this.userModel.findOne({ email: userInput.email }));
      if (!userCheck) {
        this.logger.debug('Warning loginUser: InValid credentials');
        throw createError(httpStatus.FORBIDDEN, `Invalid  credentials`);
      }
      // Check password
      const isMatch = await bcrypt.compare(
        userInput.password,
        userCheck.password,
      );
      if (!isMatch) {
        this.logger.debug('Warning loginUser: InValid credentials');
        throw createError(httpStatus.FORBIDDEN, `Invalid  credentials`);
      }

      //Return jsonwebtoken
      const payload = {
        user: {
          id: userCheck.id,
        },
      };

      const jwtSecret = config.jwtSecret;
      try {
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '2h' });
        this.eventDispatcher.dispatch(AppEvents.user.signIn, userCheck);
        return token;
      } catch (error) {
        throw createError(
          httpStatus.FORBIDDEN,
          `loginUser: Error jsonwebtoken`,
        );
      }
    } catch (error) {
      this.logger.error(`Error loginUser: ${error}`);
      throw error;
    }
  }

  /* Register user */
  public async registerUser(userInput: IUserInput) {
    const { username, email, password } = userInput;
    try {
      let user = await this.userModel.findOne({ username });

      if (user) {
        throw createError(
          httpStatus.CONFLICT,
          `A user with username ${username} already exists`,
        );
      }
      user = await this.userModel.findOne({ email });
      if (user) {
        throw createError(
          httpStatus.CONFLICT,
          `A user with email ${email} already exists`,
        );
      }
      // Encrypting password
      const salt = await bcrypt.genSalt(10);
      const encryptPass = await bcrypt.hash(password, salt);
      const userRecord = await this.userModel.create({
        username: username,
        email: email,
        password: encryptPass,
      });

      // Return password
      const payload = {
        user: {
          id: userRecord.id,
        },
      };
      const jwtSecret = config.jwtSecret;
      try {
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '2h' });
        await this.mailer.SendWelcomeEmail(userRecord.email);
        this.eventDispatcher.dispatch(AppEvents.user.signUp, userRecord);
        this.logger.info('Success registerUser');
        return token;
      } catch (error) {
        this.logger.error(`Error registerUser: ${error}`);
        throw createError(
          httpStatus.FORBIDDEN,
          `RegisterUser: Error jsonwebtoken`,
        );
      }
    } catch (error) {
      this.logger.error(`Error registerUser: ${error}`);
      throw error;
    }
  }
}
