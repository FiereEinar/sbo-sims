/**
 * Separate Axios instance for the Super Admin portal.
 * Does NOT inject x-organization-slug headers.
 * On 401, redirects to /admin/login.
 */
import { navigate } from '@/lib/navigate';
import { queryClient } from '@/main';
import axios, { CreateAxiosDefaults } from 'axios';

const UNAUTHORIZED = 401;

const options: CreateAxiosDefaults = {
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
};

const adminAxiosInstance = axios.create(options);

// Separate refresh client to avoid infinite loops
const AdminTokenRefreshClient = axios.create(options);

adminAxiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { config, response } = error;
		const { status, data } = response || {};

		if (status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken') {
			try {
				await AdminTokenRefreshClient.get('/auth/refresh');
				return AdminTokenRefreshClient(config);
			} catch {
				queryClient.clear();
				navigate('/admin/login', {
					state: { redirectUrl: window.location.pathname },
				});
			}
		}

		return Promise.reject({ status, ...data });
	},
);

adminAxiosInstance.interceptors.request.use((config) => {
	const token = localStorage.getItem('accessToken');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	// Intentionally NOT setting x-organization-slug
	return config;
});

export default adminAxiosInstance;
