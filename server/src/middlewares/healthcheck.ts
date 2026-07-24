import { Request, Response } from 'express';
import { OK } from '../constants/http';
import { getDatabaseConnection } from '../database/databaseManager';
import { DB_MODEL } from '../constants';
import { AppSettingSchema } from '../models/app-setting.model';
import { DATABASE_NAME } from '../constants/env';

export const healthcheck = async (req: Request, res: Response) => {
  try {
    const originalConnection = await getDatabaseConnection(
      DATABASE_NAME,
      process.env.ME_CONFIG_MONGODB_URL as string,
    );
    const AppSettingModel = originalConnection.model(
      DB_MODEL.APPSETTING,
      AppSettingSchema,
    );
    const settings = await AppSettingModel.findOne();

    let message = 'skibidi toilet i miss her so much';
    if (settings && settings.healthcheckMessage !== undefined) {
      message = settings.healthcheckMessage;
    }

    res.status(OK).json({ message });
  } catch (e) {
    res.status(OK).json({
      message: 'skibidi toilet i miss her so much',
    });
  }
};
