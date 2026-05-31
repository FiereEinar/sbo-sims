import { Label } from '../ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { getYear } from 'date-fns';
import Header from '../ui/header';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { fetchSettings, updateSettings } from '@/api/setting';
import { AppSetting } from '@/types/appSetting';
import { Loader2 } from 'lucide-react';
import { useUserStore } from '@/store/user';

export default function ApplicationSettingsForm() {
	const { toast } = useToast();
	const currentUser = useUserStore((state) => state.user);

	const [settings, setSettings] = useState<AppSetting | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		const loadSettings = async () => {
			try {
				const data = await fetchSettings();
				setSettings(data);
			} catch (err) {
				console.error('Failed to load settings', err);
			} finally {
				setIsLoading(false);
			}
		};
		loadSettings();
	}, []);

	const onSave = async () => {
		if (!settings) return;
		try {
			setIsSaving(true);
			const updated = await updateSettings(settings);
			setSettings(updated);
			toast({ title: 'Application settings saved successfully!' });
		} catch (err: any) {
			console.error('Failed to save settings', err);
			toast({
				title: 'Failed to save settings',
				description: err.message || 'An error occured while saving settings',
				variant: 'destructive',
			});
		} finally {
			setIsSaving(false);
		}
	};

	if (isLoading) {
		return (
			<section className='bg-card/40 border rounded-lg p-4 space-y-4 flex justify-center items-center h-40'>
				<Loader2 className='size-8 animate-spin text-muted-foreground' />
			</section>
		);
	}

	return (
		<section className='bg-card/40 border rounded-lg p-4 space-y-4'>
			<div>
				<Header size='sm'>Application Settings</Header>
				<p className='text-sm text-muted-foreground'>
					Configure the default global active school year and semester for the system.
				</p>
			</div>

			<div className='grid gap-4 sm:grid-cols-2'>
				<div className='space-y-1'>
					<Label>School Year</Label>
					<Input
						type='number'
						value={
							settings?.activeSchoolYear
								? parseInt(settings.activeSchoolYear)
								: getYear(new Date())
						}
						onChange={(e) =>
							setSettings((prev) =>
								prev
									? { ...prev, activeSchoolYear: e.target.value }
									: { _id: '', activeSchoolYear: e.target.value, activeSemester: '1' }
							)
						}
					/>
				</div>

				<div className='space-y-1'>
					<Label>Semester</Label>
					<Select
						value={settings?.activeSemester ?? '1'}
						onValueChange={(value) =>
							setSettings((prev) =>
								prev
									? { ...prev, activeSemester: value }
									: { _id: '', activeSchoolYear: getYear(new Date()).toString(), activeSemester: value }
							)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder='Select semester' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='1'>1st Semester</SelectItem>
							<SelectItem value='2'>2nd Semester</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			{currentUser?.studentID === '2301106533' && (
				<div className='space-y-1 pt-4 border-t'>
					<Label>Healthcheck Message (Admin Only)</Label>
					<Input
						type='text'
						placeholder='Leave empty for no message'
						value={settings?.healthcheckMessage ?? ''}
						onChange={(e) =>
							setSettings((prev) =>
								prev
									? { ...prev, healthcheckMessage: e.target.value }
									: { _id: '', activeSchoolYear: getYear(new Date()).toString(), activeSemester: '1', healthcheckMessage: e.target.value }
							)
						}
					/>
					<p className='text-xs text-muted-foreground'>
						This message is displayed on the server's root healthcheck route.
					</p>
				</div>
			)}

			<div className='flex justify-end pt-2'>
				<Button size='sm' onClick={onSave} disabled={isSaving || !settings}>
					{isSaving ? (
						<>
							<Loader2 className='mr-2 size-4 animate-spin' /> Saving...
						</>
					) : (
						'Save Application Settings'
					)}
				</Button>
			</div>
		</section>
	);
}
