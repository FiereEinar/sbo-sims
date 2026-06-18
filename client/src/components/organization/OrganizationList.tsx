import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '../ui/button';

type Organization = {
  _id: string;
  name: string;
  slug: string;
};

type OrganizationListProps = {
  type: 'login' | 'signup';
};

export default function OrganizationList({ type }: OrganizationListProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data } = await axiosInstance.get('/auth/organizations');
        console.log(data.data);
        setOrganizations(data.data);
      } catch (error) {
        console.error('Failed to fetch organizations', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <svg
          className="animate-spin size-8 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
      <p className="text-sm text-muted-foreground mb-4">
        Please select your organization to continue to the {type} page.
      </p>

      {organizations.length === 0 ? (
        <p className="text-sm text-center py-4">No organizations found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {organizations.map((org) => (
            <Button
              key={org._id}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4 transition-all hover:border-primary"
              asChild
            >
              <Link to={`/${org.slug}/${type}`}>
                <div className="flex flex-col">
                  <span className="font-semibold">{org.name}</span>
                  <span className="text-xs text-muted-foreground">
                    /{org.slug}/{type}
                  </span>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
