import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';
import UpdateUserForm from '@/components/forms/UpdateUserForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import Header from '@/components/ui/header';

export default function Settings() {
	return (
		<SidebarPageLayout>
			<div className='w-[93dvw]'>
				<div className='flex flex-col pb-5 justify-between text-muted-foreground items-start gap-5 md:w-[800px]'>
					<Header>Settings</Header>
					<hr className='w-full' />
					<ApplicationSettingsForm />
					<UpdateUserForm />
				</div>
			</div>
		</SidebarPageLayout>
	);
}
