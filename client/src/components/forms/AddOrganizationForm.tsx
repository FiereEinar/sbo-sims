import { zodResolver } from '@hookform/resolvers/zod';
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
	fetchOrganizationByID,
	submitOrganizationForm,
	submitUpdateOrganizationForm,
} from '@/api/organization';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { Department } from '@/types/deparment';
import DepartmentInputField from '../DepartmentInputField';
import { useQuery } from '@tanstack/react-query';
import _ from 'lodash';

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

type AddOrganizationFormProps = {
	organizationID?: string;
	mode?: 'add' | 'edit';
};

export default function AddOrganizationForm({
	organizationID,
	mode = 'add',
}: AddOrganizationFormProps) {
	if (organizationID === undefined && mode === 'edit') {
		throw new Error(
			'No organizationID provided while organization form mode is on edit'
		);
	}

	const [departments, setDepartments] = useState<Department[]>([]);

	const {
		register,
		handleSubmit,
		setError,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<OrganizationFormValues>({
		resolver: zodResolver(organizationSchema),
	});

	const { data: organizationData } = useQuery({
		queryKey: [QUERY_KEYS.ORGANIZATION, { organizationID }],
		queryFn: () => fetchOrganizationByID(organizationID ?? ''),
	});

	useEffect(() => {
		if (organizationData) {
			setValue('name', _.startCase(organizationData?.name ?? ''));
			setValue('governor', _.startCase(organizationData?.governor ?? ''));
			setValue('treasurer', _.startCase(organizationData?.treasurer ?? ''));

			const departmentsArray: Department[] = [];
			organizationData?.departments?.forEach((dep) => {
				departmentsArray.push({ id: uuidv4(), name: dep });
			});

			setDepartments(departmentsArray);
		}
	}, [organizationData, setValue, setDepartments]);

	const onSubmit = async (data: OrganizationFormValues) => {
		try {
			const departmentsArray: string[] = [];
			departments.map((dep) => departmentsArray.push(dep.name));
			data.departments = departmentsArray;

			let result;

			if (mode === 'add') result = await submitOrganizationForm(data);
			if (mode === 'edit')
				result = await submitUpdateOrganizationForm(
					organizationData?._id ?? '',
					data
				);

			await queryClient.invalidateQueries({
				queryKey: [QUERY_KEYS.ORGANIZATION],
			});
			reset();
			setDepartments([]);
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit create organization form',
			});
		}
	};

	const onDepartmentAdd = (value: string) => {
		if (value.length === 0) return;
		setDepartments((prev) => [
			...prev,
			{ name: value.toUpperCase(), id: uuidv4() },
		]);
	};

	const onDepartmentRemove = (id: string) => {
		setDepartments((prev) => prev.filter((org) => org.id !== id));
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Organization</p>
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
					<DialogTitle>
						{mode === 'add' ? 'Add' : 'Edit'} Organization
					</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form
					onKeyDown={(e) => {
						if (e.key === 'Enter') e.preventDefault();
					}}
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-2'
				>
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

					<DepartmentInputField
						onSubmit={onDepartmentAdd}
						onRemove={onDepartmentRemove}
						selectedDepartments={departments}
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
