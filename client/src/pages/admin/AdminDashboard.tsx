import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllOrgsAdmin,
  adminDeleteOrg,
  AdminOrgWithStats,
} from '@/api/admin';
import OrgCard from '@/components/admin/OrgCard';
import OrgFormModal from '@/components/admin/OrgFormModal';
import DeleteModal from '@/components/admin/DeleteModal';
import { Building2, Plus, Search } from 'lucide-react';

export type ModalMode = 'add' | 'edit' | 'delete' | null;

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedOrg, setSelectedOrg] = useState<AdminOrgWithStats | null>(
    null,
  );
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: fetchAllOrgsAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteOrg(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-organizations'] });
      closeModal();
    },
    onError: (err: any) => {
      setDeleteError(err.message || 'Failed to delete organization');
    },
  });

  const closeModal = () => {
    setModal(null);
    setSelectedOrg(null);
    setDeleteError('');
  };

  const handleAdd = () => {
    setSelectedOrg(null);
    setModal('add');
  };
  const handleEdit = (org: AdminOrgWithStats) => {
    setSelectedOrg(org);
    setModal('edit');
  };
  const handleDelete = (org: AdminOrgWithStats) => {
    setSelectedOrg(org);
    setModal('delete');
    setDeleteError('');
  };
  const handleFormSuccess = () => {
    qc.invalidateQueries({ queryKey: ['admin-organizations'] });
    closeModal();
  };

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-8 min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Organizations</h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {orgs.length} organization{orgs.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          id="addOrganizationBtn"
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #2563eb)',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        />
        <input
          id="orgSearch"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none placeholder:opacity-30"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Organizations',
            value: orgs.length,
            color: '#7c3aed',
          },
          {
            label: 'Total Users',
            value: orgs.reduce((sum, o) => sum + (o.userCount ?? 0), 0),
            color: '#2563eb',
          },
          {
            label: 'Total Departments',
            value: orgs.reduce(
              (sum, o) => sum + (o.departments?.length ?? 0),
              0,
            ),
            color: '#059669',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <p
              className="text-3xl font-bold text-white mb-1"
              style={{ color: stat.color }}
            >
              {stat.value}
            </p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <svg
            className="animate-spin w-8 h-8"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="white"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="white"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Building2
            className="w-12 h-12 mb-4"
            style={{ color: 'rgba(255,255,255,0.15)' }}
          />
          <p className="text-white font-medium mb-1">No organizations found</p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {search
              ? 'Try a different search term'
              : 'Click "Add Organization" to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((org) => (
            <OrgCard
              key={org._id}
              org={org}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(modal === 'add' || modal === 'edit') && (
        <OrgFormModal
          mode={modal}
          org={selectedOrg ?? undefined}
          onClose={closeModal}
          onSuccess={handleFormSuccess}
        />
      )}
      {modal === 'delete' && selectedOrg && (
        <>
          <DeleteModal
            org={selectedOrg}
            onClose={closeModal}
            onConfirm={() => deleteMutation.mutate(selectedOrg._id)}
            isDeleting={deleteMutation.isPending}
          />
          {deleteError && (
            <div
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm text-red-300 shadow-xl"
              style={{
                background: 'rgba(20,20,35,0.95)',
                border: '1px solid rgba(239,68,68,0.4)',
              }}
            >
              {deleteError}
            </div>
          )}
        </>
      )}
    </div>
  );
}
