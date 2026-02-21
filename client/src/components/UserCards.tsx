import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';
import _ from 'lodash';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

type UserCardsProps = {
	users?: User[];
	isLoading: boolean;
};

export default function UserCards({ users, isLoading }: UserCardsProps) {
	const navigate = useNavigate();

	if (isLoading) {
		return (
			<div className='space-y-4'>
				{Array.from({ length: 6 }).map((_, i) => (
					<div
						key={i}
						className='rounded-2xl border bg-card/50 p-5 shadow-sm flex justify-between items-center'
					>
						<div className='flex flex-1 gap-4'>
							<Skeleton className='h-6 w-24' />
							<Skeleton className='h-6 w-32' />
							<Skeleton className='h-6 w-32' />
							<Skeleton className='h-6 w-24' />
							<Skeleton className='h-6 w-24' />
						</div>
						<Skeleton className='h-6 w-20' />
					</div>
				))}
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{users?.map((user) => (
				<div
					key={user._id}
					className='rounded-2xl border bg-card/50 p-5 shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition'
					onClick={() => navigate(`/user/${user._id}`)}
				>
					<div className='flex flex-1 gap-8 items-center'>
						<div className='flex flex-col'>
							<p className='text-xs text-muted-foreground uppercase'>
								Student ID
							</p>
							<p className='text-sm font-semibold'>{user.studentID}</p>
						</div>

						<div className='flex flex-col'>
							<p className='text-xs text-muted-foreground uppercase'>Name</p>
							<p className='text-sm font-semibold'>
								{_.startCase(user.firstname)} {_.startCase(user.lastname)}
							</p>
						</div>

						<div className='flex flex-col'>
							<p className='text-xs text-muted-foreground uppercase'>Email</p>
							<p className='text-sm'>{user.email ?? '--'}</p>
						</div>

						<div className='flex flex-col'>
							<p className='text-xs text-muted-foreground uppercase'>Role</p>
							<p className='text-sm'>
								{user.rbacRole?.name ?? user.role ?? '--'}
							</p>
						</div>

						<div className='flex flex-col'>
							<p className='text-xs text-muted-foreground uppercase text-right'>
								Joined
							</p>
							<p className='text-sm text-right'>
								{format(new Date(user.createdAt), 'MM/dd/yyyy')}
							</p>
						</div>
					</div>

					<Button
						size='sm'
						variant='ocean'
						onClick={(e) => {
							e.stopPropagation();
							navigate(`/user/${user._id}/edit`);
						}}
					>
						Edit
					</Button>
				</div>
			))}
		</div>
	);
}
