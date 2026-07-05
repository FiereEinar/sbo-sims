import { Pencil, PlusIcon } from 'lucide-react';
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
import { organizationSchema } from '@/lib/validations/organizationSchema';
import {
  fetchOrganizationByID,
  submitOrganizationForm,
  submitUpdateOrganizationForm,
} from '@/api/organization';
import { useEffect } from 'react';
import { queryClient } from '@/main';
import { QUERY_KEYS } from '@/constants';
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
      'No organizationID provided while organization form mode is on edit',
    );
  }

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
      setValue('slug', organizationData?.slug ?? '');
      setValue('governor', _.startCase(organizationData?.governor ?? ''));
      setValue(
        'viceGovernor',
        _.startCase(organizationData?.viceGovernor ?? ''),
      );
      setValue('treasurer', _.startCase(organizationData?.treasurer ?? ''));
      setValue('auditor', _.startCase(organizationData?.auditor ?? ''));
    }
  }, [organizationData, setValue]);

  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      if (mode === 'add') await submitOrganizationForm(data);
      if (mode === 'edit') {
        await submitUpdateOrganizationForm(organizationData?._id ?? '', data);
        if (organizationData?.slug && organizationData.slug !== data.slug) {
          window.location.href = `/${data.slug}/organization`;
          return;
        }
      }

      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ORGANIZATION],
      });
      reset();
    } catch (err: any) {
      setError('root', {
        message: err.message || 'Failed to submit create organization form',
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {mode === 'add' ? (
          <Button className="flex items-center gap-2 rounded-full" size="sm">
            <PlusIcon className="size-4" />
            <p>Add Organization</p>
          </Button>
        ) : (
          <Button
            className="flex items-center gap-2 rounded-full"
            size="sm"
            variant="ghost"
          >
            <Pencil className="size-4" />
            <p>Edit</p>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
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
          className="space-y-2"
        >
          <InputField<OrganizationFormValues>
            name="name"
            registerFn={register}
            errors={errors}
            label="Organization name:"
            id="name"
          />

          <InputField<OrganizationFormValues>
            name="slug"
            registerFn={register}
            errors={errors}
            label="Organization URL Slug:"
            id="slug"
          />
          {mode === 'edit' && (
            <p className="text-xs text-destructive -mt-1 font-medium leading-tight">
              Warning: Changing the slug will alter your organization's login
              URL and break any bookmarked links.
            </p>
          )}

          <InputField<OrganizationFormValues>
            name="governor"
            registerFn={register}
            errors={errors}
            label="Current Governor for this Organization:"
            id="governor"
          />

          <InputField<OrganizationFormValues>
            name="viceGovernor"
            registerFn={register}
            errors={errors}
            label="Current Vice Governor for this Organization:"
            id="viceGovernor"
          />

          <InputField<OrganizationFormValues>
            name="treasurer"
            registerFn={register}
            errors={errors}
            label="Current Treasurer for this Organization:"
            id="treasurer"
          />

          <InputField<OrganizationFormValues>
            name="auditor"
            registerFn={register}
            errors={errors}
            label="Current Auditor for this Organization:"
            id="auditor"
          />

          {errors.root && errors.root.message && (
            <ErrorText>{errors.root.message.toString()}</ErrorText>
          )}

          <div className="flex justify-end">
            <Button className="" disabled={isSubmitting} type="submit">
              Submit
            </Button>
          </div>
        </form>

        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
