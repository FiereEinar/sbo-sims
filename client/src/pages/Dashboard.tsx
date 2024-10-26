import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';

export default function Dashboard() {
	return (
		<SidebarPageLayout>
			<div className='mt-5' />
			<StickyHeader>
				<Header>Dashboard</Header>
			</StickyHeader>

			<div className='flex justify-between items-end flex-wrap gap-3'>
				<p>Hello from dashboard!</p>
			</div>
		</SidebarPageLayout>
	);
}
