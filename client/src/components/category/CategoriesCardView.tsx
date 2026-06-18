import { useTenantNavigate } from '../../hooks/useTenantNavigate';
import { CategoryWithTransactions } from '@/types/category';
import { numberWithCommas } from '@/lib/utils';
import { BookOpen, Users, DollarSign, Tags } from 'lucide-react';

interface CategoriesCardViewProps {
  categories?: CategoryWithTransactions[];
  isLoading: boolean;
}

export default function CategoriesCardView({
  categories,
  isLoading,
}: CategoriesCardViewProps) {
  const navigate = useTenantNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 shadow-sm animate-pulse h-40"
          ></div>
        ))}
      </div>
    );
  }

  if (!categories?.length) {
    return <p className="text-muted-foreground">No categories found</p>;
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div
          key={category._id}
          onClick={() => navigate(`/category/${category._id}`)}
          className="cursor-pointer rounded-2xl border bg-card/40 p-5 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full text-primary">
                <Tags size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-lg truncate w-40">
                  {category.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate w-40">
                  {category.organization.name}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-medium text-foreground">
                ₱ {numberWithCommas(category.fee)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">
                  Total Transactions:
                </p>
                <p className="font-medium">{category.totalTransactions}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign
                size={20}
                className="text-muted-foreground shrink-0"
              />
              <div>
                <p className="text-muted-foreground text-xs">Amount:</p>
                <p className="font-medium">
                  ₱ {numberWithCommas(category.totalTransactionsAmount)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen size={20} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-muted-foreground text-xs">Category Fee:</p>
                <p className="font-medium">
                  ₱ {numberWithCommas(category.fee)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
