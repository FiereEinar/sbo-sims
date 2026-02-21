import { useUserStore } from '@/store/user';
import Header from '../ui/header';
import InputField from '../InputField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import _ from 'lodash';
import axiosInstance from '@/api/axiosInstance';
import ErrorText from '../ui/error-text';

const resetPasswordSchema = z
	.object({
		currentPassword: z
			.string()
			.min(6, 'Current password must be at least 6 characters'),
		newPassword: z
			.string()
			.min(6, 'New password must be at least 6 characters'),
		confirmNewPassword: z
			.string()
			.min(6, 'Confirm new password must be at least 6 characters'),
	})
	.refine((data) => data.currentPassword !== data.newPassword, {
		message: 'New password must be different from current password',
		path: ['newPassword'],
	});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function UpdateUserPasswordForm() {
	const { user } = useUserStore((state) => state);
	const { toast } = useToast();

	const {
		handleSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const onSubmit = async (formData: ResetPasswordFormValues) => {
		if (user === null) {
			toast({
				variant: 'destructive',
				title: 'No user found',
				description: 'Login first to proceed',
			});
			return;
		}

		try {
			await axiosInstance.patch(`/user/${user._id}/password`, formData);

			toast({
				title: 'Password updated successfully',
			});
		} catch (error: any) {
			console.error('Error updating password: ', error);
			toast({
				variant: 'destructive',
				title: 'Error updating password',
				description: error.message ?? 'An unknown error occurred',
			});
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='bg-card/40 border rounded-lg p-4 space-y-4'
		>
			<div>
				<Header size='sm'>Reset Password</Header>
				<p className='text-sm text-muted-foreground'>
					Update your password associated with this account.
				</p>
			</div>

			<div className='grid gap-3 sm:grid-cols-2'>
				<InputField<ResetPasswordFormValues>
					id='currentPassword'
					label='Current Password:'
					name='currentPassword'
					type='password'
					registerFn={register}
					errors={errors}
				/>
				<InputField<ResetPasswordFormValues>
					id='newPassword'
					label='New Password:'
					name='newPassword'
					type='password'
					registerFn={register}
					errors={errors}
				/>
				<InputField<ResetPasswordFormValues>
					id='confirmNewPassword'
					label='Confirm New Password:'
					name='confirmNewPassword'
					type='password'
					registerFn={register}
					errors={errors}
				/>
			</div>

			{errors.root?.message && <ErrorText>{errors.root.message}</ErrorText>}

			<div className='flex justify-end pt-2'>
				<Button disabled={isSubmitting} size='sm'>
					Save Profile Changes
				</Button>
			</div>
		</form>
	);
}
