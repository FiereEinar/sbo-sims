import SignupForm from '@/components/forms/SignupForm';
import AuthPage from './AuthPage';

export default function Signup() {
	return <AuthPage title='Signup' form={<SignupForm />} />;
}
