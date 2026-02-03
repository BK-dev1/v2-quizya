# Hard-to-Break Attendance System - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HARD-TO-BREAK ATTENDANCE SYSTEM                          │
│                         Multi-Layer Security                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                                                                                
┌───────────────────────────────────────────────────────────────────────────┐
│                            LAYER 1: AUTHENTICATION                        │
│                                                                           │
│   Google OAuth (@ensia.edu.dz only)                                      │
│   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐       │
│   │ OAuth Request│ ────> │ Domain Check │ ────> │   Callback   │       │
│   │  (hd param)  │       │ @ensia.edu.dz│       │  Validation  │       │
│   └──────────────┘       └──────────────┘       └──────────────┘       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         TEACHER FLOW (Generate QR)                        │
│                                                                           │
│   1. Get Location (GPS)                                                  │
│   2. Configure Session (name, radius, duration)                          │
│   3. Generate TOTP Secret (Base32)                                       │
│   4. Create Session Code (8-char alphanumeric)                           │
│                                                                           │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  QR Payload Generation:                                      │       │
│   │  ┌──────────────────────────────────────────────────────┐   │       │
│   │  │ Data = TeacherID | Timestamp | SessionCode          │   │       │
│   │  │ Signature = HMAC-SHA256(Data, TOTPSecret)          │   │       │
│   │  │ TOTPCode = Generate(TOTPSecret, step=15s)          │   │       │
│   │  │                                                      │   │       │
│   │  │ Payload = JSON.stringify({                          │   │       │
│   │  │   sessionCode,                                      │   │       │
│   │  │   timestamp,                                        │   │       │
│   │  │   signature,                                        │   │       │
│   │  │   totpCode                                          │   │       │
│   │  │ })                                                  │   │       │
│   │  └──────────────────────────────────────────────────────┘   │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                           │
│   5. Generate QR Image (Base64)                                          │
│   6. Cache in Redis (session, TOTP)                                      │
│   7. Store in PostgreSQL (attendance_sessions)                           │
│   8. Display QR (rotates every 15 seconds)                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        STUDENT FLOW (Mark Attendance)                     │
│                                                                           │
│   STEP 1: Scan QR Code                                                   │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  • Capture QR payload                                        │       │
│   │  • Get student GPS location                                  │       │
│   │  • Generate device fingerprint                               │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 2: LAYER 2 - TOTP Verification                                    │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  Parse QR Payload:                                           │       │
│   │  ┌────────────────────────────────────────────────────┐     │       │
│   │  │ 1. Verify Timestamp (< 30 seconds old)           │     │       │
│   │  │    ❌ Too old → Reject (prevents replay)          │     │       │
│   │  │                                                    │     │       │
│   │  │ 2. Verify HMAC Signature                          │     │       │
│   │  │    ExpectedSig = HMAC-SHA256(Data, Secret)       │     │       │
│   │  │    ❌ Mismatch → Reject (prevents tampering)      │     │       │
│   │  │                                                    │     │       │
│   │  │ 3. Verify TOTP Code                               │     │       │
│   │  │    IsValid = Verify(Code, Secret, step=15s)      │     │       │
│   │  │    ❌ Invalid → Reject (QR expired/wrong)         │     │       │
│   │  └────────────────────────────────────────────────────┘     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 3: LAYER 3 - Geofencing Validation                               │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  Haversine Formula:                                          │       │
│   │  ┌────────────────────────────────────────────────────┐     │       │
│   │  │ Distance = CalculateHaversine(                    │     │       │
│   │  │   teacherLat, teacherLon,                         │     │       │
│   │  │   studentLat, studentLon                          │     │       │
│   │  │ )                                                  │     │       │
│   │  │                                                    │     │       │
│   │  │ IF Distance > Radius (50m):                       │     │       │
│   │  │    ❌ Reject (outside geofence)                   │     │       │
│   │  │ ELSE:                                              │     │       │
│   │  │    ✅ Pass (within geofence)                      │     │       │
│   │  └────────────────────────────────────────────────────┘     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 4: LAYER 4 - Device Fingerprinting                               │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  Generate Fingerprint:                                       │       │
│   │  ┌────────────────────────────────────────────────────┐     │       │
│   │  │ Components:                                        │     │       │
│   │  │  • User-Agent                                      │     │       │
│   │  │  • Device Memory                                   │     │       │
│   │  │  • Screen Resolution                               │     │       │
│   │  │  • Timezone                                        │     │       │
│   │  │  • Hardware Info                                   │     │       │
│   │  │                                                    │     │       │
│   │  │ Fingerprint = SHA256(Components)                  │     │       │
│   │  │                                                    │     │       │
│   │  │ Check Redis:                                       │     │       │
│   │  │   IF DeviceUsed(fingerprint, session):            │     │       │
│   │  │      ❌ Reject (device already used)              │     │       │
│   │  └────────────────────────────────────────────────────┘     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 5: LAYER 5 - Rate Limiting                                        │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  Redis Check:                                                │       │
│   │  ┌────────────────────────────────────────────────────┐     │       │
│   │  │ Key = ratelimit:studentId:sessionCode             │     │       │
│   │  │ IF EXISTS(Key):                                    │     │       │
│   │  │    ❌ Reject (rate limit exceeded)                │     │       │
│   │  │ ELSE:                                              │     │       │
│   │  │    SET Key, TTL=60s                               │     │       │
│   │  │    ✅ Allow (within rate limit)                   │     │       │
│   │  └────────────────────────────────────────────────────┘     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 6: LAYER 6 - Duplicate Prevention                                │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  Database Check:                                             │       │
│   │  ┌────────────────────────────────────────────────────┐     │       │
│   │  │ Query attendance_logs WHERE:                       │     │       │
│   │  │   student_id = currentStudent                      │     │       │
│   │  │   session_id = currentSession                      │     │       │
│   │  │                                                    │     │       │
│   │  │ IF EXISTS:                                         │     │       │
│   │  │    ❌ Reject (already marked)                     │     │       │
│   │  │ ELSE:                                              │     │       │
│   │  │    ✅ Continue                                     │     │       │
│   │  └────────────────────────────────────────────────────┘     │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                    │                                      │
│                                    ▼                                      │
│   STEP 7: Mark Attendance ✅                                             │
│   ┌─────────────────────────────────────────────────────────────┐       │
│   │  1. INSERT into attendance_logs                              │       │
│   │  2. INSERT into geofence_validations (audit)                 │       │
│   │  3. UPSERT into device_registry                              │       │
│   │  4. SET Redis device used flag (24h TTL)                     │       │
│   │  5. Return success with attendance_id                        │       │
│   └─────────────────────────────────────────────────────────────┘       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                                │
│                                                                           │
│   Teacher                    Backend                      Student         │
│     │                          │                            │             │
│     │─────Generate QR────────>│                            │             │
│     │                          │                            │             │
│     │<────QR Image────────────│                            │             │
│     │   (rotates 15s)          │                            │             │
│     │                          │                            │             │
│     │                          │<─────Scan QR──────────────│             │
│     │                          │  + GPS Location            │             │
│     │                          │  + Device Info             │             │
│     │                          │                            │             │
│     │                          │──────Verify──────>         │             │
│     │                          │  • TOTP                    │             │
│     │                          │  • HMAC                    │             │
│     │                          │  • Timestamp               │             │
│     │                          │  • Geofence                │             │
│     │                          │  • Device                  │             │
│     │                          │  • Rate Limit              │             │
│     │                          │  • Duplicate               │             │
│     │                          │                            │             │
│     │                          │<─────Mark────────>         │             │
│     │                          │  Attendance                │             │
│     │                          │                            │             │
│     │                          │─────Success───────────────>│             │
│     │                          │  • Attendance ID           │             │
│     │                          │  • Timestamp               │             │
│     │                          │  • Distance                │             │
│     │                          │                            │             │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA OVERVIEW                            │
│                                                                           │
│   attendance_sessions                    attendance_logs                  │
│   ┌──────────────────┐                  ┌──────────────────┐            │
│   │ id (PK)          │                  │ id (PK)          │            │
│   │ teacher_id       │──┐               │ session_id (FK)  │◄───┐       │
│   │ session_code     │  │               │ student_id (FK)  │    │       │
│   │ totp_secret      │  │               │ device_fingerprint│    │       │
│   │ teacher_lat      │  │               │ student_lat      │    │       │
│   │ teacher_lon      │  │               │ student_lon      │    │       │
│   │ geofence_radius  │  │               │ distance_meters  │    │       │
│   │ expires_at       │  │               │ totp_code        │    │       │
│   │ is_active        │  │               │ marked_at        │    │       │
│   └──────────────────┘  │               └──────────────────┘    │       │
│                          │                                       │       │
│                          └───────────────────────────────────────┘       │
│                                                                           │
│   device_registry                     geofence_validations               │
│   ┌──────────────────┐                ┌──────────────────┐              │
│   │ id (PK)          │                │ id (PK)          │              │
│   │ device_fingerprint│               │ attendance_log_id│              │
│   │ user_id (FK)     │                │ session_id (FK)  │              │
│   │ user_agent       │                │ student_id (FK)  │              │
│   │ first_seen_at    │                │ is_valid         │              │
│   │ last_seen_at     │                │ distance_meters  │              │
│   └──────────────────┘                │ validation_reason│              │
│                                        │ validated_at     │              │
│                                        └──────────────────┘              │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                           REDIS CACHING STRATEGY                           │
│                                                                           │
│   Key Pattern                       Value             TTL                 │
│   ────────────────────────────────  ───────────────  ─────────────────   │
│   attendance:session:{code}         Session Data     Duration (60m)      │
│   attendance:totp:{code}            TOTP Secret      Duration (60m)      │
│   attendance:device:{code}:{hash}   "1"              24 hours            │
│   attendance:ratelimit:{id}:{code}  "1"              60 seconds          │
│                                                                           │
│   Benefits:                                                               │
│   • Fast session lookups (< 1ms)                                         │
│   • Reduced database load                                                │
│   • Efficient rate limiting                                              │
│   • Device tracking without DB hits                                      │
│   • Graceful degradation if Redis unavailable                            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                            SECURITY SUMMARY                                │
│                                                                           │
│   Layer                Attack Vector               Defense                │
│   ─────────────────    ────────────────────────    ────────────────────  │
│   1. Authentication    Unauthorized access          OAuth + domain check  │
│   2. TOTP              Screenshot sharing           15s rotation          │
│   3. Geofencing        GPS spoofing                 Haversine + device    │
│   4. Fingerprinting    Device sharing               Unique hash per device│
│   5. Rate Limiting     Brute force                  60s cooldown          │
│   6. Duplicate Check   Multiple submissions         Unique constraint     │
│                                                                           │
│   Result: Breaking requires defeating ALL 6 layers simultaneously         │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘

```
