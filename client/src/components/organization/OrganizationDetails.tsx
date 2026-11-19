import { Organization } from '@/types/organization';
import { Badge } from '../ui/badge';
import _ from 'lodash';
import { Briefcase, Crown, Scale, Wallet, ShieldCheck } from 'lucide-react';

type OrganizationDetailsProps = {
  organization: Organization;
};

export default function OrganizationDetails({
  organization,
}: OrganizationDetailsProps) {
  const officers = [
    { label: 'Governor', value: organization.governor, icon: Crown },
    { label: 'Vice Governor', value: organization.viceGovernor, icon: ShieldCheck },
    { label: 'Treasurer', value: organization.treasurer, icon: Wallet },
    { label: 'Auditor', value: organization.auditor, icon: Scale },
  ];

  return (
    <div className="space-y-4">
      {/* Leadership */}
      <div className="rounded-2xl border bg-card/50 p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Crown size={15} />
          </div>
          <div>
            <h2 className="font-semibold leading-none">Leadership</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Current organization officers</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {officers.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
                <p className="font-medium text-sm truncate">{_.startCase(value) || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments */}
      {organization.departments && organization.departments.length > 0 && (
        <div className="rounded-2xl border bg-card/50 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Briefcase size={15} />
            </div>
            <div>
              <h2 className="font-semibold leading-none">Departments</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {organization.departments.length} department{organization.departments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {organization.departments.map((department) => (
              <Badge key={department} variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {department}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
