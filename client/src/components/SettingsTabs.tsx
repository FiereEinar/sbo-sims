import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MODULES } from '@/constants';
import Header from '@/components/ui/header';
import { useUserStore } from '@/store/user';
import {
	SlidersHorizontal,
	Building2,
	Mail,
	Users,
	ShieldCheck,
} from 'lucide-react';

export default function SettingsTabs() {
	const location = useLocation();
	const navigate = useNavigate();
	const { orgSlug } = useParams<{ orgSlug: string }>();
	const { user } = useUserStore();

	const getPath = (path: string) => {
		return orgSlug ? `/${orgSlug}${path}` : path;
	};

	const tabs = [
		{
			name: 'General & Appearance',
			path: '/settings',
			match: '/settings',
			icon: SlidersHorizontal,
			description: 'Theme, brand color, and interface preferences',
			permissions: [MODULES.SETTING_READ],
		},
		{
			name: 'Organization Profile',
			path: '/organization',
			match: '/organization',
			icon: Building2,
			description: 'Profile details and department funds',
			permissions: [MODULES.ORGANIZATION_READ],
		},
		{
			name: 'Email SMTP',
			path: '/settings/email',
			match: '/settings/email',
			icon: Mail,
			description: 'Automated receipt and notification delivery',
			permissions: [MODULES.ORGANIZATION_UPDATE],
		},
		{
			name: 'Officers & Staff',
			path: '/user',
			match: '/user',
			icon: Users,
			description: 'Authorized officer accounts',
			permissions: [MODULES.USER_READ],
		},
		{
			name: 'Roles & RBAC',
			path: '/role',
			match: '/role',
			icon: ShieldCheck,
			description: 'Granular permissions and access control',
			permissions: [MODULES.ROLE_READ],
		},
	];

	const canView = (permissions: string[]) => {
		if (!user) return false;
		if (user.role === 'central-admin') return true;
		if (permissions.length === 0) return true;
		const userPerms = user.rbacRole?.permissions ?? [];
		return permissions.some((p) => userPerms.includes(p));
	};

	const currentPath = location.pathname;

	return (
		<div className='w-full space-y-4 mb-6'>
			<div className='flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/40'>
				<div className='space-y-1'>
					<Header>Settings & Configuration</Header>
					<p className='text-xs sm:text-sm text-muted-foreground'>
						Manage organization preferences, visual branding, communications, and access control.
					</p>
				</div>
				{orgSlug && (
					<div className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border/50 bg-muted/30 text-xs text-muted-foreground'>
						<span className='w-1.5 h-1.5 rounded-full bg-primary' />
						<span className='font-mono text-[11px] font-medium'>
							slug: {orgSlug}
						</span>
					</div>
				)}
			</div>

			{/* Elevated Segmented Tab Rail */}
			<div className='flex items-center gap-1.5 p-1 rounded-xl border border-border/50 bg-muted/40 overflow-x-auto no-scrollbar'>
				{tabs
					.filter((tab) => canView(tab.permissions))
					.map((tab) => {
						const targetPath = getPath(tab.path);
						const isGeneral = tab.path === '/settings';
						const isActive = isGeneral
							? currentPath === targetPath
							: currentPath.startsWith(getPath(tab.match));

						const Icon = tab.icon;

						return (
							<button
								key={tab.name}
								type='button'
								onClick={() => navigate(targetPath)}
								className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 ${
									isActive
										? 'bg-background text-foreground shadow-xs border border-border/40 font-semibold'
										: 'text-muted-foreground hover:text-foreground hover:bg-background/40'
								}`}
							>
								<Icon
									className={`w-3.5 h-3.5 ${
										isActive ? 'text-primary' : 'text-muted-foreground'
									}`}
								/>
								<span>{tab.name}</span>
							</button>
						);
					})}
			</div>
		</div>
	);
}
