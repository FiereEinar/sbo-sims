import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { User } from '@/types/user';
import _ from 'lodash';
import UpdateUserForm from './forms/UpdateUserForm';
import UpdateUserPasswordForm from './forms/UpdateUserPasswordForm';
import { Separator } from '@radix-ui/react-select';

interface UserProfileSheetProps {
	user: User | null;
}

export default function UserProfileSheet({ user }: UserProfileSheetProps) {
	if (!user) return null;

	return (
		<Sheet>
			<SheetTrigger className='flex items-center gap-2 hover:bg-accent p-2 rounded-md transition-colors'>
				<div className='text-right hidden sm:block'>
					<p className='text-sm font-semibold text-foreground'>
						{_.startCase(`${user.firstname} ${user.lastname}`)}
					</p>
					<p className='text-xs text-muted-foreground'>{user.studentID}</p>
				</div>
				<div className='size-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold'>
					{user.firstname.charAt(0).toUpperCase()}
				</div>
			</SheetTrigger>
			<SheetContent className='overflow-y-auto w-full sm:max-w-md'>
				<SheetHeader className='mb-6 text-left'>
					<SheetTitle>Manage Account</SheetTitle>
					<SheetDescription>
						Update your account details and password.
					</SheetDescription>
				</SheetHeader>

				<div className='space-y-6'>
					<UpdateUserForm />
					<Separator className='h-px bg-border' />
					<UpdateUserPasswordForm />
				</div>
			</SheetContent>
		</Sheet>
	);
}
