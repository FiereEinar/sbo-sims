import LoginForm from '@/components/forms/LoginForm';
import AuthPage from './AuthPage';
import OrganizationList from '@/components/OrganizationList';
import { useParams } from 'react-router-dom';

export default function Login() {
	const { orgSlug } = useParams<{ orgSlug: string }>();

	return (
		<AuthPage 
			title={orgSlug ? 'Login' : 'Select Organization'} 
			form={orgSlug ? <LoginForm /> : <OrganizationList type="login" />} 
		/>
	);
}
