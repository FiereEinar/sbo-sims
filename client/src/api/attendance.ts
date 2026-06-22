import axiosInstance from './axiosInstance';
import { AttendanceRecord } from '@/types/attendance';

export const fetchSessionAttendance = async (
  sessionId: string,
): Promise<AttendanceRecord[] | undefined> => {
  try {
    const { data } = await axiosInstance.get(`/attendance/session/${sessionId}`);
    return data.data;
  } catch (err: any) {
    throw err;
  }
};

export const recordAttendance = async (
  sessionId: string,
  studentIdInput: string,
) => {
  try {
    const res = await axiosInstance.post('/attendance/record', {
      sessionId,
      studentIdInput,
    });
    return res.data;
  } catch (err: any) {
    throw err.response?.data || err;
  }
};
