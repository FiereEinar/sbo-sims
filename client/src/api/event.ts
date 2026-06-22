import { Event } from '@/types/event';
import axiosInstance from './axiosInstance';
import { EventFormValues } from '@/components/forms/AddEventForm';

export const fetchEvents = async (): Promise<Event[] | undefined> => {
  try {
    const { data } = await axiosInstance.get('/event');
    return data.data;
  } catch (err: any) {
    throw err;
  }
};

export const submitEventForm = async (data: EventFormValues) => {
  try {
    const res = await axiosInstance.post('/event', data);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};
