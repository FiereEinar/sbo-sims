import { PropsWithChildren } from 'react';

export default function SidebarPageLayout({ children }: PropsWithChildren) {
  return (
    <div className="animate-appear space-y-5 h-[calc(100dvh-4rem)] relative overflow-x-hidden overflow-y-auto p-6">
      {children}
      <div className="h-5" />
    </div>
  );
}
