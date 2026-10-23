import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Info,
  Trash2,
  Save,
} from 'lucide-react';
import { fetchOrgEmailConfig, updateOrgEmailConfig } from '@/api/organization';
import { QUERY_KEYS } from '@/constants';
import { useToast } from '@/hooks/use-toast';

export default function OrgEmailConfigForm() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [emailUser, setEmailUser] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // ─── Load current config ───────────────────────────────────────────────────
  const {
    data: config,
    isLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.ORG_EMAIL_CONFIG],
    queryFn: fetchOrgEmailConfig,
    retry: false,
  });

  // ─── Save mutation ─────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: updateOrgEmailConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_EMAIL_CONFIG] });
      setEmailUser('');
      setEmailPass('');
      toast({
        title: 'Email configuration saved',
        description: 'Your organization email settings have been updated successfully.',
      });
    },
    onError: (err: any) => {
      toast({
        variant: 'destructive',
        title: 'Failed to save email configuration',
        description: err?.response?.data?.message ?? 'Please try again later.',
      });
    },
  });

  // ─── Clear mutation ────────────────────────────────────────────────────────
  const clearMutation = useMutation({
    mutationFn: () => updateOrgEmailConfig({ emailUser: '', emailPass: '' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ORG_EMAIL_CONFIG] });
      setIsClearing(false);
      toast({
        title: 'Email configuration cleared',
        description: 'Automated emails will be disabled until reconfigured.',
      });
    },
    onError: (err: any) => {
      setIsClearing(false);
      toast({
        variant: 'destructive',
        title: 'Failed to clear email configuration',
        description: err?.response?.data?.message ?? 'Please try again later.',
      });
    },
  });

  const handleSave = () => {
    if (!emailUser.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email address required',
        description: 'Please enter a valid Gmail address.',
      });
      return;
    }
    if (!emailUser.includes('@')) {
      toast({
        variant: 'destructive',
        title: 'Invalid email address',
        description: 'Please enter a valid email address with @.',
      });
      return;
    }
    if (!emailPass.trim() && !config?.hasEmailPass) {
      toast({
        variant: 'destructive',
        title: 'App password required',
        description: 'An App password is required for initial configuration.',
      });
      return;
    }

    const payload: { emailUser?: string; emailPass?: string } = {
      emailUser: emailUser.trim(),
    };
    // Only include password if user typed one; empty = keep existing
    if (emailPass.trim()) {
      payload.emailPass = emailPass.trim();
    }

    saveMutation.mutate(payload);
  };

  const handleClear = () => {
    setIsClearing(true);
    clearMutation.mutate();
  };

  const isConfigured = config?.emailUser && config?.hasEmailPass;
  const isSaving = saveMutation.isPending;

  return (
    <div className="space-y-4">
      {/* ── Status banner ── */}
      {!isLoading && (
        <>
          {!isConfigured ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h5 className="font-semibold text-sm leading-none">Email Not Configured</h5>
                <p className="text-sm leading-relaxed">
                  No sender email is set up for this organization. Email features such as{' '}
                  <strong>transaction receipts</strong> and <strong>payment request notifications</strong>{' '}
                  will be <strong>silently skipped</strong> until you configure one below.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h5 className="font-semibold text-sm leading-none">Email Configured</h5>
                <p className="text-sm leading-relaxed flex items-center gap-2 flex-wrap">
                  Emails will be sent from{' '}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {config?.emailUser}
                  </Badge>
                  using your organization's Gmail App Password.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Config card ── */}
      <Card className="bg-card/40 shadow-none">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Sender Email Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure the Gmail account that sends automated emails (transaction receipts,
            payment notifications) on behalf of your organization.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Security note */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
            <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Your App Password is <strong>encrypted with AES-256-GCM</strong> before being stored.
              It is never exposed in any API response.
            </p>
          </div>

          {/* Current status */}
          {isLoading && (
            <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
          )}

          {/* Form fields */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-user-input">Gmail Address</Label>
              <Input
                id="email-user-input"
                type="email"
                autoComplete="off"
                placeholder={config?.emailUser ?? 'yourorg@gmail.com'}
                value={emailUser}
                onChange={(e) => setEmailUser(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-xs text-muted-foreground">
                The Gmail account that will appear as the sender.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-pass-input">
                Gmail App Password
                {config?.hasEmailPass && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (leave blank to keep existing)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="email-pass-input"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={config?.hasEmailPass ? '••••••••••••••••' : 'xxxx xxxx xxxx xxxx'}
                  value={emailPass}
                  onChange={(e) => setEmailPass(e.target.value)}
                  disabled={isSaving}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* How-to hint */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>
                  Use a Gmail <strong>App Password</strong>, not your regular account password.
                  Generate one at{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    myaccount.google.com/apppasswords
                  </a>
                  . You must have 2-Step Verification enabled.
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              id="save-email-config-btn"
              onClick={handleSave}
              disabled={isSaving || isClearing}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving…' : 'Save Configuration'}
            </Button>

            {isConfigured && (
              <Button
                id="clear-email-config-btn"
                variant="outline"
                className="gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleClear}
                disabled={isSaving || isClearing || clearMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {isClearing ? 'Clearing…' : 'Clear Configuration'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
