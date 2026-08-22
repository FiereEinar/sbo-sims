import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { useStudentFilterStore } from '@/store/studentsFilter';
import SchoolYearInput from '../SchoolYearInput';
import SemInput from '../SemInput';
import { Filter, Search } from 'lucide-react';

export default function StudentFilter() {
  const { setSearch, search } = useStudentFilterStore((state) => state);

  const [localSearch, setLocalSearch] = useState(search);
  const debouncedSearch = useDebounce(localSearch);

  useEffect(() => {
    setSearch(debouncedSearch ?? '');
  }, [debouncedSearch, setSearch]);

  return (
    <div className="flex flex-col lg:flex-row gap-4  items-start lg:items-center justify-between w-full mt-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
        <Filter className="w-4 h-4" />
        <span className="font-bold tracking-wide uppercase text-xs">
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
            placeholder="Search student ID or fullname"
            className="pl-9 h-9 rounded-md bg-background border-muted-foreground/20 focus:ring-primary/20 transition-colors shadow-none"
          />
        </div>

        <div className="w-full sm:w-[150px]">
          <SemInput hideLabel />
        </div>

        <div className="w-full sm:w-[150px]">
          <SchoolYearInput hideLabel />
        </div>
      </div>
    </div>
  );
}
