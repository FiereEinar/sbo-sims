import TopNavbarSheet from './TopNavbarSheet';
import { useUserStore } from '@/store/user';
import UserProfileSheet from './user/UserProfileSheet';

export default function TopNavbar() {
  const { user } = useUserStore((state) => state);

  return (
    <div className="w-full sticky top-0 z-50 bg-card/50 p-2 px-4 border-b flex flex-row-reverse sm:flex-row justify-between items-center h-16">
      <div className="flex items-center gap-3">
        <div className="sm:hidden">
          <TopNavbarSheet />
        </div>
      </div>

      <div className="flex items-center">
        <UserProfileSheet user={user} />
      </div>
    </div>
  );
}
