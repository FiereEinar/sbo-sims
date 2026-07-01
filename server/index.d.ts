import { Request } from 'express';
import { IUser } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        organizationId: mongoose.Types.ObjectId;
        semester: string;
        schoolYear: string;
      };
      currentUser: IUser;
    }
  }
}
