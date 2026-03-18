import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'

import { API_BASE_URL } from '../../config';
import { validateStudentRegisterForm, FieldError } from '../../utils/formValidation';

const baseUrl = `${API_BASE_URL}/student/`;

const Register = () => {
    useEffect(()=>{
        document.title='LMS | Student Register'
      })

      useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

    const [studentData,setStudentData]=useState({
        'fullname':'',
        'email':'',
        'password':'',
        'username':'',
        'date_of_birth':'',
        'interseted_categories':'',
        'parent_email':'',
        'parent_name':'',
        'status':''
    });
    const [loading, setLoading] = useState(false)
    const [isMinor, setIsMinor] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const handleChange=(event)=>{
        const { name, value } = event.target;
        setStudentData({
            ...studentData,
            [name]: value
        });

        // Check if user is under 18 when DOB changes
        if (name === 'date_of_birth' && value) {
            const dob = new Date(value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            setIsMinor(age < 18);
        } else if (name === 'date_of_birth' && !value) {
            setIsMinor(false);
        }
    }

    const submitForm=async()=>{
      if (loading) return

      const errors = validateStudentRegisterForm({
        fullname: studentData.fullname,
        email: studentData.email,
        password: studentData.password,
        username: studentData.username,
        date_of_birth: studentData.date_of_birth,
        parent_email: studentData.parent_email,
        isMinor
      });
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        Swal.fire({
          title: 'Please fix the errors below',
          icon: 'warning',
          toast: true,
          timer: 2500,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false
        });
        return;
      }

        const studentFormData=new FormData();
        studentFormData.append("fullname",studentData.fullname)
        studentFormData.append("email",studentData.email)
        studentFormData.append("password",studentData.password)
        studentFormData.append("username",studentData.username)
        if(studentData.date_of_birth) {
            studentFormData.append("date_of_birth",studentData.date_of_birth)
        }
        studentFormData.append("interseted_categories",studentData.interseted_categories)
        if(isMinor && studentData.parent_email.trim()) {
            studentFormData.append("parent_email", studentData.parent_email.trim())
        }
        if(isMinor && studentData.parent_name.trim()) {
            studentFormData.append("parent_name", studentData.parent_name.trim())
        }

      setLoading(true)
        try{
          const response = await axios.post(baseUrl,studentFormData)
          setStudentData({
            'fullname':'',
            'email':'',
            'password':'',
            'username':'',
            'date_of_birth':'',
            'interseted_categories':'',
            'parent_email':'',
            'parent_name':'',
            'status':'success'
          });
          if(response.status==200 || response.status==201){
            const isMinorReg = response.data?.parent_required === true;
            Swal.fire({
              title: isMinorReg 
                ? 'Registered! A consent email has been sent to your parent/guardian.'
                : 'Registered! Please verify your email.',
              icon:'success',
              toast:true,
              timer: isMinorReg ? 4000 : 2000,
              position:'top-right',
              timerProgressBar: true,
              showConfirmButton: false
            });
          }
          let tID = setTimeout(function () {
            window.location.href='/user-login';
            window.clearTimeout(tID);
          }, 2500);
        }catch(error){
            console.log(error);
        setStudentData((prev)=>({ ...prev, 'status':'error' }))
      } finally {
        setLoading(false)
        }
    }

  return (
    <>
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            background: '#e3f2fd',
            borderRadius: '20px',
            fontSize: '14px',
            color: '#1976d2',
            fontWeight: '500',
            marginBottom: '20px'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            Join thousands of learners
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1a1a1a',
            marginBottom: '10px',
            letterSpacing: '-0.5px'
          }}>Create Your Account</h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            fontWeight: '400'
          }}>Start your learning journey today</p>
        </div>

        {/* Main Card */}
        <div style={{ maxWidth: '580px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
          }}>
            
            {/* Back Link */}
            <Link to="/" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '32px',
              fontWeight: '500',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#1976d2'}
            onMouseLeave={(e) => e.target.style.color = '#6b7280'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to role selection
            </Link>

            {/* Header with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '4px',
                  letterSpacing: '-0.3px'
                }}>Student Registration</h2>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>Complete your profile to continue</p>
              </div>
            </div>

            {/* Status Messages */}
            {studentData.status === 'success' && (
              <div style={{
                padding: '14px 16px',
                background: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px',
                color: '#155724',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ✓ Registered Successfully
              </div>
            )}
            {studentData.status === 'error' && (
              <div style={{
                padding: '14px 16px',
                background: '#f8d7da',
                border: '1px solid #f5c6cb',
                borderRadius: '8px',
                color: '#721c24',
                marginBottom: '24px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                ⚠ Something wrong happened
              </div>
            )}

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Full Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Full Name</label>
                <input
                  type="text"
                  onChange={handleChange}
                  name="fullname"
                  value={studentData.fullname}
                  placeholder="e.g., Maya Chen, Alex Patel"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.fullname ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.fullname ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.fullname} />
              </div>

              {/* Email Address */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Email Address</label>
                <input
                  type="email"
                  onChange={handleChange}
                  name="email"
                  value={studentData.email}
                  placeholder="your.email@kannari.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.email ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.email ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.email} />
              </div>

              {/* Username */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Username</label>
                <input
                  type="text"
                  onChange={handleChange}
                  name="username"
                  value={studentData.username}
                  placeholder="e.g., harmonymaster, melodylover"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.username ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.username ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.username} />
              </div>

              {/* Password */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Password</label>
                <input
                  type="password"
                  onChange={handleChange}
                  name="password"
                  value={studentData.password}
                  placeholder="Create a strong password (min. 8 characters)"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.password ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.password ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.password} />
              </div>

              {/* Date of Birth */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Date of Birth</label>
                <input
                  type="date"
                  onChange={handleChange}
                  name="date_of_birth"
                  value={studentData.date_of_birth}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.date_of_birth ? '1px solid #ef4444' : '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = fieldErrors.date_of_birth ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.date_of_birth} />
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginTop: '6px',
                  marginBottom: 0
                }}>Required for child safety compliance. Students under 18 need parental consent for certain features.</p>
              </div>

              {/* Minor Notice + Parent Email Fields */}
              {isMinor && (
                <>
                  <div style={{
                    padding: '16px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '1px solid #f59e0b',
                    borderRadius: '12px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: '#f59e0b', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', flexShrink: 0
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                        <path d="M12 9v4m0 4h.01M10.29 3.86l-8.8 15.32A2 2 0 003.23 22h17.54a2 2 0 001.74-2.82l-8.8-15.32a2 2 0 00-3.42 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#92400e', fontSize: '14px' }}>
                        Under 18 — Parent/Guardian Required
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', color: '#78350f', lineHeight: '1.5' }}>
                        Since you are under 18, a parent or guardian email is <strong>required</strong>. 
                        They will receive a verification email and must approve your account before you can 
                        access messaging and live session features.
                      </p>
                    </div>
                  </div>

                  {/* Parent/Guardian Name */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '14px', fontWeight: '500',
                      color: '#374151', marginBottom: '8px'
                    }}>Parent/Guardian Name <span style={{ color: '#9ca3af', fontWeight: '400' }}>(optional)</span></label>
                    <input
                      type="text"
                      onChange={handleChange}
                      name="parent_name"
                      value={studentData.parent_name}
                      placeholder="e.g., Sarah Chen"
                      style={{
                        width: '100%', padding: '12px 16px', fontSize: '15px',
                        border: '1px solid #e5e7eb', borderRadius: '8px', outline: 'none',
                        transition: 'all 0.2s', boxSizing: 'border-box', color: '#1a1a1a'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>

                  {/* Parent/Guardian Email */}
                  <div>
                    <label style={{
                      display: 'block', fontSize: '14px', fontWeight: '500',
                      color: '#374151', marginBottom: '8px'
                    }}>Parent/Guardian Email <span style={{ color: '#dc2626', fontWeight: '600' }}>*</span></label>
                    <input
                      type="email"
                      onChange={handleChange}
                      name="parent_email"
                      value={studentData.parent_email}
                      placeholder="parent@email.com"
                      required
                      style={{
                        width: '100%', padding: '12px 16px', fontSize: '15px',
                        border: fieldErrors.parent_email ? '1px solid #ef4444' : `1px solid ${studentData.parent_email.trim() ? '#e5e7eb' : '#fbbf24'}`,
                        borderRadius: '8px', outline: 'none',
                        transition: 'all 0.2s', boxSizing: 'border-box', color: '#1a1a1a',
                        backgroundColor: '#fffbeb'
                      }}
                      onFocus={(e) => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'; }}
                      onBlur={(e) => { e.target.style.borderColor = fieldErrors.parent_email ? '#ef4444' : (studentData.parent_email.trim() ? '#e5e7eb' : '#fbbf24'); e.target.style.boxShadow = 'none'; }}
                    />
                    <FieldError error={fieldErrors.parent_email} />
                    <p style={{ fontSize: '12px', color: '#b45309', marginTop: '6px', marginBottom: 0 }}>
                      Your parent/guardian will receive a consent email to verify and approve your account.
                    </p>
                  </div>
                </>
              )}

              {/* Interested Categories */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Interests</label>
                <textarea
                  onChange={handleChange}
                  name="interseted_categories"
                  value={studentData.interseted_categories}
                  placeholder="e.g., Piano, Violin, Vocals, Jazz, Classical, Music Composition, Folk"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    color: '#1a1a1a'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <p style={{
                  fontSize: '13px',
                  color: '#6b7280',
                  marginTop: '6px',
                  marginBottom: 0
                }}>Eg: Piano, Violin, Vocals, Jazz, Classical etc.,</p>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitForm}
                type="button"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
                  opacity: loading ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      display: 'inline-block',
                      animation: 'spin 0.6s linear infinite'
                    }}></span>
                    Registering...
                    <style>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </>
                ) : (
                  <>
                    Complete Profile Setup
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                margin: '8px 0'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '500' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              </div>

              {/* Sign In Link */}
              <Link
                to="/user-login"
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f8f9ff';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Already have an account? Sign In
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Register