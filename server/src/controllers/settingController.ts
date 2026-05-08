import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import CustomResponse from '../types/response';

export const getSettings = asyncHandler(async (req: Request, res: Response) => {
	let settings = await req.AppSettingModel.findOne();
	
	if (!settings) {
		settings = new req.AppSettingModel({
			activeSchoolYear: '2025',
			activeSemester: '1',
		});
		await settings.save();
	}

	res.json(new CustomResponse(true, settings, 'Application settings retrieved'));
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
	const { activeSchoolYear, activeSemester } = req.body;

	let settings = await req.AppSettingModel.findOne();
	
	if (!settings) {
		settings = new req.AppSettingModel({
			activeSchoolYear,
			activeSemester,
		});
	} else {
		settings.activeSchoolYear = activeSchoolYear;
		settings.activeSemester = activeSemester;
	}

	await settings.save();

	res.json(new CustomResponse(true, settings, 'Application settings updated'));
});
