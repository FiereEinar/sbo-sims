import {
	FieldErrors,
	FieldValues,
	Path,
	UseFormRegister,
} from 'react-hook-form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import ErrorText from './ui/error-text';

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
	return (
		<div className='space-y-1 text-muted-foreground w-full'>
			<Label htmlFor={id}>{label}</Label>
			<Input
				disabled={isDisabled}
				{...registerFn(name)}
				type={type}
				autoComplete={autoComplete ? 'on' : 'off'}
				// onChange={onChange}
				onKeyDownCapture={onChange}
				id={id}
				placeholder={placeholder}
			/>
			{errors[name] && errors[name].message && (
				<ErrorText>{errors[name].message.toString()}</ErrorText>
			)}
		</div>
	);
}
