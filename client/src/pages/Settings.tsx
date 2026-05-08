import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import Header from '@/components/ui/header';

export default function Settings() {
	return (
		<SidebarPageLayout>
			<div className='w-full max-w-3xl space-y-6'>
				<div>
					<Header>Settings</Header>
					<p className='text-muted-foreground text-sm'>
						Manage application configuration and your personal account details.
					</p>
				</div>

				<ApplicationSettingsForm />
			</div>
		</SidebarPageLayout>
	);
}
