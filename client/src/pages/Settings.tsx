import SaveSettingsButton from '@/components/buttons/SaveSettingsButton';
import SettingsForm from '@/components/forms/SettingsForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';

export default function Settings() {
	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Settings</Header>
				<SaveSettingsButton />
			</StickyHeader>

			<p className='text-muted-foreground '>
				Change current School Year and Current Semester here. Make sure to click
				'Save Changes'!
			</p>

			<div className='flex justify-between text-muted-foreground items-end flex-wrap gap-3 w-[1000px]'>
				<SettingsForm />
			</div>
		</SidebarPageLayout>
	);
}
