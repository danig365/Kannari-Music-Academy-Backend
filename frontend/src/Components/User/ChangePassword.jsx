import React from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { useState } from 'react'
import Swal from 'sweetalert2'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const ChangePassword = () => {
    useEffect(()=>{
        document.title='LMS | User Password Settings'
      })

    const studentId=localStorage.getItem('studentId');

    const [studentData,setstudentData]=useState({
        'password':''
    });

    const handleChange=(event)=>{
        setstudentData({
            ...studentData,
            [event.target.name]:event.target.value
        });
    }

    const submitForm=()=>{
        const studentFormData=new FormData();
        studentFormData.append("password",studentData.password)

        try{
                axios.post(baseUrl+'/student/change-password/'+studentId+'/',studentFormData)
                .then((response)=>{
                    if(response.status==200){
                        Swal.fire({
                            title:'Password Updated Successfully',
                            icon:'success',
                            toast:true,
                            timer:3000,
                            position:'top-right',
                            timerProgressBar: true,
                            showConfirmButton: false
                        
                        });
                        window.location.href='/user-logout';
                    }else{
                        Swal.fire({
                            title:'Error: Please Try again!',
                            icon:'success',
                            toast:true,
                            timer:3000,
                            position:'top-right',
                            timerProgressBar: true,
                            showConfirmButton: false
                        
                        });
                    }
                    })
        }catch(error){
            console.log(error);
            setstudentData({'status':'error'})
        }
    }

    const studentLoginStatus=localStorage.getItem('studentLoginStatus')
    if(studentLoginStatus!='true'){
        window.location.href='/user-login';
    }

  return (
    <>
      <h3 style={{
        fontSize: '18px',
        fontWeight: 600,
        color: '#1a2332',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <i className="bi bi-lock" style={{color: '#ef4444'}}></i>
        Change Password
      </h3>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontWeight: 500, color: '#1a2332', marginBottom: '6px', fontSize: '14px'}}>
          <i className='bi bi-key me-2'></i>New Password
        </label>
        <input 
          type="password" 
          name='password' 
          value={studentData.password} 
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit'
          }}
          placeholder="Enter your new password"
        />
      </div>

      <p style={{color: '#6b7280', fontSize: '13px', marginBottom: '16px', marginTop: '-8px'}}>
        <i className='bi bi-info-circle me-1'></i>
        Password must be at least 8 characters long
      </p>

      <button 
        onClick={submitForm} 
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          padding: '12px 20px',
          fontWeight: 500,
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => e.target.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.3)'}
        onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
      >
        <i className='bi bi-check-lg me-2'></i>Update Password
      </button>
    </>
  )
}

export default ChangePassword 

