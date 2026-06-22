import { MongoEntity } from './mongoEntity';
import { Organization } from './organization';

export type EventSessionStatus = 'upcoming' | 'active' | 'completed' | 'paused';

export type Event = MongoEntity & {
  title: string;
  description: string;
  venue: string;
  start: Date;
  end: Date;
  organization: Organization;
  archived: boolean;
  sessionsCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type EventSession = MongoEntity & {
  organization: Organization;
  event: Event;
  name: string;
  status: EventSessionStatus;
  startedAt: Date;
  endedAt: Date;
  pausedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};
