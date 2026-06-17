import SignupForm from '@/components/forms/SignupForm';
import AuthPage from './AuthPage';
import OrganizationList from '@/components/OrganizationList';
import { useParams } from 'react-router-dom';

export default function Signup() {
	const { orgSlug } = useParams<{ orgSlug: string }>();

	return (
		<AuthPage 
			title={orgSlug ? 'Signup' : 'Select Organization'} 
			form={orgSlug ? <SignupForm /> : <OrganizationList type="signup" />} 
		/>
	);
}
