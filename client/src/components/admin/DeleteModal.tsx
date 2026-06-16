import { Trash2 } from 'lucide-react';
import { AdminOrgWithStats } from '@/api/admin';

export default function DeleteModal({
  org,
  onClose,
  onConfirm,
  isDeleting,
}: {
  org: AdminOrgWithStats;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
        style={{
          background: 'rgba(20,20,35,0.97)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}
      >
        <div
          className="flex items-center justify-center w-14 h-14 rounded-2xl mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <Trash2 className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white text-center mb-1">
          Delete Organization
        </h2>
        <p
          className="text-sm text-center mb-6"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Are you sure you want to delete{' '}
          <span className="text-white font-semibold">{org.name}</span>? This
          action cannot be undone. The organization must have no categories.
        </p>
        <div className="flex gap-3">
          <button
            id="cancelDelete"
            onClick={onClose}
            disabled={isDeleting}
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
            id="confirmDelete"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
