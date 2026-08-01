import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import InputField from '../InputField';
import { Button } from '../ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ErrorText from '../ui/error-text';
import { submitLoginForm } from '@/api/user';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginSchema } from '@/lib/validations/loginSchema';
import { useUserStore } from '@/store/user';
import RecaptchaOverlay from '../RecaptchaOverlay';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const navigate = useTenantNavigate();
  const normalNavigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const setUser = useUserStore((state) => state.setUser);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [pendingData, setPendingData] = useState<LoginFormValues | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast({
        title: 'Email Verified',
        description:
          'Your email has been successfully verified. You can now log in.',
        variant: 'default',
      });
      searchParams.delete('verified');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, toast]);

  const isFormDisabled = isSubmitting || isLoggingIn;

  // Step 1: form validation passes → show reCAPTCHA overlay
  const onSubmit = async (data: LoginFormValues) => {
    if (import.meta.env.VITE_CHECK_RECPATCHA === 'false') {
      await performLogin(data, '');
    } else {
      setPendingData(data);
      setShowCaptcha(true);
    }
  };

  const performLogin = async (data: LoginFormValues, token: string) => {
    setIsLoggingIn(true);

    try {
      const result = await submitLoginForm({
        ...data,
        recaptchaToken: token,
      });

      if (result) {
        // Store access token for all devices
        localStorage.setItem('accessToken', result.data.accessToken);
        setUser(result.data.user);
      }
      navigate('/');
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit login form',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Step 2: reCAPTCHA passed → submit login with token
  const handleCaptchaVerify = async (token: string) => {
    setShowCaptcha(false);
    if (!pendingData) return;

    await performLogin(pendingData, token);
    setPendingData(null);
  };

  const handleCaptchaClose = () => {
    setShowCaptcha(false);
    setPendingData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <button
          type="button"
          onClick={() => normalNavigate('/login')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back
        </button>
        <div>
          <InputField<LoginFormValues>
            name="studentID"
            id="studentID"
            label="Student ID:"
            registerFn={register}
            errors={errors}
            isDisabled={isFormDisabled}
          />
          <InputField<LoginFormValues>
            name="password"
            id="password"
            label="Password:"
            type="password"
            registerFn={register}
            errors={errors}
            isDisabled={isFormDisabled}
          />
        </div>

        {errors.root && errors.root.message && (
          <ErrorText>{errors.root.message.toString()}</ErrorText>
        )}

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
              'Submit'
            )}
          </Button>
        </div>
      </form>

      {showCaptcha && (
        <RecaptchaOverlay
          onVerify={handleCaptchaVerify}
          onClose={handleCaptchaClose}
        />
      )}
    </>
  );
}
