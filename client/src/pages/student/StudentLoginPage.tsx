import { useState } from 'react';
import AuthPage from '../AuthPage';
import StudentLoginForm from '@/components/forms/StudentLoginForm';
import OrganizationList from '@/components/organization/OrganizationList';
import { Button } from '@/components/ui/button';
import { GraduationCap, Shield, ArrowLeft } from 'lucide-react';

type LoginView = 'chooser' | 'student' | 'officer';

function RoleChooser({ onSelect }: { onSelect: (view: LoginView) => void }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Please select how you'd like to sign in.
      </p>
      <div className="flex flex-col gap-3">
        <Button
          id="btn-login-as-student"
          variant="outline"
          className="w-full justify-start h-auto py-4 px-5 text-left gap-4 hover:border-primary transition-colors"
          onClick={() => onSelect('student')}
        >
          <span className="rounded-xl bg-primary/10 text-primary p-2">
            <GraduationCap className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Login as Student</p>
            <p className="text-xs text-muted-foreground">
              View your transactions and attendance records
            </p>
          </div>
        </Button>

        <Button
          id="btn-login-as-officer"
          variant="outline"
          className="w-full justify-start h-auto py-4 px-5 text-left gap-4 hover:border-primary transition-colors"
          onClick={() => onSelect('officer')}
        >
          <span className="rounded-xl bg-primary/10 text-primary p-2">
            <Shield className="size-5" />
          </span>
          <div>
            <p className="font-semibold text-foreground">Login as Officer</p>
            <p className="text-xs text-muted-foreground">
              Access your organization's management portal
            </p>
          </div>
        </Button>
      </div>
    </div>
  );
}

export default function StudentLoginPage() {
  const [view, setView] = useState<LoginView>('chooser');

  const title =
    view === 'chooser'
      ? 'Welcome Back'
      : view === 'student'
        ? 'Student Login'
        : 'Select Organization';

  const form = (
    <div className="space-y-4">
      {view !== 'chooser' && (
        <button
          onClick={() => setView('chooser')}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back
        </button>
      )}

      {view === 'chooser' && <RoleChooser onSelect={setView} />}
      {view === 'student' && <StudentLoginForm />}
      {view === 'officer' && <OrganizationList type="login" />}
    </div>
  );

  return <AuthPage title={title} form={form} />;
}
