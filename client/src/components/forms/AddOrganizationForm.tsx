import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import InputField from '../InputField';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import Plus from '../icons/plus';
import ErrorText from '../ui/error-text';
import { organizationSchema } from '@/lib/validations/organizationSchema';
import {
	fetchAllOrganizations,
	submitOrganizationForm,
} from '@/api/organization';

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

export default function AddOrganizationForm() {
	const { refetch } = useQuery({
		queryKey: ['organizations'],
		queryFn: fetchAllOrganizations,
	});

	const {
		register,
		handleSubmit,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<OrganizationFormValues>({
		resolver: zodResolver(organizationSchema),
	});

	const onSubmit = async (data: OrganizationFormValues) => {
		try {
			const result = await submitOrganizationForm(data);

			if (!result) {
				setError('root', {
					message: 'Something went wrong while trying to submit your form',
				});
				return;
			}

			if (!result.success) {
				setError('root', {
					message: `${result.message}\n${result.error ?? ''}`,
				});
				return;
			}

			refetch();
			reset();
		} catch (err: any) {
			setError('root', {
				message: 'Failed to submit create organization form',
			});
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button className='flex justify-center gap-1' size='sm'>
					<Plus />
					<p>Add Organization</p>
				</Button>
			</DialogTrigger>

			<DialogContent className='sm:max-w-[425px]'>
				<DialogHeader>
					<DialogTitle>Add Organization</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<OrganizationFormValues>
						name='name'
						registerFn={register}
						errors={errors}
						label='Organization name:'
						id='name'
					/>

					<InputField<OrganizationFormValues>
						name='governor'
						registerFn={register}
						errors={errors}
						label='Current Governor for this Organization:'
						id='governor'
					/>

					<InputField<OrganizationFormValues>
						name='treasurer'
						registerFn={register}
						errors={errors}
						label='Current Treasurer for this Organization:'
						id='treasurer'
					/>

					{errors.root && errors.root.message && (
						<ErrorText>{errors.root.message.toString()}</ErrorText>
					)}

					<div className='flex justify-end'>
						<Button className='' disabled={isSubmitting} type='submit'>
							Submit
						</Button>
					</div>
				</form>

				<DialogFooter></DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
