import { ChevronLeft } from 'lucide-react';
import { useTenantNavigate } from '../../hooks/useTenantNavigate';

export default function BackButton() {
  const navigate = useTenantNavigate();

  return (
    <button
      className="flex items-center gap-1 text-muted-foreground "
      onClick={() => navigate(-1)}
    >
      <ChevronLeft className="h-4 w-4" />
      <p className="hover:underline font-semibold text-sm">Back</p>
    </button>
  );
}
