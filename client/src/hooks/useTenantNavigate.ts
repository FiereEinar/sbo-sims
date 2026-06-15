import { NavigateOptions, useNavigate, useParams } from 'react-router-dom';

export function useTenantNavigate() {
	const navigate = useNavigate();
	const { orgSlug } = useParams<{ orgSlug: string }>();

	return (to: string | number, options?: NavigateOptions) => {
		if (typeof to === 'number') {
			return navigate(to);
		}

		// Don't prepend orgSlug if it's an absolute root route we want to keep
		if (to === '/') {
			return navigate(to, options);
		}

		const cleanPath = to.startsWith('/') ? to.substring(1) : to;
		
		if (orgSlug) {
			navigate(`/${orgSlug}/${cleanPath}`, options);
		} else {
			navigate(`/${cleanPath}`, options);
		}
	};
}
