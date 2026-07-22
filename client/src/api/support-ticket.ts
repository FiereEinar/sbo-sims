import axiosInstance from './axiosInstance';
import adminAxiosInstance from './adminAxiosInstance';
import { APIResponse } from '@/types/api-response';

export type SupportTicket = {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  submittedBy?: {
    _id: string;
    firstname: string;
    lastname: string;
    email: string;
  };
  organization?: any;
  replies?: {
    _id: string;
    message: string;
    sender: {
      _id: string;
      firstname: string;
      lastname: string;
      email: string;
      role?: string;
    };
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
};

export const createSupportTicket = async (data: {
  title: string;
  description: string;
  type: string;
}): Promise<SupportTicket> => {
  const response = await axiosInstance.post<APIResponse<SupportTicket>>(
    '/support-ticket',
    data,
  );
  return response.data.data;
};

export const getOrgSupportTickets = async (): Promise<SupportTicket[]> => {
  const response =
    await axiosInstance.get<APIResponse<SupportTicket[]>>('/support-ticket');
  return response.data.data;
};

export const getAdminSupportTickets = async (): Promise<SupportTicket[]> => {
  const response = await adminAxiosInstance.get<APIResponse<SupportTicket[]>>(
    '/admin/support-tickets',
  );
  return response.data.data;
};

export const getOrgSupportTicket = async (id: string): Promise<SupportTicket> => {
  const response = await axiosInstance.get<APIResponse<SupportTicket>>(
    `/support-ticket/${id}`
  );
  return response.data.data;
};

export const getAdminSupportTicket = async (id: string): Promise<SupportTicket> => {
  const response = await adminAxiosInstance.get<APIResponse<SupportTicket>>(
    `/admin/support-tickets/${id}`
  );
  return response.data.data;
};

export const replyToOrgTicket = async (id: string, message: string): Promise<SupportTicket> => {
  const response = await axiosInstance.post<APIResponse<SupportTicket>>(
    `/support-ticket/${id}/reply`,
    { message }
  );
  return response.data.data;
};

export const replyToAdminTicket = async (id: string, message: string): Promise<SupportTicket> => {
  const response = await adminAxiosInstance.post<APIResponse<SupportTicket>>(
    `/admin/support-tickets/${id}/reply`,
    { message }
  );
  return response.data.data;
};

export const updateAdminSupportTicketStatus = async (
  id: string,
  status: string,
): Promise<SupportTicket> => {
  const response = await adminAxiosInstance.patch<APIResponse<SupportTicket>>(
    `/admin/support-tickets/${id}`,
    { status },
  );
  return response.data.data;
};
