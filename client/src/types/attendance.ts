import { MongoEntity } from './mongoEntity';
import { Organization } from './organization';
import { Event, EventSession } from './event';

export type AttendanceRecord = MongoEntity & {
  organization: Organization;
  event: Event;
  session: EventSession;
  student: {
    _id: string;
    firstname: string;
    lastname: string;
    course: string;
    year: number;
    studentID: string;
  };
  studentIdInput: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
