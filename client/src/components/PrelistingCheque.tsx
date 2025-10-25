import { Prelisting } from '@/types/prelisting';
import _ from 'lodash';
import Header from './ui/header';

type PrelistingChequeProps = {
	prelisting: Prelisting;
};

export default function PrelistingCheque({
	prelisting,
}: PrelistingChequeProps) {
	const owner = prelisting.owner;
	const ownerFullname = _.startCase(
		`${owner.firstname} ${owner.middlename} ${owner.lastname}`.toLowerCase()
	);

	return (
		<article className='relative flex flex-col gap-5 items-center bg-card/40 border rounded-md w-full p-3'>
			<div className='flex justify-between gap-10 w-full'>
				<div>
					<Header size='md'>{ownerFullname}</Header>
					<p className='text-muted-foreground text-sm'>{owner.studentID}</p>
				</div>
			</div>

			<div className='text-muted-foreground w-full'>
				<p>Date: {new Date(prelisting.date ?? '').toDateString()}</p>
				<p>Prelisting ID: {prelisting._id}</p>
				{prelisting.description && <p>Description: {prelisting.description}</p>}
				{prelisting.category?.details?.map((detail) => (
					<p key={detail}>
						{prelisting.details?.[detail] !== undefined &&
							`${_.startCase(detail)}: ${prelisting.details?.[detail] ?? ''}`}
					</p>
				))}
			</div>

			<div className='flex flex-col w-full'>
				<Header size='sm'>
					{prelisting.category.organization.name}
					{' - '}
					{prelisting.category.name}
				</Header>
			</div>
		</article>
	);
}
