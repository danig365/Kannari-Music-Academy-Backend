import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Swal from 'sweetalert2'


import { API_BASE_URL } from '../../config';
import { validateTeacherRegisterForm, FieldError } from '../../utils/formValidation';

const baseUrl = `${API_BASE_URL}/teacher/`;

const TeacherRegister = () => {
    useEffect(()=>{
        document.title='LMS | Teacher Register';
    });

    useEffect(() => {
        window.scrollTo(0, 0)
      }, [])

    const [teacherData,setTeacherData]=useState({
            'full_name':'',
            'email':'',
            'password':'',
            'qualification':'',
            'mobile_no':'',
            'skills':'',
            'status':''
    })
              const [loading, setLoading] = useState(false)
    const [fieldErrors, setFieldErrors] = useState({})

    const handleChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=async()=>{
      if (loading) return

      const errors = validateTeacherRegisterForm({
        full_name: teacherData.full_name,
        email: teacherData.email,
        password: teacherData.password,
        qualification: teacherData.qualification,
        mobile_no: teacherData.mobile_no
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

        const teacherFormData=new FormData();
        teacherFormData.append("full_name",teacherData.full_name)
        teacherFormData.append("email",teacherData.email)
        teacherFormData.append("password",teacherData.password)
        teacherFormData.append("qualification",teacherData.qualification)
        teacherFormData.append("mobile_no",teacherData.mobile_no)
        teacherFormData.append("skills",teacherData.skills)

      setLoading(true)
      try{
        const response = await axios.post(baseUrl,teacherFormData)
        setTeacherData({
          'full_name':'',
          'email':'',
          'password':'',
          'qualification':'',
          'mobile_no':'',
          'skills':'',
          'status':'success'
        });
        if(response.status==200 || response.status==201){
          Swal.fire({
            title:'Registered! Verify your email, then wait for admin approval before login.',
            icon:'success',
            toast:true,
            timer:2800,
            position:'top-right',
            timerProgressBar: true,
            showConfirmButton: false
          });
        }
        let tID = setTimeout(function () {
          window.location.href='/teacher-login';
          window.clearTimeout(tID);
        }, 2800);
      }catch(error){
        setTeacherData((prev) => ({ ...prev, 'status':'error' }))
        Swal.fire({
          title: error?.response?.data?.message || 'Registration failed. Please try again.',
          icon: 'error',
          toast: true,
          timer: 2500,
          position: 'top-right',
          timerProgressBar: true,
          showConfirmButton: false,
        })
      } finally {
        setLoading(false)
        }
    }

    const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
    if(teacherLoginStatus=='true'){
        window.location.href='/teacher-dashboard';
    }
    
 return (
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
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '4px',
                  letterSpacing: '-0.3px'
                }}>Teacher Registration</h2>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: 0
                }}>Complete your profile to continue</p>
              </div>
            </div>

            {/* Status Messages */}
            {teacherData.status === 'success' && (
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
                ✓ Registered successfully. Verify your email, then wait for admin approval before logging in.
              </div>
            )}
            {teacherData.status === 'error' && (
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
                ⚠ Please fill all fields correctly
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
                  name="full_name"
                  value={teacherData.full_name}
                  placeholder="e.g., James Mitchell, Dr. Rajesh Kumar"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.full_name ? '1px solid #ef4444' : '1px solid #e5e7eb',
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
                    e.target.style.borderColor = fieldErrors.full_name ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.full_name} />
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
                  value={teacherData.email}
                  placeholder="instructor@kannari.com"
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
                  value={teacherData.password}
                  placeholder="Create a secure password (min. 8 characters)"
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

              {/* Qualifications */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Qualifications</label>
                <input
                  type="text"
                  onChange={handleChange}
                  name="qualification"
                  value={teacherData.qualification}
                  placeholder="e.g., B.Mus., M.A. in Music, Certified Piano Instructor"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.qualification ? '1px solid #ef4444' : '1px solid #e5e7eb',
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
                    e.target.style.borderColor = fieldErrors.qualification ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.qualification} />
              </div>

              {/* Mobile Number */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Mobile No</label>
                <input
                  type="number"
                  onChange={handleChange}
                  name="mobile_no"
                  value={teacherData.mobile_no}
                  placeholder="e.g., +1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: fieldErrors.mobile_no ? '1px solid #ef4444' : '1px solid #e5e7eb',
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
                    e.target.style.borderColor = fieldErrors.mobile_no ? '#ef4444' : '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <FieldError error={fieldErrors.mobile_no} />
              </div>

              {/* Skills */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Skills</label>
                <textarea
                  onChange={handleChange}
                  name="skills"
                  value={teacherData.skills}
                  placeholder="Piano, Violin, Music Theory, Composition, Voice Training, etc."
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
                to="/teacher-login"
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
  )
}

export default TeacherRegister