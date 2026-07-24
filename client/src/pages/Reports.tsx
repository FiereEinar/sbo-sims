import { useState } from 'react';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import Header from '@/components/ui/header';
import SchoolYearInput from '@/components/SchoolYearInput';
import SemInput from '@/components/SemInput';
import { FileDown } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/store/user';
import HasPermission from '@/components/HasPermission';
import { MODULES } from '@/constants';
import FinancialReportsView from '@/components/reports/FinancialReportsView';
import AttendanceReportsView from '@/components/reports/AttendanceReportsView';

function DownloadPDFButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUserStore();

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/report/download/pdf', {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_SY${user?.activeSchoolYearDB}_SEM${user?.activeSemDB}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: err.message ?? 'Failed to download the PDF report.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="downloadReportPDF"
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      <FileDown className="w-4 h-4" />
      {loading ? 'Generating…' : 'Download PDF'}
    </button>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'financial' | 'attendance'>('financial');

  return (
    <SidebarPageLayout>
      <StickyHeader>
        <Header>Reports</Header>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-[130px]">
            <SemInput hideLabel />
          </div>
          <div className="w-[150px]">
            <SchoolYearInput hideLabel />
          </div>
          <HasPermission permissions={[MODULES.REPORT_DOWNLOAD]}>
            {activeTab === 'financial' && <DownloadPDFButton />}
          </HasPermission>
        </div>
      </StickyHeader>

      <div className="flex border-b border-border/50 mb-6">
        <button 
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'financial' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('financial')}
        >
          Financial Reports
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'attendance' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('attendance')}
        >
          Attendance Reports
        </button>
      </div>

      {activeTab === 'financial' && <FinancialReportsView />}
      {activeTab === 'attendance' && <AttendanceReportsView />}

    </SidebarPageLayout>
  );
}
