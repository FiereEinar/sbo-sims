import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthPage from './AuthPage';
import InputField from '@/components/InputField';
import { Button } from '@/components/ui/button';
import ErrorText from '@/components/ui/error-text';
import { resetPassword } from '@/api/user';
import { useToast } from '@/hooks/use-toast';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(30, 'Password must be max 30 characters')
      .regex(/[a-z]/, 'Password must include at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
      .regex(/[0-9]/, 'Password must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Request',
        description: 'No password reset token was provided in the URL.',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [token, navigate, toast]);

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, data.password);
      toast({
        title: 'Password Reset',
        description: 'Your password has been successfully reset. You can now log in.',
        variant: 'default',
      });
      navigate('/login');
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to reset password',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Please enter your new password below.
      </p>

      <InputField<ResetPasswordValues>
        name="password"
        id="password"
        label="New Password:"
        type="password"
        registerFn={register}
        errors={errors}
        isDisabled={isSubmitting}
      />

      <InputField<ResetPasswordValues>
        name="confirmPassword"
        id="confirmPassword"
        label="Confirm New Password:"
        type="password"
        registerFn={register}
        errors={errors}
        isDisabled={isSubmitting}
      />

      {errors.root && errors.root.message && (
        <ErrorText>{errors.root.message}</ErrorText>
      )}

      <div className="flex justify-end pt-2">
        <Button disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </Button>
      </div>
    </form>
  );
}

export default function ResetPassword() {
  return <AuthPage title="Reset Password" form={<ResetPasswordForm />} />;
}
