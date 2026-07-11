import axiosInstance from './axiosInstance';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export type PaymentRequestData = {
  _id: string;
  student: { _id: string; firstname: string; lastname: string; studentID: string } | string;
  organization: { _id: string; name: string; slug: string } | string;
  category: { _id: string; name: string; fee: number } | string;
  amount: number;
  modeOfPayment: 'cash' | 'gcash';
  referenceNumber?: string;
  receiptImage?: string;
  status: PaymentRequestStatus;
  remarks?: string;
  semester: string;
  schoolYear: string;
  createdAt: string;
};

// Student APIs
export const createPaymentRequest = async (formData: FormData): Promise<PaymentRequestData> => {
  const { data } = await axiosInstance.post('/student-portal/payment-request', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
};

export const fetchStudentPaymentRequests = async (): Promise<PaymentRequestData[]> => {
  const { data } = await axiosInstance.get('/student-portal/payment-request');
  return data.data;
};

export const fetchCategoriesForOrg = async (orgSlug: string): Promise<{ _id: string; name: string; fee: number }[]> => {
  const { data } = await axiosInstance.get('/category', {
    headers: { 'x-organization-slug': orgSlug },
  });
  return data.data;
};

// Org Admin APIs
export const fetchOrgPaymentRequests = async (orgSlug: string): Promise<PaymentRequestData[]> => {
  const { data } = await axiosInstance.get('/payment-request', {
    headers: { 'x-organization-slug': orgSlug },
  });
  return data.data;
};

export const approvePaymentRequest = async (orgSlug: string, requestId: string): Promise<PaymentRequestData> => {
  const { data } = await axiosInstance.put(`/payment-request/${requestId}/approve`, {}, {
    headers: { 'x-organization-slug': orgSlug },
  });
  return data.data;
};

export const rejectPaymentRequest = async (orgSlug: string, requestId: string, remarks: string): Promise<PaymentRequestData> => {
  const { data } = await axiosInstance.put(`/payment-request/${requestId}/reject`, { remarks }, {
    headers: { 'x-organization-slug': orgSlug },
  });
  return data.data;
};
