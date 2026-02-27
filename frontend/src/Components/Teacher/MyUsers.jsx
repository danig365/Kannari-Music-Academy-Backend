import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import './img.css'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const MyUsers = () => {

    const teacherId=localStorage.getItem('teacherId')

    useEffect(()=>{
        document.title='LMS | Your Candidates'
      })

      const [studentData, setStudentData]=useState([]);

      useEffect(()=>{
        try{
            axios.get(baseUrl+'/fetch-all-enrolled-students/'+teacherId)
            .then((res)=>{
                setStudentData(res.data)
            });
        }catch(error){
            console.log(error)
        }
      },[]);

  return (
    <>
    <div className='card'>
                    <h5 className='card-header'><i class="bi bi-people-fill"> </i>All Enrolled List
                    <button type="button" className="btn btn-primary btn-sm float-end" data-bs-toggle="modal" data-bs-target="#groupMsgModal">
                        Send Messages
                    </button>
                    </h5>
                    <div className='card-body' class="table-responsive">
                        <table className='table table-striped table-hover'>
                            <thead>
                                <tr>
                                    <th className='text-center'>Profile</th>
                                    <th className='text-center'>Name</th>
                                    <th className='text-center'>Enrolled In</th>
                                    <th className='text-center'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentData.map((row,index) => 
                                    <tr>
                                    <td className='text-center'>
                                        <img className='imgmeet' src={row.student.profile_img} />
                                    </td>
                                    <td className='text-center'>{row.student.username}</td>
                                    <td className='text-center'>{row.course.title}</td>
                                    <td className='text-center'>
                                        <button type="button" className='btn btn-sm btn-secondary mb-2'><i className="bi bi-person"></i></button>
                                    </td>
                                </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
    </>
  )
}

export default MyUsers
