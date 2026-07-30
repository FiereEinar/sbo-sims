import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { Edit, PlusIcon, RefreshCw, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import InputField from '../InputField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema } from '@/lib/validations/userSchema';
import { submitUserForm, submitAdminUpdateUserForm } from '@/api/user';
import { z } from 'zod';
import { User } from '@/types/user';
import { useEffect, useState } from 'react';
import ErrorText from '../ui/error-text';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { Role } from '@/types/role';
import axiosInstance from '@/api/axiosInstance';
import RolePicker from '../role/RolePicker';
import { useToast } from '@/hooks/use-toast';

export type UserFormValues = z.infer<typeof createUserSchema>;

type AddUserFormProps = {
  mode?: 'edit' | 'add';
  user?: User;
};

export function AddUserForm({ mode = 'add', user }: AddUserFormProps) {
  if (user === undefined && mode === 'edit') {
    throw new Error('No user data provided while user form mode is on edit');
  }

  const navigate = useTenantNavigate();
  const [role, setRole] = useState<string | undefined>(
    user?.rbacRole?._id ?? undefined,
  );
  const [sendEmail, setSendEmail] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(createUserSchema),
  });

  const { data: roles } = useQuery({
    queryKey: [QUERY_KEYS.ROLES],
    queryFn: async (): Promise<Role[]> => {
      const { data } = await axiosInstance.get('/role');
      return data.data;
    },
  });

  useEffect(() => {
    if (user) {
      setValue('studentID', user.studentID);
      setValue('firstname', _.startCase(user.firstname));
      setValue('lastname', _.startCase(user.lastname));
      setValue('email', user.email);
      setValue('bio', user.bio ?? '');
    }
  }, [user, setValue]);

  const onSubmit = async (data: UserFormValues) => {
    if (role === undefined)
      return setError('rbacRole', { message: 'Role is required' });

    // Validate email is filled when send-email is checked (add mode only)
    if (mode === 'add' && sendEmail && !data.email?.length) {
      return setError('email', {
        message: 'Email is required to send welcome credentials',
      });
    }

    try {
      const formData = { ...user, ...data, rbacRole: role, sendEmail: mode === 'add' ? sendEmail : undefined };
      if (mode === 'add') await submitUserForm(formData);
      if (mode === 'edit')
        await submitAdminUpdateUserForm(user?._id ?? '', formData);

      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });

      navigate(`/user/${user?._id ?? ''}`, { replace: true });

      toast({
        title:
          mode === 'add'
            ? 'User added successfully!'
            : 'User updated successfully!',
      });
      reset();
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit user form',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex items-center gap-2 rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add User</p>
          </Button>
        ) : (
          <Button className="flex gap-2 rounded-full" size="sm" variant="ghost">
            <Edit className="size-4" />
            <p>Edit</p>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} User</DialogTitle>
          <DialogDescription>Fill up the form</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <InputField<UserFormValues>
            name="studentID"
            registerFn={register}
            errors={errors}
            label="Student ID:"
            id="studentID"
            isDisabled={mode === 'edit'}
          />

          <div className="flex gap-2">
            <InputField<UserFormValues>
              name="firstname"
              registerFn={register}
              errors={errors}
              label="Firstname:"
              id="firstname"
            />

            <InputField<UserFormValues>
              name="lastname"
              registerFn={register}
              errors={errors}
              label="Lastname:"
              id="lastname"
            />
          </div>

          <InputField<UserFormValues>
            name="email"
            registerFn={register}
            errors={errors}
            label="Email:"
            id="email"
          />

          {mode === 'add' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Password:</span>
                <button
                  type="button"
                  id="randomizeUserPassword"
                  onClick={() => {
                    const chars =
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
                    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    const lower = 'abcdefghijklmnopqrstuvwxyz';
                    const digits = '0123456789';
                    const rand = (s: string) =>
                      s[Math.floor(Math.random() * s.length)];
                    const base = [
                      rand(upper),
                      rand(lower),
                      rand(digits),
                      ...Array.from({ length: 9 }, () => rand(chars)),
                    ];
                    for (let i = base.length - 1; i > 0; i--) {
                      const j = Math.floor(Math.random() * (i + 1));
                      [base[i], base[j]] = [base[j], base[i]];
                    }
                    setValue('password', base.join(''), {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  className="flex items-center gap-1 text-xs text-violet-500 hover:text-violet-400 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Randomize
                </button>
              </label>
              <InputField<UserFormValues>
                name="password"
                type="password"
                registerFn={register}
                errors={errors}
                label=""
                id="password"
              />
            </div>
          )}

          {mode === 'add' && (
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer select-none border transition-all"
              style={{
                background: sendEmail ? 'hsl(263 70% 10%)' : undefined,
                borderColor: sendEmail ? 'hsl(263 70% 40%)' : undefined,
              }}
              onClick={() => setSendEmail((v) => !v)}
            >
              <input
                id="sendEmailUserCheckbox"
                type="checkbox"
                checked={sendEmail}
                onChange={() => setSendEmail((v) => !v)}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
              />
              <Mail className="w-4 h-4 shrink-0" style={{ color: sendEmail ? '#a78bfa' : undefined }} />
              <span className="text-sm" style={{ color: sendEmail ? '#c4b5fd' : undefined }}>
                Send welcome email with credentials
              </span>
            </div>
          )}

          {/* <InputField<UserFormValues>
						name='bio'
						registerFn={register}
						errors={errors}
						label='Bio (optional):'
						id='bio'
					/> */}

          {/* <InputField<UserFormValues>
						name='rbacRole'
						registerFn={register}
						errors={errors}
						label='RBAC Role ID:'
						id='rbacRole'
					/> */}

          {roles && (
            <RolePicker
              roles={roles}
              setRole={setRole}
              error={errors.rbacRole?.message}
              defaultValue={user?.rbacRole?._id}
            />
          )}

          {errors.root && errors.root.message && (
            <ErrorText>{errors.root.message.toString()}</ErrorText>
          )}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </div>
        </form>

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
