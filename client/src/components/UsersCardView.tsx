import { User } from '@/types/user';
import UserCard from './cards/UserCard';

interface UsersCardViewProps {
	users?: User[];
	isLoading: boolean;
}

export default function UsersCardView({
	users,
	isLoading,
}: UsersCardViewProps) {
	if (isLoading) {
		return (
			<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border p-6 shadow-sm animate-pulse h-48'
					/>
				))}
			</div>
		);
	}

	if (!users?.length) {
		return (
			<div className='text-center py-10 text-muted-foreground'>
				No users found
			</div>
		);
	}

	return (
		<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2'>
			{users.map((user) => (
				<UserCard key={user._id} user={user} />
			))}
		</div>
	);
}
