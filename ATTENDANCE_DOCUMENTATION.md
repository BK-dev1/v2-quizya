# Attendance Tracking System

This document provides comprehensive documentation for the attendance tracking system implemented in Quizya.

## Overview

The attendance tracking system allows teachers to:
- Create attendance sessions for lectures/classes
- Display dynamic QR codes that refresh every 20 seconds
- Track student attendance in real-time
- Export attendance records to Excel
- Verify student location (optional)
- Prevent duplicate check-ins and fraudulent attendance

Students can:
- Scan QR codes to check in without creating an account
- Provide their name and optional email
- Share location for verification (if required by teacher)

## Features

### Security Features

1. **Dynamic QR Codes**: QR codes refresh every 20 seconds (configurable) with unique tokens
2. **Location Verification**: Optional distance-based verification (default: 50 meters)
3. **Duplicate Prevention**: Database constraint prevents same student from checking in twice
4. **Rate Limiting**: API endpoint limits requests to 5 per minute per IP
5. **Token Validation**: Server-side token verification ensures QR codes haven't expired

### Teacher Features

1. **Session Management**:
   - Create sessions with title, description, module, and section
   - Optional location-based verification
   - Configurable QR refresh interval
   - End sessions manually or automatically

2. **Real-time Monitoring**:
   - Live attendance list updates every 5 seconds
   - See check-in times and location verification status
   - Total attendance count

3. **Data Export**:
   - Export to Excel with session details and attendance records
   - Includes student names, emails, check-in times, and verification status

### Student Features

1. **Quick Check-in**:
   - Scan QR code with phone camera
   - No account required
   - Enter name and optional email
   - Location sharing (if required)

2. **Instant Feedback**:
   - Success/error messages
   - Location verification results

## Architecture

### Database Schema

#### attendance_sessions Table
```sql
id                    uuid PRIMARY KEY
title                 text NOT NULL
description           text
teacher_id            uuid NOT NULL (FK to profiles)
module_name           text
section_group         text
location_lat          numeric(10, 8)
location_lng          numeric(11, 8)
max_distance_meters   integer DEFAULT 50
qr_refresh_interval   integer DEFAULT 20
is_active             boolean DEFAULT true
started_at            timestamp DEFAULT now()
ended_at              timestamp
created_at            timestamp DEFAULT now()
updated_at            timestamp DEFAULT now()
```

#### attendance_records Table
```sql
id              uuid PRIMARY KEY
session_id      uuid NOT NULL (FK to attendance_sessions)
student_name    text NOT NULL
student_email   text
check_in_time   timestamp DEFAULT now()
location_lat    numeric(10, 8)
location_lng    numeric(11, 8)
ip_address      text
user_agent      text
created_at      timestamp DEFAULT now()

UNIQUE(session_id, student_name, student_email)
```

### API Endpoints

#### POST /api/attendance/sessions
Create a new attendance session.

**Request Body:**
```json
{
  "title": "Morning Lecture - Week 1",
  "description": "Introduction to Computer Science",
  "module_name": "CS101",
  "section_group": "Group A",
  "location_lat": 40.7128,
  "location_lng": -74.0060,
  "max_distance_meters": 50,
  "qr_refresh_interval": 20
}
```

**Response:**
```json
{
  "session": {
    "id": "...",
    "title": "Morning Lecture - Week 1",
    ...
  }
}
```

#### GET /api/attendance/sessions
List all sessions for the authenticated teacher.

**Response:**
```json
{
  "sessions": [...]
}
```

#### GET /api/attendance/sessions/[id]
Get session details with QR code data and attendance records.

**Response:**
```json
{
  "session": {...},
  "qrCode": "data:image/png;base64,...",
  "qrData": {
    "sessionId": "...",
    "token": "...",
    "expiresAt": 1234567890
  }
}
```

#### POST /api/attendance/check-in
Student check-in endpoint (public, no authentication required).

**Request Body:**
```json
{
  "sessionId": "...",
  "token": "...",
  "studentName": "John Doe",
  "studentEmail": "john@example.com",
  "locationLat": 40.7128,
  "locationLng": -74.0060
}
```

**Response:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully",
  "record": {...}
}
```

#### GET /api/attendance/sessions/[id]/export
Export attendance records to Excel.

**Response:** Excel file download

### Services

#### attendance-sessions.ts
Database operations for attendance sessions and records.

Key functions:
- `createAttendanceSession()`
- `getAttendanceSession()`
- `getAttendanceSessionWithRecords()`
- `createAttendanceRecord()`
- `checkDuplicateAttendance()`

#### qr-generator.ts
QR code generation and token management.

Key functions:
- `generateQRCode()` - Generate QR code as data URL
- `createQRData()` - Create token data with expiration
- `verifyToken()` - Server-side token validation
- `storeToken()` - Store valid tokens

#### location.ts
Location-based verification utilities.

Key functions:
- `calculateDistance()` - Haversine formula for distance calculation
- `verifyLocation()` - Verify student is within acceptable range
- `getUserLocation()` - Client-side geolocation API wrapper

#### excel-export.ts
Excel export functionality.

Key functions:
- `generateAttendanceExcel()` - Create Excel workbook from attendance data
- `createExcelResponse()` - Create downloadable response

## UI Components

### Teacher Dashboard

#### /dashboard/attendance
List of all attendance sessions with:
- Create new session button
- Search functionality
- Session cards showing status, module, section
- Quick actions: View QR, Export, Delete

#### /dashboard/attendance/[id]
Active session page with:
- QR code display (auto-refreshes)
- Session information
- Real-time attendance list
- Statistics (total attendance)
- End session button
- Export button

### Student Check-in

#### /attendance/check-in?session=[id]&token=[token]
Public check-in form with:
- Name input (required)
- Email input (optional)
- Location capture button
- Success/error feedback

## Usage Guide

### For Teachers

1. **Create a Session**:
   ```
   Dashboard → Attendance → New Session
   ```
   - Enter session details
   - Optionally capture location
   - Click "Create Session"

2. **Display QR Code**:
   - Session opens automatically after creation
   - QR code displays and refreshes every 20 seconds
   - Show QR code to students (projector, screen share, etc.)

3. **Monitor Attendance**:
   - Watch real-time attendance list
   - Verify location status for each student
   - See total attendance count

4. **End Session**:
   - Click "End Session" button
   - QR code stops refreshing
   - Session marked as inactive

5. **Export Data**:
   - Click "Export" button
   - Excel file downloads with all attendance records

### For Students

1. **Scan QR Code**:
   - Open camera app or QR scanner
   - Scan the displayed QR code
   - Browser opens check-in page

2. **Fill Information**:
   - Enter full name (required)
   - Enter email (optional)
   - Click "Get My Location" if required

3. **Check In**:
   - Click "Check In" button
   - See success confirmation

## Security Considerations

### Production Deployment

⚠️ **Important**: The current implementation uses in-memory storage for:
- QR code token validation
- Rate limiting

This will **NOT** work correctly in:
- Multi-instance deployments (load-balanced servers)
- Serverless environments (Vercel, AWS Lambda, etc.)

**Recommended for Production:**
1. Use Redis or similar distributed storage for:
   - Token validation store
   - Rate limiting counters

2. Implement proper session management
3. Add additional anti-fraud measures if needed

### Known Vulnerabilities

**Previous Issue (Resolved):**
- The xlsx package (v0.18.5) had known vulnerabilities (ReDoS and Prototype Pollution)
- **✅ Fixed**: Replaced with `exceljs` (v4.4.0) which has no known vulnerabilities
- `exceljs` is actively maintained and provides better features, styling, and security

### Security Best Practices

1. **Token Rotation**: QR codes expire after 20 seconds
2. **Location Verification**: Optional but recommended for high-security requirements
3. **Rate Limiting**: Prevents spam and abuse
4. **Duplicate Prevention**: Database constraint ensures one check-in per student per session
5. **HTTPS Required**: Always use HTTPS in production

## Troubleshooting

### Students Can't Check In

1. **Check QR Code Expiration**: Ensure they're scanning an active QR code
2. **Verify Location**: If location is required, ensure they're within range
3. **Check Duplicate**: Student may have already checked in
4. **Rate Limiting**: Student may have exceeded rate limit (wait 1 minute)

### QR Code Not Refreshing

1. **Session Status**: Ensure session is active
2. **Network Connection**: Check internet connectivity
3. **Browser Issues**: Try refreshing the page

### Export Not Working

1. **Browser Permissions**: Ensure browser allows downloads
2. **Session Access**: Verify teacher owns the session
3. **Data Availability**: Ensure session has attendance records

## Future Enhancements

Potential improvements:
1. SMS notifications for attendance
2. Facial recognition integration
3. Biometric verification
4. Analytics dashboard
5. Automated attendance reports
6. Integration with student information systems
7. Multi-language support for check-in form
8. Attendance patterns and insights

## Support

For issues or questions:
1. Check this documentation
2. Review error messages carefully
3. Check browser console for errors
4. Contact system administrator

## License

Part of the Quizya application.
