import { useEffect, useState } from 'react';
import {
  Joyride,
  EventData,
  STATUS,
  Step,
  EVENTS,
  ACTIONS,
} from 'react-joyride';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@/store/user';
import { completeOnboarding } from '@/api/user';
import { useMutation } from '@tanstack/react-query';
import { useThemeStore } from '@/store/themeStore';

const steps: Step[] = [
  {
    target: 'body',
    content:
      'Welcome! Let’s get you started. Note that student list, collection data, and attendance data are recorded per semester and school year.',
    placement: 'center',
    skipBeacon: true,
  },
  {
    target: '#nav-link-settings',
    content:
      'Select the correct semester and school year in Settings. This dropdown is also available in every module page.',
    skipBeacon: true,
  },
  {
    target: '#nav-link-students',
    content:
      'Import your student list in the Students page. This student list is needed for transaction and attendance recording.',
    skipBeacon: true,
  },
  {
    target: '#nav-link-transactions',
    content:
      'To record a transaction, create a category/collection for it first, then go to the transactions page to record.',
    skipBeacon: true,
  },
  {
    target: '#nav-link-events',
    content:
      'To record an attendance, create an event first, click the event, create a session within that event, then start recording.',
    skipBeacon: true,
  },
];

export default function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setUser } = useUserStore();
  const { primaryColor } = useThemeStore();
  const [run, setRun] = useState(false);
  const navigate = useNavigate();
  const { orgSlug } = useParams<{ orgSlug: string }>();

  // Map step index to the target route path
  const stepRoutes = ['', 'settings', 'student', 'transaction', 'events'];

  useEffect(() => {
    if (user && user.role === 'org-admin' && !user.isOnboardingCompleted) {
      setRun(true);
    }
  }, [user]);

  const completeMutation = useMutation({
    mutationFn: () => completeOnboarding(),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, isOnboardingCompleted: true });
      }
    },
  });

  const handleJoyrideEvent = (data: EventData) => {
    const { status, type, action, index } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      completeMutation.mutate();
      if (orgSlug) navigate(`/${orgSlug}`);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        const nextPath = stepRoutes[index + 1];
        if (nextPath !== undefined && orgSlug) {
          navigate(nextPath ? `/${orgSlug}/${nextPath}` : `/${orgSlug}`);
        }
      } else if (action === ACTIONS.PREV) {
        const prevPath = stepRoutes[index - 1];
        if (prevPath !== undefined && orgSlug) {
          navigate(prevPath ? `/${orgSlug}/${prevPath}` : `/${orgSlug}`);
        }
      }
    }
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        options={{
          showProgress: true,
          primaryColor: primaryColor || '#7c3aed',
          zIndex: 10000,
        }}
        onEvent={handleJoyrideEvent}
      />
      {children}
    </>
  );
}
