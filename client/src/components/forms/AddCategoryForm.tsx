import {
	fetchCategoryAndTransactions,
	submitCategoryForm,
	submitUpdateCategoryForm,
} from '@/api/category';
import { categorySchema } from '@/lib/validations/categorySchema';
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
import OrganizationPicker from '../OrganizationPicker';
import { useEffect, useState } from 'react';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { fetchAllOrganizations } from '@/api/organization';
import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types/category';
import { useToast } from '@/hooks/use-toast';

export type CategoryFormValues = z.infer<typeof categorySchema>;

type AddCategoryFormProps = {
	mode?: 'add' | 'edit';
	category?: Category;
};

export default function AddCategoryForm({
	category,
	mode = 'add',
}: AddCategoryFormProps) {
	if (category === undefined && mode === 'edit') {
		throw new Error(
			'No category data provided while category form mode is on edit'
		);
	}

	const { toast } = useToast();
	const [org, setOrg] = useState<string>();

	const { data: organizations, error: organizationError } = useQuery({
		queryKey: [QUERY_KEYS.ORGANIZATION],
		queryFn: fetchAllOrganizations,
	});

	const { data: categoryData } = useQuery({
		queryKey: [QUERY_KEYS.CATEGORY, { categoryID: category?._id }],
		queryFn: () => fetchCategoryAndTransactions(category?._id ?? ''),
	});

	const {
		register,
		handleSubmit,
		setError,
		setValue,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CategoryFormValues>({
		resolver: zodResolver(categorySchema),
	});

	useEffect(() => {
		if (categoryData) {
			setValue('fee', categoryData.category?.fee?.toString() ?? '');
			setValue('name', categoryData.category?.name ?? '');
			setOrg(categoryData.category?.organization?._id ?? '');
		}
	}, [categoryData, setValue, setOrg]);

	const onSubmit = async (data: CategoryFormValues) => {
		try {
			if (!org) {
				setError('organizationID', { message: 'Select an organization' });
				return;
			}

			data.organizationID = org;

			let result;

			if (mode === 'add') result = await submitCategoryForm(data);
			if (mode === 'edit')
				result = await submitUpdateCategoryForm(category?._id ?? '', data);

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

			await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CATEGORY] });
			reset();
			setOrg('');
		} catch (err: any) {
			setError('root', { message: 'Failed to submit category form' });
		}
	};

	if (organizationError) {
		toast({
			variant: 'destructive',
			title: 'Failed to fetch organizations',
		});
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				{mode === 'add' ? (
					<Button className='flex justify-center gap-1' size='sm'>
						<Plus />
						<p>Add Category</p>
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
					<DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Category</DialogTitle>
					<DialogDescription>Fill up the form</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className='space-y-2'>
					<InputField<CategoryFormValues>
						name='name'
						registerFn={register}
						errors={errors}
						label='Category name:'
						id='name'
					/>

					<InputField<CategoryFormValues>
						name='fee'
						registerFn={register}
						errors={errors}
						label='Category fee:'
						id='fee'
					/>

					<OrganizationPicker
						defaultValue={category?.organization._id ?? ''}
						setOrg={setOrg}
						organizations={organizations ?? []}
						error={errors.organizationID?.message}
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

				<DialogFooter></DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
