import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RefreshCw, Mail, Eye, EyeOff } from 'lucide-react';
import { AdminOrgWithStats, adminCreateOrg, adminUpdateOrg } from '@/api/admin';
import { organizationSchema } from '@/lib/validations/organizationSchema';
import _ from 'lodash';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const editOrgSchema = organizationSchema;

const addOrgSchema = organizationSchema.extend({
  adminStudentID: z
    .string()
    .length(10, 'Admin Student ID must be exactly 10 characters'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  adminFirstname: z.string().min(1, 'First name is required').max(50),
  adminLastname: z.string().min(1, 'Last name is required').max(50),
  adminEmail: z
    .string()
    .email('Must be a valid email')
    .optional()
    .or(z.literal('')),
});

type AddOrgFormValues = z.infer<typeof addOrgSchema>;

/** Generates a secure random 12-char password satisfying strength requirements */
function generateRandomPassword(): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const all = upper + lower + digits + '!@#$%&*';
  const rand = (s: string) => s[Math.floor(Math.random() * s.length)];
  const base = [
    rand(upper),
    rand(upper),
    rand(lower),
    rand(lower),
    rand(digits),
    rand(digits),
    ...Array.from({ length: 6 }, () => rand(all)),
  ];
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.join('');
}

export default function OrgFormModal({
  mode,
  org,
  allOrgs,
  onClose,
  onSuccess,
}: {
  mode: 'add' | 'edit';
  org?: AdminOrgWithStats;
  allOrgs: AdminOrgWithStats[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rootError, setRootError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);

  const schema = mode === 'add' ? addOrgSchema : editOrgSchema;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddOrgFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: org?.name ?? '',
      slug: org?.slug ?? '',
      governor: _.startCase(org?.governor ?? ''),
      viceGovernor: _.startCase(org?.viceGovernor ?? ''),
      treasurer: _.startCase(org?.treasurer ?? ''),
      auditor: _.startCase(org?.auditor ?? ''),
      syncSources: org?.syncSources ?? [],
    },
  });

  const selectedSyncSources = watch('syncSources') || [];

  const onSubmit = async (data: AddOrgFormValues) => {
    setRootError('');
    try {
      const payload = {
        ...data,
        sendEmail: mode === 'add' ? sendEmail : undefined,
      };
      if (mode === 'add') {
        await adminCreateOrg(payload);
      } else {
        await adminUpdateOrg(org!._id, payload);
      }
      onSuccess();
    } catch (err: any) {
      setRootError(err.message || 'An error occurred');
    }
  };

  const errOf = (key: string) =>
    (errors as Record<string, { message?: string }>)[key];

  const orgFields = [
    { name: 'name', label: 'Organization Name', placeholder: 'e.g. ACMS' },
    { name: 'slug', label: 'URL Slug', placeholder: 'e.g. acms' },
    { name: 'governor', label: 'Governor', placeholder: 'Full name' },
    { name: 'viceGovernor', label: 'Vice Governor', placeholder: 'Full name' },
    { name: 'treasurer', label: 'Treasurer', placeholder: 'Full name' },
    { name: 'auditor', label: 'Auditor', placeholder: 'Full name' },
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Organization' : 'Edit Organization'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Org details ─────────────────────────────────────────── */}
          {orgFields.map((field) => (
            <div key={field.name} className="space-y-1.5">
              <Label
                htmlFor={`orgForm-${field.name}`}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {field.label}
              </Label>
              <Input
                id={`orgForm-${field.name}`}
                {...register(field.name as keyof AddOrgFormValues)}
                placeholder={field.placeholder}
                className={errOf(field.name) ? 'border-red-500' : ''}
              />
              {errOf(field.name) && (
                <p className="text-xs text-red-500">
                  {errOf(field.name)?.message}
                </p>
              )}
            </div>
          ))}

          {/* ── Sync Sources ────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sync Sources (Allowed Orgs)
            </Label>
            <div className="w-full px-4 py-3 rounded-xl text-sm bg-muted/30 border border-border">
              <div className="max-h-32 overflow-y-auto space-y-2">
                {allOrgs
                  .filter((o) => mode === 'add' || o._id !== org?._id)
                  .map((sourceOrg) => {
                    const isSelected = selectedSyncSources.includes(
                      sourceOrg._id,
                    );
                    return (
                      <label
                        key={sourceOrg._id}
                        className="flex items-center gap-3 cursor-pointer p-1 rounded hover:bg-muted transition-colors"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setValue('syncSources', [
                                ...selectedSyncSources,
                                sourceOrg._id,
                              ]);
                            } else {
                              setValue(
                                'syncSources',
                                selectedSyncSources.filter(
                                  (id) => id !== sourceOrg._id,
                                ),
                              );
                            }
                          }}
                        />
                        <span className="text-sm text-foreground">
                          {sourceOrg.name} ({sourceOrg.slug})
                        </span>
                      </label>
                    );
                  })}
                {allOrgs.length === (mode === 'add' ? 0 : 1) && (
                  <p className="text-muted-foreground text-xs italic">
                    No other organizations available to sync from.
                  </p>
                )}
              </div>
            </div>
            {errOf('syncSources') && (
              <p className="text-xs text-red-500">
                {errOf('syncSources')?.message}
              </p>
            )}
          </div>

          {/* ── Admin seed account (add mode only) ──────────────────── */}
          {mode === 'add' && (
            <>
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest px-1 text-primary">
                    Admin Account
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <p className="text-xs mb-4 text-muted-foreground">
                  This account will be seeded as the organization's
                  administrator with the Super Admin role (all permissions).
                </p>
              </div>

              {/* Admin Student ID + Password */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="adminStudentID"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Student ID
                  </Label>
                  <Input
                    id="adminStudentID"
                    {...register('adminStudentID')}
                    placeholder="10-digit ID"
                    maxLength={10}
                    className={errors.adminStudentID ? 'border-red-500' : ''}
                  />
                  {errors.adminStudentID && (
                    <p className="text-xs text-red-500">
                      {errors.adminStudentID.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="adminPassword"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type={showAdminPassword ? 'text' : 'password'}
                      {...register('adminPassword')}
                      placeholder="Min 8 chars"
                      className={cn(
                        'pr-16',
                        errors.adminPassword && 'border-red-500',
                      )}
                    />
                    <button
                      type="button"
                      id="randomizeAdminPassword"
                      onClick={() => {
                        const pwd = generateRandomPassword();
                        setValue('adminPassword', pwd, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        setShowAdminPassword(true);
                      }}
                      title="Randomize password"
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-primary hover:opacity-80 transition-opacity"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      id="toggleAdminPassword"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showAdminPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-xs text-red-500">
                      {errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Firstname + Lastname */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="adminFirstname"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    First Name
                  </Label>
                  <Input
                    id="adminFirstname"
                    {...register('adminFirstname')}
                    placeholder="First name"
                    className={errors.adminFirstname ? 'border-red-500' : ''}
                  />
                  {errors.adminFirstname && (
                    <p className="text-xs text-red-500">
                      {errors.adminFirstname.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="adminLastname"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="adminLastname"
                    {...register('adminLastname')}
                    placeholder="Last name"
                    className={errors.adminLastname ? 'border-red-500' : ''}
                  />
                  {errors.adminLastname && (
                    <p className="text-xs text-red-500">
                      {errors.adminLastname.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Send welcome email toggle */}
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer select-none border transition-all',
                  sendEmail
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-muted/30 border-border',
                )}
                onClick={() => setSendEmail((v) => !v)}
              >
                <input
                  id="sendEmailCheckbox"
                  type="checkbox"
                  checked={sendEmail}
                  onChange={() => setSendEmail((v) => !v)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-primary cursor-pointer"
                />
                <Mail
                  className={cn(
                    'w-4 h-4',
                    sendEmail ? 'text-primary' : 'text-muted-foreground',
                  )}
                />
                <span
                  className={cn(
                    'text-sm',
                    sendEmail ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  Send welcome email with credentials
                </span>
              </div>

              {/* Admin email */}
              {sendEmail && (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="adminEmail"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Admin Email Address
                  </Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    {...register('adminEmail')}
                    placeholder="admin@example.com"
                    className={errors.adminEmail ? 'border-red-500' : ''}
                  />
                  {errors.adminEmail && (
                    <p className="text-xs text-red-500">
                      {errors.adminEmail.message}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {rootError && (
            <div className="rounded-xl px-4 py-3 text-sm text-destructive bg-destructive/10 border border-destructive/20">
              {rootError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              id="cancelOrgForm"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              id="submitOrgForm"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? 'Saving…'
                : mode === 'add'
                  ? 'Create & Seed'
                  : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
