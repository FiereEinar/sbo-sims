import { Pencil } from 'lucide-react';
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
import { Controller, useForm } from 'react-hook-form';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
		control,
		formState: { errors, isSubmitting },
	} = useForm<RoleFormValues>({
		resolver: zodResolver(roleSchema),
	});

	useEffect(() => {
		if (role) {
			setValue('name', _.startCase(role.name));
			setValue('description', role.description ?? '');
			setValue('isDefault', role.isDefault ?? false);
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
					<Button className='flex gap-1' size='sm' variant='outline'>
						<Pencil className='size-4' />
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

					<Controller
						control={control}
						name='isDefault'
						render={({ field }) => (
							<div className='flex items-center space-x-2 mt-2'>
								<Checkbox
									id='isDefault'
									checked={field.value}
									onCheckedChange={field.onChange}
									disabled={mode === 'edit' && role?.isDefault}
								/>
								<Label
									htmlFor='isDefault'
									className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
								>
									Set as Default Role
								</Label>
							</div>
						)}
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
