import ApplicationSettingsForm from '@/components/forms/ApplicationSettingsForm';

export default function AdminSettings() {
  return (
    <div className="p-6 md:p-8 min-h-full">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
          Global Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure the default school year and semester for all new sessions.
        </p>
      </div>

      <div className="max-w-2xl">
        <ApplicationSettingsForm />
      </div>
    </div>
  );
}
