import { Request } from 'express';
import { IUser } from '../models/user';
import { ITransaction } from '../models/transaction';
import mongoose, { Model } from 'mongoose';
import { ICategory } from '../models/category';
import { IOrganization } from '../models/organization';
import { IStudent } from '../models/student';
import { ISession } from '../models/session';
import { IPrelisting } from './src/models/prelisting.model';
import { IRole } from './src/models/role.model';
import { IAppSetting } from './src/models/app-setting.model';
import { IEvent } from './src/models/event.model';
import { IEventSession } from './src/models/event-session.model';
import { IAttendanceRecord } from './src/models/attendance-record.model';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        organizationId: mongoose.Types.ObjectId;
        semester: string;
        schoolYear: string;
      };
      currentUser: IUser;
      UserModel: Model<IUser>;
      StudentModel: Model<IStudent>;
      TransactionModel: Model<ITransaction>;
      PrelistingModel: Model<IPrelisting>;
      CategoryModel: Model<ICategory>;
      OrganizationModel: Model<IOrganization>;
      SessionModel: Model<ISession>;
      RoleModel: Model<IRole>;
      AppSettingModel: Model<IAppSetting>;
      EventModel: Model<IEvent>;
      EventSessionModel: Model<IEventSession>;
      AttendanceRecordModel: Model<IAttendanceRecord>;
    }
  }
}
