import { Workbook } from 'exceljs'
import { AttendanceRecord } from '@/lib/types'

export interface AttendanceExportData {
  sessionTitle: string
  moduleName?: string
  sectionGroup?: string
  startedAt: string
  endedAt?: string
  records: AttendanceRecord[]
}

/**
 * Generate Excel file from attendance records using ExcelJS
 * This replaces the vulnerable xlsx package with a secure alternative
 */
export async function generateAttendanceExcel(data: AttendanceExportData): Promise<Buffer> {
  // Create workbook
  const workbook = new Workbook()
  workbook.creator = 'Quizya Attendance System'
  workbook.created = new Date()
  
  // Add worksheet
  const worksheet = workbook.addWorksheet('Attendance', {
    properties: { tabColor: { argb: 'FF00FF00' } }
  })

  // Add title row
  worksheet.addRow(['Attendance Report'])
  worksheet.getRow(1).font = { size: 16, bold: true }
  worksheet.addRow([]) // Empty row

  // Add session information
  worksheet.addRow(['Session Title:', data.sessionTitle])
  worksheet.addRow(['Module:', data.moduleName || 'N/A'])
  worksheet.addRow(['Section/Group:', data.sectionGroup || 'N/A'])
  worksheet.addRow(['Started At:', new Date(data.startedAt).toLocaleString()])
  worksheet.addRow(['Ended At:', data.endedAt ? new Date(data.endedAt).toLocaleString() : 'Ongoing'])
  worksheet.addRow(['Total Attendees:', data.records.length])
  worksheet.addRow([]) // Empty row

  // Make info labels bold
  for (let i = 3; i <= 8; i++) {
    worksheet.getRow(i).getCell(1).font = { bold: true }
  }

  // Add attendance records header
  const headerRow = worksheet.addRow([
    'No.',
    'Student Name',
    'Email',
    'Check-In Time',
    'Location Status',
    'IP Address'
  ])
  
  // Style header row
  headerRow.font = { bold: true }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  }
  headerRow.border = {
    bottom: { style: 'thin' }
  }

  // Add attendance records
  data.records.forEach((record, index) => {
    worksheet.addRow([
      index + 1,
      record.student_name,
      record.student_email || 'N/A',
      new Date(record.check_in_time).toLocaleString(),
      record.location_lat && record.location_lng ? 'Verified' : 'Not Verified',
      record.ip_address || 'N/A'
    ])
  })

  // Set column widths
  worksheet.columns = [
    { width: 5 },   // No.
    { width: 25 },  // Student Name
    { width: 30 },  // Email
    { width: 20 },  // Check-In Time
    { width: 15 },  // Location Status
    { width: 15 }   // IP Address
  ]

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
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
  return new Response(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
