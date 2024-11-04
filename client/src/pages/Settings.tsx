import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';
import UpdateUserForm from '@/components/forms/UpdateUserForm';
import SidebarPageLayout from '@/components/SidebarPageLayout';

export default function Settings() {
	return (
		<SidebarPageLayout>
			<div className='mt-5' />

			<div className='w-dvw'>
				<div className='flex flex-col pb-5 justify-between text-muted-foreground items-end gap-10 w-[800px]'>
					<ApplicationSettingsForm />
					<hr className='w-full' />
					<UpdateUserForm />
				</div>
			</div>
		</SidebarPageLayout>
	);
}
