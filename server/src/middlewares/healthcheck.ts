import { Request, Response } from 'express';
import { OK } from '../constants/http';
import AppSettingModel from '../models/app-setting.model';

export const healthcheck = async (req: Request, res: Response) => {
  try {
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
