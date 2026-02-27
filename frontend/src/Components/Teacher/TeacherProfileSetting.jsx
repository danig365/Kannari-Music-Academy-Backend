import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import Swal from 'sweetalert2'
import LoadingSpinner from '../LoadingSpinner'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherProfileSetting = () => {
    const [loading, setLoading] = useState(true);
    
    useEffect(()=>{
        document.title='LMS | Settings'
      })

    const teacherId=localStorage.getItem('teacherId');

    const [teacherData,setTeacherData]=useState({
        'full_name':'',
        'email':'',
        'qualification':'',
        'mobile_no':'',
        'skills':'',
        'profile_img':'',
        'p_img':'',
        'status':'',
        'face_url':'',
        'insta_url':'',
        'twit_url':'',
        'web_url':'',
        'you_url':'',
    });

      const [verificationData, setVerificationData] = useState(null);
      const [verificationLoading, setVerificationLoading] = useState(false);
      const [verificationForm, setVerificationForm] = useState({
        document_type: 'government_id',
        id_document: null,
        provider_name: '',
        reference_number: '',
        confirmation_email: '',
        evidence_file: null,
        signature_text: ''
      });

    useEffect(()=>{
        try{
            axios.get(baseUrl+'/teacher/'+teacherId)
            .then((res)=>{
                setTeacherData({
                full_name:res.data.full_name,
                email:res.data.email,
                qualification:res.data.qualification,
                mobile_no:res.data.mobile_no,
                skills:res.data.skills,
                profile_img:res.data.profile_img,
                p_img:'',
                face_url:res.data.face_url || '',
                insta_url:res.data.insta_url || '',
                twit_url:res.data.twit_url || '',
                web_url:res.data.web_url || '',
                you_url:res.data.you_url || '',

              });
              setLoading(false);
            })
            .catch((error) => {
                console.log(error);
                setLoading(false);
            });
        }catch(error){
            console.log(error);
            setLoading(false);
        }
      },[teacherId]);

      const fetchVerificationStatus = async () => {
        if (!teacherId) return;
        setVerificationLoading(true);
        try {
          const res = await axios.get(`${baseUrl}/teacher/${teacherId}/verification/status/`);
          setVerificationData(res.data?.verification || null);
        } catch (error) {
          console.log('Error fetching verification status:', error);
        } finally {
          setVerificationLoading(false);
        }
      };

      useEffect(() => {
        fetchVerificationStatus();
      }, [teacherId]);

    const handleChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.value
        });
    }

    const handleFileChange=(event)=>{
        setTeacherData({
            ...teacherData,
            [event.target.name]:event.target.files[0]
        })
      }

    const submitForm=()=>{
        const teacherFormData=new FormData();
        teacherFormData.append("full_name",teacherData.full_name || '')
        teacherFormData.append("email",teacherData.email || '')
        teacherFormData.append("qualification",teacherData.qualification || '')
        teacherFormData.append("mobile_no",teacherData.mobile_no || '')
        teacherFormData.append("skills",teacherData.skills || '')
        teacherFormData.append("face_url",teacherData.face_url || '')
        teacherFormData.append("insta_url",teacherData.insta_url || '')
        teacherFormData.append("twit_url",teacherData.twit_url || '')
        teacherFormData.append("web_url",teacherData.web_url || '')
        teacherFormData.append("you_url",teacherData.you_url || '')

        if(teacherData.p_img && teacherData.p_img !== ''){
            teacherFormData.append('profile_img',teacherData.p_img,teacherData.p_img.name);
        }

        try{
                axios.put(baseUrl+'/teacher/'+teacherId+'/',teacherFormData,{
                    headers: {
                        'content-type':'multipart/form-data'
                    }
                }).then((response)=>{
                    if(response.status===200){
                        // Update localStorage with new profile image URL
                        if(response.data.profile_img){
                            localStorage.setItem('teacherProfileImg', response.data.profile_img);
                        }
                        Swal.fire({
                            title:'Profile Updated Successfully',
                            icon:'success',
                            toast:true,
                            timer:3000,
                            position:'top-right',
                            timerProgressBar: true,
                            showConfirmButton: false
                        });
                        // Dispatch storage event to notify sidebar of changes
                        window.dispatchEvent(new Event('storage'));
                    }
                    })
        }catch(error){
            console.log(error);
            setTeacherData({'status':'error'})
        }
    }

    const startVerification = async () => {
      try {
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/start/`);
        Swal.fire({ icon: 'success', title: res.data?.message || 'Verification started' });
        fetchVerificationStatus();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: error.response?.data?.message || 'Unable to start verification.',
        });
      }
    };

    const uploadIdDocument = async () => {
      if (!verificationForm.id_document) {
        Swal.fire({ icon: 'warning', title: 'Please select an ID document file.' });
        return;
      }
      try {
        const formData = new FormData();
        formData.append('document_type', verificationForm.document_type);
        formData.append('id_document', verificationForm.id_document);
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/upload-id/`, formData);
        Swal.fire({ icon: 'success', title: res.data?.message || 'ID submitted' });
        setVerificationForm(prev => ({ ...prev, id_document: null }));
        fetchVerificationStatus();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to upload ID',
          text: error.response?.data?.message || 'Please try again.',
        });
      }
    };

    const submitBackgroundCheck = async () => {
      try {
        const formData = new FormData();
        formData.append('provider_name', verificationForm.provider_name || '');
        formData.append('reference_number', verificationForm.reference_number || '');
        formData.append('confirmation_email', verificationForm.confirmation_email || '');
        if (verificationForm.evidence_file) {
          formData.append('evidence_file', verificationForm.evidence_file);
        }
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/background-check/`, formData);
        Swal.fire({ icon: 'success', title: res.data?.message || 'Background details submitted' });
        fetchVerificationStatus();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to submit background check',
          text: error.response?.data?.message || 'Please try again.',
        });
      }
    };

    const signAgreement = async (agreementType) => {
      const signatureText = (verificationForm.signature_text || '').trim();
      if (!signatureText) {
        Swal.fire({ icon: 'warning', title: 'Please enter signature text first.' });
        return;
      }
      try {
        const payload = new FormData();
        payload.append('agreement_type', agreementType);
        payload.append('signature_text', signatureText);
        const res = await axios.post(`${baseUrl}/teacher/${teacherId}/verification/sign-agreement/`, payload);
        Swal.fire({ icon: 'success', title: res.data?.message || 'Agreement submitted' });
        fetchVerificationStatus();
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Failed to sign agreement',
          text: error.response?.data?.message || 'Please try again.',
        });
      }
    };

    const teacherLoginStatus=localStorage.getItem('teacherLoginStatus')
    if(teacherLoginStatus!=='true'){
        window.location.href='/teacher-login';
    }

    if (loading) {
        return <LoadingSpinner size="lg" text="Loading profile settings..." />;
    }

  return (
    <>
        <div style={{
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}>
          {/* Card Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="bi bi-person-lines-fill" style={{
              fontSize: '24px',
              color: '#fff',
              fontWeight: 600
            }}></i>
            <h5 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#fff',
              margin: '0'
            }}>Profile Settings</h5>
          </div>

          {/* Card Body */}
          <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '32px', padding: '20px', border: '2px solid #f5f7fa', borderRadius: '12px', backgroundColor: '#fafbff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>Child Safety Verification</h3>
                <button className="btn btn-sm btn-outline-primary" onClick={fetchVerificationStatus}>
                  <i className="bi bi-arrow-repeat me-1"></i> Refresh
                </button>
              </div>

              {verificationLoading ? (
                <div style={{ color: '#6b7280', fontSize: '14px' }}>Loading verification status...</div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <span className={`badge ${verificationData?.overall_status === 'approved' ? 'bg-success' : verificationData?.overall_status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      Overall: {verificationData?.overall_status || 'not_started'}
                    </span>
                    <span className={`badge ${verificationData?.id_verification_status === 'approved' ? 'bg-success' : verificationData?.id_verification_status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      ID: {verificationData?.id_verification_status || 'pending'}
                    </span>
                    <span className={`badge ${verificationData?.background_check_status === 'approved' ? 'bg-success' : verificationData?.background_check_status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      Background: {verificationData?.background_check_status || 'pending'}
                    </span>
                    <span className={`badge ${verificationData?.agreement_status === 'approved' ? 'bg-success' : verificationData?.agreement_status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                      Agreements: {verificationData?.agreement_status || 'pending'}
                    </span>
                    <span className={`badge ${verificationData?.can_teach_minors ? 'bg-success' : 'bg-secondary'}`}>
                      {verificationData?.can_teach_minors ? 'Can Teach Minors' : 'Minor Teaching Blocked'}
                    </span>
                  </div>

                  <button className="btn btn-primary btn-sm mb-3" onClick={startVerification}>
                    <i className="bi bi-play-circle me-1"></i> Start / Re-submit Verification
                  </button>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ID Document Type</label>
                      <select
                        className="form-select"
                        value={verificationForm.document_type}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, document_type: e.target.value }))}
                      >
                        <option value="government_id">Government ID</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Upload ID Document</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, id_document: e.target.files?.[0] || null }))}
                      />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-outline-primary btn-sm" onClick={uploadIdDocument}>
                        <i className="bi bi-upload me-1"></i> Submit ID for Review
                      </button>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Background Provider</label>
                      <input
                        className="form-control"
                        value={verificationForm.provider_name}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, provider_name: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Reference Number</label>
                      <input
                        className="form-control"
                        value={verificationForm.reference_number}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, reference_number: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fw-semibold">Confirmation Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={verificationForm.confirmation_email}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, confirmation_email: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fw-semibold">Background Evidence (optional)</label>
                      <input
                        type="file"
                        className="form-control"
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, evidence_file: e.target.files?.[0] || null }))}
                      />
                    </div>
                    <div className="col-md-4 d-flex align-items-end">
                      <button className="btn btn-outline-primary btn-sm w-100" onClick={submitBackgroundCheck}>
                        <i className="bi bi-shield-check me-1"></i> Submit Background Check
                      </button>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">Signature Text</label>
                      <input
                        className="form-control"
                        placeholder="Type your full name as signature"
                        value={verificationForm.signature_text}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, signature_text: e.target.value }))}
                      />
                    </div>
                    <div className="col-12 d-flex flex-wrap gap-2">
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => signAgreement('child_safety')}>
                        Sign Child Safety
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => signAgreement('code_of_conduct')}>
                        Sign Code of Conduct
                      </button>
                      <button className="btn btn-outline-secondary btn-sm" onClick={() => signAgreement('background_check_consent')}>
                        Sign Background Consent
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Information Section */}
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '24px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f5f7fa'
              }}>Profile Information</h3>

              {/* Full Name */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Full Name</label>
                <input 
                  name='full_name' 
                  type="text"  
                  value={teacherData.full_name} 
                  onChange={handleChange} 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Email</label>
                <input 
                  name='email' 
                  type="email" 
                  value={teacherData.email} 
                  onChange={handleChange} 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Profile Image */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Profile Image</label>
                <div style={{
                  position: 'relative',
                  marginBottom: '16px'
                }}>
                  <input 
                    type="file" 
                    onChange={handleFileChange} 
                    name='p_img' 
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px dashed #e5e7eb',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 400,
                      color: '#4b5563',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.backgroundColor = '#f0f4f8';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  />
                </div>
                {teacherData.profile_img && (
                  <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <img 
                      src={teacherData.profile_img} 
                      alt={teacherData.full_name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '12px',
                        objectFit: 'cover',
                        border: '2px solid #e5e7eb'
                      }}
                    />
                    <div>
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        margin: '0',
                        fontWeight: 500
                      }}>Current Profile Image</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Mobile Number</label>
                <input 
                  name='mobile_no' 
                  type="tel" 
                  value={teacherData.mobile_no} 
                  onChange={handleChange} 
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Skills */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Skills</label>
                <textarea 
                  name='skills' 
                  value={teacherData.skills} 
                  onChange={handleChange} 
                  placeholder='List your professional skills...'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Qualification */}
              <div style={{ marginBottom: '0' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>Qualification</label>
                <textarea 
                  name='qualification' 
                  value={teacherData.qualification} 
                  onChange={handleChange} 
                  placeholder='List your qualifications and certifications...'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    minHeight: '100px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Divider */}
            <hr style={{
              border: 'none',
              borderTop: '2px solid #f5f7fa',
              margin: '40px 0'
            }} />

            {/* Social Accounts Section */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '24px',
                paddingBottom: '12px',
                borderBottom: '2px solid #f5f7fa'
              }}>Social Accounts</h3>

              {/* Facebook Link */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  <i className="bi bi-facebook" style={{ marginRight: '8px', color: '#3b5998' }}></i>
                  Facebook Link
                </label>
                <input 
                  name='face_url' 
                  type="url"  
                  value={teacherData.face_url} 
                  onChange={handleChange}
                  placeholder='https://facebook.com/your-profile'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Instagram Link */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  <i className="bi bi-instagram" style={{ marginRight: '8px', color: '#E1306C' }}></i>
                  Instagram Link
                </label>
                <input 
                  name='insta_url' 
                  type="url"  
                  value={teacherData.insta_url} 
                  onChange={handleChange}
                  placeholder='https://instagram.com/your-profile'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Twitter Link */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  <i className="bi bi-twitter" style={{ marginRight: '8px', color: '#1DA1F2' }}></i>
                  Twitter Link
                </label>
                <input 
                  name='twit_url' 
                  type="url"  
                  value={teacherData.twit_url} 
                  onChange={handleChange}
                  placeholder='https://twitter.com/your-profile'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Website Link */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  <i className="bi bi-globe" style={{ marginRight: '8px', color: '#667eea' }}></i>
                  Website Link
                </label>
                <input 
                  name='web_url' 
                  type="url"  
                  value={teacherData.web_url} 
                  onChange={handleChange}
                  placeholder='https://your-website.com'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* YouTube Link */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px'
                }}>
                  <i className="bi bi-youtube" style={{ marginRight: '8px', color: '#FF0000' }}></i>
                  YouTube Link
                </label>
                <input 
                  name='you_url' 
                  type="url"  
                  value={teacherData.you_url} 
                  onChange={handleChange}
                  placeholder='https://youtube.com/your-channel'
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 400,
                    color: '#1a1a1a',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              paddingTop: '24px',
              borderTop: '2px solid #f5f7fa'
            }}>
              <button 
                onClick={submitForm}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'translateY(0)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }}
              >
                <i className="bi bi-check-circle" style={{ marginRight: '8px' }}></i>
                Update Profile
              </button>
            </div>
          </div>
        </div>
    </>
  )
}

export default TeacherProfileSetting
