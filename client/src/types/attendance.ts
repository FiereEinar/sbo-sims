import { MongoEntity } from './mongoEntity';
import { Organization } from './organization';
import { Event, EventSession } from './event';
import { Student } from './student';

export type AttendanceRecord = MongoEntity & {
  organization: Organization;
  event: Event;
  session: EventSession;
  student: Student;
  studentIdInput: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
