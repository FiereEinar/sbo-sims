import { useUserStore } from '@/store/user';
import Header from './ui/header';

export default function HeaderLogo() {
  const currentUser = useUserStore((state) => state.user);
  const semester =
    currentUser?.activeSemDB == '2' ? '2nd semester' : '1st semester';

  return (
    <div className="transition-all shrink-0 sticky top-0 flex gap-2 items-center text-white bg-[#F6F6F6] dark:bg-[#121212] p-5 ">
      <img
        className="shrink-0 size-12 md:size-16"
        src="/images/BUKSU_NEW_LOGO.png"
        alt=""
      />
      <div className="hidden md:flex flex-col text-muted-foreground">
        <Header>SIMS</Header>
        <p className="text-xs">
          {currentUser?.activeSchoolYearDB} -{' '}
          {parseInt(currentUser?.activeSchoolYearDB as string) + 1}
        </p>
        <p className="text-xs">{semester}</p>
      </div>
    </div>
  );
}
