import axiosInstance from '@/api/axiosInstance';
import { PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types/user';
import { useUserStore } from '@/store/user';
import { trefoil } from 'ldrs';

trefoil.register();

/**
 * Protects all /student/* routes.
 * - Unauthenticated users → /login
 * - Authenticated but non-student role → /login (wrong portal)
 */
export default function StudentProtectedRoute({ children }: PropsWithChildren) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axiosInstance.get<User>('/auth/check-auth');
        setUser(data);

        if (data.role !== 'student') {
          // Non-students should not access the student portal
          setIsAuthenticated(false);
          navigate('/login', { replace: true });
          return;
        }

        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, setUser]);

  if (!isAuthenticated) {
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
        <p className="text-xl font-bold mt-5">Authenticating</p>
      </section>
    );
  }

  return children;
}
