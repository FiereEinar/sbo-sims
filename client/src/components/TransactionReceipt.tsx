import { Transaction } from '@/types/transaction';
import _ from 'lodash';

interface TransactionReceiptProps {
	transaction?: Transaction;
	transactions?: Transaction[];
}

export default function TransactionReceipt({ transaction, transactions }: TransactionReceiptProps) {
	// Normalize to array
	const txs = transactions || (transaction ? [transaction] : []);
	
	if (txs.length === 0) return null;

	// Use the owner from the first transaction (assuming all belong to the same student in consolidated view)
	const owner = txs[0].owner;
	const ownerFullname = _.startCase(
		`${owner.firstname} ${owner.middlename ?? ''} ${owner.lastname}`.toLowerCase(),
	);

	// Find the most recent transaction for the header date and signatories
	const mostRecentTx = [...txs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

	// Compute combined totals
	const totalFee = txs.reduce((sum, tx) => sum + tx.category.fee, 0);
	const totalPaid = txs.reduce((sum, tx) => sum + tx.amount, 0);
	const balance = totalFee - totalPaid;
	const isFullyPaid = balance <= 0;

	// Collect all payment histories
	const allHistories = txs.flatMap(tx => 
		(tx.paymentHistory || []).map(entry => ({
			...entry,
			categoryName: tx.category.name
		}))
	).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	return (
		<article 
			id="transaction-receipt-document" 
			className="relative bg-white text-black p-10 max-w-3xl mx-auto border shadow-sm space-y-8 print:shadow-none"
			style={{ minHeight: '800px', fontFamily: "'Inter', sans-serif" }}
		>
			{/* Corporate Header */}
			<div className="flex justify-between items-start border-b-2 border-black pb-6">
				<div className="flex items-center gap-4">
					<img 
						src="/images/SBO_LOGO.jpg" 
						alt="SBO Logo" 
						className="w-16 h-16 object-contain rounded-full"
						crossOrigin="anonymous" 
					/>
					<div className="space-y-1">
						<h1 className="text-2xl font-bold tracking-tight uppercase">
							{mostRecentTx.category.organization.name}
						</h1>
						<p className="text-sm text-gray-600 font-medium">Student Body Organization</p>
						<p className="text-sm text-gray-500">Official Payment Receipt</p>
					</div>
				</div>
				<div className="text-right space-y-1">
					<h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest">Receipt</h2>
					<p className="text-sm font-semibold">NO. <span className="font-mono text-gray-700">{mostRecentTx._id.slice(-8).toUpperCase()}</span></p>
					<p className="text-sm text-gray-600">Date: {new Date(mostRecentTx.date).toLocaleDateString()}</p>
				</div>
			</div>

			{/* Billing Details */}
			<div className="flex justify-between items-end">
				<div className="space-y-2">
					<h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Billed To</h3>
					<div className="space-y-0.5">
						<p className="font-bold text-lg">{ownerFullname}</p>
						<p className="text-sm text-gray-700">Student ID: <span className="font-medium">{owner.studentID}</span></p>
						<p className="text-sm text-gray-700">Course: <span className="font-medium uppercase">{owner.course}</span></p>
					</div>
				</div>
				<div className="text-right">
					<div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isFullyPaid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
						{isFullyPaid ? 'Fully Paid' : 'Partial Payment'}
					</div>
				</div>
			</div>

			{/* Itemized Table */}
			<div className="mt-8">
				<table className="w-full text-left border-collapse">
					<thead>
						<tr className="border-y-2 border-black text-sm uppercase tracking-wider">
							<th className="py-3 px-2 font-bold w-2/3">Description</th>
							<th className="py-3 px-2 font-bold text-right">Amount</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200">
						{txs.map(tx => (
							<tr key={tx._id}>
								<td className="py-1 px-2">
									<p className="font-bold text-base">{tx.category.name}</p>
									{tx.description && (
										<p className="text-sm text-gray-600 mt-1">{tx.description}</p>
									)}
									{tx.category.details?.map((detail) => {
										const value = tx.details?.[detail];
										if (value === undefined) return null;
										return (
											<p key={detail} className="text-sm text-gray-500 mt-0.5">
												<span className="font-medium">{_.startCase(detail)}:</span> {String(value)}
											</p>
										);
									})}
								</td>
								<td className="py-1 px-2 text-right font-mono text-base">
									P{tx.category.fee.toFixed(2)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Totals Section */}
			<div className="flex justify-end">
				<div className="w-1/2 space-y-3">
					<div className="flex justify-between text-sm text-gray-600 px-2">
						<span>Total Fee:</span>
						<span className="font-mono">P{totalFee.toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-base font-bold text-black border-t-2 border-black pt-2 px-2">
						<span>Amount Paid:</span>
						<span className="font-mono">P{totalPaid.toFixed(2)}</span>
					</div>
					{!isFullyPaid && (
						<div className="flex justify-between text-sm font-semibold text-red-600 px-2 pt-1">
							<span>Remaining Balance:</span>
							<span className="font-mono">P{Math.max(0, balance).toFixed(2)}</span>
						</div>
					)}
				</div>
			</div>

			{/* Payment History Log (if partial/multiple payments) */}
			{allHistories.length > 1 && (
				<div className="pt-6">
					<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">Combined Payment History</h4>
					<div className="space-y-2">
						{allHistories.map((entry, index) => (
							<div key={index} className="flex justify-between items-center text-sm text-gray-600">
								<span className="w-24">{new Date(entry.date).toLocaleDateString()}</span>
								<span className="flex-1 text-xs">{entry.categoryName}</span>
								<span className="uppercase text-xs font-medium w-16 text-right pr-4">{entry.modeOfPayment}</span>
								<span className="font-mono font-medium text-black">P{entry.amount.toFixed(2)}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Footer Signatures */}
			<div className="absolute bottom-10 left-10 right-10 pt-10">
				<div className="grid grid-cols-2 gap-8 text-center text-sm mb-8">
					<div>
						<div className="border-b border-black mx-8 pb-1 font-semibold uppercase">
							{mostRecentTx.recordedBy ? `${mostRecentTx.recordedBy.firstname} ${mostRecentTx.recordedBy.lastname}` : 'System Generated'}
						</div>
						<p className="text-gray-500 mt-1 uppercase text-xs tracking-wider">Recorded By</p>
					</div>
					<div>
						<div className="border-b border-black mx-8 pb-1 font-semibold uppercase">
							{mostRecentTx.treasurer || 'N/A'}
						</div>
						<p className="text-gray-500 mt-1 uppercase text-xs tracking-wider">Treasurer</p>
					</div>
				</div>

				<div className="flex justify-center text-center text-sm mb-8">
					<div className="w-1/2">
						<div className="border-b border-black mx-12 pb-1 font-semibold uppercase">
							{mostRecentTx.governor || 'N/A'}
						</div>
						<p className="text-gray-500 mt-1 uppercase text-xs tracking-wider">Governor</p>
					</div>
				</div>
				
				<p className="text-center text-xs text-gray-400">
					This is a system generated receipt. Payment mode: <span className="font-bold uppercase text-gray-500">{mostRecentTx.modeOfPayment}</span>.
				</p>
			</div>
		</article>
	);
}
