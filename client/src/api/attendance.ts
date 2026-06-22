import axiosInstance from './axiosInstance';
import { AttendanceRecord } from '@/types/attendance';
import { APIPaginatedResponse } from '@/types/api-response';

export const fetchSessionAttendance = async (
  sessionId: string,
  page: number = 1,
  pageSize: number = 50
): Promise<APIPaginatedResponse<AttendanceRecord[]> | undefined> => {
  try {
    const { data } = await axiosInstance.get(`/attendance/session/${sessionId}?page=${page}&pageSize=${pageSize}`);
    return data;
  } catch (err: any) {
    throw err;
  }
};

export const getAttendanceDownloadURL = (
  sessionId: string,
  type: 'pdf' | 'csv'
) => {
  return `/attendance/session/${sessionId}/download/${type}`;
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
