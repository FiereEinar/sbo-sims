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
import Plus from '../icons/plus';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ErrorText from '../ui/error-text';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import _ from 'lodash';
import { useQuery } from '@tanstack/react-query';
import { Role } from '@/types/role';
import axiosInstance from '@/api/axiosInstance';
import RolePicker from '../RolePicker';
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

	const navigate = useNavigate();
	const [role, setRole] = useState<string | undefined>(
		user?.rbacRole?._id ?? undefined,
	);
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

		try {
			const formData = { ...user, ...data, rbacRole: role };
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
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add User</p>
					</Button>
				) : (
					<Button className='flex gap-1' size='sm' variant='ocean'>
						<img src='/icons/edit.svg' className='size-5' alt='' />
						<p>Edit</p>
					</Button>
				)}
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} User</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<UserFormValues>
						name='studentID'
						registerFn={register}
						errors={errors}
						label='Student ID:'
						id='studentID'
						isDisabled={mode === 'edit'}
					/>

					<div className='flex gap-2'>
						<InputField<UserFormValues>
							name='firstname'
							registerFn={register}
							errors={errors}
							label='Firstname:'
							id='firstname'
						/>

						<InputField<UserFormValues>
							name='lastname'
							registerFn={register}
							errors={errors}
							label='Lastname:'
							id='lastname'
						/>
					</div>

					<InputField<UserFormValues>
						name='email'
						registerFn={register}
						errors={errors}
						label='Email:'
						id='email'
					/>

					{mode === 'add' && (
						<InputField<UserFormValues>
							name='password'
							type='password'
							registerFn={register}
							errors={errors}
							label='Password:'
							id='password'
						/>
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

					<div className='flex justify-end'>
						<Button disabled={isSubmitting} type='submit'>
							Submit
						</Button>
					</div>
				</form>

				<DialogFooter />
			</DialogContent>
		</Dialog>
	);
}
