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
import { roleSchema } from '@/lib/validations/roleSchema';
import { z } from 'zod';
import Plus from '../icons/plus';
import { Role } from '@/types/role';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ErrorText from '../ui/error-text';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import _ from 'lodash';
import { submitRoleForm, submitUpdateRoleForm } from '@/api/role';
import { useToast } from '@/hooks/use-toast';

export type RoleFormValues = z.infer<typeof roleSchema>;

type AddRoleFormProps = {
	mode?: 'edit' | 'add';
	role?: Role;
};

export function AddRoleForm({ mode = 'add', role }: AddRoleFormProps) {
	if (role === undefined && mode === 'edit') {
		throw new Error('No role data provided while role form mode is on edit');
	}

	const navigate = useNavigate();
	const { toast } = useToast();

	const {
		register,
		handleSubmit,
		setValue,
		setError,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<RoleFormValues>({
		resolver: zodResolver(roleSchema),
	});

	useEffect(() => {
		if (role) {
			setValue('name', _.startCase(role.name));
			setValue('description', role.description ?? '');
		}
	}, [role, setValue]);

	const onSubmit = async (data: RoleFormValues) => {
		try {
			if (mode === 'add') {
				const createdRole = await submitRoleForm(data);
				await queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.ROLES],
				});
				if (createdRole) navigate(`/role/${createdRole._id}`);
				toast({
					title: 'Role created successfully!',
				});
			}

			if (mode === 'edit') {
				await submitUpdateRoleForm(role?._id ?? '', data);
				await queryClient.invalidateQueries({
					queryKey: [QUERY_KEYS.ROLES],
				});
				navigate(`/role/${role?._id}`, { replace: true });
				toast({
					title: 'Role updated successfully!',
				});
			}

			reset();
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit role form',
			});
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Role</p>
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
					<DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Role</DialogTitle>
					<DialogDescription>
						Update role information. Permissions are managed inside the role
						details page.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
					<InputField<RoleFormValues>
						name='name'
						registerFn={register}
						errors={errors}
						label='Role Name:'
						id='name'
					/>

					<InputField<RoleFormValues>
						name='description'
						registerFn={register}
						errors={errors}
						label='Description (optional):'
						id='description'
					/>

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
