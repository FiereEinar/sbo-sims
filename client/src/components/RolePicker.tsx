import { Role } from '@/types/role';
import ErrorText from './ui/error-text';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import React from 'react';

type RolePickerProps = {
	setRole: React.Dispatch<React.SetStateAction<string | undefined>>;
	roles: Role[];
	error: string | undefined;
	defaultValue?: string;
};
export default function RolePicker({
	setRole,
	roles,
	error,
	defaultValue,
}: RolePickerProps) {
	return (
		<div className='text-muted-foreground space-y-1'>
			<Label>Role:</Label>
			<Select
				defaultValue={defaultValue}
				onValueChange={(value) => setRole(value)}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select a role' />
				</SelectTrigger>
				<SelectContent>
					{roles.map((role) => (
						<SelectItem key={role._id} value={role._id}>
							{role.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <ErrorText>{error}</ErrorText>}
		</div>
	);
}
