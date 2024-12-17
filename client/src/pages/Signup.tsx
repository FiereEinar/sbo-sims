import DarkModeToggle from '@/components/buttons/DarkModeToggle';
import SignupForm from '@/components/forms/SignupForm';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function Signup() {
	return (
		<main className='transition-all bg-background relative h-dvh flex justify-center items-center'>
			<Card className='w-[95%] sm:w-[450px]'>
				<CardHeader>
					<CardTitle>Sign Up</CardTitle>
					<CardDescription>Create an account to proceed.</CardDescription>
				</CardHeader>
				<CardContent>
					<SignupForm />
				</CardContent>
			</Card>
			<div className='absolute right-10 bottom-10 text-muted-foreground'>
				<DarkModeToggle text='Toggle Theme' />
			</div>
		</main>
	);
}
