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
	if (userRole === 'admin') return true;
	return allowedRoles.includes(userRole);
}

export const formatOrdinals = (n: number) => {
	const pr = new Intl.PluralRules('en-US', { type: 'ordinal' });
	const suffixes = new Map([
		['one', 'st'],
		['two', 'nd'],
		['few', 'rd'],
		['other', 'th'],
	]);
	const rule = pr.select(n);
	const suffix = suffixes.get(rule);
	return `${n}${suffix}`;
};
