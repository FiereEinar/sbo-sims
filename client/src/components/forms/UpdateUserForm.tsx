import { useUserStore } from '@/store/user';
import Header from '../ui/header';
import InputField from '../InputField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserSchema } from '@/lib/validations/userSchema';
import { z } from 'zod';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import _ from 'lodash';
import axiosInstance from '@/api/axiosInstance';
import { APIResponse } from '@/types/api-response';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import ErrorText from '../ui/error-text';

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;

export default function UpdateUserForm() {
	const navigate = useNavigate();
	const { toast } = useToast();
	const { user, setUser } = useUserStore((state) => state);

	const {
		register,
		handleSubmit,
		formState: { isSubmitting, errors },
	} = useForm<UpdateUserFormValues>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			studentID: user?.studentID ?? '',
			firstname: _.startCase(user?.firstname ?? ''),
			lastname: _.startCase(user?.lastname ?? ''),
			email: user?.email ?? '',
			bio: user?.bio ?? '',
		},
	});

	const onSubmit = async (data: UpdateUserFormValues) => {
		try {
			if (user === null) {
				toast({
					variant: 'destructive',
					title: 'No user found',
					description: 'Login first to proceed',
				});
				navigate('/login');
				return;
			}

			const formData = data as UpdateUserFormValues & {
				activeSchoolYearDB: string;
				activeSemDB: string;
			};

			formData.activeSchoolYearDB = user.activeSchoolYearDB;
			formData.activeSemDB = user.activeSemDB;

			const { data: result } = await axiosInstance.put<APIResponse<User>>(
				`/user/${user._id}`,
				formData
			);

			toast({
				title: 'Changes saved successfully!',
			});
			setUser(result.data);
		} catch (err: any) {
			toast({
				variant: 'destructive',
				title: 'Failed to save your changes',
				description:
					err.message ||
					'A network problem has occured while trying to save your changes',
			});
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='flex flex-col gap-3 w-full'
		>
			<Header>User Settings</Header>
			<p>
				Update your personal information here, make sure to click save changes
				when you're done!
			</p>
			<div className='space-x-1'>
				<InputField<UpdateUserFormValues>
					id='studentID'
					label='Student ID:'
					name='studentID'
					registerFn={register}
					errors={errors}
				/>
				<InputField<UpdateUserFormValues>
					id='firstname'
					label='Firstname:'
					name='firstname'
					registerFn={register}
					errors={errors}
				/>
				<InputField<UpdateUserFormValues>
					id='lastname'
					label='Lastname:'
					name='lastname'
					registerFn={register}
					errors={errors}
				/>
				<InputField<UpdateUserFormValues>
					id='email'
					label='Email:'
					name='email'
					registerFn={register}
					errors={errors}
				/>
				<InputField<UpdateUserFormValues>
					id='bio'
					label='Bio:'
					name='bio'
					registerFn={register}
					errors={errors}
				/>
			</div>

			{errors.root && errors.root.message && (
				<ErrorText>{errors.root.message.toString()}</ErrorText>
			)}

			<div className='flex justify-end'>
				<Button disabled={isSubmitting} size='sm'>
					Save Changes
				</Button>
			</div>
		</form>
	);
}
