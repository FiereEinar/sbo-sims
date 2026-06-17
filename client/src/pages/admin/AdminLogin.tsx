import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { adminLogin } from '@/api/admin';
import { useUserStore } from '@/store/user';
import { Shield, Eye, EyeOff, Lock } from 'lucide-react';

const adminLoginSchema = z.object({
	studentID: z.string().min(1, 'Admin ID is required'),
	password: z.string().min(1, 'Password is required'),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
	const navigate = useNavigate();
	const setUser = useUserStore((state) => state.setUser);
	const [showPassword, setShowPassword] = useState(false);
	const [rootError, setRootError] = useState('');

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<AdminLoginForm>({ resolver: zodResolver(adminLoginSchema) });

	const onSubmit = async (data: AdminLoginForm) => {
		setRootError('');
		try {
			const result = await adminLogin(data);
			if (result?.data) {
				localStorage.setItem('accessToken', result.data.accessToken);
				setUser(result.data.user);
			}
			navigate('/admin', { replace: true });
		} catch (err: any) {
			setRootError(err.message || 'Invalid credentials');
		}
	};

	return (
		<main className='min-h-dvh flex items-center justify-center relative overflow-hidden' style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 40%, #16213e 70%, #0f3460 100%)' }}>
			{/* Animated background orbs */}
			<div className='absolute top-[-10%] left-[-5%] w-72 h-72 rounded-full opacity-20 blur-3xl animate-pulse' style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
			<div className='absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-15 blur-3xl animate-pulse' style={{ background: 'radial-gradient(circle, #2563eb, transparent)', animationDelay: '1s' }} />
			<div className='absolute top-1/2 left-[-15%] w-64 h-64 rounded-full opacity-10 blur-3xl animate-pulse' style={{ background: 'radial-gradient(circle, #ec4899, transparent)', animationDelay: '2s' }} />

			{/* Grid overlay */}
			<div className='absolute inset-0 opacity-5' style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

			{/* Login card */}
			<div className='relative z-10 w-full max-w-md mx-4'>
				{/* Glassmorphism card */}
				<div className='rounded-2xl p-8 shadow-2xl' style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>

					{/* Header */}
					<div className='text-center mb-8'>
						<div className='flex justify-center mb-4'>
							<div className='w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg' style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
								<Shield className='w-8 h-8 text-white' />
							</div>
						</div>
						<h1 className='text-2xl font-bold text-white mb-1'>Super Admin Portal</h1>
						<p className='text-sm' style={{ color: 'rgba(255,255,255,0.5)' }}>Restricted access — authorized personnel only</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-5'>
						{/* Admin ID */}
						<div className='space-y-1.5'>
							<label className='text-xs font-semibold uppercase tracking-widest' style={{ color: 'rgba(255,255,255,0.6)' }}>
								Admin ID
							</label>
							<input
								id='adminID'
								type='text'
								autoComplete='username'
								{...register('studentID')}
								className='w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all placeholder:opacity-40'
								style={{ background: 'rgba(255,255,255,0.08)', border: errors.studentID ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.15)', }}
								placeholder='Enter your admin ID'
							/>
							{errors.studentID && (
								<p className='text-xs text-red-400 mt-1'>{errors.studentID.message}</p>
							)}
						</div>

						{/* Password */}
						<div className='space-y-1.5'>
							<label className='text-xs font-semibold uppercase tracking-widest' style={{ color: 'rgba(255,255,255,0.6)' }}>
								Password
							</label>
							<div className='relative'>
								<input
									id='adminPassword'
									type={showPassword ? 'text' : 'password'}
									autoComplete='current-password'
									{...register('password')}
									className='w-full px-4 py-3 pr-12 rounded-xl text-sm text-white outline-none transition-all placeholder:opacity-40'
									style={{ background: 'rgba(255,255,255,0.08)', border: errors.password ? '1px solid #f87171' : '1px solid rgba(255,255,255,0.15)', }}
									placeholder='Enter your password'
								/>
								<button
									type='button'
									id='togglePasswordVisibility'
									onClick={() => setShowPassword((v) => !v)}
									className='absolute right-4 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-100'
									style={{ color: 'rgba(255,255,255,0.4)' }}
								>
									{showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
								</button>
							</div>
							{errors.password && (
								<p className='text-xs text-red-400 mt-1'>{errors.password.message}</p>
							)}
						</div>

						{/* Root error */}
						{rootError && (
							<div className='rounded-xl px-4 py-3 text-sm text-red-300' style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
								{rootError}
							</div>
						)}

						{/* Submit */}
						<button
							id='adminLoginSubmit'
							type='submit'
							disabled={isSubmitting}
							className='w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-60'
							style={{ background: isSubmitting ? 'rgba(124, 58, 237, 0.5)' : 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)' }}
						>
							{isSubmitting ? (
								<>
									<svg className='animate-spin w-4 h-4' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
										<circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
										<path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z' />
									</svg>
									Authenticating…
								</>
							) : (
								<>
									<Lock className='w-4 h-4' />
									Access Portal
								</>
							)}
						</button>
					</form>

					{/* Footer */}
					<p className='text-center text-xs mt-6' style={{ color: 'rgba(255,255,255,0.25)' }}>
						SBO-SIMS &mdash; Global Administration System
					</p>
				</div>
			</div>
		</main>
	);
}
