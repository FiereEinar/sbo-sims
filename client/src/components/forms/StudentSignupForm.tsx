import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import InputField from '../InputField';
import { Button } from '../ui/button';
import ErrorText from '../ui/error-text';
import { useToast } from '@/hooks/use-toast';
import { signupSchema } from '@/lib/validations/signupSchema';
import { studentSignup } from '@/api/student-portal';

export type StudentSignupFormValues = z.infer<typeof signupSchema>;

export default function StudentSignupForm() {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StudentSignupFormValues>({ resolver: zodResolver(signupSchema) });

  const passwordValue = watch('password') || '';

  const onSubmit = async (data: StudentSignupFormValues) => {
    try {
      await studentSignup(data);
      toast({
        title: 'Account created!',
        description: `Please check your BukSU email (${data.studentID}@student.buksu.edu.ph) to verify your account before logging in.`,
      });
      reset();
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to create account. Please try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <InputField<StudentSignupFormValues>
          name="studentID"
          id="signupStudentID"
          label="Student ID:"
          registerFn={register}
          errors={errors}
        />
        <div className="flex justify-between gap-2">
          <InputField<StudentSignupFormValues>
            name="firstname"
            id="signupFirstname"
            label="First name:"
            registerFn={register}
            errors={errors}
          />
          <InputField<StudentSignupFormValues>
            name="lastname"
            id="signupLastname"
            label="Last name:"
            registerFn={register}
            errors={errors}
          />
        </div>
        <InputField<StudentSignupFormValues>
          name="password"
          id="signupPassword"
          label="Password:"
          type="password"
          registerFn={register}
          errors={errors}
        />

        <div className="flex justify-between gap-1 text-xs py-2 px-1">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {passwordValue.length >= 8 ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={
                  passwordValue.length >= 8
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                }
              >
                At least 8 characters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/[A-Z]/.test(passwordValue) ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={
                  /[A-Z]/.test(passwordValue)
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                }
              >
                One uppercase letter
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              {/[a-z]/.test(passwordValue) ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={
                  /[a-z]/.test(passwordValue)
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                }
              >
                One lowercase letter
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/[0-9]/.test(passwordValue) ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span
                className={
                  /[0-9]/.test(passwordValue)
                    ? 'text-emerald-500'
                    : 'text-muted-foreground'
                }
              >
                One number
              </span>
            </div>
          </div>
        </div>
        <InputField<StudentSignupFormValues>
          name="confirmPassword"
          id="signupConfirmPassword"
          label="Confirm Password:"
          type="password"
          registerFn={register}
          errors={errors}
        />
      </div>

      {errors.root?.message && <ErrorText>{errors.root.message}</ErrorText>}

      <div className="text-xs text-muted-foreground flex gap-1">
        <p>Already have an account?</p>
        <Link to="/login" className="underline">
          Log in
        </Link>
      </div>

      <div className="flex justify-end">
        <Button disabled={isSubmitting}>
          {isSubmitting ? (
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
              Creating account...
            </span>
          ) : (
            'Sign Up'
          )}
        </Button>
      </div>
    </form>
  );
}
