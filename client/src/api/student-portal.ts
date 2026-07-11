import axiosInstance from './axiosInstance';
import { APIResponse } from '@/types/api-response';
import { User } from '@/types/user';

type DeviceTypes = 'desktop' | 'mobile' | 'tablet';

export type StudentLoginPayload = {
  studentID: string;
  password: string;
  recaptchaToken: string;
};

export type StudentSignupPayload = {
  studentID: string;
  firstname: string;
  lastname: string;
  password: string;
  confirmPassword: string;
};

export type StudentDashboardData = {
  totalPaid: number;
  totalTransactions: number;
  totalAttended: number;
  activeOrgs: number;
  enrolledOrgs: { _id: string; name: string; slug: string }[];
  recentTransactions: {
    _id: string;
    amount: number;
    modeOfPayment: string;
    createdAt: string;
    semester: string;
    schoolYear: string;
    category: { name: string };
    organization: { name: string; slug: string };
  }[];
  recentAttendance: {
    _id: string;
    recordedAt: string;
    event: { name: string };
    session: { name: string };
    organization: { name: string; slug: string };
  }[];
};

export const studentLogin = async (
  payload: StudentLoginPayload,
): Promise<APIResponse<{ user: User; accessToken: string; device: DeviceTypes }> | undefined> => {
  const { data } = await axiosInstance.post('/student-portal/login', payload);
  return data;
};

export const studentSignup = async (
  payload: StudentSignupPayload,
): Promise<APIResponse<User> | undefined> => {
  const { data } = await axiosInstance.post('/student-portal/signup', payload);
  return data;
};

export const fetchStudentDashboard = async (): Promise<StudentDashboardData> => {
  const { data } = await axiosInstance.get('/student-portal/dashboard');
  return data.data;
};
