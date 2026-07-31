import { parse } from 'csv-parse/sync';
import { In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Attendance, AttendanceStatus } from '../models/Attendance';
import { AuditLog } from '../models/AuditLog';
import { Employee } from '../models/Employee';

export type AttendanceImportConflictPolicy = 'skip' | 'overwrite';
export type AttendanceImportAction = 'create' | 'update' | 'unchanged' | 'skip' | 'error';

export interface AttendanceImportRow {
  row: number;
  employeeCode: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  status?: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  workMinutes?: number;
  location?: string;
  notes?: string;
  action: AttendanceImportAction;
  messages: string[];
}

export interface AttendanceImportPreview {
  fileName: string;
  conflictPolicy: AttendanceImportConflictPolicy;
  totalRows: number;
  dateRange: { from?: string; to?: string };
  summary: {
    creates: number;
    updates: number;
    unchanged: number;
    skipped: number;
    errors: number;
    ready: number;
  };
  rows: AttendanceImportRow[];
}

interface RawAttendanceRow {
  employeeCode?: string;
  date?: string;
  status?: string;
  checkIn?: string;
  checkOut?: string;
  workMinutes?: string;
  location?: string;
  notes?: string;
}

const STATUS_ALIASES: Record<string, AttendanceStatus> = {
  p: AttendanceStatus.PRESENT,
  present: AttendanceStatus.PRESENT,
  a: AttendanceStatus.ABSENT,
  absent: AttendanceStatus.ABSENT,
  hd: AttendanceStatus.HALF_DAY,
  halfday: AttendanceStatus.HALF_DAY,
  half_day: AttendanceStatus.HALF_DAY,
  'half day': AttendanceStatus.HALF_DAY,
  l: AttendanceStatus.ON_LEAVE,
  leave: AttendanceStatus.ON_LEAVE,
  on_leave: AttendanceStatus.ON_LEAVE,
  'on leave': AttendanceStatus.ON_LEAVE,
  h: AttendanceStatus.HOLIDAY,
  holiday: AttendanceStatus.HOLIDAY,
  wo: AttendanceStatus.WEEKEND,
  weekend: AttendanceStatus.WEEKEND,
  'weekly off': AttendanceStatus.WEEKEND,
};

const normalizeHeader = (header: string) =>
  header
    .replace(/^\uFEFF/, '')
    .trim()
    .replace(/[\s_-]+(.)/g, (_, character: string) => character.toUpperCase())
    .replace(/^(.)/, (character) => character.toLowerCase());

const normalizeDate = (value?: string): string | undefined => {
  const input = value?.trim();
  if (!input) return undefined;

  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (
      date.getUTCFullYear() === Number(year) &&
      date.getUTCMonth() + 1 === Number(month) &&
      date.getUTCDate() === Number(day)
    ) {
      return `${year}-${month}-${day}`;
    }
    return undefined;
  }

  const indianMatch = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!indianMatch) return undefined;
  const [, day, month, year] = indianMatch;
  return normalizeDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
};

const normalizeStatus = (value?: string): AttendanceStatus | undefined => {
  const key = value?.trim().toLowerCase().replace(/-/g, '_');
  return key ? STATUS_ALIASES[key] : undefined;
};

const normalizeTime = (date: string, value?: string): string | undefined => {
  const input = value?.trim();
  if (!input) return undefined;

  const timeMatch = input.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  const parsed = timeMatch
    ? new Date(`${date}T${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3] || '00'}`)
    : new Date(input);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const dateKey = (value: Date | string) => {
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
};

const sameInstant = (left?: Date | string, right?: string) => {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return new Date(left).getTime() === new Date(right).getTime();
};

class AttendanceImportService {
  async preview(
    tenantId: string,
    fileName: string,
    fileBuffer: Buffer,
    conflictPolicy: AttendanceImportConflictPolicy
  ): Promise<AttendanceImportPreview> {
    let records: RawAttendanceRow[];
    try {
      records = parse(fileBuffer.toString('utf-8'), {
        bom: true,
        columns: (headers: string[]) => headers.map(normalizeHeader),
        skip_empty_lines: true,
        trim: true,
      }) as RawAttendanceRow[];
    } catch (error: any) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }

    if (records.length === 0) throw new Error('CSV file contains no attendance rows');
    if (records.length > 10000) throw new Error('A maximum of 10,000 attendance rows can be imported at once');

    const employeeCodes = Array.from(
      new Set(records.map((record) => record.employeeCode?.trim().toLowerCase()).filter(Boolean) as string[])
    );
    const employees = employeeCodes.length
      ? await AppDataSource.getRepository(Employee)
          .createQueryBuilder('employee')
          .where('employee.tenantId = :tenantId', { tenantId })
          .andWhere('LOWER(employee.employeeCode) IN (:...employeeCodes)', { employeeCodes })
          .getMany()
      : [];
    const employeesByCode = new Map(employees.map((employee) => [employee.employeeCode.toLowerCase(), employee]));

    const parsedDates = records.map((record) => normalizeDate(record.date)).filter(Boolean) as string[];
    const uniqueDates = Array.from(new Set(parsedDates));
    const existingAttendance = uniqueDates.length && employees.length
      ? await AppDataSource.getRepository(Attendance).find({
          where: {
            tenantId,
            employeeId: In(employees.map((employee) => employee.employeeId)),
            date: In(uniqueDates.map((date) => new Date(`${date}T00:00:00`))),
          },
        })
      : [];
    const existingByEmployeeDate = new Map(
      existingAttendance.map((attendance) => [`${attendance.employeeId}:${dateKey(attendance.date)}`, attendance])
    );

    const duplicateKeys = new Set<string>();
    const rows = records.map((record, index): AttendanceImportRow => {
      const rowNumber = index + 2;
      const employeeCode = record.employeeCode?.trim() || '';
      const employee = employeesByCode.get(employeeCode.toLowerCase());
      const date = normalizeDate(record.date);
      const status = normalizeStatus(record.status);
      const messages: string[] = [];

      if (!employeeCode) messages.push('Employee code is required');
      else if (!employee) messages.push(`Employee code "${employeeCode}" was not found in this company`);
      if (!date) messages.push('Date must use YYYY-MM-DD or DD/MM/YYYY');
      if (!status) messages.push(`Status "${record.status || ''}" is not supported`);

      const checkIn = date ? normalizeTime(date, record.checkIn) : undefined;
      const checkOut = date ? normalizeTime(date, record.checkOut) : undefined;
      if (record.checkIn?.trim() && !checkIn) messages.push('Check-in must use HH:mm or a valid date-time');
      if (record.checkOut?.trim() && !checkOut) messages.push('Check-out must use HH:mm or a valid date-time');
      if (checkIn && checkOut && new Date(checkOut) < new Date(checkIn)) {
        messages.push('Check-out cannot be earlier than check-in');
      }

      let workMinutes: number | undefined;
      if (record.workMinutes?.trim()) {
        workMinutes = Number(record.workMinutes);
        if (!Number.isInteger(workMinutes) || workMinutes < 0 || workMinutes > 1440) {
          messages.push('Work minutes must be a whole number between 0 and 1440');
          workMinutes = undefined;
        }
      } else if (checkIn && checkOut) {
        workMinutes = Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 60000);
      } else if (status === AttendanceStatus.PRESENT) {
        workMinutes = 480;
      } else if (status === AttendanceStatus.HALF_DAY) {
        workMinutes = 240;
      } else {
        workMinutes = 0;
      }

      const key = employee && date ? `${employee.employeeId}:${date}` : '';
      if (key && duplicateKeys.has(key)) messages.push('The file contains another row for this employee and date');
      if (key) duplicateKeys.add(key);

      const existing = key ? existingByEmployeeDate.get(key) : undefined;
      let action: AttendanceImportAction = 'create';
      if (messages.length) {
        action = 'error';
      } else if (existing) {
        const unchanged =
          existing.status === status &&
          sameInstant(existing.checkIn, checkIn) &&
          sameInstant(existing.checkOut, checkOut) &&
          Number(existing.workMinutes || 0) === Number(workMinutes || 0) &&
          (existing.location || '') === (record.location?.trim() || '');

        if (unchanged) action = 'unchanged';
        else if (conflictPolicy === 'overwrite') action = 'update';
        else {
          action = 'skip';
          messages.push('An attendance record already exists; choose overwrite to replace it');
        }
      }

      if (employee && employee.status !== 'active') {
        messages.push(`Employee is ${employee.status}; historical attendance will still be accepted`);
      }

      return {
        row: rowNumber,
        employeeCode,
        employeeId: employee?.employeeId,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : undefined,
        date: date || record.date?.trim() || '',
        status,
        checkIn,
        checkOut,
        workMinutes,
        location: record.location?.trim() || undefined,
        notes: record.notes?.trim() || undefined,
        action,
        messages,
      };
    });

    const sortedDates = parsedDates.sort();
    const count = (action: AttendanceImportAction) => rows.filter((row) => row.action === action).length;
    return {
      fileName,
      conflictPolicy,
      totalRows: rows.length,
      dateRange: { from: sortedDates[0], to: sortedDates[sortedDates.length - 1] },
      summary: {
        creates: count('create'),
        updates: count('update'),
        unchanged: count('unchanged'),
        skipped: count('skip'),
        errors: count('error'),
        ready: count('create') + count('update'),
      },
      rows,
    };
  }

  async commit(
    tenantId: string,
    userId: string,
    actorEmployeeId: string | undefined,
    fileName: string,
    fileBuffer: Buffer,
    conflictPolicy: AttendanceImportConflictPolicy,
    ipAddress?: string,
    userAgent?: string
  ) {
    const preview = await this.preview(tenantId, fileName, fileBuffer, conflictPolicy);
    if (preview.summary.errors > 0) {
      throw new Error('Import contains validation errors. Correct the file and preview it again.');
    }

    const rowsToSave = preview.rows.filter((row) => row.action === 'create' || row.action === 'update');
    await AppDataSource.transaction(async (manager) => {
      const attendanceRepo = manager.getRepository(Attendance);
      for (const row of rowsToSave) {
        const date = new Date(`${row.date}T00:00:00`);
        let attendance = await attendanceRepo.findOne({
          where: { tenantId, employeeId: row.employeeId!, date },
        });

        if (!attendance) attendance = attendanceRepo.create({ tenantId, employeeId: row.employeeId!, date });
        attendance.status = row.status!;
        attendance.checkIn = row.checkIn ? new Date(row.checkIn) : undefined;
        attendance.checkOut = row.checkOut ? new Date(row.checkOut) : undefined;
        attendance.workMinutes = row.workMinutes || 0;
        attendance.location = row.location;
        attendance.notes = row.notes;
        attendance.isManualOverride = true;
        attendance.overriddenBy = actorEmployeeId;
        attendance.overriddenAt = new Date();
        attendance.overrideReason = `Attendance CSV import: ${fileName}`;
        await attendanceRepo.save(attendance);
      }

      const auditRepo = manager.getRepository(AuditLog);
      await auditRepo.save(
        auditRepo.create({
          tenantId,
          userId,
          action: 'attendance_import',
          entityType: 'AttendanceImport',
          newValue: {
            fileName,
            conflictPolicy,
            dateRange: preview.dateRange,
            summary: preview.summary,
          },
          description: `Imported ${rowsToSave.length} attendance rows from ${fileName}`,
          ipAddress,
          userAgent,
        })
      );
    });

    return {
      ...preview,
      imported: rowsToSave.length,
      message: rowsToSave.length
        ? `${rowsToSave.length} attendance rows imported successfully`
        : 'No attendance changes were required',
    };
  }
}

export const attendanceImportService = new AttendanceImportService();
export default attendanceImportService;
