import axiosInstance from '@/api/axiosInstance';

export interface Gpoa {
  _id: string;
  name: string;
  description?: string;
  targetDate: string;
  venue: string;
  budget: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  organization: string;
  semester: string;
  schoolYear: string;
  createdAt: string;
  updatedAt: string;
}

export const gpoaService = {
  create: async (
    data: Omit<
      Gpoa,
      | '_id'
      | 'organization'
      | 'semester'
      | 'schoolYear'
      | 'createdAt'
      | 'updatedAt'
    >,
  ) => {
    const response = await axiosInstance.post('/gpoa', data);
    return response.data;
  },

  getAll: async () => {
    const response = await axiosInstance.get<{ data: Gpoa[] }>('/gpoa');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await axiosInstance.get<{ data: Gpoa }>(`/gpoa/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Gpoa>) => {
    const response = await axiosInstance.put(`/gpoa/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await axiosInstance.delete(`/gpoa/${id}`);
    return response.data;
  },
};
