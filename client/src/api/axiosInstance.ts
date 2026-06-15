import { navigate } from '@/lib/navigate';
import { queryClient } from '@/main';
import axios, { CreateAxiosDefaults } from 'axios';
import { useUserStore } from '@/store/user';

const UNAUTHORIZED = 401;

const options: CreateAxiosDefaults = {
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
};

const axiosInstance = axios.create(options);

// create a separate client for refreshing the access token
// to avoid infinite loops with the error interceptor
const TokenRefreshClient = axios.create(options);

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const { config, response } = error;
		const { status, data } = response || {};

		// try to refresh the access token behind the scenes
		if (status === UNAUTHORIZED && data?.errorCode === 'InvalidAccessToken') {
			try {
				// refresh the access token, then retry the original request
				await TokenRefreshClient.get('/auth/refresh');
				return TokenRefreshClient(config);
			} catch (error) {
				// handle refresh errors by clearing the query cache & redirecting to login
				queryClient.clear();
				navigate('/login', {
					state: {
						redirectUrl: window.location.pathname,
					},
				});
			}
		}

		return Promise.reject({ status, ...data });
	}
);

// attach the access token to the request headers
axiosInstance.interceptors.request.use((config) => {
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

	const pathSegments = window.location.pathname.split('/').filter(Boolean);
	const firstSegment = pathSegments[0];
	if (firstSegment && !['login', 'signup'].includes(firstSegment)) {
		config.headers['x-organization-slug'] = firstSegment;
	}
	return config;
});

export default axiosInstance;
