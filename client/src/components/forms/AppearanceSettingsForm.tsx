import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useThemeStore } from '@/store/themeStore';
import { Check, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

const PRESETS = [
	{ name: 'Blue', value: '221.2 83.2% 53.3%' },
	{ name: 'Green', value: '142.1 76.2% 36.3%' },
	{ name: 'Red', value: '346.8 77.2% 49.8%' },
	{ name: 'Orange', value: '24.6 95% 53.1%' },
	{ name: 'Purple', value: '262.1 83.3% 57.8%' },
];

function hexToHSL(hex: string): string {
	let r = 0, g = 0, b = 0;
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

	let cmin = Math.min(r, g, b),
		cmax = Math.max(r, g, b),
		delta = cmax - cmin,
		h = 0,
		s = 0,
		l = 0;

	if (delta == 0) h = 0;
	else if (cmax == r) h = ((g - b) / delta) % 6;
	else if (cmax == g) h = (b - r) / delta + 2;
	else h = (r - g) / delta + 4;

	h = Math.round(h * 60);
	if (h < 0) h += 360;

	l = (cmax + cmin) / 2;
	s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
	s = +(s * 100).toFixed(1);
	l = +(l * 100).toFixed(1);

	return `${h} ${s}% ${l}%`;
}

function hslToHex(hslStr: string): string {
	if (!hslStr) return '#000000';
	const parts = hslStr.split(' ');
	if (parts.length !== 3) return '#000000';

	let h = parseFloat(parts[0]);
	let s = parseFloat(parts[1]) / 100;
	let l = parseFloat(parts[2]) / 100;

	let c = (1 - Math.abs(2 * l - 1)) * s,
		x = c * (1 - Math.abs((h / 60) % 2 - 1)),
		m = l - c / 2,
		r = 0,
		g = 0,
		b = 0;

	if (0 <= h && h < 60) { r = c; g = x; b = 0; }
	else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
	else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
	else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
	else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
	else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

	const rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
	const gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
	const bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

	return `#${rHex}${gHex}${bHex}`;
}

export default function AppearanceSettingsForm() {
	const { primaryColor, setPrimaryColor } = useThemeStore();
	const [hexColor, setHexColor] = useState('#000000');

	useEffect(() => {
		if (primaryColor) {
			setHexColor(hslToHex(primaryColor));
		} else {
			setHexColor('#171717');
		}
	}, [primaryColor]);

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const hex = e.target.value;
		setHexColor(hex);
		setPrimaryColor(hexToHSL(hex));
	};

	const isCustom = primaryColor && !PRESETS.find(p => p.value === primaryColor);

	return (
		<Card className='bg-card/40'>
			<CardHeader>
				<CardTitle>Appearance Settings</CardTitle>
				<CardDescription>
					Customize the look and feel of the application.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<Label>Primary Color</Label>
					<p className="text-sm text-muted-foreground">
						Choose a preset color or pick a custom color.
					</p>
					<div className="flex flex-wrap gap-4 items-center">
						<button
							onClick={() => setPrimaryColor(null)}
							className={`relative flex flex-col items-center justify-center gap-2 transition-all ${primaryColor === null ? 'scale-110 opacity-100' : 'opacity-70 hover:opacity-100'}`}
							title="Default"
						>
							<div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${primaryColor === null ? 'border-primary bg-primary/10' : 'border-border bg-muted'}`}>
								<RotateCcw className="h-5 w-5" />
							</div>
							<span className="text-xs font-medium">Default</span>
						</button>

						<div className="w-[1px] h-10 bg-border mx-1" />

						{PRESETS.map((preset) => {
							const isSelected = primaryColor === preset.value;
							return (
								<button
									key={preset.name}
									onClick={() => setPrimaryColor(preset.value)}
									className={`relative flex flex-col items-center justify-center gap-2 transition-all ${isSelected ? 'scale-110 opacity-100' : 'opacity-70 hover:opacity-100'}`}
									title={preset.name}
								>
									<div 
										className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${isSelected ? 'border-primary' : 'border-transparent shadow-sm'}`}
										style={{ backgroundColor: `hsl(${preset.value})` }}
									>
										{isSelected && <Check className="h-5 w-5 text-white mix-blend-difference" />}
									</div>
									<span className="text-xs font-medium">{preset.name}</span>
								</button>
							);
						})}

						<div className="relative flex flex-col items-center justify-center gap-2 transition-all ml-2">
							<label htmlFor="custom-color" className={`cursor-pointer ${isCustom ? 'scale-110 opacity-100' : 'opacity-70 hover:opacity-100'}`}>
								<div 
									className={`flex h-12 w-12 items-center justify-center rounded-full border-2 overflow-hidden shadow-sm ${isCustom ? 'border-primary' : 'border-transparent'}`} 
									style={{ backgroundColor: hexColor }}
								>
									<input
										id="custom-color"
										type="color"
										value={hexColor}
										onChange={handleColorChange}
										className="h-16 w-16 opacity-0 cursor-pointer absolute"
									/>
									{isCustom && (
										<Check className="h-5 w-5 text-white mix-blend-difference z-10 pointer-events-none" />
									)}
								</div>
							</label>
							<span className="text-xs font-medium">Custom</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
