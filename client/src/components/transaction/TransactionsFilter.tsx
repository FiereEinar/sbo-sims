import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  TransactionPeriodFilter,
  TransactionsFilterValues,
} from '@/types/transaction';
import _ from 'lodash';
import { useTransactionFilterStore } from '@/store/transactionsFilter';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect, useState } from 'react';
import { DatePickerWithRange } from '../DatePickerWithRange';
import SchoolYearInput from '../SchoolYearInput';
import SemInput from '../SemInput';
import { Filter, Search } from 'lucide-react';

export default function TransactionsFilter({
  showStatus = false,
}: {
  showStatus?: boolean;
}) {
  const { setPeriod, setStartDate, setEndDate, setSearch, search, setStatus } =
    useTransactionFilterStore((state) => state);

  const [localSearch, setLocalSearch] =
    useState<TransactionsFilterValues['search']>(search);
  const debouncedSearch = useDebounce(localSearch);

  const periodsOptions = [
    { value: 'all', label: 'All' },
    { value: 'today', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' },
  ];

  useEffect(() => {
    setSearch(debouncedSearch ?? '');
  }, [debouncedSearch, setSearch]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full mt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
        <Filter className="w-4 h-4 shrink-0" />
        <span className="font-bold tracking-wide uppercase text-xs shrink-0">
          Filter & Search
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-3 w-full lg:w-auto">
        <div className="relative w-full sm:w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search name or student ID"
            className="pl-9 h-9 rounded-md bg-background border-muted-foreground/20 focus:ring-primary/20 transition-colors shadow-none"
          />
        </div>

        <div className="w-full sm:w-auto">
          <DatePickerWithRange
            hideLabel
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        <div className="w-full sm:w-[130px]">
          <Select
            defaultValue={periodsOptions[0].value}
            onValueChange={(value) =>
              setPeriod(value as TransactionPeriodFilter)
            }
          >
            <SelectTrigger className="h-9 rounded-md bg-background border-muted-foreground/20 shadow-none">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periodsOptions.map((period, i) => (
                <SelectItem key={i} value={period.value}>
                  {_.startCase(period.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-[130px]">
          <SemInput hideLabel />
        </div>

        <div className="w-full sm:w-[150px]">
          <SchoolYearInput hideLabel />
        </div>

        {showStatus && (
          <div className="w-full sm:w-[120px]">
            <Select
              defaultValue="all"
              onValueChange={(value) =>
                setStatus(value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="h-9 rounded-md bg-background border-muted-foreground/20 shadow-none">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}
