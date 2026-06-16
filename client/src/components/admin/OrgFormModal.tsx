import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { AdminOrgWithStats, adminCreateOrg, adminUpdateOrg } from '@/api/admin';
import { organizationSchema } from '@/lib/validations/organizationSchema';
import { Department } from '@/types/deparment';

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
});

type AddOrgFormValues = z.infer<typeof addOrgSchema>;

export default function OrgFormModal({
  mode,
  org,
  onClose,
  onSuccess,
}: {
  mode: 'add' | 'edit';
  org?: AdminOrgWithStats;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [departments, setDepartments] = useState<Department[]>(
    org?.departments?.map((d) => ({ id: uuidv4(), name: d })) ?? [],
  );
  const [depInput, setDepInput] = useState('');
  const [rootError, setRootError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const schema = mode === 'add' ? addOrgSchema : editOrgSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddOrgFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: org?.name ?? '',
      slug: org?.slug ?? '',
      governor: org?.governor ?? '',
      viceGovernor: org?.viceGovernor ?? '',
      treasurer: org?.treasurer ?? '',
      auditor: org?.auditor ?? '',
    },
  });

  const onSubmit = async (data: AddOrgFormValues) => {
    setRootError('');
    const deps = departments.map((d) => d.name);
    if (deps.length === 0) {
      setRootError('Add at least one department');
      return;
    }
    try {
      const payload = { ...data, departments: deps };
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

  const addDep = () => {
    const trimmed = depInput.trim().toUpperCase();
    if (!trimmed) return;
    setDepartments((prev) => [...prev, { id: uuidv4(), name: trimmed }]);
    setDepInput('');
  };

  const removeDep = (id: string) =>
    setDepartments((prev) => prev.filter((d) => d.id !== id));

  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'white',
  };

  const labelStyle = { color: 'rgba(255,255,255,0.55)' } as React.CSSProperties;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90dvh]"
        style={{
          background: 'rgba(20,20,35,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">
            {mode === 'add' ? 'Add Organization' : 'Edit Organization'}
          </h2>
          <button
            id="closeOrgModal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* ── Org details ─────────────────────────────────────────── */}
          {orgFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={labelStyle}
              >
                {field.label}
              </label>
              <input
                id={`orgForm-${field.name}`}
                {...register(field.name as keyof AddOrgFormValues)}
                placeholder={field.placeholder}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                style={{
                  ...inputStyle,
                  borderColor: errOf(field.name)
                    ? '#f87171'
                    : 'rgba(255,255,255,0.12)',
                }}
              />
              {errOf(field.name) && (
                <p className="text-xs text-red-400">
                  {errOf(field.name)?.message}
                </p>
              )}
            </div>
          ))}

          {/* ── Departments ─────────────────────────────────────────── */}
          <div className="space-y-1">
            <label
              className="text-xs font-semibold uppercase tracking-wider"
              style={labelStyle}
            >
              Departments
            </label>
            <div className="flex gap-2">
              <input
                id="depInput"
                value={depInput}
                onChange={(e) => setDepInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addDep();
                  }
                }}
                placeholder="Type and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                style={inputStyle}
              />
              <button
                type="button"
                id="addDepartment"
                onClick={addDep}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
                }}
              >
                Add
              </button>
            </div>
            {departments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {departments.map((dep) => (
                  <span
                    key={dep.id}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#c4b5fd',
                    }}
                  >
                    {dep.name}
                    <button
                      type="button"
                      id={`removeDep-${dep.id}`}
                      onClick={() => removeDep(dep.id)}
                      className="ml-0.5 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Admin seed account (add mode only) ──────────────────── */}
          {mode === 'add' && (
            <>
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                  <span
                    className="text-xs font-semibold uppercase tracking-widest px-1"
                    style={{ color: 'rgba(124,58,237,0.9)' }}
                  >
                    Admin Account
                  </span>
                  <div
                    className="flex-1 h-px"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  />
                </div>
                <p
                  className="text-xs mb-4"
                  style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                  This account will be seeded as the organization's
                  administrator with the Super Admin role (all permissions).
                </p>
              </div>

              {/* Admin Student ID + Firstname */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={labelStyle}
                  >
                    Student ID
                  </label>
                  <input
                    id="adminStudentID"
                    {...register('adminStudentID')}
                    placeholder="10-digit ID"
                    maxLength={10}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:opacity-30"
                    style={{
                      ...inputStyle,
                      borderColor: errors.adminStudentID
                        ? '#f87171'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                  {errors.adminStudentID && (
                    <p className="text-xs text-red-400">
                      {errors.adminStudentID.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={labelStyle}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="adminPassword"
                      type={showAdminPassword ? 'text' : 'password'}
                      {...register('adminPassword')}
                      placeholder="Min 8 chars"
                      className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm outline-none placeholder:opacity-30"
                      style={{
                        ...inputStyle,
                        borderColor: errors.adminPassword
                          ? '#f87171'
                          : 'rgba(255,255,255,0.12)',
                      }}
                    />
                    <button
                      type="button"
                      id="toggleAdminPassword"
                      onClick={() => setShowAdminPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      {showAdminPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.adminPassword && (
                    <p className="text-xs text-red-400">
                      {errors.adminPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Firstname + Lastname */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={labelStyle}
                  >
                    First Name
                  </label>
                  <input
                    id="adminFirstname"
                    {...register('adminFirstname')}
                    placeholder="First name"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:opacity-30"
                    style={{
                      ...inputStyle,
                      borderColor: errors.adminFirstname
                        ? '#f87171'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                  {errors.adminFirstname && (
                    <p className="text-xs text-red-400">
                      {errors.adminFirstname.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={labelStyle}
                  >
                    Last Name
                  </label>
                  <input
                    id="adminLastname"
                    {...register('adminLastname')}
                    placeholder="Last name"
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none placeholder:opacity-30"
                    style={{
                      ...inputStyle,
                      borderColor: errors.adminLastname
                        ? '#f87171'
                        : 'rgba(255,255,255,0.12)',
                    }}
                  />
                  {errors.adminLastname && (
                    <p className="text-xs text-red-400">
                      {errors.adminLastname.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {rootError && (
            <div
              className="rounded-xl px-4 py-3 text-sm text-red-300"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              {rootError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              id="cancelOrgForm"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submitOrgForm"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
              }}
            >
              {isSubmitting
                ? 'Saving…'
                : mode === 'add'
                  ? 'Create & Seed'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
