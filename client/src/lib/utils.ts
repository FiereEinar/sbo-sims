import { UserRoles } from '@/types/user';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function numberWithCommas(x: number) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function isAuthorized(
	userRole: UserRoles | undefined,
	...allowedRoles: UserRoles[]
) {
	if (!userRole) return false;
	return allowedRoles.includes(userRole);
}
