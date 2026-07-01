import { Pencil, PlusIcon } from 'lucide-react';
import { submitCategoryForm, submitUpdateCategoryForm } from '@/api/category';
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
import ErrorText from '../ui/error-text';
import { useEffect, useState } from 'react';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
import { Category } from '@/types/category';
import ArrayInputField from '../ArrayInputField';

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
      'No category data provided while category form mode is on edit',
    );
  }

  const [details, setDetails] = useState<string[]>([]);

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
    if (category) {
      setValue('fee', category.fee?.toString() ?? '');
      setValue('name', category.name ?? '');
      setDetails(category.details ?? []);
    }
  }, [category, setValue]);

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      data.details = details;

      if (mode === 'add') await submitCategoryForm(data);
      if (mode === 'edit')
        await submitUpdateCategoryForm(category?._id ?? '', data);

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CATEGORY_WITH_TRANSACTIONS],
      });
      reset();
      setDetails([]);
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit category form',
      });
    }
  };

  const onDetailAdd = (value: string) => {
    if (value.length === 0 || details.includes(value)) return;
    setDetails((prev) => [...prev, value]);
  };

  const onDetailRemove = (value: string) => {
    setDetails((prev) => prev.filter((detail) => detail !== value));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex gap-2 items-center rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add Category</p>
          </Button>
        ) : (
          <Button className="flex gap-2 rounded-full" size="sm" variant="ghost">
            <Pencil className="size-4" />
            <p>Edit</p>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Category</DialogTitle>
          <DialogDescription>Fill up the form</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <InputField<CategoryFormValues>
            name="name"
            registerFn={register}
            errors={errors}
            label="Category name:"
            id="name"
          />

          <InputField<CategoryFormValues>
            name="fee"
            registerFn={register}
            errors={errors}
            label="Category fee:"
            id="fee"
          />

          <ArrayInputField
            label="Details:"
            placeholder="Add details"
            values={details}
            onSubmit={onDetailAdd}
            onRemove={onDetailRemove}
          />

          {errors.root && errors.root.message && (
            <ErrorText>{errors.root.message.toString()}</ErrorText>
          )}

          <div className="flex justify-end">
            <Button disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </div>
        </form>

        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
