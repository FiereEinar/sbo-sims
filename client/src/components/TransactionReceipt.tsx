import { Transaction } from '@/types/transaction';
import _ from 'lodash';

interface TransactionReceiptProps {
	transaction: Transaction;
}

export default function TransactionReceipt({ transaction }: TransactionReceiptProps) {
	const owner = transaction.owner;
	const ownerFullname = _.startCase(
		`${owner.firstname} ${owner.middlename ?? ''} ${owner.lastname}`.toLowerCase(),
	);

	const fee = transaction.category.fee;
	const isPaid = transaction.amount >= fee;
	const balance = fee - transaction.amount;

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
							{transaction.category.organization.name}
						</h1>
						<p className="text-sm text-gray-600 font-medium">Student Body Organization</p>
						<p className="text-sm text-gray-500">Official Payment Receipt</p>
					</div>
				</div>
				<div className="text-right space-y-1">
					<h2 className="text-3xl font-bold text-gray-200 uppercase tracking-widest">Receipt</h2>
					<p className="text-sm font-semibold">NO. <span className="font-mono text-gray-700">{transaction._id.slice(-8).toUpperCase()}</span></p>
					<p className="text-sm text-gray-600">Date: {new Date(transaction.date).toLocaleDateString()}</p>
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
					<div className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${isPaid ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
						{isPaid ? 'Fully Paid' : 'Partial Payment'}
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
						<tr>
							<td className="py-4 px-2">
								<p className="font-bold text-base">{transaction.category.name}</p>
								{transaction.description && (
									<p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
								)}
								{transaction.category.details?.map((detail) => {
									const value = transaction.details?.[detail];
									if (value === undefined) return null;
									return (
										<p key={detail} className="text-sm text-gray-500 mt-0.5">
											<span className="font-medium">{_.startCase(detail)}:</span> {String(value)}
										</p>
									);
								})}
							</td>
							<td className="py-4 px-2 text-right font-mono text-base">
								P{fee.toFixed(2)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			{/* Totals Section */}
			<div className="flex justify-end">
				<div className="w-1/2 space-y-3">
					<div className="flex justify-between text-sm text-gray-600 px-2">
						<span>Total Fee:</span>
						<span className="font-mono">P{fee.toFixed(2)}</span>
					</div>
					<div className="flex justify-between text-base font-bold text-black border-t-2 border-black pt-2 px-2">
						<span>Amount Paid:</span>
						<span className="font-mono">P{transaction.amount.toFixed(2)}</span>
					</div>
					{!isPaid && (
						<div className="flex justify-between text-sm font-semibold text-red-600 px-2 pt-1">
							<span>Remaining Balance:</span>
							<span className="font-mono">P{Math.max(0, balance).toFixed(2)}</span>
						</div>
					)}
				</div>
			</div>

			{/* Payment History Log (if partial/multiple payments) */}
			{transaction.paymentHistory && transaction.paymentHistory.length > 1 && (
				<div className="pt-6">
					<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b pb-2">Payment History</h4>
					<div className="space-y-2">
						{transaction.paymentHistory.map((entry, index) => (
							<div key={index} className="flex justify-between text-sm text-gray-600">
								<span>{new Date(entry.date).toLocaleDateString()}</span>
								<span className="uppercase text-xs font-medium">{entry.modeOfPayment}</span>
								<span className="font-mono font-medium text-black">P{entry.amount.toFixed(2)}</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Footer Signatures */}
			<div className="absolute bottom-10 left-10 right-10 pt-10">
				<div className="grid grid-cols-2 gap-8 text-center text-sm">
					<div>
						<div className="border-b border-black mx-4 pb-1 font-semibold uppercase">
							{transaction.recordedBy ? `${transaction.recordedBy.firstname} ${transaction.recordedBy.lastname}` : 'System Generated'}
						</div>
						<p className="text-gray-500 mt-1 uppercase text-xs tracking-wider">Recorded By</p>
					</div>
					<div>
						<div className="border-b border-black mx-4 pb-1 font-semibold uppercase">
							{transaction.treasurer || 'N/A'}
						</div>
						<p className="text-gray-500 mt-1 uppercase text-xs tracking-wider">Treasurer</p>
					</div>
				</div>
				<p className="text-center text-xs text-gray-400 mt-12">
					This is a system generated receipt. Payment mode: <span className="font-bold uppercase text-gray-500">{transaction.modeOfPayment}</span>.
				</p>
			</div>
		</article>
	);
}
