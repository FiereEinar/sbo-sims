import { Event } from '@/types/event';
import axiosInstance from './axiosInstance';

export const fetchEvents = async (): Promise<Event[] | undefined> => {
  try {
    const { data } = await axiosInstance.get('/event');
    return data.data;
  } catch (err: any) {
    throw err;
  }
};
