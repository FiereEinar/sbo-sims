import type { Modules } from '@/constants';
import { useUserStore } from '@/store/user';
import type { ReactNode } from 'react';

type Props = {
	permissions?: Modules[]; // optional
	children: ReactNode;
	fallback?: ReactNode;
};

export default function HasPermission({
	permissions = [],
	children,
	fallback = null,
}: Props) {
	const { user } = useUserStore((state) => state);

	if (!user) return fallback;

	if (user.role === 'admin') return children;

	// --- Permission Check (admin only)
	if (permissions.length > 0) {
		const userPerms = user.rbacRole?.permissions ?? [];
		const hasPerm = permissions.some((p) => userPerms.includes(p));
		if (!hasPerm) {
			return fallback;
		}
	}

	return children;
}
