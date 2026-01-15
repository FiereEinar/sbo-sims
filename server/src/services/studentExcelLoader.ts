import { Request } from 'express';
import * as XLSX from 'xlsx';

export interface StudentImportRow {
	[key: string]: any;
}

export interface StudentImportResult {
	success: number;
	failed: number;
	skipped: number;
	errors: string[];
}

export interface StudentPreviewItem {
	rowNum: number;
	studentID: string;
	firstname: string;
	lastname: string;
	middlename: string;
	course: string;
	year: number;
	gender: string;
	section: string;
	email: string;
	status: 'valid' | 'error' | 'exists';
	error?: string;
}

export interface StudentPreviewResult {
	valid: StudentPreviewItem[];
	invalid: StudentPreviewItem[];
	existing: StudentPreviewItem[];
	totalRows: number;
	detectedColumns: {
		studentID?: string;
		name?: string;
		firstname?: string;
		lastname?: string;
		middlename?: string;
		course?: string;
		year?: string;
		gender?: string;
		section?: string;
		email?: string;
	};
}

/**
 * Column patterns for auto-detection - STUDENT FIELDS ONLY
 */
const STUDENT_ID_PATTERNS = [
	'studentid', 'student_id', 'student id', 'id', 'id number', 'idnumber',
	'email', 'institutional email', 'school email', 'student email', 'buksu email',
];

const NAME_PATTERNS = ['name', 'full name', 'fullname', 'student name', 'complete name'];
const FIRSTNAME_PATTERNS = ['firstname', 'first name', 'first_name', 'given name'];
const LASTNAME_PATTERNS = ['lastname', 'last name', 'last_name', 'surname', 'family name'];
const MIDDLENAME_PATTERNS = ['middlename', 'middle name', 'middle_name', 'middle', 'mi'];
const COURSE_PATTERNS = ['course', 'program', 'degree', 'course/program', 'department'];
const YEAR_PATTERNS = ['year', 'year level', 'yearlevel', 'yr', 'level'];
const GENDER_PATTERNS = ['gender', 'sex'];
const SECTION_PATTERNS = ['section', 'sec', 'class'];
const EMAIL_PATTERNS = ['email', 'e-mail', 'email address', 'institutional email'];

/**
 * Extract 10-digit student ID from a string
 */
export const extractStudentID = (value: any): string | null => {
	if (!value) return null;
	const str = value.toString().trim();
	
	// Try to find a 10-digit number
	const match = str.match(/\b(\d{10})\b/);
	if (match) return match[1];
	
	// Extract first 10 digits
	const digits = str.replace(/\D/g, '');
	if (digits.length >= 10) return digits.substring(0, 10);
	
	return null;
};

/**
 * Extract email prefix (part before @) from institutional email
 * e.g., "2501114807@student.buksu.edu.ph" -> "2501114807"
 */
export const extractEmailPrefix = (value: any): string => {
	if (!value) return '';
	const str = value.toString().trim();
	
	if (str.includes('@')) {
		return str.split('@')[0];
	}
	return str;
};

/**
 * Find column by patterns
 */
const findColumn = (headers: string[], patterns: string[]): string | null => {
	const lowerHeaders = headers.map(h => h.toLowerCase().trim());
	for (const pattern of patterns) {
		const index = lowerHeaders.findIndex(h => h.includes(pattern));
		if (index !== -1) return headers[index];
	}
	return null;
};

/**
 * Parse name into parts (firstname, middlename, lastname)
 */
const parseName = (fullName: string): { firstname: string; middlename: string; lastname: string } => {
	const parts = fullName.trim().split(/\s+/);
	if (parts.length === 1) {
		return { firstname: parts[0], middlename: '', lastname: '' };
	} else if (parts.length === 2) {
		return { firstname: parts[0], middlename: '', lastname: parts[1] };
	} else {
		return {
			firstname: parts[0],
			middlename: parts.slice(1, -1).join(' '),
			lastname: parts[parts.length - 1],
		};
	}
};

/**
 * Parse gender from various formats
 */
const parseGender = (value: any): string => {
	if (!value) return 'M';
	const str = value.toString().toLowerCase().trim();
	if (str === 'f' || str === 'female' || str === 'woman') return 'F';
	if (str === 'm' || str === 'male' || str === 'man') return 'M';
	return 'M';
};

/**
 * Parse year level
 */
const parseYear = (value: any): number => {
	if (!value) return 1;
	const str = value.toString().trim();
	
	const num = parseInt(str);
	if (!isNaN(num) && num >= 1 && num <= 4) return num;
	
	const match = str.match(/(\d)/);
	if (match) {
		const n = parseInt(match[1]);
		if (n >= 1 && n <= 4) return n;
	}
	
	const lower = str.toLowerCase();
	if (lower.includes('first') || lower.includes('1st')) return 1;
	if (lower.includes('second') || lower.includes('2nd')) return 2;
	if (lower.includes('third') || lower.includes('3rd')) return 3;
	if (lower.includes('fourth') || lower.includes('4th')) return 4;
	
	return 1;
};

/**
 * Parse Excel/CSV buffer
 */
export const parseStudentBuffer = (buffer: Buffer): StudentImportRow[] => {
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	return XLSX.utils.sheet_to_json<StudentImportRow>(worksheet);
};

/**
 * Get headers from buffer
 */
export const getStudentHeaders = (buffer: Buffer): string[] => {
	const workbook = XLSX.read(buffer, { type: 'buffer' });
	const sheetName = workbook.SheetNames[0];
	const worksheet = workbook.Sheets[sheetName];
	const rows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
	return (rows[0] || []).map((h: any) => h?.toString() || '');
};

/**
 * Preview students from file - STUDENT FIELDS ONLY
 */
export const previewStudentsFromFile = async (
	req: Request,
	buffer: Buffer
): Promise<StudentPreviewResult> => {
	const result: StudentPreviewResult = {
		valid: [],
		invalid: [],
		existing: [],
		totalRows: 0,
		detectedColumns: {},
	};

	try {
		const rows = parseStudentBuffer(buffer);
		const headers = getStudentHeaders(buffer);

		if (rows.length === 0) return result;

		result.totalRows = rows.length;

		// Auto-detect columns
		const studentIDCol = findColumn(headers, STUDENT_ID_PATTERNS);
		const nameCol = findColumn(headers, NAME_PATTERNS);
		const firstnameCol = findColumn(headers, FIRSTNAME_PATTERNS);
		const lastnameCol = findColumn(headers, LASTNAME_PATTERNS);
		const middlenameCol = findColumn(headers, MIDDLENAME_PATTERNS);
		const courseCol = findColumn(headers, COURSE_PATTERNS);
		const yearCol = findColumn(headers, YEAR_PATTERNS);
		const genderCol = findColumn(headers, GENDER_PATTERNS);
		const sectionCol = findColumn(headers, SECTION_PATTERNS);
		const emailCol = findColumn(headers, EMAIL_PATTERNS);

		result.detectedColumns = {
			studentID: studentIDCol || undefined,
			name: nameCol || undefined,
			firstname: firstnameCol || undefined,
			lastname: lastnameCol || undefined,
			middlename: middlenameCol || undefined,
			course: courseCol || undefined,
			year: yearCol || undefined,
			gender: genderCol || undefined,
			section: sectionCol || undefined,
			email: emailCol || undefined,
		};

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNum = i + 2;

			const previewItem: StudentPreviewItem = {
				rowNum,
				studentID: '',
				firstname: '',
				lastname: '',
				middlename: '',
				course: '',
				year: 1,
				gender: 'M',
				section: '',
				email: '',
				status: 'valid',
			};

			try {
				// Extract student ID
				let studentID: string | null = null;
				
				if (studentIDCol && row[studentIDCol]) {
					studentID = extractStudentID(row[studentIDCol]);
				}
				
				if (!studentID) {
					for (const key of Object.keys(row)) {
						const lowerKey = key.toLowerCase();
						if (STUDENT_ID_PATTERNS.some(p => lowerKey.includes(p))) {
							studentID = extractStudentID(row[key]);
							if (studentID) break;
						}
					}
				}
				
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
					previewItem.error = 'No student ID';
					result.invalid.push(previewItem);
					continue;
				}

				previewItem.studentID = studentID;

				// Extract names
				let firstname = '', lastname = '', middlename = '';
				
				if (firstnameCol && row[firstnameCol]) firstname = row[firstnameCol].toString().trim();
				if (lastnameCol && row[lastnameCol]) lastname = row[lastnameCol].toString().trim();
				if (middlenameCol && row[middlenameCol]) middlename = row[middlenameCol].toString().trim();
				
				if (!firstname && !lastname && nameCol && row[nameCol]) {
					const parsed = parseName(row[nameCol].toString());
					firstname = parsed.firstname;
					lastname = parsed.lastname;
					middlename = middlename || parsed.middlename;
				}

				if (!firstname) {
					for (const key of Object.keys(row)) {
						if (FIRSTNAME_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							firstname = row[key]?.toString().trim() || '';
							break;
						}
					}
				}
				if (!lastname) {
					for (const key of Object.keys(row)) {
						if (LASTNAME_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							lastname = row[key]?.toString().trim() || '';
							break;
						}
					}
				}

				if (!firstname && !lastname) {
					previewItem.status = 'error';
					previewItem.error = 'No name found';
					result.invalid.push(previewItem);
					continue;
				}

				previewItem.firstname = firstname;
				previewItem.lastname = lastname;
				previewItem.middlename = middlename;

				// Extract course
				let course = '';
				if (courseCol && row[courseCol]) {
					course = row[courseCol].toString().trim().toUpperCase();
				} else {
					for (const key of Object.keys(row)) {
						if (COURSE_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							course = row[key]?.toString().trim().toUpperCase() || '';
							break;
						}
					}
				}
				previewItem.course = course || 'UNKNOWN';

				// Extract year
				let year = 1;
				if (yearCol && row[yearCol]) {
					year = parseYear(row[yearCol]);
				} else {
					for (const key of Object.keys(row)) {
						if (YEAR_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							year = parseYear(row[key]);
							break;
						}
					}
				}
				previewItem.year = year;

				// Extract gender
				let gender = 'M';
				if (genderCol && row[genderCol]) {
					gender = parseGender(row[genderCol]);
				} else {
					for (const key of Object.keys(row)) {
						if (GENDER_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							gender = parseGender(row[key]);
							break;
						}
					}
				}
				previewItem.gender = gender;

				// Extract section (optional)
				let section = '';
				if (sectionCol && row[sectionCol]) {
					section = row[sectionCol].toString().trim();
				} else {
					for (const key of Object.keys(row)) {
						if (SECTION_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							section = row[key]?.toString().trim() || '';
							break;
						}
					}
				}
				previewItem.section = section;

				// Extract email - part before @ only
				let email = '';
				if (emailCol && row[emailCol]) {
					email = extractEmailPrefix(row[emailCol]);
				} else {
					for (const key of Object.keys(row)) {
						if (EMAIL_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							email = extractEmailPrefix(row[key]);
							break;
						}
					}
				}
				previewItem.email = email;

				// Check if exists
				const existingStudent = await req.StudentModel.findOne({ studentID });
				if (existingStudent) {
					previewItem.status = 'exists';
					previewItem.error = 'Already exists';
					result.existing.push(previewItem);
					continue;
				}

				result.valid.push(previewItem);

			} catch (err: any) {
				previewItem.status = 'error';
				previewItem.error = err.message || 'Error';
				result.invalid.push(previewItem);
			}
		}
	} catch (error: any) {
		// Return empty on parse error
	}

	return result;
};

/**
 * Import students from file - STUDENT FIELDS ONLY
 */
export const importStudentsFromFile = async (
	req: Request,
	buffer: Buffer,
	skipExisting: boolean = true
): Promise<StudentImportResult> => {
	const result: StudentImportResult = { success: 0, failed: 0, skipped: 0, errors: [] };

	try {
		const rows = parseStudentBuffer(buffer);
		const headers = getStudentHeaders(buffer);

		if (rows.length === 0) {
			result.errors.push('File is empty');
			return result;
		}

		const studentIDCol = findColumn(headers, STUDENT_ID_PATTERNS);
		const nameCol = findColumn(headers, NAME_PATTERNS);
		const firstnameCol = findColumn(headers, FIRSTNAME_PATTERNS);
		const lastnameCol = findColumn(headers, LASTNAME_PATTERNS);
		const middlenameCol = findColumn(headers, MIDDLENAME_PATTERNS);
		const courseCol = findColumn(headers, COURSE_PATTERNS);
		const yearCol = findColumn(headers, YEAR_PATTERNS);
		const genderCol = findColumn(headers, GENDER_PATTERNS);
		const sectionCol = findColumn(headers, SECTION_PATTERNS);
		const emailCol = findColumn(headers, EMAIL_PATTERNS);

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const rowNum = i + 2;

			try {
				// Extract student ID
				let studentID: string | null = null;
				
				if (studentIDCol && row[studentIDCol]) {
					studentID = extractStudentID(row[studentIDCol]);
				}
				if (!studentID) {
					for (const key of Object.keys(row)) {
						if (STUDENT_ID_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							studentID = extractStudentID(row[key]);
							if (studentID) break;
						}
					}
				}
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
					result.errors.push(`Row ${rowNum}: No student ID`);
					result.failed++;
					continue;
				}

				// Check if exists
				const existingStudent = await req.StudentModel.findOne({ studentID });
				if (existingStudent) {
					if (skipExisting) {
						result.skipped++;
						continue;
					} else {
						result.errors.push(`Row ${rowNum}: ${studentID} exists`);
						result.failed++;
						continue;
					}
				}

				// Extract names
				let firstname = '', lastname = '', middlename = '';
				
				if (firstnameCol && row[firstnameCol]) firstname = row[firstnameCol].toString().trim();
				if (lastnameCol && row[lastnameCol]) lastname = row[lastnameCol].toString().trim();
				if (middlenameCol && row[middlenameCol]) middlename = row[middlenameCol].toString().trim();
				
				if (!firstname && !lastname && nameCol && row[nameCol]) {
					const parsed = parseName(row[nameCol].toString());
					firstname = parsed.firstname;
					lastname = parsed.lastname;
					middlename = middlename || parsed.middlename;
				}

				if (!firstname) {
					for (const key of Object.keys(row)) {
						if (FIRSTNAME_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							firstname = row[key]?.toString().trim() || '';
							break;
						}
					}
				}
				if (!lastname) {
					for (const key of Object.keys(row)) {
						if (LASTNAME_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							lastname = row[key]?.toString().trim() || '';
							break;
						}
					}
				}

				if (!firstname && !lastname) {
					result.errors.push(`Row ${rowNum}: No name`);
					result.failed++;
					continue;
				}

				// Extract other fields
				let course = courseCol && row[courseCol] ? row[courseCol].toString().trim().toUpperCase() : '';
				if (!course) {
					for (const key of Object.keys(row)) {
						if (COURSE_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							course = row[key]?.toString().trim().toUpperCase() || '';
							break;
						}
					}
				}

				let year = yearCol && row[yearCol] ? parseYear(row[yearCol]) : 1;
				if (!yearCol) {
					for (const key of Object.keys(row)) {
						if (YEAR_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							year = parseYear(row[key]);
							break;
						}
					}
				}

				let gender = genderCol && row[genderCol] ? parseGender(row[genderCol]) : 'M';
				if (!genderCol) {
					for (const key of Object.keys(row)) {
						if (GENDER_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							gender = parseGender(row[key]);
							break;
						}
					}
				}

				let section = sectionCol && row[sectionCol] ? row[sectionCol].toString().trim() : '';
				if (!sectionCol) {
					for (const key of Object.keys(row)) {
						if (SECTION_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							section = row[key]?.toString().trim() || '';
							break;
						}
					}
				}

				// Email - part before @ only
				let email = '';
				if (emailCol && row[emailCol]) {
					email = extractEmailPrefix(row[emailCol]);
				} else {
					for (const key of Object.keys(row)) {
						if (EMAIL_PATTERNS.some(p => key.toLowerCase().includes(p))) {
							email = extractEmailPrefix(row[key]);
							break;
						}
					}
				}

				// Create student
				const newStudent = new req.StudentModel({
					studentID,
					firstname,
					lastname,
					middlename,
					course: course || 'UNKNOWN',
					year,
					gender,
					section,
					email,
				});

				await newStudent.save();
				result.success++;

			} catch (err: any) {
				result.errors.push(`Row ${rowNum}: ${err.message || 'Error'}`);
				result.failed++;
			}
		}
	} catch (error: any) {
		result.errors.push(`Parse error: ${error.message}`);
	}

	return result;
};
