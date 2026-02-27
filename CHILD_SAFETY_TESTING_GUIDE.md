# Child Safety Flow — Manual Testing Guide

**Site:** https://kannarimusicacademy.com  
**Date:** February 2026

This guide walks through **three complete flows** so you can test:
1. **Flow A** — Teacher NOT verified for minors (everything blocked)
2. **Flow B** — Teacher FULLY verified for minors (everything allowed)
3. **Flow C** — Parental consent system (email-based, no-login parent approval)

---

## Prerequisites / Test Accounts

| Role | How to Get |
|------|-----------|
| **Admin** | Login at `/admin-login` — Email: `admin@kannari.com` / Password: `admin` |
| **Teacher A** (unverified) | Register fresh in Flow A below |
| **Teacher B** (verified) | Register fresh in Flow B below |
| **Minor Student** | Register fresh — set date of birth to make them under 18 |
| **Adult Student** | Register fresh — set date of birth 18+ years ago |
| **Parent** (external) | Use any real email you can access — does NOT need a site account |

> **Tip:** Open two browser windows (or use incognito) to run both flows at the same time for comparison.

---

## Prerequisite: Create a Subscription Plan (One-Time Admin Setup)

Before students can enroll in courses, access lessons, or join sessions, they **must** have an active subscription. Without one, enrollment and lesson access are blocked by the subscription access control layer.

### P1. Admin Creates a Subscription Plan

1. Login as admin → `/admin-login`
2. Go to `/admin/subscriptions` → click **Manage Plans** tab
3. Click **"+ New Plan"** button
4. Fill in:
   - **Name:** `Test Plan`
   - **Duration:** `monthly`
   - **Price:** `10.00` (or any amount)
   - **Max Courses:** `10`
   - **Max Lessons:** `100`
   - **Live Sessions/month:** `10`
   - **Audio Messages/month:** `10`
   - **Can Access Live Sessions:** ✅ checked
   - **Can Download:** ✅ checked
   - **Access Level:** `all` (or whichever)
   - **Allowed Teachers:** leave empty for "all teachers" access, or select specific teachers
5. Save → Plan appears in the plans list with a green `active` badge

> **Note:** You only need to create the plan once. Both flows will use this same plan.

---

## FLOW A — Teacher **NOT Verified** for Minors

### A1. Teacher Registration

1. Go to `/teacher-register`
2. Fill in:
   - Full Name: `Test Teacher Unverified`
   - Email: use a real email you can access (for verification link)
   - Password: anything secure
   - Mobile, qualification, skills — fill anything
3. Submit → You'll see **"Registration submitted. Please check your email to verify."**
4. Check your email inbox → Click the verification link
5. You'll be redirected to the login page with a success message

### A2. Teacher Login (First Attempt — Blocked)

1. Go to `/teacher-login`
2. Enter the email/password you just registered
3. **Expected:** You see a message: **"Your account is pending admin approval. Please wait for the administrator to review and approve your registration."**
4. You **cannot** log in yet

### A3. Admin Approves Teacher (Basic Approval Only)

1. Open a new tab → `/admin-login` → login as admin
2. Go to `/admin/users-management` → click **Teachers** tab
3. Find `Test Teacher Unverified` in the list
4. Notice the badges:
   - **Approval:** `Pending` (yellow)
   - **Verification:** `unverified` (yellow)
   - **Minors blocked** (grey)
5. Click the **green ✓ button** (first action button) to approve the teacher
6. Confirm in the popup → Teacher's **Approval** badge turns `Approved` (green)
7. **DO NOT** approve any verification steps (ID, background, agreements) — leave them all pending

### A4. Teacher Login (Second Attempt — Succeeds)

1. Go back to teacher tab → `/teacher-login`
2. Login with the same credentials
3. **Expected:** Login succeeds → redirected to `/teacher-dashboard`

### A5. Teacher Checks Profile — Verification Status

1. Go to `/teacher/profile-setting` (or click Profile in sidebar)
2. Scroll down to the **Verification** section
3. **Expected:** You see:
   - **Overall Status:** `Pending` or `Unverified`
   - ID Verification: Not submitted
   - Background Check: Not submitted
   - Agreements: Not signed
   - **Can teach minors: No**

### A6. Register a Minor Student

1. Open another browser/incognito → go to `/user-register`
2. Fill in:
   - Full Name: `Test Minor Student`
   - Email: use another email
   - Password: anything
   - **Date of Birth:** set to any date that makes them **under 18** (e.g., `2012-03-15`) — this field is on the registration form itself, right after Password
   - Interests: anything
3. Click **Complete Profile Setup**
4. Verify email if prompted → login at `/user-login`

### A6b. Admin Creates & Activates Subscription for the Minor Student

> **Without this step, the student cannot enroll in courses, access lessons, or join sessions — the system will block with "No subscription found".**

1. Admin → `/admin/subscriptions` → **Subscriptions** tab (default)
2. Click **"+ New Subscription"**
3. Fill in:
   - **Student:** Select `Test Minor Student` from dropdown
   - **Plan:** Select `Test Plan` (created in prerequisites)
   - **Start Date:** today's date (e.g., `2026-02-26`)
   - **End Date:** any date in the future (e.g., `2027-02-26`)
   - **Price Paid:** `10.00`
   - **Is Paid:** ✅ checked
   - **Assigned Teacher:** Select the teacher you want to test with (e.g., `Test Teacher Unverified`)
4. Save → Subscription appears with `pending` status
5. Click the **green play ▶ button** next to the subscription to **Activate** it
6. Status changes to `active` (green badge)

> **Alternative (Student Self-Subscribe):** The student can also subscribe themselves at `/subscriptions` using Stripe payment — but for testing, admin-created subscriptions are faster since they skip payment.

### A7. Admin Assigns Course from Unverified Teacher to Minor Student

1. Go back to admin panel → `/admin/users-management`
2. Go to the **Teachers** tab → click on `Test Teacher Unverified`
3. Or from the teacher's dashboard, have the teacher create a course first:
   - Teacher → `/teacher-course-management` → Create a new course (any title/category)

**Now try to assign the minor student to this teacher's course:**

1. Teacher logs in → goes to `/teacher-students`
2. Searches for the minor student
3. Tries to **assign a course** to the minor student
4. **Expected Result: BLOCKED** — Error message:
   > **"This teacher cannot teach minor students due to expired verification / incomplete verification. All verification steps must be completed and approved before teaching minors."**

### A8. Teacher Tries to Create a Session with Minor Student

1. Teacher → `/teacher-sessions`
2. Click "Create Session" / "New Session"
3. Select the minor student
4. Try to go live
5. **Expected Result: BLOCKED** when going live — Error message about incomplete verification for teaching minors

### A9. Minor Student Tries to Join Teacher's Session

Even if a session exists:
1. Minor student → `/my-sessions`
2. Tries to join a session by the unverified teacher
3. **Expected Result: BLOCKED** — The system checks the teacher's `can_teach_minors` flag and refuses

### A10. Check Admin View — Filter by Verification Status

1. Admin → `/admin/users-management` → **Teachers** tab
2. Use the **Verification Status** dropdown filter:
   - Select **"Unverified"** → `Test Teacher Unverified` appears
   - Select **"Verified"** → `Test Teacher Unverified` does NOT appear
   - Select **"Expired"** → shows nothing (no expired teachers yet)
3. Click **Clear** button to reset filter

### A11. Admin Views Verification Details

1. In Teachers tab, click the **eye icon** (👁) next to `Test Teacher Unverified`
2. A popup appears showing:
   - **Overall:** pending
   - **ID Verification:** pending
   - **Background Check:** pending
   - **Background Expiry:** No expiry set
   - **Agreements:** pending
   - **Can Teach Minors:** **No** (red)
   - **Agreement Signatures:** "No signatures submitted yet"

---

### ✅ Flow A Summary — What You Should See

| Action | Result |
|--------|--------|
| Teacher registers | ✅ Success, email verification sent |
| Teacher login before approval | ❌ Blocked (pending admin approval) |
| Admin approves teacher (basic) | ✅ Teacher can now login |
| Teacher verification status | Shows `unverified`, can_teach_minors = No |
| Assign course to minor student | ❌ **BLOCKED** — incomplete verification |
| Create session with minor | ❌ **BLOCKED** — incomplete verification |
| Minor joins session | ❌ **BLOCKED** — teacher not verified for minors |
| Adult student interactions | ✅ All work normally (no minor restriction) |
| Student without subscription tries to enroll | ❌ Blocked ("No subscription found") |
| Student with active subscription + adult | ✅ Enrollment works normally |
| Admin filter by "Unverified" | ✅ Teacher appears in filtered list |

---

## FLOW B — Teacher **FULLY VERIFIED** for Minors

### B1. Teacher Registration

1. Go to `/teacher-register`
2. Fill in:
   - Full Name: `Test Teacher Verified`
   - Email: use a different real email
   - Password: anything secure
   - Other fields: fill anything
3. Submit → verify email → confirmed

### B2. Admin Approves + Full Verification

1. Admin → `/admin/users-management` → **Teachers** tab
2. Find `Test Teacher Verified`
3. **Step 1 — Basic Approval:** Click green ✓ button → Approve
4. **Step 2 — Approve ID Verification:** Click the **ID card icon** (🪪) → Add optional notes → Confirm
   - This approves the ID verification step
5. **Step 3 — Approve Background Check:** Click the **shield icon** (🛡) → Add optional notes → Confirm
   - This approves the background check
   - **The system automatically sets the expiry date to 12 months from now**
6. **Step 4 — Approve Agreements:** Click the **document icon** (📄) → Confirm
   - This bulk-approves all pending agreement signatures

After all 4 steps:
7. **Step 5 — Activate:** Click the **double-check icon** (✓✓) → Confirm
   - This runs the final activation which recalculates the overall status

### B3. Verify the Verification Status Changed

1. Still on Teachers tab, look at `Test Teacher Verified`:
   - **Approval:** `Approved` (green)
   - **Verification:** `verified` (green)
   - **Can teach minors** (green)
2. Click the **eye icon** (👁) to view details:
   - **Overall:** approved
   - **ID Verification:** approved
   - **Background Check:** approved
   - **Background Expiry:** Shows date ~12 months from now in **green** (e.g., "Expires: 2/26/2027 (365 days)")
   - **Agreements:** approved
   - **Can Teach Minors:** **Yes** (green)
   - **Agreement Signatures:** Shows each signed agreement with:
     - Signed date/time
     - IP address
     - Signature text (if provided)
     - Policy version

### B4. Teacher Login

1. Teacher → `/teacher-login` → Login succeeds
2. Go to `/teacher/profile-setting`
3. Verification section shows:
   - **Status: Verified**
   - **Can teach minors: Yes**

### B5. Teacher Creates a Course

1. Teacher → `/teacher-course-management`
2. Create a new course (Title: "Test Music Course", any category)
3. Add at least one chapter/lesson

### B6. Register a Minor Student (or Reuse from Flow A)

If you haven't already:
1. Register a minor student at `/user-register`
2. Set **Date of Birth** on the registration form to a date making them under 18 (e.g., `2012-03-15`)
3. Complete registration → verify email → login

### B6b. Ensure Minor Student Has an Active Subscription

If reusing the student from Flow A, the subscription is already active — skip this step.

If this is a new student:
1. Admin → `/admin/subscriptions` → click **"+ New Subscription"**
2. Fill in:
   - **Student:** Select the minor student
   - **Plan:** `Test Plan`
   - **Start Date:** today
   - **End Date:** 1 year from now
   - **Price Paid:** `10.00`
   - **Is Paid:** ✅
   - **Assigned Teacher:** Select `Test Teacher Verified`
3. Save → Click **▶ Activate**

> Without an active subscription, course enrollment will be blocked regardless of teacher verification status.

### B7. Assign Course to Minor Student — SUCCESS

1. Verified teacher → `/teacher-students`
2. Search for the minor student
3. **Assign the course** to the minor student
4. **Expected Result: ✅ SUCCESS** — Course assigned without any blocking message

### B8. Create Session with Minor Student — SUCCESS

1. Verified teacher → `/teacher-sessions`
2. Create a new session → select the minor student
3. Click **Go Live**
4. **Expected Result: ✅ SUCCESS** — Session starts, system notes `has_minor_participant = true`

### B9. Minor Student Joins Session — SUCCESS

1. Minor student → `/my-sessions`
2. See the active session from the verified teacher
3. Click **Join**
4. **Expected Result: ✅ SUCCESS** — Student enters the session

### B10. Admin Filters — Verified Teachers

1. Admin → `/admin/users-management` → **Teachers** tab
2. Use the **Verification Status** dropdown:
   - Select **"Verified"** → `Test Teacher Verified` appears
   - Select **"Unverified"** → `Test Teacher Verified` does NOT appear
3. Both teachers visible when filter is **"All Statuses"**

### B11. Admin Verification Detail — Timestamps & Expiry

1. Click **eye icon** (👁) next to `Test Teacher Verified`
2. Verify you see:
   - **Background Expiry:** Green text showing date ~12 months away with days count
   - **Agreement Signatures** list showing:
     - ✅ `child safety` — approved — **Signed: [date/time]** — IP: [address] — Signature: "[text]" — Policy v[number]
     - ✅ `code of conduct` — approved — same details
     - ✅ `background check consent` — approved — same details

---

### ✅ Flow B Summary — What You Should See

| Action | Result |
|--------|--------|
| Teacher registers | ✅ Success |
| Admin full verification (ID + Background + Agreements + Activate) | ✅ Status becomes "verified" |
| Background check expiry auto-set | ✅ 12 months from approval date shown |
| Teacher can_teach_minors | ✅ Yes (green badge) |
| Assign course to minor student | ✅ **SUCCESS** |
| Create session with minor | ✅ **SUCCESS** |
| Minor joins session | ✅ **SUCCESS** |
| Admin filter by "Verified" | ✅ Teacher appears |
| Verification detail shows timestamps | ✅ Signed date, IP, signature, policy version |

---

## FLOW C — Parental Consent (Email-Based, No-Login)

This flow tests the parental consent system that protects minor students. Parents receive a secure email link and can approve or deny consent **without creating an account or logging in**. The link contains a cryptographically signed token that identifies exactly which student and parent the consent is for.

### How the Token System Works

Each consent email link contains a **signed token** encoding:
```
token = sign({ link_id: 47, parent_email: "mom@example.com", student_id: 12 })
```
- **No login needed** — the token IS the authentication (same pattern as password reset links or DocuSign)
- **Unique per student** — if a parent has two children, they get two different tokens pointing to two different database records
- **Double-verified** — the parent email in the token is compared against the database; tampering fails the signature check
- **Time-limited** — tokens expire after 30 days
- **Per-student records** — approval creates `ParentalConsent` records tied to that specific `StudentParentLink`, so consent for Student A is completely independent from Student B

### C1. Minor Student Requests Parental Consent

1. Login as the minor student → go to `/profile-setting`
2. Scroll down to **"Parent Consent Setup (for minors)"** section
3. **Expected:** Since no consent has been requested yet, you see the request form
4. Fill in:
   - **Parent/Guardian Name:** `Test Parent`
   - **Parent Email:** use a **real email you can access** (this is where the consent link goes!)
   - **Parent Mobile:** any number
   - **Relationship:** select `Mother`, `Father`, `Guardian`, or `Other`
5. Click **"Send Consent Request to Parent"**
6. **Expected:** Toast notification: **"Consent Email Sent!"**
7. The form is replaced by a **status card** showing:
   - **Status:** `Awaiting Parent Approval` (yellow warning style)
   - **Parent:** Test Parent
   - **Email:** `t***@example.com` (masked for privacy)
   - **Relationship:** Guardian (or whichever selected)
   - A **"Resend Consent Email"** button

### C2. Check the Parent's Email Inbox

1. Open the parent's email inbox
2. **Expected:** An email from Kannari Music Academy with:
   - Subject: `Parental Consent Required — [Student Name] on Kannari Music Academy`
   - Body explaining the student wants to join live sessions
   - A **clickable link** like: `https://kannarimusicacademy.com/parent-consent/abc123...xyz`
   - The link is valid for 30 days

### C3. Parent Opens the Consent Page (No Login Required)

1. Click the link from the email
2. **Expected:** A standalone branded page loads at `/parent-consent/{token}` with:
   - **Kannari Music Academy** header / branding
   - **"Parental Consent Request"** title
   - **No site navigation, no login form** — this is a standalone page

3. The page shows:
   - **Your Child's Information:** Name, email, date of birth, relationship
   - **What You're Consenting To:**
     - Live Video/Audio Sessions
     - Teacher Verification Required (explains teachers are vetted)
     - Session Safety Logging
   - **Authorization Mode** radio buttons:
     - **Pre-Authorized** (recommended — child can join all scheduled sessions)
     - **Per-Session Approval** (parent must approve each session individually)
   - **Digital Signature** field — parent types their full legal name
   - **"Approve Consent"** button (green)
   - **"I do not consent"** link (grey, less prominent)
   - **Footer** with security notice and contact email

### C4. Parent Approves Consent

1. Select authorization mode (leave as "Pre-Authorized" or change)
2. Type full name in the **Digital Signature** field (e.g., `Test Parent`)
3. Click **"Approve Consent"**
4. **Expected:**
   - Button shows spinner → **"Submitting..."**
   - Page changes to success screen: **"Response Recorded"** (green checkmark)
   - Message: *"Thank you! Your consent has been recorded. Your child can now participate in live sessions."*
   - "You may close this page."
5. **Check student's email:** Student receives notification email that parent approved consent

### C5. Student Sees Updated Consent Status

1. Login as minor student → go to `/profile-setting`
2. Scroll to **"Parent Consent Setup"** section
3. **Expected:** Status card now shows:
   - **Status:** `Parent Consent Approved` (green success style)
   - **Live Sessions:** `Approved`
   - **Mode:** `Pre-authorized` (or whichever parent chose)
   - No resend button (consent is approved)
   - No request form (consent is active)

### C6. Test the Deny Flow

To test denial, either create a second minor student or reset the first one.

1. Minor student submits a new parent consent request (different parent email)
2. Parent receives email → clicks link → consent page loads
3. Instead of filling the signature, click **"I do not consent"**
4. **Expected:** Page changes to a deny form:
   - Reason textarea (optional)
   - **"Decline Consent"** button (red)
   - **"Go Back"** button to return to approve form
5. Click **"Decline Consent"**
6. **Expected:**
   - Success screen: **"Response Recorded"**
   - Student receives email notification that consent was denied
7. Student → `/profile-setting`:
   - Status shows **"Parent Consent Denied"** (red)
   - Message: *"Your parent/guardian declined consent. You may submit a new request below with updated information."*
   - The request form re-appears so student can try with different details

### C7. Test Resend Email

1. Create a new consent request (or use an existing pending one)
2. Student → `/profile-setting` → see the pending status card
3. Click **"Resend Consent Email"**
4. **Expected:** Toast: **"Email Resent!"**
5. Check parent email → new consent email arrives with a fresh link

### C8. Test Invalid / Expired Token

1. Visit `/parent-consent/invalid-token-here`
2. **Expected:** Error page:
   - Red warning icon
   - **"Link Invalid or Expired"**
   - Message: *"Invalid consent link."*
   - Guidance: *"If you need a new consent link, please ask your child to resend the request from their profile."*

### C9. Test Already-Approved Token Reuse

1. After approving consent in C4, click the same email link again
2. **Expected:** Consent page loads showing an **"Already Approved"** green banner:
   - *"You have already given consent for this child."*
   - Approved date shown
   - Parent can update preferences if needed

---

### ✅ Flow C Summary — What You Should See

| Action | Result |
|--------|--------|
| Student requests parent consent | ✅ Email sent to parent, status card shows "Awaiting" |
| Parent email received | ✅ Professional email with branded consent link |
| Parent opens link (no login) | ✅ Standalone consent page with student info + details |
| Parent approves with signature | ✅ Consent recorded, student notified by email |
| Student profile shows approved | ✅ Green status card with "Approved" + mode |
| Parent denies consent | ✅ Denial recorded, student notified, can re-request |
| Resend email button | ✅ New email sent with working link |
| Invalid/expired token | ✅ Error page with guidance to resend |
| Already-approved token reuse | ✅ Shows "Already Approved" banner |
| Student tries to self-approve | ❌ **NOT POSSIBLE** — no self-approval controls exist |
| Different students = different tokens | ✅ Each consent is independent per student-parent link |

---

## Side-by-Side Comparison

| Scenario | Flow A (Unverified) | Flow B (Verified) |
|----------|--------------------|--------------------|
| Teacher badge in admin | 🟡 `unverified` + grey `Minors blocked` | 🟢 `verified` + green `Can teach minors` |
| Assign course to minor | ❌ Blocked with error | ✅ Allowed |
| Session go-live with minor | ❌ Blocked with error | ✅ Allowed |
| Minor student joins session | ❌ Blocked with error | ✅ Allowed |
| Assign course to adult student | ✅ Allowed (with subscription) | ✅ Allowed (with subscription) |
| Session with adult student | ✅ Allowed (with subscription) | ✅ Allowed (with subscription) |
| Student without subscription | ❌ Enrollment blocked | ❌ Enrollment blocked |
| Background expiry in admin detail | "No expiry set" | Green date 12 months away |
| Agreement timestamps in detail | "No signatures submitted" | Full signed date + IP + signature text |
| Admin filter: "Unverified" | ✅ Shows | ❌ Hidden |
| Admin filter: "Verified" | ❌ Hidden | ✅ Shows |

### Parental Consent vs. No Consent

| Scenario | Without Parent Consent | With Parent Consent (Flow C) |
|----------|----------------------|-------------------------------|
| Minor student profile shows | Request form (no consent yet) | Green "Approved" status card |
| Student can self-approve consent | ❌ Not possible (no buttons) | ❌ Not possible (only parent via email) |
| Parent needs site account | N/A | ❌ No — uses email token link |
| Parent receives email | N/A | ✅ Branded email with secure consent link |
| Consent is per-student | N/A | ✅ Each child has independent consent record |
| Token expires | N/A | ✅ After 30 days — student can resend |
| Parent can deny | N/A | ✅ Denial recorded + student notified |

---

## Bonus: Testing Expiration (Optional)

To test the 12-month background check expiration system:

### Via Management Command (Dry Run)
```bash
docker exec html-backend-1 python manage.py check_expired_verifications --dry-run
```
This shows what would be expired without making changes.

### Via Management Command (Real)
```bash
docker exec html-backend-1 python manage.py check_expired_verifications
```

### Manual DB Test (Force Expire a Teacher)
```bash
docker exec -i html-db-1 psql -U kannari_user -d kannari_db -c "
  UPDATE main_teacherbackgroundcheck
  SET expires_at = '2025-01-01 00:00:00+00', status = 'expired'
  WHERE verification_id = (
    SELECT id FROM main_teacherverification
    WHERE teacher_id = (SELECT id FROM main_teacher WHERE full_name = 'Test Teacher Verified')
  );
"
```
Then run:
```bash
docker exec html-backend-1 python manage.py check_expired_verifications
```

After expiration:
- Teacher's status changes to `expired` (red badge)
- `can_teach_minors` becomes **No**
- All minor interactions are **blocked** (same as Flow A)
- Admin filter: shows under **"Expired"**
- Admin detail: Background Expiry shows **red "EXPIRED"** text

### Recommended Cron Setup
```bash
# Add to server crontab — runs daily at 2 AM
0 2 * * * docker exec html-backend-1 python manage.py check_expired_verifications >> /var/log/verification_expiry.log 2>&1
```

---

## Subscription Quick Reference

### What Subscriptions Gate

| Feature | Requires Active Subscription? |
|---------|------------------------------|
| Course enrollment | ✅ Yes — blocked with "No subscription found" |
| Lesson access | ✅ Yes — blocked unless enrolled + subscription active |
| Live session join | ✅ Yes — `can_access_live_sessions` must be enabled on plan |
| Audio messages | ✅ Yes — limited by `max_audio_messages_per_month` |
| Teacher assignment (by teacher) | ⚠️ Partially — teacher can assign student but student can't access content without subscription |
| Course browsing / previews | ❌ No — free to browse, preview lessons are accessible |

### Subscription Statuses

| Status | Meaning |
|--------|--------|
| `pending` | Created but not activated — student has no access |
| `active` | Fully active and paid — student has full access |
| `expired` | Past end date — access revoked |
| `cancelled` | Manually cancelled — access revoked |
| `paused` | Temporarily paused — access revoked |

### How to Create a Subscription (Admin)

1. `/admin/subscriptions` → **"+ New Subscription"**
2. Select student, plan, dates, mark as paid
3. Save → click **▶ Activate**

### How to Subscribe (Student Self-Service)

1. Student logs in → goes to `/subscriptions`
2. Browse available plans → click **"Subscribe"** on desired plan
3. Enter card details (Stripe) → payment processes
4. On success → subscription auto-created and activated

> **For testing:** Admin-created subscriptions are faster since they bypass Stripe payment. Just remember to mark **Is Paid ✅** and click **Activate**.

---

## Quick Reference: Admin Action Buttons (Teachers Tab)

| Button | Icon | Action |
|--------|------|--------|
| Green ✓ / Grey ✗ | `bi-check-circle` / `bi-x-circle` | Approve / Revoke basic approval |
| Blue 👁 | `bi-eye` | View full verification details popup |
| Green ID 🪪 | `bi-person-vcard` | Approve ID verification step |
| Green Shield 🛡 | `bi-shield-check` | Approve background check (sets 12-month expiry) |
| Blue Doc 📄 | `bi-file-earmark-check` | Bulk approve pending agreements |
| Green ✓✓ | `bi-check2-all` | Final activation (recalculates overall status) |
| Red ✗ | `bi-x-circle` | Reject teacher verification |

---

## Parental Consent — Technical Quick Reference

### How It Works (No Login Required)

```
Student fills parent details → Backend sends email with signed token →
Parent clicks link → Standalone page decodes token → Shows consent form →
Parent approves/denies → Backend updates records → Student notified by email
```

### Token Architecture

| Property | Value |
|----------|-------|
| **Signing method** | Django `signing.dumps()` with HMAC-SHA256 |
| **Salt** | `kannari-parental-consent` |
| **Token payload** | `{ link_id, parent_email, student_id }` |
| **Max age** | 30 days (2,592,000 seconds) |
| **Verification** | Token decoded + parent email cross-checked against DB |
| **Tampering protection** | Any modification invalidates the cryptographic signature |

### Why No Login is Secure

The token-based consent follows the same security pattern used by:
- Password reset links (Gmail, Outlook, etc.)
- Email verification links (every website)
- DocuSign / PandaDoc document signing
- Stripe payment links

**The email inbox IS the authentication** — only someone with access to the parent's email can click that specific link. Each token is unique, time-limited, and cryptographically signed.

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/student/{id}/parent/request-link/` | POST | Student | Submit parent details, triggers consent email |
| `/api/student/{id}/parent/resend-email/` | POST | Student | Resend consent email to parent |
| `/api/student/{id}/parent/status/` | GET | Student | Get current consent status for profile display |
| `/api/parent/consent/verify/?token=...` | GET | Token | Validate token, return student/parent details |
| `/api/parent/consent/respond/` | POST | Token | Parent approves or denies consent |

### Frontend Routes

| Route | Purpose | Login Required? |
|-------|---------|-----------------|
| `/profile-setting` | Student requests consent + sees status | ✅ Yes (student) |
| `/parent-consent/:token` | Parent consent page (standalone) | ❌ No |
