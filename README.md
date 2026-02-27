# Child Safety Flow (Simple Guide)

This project now includes a child-safety process for **teachers**, **students/parents**, and **admins**.

## 1) Teacher verification (before teaching minors)

1. Teacher opens **Profile Settings**.
2. Teacher starts verification.
3. Teacher uploads ID proof.
4. Teacher submits background-check details.
5. Teacher signs required agreements.
6. Admin reviews each step.
7. Admin activates the teacher.

When all required checks are approved, the teacher can teach minors.

## 2) Parent consent (for minor students)

1. Student opens **Profile Settings**.
2. Student enters date of birth.
3. If student is under 18, student submits parent/guardian details.
4. Parent link is created.
5. Parent authorization is completed.
6. Parent (or admin flow) sets live-session consent mode:
   - **Pre-authorized**: child can join approved live sessions.
   - **Per-session approval**: parent approval is needed for each session.

If consent is missing/revoked, joining live sessions is blocked.

## 3) Session safety controls

- Teacher can turn recording on/off for a session.
- Student and teacher can report unsafe behavior from:
  - live sessions
  - audio messages

## 4) Admin safety moderation

Admin opens **Users Management** and can:

- review teacher verification status
- approve/reject verification steps
- view minor consent status
- review safety reports
- update report status (`open`, `in_review`, `resolved`, `dismissed`)

## 5) End-to-end summary

- Teacher gets verified.
- Minor student gets parent consent.
- Student joins session only if rules are satisfied.
- Any issue can be reported.
- Admin reviews and resolves reports.

---

If you want, we can also add a separate **Parent Portal page** so parents can manage approvals directly from their own dashboard.
