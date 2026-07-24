import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { SidebarNavLinkType } from '@/constants';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import SidebarLink from './SidebarLink';
import { cn } from '@/lib/utils';

type SidebarGroupProps = {
  link: SidebarNavLinkType;
};

export default function SidebarGroup({ link }: SidebarGroupProps) {
  const location = useLocation();
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const [isOpen, setIsOpen] = useState(false);

  // Check if any child route is currently active
  useEffect(() => {
    if (link.children) {
      const isChildActive = link.children.some((child) => {
        let resolvedPath = child.path;
        if (orgSlug) {
          const cleanPath = child.path.startsWith('/')
            ? child.path.substring(1)
            : child.path;
          resolvedPath = cleanPath ? `/${orgSlug}/${cleanPath}` : `/${orgSlug}`;
        }
        return (
          location.pathname.startsWith(resolvedPath) &&
          resolvedPath !== `/${orgSlug}`
        );
      });
      if (isChildActive) {
        setIsOpen(true);
      }
    }
  }, [location.pathname, link.children, orgSlug]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full space-y-2"
    >
      <CollapsibleTrigger
        className={cn(
          'flex items-center justify-between w-full hover:opacity-90 select-none',
          isOpen ? 'text-primary dark:text-primary' : 'text-muted-foreground',
        )}
      >
        <div className="flex items-center justify-start sm:justify-center md:justify-start gap-2">
          <link.icon className="size-5" />
          <p className="flex sm:hidden md:flex font-semibold">{link.name}</p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200 hidden md:block',
            isOpen && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="flex flex-col gap-5 pl-2 pt-2 data-[state=closed]:hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        {link.children?.map((child, i) => (
          <SidebarLink key={`${child.name}-${i}`} link={child} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
