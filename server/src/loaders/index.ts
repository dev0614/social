import { loggerDev } from '../utils/logger';
import { expressLoader } from './express';
import { Application } from 'express';
import { mongooseLoader } from './mongoose';
import { UserModel } from '../models/users';
import { IModelDI } from '../types/dependencyInjectors';
import { dependencyInjector } from './dependencyInjector';
import './events';

export const loaders = async (app: Application): Promise<void> => {
    loggerDev.info('Loaders running');
    await mongooseLoader();
    const userModel: IModelDI = {
        name: 'userModel',
        model: UserModel,
    };

    await dependencyInjector({
        models: [
            userModel, // whateverModel
        ],
    });
    loggerDev.info('Dependency Injector loaded');
    loggerDev.info('Jobs loaded');

    await expressLoader(app);
};
