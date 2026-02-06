import * as XLSX from 'xlsx'
import { AttendanceRecord } from '@/lib/types'

// SECURITY NOTE: The xlsx package (v0.18.5) has known vulnerabilities (ReDoS and Prototype Pollution)
// No patched version is available yet. The vulnerabilities are in the parsing logic.
// Our usage is limited to generating Excel files (not parsing untrusted input), which is safer.
// Monitor for updates: https://github.com/advisories?query=xlsx
// Consider switching to an alternative library if needed in production.

export interface AttendanceExportData {
  sessionTitle: string
  moduleName?: string
  sectionGroup?: string
  startedAt: string
  endedAt?: string
  records: AttendanceRecord[]
}

/**
 * Generate Excel file from attendance records
 */
export function generateAttendanceExcel(data: AttendanceExportData): Buffer {
  // Create workbook
  const workbook = XLSX.utils.book_new()

  // Prepare session info sheet
  const sessionInfo = [
    ['Attendance Report'],
    [],
    ['Session Title:', data.sessionTitle],
    ['Module:', data.moduleName || 'N/A'],
    ['Section/Group:', data.sectionGroup || 'N/A'],
    ['Started At:', new Date(data.startedAt).toLocaleString()],
    ['Ended At:', data.endedAt ? new Date(data.endedAt).toLocaleString() : 'Ongoing'],
    ['Total Attendees:', data.records.length],
    []
  ]

  // Prepare attendance records sheet
  const recordHeaders = [
    'No.',
    'Student Name',
    'Email',
    'Check-In Time',
    'Distance (m)',
    'IP Address'
  ]

  const recordRows = data.records.map((record, index) => [
    index + 1,
    record.student_name,
    record.student_email || 'N/A',
    new Date(record.check_in_time).toLocaleString(),
    record.location_lat && record.location_lng ? 'Verified' : 'Not Verified',
    record.ip_address || 'N/A'
  ])

  // Combine session info and records
  const worksheetData = [
    ...sessionInfo,
    recordHeaders,
    ...recordRows
  ]

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // No.
    { wch: 25 },  // Student Name
    { wch: 30 },  // Email
    { wch: 20 },  // Check-In Time
    { wch: 15 },  // Distance
    { wch: 15 }   // IP Address
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance')

  // Generate buffer
  const excelBuffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx'
  })

  return excelBuffer
}

/**
 * Generate filename for attendance export
 */
export function generateAttendanceFilename(sessionTitle: string, date: Date = new Date()): string {
  const sanitizedTitle = sessionTitle
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
  const dateStr = date.toISOString().split('T')[0]
  
  return `attendance_${sanitizedTitle}_${dateStr}.xlsx`
}

/**
 * Create download response for Excel file
 */
export function createExcelResponse(buffer: Buffer, filename: string) {
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
