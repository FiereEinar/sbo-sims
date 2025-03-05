import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from './ui/pagination';

type PaginationControllerProps = {
	prevPage: number;
	nextPage: number;
	currentPage: number;
	setPage: (page: number) => void;
	prefetchFn?: (page: number) => void;
};

export default function PaginationController({
	currentPage,
	nextPage,
	prevPage,
	setPage,
	prefetchFn,
}: PaginationControllerProps) {
	// prefetch the 2nd page when in 1st page
	if (currentPage === 1) {
		if (prefetchFn) prefetchFn(currentPage + 1);
	}

	return (
		<Pagination className='select-none'>
			<PaginationContent>
				<PaginationItem
					onClick={() => {
						if (prevPage === -1) return;
						setPage(currentPage - 1);
						if (currentPage - 2 > 0 && prefetchFn) prefetchFn(currentPage - 2);
					}}
				>
					<PaginationPrevious />
				</PaginationItem>

				<PaginationItem>
					{prevPage === -1 ? (
						<PaginationEllipsis />
					) : (
						<PaginationLink>{prevPage}</PaginationLink>
					)}
				</PaginationItem>

				<PaginationItem>
					<PaginationLink isActive>{currentPage}</PaginationLink>
				</PaginationItem>

				<PaginationItem>
					{nextPage === -1 ? (
						<PaginationEllipsis />
					) : (
						<PaginationLink>{nextPage}</PaginationLink>
					)}
				</PaginationItem>

				<PaginationItem>
					<PaginationNext
						onClick={() => {
							if (nextPage === -1) return;
							setPage(currentPage + 1);
							if (prefetchFn) prefetchFn(currentPage + 2);
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
