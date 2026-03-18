/**
 * Shared form validation utilities for Kannari Music Academy LMS.
 * Provides reusable validators + inline error styling helpers.
 */

// ────────── Validators ──────────

export const isValidEmail = (email) => {
  if (!email || !email.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const isValidPassword = (password) => {
  return password && password.length >= 8;
};

export const isStrongPassword = (password) => {
  if (!password || password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password needs at least one uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password needs at least one lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password needs at least one number' };
  return { valid: true, message: '' };
};

export const isNotEmpty = (value) => {
  return value && value.trim().length > 0;
};

export const isValidPhone = (phone) => {
  if (!phone) return true; // optional field
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const isValidUsername = (username) => {
  if (!username || !username.trim()) return false;
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim());
};

export const isValidDate = (dateStr) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
};

export const isValidName = (name) => {
  if (!name || !name.trim()) return false;
  return name.trim().length >= 2 && name.trim().length <= 100;
};

// ────────── Validate full forms ──────────

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  return errors;
};

export const validateStudentRegisterForm = ({ fullname, email, password, username, date_of_birth, parent_email, isMinor }) => {
  const errors = {};
  if (!isValidName(fullname)) errors.fullname = 'Full name is required (at least 2 characters)';
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
  if (!username || !username.trim()) errors.username = 'Username is required';
  else if (!isValidUsername(username)) errors.username = 'Username: 3-30 characters, letters, numbers, _ . - only';
  if (!password) errors.password = 'Password is required';
  else {
    const pw = isStrongPassword(password);
    if (!pw.valid) errors.password = pw.message;
  }
  if (!date_of_birth) errors.date_of_birth = 'Date of birth is required';
  else if (!isValidDate(date_of_birth)) errors.date_of_birth = 'Please enter a valid date';
  if (isMinor && (!parent_email || !parent_email.trim())) errors.parent_email = 'Parent email is required for minors';
  else if (isMinor && parent_email && !isValidEmail(parent_email)) errors.parent_email = 'Please enter a valid parent email';
  return errors;
};

export const validateTeacherRegisterForm = ({ full_name, email, password, qualification, mobile_no }) => {
  const errors = {};
  if (!isValidName(full_name)) errors.full_name = 'Full name is required (at least 2 characters)';
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
  if (!password) errors.password = 'Password is required';
  else {
    const pw = isStrongPassword(password);
    if (!pw.valid) errors.password = pw.message;
  }
  if (!qualification || !qualification.trim()) errors.qualification = 'Qualification is required';
  if (mobile_no && !isValidPhone(String(mobile_no))) errors.mobile_no = 'Please enter a valid phone number';
  return errors;
};

export const validateStudentProfileForm = ({ fullname, email }) => {
  const errors = {};
  if (!isValidName(fullname)) errors.fullname = 'Full name is required (at least 2 characters)';
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
  return errors;
};

export const validateTeacherProfileForm = ({ full_name, email }) => {
  const errors = {};
  if (!isValidName(full_name)) errors.full_name = 'Full name is required (at least 2 characters)';
  if (!email || !email.trim()) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Please enter a valid email address';
  return errors;
};

// ────────── Inline error styling ──────────

export const fieldErrorStyle = {
  fontSize: '12px',
  color: '#dc2626',
  marginTop: '4px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px'
};

export const inputErrorBorder = '1px solid #ef4444';
export const inputNormalBorder = '1px solid #e5e7eb';

export const getInputBorderStyle = (fieldName, errors) => {
  return errors[fieldName] ? inputErrorBorder : inputNormalBorder;
};

// Inline error component helper
export const FieldError = ({ error }) => {
  if (!error) return null;
  return (
    <div style={fieldErrorStyle}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {error}
    </div>
  );
};
