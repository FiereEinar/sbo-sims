import { Router } from 'express';
import * as settingController from '../controllers/settingController';
import { MODULES } from '../constants/modules';
import { hasRole } from '../middlewares/authentication/role';

const settingRouter = Router();

settingRouter.get(
	'/',
	hasRole([MODULES.SETTING_READ]),
	settingController.getSettings
);
settingRouter.put(
	'/',
	hasRole([MODULES.SETTING_UPDATE]),
	settingController.updateSettings
);

export default settingRouter;
