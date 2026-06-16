import { Outlet, useNavigate } from 'react-router-dom';
import { setNavigate } from '@/lib/navigate';
import { Shield, Building2, LogOut } from 'lucide-react';
import adminAxiosInstance from '@/api/adminAxiosInstance';
import { useUserStore } from '@/store/user';
import DarkModeToggle from '@/components/buttons/DarkModeToggle';
import { useToast } from '@/hooks/use-toast';

export default function AdminApp() {
	const navigate = useNavigate();
	setNavigate(navigate);
	const { user } = useUserStore();
	const { toast } = useToast();

	const handleLogout = async () => {
		try {
			await adminAxiosInstance.get('/auth/logout');
		} catch {
			// ignore
		}
		localStorage.removeItem('accessToken');
		navigate('/admin/login', { replace: true });
		toast({ title: 'Logged out', description: 'You have been signed out of the admin portal.' });
	};

	return (
		<div className='min-h-dvh flex' style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 100%)' }}>
			{/* Sidebar */}
			<aside className='w-64 flex-shrink-0 flex flex-col justify-between py-8 px-5' style={{ background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
				{/* Logo */}
				<div>
					<div className='flex items-center gap-3 mb-10'>
						<div className='w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0' style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
							<Shield className='w-5 h-5 text-white' />
						</div>
						<div>
							<p className='text-white font-bold text-sm leading-tight'>Super Admin</p>
							<p className='text-xs' style={{ color: 'rgba(255,255,255,0.4)' }}>SBO-SIMS Portal</p>
						</div>
					</div>

					{/* Nav links */}
					<nav className='space-y-1'>
						<button
							id='adminNavOrganizations'
							onClick={() => navigate('/admin')}
							className='w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white'
							style={{ background: 'rgba(124, 58, 237, 0.2)', border: '1px solid rgba(124, 58, 237, 0.3)' }}
						>
							<Building2 className='w-4 h-4' style={{ color: '#a78bfa' }} />
							Organizations
						</button>
					</nav>
				</div>

				{/* Bottom: user + logout */}
				<div className='space-y-3'>
					<div className='px-3 py-3 rounded-xl' style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
						<p className='text-xs font-semibold text-white truncate'>{user?.firstname} {user?.lastname}</p>
						<p className='text-xs mt-0.5' style={{ color: 'rgba(255,255,255,0.4)' }}>Global Administrator</p>
					</div>
					<div className='flex items-center gap-2'>
						<button
							id='adminLogout'
							onClick={handleLogout}
							className='flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all duration-200'
							style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}
						>
							<LogOut className='w-3.5 h-3.5' />
							Sign Out
						</button>
						<div className='py-2.5 px-2 rounded-xl' style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
							<DarkModeToggle />
						</div>
					</div>
				</div>
			</aside>

			{/* Main content */}
			<main className='flex-1 overflow-auto'>
				<Outlet />
			</main>
		</div>
	);
}
