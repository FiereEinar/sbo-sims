import { fetchCategories } from '@/api/category';
import { fetchTransactionByID } from '@/api/transaction';
import BackButton from '@/components/buttons/BackButton';
import EditAndDeleteTransactionButton from '@/components/buttons/EditAndDeleteTransactionButton';
import BouncyLoading from '@/components/loading/BouncyLoading';
import StickyHeaderLoading from '@/components/loading/StickyHeaderLoading';
import SidebarPageLayout from '@/components/SidebarPageLayout';
import StickyHeader from '@/components/StickyHeader';
import TransactionCheque from '@/components/transaction/TransactionCheque';
import TransactionReceipt from '@/components/transaction/TransactionReceipt';
import Header from '@/components/ui/header';
import { Button } from '@/components/ui/button';
import { QUERY_KEYS } from '@/constants';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Download, FileText, LayoutTemplate } from 'lucide-react';
import { useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useToast } from '@/hooks/use-toast';

export default function TransactionInfo() {
  const { transactionID } = useParams();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeView, setActiveView] = useState<'receipt' | 'cheque'>('receipt');

  if (!transactionID) return;

  const {
    data: transaction,
    isLoading: TLoading,
    error: TError,
  } = useQuery({
    queryKey: [QUERY_KEYS.TRANSACTION, { transactionID }],
    queryFn: () => fetchTransactionByID(transactionID),
  });

  const {
    data: categories,
    isLoading: CLoading,
    error: CError,
  } = useQuery({
    queryKey: [QUERY_KEYS.CATEGORY],
    queryFn: fetchCategories,
  });

  const handleDownloadPDF = async () => {
    if (activeView === 'receipt') {
      const imgElement = document.getElementById(
        'secure-receipt-image',
      ) as HTMLImageElement;
      if (imgElement && imgElement.src) {
        try {
          setIsDownloading(true);
          const imgWidth = imgElement.naturalWidth || 1536;
          const imgHeight = imgElement.naturalHeight || 2048;

          const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [imgWidth, imgHeight],
          });

          pdf.addImage(imgElement.src, 'PNG', 0, 0, imgWidth, imgHeight);
          pdf.save(`${activeView}-${transactionID}.pdf`);
        } catch (error) {
          console.error('Error generating PDF', error);
          toast({ variant: 'destructive', title: 'Failed to generate PDF' });
        } finally {
          setIsDownloading(false);
        }
        return;
      }
    }

    const targetId =
      activeView === 'receipt'
        ? 'transaction-receipt-document'
        : 'transaction-receipt-cheque';

    const element = document.getElementById(targetId);
    if (!element) {
      toast({
        variant: 'destructive',
        title: 'Document element not found or still generating...',
      });
      return;
    }

    try {
      setIsDownloading(true);

      const originalBackground = element.style.backgroundColor;
      element.style.backgroundColor = 'white';

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });

      element.style.backgroundColor = originalBackground;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: activeView === 'receipt' ? 'portrait' : 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${activeView}-${transactionID}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
      toast({ variant: 'destructive', title: 'Failed to generate PDF' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (TError || CError) {
    return <p>Error</p>;
  }

  return (
    <SidebarPageLayout>
      <BackButton />
      {CLoading || (TLoading && <StickyHeaderLoading />)}
      {categories && transaction && (
        <StickyHeader>
          <Header>Transaction Details</Header>
          <div className="flex gap-2 items-center">
            <div className="flex bg-secondary p-1 rounded-md mr-4">
              <Button
                variant={activeView === 'receipt' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3 shadow-none"
                onClick={() => setActiveView('receipt')}
              >
                <FileText size={14} className="mr-1.5" /> Receipt
              </Button>
              <Button
                variant={activeView === 'cheque' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs px-3 shadow-none"
                onClick={() => setActiveView('cheque')}
              >
                <LayoutTemplate size={14} className="mr-1.5" /> Cheque
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="flex gap-2"
            >
              <Download size={16} />
              {isDownloading
                ? 'Generating...'
                : `Download ${activeView === 'receipt' ? 'Invoice' : 'Cheque'}`}
            </Button>
            <EditAndDeleteTransactionButton
              categories={categories}
              transaction={transaction}
            />
          </div>
        </StickyHeader>
      )}
      <hr />
      {CLoading || (TLoading && <BouncyLoading />)}
      {transaction && (
        <div className="pt-4">
          {activeView === 'receipt' ? (
            <TransactionReceipt transaction={transaction} />
          ) : (
            <TransactionCheque transaction={transaction} />
          )}
        </div>
      )}
    </SidebarPageLayout>
  );
}
