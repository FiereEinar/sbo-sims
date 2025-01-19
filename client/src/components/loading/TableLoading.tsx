import { TableCell, TableRow } from '../ui/table';
import BouncyLoading from './BouncyLoading';

type TableLoadingProps = {
	text?: string;
	colSpan: number;
};

export default function TableLoading({ colSpan, text }: TableLoadingProps) {
	return (
		<TableRow>
			<TableCell colSpan={colSpan}>
				<BouncyLoading text={text} />
			</TableCell>
		</TableRow>
	);
}
