import { navigate } from '@/lib/navigate';
import { queryClient } from '@/main';
import axios, { CreateAxiosDefaults } from 'axios';
import { useUserStore } from '@/store/user';
import { toast } from '@/hooks/use-toast';

const UNAUTHORIZED = 401;
const TOO_MANY_REQUESTS = 429;

const options: CreateAxiosDefaults = {
  baseURL: import.meta.env.VITE_CLOUD_API_URL || import.meta.env.VITE_API_URL,
  withCredentials: true,
};

const studentAxiosInstance = axios.create(options);

// Create a separate client for refreshing the access token
const StudentTokenRefreshClient = axios.create(options);

studentAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const { status, data } = response || {};

    if (status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken') {
      try {
        await StudentTokenRefreshClient.get('/auth/refresh');
        return StudentTokenRefreshClient(config);
      } catch (refreshErr) {
        queryClient.clear();
        let currentPath = window.location.pathname;
        if (window.location.hash) {
          currentPath = window.location.hash.replace(/^#/, '');
        }
        navigate('/login', {
          state: {
            redirectUrl: currentPath,
          },
        });
      }
    }

    if (status === TOO_MANY_REQUESTS) {
      toast({
        variant: 'destructive',
        title: 'Too many requests',
        description:
          "You're sending requests too quickly. Please wait a moment before trying again.",
      });
    }

    return Promise.reject({ status, ...data });
  },
);

studentAxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const user = useUserStore.getState().user;
  if (user) {
    if (user.activeSemDB) {
      config.headers['x-active-sem'] = user.activeSemDB;
    }
    if (user.activeSchoolYearDB) {
      config.headers['x-active-school-year'] = user.activeSchoolYearDB;
    }
  }

  // Notice: students do NOT inject x-organization-slug
  return config;
});

export default studentAxiosInstance;
