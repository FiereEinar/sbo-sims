import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminLogin } from '@/api/admin';
import { useUserStore } from '@/store/user';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const adminLoginSchema = z.object({
  studentID: z.string().min(1, 'Admin ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [rootError, setRootError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginForm>({ resolver: zodResolver(adminLoginSchema) });

  const onSubmit = async (data: AdminLoginForm) => {
    setRootError('');
    try {
      const result = await adminLogin(data);
      if (result?.data) {
        localStorage.setItem('accessToken', result.data.accessToken);
        setUser(result.data.user);
      }
      navigate('/admin', { replace: true });
    } catch (err: any) {
      setRootError(err.message || 'Invalid credentials');
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md bg-card/40 border-muted-foreground/15">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Super Admin Portal
            </CardTitle>
            <CardDescription>
              Restricted access — authorized personnel only
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="adminID"
                className="text-xs uppercase tracking-widest text-muted-foreground font-semibold"
              >
                Admin ID
              </Label>
              <Input
                id="adminID"
                type="text"
                autoComplete="username"
                {...register('studentID')}
                placeholder="Enter your admin ID"
                className={errors.studentID ? 'border-red-500' : ''}
              />
              {errors.studentID && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.studentID.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="adminPassword"
                className="text-xs uppercase tracking-widest text-muted-foreground font-semibold"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="Enter your password"
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 font-medium">
                  {errors.password.message}
                </p>
              )}
            </div>

            {rootError && (
              <div className="p-2 text-xs text-red-500 font-medium">
                {rootError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full font-semibold mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
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
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Access Portal
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            SBO-SIMS &mdash; Global Administration System
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
