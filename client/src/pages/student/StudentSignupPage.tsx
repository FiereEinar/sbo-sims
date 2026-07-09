import AuthPage from '../AuthPage';
import StudentSignupForm from '@/components/forms/StudentSignupForm';

export default function StudentSignupPage() {
  return <AuthPage title="Create Account" form={<StudentSignupForm />} />;
}
