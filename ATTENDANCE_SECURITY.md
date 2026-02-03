# Hard-to-Break Attendance System - Security Documentation

## Overview

This document describes the security mechanisms implemented in the Hard-to-Break Attendance System. The system employs multiple layers of security to prevent attendance fraud and ensure that only legitimate students can mark their attendance.

---

## 1. Google OAuth Domain Restriction

### Purpose
Ensure only users from the authorized educational domain can access the system.

### Implementation
- **Domain Filter**: `@ensia.edu.dz`
- **Frontend**: OAuth request includes `hd` (hosted domain) parameter
- **Backend**: Callback validates email domain after authentication

### Pseudo-code

```
FUNCTION authenticateWithGoogle():
    REQUEST oauth_url FROM google WITH:
        provider = "google"
        redirectTo = "/api/auth/callback"
        queryParams = {
            hd: "ensia.edu.dz",           // Domain restriction
            prompt: "select_account"        // Force account picker
        }
    
    REDIRECT user TO oauth_url
END FUNCTION

FUNCTION handleOAuthCallback(authCode):
    session = EXCHANGE authCode FOR session
    
    IF session.provider == "google":
        email = session.user.email
        domain = EXTRACT_DOMAIN(email)
        
        IF domain != "ensia.edu.dz":
            SIGN_OUT user
            REDIRECT TO "/auth/login?error=Only @ensia.edu.dz allowed"
        END IF
    END IF
    
    REDIRECT TO "/dashboard"
END FUNCTION
```

---

## 2. Dynamic TOTP QR Code Generation

### Purpose
Generate time-based one-time password (TOTP) QR codes that rotate every 15 seconds, making them extremely difficult to share or reuse.

### Implementation
- **TOTP Step**: 15 seconds
- **Algorithm**: HMAC-SHA256
- **Window**: ±1 step (30 seconds total validity)
- **Secret**: Unique per session, stored encrypted

### Pseudo-code

```
FUNCTION generateAttendanceQR(teacher, sessionName, location):
    VERIFY teacher.role == "teacher"
    
    // Generate cryptographic secrets
    totpSecret = GENERATE_TOTP_SECRET()  // 32-byte base32 encoded
    sessionCode = GENERATE_RANDOM_CODE(8)  // Alphanumeric
    
    // Calculate expiration
    expiresAt = NOW() + durationMinutes * 60
    
    // Store session in database
    session = CREATE attendance_session WITH:
        teacher_id = teacher.id
        session_code = sessionCode
        totp_secret = totpSecret
        teacher_latitude = location.lat
        teacher_longitude = location.lon
        geofence_radius_meters = 50
        expires_at = expiresAt
        is_active = true
    
    // Cache in Redis for fast lookups
    CACHE_SESSION(sessionCode, session, TTL=durationMinutes*60)
    CACHE_TOTP_SECRET(sessionCode, totpSecret, TTL=durationMinutes*60)
    
    // Generate TOTP code (rotates every 15 seconds)
    currentTOTP = GENERATE_TOTP_CODE(totpSecret)
    
    // Create signed payload
    timestamp = UNIX_TIMESTAMP()
    data = teacher.id + "|" + timestamp + "|" + sessionCode
    signature = HMAC_SHA256(data, totpSecret)
    
    qrPayload = JSON_STRINGIFY({
        sessionCode: sessionCode,
        timestamp: timestamp,
        signature: signature,
        totpCode: currentTOTP
    })
    
    // Generate QR code image
    qrImage = GENERATE_QR_CODE(qrPayload, {
        errorCorrection: "HIGH",
        width: 400
    })
    
    RETURN {
        sessionCode: sessionCode,
        qrDataUrl: qrImage,  // Base64 data URL
        expiresAt: expiresAt
    }
END FUNCTION
```

### Security Properties
1. **Time-bound**: QR codes expire after 15-30 seconds
2. **Session-bound**: Each QR is tied to a specific attendance session
3. **Signed**: HMAC signature prevents tampering
4. **Non-replayable**: Timestamp validation prevents old QR reuse

---

## 3. Geofencing with Haversine Formula

### Purpose
Ensure students are physically present within a defined radius (default: 50 meters) of the teacher's location.

### Implementation
- **Algorithm**: Haversine formula for great-circle distance
- **Precision**: Accounts for Earth's curvature
- **Default Radius**: 50 meters (configurable)
- **Validation**: Client coordinates must be within radius

### Pseudo-code

```
FUNCTION calculateHaversineDistance(lat1, lon1, lat2, lon2):
    R = 6371000  // Earth radius in meters
    
    φ1 = TO_RADIANS(lat1)
    φ2 = TO_RADIANS(lat2)
    Δφ = TO_RADIANS(lat2 - lat1)
    Δλ = TO_RADIANS(lon2 - lon1)
    
    a = SIN(Δφ/2)² + COS(φ1) × COS(φ2) × SIN(Δλ/2)²
    c = 2 × ATAN2(√a, √(1-a))
    
    distance = R × c  // Distance in meters
    
    RETURN distance
END FUNCTION

FUNCTION validateGeofence(teacherLat, teacherLon, studentLat, studentLon, radius):
    distance = calculateHaversineDistance(
        teacherLat, teacherLon, 
        studentLat, studentLon
    )
    
    isValid = (distance <= radius)
    
    // Log validation for audit trail
    LOG_GEOFENCE_VALIDATION({
        distance: distance,
        isValid: isValid,
        reason: IF isValid THEN "Within geofence" 
                ELSE "Outside geofence (" + distance + "m > " + radius + "m)"
    })
    
    RETURN {
        isValid: isValid,
        distance: ROUND(distance, 2)
    }
END FUNCTION
```

### Security Properties
1. **Physical Presence**: Verifies student is at the location
2. **GPS Spoofing Detection**: Combined with other checks
3. **Audit Trail**: All validations logged for review
4. **Configurable Radius**: Adjustable per session

---

## 4. Device Fingerprinting

### Purpose
Prevent multiple attendance submissions from the same device, stopping device sharing.

### Implementation
- **Fingerprint Components**:
  - User-Agent string
  - Device Memory (if available)
  - Screen Resolution
  - Timezone
- **Hashing**: SHA-256 for privacy
- **Storage**: PostgreSQL + Redis cache

### Pseudo-code

```
FUNCTION generateDeviceFingerprint(userAgent, deviceMemory, screenResolution, timezone):
    components = [
        userAgent,
        deviceMemory OR "unknown",
        screenResolution OR "unknown",
        timezone OR "unknown"
    ]
    
    fingerprintData = JOIN(components, "|")
    hash = SHA256(fingerprintData)
    
    RETURN hash  // 64-character hex string
END FUNCTION

FUNCTION validateDeviceFingerprint(deviceFingerprint, sessionCode, userId):
    // Check Redis cache first (fast lookup)
    IF REDIS_EXISTS("attendance:device:" + sessionCode + ":" + deviceFingerprint):
        RETURN {
            isValid: false,
            reason: "Device already used for this session"
        }
    END IF
    
    // Check database for duplicate submissions
    existingLog = QUERY attendance_logs WHERE:
        session_id = sessionCode AND
        device_fingerprint = deviceFingerprint
    
    IF existingLog EXISTS:
        RETURN {
            isValid: false,
            reason: "Device already used"
        }
    END IF
    
    // Mark device as used (cache for 24 hours)
    REDIS_SET("attendance:device:" + sessionCode + ":" + deviceFingerprint, "1", TTL=86400)
    
    // Register device in database
    UPSERT INTO device_registry:
        device_fingerprint = deviceFingerprint
        user_id = userId
        last_seen_at = NOW()
    
    RETURN {
        isValid: true
    }
END FUNCTION
```

### Security Properties
1. **Device Uniqueness**: One submission per device per session
2. **Privacy-Preserving**: Hashed fingerprints (not reversible)
3. **Persistent**: Tracked across sessions
4. **Auditable**: Device usage history maintained

---

## 5. Complete Attendance Flow

### Student Attendance Marking Process

```
FUNCTION markAttendance(student, qrPayload, studentLocation, deviceInfo):
    // Step 1: Authentication & Authorization
    VERIFY student.isAuthenticated
    VERIFY student.role == "student"
    
    // Step 2: Rate Limiting
    IF RATE_LIMIT_EXCEEDED(student.id, sessionCode, window=60):
        RETURN ERROR "Rate limit exceeded. Wait 60 seconds."
    END IF
    
    // Step 3: Device Fingerprinting
    deviceFingerprint = generateDeviceFingerprint(
        deviceInfo.userAgent,
        deviceInfo.deviceMemory,
        deviceInfo.screenResolution,
        deviceInfo.timezone
    )
    
    IF isDeviceUsed(deviceFingerprint, sessionCode):
        RETURN ERROR "Device already used for this session"
    END IF
    
    // Step 4: Duplicate Check
    IF ATTENDANCE_ALREADY_MARKED(student.id, sessionCode):
        RETURN ERROR "Attendance already marked"
    END IF
    
    // Step 5: Session Validation
    session = GET_SESSION(sessionCode)
    
    IF NOT session OR NOT session.is_active OR session.expires_at < NOW():
        RETURN ERROR "Session expired or inactive"
    END IF
    
    // Step 6: QR Payload Verification
    payload = PARSE_JSON(qrPayload)
    
    // 6a. Verify timestamp (prevent replay attacks)
    age = NOW() - payload.timestamp
    IF age > 30000:  // 30 seconds
        RETURN ERROR "QR code expired"
    END IF
    
    // 6b. Verify HMAC signature
    expectedData = session.teacherId + "|" + payload.timestamp + "|" + sessionCode
    expectedSignature = HMAC_SHA256(expectedData, session.totpSecret)
    
    IF NOT TIMING_SAFE_EQUAL(payload.signature, expectedSignature):
        RETURN ERROR "Invalid signature"
    END IF
    
    // 6c. Verify TOTP code
    IF NOT VERIFY_TOTP(payload.totpCode, session.totpSecret):
        RETURN ERROR "Invalid TOTP code"
    END IF
    
    // Step 7: Geofencing Validation
    geofence = validateGeofence(
        session.teacherLat,
        session.teacherLon,
        studentLocation.lat,
        studentLocation.lon,
        session.radius
    )
    
    IF NOT geofence.isValid:
        RETURN ERROR "Outside geofence: " + geofence.distance + "m > " + session.radius + "m"
    END IF
    
    // Step 8: Mark Attendance
    attendanceLog = INSERT INTO attendance_logs:
        session_id = session.id
        student_id = student.id
        device_fingerprint = deviceFingerprint
        student_latitude = studentLocation.lat
        student_longitude = studentLocation.lon
        distance_meters = geofence.distance
        totp_code = payload.totpCode
        marked_at = NOW()
    
    // Step 9: Post-processing
    markDeviceUsed(deviceFingerprint, sessionCode, TTL=86400)
    
    INSERT INTO geofence_validations:
        attendance_log_id = attendanceLog.id
        session_id = session.id
        student_id = student.id
        is_valid = true
        distance_meters = geofence.distance
        validation_reason = "Attendance marked successfully"
    
    RETURN {
        success: true,
        attendanceId: attendanceLog.id,
        markedAt: attendanceLog.marked_at,
        distance: geofence.distance
    }
END FUNCTION
```

---

## 6. Security Guarantees

### Multi-Layer Defense

1. **Layer 1: Domain Authentication**
   - Only @ensia.edu.dz accounts allowed
   - OAuth-level enforcement

2. **Layer 2: TOTP QR Codes**
   - 15-second rotation
   - Cryptographically signed
   - Timestamp-validated

3. **Layer 3: Geofencing**
   - 50-meter radius (configurable)
   - Haversine formula precision
   - GPS coordinate validation

4. **Layer 4: Device Fingerprinting**
   - Unique device identification
   - One submission per device
   - Privacy-preserving hashing

5. **Layer 5: Rate Limiting**
   - Prevents brute force
   - 60-second cooldown
   - Redis-backed

6. **Layer 6: Duplicate Prevention**
   - Database-level unique constraints
   - Redis cache for fast checks
   - Audit trail

### Attack Resistance

| Attack Vector | Defense Mechanism |
|--------------|------------------|
| Screenshot sharing | TOTP rotation (15s) + timestamp validation |
| GPS spoofing | Geofencing + device fingerprinting |
| Device sharing | Device fingerprinting + one-time use |
| Replay attacks | Timestamp validation + TOTP verification |
| Brute force | Rate limiting + account lockout |
| Man-in-the-middle | HMAC signatures + HTTPS |
| Multiple submissions | Unique constraints + duplicate checks |
| Unauthorized domain | OAuth domain restriction |

---

## 7. Database Schema

### attendance_sessions
- Stores teacher-initiated attendance sessions
- Contains TOTP secrets and geofencing parameters
- Indexed for fast lookups by session_code

### device_registry
- Tracks unique device fingerprints
- Maintains usage history
- Privacy-preserving (hashed fingerprints)

### attendance_logs
- Records all attendance markings
- Includes location and distance data
- Enforces unique constraint per student per session

### geofence_validations
- Audit trail for all geofencing checks
- Records both valid and invalid attempts
- Useful for fraud detection and analytics

---

## 8. Performance Optimizations

### Redis Caching
- Session metadata cached for fast lookups
- TOTP secrets cached to avoid DB hits
- Device usage cached for 24 hours
- Rate limit counters in Redis

### Database Indexes
- attendance_sessions: session_code, teacher_id, is_active
- device_registry: device_fingerprint, user_id
- attendance_logs: session_id, student_id
- geofence_validations: session_id, student_id

### Fallback Strategy
- Redis failures don't break functionality
- Falls back to database-only mode
- Logs warnings but continues operation

---

## 9. Privacy & Compliance

### Data Protection
- Device fingerprints are SHA-256 hashed
- GPS coordinates stored with consent
- Audit logs for compliance
- GDPR-ready data retention policies

### User Consent
- Location permission required
- Device fingerprinting disclosed
- Privacy policy acknowledgment

---

## 10. Future Enhancements

1. **Biometric Verification**: Face recognition or fingerprint
2. **ML-Based Fraud Detection**: Anomaly detection for suspicious patterns
3. **Bluetooth Proximity**: Additional verification layer
4. **Live Photo Capture**: Timestamp-verified photos
5. **Blockchain Audit Trail**: Immutable attendance records

---

## Conclusion

The Hard-to-Break Attendance System implements defense-in-depth security with multiple independent layers. Breaking the system would require simultaneously defeating:
1. Domain authentication
2. TOTP verification (15s rotation)
3. Geofencing (physical presence)
4. Device fingerprinting
5. Rate limiting
6. Duplicate prevention

This makes fraudulent attendance marking extremely difficult while maintaining a smooth user experience for legitimate users.
