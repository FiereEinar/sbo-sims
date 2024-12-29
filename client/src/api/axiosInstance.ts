import { navigate } from '@/lib/navigate';
import { queryClient } from '@/main';
import axios from 'axios';

const UNAUTHORIZED = 401;

const options = {
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
		if (status === UNAUTHORIZED && data?.error === 'InvalidAccessToken') {
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

export default axiosInstance;
