import axiosInstance from '@/api/axiosInstance';
import studentAxiosInstance from '@/api/studentAxiosInstance';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';
import { trefoil } from 'ldrs';

trefoil.register();

export default function RootRedirect() {
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      // 1. Try local/org-admin check-auth first (supports offline org-admin)
      try {
        const { data } = await axiosInstance.get<{
          user: User;
          accessToken: string;
        }>('/auth/check-auth');
        const user = data.user;
        setUser(user);

        if (user.role === 'org-admin' && user.organization?.slug) {
          if (window.electronAPI?.setSyncContext) {
            window.electronAPI.setSyncContext(
              data.accessToken,
              user.organization._id,
              'org-admin',
            );
          }
          navigate(`/${user.organization.slug}`, { replace: true });
          return;
        }

        if (user.role === 'central-admin') {
          navigate('/admin', { replace: true });
          return;
        }

        if (user.role === 'student') {
          navigate('/student/dashboard', { replace: true });
          return;
        }
      } catch {
        // Not authenticated locally, check cloud if token exists
      }

      // 2. Check cloud Atlas backend (for student and central-admin)
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { data } = await studentAxiosInstance.get<{
            user: User;
            accessToken: string;
          }>('/auth/check-auth');
          const user = data.user;
          setUser(user);

          if (user.role === 'central-admin') {
            navigate('/admin', { replace: true });
            return;
          }

          if (user.role === 'student') {
            navigate('/student/dashboard', { replace: true });
            return;
          }
        } catch {
          // Cloud session not valid or offline
        }
      }

      navigate('/login', { replace: true });
    })();
  }, [navigate, setUser]);

  const isDark = document.documentElement.classList.contains('dark');
  return (
    <section className="w-dvw h-dvh flex flex-col justify-center items-center">
      <l-trefoil
        size="80"
        stroke="4"
        stroke-length="0.15"
        bg-opacity="0.1"
        speed="1.4"
        color={isDark ? 'white' : 'black'}
      />
      <p className="text-xl font-bold mt-5">Loading Workspace</p>
    </section>
  );
}
