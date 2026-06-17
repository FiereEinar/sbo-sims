import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import GetIcon from '../icons/get-icon';

export default function BackButton() {
  const navigate = useTenantNavigate();

  return (
    <button
      className="flex items-center gap-1 text-muted-foreground"
      onClick={() => navigate(-1)}
    >
      <GetIcon iconKey="back" />
      <p className="hover:underline">Back</p>
    </button>
  );
}
