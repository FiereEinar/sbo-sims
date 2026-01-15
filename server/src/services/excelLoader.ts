import { Request } from 'express';
import * as XLSX from 'xlsx';

export interface TransactionImportRow {
	studentID: string;
	amount: number;
	categoryID: string;
	date?: string;
	description?: string;
	[key: string]: any; // For dynamic category details
}

export interface ImportResult {
	success: number;
	failed: number;
	skipped: number;
	errors: string[];
}

/**
 * Column names that might contain student ID or email with student ID
 */
const STUDENT_ID_COLUMN_PATTERNS = [
	'studentid',
	'student_id',
	'student id',
	'id',
	'email',
	'institutional email',
	'school email',
	'student email',
	'buksu email',
	'institutional_email',
];

/**
 * Column names that might contain student name (used to confirm correct column detection)
 */
const NAME_COLUMN_PATTERNS = [
	'name',
	'full name',
	'fullname',
	'student name',
	'complete name',
	'firstname',
	'first name',
	'lastname',
	'last name',
];

/**
 * Column names that might contain amount
 */
const AMOUNT_COLUMN_PATTERNS = [
	'amount',
	'fee',
	'payment',
	'paid',
	'total',
	'price',
];

/**
 * Extract 10-digit student ID from a string
 * Handles formats like:
 * - "2501114807" (plain ID)
 * - "2501114807@student.buksu.edu.ph" (email format)
 * - "ID: 2501114807" (with prefix)
 */
export const extractStudentID = (value: any): string | null => {
	if (!value) return null;
	
	const str = value.toString().trim();
	
	// Try to find a 10-digit number in the string
	const match = str.match(/\b(\d{10})\b/);
	if (match) {
		return match[1];
	}
	
	// If no exact 10-digit match, try to extract first 10 digits
	const digits = str.replace(/\D/g, '');
	if (digits.length >= 10) {
		return digits.substring(0, 10);
	}
	
	return null;
};

/**
 * Find the column that contains student name (to confirm correct data detection)
 */
export const findNameColumn = (headers: string[]): string | null => {
	const lowerHeaders = headers.map(h => h.toLowerCase().trim());
	
	for (const pattern of NAME_COLUMN_PATTERNS) {
		const index = lowerHeaders.findIndex(h => h.includes(pattern));
		if (index !== -1) {
			return headers[index];
		}
	}
	
	return null;
};

/**
 * Find the column that contains student ID data
 */
export const findStudentIDColumn = (headers: string[]): string | null => {
	const lowerHeaders = headers.map(h => h.toLowerCase().trim());
	
	for (const pattern of STUDENT_ID_COLUMN_PATTERNS) {
		const index = lowerHeaders.findIndex(h => h.includes(pattern));
		if (index !== -1) {
			return headers[index];
		}
	}
	
	return null;
};

/**
 * Find the column that contains amount data
 */
export const findAmountColumn = (headers: string[]): string | null => {
	const lowerHeaders = headers.map(h => h.toLowerCase().trim());
	
	for (const pattern of AMOUNT_COLUMN_PATTERNS) {
		const index = lowerHeaders.findIndex(h => h.includes(pattern));
		if (index !== -1) {
			return headers[index];
		}
	}
	
	return null;
};

/**
 * Validates Excel file headers for transaction import
 */
export const validateTransactionHeaders = (
	headers: string[],
	categoryDetails: string[]
): { valid: boolean; missing: string[] } => {
	const requiredHeaders = ['studentID', 'amount', 'categoryID'];
	const allRequired = [...requiredHeaders, ...categoryDetails];
	const missing = allRequired.filter(
		(h) => !headers.map((header) => header.toLowerCase()).includes(h.toLowerCase())
	);
	return { valid: missing.length === 0, missing };
};

/**
 * Parse Excel buffer and return rows as objects
 */
export const parseExcelBuffer = (buffer: Buffer): TransactionImportRow[] => {
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<TransactionImportRow>(worksheet);
	return rows;
};

/**
 * Get headers from Excel buffer
 */
export const getExcelHeaders = (buffer: Buffer): string[] => {
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
	return rows[0] || [];
};

/**
 * Import transactions from Excel file
 */
export const importTransactionsFromExcel = async (
	req: Request,
	buffer: Buffer,
	categoryID: string,
	save: boolean = false
): Promise<ImportResult> => {
	const result: ImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

	try {
		// Parse Excel file
		const rows = parseExcelBuffer(buffer);
		const headers = getExcelHeaders(buffer);

		if (rows.length === 0) {
			result.errors.push('Excel file is empty or has no valid data');
			return result;
		}

		// Get category with organization details
		const category = await req.CategoryModel.findById(categoryID).populate({
			model: req.OrganizationModel,
			path: 'organization',
		});

		if (!category) {
			result.errors.push(`Category with ID ${categoryID} not found`);
			return result;
		}

		// Track student IDs processed in this import to skip duplicates within the file
		const processedStudentIDs = new Set<string>();

		// Process each row
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNum = i + 2; // Excel row number (1-indexed + header)

			try {
				// Extract student ID - try all possible columns
				let studentID: string | null = null;
				
				// Try all columns to find student ID
				for (const key of Object.keys(row)) {
					const lowerKey = key.toLowerCase();
					// Check if column name suggests it contains student ID or email
					if (STUDENT_ID_COLUMN_PATTERNS.some(p => lowerKey.includes(p))) {
						studentID = extractStudentID(row[key]);
						if (studentID) break;
					}
				}
				
				// If still not found, try extracting from any column that has a 10-digit number
				if (!studentID) {
					for (const key of Object.keys(row)) {
						const extracted = extractStudentID(row[key]);
						if (extracted) {
							studentID = extracted;
							break;
						}
					}
				}

				if (!studentID) {
					result.errors.push(`Row ${rowNum}: Could not extract student ID from any column`);
					result.failed++;
					continue;
				}

				// Check for duplicate within the same file
				if (processedStudentIDs.has(studentID)) {
					result.skipped++;
					continue;
				}

				// Extract amount - try multiple sources
				let amount: number | null = null;
				
				// Try to find amount in columns with amount-like names
				for (const key of Object.keys(row)) {
					const lowerKey = key.toLowerCase();
					if (AMOUNT_COLUMN_PATTERNS.some(p => lowerKey.includes(p))) {
						const val = Number(row[key]);
						if (!isNaN(val) && val > 0) {
							amount = val;
							break;
						}
					}
				}

				// If no amount column found, use the category fee as default
				if (amount === null || isNaN(amount)) {
					amount = category.fee;
				}

				// Validate amount (amount is guaranteed to be a number now)
				if (amount! <= 0) {
					result.errors.push(`Row ${rowNum}: Amount must be greater than 0`);
					result.failed++;
					continue;
				}

				if (amount! > category.fee) {
					result.errors.push(
						`Row ${rowNum}: Amount (${amount}) exceeds category fee (${category.fee})`
					);
					result.failed++;
					continue;
				}

				// Find student
				const student = await req.StudentModel.findOne({
					studentID: studentID,
				});

				if (!student) {
					result.errors.push(
						`Row ${rowNum}: Student with ID ${studentID} not found`
					);
					result.failed++;
					continue;
				}

				// Check if transaction already exists for this student and category
				const existingTransaction = await req.TransactionModel.findOne({
					owner: student._id,
					category: categoryID,
				});

				if (existingTransaction) {
					result.skipped++;
					continue;
				}

				// Build details object from category details
				const detailsObj: { [key: string]: string } = {};
				category.details.forEach((detail: string) => {
					// Try to find matching column (case-insensitive)
					const matchingKey = Object.keys(row).find(
						key => key.toLowerCase() === detail.toLowerCase()
					);
					detailsObj[detail] = matchingKey ? row[matchingKey]?.toString() || '' : '';
				});

				// Parse date - try multiple column names
				let transactionDate = new Date();
				const dateColumns = ['date', 'Date', 'DATE', 'Transaction Date', 'transaction date', 'Timestamp', 'timestamp'];
				for (const col of dateColumns) {
					if (row[col]) {
						const parsedDate = new Date(row[col]);
						if (!isNaN(parsedDate.getTime())) {
							transactionDate = parsedDate;
							break;
						}
					}
				}

				// Get description from any description-like column
				let description = '';
				const descColumns = ['description', 'Description', 'DESCRIPTION', 'notes', 'Notes', 'remarks', 'Remarks'];
				for (const col of descColumns) {
					if (row[col]) {
						description = row[col].toString();
						break;
					}
				}

				if (save) {
					// Create and save transaction
					const transaction = new req.TransactionModel({
						amount: amount,
						category: categoryID,
						owner: student._id,
						description: description,
						date: transactionDate,
						governor: category.organization.governor,
						viceGovernor: category.organization.viceGovernor,
						treasurer: category.organization.treasurer,
						auditor: category.organization.auditor,
						details: detailsObj,
					});

					await transaction.save();
				}

				// Mark as processed
				processedStudentIDs.add(studentID);
				result.success++;
			} catch (err: any) {
				result.errors.push(`Row ${rowNum}: ${err.message || 'Unknown error'}`);
				result.failed++;
			}
		}
	} catch (error: any) {
		result.errors.push(`Failed to parse Excel file: ${error.message}`);
	}

	return result;
};


export interface TransactionPreviewItem {
	rowNum: number;
	studentID: string;
	studentName?: string;
	nameFromFile?: string;
	amount: number;
	date: string;
	status: 'valid' | 'error' | 'duplicate';
	error?: string;
}

export interface PreviewResult {
	valid: TransactionPreviewItem[];
	invalid: TransactionPreviewItem[];
	duplicates: TransactionPreviewItem[];
	totalRows: number;
	categoryName: string;
	categoryFee: number;
	detectedColumns: {
		studentID?: string;
		name?: string;
		amount?: string;
	};
}

/**
 * Preview transactions from Excel file without saving
 */
export const previewTransactionsFromExcel = async (
	req: Request,
	buffer: Buffer,
	categoryID: string
): Promise<PreviewResult> => {
	const result: PreviewResult = {
		valid: [],
		invalid: [],
		duplicates: [],
		totalRows: 0,
		categoryName: '',
		categoryFee: 0,
		detectedColumns: {},
	};

	try {
		const rows = parseExcelBuffer(buffer);
		const headers = getExcelHeaders(buffer);

		if (rows.length === 0) {
			return result;
		}

		result.totalRows = rows.length;

		// Auto-detect columns and store for display
		const studentIDColumn = findStudentIDColumn(headers);
		const nameColumn = findNameColumn(headers);
		const amountColumn = findAmountColumn(headers);

		result.detectedColumns = {
			studentID: studentIDColumn || undefined,
			name: nameColumn || undefined,
			amount: amountColumn || undefined,
		};

		// Get category with organization details
		const category = await req.CategoryModel.findById(categoryID).populate({
			model: req.OrganizationModel,
			path: 'organization',
		});

		if (!category) {
			return result;
		}

		result.categoryName = category.name;
		result.categoryFee = category.fee;

		// Track student IDs seen in this import to detect duplicates within the file
		const seenStudentIDs = new Set<string>();

		// Process each row for preview
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNum = i + 2;

			const previewItem: TransactionPreviewItem = {
				rowNum,
				studentID: '',
				amount: category.fee, // Default to category fee
				date: new Date().toISOString().split('T')[0],
				status: 'valid',
			};

			try {
				// Get name from file if name column exists (for display)
				if (nameColumn && row[nameColumn]) {
					previewItem.nameFromFile = row[nameColumn].toString().trim();
				}

				// Extract student ID - first try detected column
				let studentID: string | null = null;
				
				if (studentIDColumn && row[studentIDColumn]) {
					studentID = extractStudentID(row[studentIDColumn]);
				}
				
				// If not found, try all columns with ID/email patterns
				if (!studentID) {
					for (const key of Object.keys(row)) {
						const lowerKey = key.toLowerCase();
						if (STUDENT_ID_COLUMN_PATTERNS.some(p => lowerKey.includes(p))) {
							studentID = extractStudentID(row[key]);
							if (studentID) break;
						}
					}
				}
				
				// Last resort: try to find 10-digit number in any column
				if (!studentID) {
					for (const key of Object.keys(row)) {
						const extracted = extractStudentID(row[key]);
						if (extracted) {
							studentID = extracted;
							break;
						}
					}
				}

				if (!studentID) {
					previewItem.status = 'error';
					previewItem.error = 'No student ID found';
					result.invalid.push(previewItem);
					continue;
				}

				previewItem.studentID = studentID;

				// Check for duplicate within the same file
				if (seenStudentIDs.has(studentID)) {
					previewItem.status = 'duplicate';
					previewItem.error = 'Duplicate in file';
					result.duplicates.push(previewItem);
					continue;
				}

				// Extract amount - use detected column first
				let amount: number = category.fee;
				
				if (amountColumn && row[amountColumn]) {
					const val = Number(row[amountColumn]);
					if (!isNaN(val) && val > 0) {
						amount = val;
					}
				} else {
					// Try to find amount in other columns
					for (const key of Object.keys(row)) {
						const lowerKey = key.toLowerCase();
						if (AMOUNT_COLUMN_PATTERNS.some(p => lowerKey.includes(p))) {
							const val = Number(row[key]);
							if (!isNaN(val) && val > 0) {
								amount = val;
								break;
							}
						}
					}
				}
				
				previewItem.amount = amount;

				// Validate amount
				if (amount <= 0) {
					previewItem.status = 'error';
					previewItem.error = 'Invalid amount';
					result.invalid.push(previewItem);
					continue;
				}

				if (amount > category.fee) {
					previewItem.status = 'error';
					previewItem.error = `Amount ₱${amount} > fee ₱${category.fee}`;
					result.invalid.push(previewItem);
					continue;
				}

				// Find student in database
				const student = await req.StudentModel.findOne({ studentID });
				
				if (!student) {
					previewItem.status = 'error';
					previewItem.error = 'Student not in database';
					result.invalid.push(previewItem);
					continue;
				}

				// Set student name from database
				previewItem.studentName = `${student.firstname} ${student.lastname}`;

				// Check if transaction already exists for this student and category
				const existingTransaction = await req.TransactionModel.findOne({
					owner: student._id,
					category: categoryID,
				});

				if (existingTransaction) {
					previewItem.status = 'duplicate';
					previewItem.error = 'Already paid';
					result.duplicates.push(previewItem);
					continue;
				}

				// Parse date
				const dateColumns = ['date', 'Date', 'DATE', 'Transaction Date', 'Timestamp', 'timestamp'];
				for (const col of dateColumns) {
					if (row[col]) {
						const parsedDate = new Date(row[col]);
						if (!isNaN(parsedDate.getTime())) {
							previewItem.date = parsedDate.toISOString().split('T')[0];
							break;
						}
					}
				}

				// Mark as seen and add to valid
				seenStudentIDs.add(studentID);
				result.valid.push(previewItem);
				
			} catch (err: any) {
				previewItem.status = 'error';
				previewItem.error = err.message || 'Unknown error';
				result.invalid.push(previewItem);
			}
		}
	} catch (error: any) {
		// Return empty result on parse error
	}

	return result;
};
