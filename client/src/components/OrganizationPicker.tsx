import { Organization } from '@/types/organization';
import ErrorText from './ui/error-text';
import { Label } from './ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';

type OrganizationPickerProps = {
	setOrg: React.Dispatch<React.SetStateAction<string | undefined>>;
	organizations: Organization[];
	error: string | undefined;
	defaultValue?: string;
};

export default function OrganizationPicker({
	organizations,
	error,
	setOrg,
	defaultValue,
}: OrganizationPickerProps) {
	return (
		<div className='text-muted-foreground space-y-1'>
			<Label>Organization:</Label>
			<Select
				defaultValue={defaultValue}
				onValueChange={(value) => setOrg(value)}
			>
				<SelectTrigger className='w-full'>
					<SelectValue placeholder='Select an organization' />
				</SelectTrigger>
				<SelectContent>
					{organizations.map((org) => (
						<SelectItem key={org._id} value={org._id}>
							{org.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <ErrorText>{error}</ErrorText>}
		</div>
	);
}
