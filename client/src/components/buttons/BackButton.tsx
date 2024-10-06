import { useNavigate } from 'react-router-dom';
import GetIcon from '../icons/get-icon';

export default function BackButton() {
	const navigate = useNavigate();

	return (
		<button
			className='flex items-center gap-1 text-muted-foreground'
			onClick={() => navigate(-1)}
		>
			<GetIcon iconKey='back' />
			<p className='hover:underline'>Back</p>
		</button>
	);
}
