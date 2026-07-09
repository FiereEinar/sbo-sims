import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import InputField from '../InputField';
import { Button } from '../ui/button';
import ErrorText from '../ui/error-text';
import RecaptchaOverlay from '../RecaptchaOverlay';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/user';
import { loginSchema } from '@/lib/validations/loginSchema';
import { studentLogin } from '@/api/student-portal';

export type StudentLoginFormValues = z.infer<typeof loginSchema>;

export default function StudentLoginForm() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const setUser = useUserStore((state) => state.setUser);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingData, setPendingData] = useState<StudentLoginFormValues | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentLoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast({
        title: 'Email Verified',
        description: 'Your email has been successfully verified. You can now log in.',
        variant: 'default',
      });
      searchParams.delete('verified');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast]);

  const isFormDisabled = isSubmitting || isLoggingIn;

  const onSubmit = (data: StudentLoginFormValues) => {
    setPendingData(data);
    setShowCaptcha(true);
  };

  const handleCaptchaVerify = async (token: string) => {
    setShowCaptcha(false);
    if (!pendingData) return;
    setIsLoggingIn(true);
    try {
      const result = await studentLogin({ ...pendingData, recaptchaToken: token });
      if (result) {
        localStorage.setItem('accessToken', result.data.accessToken);
        setUser(result.data.user);
      }
      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      setError('root', { message: err.message || 'Failed to login. Please try again.' });
    } finally {
      setPendingData(null);
      setIsLoggingIn(false);
    }
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
    setPendingData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <InputField<StudentLoginFormValues>
            name="studentID"
            id="studentLoginID"
            label="Student ID:"
            registerFn={register}
            errors={errors}
            isDisabled={isFormDisabled}
          />
          <InputField<StudentLoginFormValues>
            name="password"
            id="studentLoginPassword"
            label="Password:"
            type="password"
            registerFn={register}
            errors={errors}
            isDisabled={isFormDisabled}
          />
        </div>

        {errors.root?.message && <ErrorText>{errors.root.message}</ErrorText>}

        <div className="text-xs text-muted-foreground flex gap-1">
          <p>Don't have an account?</p>
          <Link to="/signup" className="underline">
            Sign up
          </Link>
        </div>

        <div className="flex justify-end">
          <Button disabled={isFormDisabled}>
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin size-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Logging in...
              </span>
            ) : (
              'Log In'
            )}
          </Button>
        </div>
      </form>

      {showCaptcha && (
        <RecaptchaOverlay onVerify={handleCaptchaVerify} onClose={handleCaptchaClose} />
      )}
    </>
  );
}
