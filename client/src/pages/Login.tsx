import LoginForm from '@/components/forms/LoginForm';
import AuthPage from './AuthPage';

export default function Login() {
	return <AuthPage title='Login' form={<LoginForm />} />;
}
