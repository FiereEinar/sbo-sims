import { useForm } from 'react-hook-form';
import InputField from '../InputField';
import { Button } from '../ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ErrorText from '../ui/error-text';
import { submitLoginForm } from '@/api/user';
import { Link, useNavigate } from 'react-router-dom';
import { loginSchema } from '@/lib/validations/loginSchema';
import { useUserStore } from '@/store/user';

export type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
	const navigate = useNavigate();
	const setUser = useUserStore((state) => state.setUser);

	const {
		register,
		handleSubmit,
		setError,
		formState: { errors, isSubmitting },
	} = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

	const onSubmit = async (data: LoginFormValues) => {
		try {
			const result = await submitLoginForm(data);
			const strictDevices = ['mobile', 'tablet'];

			if (result) {
				if (strictDevices.includes(result.data.device)) {
					localStorage.setItem('accessToken', result.data.accessToken);
				}

				setUser(result.data.user);
			}
			navigate('/');
		} catch (err: any) {
			setError('root', {
				message: err.message || 'Failed to submit signup form',
			});
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-3'>
			<div>
				<InputField<LoginFormValues>
					name='studentID'
					id='studentID'
					label='Student ID:'
					registerFn={register}
					errors={errors}
				/>
				<InputField<LoginFormValues>
					name='password'
					id='password'
					label='Password:'
					type='password'
					registerFn={register}
					errors={errors}
				/>
			</div>

			{errors.root && errors.root.message && (
				<ErrorText>{errors.root.message.toString()}</ErrorText>
			)}

			<div className='text-xs text-muted-foreground flex gap-1'>
				<p>Don't have an account?</p>
				<Link to='/signup' className='underline'>
					Sign up
				</Link>
			</div>

			<div className='flex justify-end'>
				<Button disabled={isSubmitting}>Submit</Button>
			</div>
		</form>
	);
}
