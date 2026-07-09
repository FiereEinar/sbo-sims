import LoginForm from '@/components/forms/LoginForm';
import AuthPage from './AuthPage';

/**
 * Officer login page — only accessible via /:orgSlug/login.
 * The org context is injected automatically via the x-organization-slug header
 * based on the URL path.
 */
export default function Login() {
  return <AuthPage title="Officer Login" form={<LoginForm />} />;
}
