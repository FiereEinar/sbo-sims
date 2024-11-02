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
};

export default function PaginationController({
	currentPage,
	nextPage,
	prevPage,
	setPage,
}: PaginationControllerProps) {
	return (
		<Pagination>
			<PaginationContent>
				<PaginationItem
					onClick={() => {
						if (prevPage === -1) return;
						setPage(currentPage - 1);
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
						}}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
