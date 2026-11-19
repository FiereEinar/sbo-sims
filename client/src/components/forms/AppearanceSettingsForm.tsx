import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/user';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
	Check,
	RotateCcw,
	Sun,
	Moon,
	Palette,
	Receipt,
	Plus,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const PRESETS = [
	{ name: 'Default Navy', value: null, hex: '#000080' },
	{ name: 'Cobalt', value: '221.2 83.2% 53.3%', hex: '#2563eb' },
	{ name: 'Emerald', value: '142.1 76.2% 36.3%', hex: '#16a34a' },
	{ name: 'Crimson', value: '346.8 77.2% 49.8%', hex: '#e11d48' },
	{ name: 'Amber', value: '24.6 95% 53.1%', hex: '#f97316' },
	{ name: 'Purple', value: '262.1 83.3% 57.8%', hex: '#9333ea' },
];

function hexToHSL(hex: string): string {
	let r = 0,
		g = 0,
		b = 0;
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	} else if (hex.length === 7) {
		r = parseInt(hex.substring(1, 3), 16);
		g = parseInt(hex.substring(3, 5), 16);
		b = parseInt(hex.substring(5, 7), 16);
	}

	r /= 255;
	g /= 255;
	b /= 255;

	const cmin = Math.min(r, g, b);
	const cmax = Math.max(r, g, b);
	const delta = cmax - cmin;
	let h = 0;
	let s = 0;
	let l = 0;

	if (delta === 0) h = 0;
	else if (cmax === r) h = ((g - b) / delta) % 6;
	else if (cmax === g) h = (b - r) / delta + 2;
	else h = (r - g) / delta + 4;

	h = Math.round(h * 60);
	if (h < 0) h += 360;

	l = (cmax + cmin) / 2;
	s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);

	return `${h} ${s}% ${l}%`;
}

function hslToHex(hslStr: string): string {
	if (!hslStr) return '#000080';
	const parts = hslStr.split(' ');
	if (parts.length !== 3) return '#000080';

	const h = parseFloat(parts[0]);
	const s = parseFloat(parts[1]) / 100;
	const l = parseFloat(parts[2]) / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0;
	let g = 0;
	let b = 0;

	if (0 <= h && h < 60) {
		r = c;
		g = x;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
	} else if (120 <= h && h < 180) {
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		b = x;
	}

	const rHex = Math.round((r + m) * 255)
		.toString(16)
		.padStart(2, '0');
	const gHex = Math.round((g + m) * 255)
		.toString(16)
		.padStart(2, '0');
	const bHex = Math.round((b + m) * 255)
		.toString(16)
		.padStart(2, '0');

	return `#${rHex}${gHex}${bHex}`;
}

export default function AppearanceSettingsForm() {
	const { primaryColor, setPrimaryColor } = useThemeStore();
	const { user } = useUserStore();
	const { orgSlug } = useParams<{ orgSlug: string }>();
	const { toast } = useToast();

	const [hexColor, setHexColor] = useState('#000080');
	const [isDark, setIsDark] = useState<boolean>(() => {
		return (
			localStorage.getItem('theme') === 'dark' ||
			document.documentElement.classList.contains('dark')
		);
	});

	useEffect(() => {
		if (primaryColor) {
			setHexColor(hslToHex(primaryColor));
		} else {
			setHexColor('#000080');
		}
	}, [primaryColor]);

	const handleThemeToggle = (mode: 'light' | 'dark') => {
		const willBeDark = mode === 'dark';
		setIsDark(willBeDark);
		if (willBeDark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
		toast({
			title: `${mode === 'dark' ? 'Dark' : 'Light'} Mode Activated`,
			description: `Interface theme updated successfully.`,
		});
	};

	const handlePresetSelect = (value: string | null, name: string) => {
		setPrimaryColor(value);
		toast({
			title: 'Branding Color Updated',
			description: `Applied ${name} as your primary theme accent.`,
		});
	};

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const hex = e.target.value;
		setHexColor(hex);
		setPrimaryColor(hexToHSL(hex));
	};

	const handleReset = () => {
		setPrimaryColor(null);
		setHexColor('#000080');
		toast({
			title: 'Reset to Default',
			description: 'Primary branding reset to institutional Navy.',
		});
	};

	const isCustom =
		primaryColor !== null && !PRESETS.find((p) => p.value === primaryColor);

	return (
		<div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
			{/* Left Column: Preferences & Controls (7 Cols) */}
			<div className='lg:col-span-7 space-y-6'>
				{/* Appearance / Theme Mode Card */}
				<div className='rounded-2xl border border-border/50 bg-card/60 p-5 shadow-xs space-y-4'>
					<div className='space-y-0.5 border-b border-border/40 pb-3'>
						<h3 className='font-semibold text-base text-foreground'>
							Interface Theme
						</h3>
						<p className='text-xs text-muted-foreground'>
							Choose the ambient brightness for your workspace and event booths.
						</p>
					</div>

					<div className='grid grid-cols-2 gap-3 pt-1'>
						<button
							type='button'
							onClick={() => handleThemeToggle('light')}
							className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
								!isDark
									? 'border-primary bg-primary/5 text-foreground shadow-xs'
									: 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
							}`}
						>
							<div
								className={`p-2 rounded-lg ${
									!isDark
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground'
								}`}
							>
								<Sun className='w-4 h-4' />
							</div>
							<div>
								<p className='text-xs font-semibold'>Light Mode</p>
								<p className='text-[11px] text-muted-foreground'>
									Daylight & outdoor booths
								</p>
							</div>
							{!isDark && (
								<Check className='w-4 h-4 text-primary ml-auto shrink-0' />
							)}
						</button>

						<button
							type='button'
							onClick={() => handleThemeToggle('dark')}
							className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
								isDark
									? 'border-primary bg-primary/5 text-foreground shadow-xs'
									: 'border-border/60 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
							}`}
						>
							<div
								className={`p-2 rounded-lg ${
									isDark
										? 'bg-primary text-primary-foreground'
										: 'bg-muted text-muted-foreground'
								}`}
							>
								<Moon className='w-4 h-4' />
							</div>
							<div>
								<p className='text-xs font-semibold'>Dark Mode</p>
								<p className='text-[11px] text-muted-foreground'>
									Auditoriums & night shifts
								</p>
							</div>
							{isDark && (
								<Check className='w-4 h-4 text-primary ml-auto shrink-0' />
							)}
						</button>
					</div>
				</div>

				{/* Primary Brand Color Selection Card */}
				<div className='rounded-2xl border border-border/50 bg-card/60 p-5 shadow-xs space-y-4'>
					<div className='flex items-center justify-between border-b border-border/40 pb-3'>
						<div className='space-y-0.5'>
							<h3 className='font-semibold text-base text-foreground'>
								Primary Brand Accent
							</h3>
							<p className='text-xs text-muted-foreground'>
								Customize your organization’s identity on buttons, active badges, and focus indicators.
							</p>
						</div>
						<Button
							variant='ghost'
							size='sm'
							onClick={handleReset}
							className='h-7 text-xs text-muted-foreground hover:text-foreground gap-1'
						>
							<RotateCcw className='w-3 h-3' />
							Reset
						</Button>
					</div>

					{/* Presets Grid */}
					<div className='space-y-3 pt-1'>
						<Label className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
							Curated Swatches
						</Label>
						<div className='grid grid-cols-3 sm:grid-cols-6 gap-2.5'>
							{PRESETS.map((preset) => {
								const isSelected =
									preset.value === null
										? primaryColor === null
										: primaryColor === preset.value;

								return (
									<button
										key={preset.name}
										type='button'
										onClick={() => handlePresetSelect(preset.value, preset.name)}
										className={`group flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
											isSelected
												? 'border-primary bg-primary/5 shadow-xs'
												: 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted/40'
										}`}
									>
										<div
											className='w-7 h-7 rounded-full flex items-center justify-center shadow-xs transition-transform group-hover:scale-105'
											style={{
												backgroundColor: preset.value
													? `hsl(${preset.value})`
													: '#000080',
											}}
										>
											{isSelected && (
												<Check className='w-3.5 h-3.5 text-white' />
											)}
										</div>
										<span className='text-[11px] font-medium mt-1.5 truncate max-w-full'>
											{preset.name}
										</span>
									</button>
								);
							})}
						</div>
					</div>

					{/* Custom Color Row */}
					<div className='pt-2 border-t border-border/30 flex items-center justify-between gap-4'>
						<div className='space-y-0.5'>
							<Label className='text-xs font-semibold'>Custom Color Hex</Label>
							<p className='text-[11px] text-muted-foreground'>
								Pick any arbitrary hex value to match student council guidelines.
							</p>
						</div>

						<div className='flex items-center gap-2'>
							<div className='relative w-9 h-9 rounded-lg border border-border overflow-hidden shrink-0 shadow-xs'>
								<input
									type='color'
									value={hexColor}
									onChange={handleColorChange}
									className='absolute -top-2 -left-2 w-14 h-14 cursor-pointer border-0'
								/>
							</div>
							<div className='px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/30 font-mono text-xs font-semibold tabular-nums uppercase'>
								{hexColor}
							</div>
							{isCustom && (
								<Badge variant='outline' className='text-[10px] h-5 px-1.5 font-normal'>
									Active Custom
								</Badge>
							)}
						</div>
					</div>
				</div>

				{/* Tenant & System Information Card */}
				<div className='rounded-2xl border border-border/50 bg-card/60 p-5 shadow-xs space-y-3'>
					<h3 className='font-semibold text-xs uppercase tracking-wider text-muted-foreground'>
						Organization & System Status
					</h3>
					<div className='grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs'>
						<div className='p-2.5 rounded-lg border border-border/40 bg-muted/20'>
							<p className='text-[10px] text-muted-foreground uppercase font-medium'>
								Tenant Slug
							</p>
							<p className='font-mono font-semibold text-foreground truncate mt-0.5'>
								{orgSlug || 'default'}
							</p>
						</div>
						<div className='p-2.5 rounded-lg border border-border/40 bg-muted/20'>
							<p className='text-[10px] text-muted-foreground uppercase font-medium'>
								Assigned Role
							</p>
							<p className='font-semibold text-foreground truncate mt-0.5'>
								{user?.role || 'org-admin'}
							</p>
						</div>
						<div className='p-2.5 rounded-lg border border-border/40 bg-muted/20'>
							<p className='text-[10px] text-muted-foreground uppercase font-medium'>
								Sync Engine
							</p>
							<p className='font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1'>
								<span className='w-1.5 h-1.5 rounded-full bg-emerald-500' />
								Operational
							</p>
						</div>
						<div className='p-2.5 rounded-lg border border-border/40 bg-muted/20'>
							<p className='text-[10px] text-muted-foreground uppercase font-medium'>
								SIMS Version
							</p>
							<p className='font-mono font-semibold text-foreground mt-0.5'>
								v5.9.4
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Right Column: Live Tenant Preview Card (5 Cols) */}
			<div className='lg:col-span-5'>
				<div className='sticky top-20 rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm space-y-4'>
					<div className='flex items-center justify-between pb-3 border-b border-border/40'>
						<div className='space-y-0.5'>
							<div className='flex items-center gap-1.5'>
								<Palette className='w-4 h-4 text-primary' />
								<h3 className='font-semibold text-sm text-foreground'>
									Live Component Preview
								</h3>
							</div>
							<p className='text-[11px] text-muted-foreground'>
								Immediate rendering across booth UI primitives
							</p>
						</div>
						<Badge
							variant='outline'
							className='text-[10px] h-5 px-1.5 font-mono'
						>
							{hexColor}
						</Badge>
					</div>

					{/* Mock Workspace Panel */}
					<div className='rounded-xl border border-border/50 bg-background/60 p-4 space-y-4 shadow-inner'>
						{/* Mock Header */}
						<div className='flex items-center justify-between pb-2 border-b border-border/30'>
							<div className='flex items-center gap-2'>
								<div className='w-6 h-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs'>
									S
								</div>
								<div>
									<p className='text-xs font-bold leading-none'>
										{user?.organization?.name || 'Student Council SBO'}
									</p>
									<p className='text-[10px] text-muted-foreground mt-0.5'>
										Active Semestral Booth
									</p>
								</div>
							</div>
							<Badge className='text-[10px] h-4.5 px-1.5'>
								Active Shift
							</Badge>
						</div>

						{/* Mock Buttons */}
						<div className='space-y-1.5'>
							<p className='text-[10px] uppercase font-semibold text-muted-foreground tracking-wider'>
								Interactive Buttons
							</p>
							<div className='flex flex-wrap gap-2'>
								<Button size='sm' className='h-7 text-xs gap-1 shadow-xs'>
									<Plus className='w-3 h-3' />
									Record Payment
								</Button>
								<Button size='sm' variant='secondary' className='h-7 text-xs'>
									Scan ID
								</Button>
								<Button size='sm' variant='outline' className='h-7 text-xs'>
									Roster
								</Button>
							</div>
						</div>

						{/* Mock Progress Bar */}
						<div className='space-y-1.5'>
							<div className='flex justify-between text-xs'>
								<span className='font-medium text-muted-foreground'>
									Target Fund Collection
								</span>
								<span className='font-semibold tabular-nums text-foreground'>
									83%
								</span>
							</div>
							<Progress value={83} className='h-2' />
						</div>

						{/* Mock Transaction Card */}
						<div className='p-3 rounded-lg border border-border/40 bg-card/60 flex items-center justify-between'>
							<div className='flex items-center gap-2.5'>
								<div className='w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold'>
									<Receipt className='w-3.5 h-3.5' />
								</div>
								<div>
									<p className='text-xs font-semibold text-foreground'>
										John Michael Doe
									</p>
									<p className='text-[10px] text-muted-foreground font-mono'>
										2026-0819 • BSIT
									</p>
								</div>
							</div>
							<div className='text-right'>
								<p className='text-xs font-bold tabular-nums text-foreground'>
									₱250.00
								</p>
								<span className='text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'>
									Cash
								</span>
							</div>
						</div>
					</div>

					<p className='text-[11px] text-muted-foreground/80 italic text-center'>
						Theme colors propagate instantly to headers, sidebars, charts, and buttons.
					</p>
				</div>
			</div>
		</div>
	);
}
