import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import AuthPage from './AuthPage';
import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import ErrorText from '@/components/ui/error-text';
import { forgotPassword } from '@/api/user';
import { ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(data.email);
      setIsSuccess(true);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to send reset link',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          If an account exists with that email address, a password reset link has been sent. Please check your inbox (and spam folder) for the email.
        </p>
        <div className="flex justify-start">
          <Button type="button" onClick={() => navigate('/login')}>
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back
      </button>

      <p className="text-muted-foreground text-sm">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <InputField<ForgotPasswordValues>
        name="email"
        id="email"
        label="Email Address:"
        registerFn={register}
        errors={errors}
        isDisabled={isSubmitting}
      />

      {errors.root && errors.root.message && (
        <ErrorText>{errors.root.message}</ErrorText>
      )}

      <div className="flex justify-end">
        <Button disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </div>
    </form>
  );
}

export default function ForgotPassword() {
  return <AuthPage title="Forgot Password" form={<ForgotPasswordForm />} />;
}
