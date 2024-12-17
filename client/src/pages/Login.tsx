import DarkModeToggle from '@/components/buttons/DarkModeToggle';
import LoginForm from '@/components/forms/LoginForm';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export default function Login() {
	return (
		<main className='transition-all bg-background relative h-dvh flex justify-center items-center'>
			<Card className='w-[95%] sm:w-[450px]'>
				<CardHeader>
					<CardTitle>Login</CardTitle>
					<CardDescription>Enter your credentials to proceed.</CardDescription>
				</CardHeader>
				<CardContent>
					<LoginForm />
				</CardContent>
			</Card>
			<div className='absolute right-10 bottom-10 text-muted-foreground'>
				<DarkModeToggle text='Toggle Theme' />
			</div>
		</main>
	);
}
