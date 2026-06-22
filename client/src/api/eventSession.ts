import axiosInstance from './axiosInstance';
import { EventSession } from '@/types/event';
import { z } from 'zod';
import { eventSessionSchema } from '@/lib/validations/eventSessionSchema';

export type EventSessionFormValues = z.infer<typeof eventSessionSchema>;

export const fetchEventSessions = async (eventId: string): Promise<EventSession[] | undefined> => {
  try {
    const { data } = await axiosInstance.get(`/event-session?event=${eventId}`);
    return data.data;
  } catch (err: any) {
    throw err;
  }
};

export const submitEventSessionForm = async (
  eventId: string,
  formData: EventSessionFormValues
) => {
  try {
    const res = await axiosInstance.post('/event-session', {
      ...formData,
      event: eventId,
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

export const submitUpdateEventSessionForm = async (
  sessionId: string,
  formData: EventSessionFormValues
) => {
  try {
    const res = await axiosInstance.put(`/event-session/${sessionId}`, formData);
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};

export const requestDeleteEventSession = async (sessionId: string) => {
  try {
    const { data } = await axiosInstance.delete(`/event-session/${sessionId}`);
    return data;
  } catch (err: any) {
    throw err;
  }
};
