import { useState } from 'react';
import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from 'react-hook-form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import ErrorText from './ui/error-text';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps<T extends FieldValues> {
	label: string;
	name: Path<T>;
	registerFn: UseFormRegister<T>;
	errors: FieldErrors<T>;
	type?: React.HTMLInputTypeAttribute | undefined;
	placeholder?: string;
	id: string;
	onChange?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	autoComplete?: boolean;
	isDisabled?: boolean;
}

export default function InputField<T extends FieldValues>({
	placeholder,
	registerFn,
	name,
	label,
	id,
	type,
	errors,
	onChange,
	autoComplete = true,
	isDisabled = false,
}: InputFieldProps<T>) {
	const [showPassword, setShowPassword] = useState(false);
	const isPassword = type === 'password';
	const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

	return (
		<div className='space-y-1 text-muted-foreground w-full'>
			<Label htmlFor={id}>{label}</Label>
			<div className="relative">
				<Input
					disabled={isDisabled}
					{...registerFn(name)}
					type={inputType}
					autoComplete={autoComplete ? 'on' : 'off'}
					onKeyDownCapture={onChange}
					id={id}
					placeholder={placeholder}
					className={isPassword ? 'pr-10' : ''}
				/>
				{isPassword && (
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
						tabIndex={-1}
					>
						{showPassword ? (
							<EyeOff className="w-4 h-4" />
						) : (
							<Eye className="w-4 h-4" />
						)}
					</button>
				)}
			</div>
			{errors[name] && errors[name].message && (
				<ErrorText>{errors[name].message.toString()}</ErrorText>
			)}
		</div>
	);
}
