import { useForm } from 'react-hook-form';
import InputField from '../InputField';
import { Button } from '../ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signupSchema } from '@/lib/validations/signupSchema';
import ErrorText from '../ui/error-text';
import { submitSignupForm } from '@/api/user';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
	const { toast } = useToast();
	const navigate = useNavigate();

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<SignupFormValues>({ resolver: zodResolver(signupSchema) });

	const onSubmit = async (data: SignupFormValues) => {
		try {
			await submitSignupForm(data);

			toast({
				title: 'Signed up successfully!',
				description: 'Login with your created account to proceed.',
			});
			navigate('/login');
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit signup form',
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
			<div>
				<InputField<SignupFormValues>
					name='studentID'
					id='studentID'
					label='Student ID:'
					registerFn={register}
					errors={errors}
				/>
				<div className='flex justify-between gap-2'>
					<InputField<SignupFormValues>
						name='firstname'
						id='firstname'
						label='First name:'
						registerFn={register}
						errors={errors}
					/>
					<InputField<SignupFormValues>
						name='lastname'
						id='lastname'
						label='Last name:'
						registerFn={register}
						errors={errors}
					/>
				</div>
				<InputField<SignupFormValues>
					name='password'
					id='password'
					label='Password:'
					type='password'
					registerFn={register}
					errors={errors}
				/>
				<InputField<SignupFormValues>
					name='confirmPassword'
					id='confirmPassword'
					label='Confirm Password:'
					type='password'
					registerFn={register}
					errors={errors}
				/>
			</div>

			{errors.root && errors.root.message && (
				<ErrorText>{errors.root.message.toString()}</ErrorText>
			)}

			<div className='text-xs text-muted-foreground flex gap-1'>
				<p>Already have an account?</p>
				<Link to='/login' className='underline'>
					Log in
				</Link>
			</div>

			<div className='flex justify-end'>
				<Button disabled={isSubmitting}>Submit</Button>
			</div>
		</form>
	);
}
