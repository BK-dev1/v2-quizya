# Attendance System User Guide

## Overview

The Hard-to-Break Attendance System is a secure, multi-layered attendance tracking solution designed to prevent fraud and ensure physical presence verification.

---

## For Teachers

### Generating Attendance QR Codes

1. **Navigate to Attendance Dashboard**
   - Go to `/dashboard/attendance`
   - The system will automatically request your location permissions

2. **Configure Session**
   - **Session Name**: Enter a descriptive name (e.g., "CS101 Lecture - Week 5")
   - **Geofence Radius**: Set the allowed distance in meters (default: 50m)
   - **Duration**: Set how long the session remains active (default: 60 minutes)

3. **Generate QR Code**
   - Click "Generate Secure QR Code"
   - A QR code will be displayed with:
     - Session Code (8-character alphanumeric)
     - Remaining time
     - Location coordinates
     - Geofence radius

4. **Display QR Code**
   - Project the QR code on a screen or display device
   - Students need to scan this QR code to mark attendance
   - QR code updates automatically every 15 seconds (TOTP rotation)

5. **Monitor Session**
   - The system shows remaining time
   - Security features are automatically active
   - Session expires after the configured duration

### Security Features (Automatic)

✅ **TOTP Rotation**: QR code changes every 15 seconds
✅ **Location Binding**: Student location is verified against your location
✅ **Device Tracking**: Each device can only mark attendance once
✅ **HMAC Signatures**: QR data is cryptographically signed

---

## For Students

### Marking Attendance

1. **Navigate to Attendance Dashboard**
   - Go to `/dashboard/attendance`
   - Enable location permissions when prompted

2. **Scan or Enter QR Code**
   - **Option A**: Use camera to scan teacher's QR code (requires camera integration)
   - **Option B**: Copy/paste QR code JSON data into the input field

3. **Verify Location**
   - Click "Verify QR Code & Location"
   - System checks:
     - QR code validity (TOTP, signature)
     - Your distance from teacher
     - Session expiration status

4. **Mark Attendance**
   - If verification passes, click "Mark My Attendance"
   - System records:
     - Your attendance log
     - Device fingerprint
     - GPS coordinates
     - Distance from teacher

5. **Confirmation**
   - Success screen shows:
     - Attendance ID
     - Timestamp
     - Distance from teacher
     - Security verifications passed

### Requirements

⚠️ **Must Have**:
- Location permissions enabled
- Within geofence radius (default: 50m from teacher)
- Fresh QR code (less than 30 seconds old)
- Unique device (one submission per device per session)

---

## Security Layers Explained

### 1. Domain Authentication (@ensia.edu.dz)
- Only users with `@ensia.edu.dz` email can sign in via Google OAuth
- Enforced at OAuth request and callback levels

### 2. TOTP QR Codes (15-second rotation)
- Time-based One-Time Password embedded in QR
- QR code expires every 15-30 seconds
- Cannot be reused or shared effectively

### 3. Geofencing (Haversine Formula)
- Calculates distance between student and teacher GPS coordinates
- Default 50-meter radius (configurable)
- Accounts for Earth's curvature

### 4. Device Fingerprinting
- Generates unique hash based on:
  - User-Agent
  - Device Memory
  - Screen Resolution
  - Timezone
  - Hardware specs
- One submission per device per session

### 5. HMAC-SHA256 Signing
- QR data is cryptographically signed
- Binds QR to teacher session
- Prevents tampering

### 6. Rate Limiting
- 60-second cooldown between attempts
- Prevents brute force attacks
- Redis-backed for fast checks

---

## API Endpoints

### Teacher Endpoints

#### Generate QR Code
```
POST /api/attendance/generate-qr

Body:
{
  "sessionName": "CS101 Lecture",
  "latitude": 36.7538,
  "longitude": 3.0588,
  "radius": 50,           // optional, default: 50
  "durationMinutes": 60   // optional, default: 60
}

Response:
{
  "success": true,
  "sessionCode": "ABC12345",
  "sessionId": "uuid",
  "qrDataUrl": "data:image/png;base64,...",
  "expiresAt": "2024-01-01T12:00:00Z"
}
```

### Student Endpoints

#### Verify QR Code
```
POST /api/attendance/verify

Body:
{
  "qrPayload": "{\"sessionCode\":\"ABC12345\",...}",
  "studentLatitude": 36.7539,
  "studentLongitude": 3.0589
}

Response:
{
  "success": true,
  "sessionCode": "ABC12345",
  "distance": 45.67,
  "withinGeofence": true,
  "maxDistance": 50,
  "message": "QR code and location verified successfully"
}
```

#### Mark Attendance
```
POST /api/attendance/mark

Body:
{
  "sessionCode": "ABC12345",
  "qrPayload": "{...}",
  "studentLatitude": 36.7539,
  "studentLongitude": 3.0589,
  "deviceFingerprint": "hash...",
  "userAgent": "Mozilla/5.0...",
  "screenResolution": "1920x1080",
  "timezone": "Africa/Algiers"
}

Response:
{
  "success": true,
  "attendanceId": "uuid",
  "markedAt": "2024-01-01T12:00:00Z",
  "distance": 45.67,
  "message": "Attendance marked successfully!"
}
```

---

## Database Schema

### attendance_sessions
Stores teacher-initiated attendance sessions
- `id` (UUID): Primary key
- `teacher_id` (UUID): Teacher reference
- `session_name` (TEXT): Session description
- `session_code` (TEXT): 8-character unique code
- `totp_secret` (TEXT): TOTP secret for verification
- `teacher_latitude` (DECIMAL): Teacher GPS latitude
- `teacher_longitude` (DECIMAL): Teacher GPS longitude
- `geofence_radius_meters` (INTEGER): Allowed radius
- `expires_at` (TIMESTAMP): Session expiration
- `is_active` (BOOLEAN): Active status

### attendance_logs
Records student attendance markings
- `id` (UUID): Primary key
- `session_id` (UUID): Session reference
- `student_id` (UUID): Student reference
- `device_fingerprint` (TEXT): Hashed device ID
- `student_latitude` (DECIMAL): Student GPS latitude
- `student_longitude` (DECIMAL): Student GPS longitude
- `distance_meters` (DECIMAL): Distance from teacher
- `totp_code` (TEXT): TOTP code used
- `marked_at` (TIMESTAMP): Attendance timestamp

### device_registry
Tracks device fingerprints
- `id` (UUID): Primary key
- `device_fingerprint` (TEXT): Unique hashed ID
- `user_id` (UUID): User reference
- `user_agent` (TEXT): Browser info
- `first_seen_at` (TIMESTAMP): First use
- `last_seen_at` (TIMESTAMP): Last use

### geofence_validations
Audit trail for location checks
- `id` (UUID): Primary key
- `attendance_log_id` (UUID): Attendance reference
- `session_id` (UUID): Session reference
- `student_id` (UUID): Student reference
- `is_valid` (BOOLEAN): Validation result
- `distance_meters` (DECIMAL): Measured distance
- `validation_reason` (TEXT): Result explanation

---

## Environment Variables

Required for full functionality:

```env
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Redis (Optional - for caching and rate limiting)
REDIS_URL=redis://localhost:6379
# Or Redis Cloud: redis://default:password@host:port

# App URL (for OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: The system works without Redis, but performance and rate limiting will be limited.

---

## Troubleshooting

### Location Not Available
- **Browser Permissions**: Check if location permissions are enabled
- **HTTPS**: Geolocation API requires HTTPS (except localhost)
- **Mobile**: Enable location services in device settings

### QR Code Expired
- QR codes expire every 15-30 seconds
- Scan immediately after display
- Teacher can refresh QR if needed

### Outside Geofence
- Move closer to teacher location
- Check GPS accuracy (use outdoors for better signal)
- Teacher can increase radius if needed

### Device Already Used
- Each device can mark attendance once per session
- Use different device or contact teacher
- Prevents sharing of devices

### Rate Limited
- Wait 60 seconds between attempts
- Prevents rapid repeated submissions
- Contact teacher if genuine issue

---

## Testing Guide

### Manual Testing

1. **Teacher Flow**:
   ```
   1. Login as teacher (@ensia.edu.dz)
   2. Go to /dashboard/attendance
   3. Allow location
   4. Generate QR code
   5. Note session code and QR payload
   ```

2. **Student Flow**:
   ```
   1. Login as student (@ensia.edu.dz)
   2. Go to /dashboard/attendance
   3. Allow location
   4. Paste QR payload
   5. Verify and mark attendance
   ```

### Security Testing

1. **TOTP Expiration**: Wait 30 seconds, try old QR - should fail
2. **Geofencing**: Change GPS coordinates outside radius - should fail
3. **Device Reuse**: Mark attendance twice from same device - should fail
4. **Domain Restriction**: Try signing in with non-@ensia.edu.dz email - should fail
5. **Signature Tampering**: Modify QR payload - should fail

---

## Performance Considerations

### Redis Caching
- Session data cached for duration
- TOTP secrets cached
- Device usage cached for 24 hours
- Rate limits cached for 60 seconds

### Database Indexes
- `session_code` indexed for fast lookups
- `student_id` + `session_id` compound for duplicate checks
- `device_fingerprint` indexed for reuse detection

### Optimization Tips
- Use Redis in production for best performance
- Monitor database query performance
- Consider CDN for QR code images
- Implement pagination for attendance logs

---

## Security Best Practices

1. **Enable HTTPS**: Required for geolocation API
2. **Rotate Secrets**: Periodically rotate TOTP secrets
3. **Monitor Logs**: Review geofence_validations for fraud
4. **Audit Devices**: Check device_registry for suspicious patterns
5. **Set Reasonable Radius**: Balance security vs. usability
6. **Backup Strategy**: Regular database backups
7. **Rate Monitoring**: Monitor rate limit hits

---

## Future Enhancements

Potential improvements:
- 📸 Camera-based QR scanning (html5-qrcode integration)
- 🎭 Face recognition verification
- 🔵 Bluetooth proximity detection
- 🤖 ML-based fraud detection
- 📊 Analytics dashboard for teachers
- 📱 Mobile app (React Native)
- ⛓️ Blockchain audit trail
- 🔔 Real-time notifications

---

## Support

For issues or questions:
1. Check this README
2. Review ATTENDANCE_SECURITY.md for technical details
3. Check server logs for errors
4. Contact system administrator

---

## License

Part of the v2-quizya project.
