import { Request } from 'express';
import ExcelJS from 'exceljs';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import StudentModel from '../models/student.model';
import AttendanceRecordModel from '../models/attendance-record.model';
import EventSessionModel from '../models/event-session.model';
import mongoose from 'mongoose';

export interface AttendanceImportRow {
  [key: string]: any;
}

export interface AttendanceImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface AttendancePreviewItem {
  rowNum: number;
  studentID: string;
  name: string;
  course?: string;
  year?: number;
  gender?: string;
  section?: string;
  isMapped: boolean;
  status: 'valid' | 'exists' | 'error';
  error?: string;
}

export interface AttendancePreviewResult {
  valid: AttendancePreviewItem[];
  existing: AttendancePreviewItem[];
  invalid: AttendancePreviewItem[];
  totalRows: number;
  detectedColumns: {
    studentID?: string;
    name?: string;
    course?: string;
    year?: string;
    section?: string;
  };
}

const STUDENT_ID_PATTERNS = [
  'studentid',
  'student_id',
  'student id',
  'id',
  'id number',
  'idnumber',
  'email',
  'institutional email',
  'school email',
  'student email',
  'buksu email',
  'id_number',
  'stud_id',
  'student_no',
  'student no',
];

const NAME_PATTERNS = [
  'name',
  'full name',
  'fullname',
  'student name',
  'complete name',
];
const FIRSTNAME_PATTERNS = [
  'firstname',
  'first name',
  'first_name',
  'given name',
];
const LASTNAME_PATTERNS = [
  'lastname',
  'last name',
  'last_name',
  'surname',
  'family name',
];
const COURSE_PATTERNS = [
  'course',
  'program',
  'degree',
  'course/program',
  'department',
];
const YEAR_PATTERNS = ['year', 'year level', 'yearlevel', 'yr', 'level'];
const SECTION_PATTERNS = ['section', 'sec', 'class'];

export const extractStudentID = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  let str = value.toString().trim();
  if (!str) return null;

  // If email, extract prefix before @
  if (str.includes('@')) {
    str = str.split('@')[0].trim();
  }

  // 10-digit number pattern
  const match = str.match(/\b(\d{10})\b/);
  if (match) return match[1];

  const digits = str.replace(/\D/g, '');
  if (digits.length >= 10) return digits.substring(0, 10);

  // Fallback if not standard 10-digit but looks like an ID string
  if (str.length >= 3 && str.length <= 30 && !str.includes(' ')) {
    return str;
  }

  return null;
};

const findColumn = (headers: string[], patterns: string[]): string | null => {
  const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const index = lowerHeaders.findIndex((h) => h.includes(pattern));
    if (index !== -1) return headers[index];
  }
  return null;
};

/**
 * Parse rows and headers from buffer. Handles CSV and Excel (.xlsx, .xls)
 */
export const parseAttendanceFile = async (
  buffer: Buffer,
  filename?: string,
  mimetype?: string,
): Promise<{ headers: string[]; rows: AttendanceImportRow[] }> => {
  const isCsv =
    mimetype === 'text/csv' ||
    mimetype === 'application/csv' ||
    mimetype === 'text/plain' ||
    (filename && filename.toLowerCase().endsWith('.csv'));

  if (isCsv) {
    try {
      return await parseCsvBuffer(buffer);
    } catch {
      // Fallback to Excel in case of misidentified file
      return await parseExcelBuffer(buffer);
    }
  }

  try {
    return await parseExcelBuffer(buffer);
  } catch {
    // Fallback to CSV
    return await parseCsvBuffer(buffer);
  }
};

const parseCsvBuffer = (
  buffer: Buffer,
): Promise<{ headers: string[]; rows: AttendanceImportRow[] }> => {
  return new Promise((resolve, reject) => {
    const rows: AttendanceImportRow[] = [];
    let headers: string[] = [];
    const stream = Readable.from(buffer);

    stream
      .pipe(csvParser())
      .on('headers', (h: string[]) => {
        headers = h.map((header) => header.trim());
      })
      .on('data', (row: any) => {
        const cleanedRow: AttendanceImportRow = {};
        for (const [key, val] of Object.entries(row)) {
          cleanedRow[key.trim()] = val ? (val as any).toString().trim() : '';
        }
        rows.push(cleanedRow);
      })
      .on('end', () => {
        resolve({ headers, rows });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

const parseExcelBuffer = async (
  buffer: Buffer,
): Promise<{ headers: string[]; rows: AttendanceImportRow[] }> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  const rows: AttendanceImportRow[] = [];
  const headerMap: { [col: number]: string } = {};
  const headers: string[] = [];

  const row1 = worksheet.getRow(1);
  row1.eachCell((cell, colNumber) => {
    const val = cell.value ? cell.value.toString().trim() : '';
    if (val) {
      headerMap[colNumber] = val;
      headers.push(val);
    }
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowData: AttendanceImportRow = {};
    let hasVal = false;
    row.eachCell((cell, colNumber) => {
      const header = headerMap[colNumber];
      if (header) {
        const val = cell.value ? cell.value.toString().trim() : '';
        rowData[header] = val;
        if (val) hasVal = true;
      }
    });
    if (hasVal) {
      rows.push(rowData);
    }
  });

  return { headers, rows };
};

/**
 * Preview attendance records from file
 */
export const previewAttendanceFromFile = async (
  req: Request,
  sessionId: string,
  buffer: Buffer,
  filename?: string,
  mimetype?: string,
): Promise<AttendancePreviewResult> => {
  const result: AttendancePreviewResult = {
    valid: [],
    existing: [],
    invalid: [],
    totalRows: 0,
    detectedColumns: {},
  };

  const orgId = req.tenantContext!.organizationId;

  // 1. Verify session exists in organization
  const session = await EventSessionModel.findOne({
    _id: sessionId,
    organization: orgId,
  }).exec();

  if (!session) {
    return result;
  }

  // 2. Parse file
  const { headers, rows } = await parseAttendanceFile(
    buffer,
    filename,
    mimetype,
  );

  if (rows.length === 0) return result;
  result.totalRows = rows.length;

  // 3. Detect columns
  let studentIDCol = findColumn(headers, STUDENT_ID_PATTERNS);
  const nameCol = findColumn(headers, NAME_PATTERNS);
  const firstnameCol = findColumn(headers, FIRSTNAME_PATTERNS);
  const lastnameCol = findColumn(headers, LASTNAME_PATTERNS);
  const courseCol = findColumn(headers, COURSE_PATTERNS);
  const yearCol = findColumn(headers, YEAR_PATTERNS);
  const sectionCol = findColumn(headers, SECTION_PATTERNS);

  // If no column name matched student ID, check if any column has student ID values
  if (!studentIDCol && headers.length > 0) {
    for (const header of headers) {
      let matchCount = 0;
      const sampleRows = rows.slice(0, Math.min(10, rows.length));
      for (const row of sampleRows) {
        if (extractStudentID(row[header])) {
          matchCount++;
        }
      }
      if (matchCount > sampleRows.length / 2) {
        studentIDCol = header;
        break;
      }
    }
  }

  result.detectedColumns = {
    studentID: studentIDCol || undefined,
    name: nameCol || undefined,
    course: courseCol || undefined,
    year: yearCol || undefined,
    section: sectionCol || undefined,
  };

  // 4. Extract all valid candidate student IDs from rows
  const extractedIdList: { rowNum: number; id: string | null; row: any }[] = [];
  const candidateIdsSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    let studentID: string | null = null;
    if (studentIDCol && row[studentIDCol]) {
      studentID = extractStudentID(row[studentIDCol]);
    }

    if (!studentID) {
      for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if (STUDENT_ID_PATTERNS.some((p) => lowerKey.includes(p))) {
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

    extractedIdList.push({ rowNum, id: studentID, row });
    if (studentID) {
      candidateIdsSet.add(studentID);
    }
  }

  const allCandidateIds = Array.from(candidateIdsSet);

  // 5. Batch fetch existing attendance records for this session
  const existingAttendanceRecords = await AttendanceRecordModel.find({
    session: sessionId,
    organization: orgId,
    studentIdInput: { $in: allCandidateIds },
  })
    .select('studentIdInput')
    .lean();

  const existingAttendanceSet = new Set(
    existingAttendanceRecords.map((r) => r.studentIdInput),
  );

  // 6. Batch fetch student records from organization masterlist for current term
  const students = await StudentModel.find({
    studentID: { $in: allCandidateIds },
    organization: orgId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .select('studentID firstname middlename lastname course year section gender')
    .lean();

  const studentMap = new Map<string, any>(
    students.map((s) => [s.studentID, s]),
  );

  // 7. Track in-file duplicates
  const seenInFile = new Set<string>();

  for (const item of extractedIdList) {
    const { rowNum, id, row } = item;

    if (!id) {
      result.invalid.push({
        rowNum,
        studentID: '',
        name: 'Invalid Row',
        isMapped: false,
        status: 'error',
        error: 'No valid student ID found',
      });
      continue;
    }

    // Read optional row details from file if present
    let rowName = '';
    if (nameCol && row[nameCol]) rowName = row[nameCol];
    else if (firstnameCol || lastnameCol) {
      rowName = `${row[firstnameCol || ''] || ''} ${row[lastnameCol || ''] || ''}`.trim();
    }
    const rowCourse = courseCol && row[courseCol] ? row[courseCol] : undefined;
    const rowYear =
      yearCol && row[yearCol] ? parseInt(row[yearCol]) || undefined : undefined;
    const rowSection =
      sectionCol && row[sectionCol] ? row[sectionCol] : undefined;

    const student = studentMap.get(id);
    const resolvedName = student
      ? `${student.firstname} ${student.middlename ? student.middlename + ' ' : ''}${student.lastname}`
      : rowName || 'Unregistered Student';

    const previewItem: AttendancePreviewItem = {
      rowNum,
      studentID: id,
      name: resolvedName,
      course: student?.course || rowCourse,
      year: student?.year || rowYear,
      section: student?.section || rowSection,
      gender: student?.gender,
      isMapped: !!student,
      status: 'valid',
    };

    // Check if already recorded in DB
    if (existingAttendanceSet.has(id)) {
      previewItem.status = 'exists';
      previewItem.error = 'Already recorded in this session';
      result.existing.push(previewItem);
      continue;
    }

    // Check if duplicate in file
    if (seenInFile.has(id)) {
      previewItem.status = 'exists';
      previewItem.error = 'Duplicate in uploaded file';
      result.existing.push(previewItem);
      continue;
    }

    seenInFile.add(id);
    result.valid.push(previewItem);
  }

  return result;
};

/**
 * Import attendance records from file into session
 */
export const importAttendanceFromFile = async (
  req: Request,
  sessionId: string,
  buffer: Buffer,
  allowUnmapped: boolean = true,
  filename?: string,
  mimetype?: string,
): Promise<AttendanceImportResult> => {
  const result: AttendanceImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  const orgId = req.tenantContext!.organizationId;

  // 1. Verify session
  const session = await EventSessionModel.findOne({
    _id: sessionId,
    organization: orgId,
  }).exec();

  if (!session) {
    result.errors.push('Event session not found');
    return result;
  }

  // 2. Parse file
  const { headers, rows } = await parseAttendanceFile(
    buffer,
    filename,
    mimetype,
  );

  if (rows.length === 0) {
    result.errors.push('Uploaded file has no data');
    return result;
  }

  // 3. Detect student ID column
  let studentIDCol = findColumn(headers, STUDENT_ID_PATTERNS);
  if (!studentIDCol && headers.length > 0) {
    for (const header of headers) {
      let matchCount = 0;
      const sampleRows = rows.slice(0, Math.min(10, rows.length));
      for (const row of sampleRows) {
        if (extractStudentID(row[header])) {
          matchCount++;
        }
      }
      if (matchCount > sampleRows.length / 2) {
        studentIDCol = header;
        break;
      }
    }
  }

  // 4. Extract IDs
  const extractedRows: { rowNum: number; id: string | null }[] = [];
  const candidateIdsSet = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;

    let studentID: string | null = null;
    if (studentIDCol && row[studentIDCol]) {
      studentID = extractStudentID(row[studentIDCol]);
    }

    if (!studentID) {
      for (const key of Object.keys(row)) {
        const lowerKey = key.toLowerCase();
        if (STUDENT_ID_PATTERNS.some((p) => lowerKey.includes(p))) {
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

    extractedRows.push({ rowNum, id: studentID });
    if (studentID) candidateIdsSet.add(studentID);
  }

  const allCandidateIds = Array.from(candidateIdsSet);

  // 5. Existing attendance records in this session
  const existingAttendanceRecords = await AttendanceRecordModel.find({
    session: sessionId,
    organization: orgId,
    studentIdInput: { $in: allCandidateIds },
  })
    .select('studentIdInput')
    .lean();

  const existingAttendanceSet = new Set(
    existingAttendanceRecords.map((r) => r.studentIdInput),
  );

  // 6. Registered students in organization
  const students = await StudentModel.find({
    studentID: { $in: allCandidateIds },
    organization: orgId,
    semester: req.tenantContext!.semester,
    schoolYear: req.tenantContext!.schoolYear,
  })
    .select('_id studentID')
    .lean();

  const studentMap = new Map<string, any>(
    students.map((s) => [s.studentID, s]),
  );

  // 7. Prepare batch insert
  const recordsToInsert: any[] = [];
  const seenInFile = new Set<string>();

  for (const item of extractedRows) {
    const { rowNum, id } = item;

    if (!id) {
      result.failed++;
      result.errors.push(`Row ${rowNum}: No valid student ID found`);
      continue;
    }

    if (existingAttendanceSet.has(id)) {
      result.skipped++;
      continue;
    }

    if (seenInFile.has(id)) {
      result.skipped++;
      continue;
    }

    const student = studentMap.get(id);

    if (!student && !allowUnmapped) {
      result.failed++;
      result.errors.push(
        `Row ${rowNum}: Student ID ${id} not found in student masterlist`,
      );
      continue;
    }

    seenInFile.add(id);

    recordsToInsert.push({
      organization: orgId,
      event: session.event,
      session: session._id,
      student: student ? student._id : undefined,
      studentIdInput: id,
      recordedBy: req.currentUser?.id
        ? new mongoose.Types.ObjectId(req.currentUser.id)
        : undefined,
      recordedAt: new Date(),
    });
  }

  if (recordsToInsert.length > 0) {
    try {
      const inserted = await AttendanceRecordModel.insertMany(recordsToInsert, {
        ordered: false,
      });
      result.success = inserted.length;
    } catch (err: any) {
      if (err.insertedDocs) {
        result.success = err.insertedDocs.length;
      } else if (err.result?.nInserted) {
        result.success = err.result.nInserted;
      }
      if (err.writeErrors) {
        result.failed += err.writeErrors.length;
        for (const we of err.writeErrors.slice(0, 10)) {
          result.errors.push(`Error saving record: ${we.errmsg || we.message}`);
        }
      }
    }
  }

  return result;
};
