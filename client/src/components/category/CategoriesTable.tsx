import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableFooter,
  Table,
} from '../ui/table';
import { CategoryWithTransactions } from '@/types/category';
import { useEffect, useState } from 'react';
import { numberWithCommas } from '@/lib/utils';
import TableLoading from '../loading/TableLoading';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

type SortOption =
  | 'none'
  | 'name_asc'
  | 'name_desc'
  | 'fee_asc'
  | 'fee_desc'
  | 'total_asc'
  | 'total_desc'
  | 'amount_asc'
  | 'amount_desc';

interface CategoriesTableProps {
  categories?: CategoryWithTransactions[];
  isLoading: boolean;
}

export default function CategoriesTable({
  categories,
  isLoading,
}: CategoriesTableProps) {
  const [totalAmount, setTotalAmount] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('none');
  const navigate = useTenantNavigate();

  useEffect(() => {
    if (categories) {
      setTotalAmount(
        categories.reduce((prev, curr) => {
          return prev + curr.totalTransactionsAmount;
        }, 0),
      );
    }
  }, [categories, setTotalAmount]);
  const sortedCategories = categories
    ? [...categories].sort((a, b) => {
        switch (sortBy) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          case 'fee_asc':
            return a.fee - b.fee;
          case 'fee_desc':
            return b.fee - a.fee;
          case 'total_asc':
            return a.totalTransactions - b.totalTransactions;
          case 'total_desc':
            return b.totalTransactions - a.totalTransactions;
          case 'amount_asc':
            return a.totalTransactionsAmount - b.totalTransactionsAmount;
          case 'amount_desc':
            return b.totalTransactionsAmount - a.totalTransactionsAmount;
          default:
            return 0;
        }
      })
    : undefined;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {/* <TableHead className="w-[200px]">Organization</TableHead> */}
          <TableHead className="w-[400px]">
            <Select
              value={['name_asc', 'name_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Category name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Category name</SelectItem>
                <SelectItem value="name_asc">Name: A-Z</SelectItem>
                <SelectItem value="name_desc">Name: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[200px]">
            <Select
              value={['fee_asc', 'fee_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Category fee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Category fee</SelectItem>
                <SelectItem value="fee_asc">Fee: Low to High</SelectItem>
                <SelectItem value="fee_desc">Fee: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[200px]">
            <Select
              value={['total_asc', 'total_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pl-0 focus:ring-0 font-semibold text-muted-foreground">
                <SelectValue placeholder="Total transactions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Total transactions</SelectItem>
                <SelectItem value="total_asc">Transactions: Low to High</SelectItem>
                <SelectItem value="total_desc">Transactions: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
          <TableHead className="w-[200px] text-right">
            <Select
              value={['amount_asc', 'amount_desc'].includes(sortBy) ? sortBy : 'none'}
              onValueChange={(v) => setSortBy(v as SortOption)}
            >
              <SelectTrigger className="w-full border-none pr-0 focus:ring-0 font-semibold text-muted-foreground justify-end [&>span]:text-right">
                <SelectValue placeholder="Total amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Total amount</SelectItem>
                <SelectItem value="amount_asc">Amount: Low to High</SelectItem>
                <SelectItem value="amount_desc">Amount: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {isLoading && <TableLoading colSpan={4} />}
        {!categories?.length && !isLoading && (
          <TableRow>
            <TableCell colSpan={4}>No categories</TableCell>
          </TableRow>
        )}
        {sortedCategories &&
          sortedCategories.map((category) => (
            <TableRow
              className="cursor-pointer"
              onClick={() => navigate(`/category/${category._id}`)}
              key={category._id}
            >
              {/* <TableCell className="">{category.organization.name}</TableCell> */}
              <TableCell className="">{category.name}</TableCell>
              <TableCell className="">
                {numberWithCommas(category.fee)}
              </TableCell>
              <TableCell className="">{category.totalTransactions}</TableCell>
              <TableCell className="text-right">
                {numberWithCommas(category.totalTransactionsAmount)}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">
            {numberWithCommas(totalAmount)}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
