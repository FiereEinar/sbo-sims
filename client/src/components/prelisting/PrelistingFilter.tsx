import { useDebounce } from '@/hooks/useDebounce';
import { usePrelistingFilterStore } from '@/store/prelistingFilter';
import { PrelistingFilterValues } from '@/types/prelisting';
import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { DatePickerWithRange } from '../DatePickerWithRange';
import SchoolYearInput from '../SchoolYearInput';
import SemInput from '../SemInput';
import { Filter, Search } from 'lucide-react';

export default function PrelistingFilter() {
  const { setStartDate, setEndDate, setSearch, search } =
    usePrelistingFilterStore((state) => state);

  const [localSearch, setLocalSearch] =
    useState<PrelistingFilterValues['search']>(search);

  const debouncedSearch = useDebounce(localSearch);

  useEffect(() => {
    setSearch(debouncedSearch ?? '');
  }, [debouncedSearch, setSearch]);

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between w-full mt-2 mb-4">
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
          <SemInput hideLabel />
        </div>

        <div className="w-full sm:w-[150px]">
          <SchoolYearInput hideLabel />
        </div>
      </div>
    </div>
  );
}
