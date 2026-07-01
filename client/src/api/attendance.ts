import axiosInstance from './axiosInstance';
import { AttendanceRecord } from '@/types/attendance';
import { APIPaginatedResponse } from '@/types/api-response';

export type AttendanceFilterValues = {
  course?: string;
  year?: string;
  gender?: string;
  search?: string;
  sortBy?: 'asc' | 'desc';
};

export const fetchSessionAttendance = async (
  sessionId: string,
  page: number = 1,
  pageSize: number = 50,
  filters: AttendanceFilterValues = {},
): Promise<APIPaginatedResponse<AttendanceRecord[]> | undefined> => {
  try {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (filters.course && filters.course !== 'All') params.set('course', filters.course);
    if (filters.year && filters.year !== 'All') params.set('year', filters.year);
    if (filters.gender && filters.gender !== 'All') params.set('gender', filters.gender);
    if (filters.search) params.set('search', filters.search);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);

    const { data } = await axiosInstance.get(`/attendance/session/${sessionId}?${params.toString()}`);
    return data;
  } catch (err: any) {
    throw err;
  }
};

export const getAttendanceDownloadURL = (
  sessionId: string,
  type: 'pdf' | 'csv',
  filters: AttendanceFilterValues = {},
) => {
  const params = new URLSearchParams();
  if (filters.course && filters.course !== 'All') params.set('course', filters.course);
  if (filters.year && filters.year !== 'All') params.set('year', filters.year);
  if (filters.gender && filters.gender !== 'All') params.set('gender', filters.gender);
  if (filters.search) params.set('search', filters.search);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);

  const qs = params.toString();
  return `/attendance/session/${sessionId}/download/${type}${qs ? `?${qs}` : ''}`;
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

export type AttendanceStats = {
  total: number;
  byGender: { _id: string; count: number }[];
  byCourse: { _id: string; count: number }[];
  byYear: { _id: number; count: number }[];
};

export const fetchSessionAttendanceStats = async (
  sessionId: string,
): Promise<AttendanceStats> => {
  const { data } = await axiosInstance.get(
    `/attendance/session/${sessionId}/stats`,
  );
  return data.data;
};
