import React from 'react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import './TeacherDashboard.css'

import { API_BASE_URL } from '../../config';

const baseUrl = API_BASE_URL;

const TeacherDashboard = () => {
  useEffect(()=>{
    document.title='LMS | Teacher DashBoard'
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []) 
  
  const [dashbarData, setDashbarData] = useState([])
  const teacherId = localStorage.getItem('teacherId')

  useEffect(()=>{
    try{
      axios.get(baseUrl+'/teacher/dashboard/'+teacherId)
      .then((res)=>{
        setDashbarData(res.data)
      })
    }catch(error){
      console.log(error)
    }
  },[]);

  return (
    <div className='teacher-page-wrapper'>
    <div className='teacher-dashboard-container'>
      <div className='teacher-dashboard-header mb-4'>
        <h2 className='dashboard-title'>Dashboard</h2>
      </div>

      {/* Stats Cards Row */}
      <div className='stats-grid'>
        <div className='stat-card'>
          <div className='stat-icon stat-icon-courses'>
            <i className="bi bi-journals"></i>
          </div>
          <div className='stat-content'>
            <div className='stat-label'>Total Courses</div>
            <Link to="/teacher/my-courses" className='stat-value'>
              {dashbarData.total_teacher_course || 0}
            </Link>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-icon stat-icon-students'>
            <i className="bi bi-people-fill"></i>
          </div>
          <div className='stat-content'>
            <div className='stat-label'>Total Students</div>
            <Link to="/teacher/my-users" className='stat-value'>
              {dashbarData.total_teacher_students || 0}
            </Link>
          </div>
        </div>

        <div className='stat-card'>
          <div className='stat-icon stat-icon-chapters'>
            <i className="bi bi-stickies-fill"></i>
          </div>
          <div className='stat-content'>
            <div className='stat-label'>Total Chapters</div>
            <Link to="/teacher/my-courses" className='stat-value'>
              {dashbarData.total_teacher_chapters || 0}
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default TeacherDashboard
