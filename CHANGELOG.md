# Changelog - FileVault

All notable changes to the FileVault Zero-Trust Encrypted File Vault project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [Unreleased]

## [Phase 0 - Inspection] - 2026-07-23
### Added
- Completed initial workspace inspection and verified empty, clean project state.
- Formalized Phase-based execution plan.

## [Phase 1 - Foundation] - 2026-07-23
### Added
- Root configuration: `.gitignore`, `.env.example`, `.env`, and `CHANGELOG.md`.
- Orchestration: `docker-compose.yml` for PostgreSQL 16, Redis 7, MinIO S3 Object Storage, Node.js API backend, and Vite React frontend.
- Backend infrastructure:
  - Express server with TypeScript, Helmet, CORS, and Zod input validation readiness.
  - Prisma ORM initialization and schema definition for all core entities (`User`, `RefreshToken`, `File`, `FileShare`, `ActivityLog`, `SecurityAlert`, `SecurityScoreSnapshot`).
  - Redis client connection wrapper with auto-reconnect and health checks.
  - MinIO client connection wrapper with automatic bucket provisioning (`filevault-vault`).
  - `/api/health` endpoint returning database, Redis, and MinIO statuses.
- Frontend foundation:
  - React + TypeScript + Vite + TailwindCSS application.
  - Infrastructure Health Status dashboard UI component.

## [Phase 2 - Authentication] - 2026-07-23
### Added
- Zero-Trust Authentication Module:
  - Password hashing with `bcrypt` (12 salt rounds).
  - Short-lived (15-minute) JWT access tokens transmitted in memory only (never `localStorage`).
  - Cryptographically random 32-byte refresh tokens, stored strictly as SHA-256 hashes (`tokenHash`) in PostgreSQL.
  - Refresh token cookie delivery with `httpOnly`, `Secure` (production), and `SameSite=Lax`.
  - Automatic refresh token rotation on every use with reuse detection security alerts (`REFRESH_TOKEN_REUSE`).
  - Account lockout after 5 consecutive failed login attempts with 15-minute duration and `BRUTE_FORCE_LOCKOUT` security alert generation.
  - Comprehensive login activity auditing (`ActivityLog` entries for `USER_REGISTERED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `LOGOUT_ALL_DEVICES`).
  - Express authorization middleware (`requireAuth`, `requireRole`) re-deriving role and identity directly from database records.
  - Frontend `AuthProvider`, `apiClient` (in-memory access token wrapper), `LoginPage`, `RegisterPage` (with real-time password policy criteria), and `Navbar`.
  - Automated authentication security unit test suite (`runAuthTests.ts` - 11/11 tests passing).

## [Phase 3 - Encrypted File Vault] - 2026-07-23
### Added
- AES-256-GCM Envelope Encryption & File Storage Module:
  - Per-file Data Encryption Key (DEK) generation using 32-byte CSPRNG (`crypto.randomBytes(32)`).
  - AES-256-GCM file ciphertext encryption with 12-byte random file IV and 16-byte GCM authentication tag.
  - Plaintext SHA-256 checksum calculation prior to storage.
  - DEK Wrapping: AES-256-GCM encryption of DEK using server `MASTER_ENCRYPTION_KEY` and independent 12-byte `dekIv`.
  - MinIO S3 object storage of pure ciphertext payloads only (keyed by generated UUID `storageKey` for path traversal protection).
  - PostgreSQL metadata persistence (`originalFilename`, `storageKey`, `sha256Hash`, `iv`, `authTag`, `wrappedDek`, `dekIv`, `dekAuthTag`, `integrityStatus`).
  - Authorized streaming download decryption (`/api/files/:id/download`):
    - Server-side authorization check (ownership or active non-expired share).
    - Rule #9 Architectural Guarantee: Admin forbidden from decrypting or accessing private user file plaintext.
    - Decryption & GCM authentication tag verification (`GcmAuthTagError`).
    - Recalculated SHA-256 checksum comparison against stored hash (`HashMismatchError`).
    - Automatic `TAMPERED` status flagging and `CRITICAL` security alert generation upon tamper detection.
  - Secure file deletion: removal of ciphertext object from MinIO, removal of database metadata, and audit logging (`FILE_DELETED`).
  - File search and metadata inspection router (`GET /api/files`, `GET /api/files/:id`).
  - Frontend File Vault UI: `FileUploadModal` (drag-and-drop upload & honeyfile toggle), `FileList` (with search and status badges), and `FileDetailsModal` (cryptographic parameters viewer).
  - Automated Vault security unit test suite (`runVaultTests.ts` - 9/9 tests passing).

## [Phase 4 - Integrity Verification] - 2026-07-23
### Added
- On-demand single file integrity verification endpoint (`POST /api/files/:id/verify`):
  - Fetches ciphertext from MinIO, unwraps DEK, verifies AES-256-GCM authentication tag, and compares recomputed SHA-256 hash against stored checksum without saving decrypted plaintext.
  - Automatic `TAMPERED` status update and `CRITICAL` `FILE_TAMPER_DETECTED` Security Alert generation upon tag or hash mismatch.
- Batch vault integrity audit endpoint (`POST /api/files/verify-all`):
  - Audits all user files and returns aggregate metrics (`totalFiles`, `okCount`, `tamperedCount`).
- UI Integrity Controls:
  - Per-item "Verify Integrity" button in `FileList.tsx` with live verification feedback.
  - "Audit All Vault Files" header action button in `App.tsx`.
- Automated Integrity test suite (`runIntegrityTests.ts` - 2/2 tests passing).

## [Phase 5 - Secure File Sharing] - 2026-07-23
### Added
- Centralized Server-Side Authorization Service (`authorizeFileAccess`):
  - Single source of truth for all file access level checks (`VIEW`, `DOWNLOAD`, `DELETE`, `OWNER`).
  - Strict Rule 9 preservation: Admin access to non-owned files is unconditionally rejected (`403 Forbidden`).
  - `VIEW` vs `DOWNLOAD` distinction: `VIEW` permits metadata/details inspection and integrity verification, but strictly blocks decrypted payload download streaming (`403 Forbidden`).
  - Server-side expiration check: Returns `403 Forbidden` if `expiresAt < now`.
  - IDOR protection: Non-recipients and non-owners receive `403 Forbidden`.
- Share Management Router (`/api/shares`):
  - `POST /api/shares`: Create or update a file share with Zod input validation (`shareFileSchema`). Prevents self-sharing (`400 Bad Request`) and requires future expiration dates.
  - `GET /api/shares/file/:fileId`: List active shares granted for a file (owner only).
  - `GET /api/shares/shared-with-me`: List files shared with current user (filters out expired shares).
  - `DELETE /api/shares/:id`: Immediately revoke share permission and log `FILE_SHARE_REVOKED` in `ActivityLog`.
- Database Schema Update: Added `@@unique([fileId, sharedWithId])` to `FileShare` model in Prisma.
- Frontend Secure Sharing UI: `ShareFileModal.tsx`, `SharedWithMe.tsx`, updated `FileList.tsx` with share trigger, and tab navigation in `App.tsx`.
- Automated Share security unit test suite (`runShareTests.ts` - 13/13 tests passing).

## [Phase 6 - Threat Detection] - 2026-07-23
### Added
- Behavioral Threat Detection Engine:
  - Brute-force failed login counter (5 attempts) triggering 15-minute account lockout and `BRUTE_FORCE_LOCKOUT` security alert (`riskLevel: HIGH`).
  - Unusual access detector (`checkUnusualAccess`): Compares incoming IP and User-Agent against historical baseline during successful authentication; generates `UNUSUAL_ACCESS` security alert (`riskLevel: MEDIUM`) upon anomaly.
  - Bulk download volume spike detector (`trackDownloadSpike`): Evaluates sliding 5-minute time window for download activity; generates `BULK_DOWNLOAD_SPIKE` security alert (`riskLevel: HIGH`) when threshold exceeded.
- Threat Management API Router (`/api/threats`):
  - `GET /api/threats/alerts`: Returns ordered feed of security alerts for authenticated user.
  - `GET /api/threats/summary`: Returns aggregate threat metrics (`totalAlerts`, `activeAlerts`, `criticalAlerts`, `threatLevel`).
- Frontend Behavioral Threat Monitor UI (`ThreatAlertsWidget.tsx`):
  - Real-time threat status badge (`NORMAL`, `ELEVATED`, `HIGH`).
  - Alert history feed with risk level badges (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
- Automated Threat Detection test suite (`runThreatTests.ts` - 5/5 tests passing).

## [Phase 7 - Honeyfiles & Deception] - 2026-07-23
### Added
- Decoy Honeyfile & Deception Trap System:
  - Decoy file uploading with `isHoneyfile: true` flag.
  - Deception access trap (`triggerHoneyfileTrap`): Triggers immediately whenever a honeyfile download or access is attempted.
  - `ActivityLog` telemetry recording (`HONEYFILE_ACCESSED`) capturing accessor ID, client IP address, user-agent, and file metadata.
  - `CRITICAL` risk level security alert generation (`alertType: 'HONEYFILE_ACCESSED'`) notifying file owner of a critical breach attempt.
- Automated Honeyfile security unit test suite (`runHoneyfileTests.ts` - 9/9 tests passing).

## [Phase 8 - Security Center & Audit Dashboard] - 2026-07-24
### Added
- Deterministic 5-Vector Security Posture Calculator (0–100 Max):
  - Evaluates Vault Integrity (25 pts), Session Hygiene 7-day rolling window (25 pts), Active Threat/Alert Status (20 pts), File Sharing Hygiene (15 pts), and Honeyfile Deception Protection (15 pts).
  - Uses a single captured `evaluatedAt` timestamp instance across all 5 vectors to guarantee mathematically deterministic, reproducible scores.
  - Clamped strictly to $[0, 100]$ and categorized (`EXCELLENT`, `GOOD`, `MODERATE`, `CRITICAL_RISK`).
- Security Score Snapshot Model Update:
  - Updated `SecurityScoreSnapshot` in `schema.prisma` with `rating String?` and `breakdown Json?` fields.
  - `GET /api/security-center/score`: Read-only deterministic calculation with zero database writes.
  - `POST /api/security-center/snapshot`: Explicitly creates one historical score snapshot record.
- Audit Log Explorer:
  - `GET /api/security-center/audit-logs`: Scoped strictly to authenticated user (`userId === req.user.id`).
  - Date range filtering (`startDate`, `endDate`), action type filtering, and safe string search (`actionType`, `ipAddress`, `userAgent`). Page size capped at max 50.
- Admin Security Overview (`GET /api/security-center/admin/overview`):
  - Returns aggregate system metadata (`totalUsers`, `lockedAccountsCount`, `alertsBySeverity`, `tamperedFilesCount`, `honeyfilesCount`, `suspiciousEventsCount`).
  - Guaranteed zero secrets: No plaintext files, encryption keys, tokens, DEKs, IVs, or auth tags exposed.
- Frontend Security Center Dashboard (`SecurityCenter.tsx`):
  - Score Gauge & Rating badge, 5-vector breakdown list, Snapshot recording trigger, and filterable Audit Log Explorer table.
- Automated Security Center test suite (`runSecurityCenterTests.ts` - 16/16 tests passing).

## [Phase 9 - Final Integration, Hardening & Verification] - 2026-07-24
### Added
- System-Wide Security Configuration Hardening:
  - Startup Environment Variable Validation (`envValidation.ts`) enforcing minimum length criteria for `MASTER_ENCRYPTION_KEY` and `JWT_SECRET`.
  - Security headers with Helmet and CORS settings configured for credentials.
  - Verified Docker Compose orchestration across PostgreSQL 16, Redis 7, MinIO S3, Node.js API backend, and Vite frontend.
- System-Wide Verification & End-to-End Test Execution:
  - **65 / 65 automated security test cases passing** across all 7 test runners.
  - Backend TypeScript compilation: **PASSED** (0 errors).
  - Frontend Vite production build: **PASSED** (1482 modules transformed, `dist/` generated, 0 errors).

## [AI Extension - AI Behavioral Anomaly Detection Layer] - 2026-07-27
### Added
- Deterministic 7-Dimensional Behavioral Anomaly Engine (`anomalyDetectionService.ts`):
  - $f_1$ Activity Frequency (0.10), $f_2$ Failed Login Frequency (0.20), $f_3$ Download Frequency (0.20), $f_4$ Unusual Access Hour (0.15), $f_5$ IP Change Anomaly (0.15), $f_6$ Device/User-Agent Anomaly (0.10), $f_7$ Activity Burst/Time-Gap Anomaly (0.10).
  - Closed-form weighted anomaly score $S(X) \in [0.00, 1.00]$ with strict thresholding (`NORMAL` $<0.50$, `MEDIUM_ANOMALY` $0.50 - 0.74$, `HIGH_ANOMALY` $\ge 0.75$).
  - 14-day rolling baseline with cold-start fallback ($<5$ logs returns $0.00$, `INSUFFICIENT_DATA`).
  - Anti-baseline-poisoning protection (evaluates strictly prior events).
  - Safe 15-minute deduplication and rule-based alert correlation.
  - Fail-open error handling (logged internally without interrupting core auth/file operations).
  - Non-exposure assertions guaranteeing ZERO crypto keys, DEKs, IVs, auth tags, or plaintext are processed.
- Endpoint: `GET /api/threats/behavioral-summary` returning safe aggregate anomaly score and feature breakdown.
- Frontend Component: `AnomalyMonitorWidget.tsx` embedded in `SecurityCenter.tsx`.
- Automated AI Security Test Suite (`runAnomalyTests.ts` - 18/18 tests passing).
- **Total Project Test Suite Execution**: **83 / 83 PASSED** (0 failures across all 8 test runners).
