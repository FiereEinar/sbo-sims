import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import CustomResponse from '../types/response';
import AppSettingModel from '../models/app-setting.model';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await AppSettingModel.findOne();

  if (!settings) {
    settings = new AppSettingModel({
      activeSchoolYear: '2025',
      activeSemester: '1',
    });
    await settings.save();
  }

  res.json(
    new CustomResponse(true, settings, 'Application settings retrieved'),
  );
});

export const updateSettings = asyncHandler(
  async (req: Request, res: Response) => {
    const { activeSchoolYear, activeSemester, healthcheckMessage } = req.body;

    let settings = await AppSettingModel.findOne();

    if (!settings) {
      settings = new AppSettingModel({
        activeSchoolYear,
        activeSemester,
        healthcheckMessage,
      });
    } else {
      settings.activeSchoolYear = activeSchoolYear;
      settings.activeSemester = activeSemester;
      if (healthcheckMessage !== undefined) {
        settings.healthcheckMessage = healthcheckMessage;
      }
    }

    await settings.save();

    res.json(
      new CustomResponse(true, settings, 'Application settings updated'),
    );
  },
);
