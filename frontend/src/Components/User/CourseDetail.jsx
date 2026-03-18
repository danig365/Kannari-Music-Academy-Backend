import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom';
import { useEffect } from 'react'
import { useState } from 'react'
import Swal from 'sweetalert2'
import axios from 'axios'
import './CourseDetail.css'
import Sidebar from './Sidebar';
import LoadingSpinner from '../LoadingSpinner';
import { checkCourseAccess, enrollWithSubscription, getStudentSubscription, formatAccessLevel, getAccessLevelColor } from '../../services/subscriptionService';

import { API_BASE_URL, SITE_URL } from '../../config';

const baseUrl = API_BASE_URL;
const siteUrl = SITE_URL;

const CourseDetail = () => {
    const navigate = useNavigate();
    let {course_id}=useParams();

    const [courseData, setCourseData]=useState([]);
    const [chapterData, setChapterData]=useState([]);
    const [teacherData, setTeacherData]=useState([]);
    const [teachListData, setTeachListData]=useState([]);
    const [relatedCourseData, setRelatedCourseData]=useState([]);
    const [userLoginStatus,setUserLoginStatus]=useState('')
    const [enrolledStatus,setEnrolledStatus]=useState('')
    const [ratingStatus,setRatingStatus]=useState('')
    const [favoriteStatus,setFavoriteStatus]=useState('')
    const [courseViews,setCourseViews]=useState(0)
    const [avgRating,setAvgRating]=useState(0)
    const [courseProgress, setCourseProgress]=useState(null)
    const [sidebarOpen, setSidebarOpen]=useState(false)
    const [isMobile, setIsMobile]=useState(window.innerWidth < 768)
    const [courseAccess, setCourseAccess]=useState({ can_access: true, checking: true })
    const [subscriptionInfo, setSubscriptionInfo]=useState(null)
    const [loading, setLoading]=useState(true)
    const studentId=localStorage.getItem('studentId')
    const studentLoginStatus = localStorage.getItem('studentLoginStatus')

    // Handle window resize for responsive design
    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768)
      }
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close sidebar on mobile when navigating
    const handleNavigate = (path) => {
      if(isMobile) {
        setSidebarOpen(false)
      }
      navigate(path)
    }

    // Redirect to login if not logged in
    useEffect(() => {
      if (studentLoginStatus !== 'true') {
        Swal.fire({
          title: 'Login Required',
          text: 'Please login to view course details',
          icon: 'warning',
          confirmButtonColor: '#4285f4'
        }).then(() => {
          navigate('/student/login');
        });
      }
    }, [studentLoginStatus, navigate]);

    useEffect(()=>{
      console.log('Chapter data changed:', chapterData);
    }, [chapterData]);
    
    useEffect(()=>{
      try{
          axios.get(baseUrl+'/course/'+course_id)
          .then((res)=>{
            console.log('Course data:', res.data);
            console.log('Chapter data:', res.data.course_chapters);
            console.log('Featured image path:', res.data.featured_img);
            console.log('Full image URL:', `${siteUrl}media/${res.data.featured_img}`);
            setChapterData(res.data.course_chapters)
            setTeacherData(res.data.teacher)
            setCourseData(res.data)
            setRelatedCourseData(JSON.parse(res.data.related_videos))
            setTeachListData(res.data.teach_list)
            setCourseViews(res.data.course_views || 0)
            if(res.data.course_rating!='' && res.data.course_rating!=null){
              setAvgRating(res.data.course_rating)
            }
            setLoading(false)
          })
          .catch((err) => {
            console.error('Error fetching course:', err)
            setLoading(false)
          });

          axios.get(baseUrl+'/update-view/'+course_id)
          .then((res) => {
            // Update course views if needed
            setCourseViews(res.data.views)
          })
          .catch((err) => console.log('View update error:', err));
      }catch(error){
          console.log(error);
      }
      try{
        axios.get(baseUrl+'/fetch-enroll-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setEnrolledStatus('success')
            // Fetch course progress to check if already started learning
            axios.get(baseUrl+'/student/course-progress/'+studentId+'/')
            .then((progressRes)=>{
              const courseProgressData = progressRes.data.find(cp => cp.course?.id == course_id || cp.id == course_id);
              if(courseProgressData){
                setCourseProgress(courseProgressData);
              }
            })
            .catch((err) => console.log('Error fetching progress:', err));
          }
        });
      }catch(error){
          console.log(error);
      }

      try{
        axios.get(baseUrl+'/fetch-rating-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setRatingStatus('success')
          }
        });
      }catch(error){
          console.log(error);
      }

      axios.get(baseUrl+'/fetch-favorite-status/'+studentId+'/'+course_id)
        .then((res)=>{
          if(res.data.bool==true){
            setFavoriteStatus('success')
          }else{
            setFavoriteStatus('');
          }
        })
        .catch((err) => {
          console.log('Favorite status fetch error:', err);
          setFavoriteStatus('');
        });

      // Set user login status based on localStorage
      if(studentLoginStatus === 'true'){
        setUserLoginStatus('success')
      }
      console.log('Login status:', studentLoginStatus, 'User login status set:', studentLoginStatus === 'true' ? 'success' : 'not logged in');

      // Check course access based on subscription
      const checkAccess = async () => {
        if (studentId && course_id) {
          try {
            const [accessResult, subInfo] = await Promise.all([
              checkCourseAccess(studentId, course_id),
              getStudentSubscription(studentId)
            ]);
            setCourseAccess({ ...accessResult, checking: false });
            setSubscriptionInfo(subInfo);
          } catch (error) {
            console.error('Access check error:', error);
            setCourseAccess({ can_access: false, checking: false, reason: 'Unable to verify access. Please try again.' });
          }
        } else {
          setCourseAccess({ can_access: false, checking: false, reason: 'Please log in to access courses.' });
        }
      };
      checkAccess();
    }, [course_id, studentLoginStatus]);

    const enrollCourse = async () => {
        console.log('Enroll button clicked! Student ID:', studentId, 'Course ID:', course_id);
        
        if (!studentId) {
            Swal.fire({
                title: 'Please Login',
                text: 'You need to be logged in to enroll',
                icon: 'warning',
                confirmButtonColor: '#4285f4'
            });
            return;
        }

        // Check for active subscription first
        try {
            const subscriptionCheck = await getStudentSubscription(studentId);
            console.log('Subscription check result:', subscriptionCheck);
            
            if (!subscriptionCheck || !subscriptionCheck.has_active_subscription) {
                Swal.fire({
                    title: 'Active Subscription Required',
                    html: `
                        <div style="text-align: left;">
                            <p>You need an active subscription to enroll in courses.</p>
                            <p>Choose a subscription plan that fits your learning goals.</p>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Browse Plans',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#3b82f6'
                }).then((result) => {
                    if (result.isConfirmed) {
                        navigate('/student/subscriptions');
                    }
                });
                return;
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
            Swal.fire({
                title: 'Error',
                text: 'Unable to verify your subscription status. Please try again.',
                icon: 'error',
                confirmButtonColor: '#4285f4'
            });
            return;
        }

        // Check if course requires subscription access
        if (!courseAccess.can_access) {
            Swal.fire({
                title: 'Cannot Access Course',
                html: `
                    <div style="text-align: left;">
                        <p><strong>${courseAccess.message || courseAccess.reason || 'This course requires an active subscription.'}</strong></p>
                        ${courseData.required_access_level ? `<p style="margin-top: 10px;"><strong>Required Level:</strong> ${formatAccessLevel(courseData.required_access_level)}</p>` : ''}
                        <p style="margin-top: 10px; font-size: 14px; color: #666;">Contact admin or upgrade your subscription to access this course.</p>
                    </div>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'View Plans',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#3b82f6'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/student/subscriptions');
                }
            });
            return;
        }

        // Enroll via subscription-validated endpoint
        try {
            const result = await enrollWithSubscription(studentId, course_id);
            
            if (result.success) {
                Swal.fire({
                    title: 'You Successfully Enrolled!',
                    icon: 'success',
                    toast: true,
                    timer: 3000,
                    position: 'top-right',
                    timerProgressBar: true,
                    showConfirmButton: false
                });
                setEnrolledStatus('success');
                
                // Refresh access info
                const newAccessInfo = await checkCourseAccess(studentId, course_id);
                setCourseAccess({ ...newAccessInfo, checking: false });
            } else {
                // Enrollment denied by subscription validation
                Swal.fire({
                    title: 'Enrollment Failed',
                    html: `
                        <div style="text-align: left;">
                            <p>${result.message || result.error || 'You do not meet the subscription requirements for this course.'}</p>
                            <p style="margin-top: 10px; font-size: 14px; color: #666;">Please check your subscription plan or contact support.</p>
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'View Plans',
                    cancelButtonText: 'Close',
                    confirmButtonColor: '#3b82f6'
                }).then((swalResult) => {
                    if (swalResult.isConfirmed) {
                        navigate('/student/subscriptions');
                    }
                });
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            Swal.fire({
                title: 'Enrollment Failed',
                text: error.response?.data?.message || error.response?.data?.error || 'Something went wrong. Please try again.',
                icon: 'error',
                confirmButtonColor: '#4285f4'
            });
        }
    }

    const [ratingData,setRatingData]=useState({
      rating:'',
      reviews:''
    });

    const handleChange=(event)=>{
      setRatingData({
          ...ratingData,
          [event.target.name]:event.target.value
      });
    }

    const formSubmit=()=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('rating',ratingData.rating);
      _formData.append('reviews',ratingData.reviews);

      try{
          axios.post(baseUrl+'/course-rating/',_formData,)
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'Rated Successfully!',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
              }
          });
      }catch(error){
          console.log(error);
      }
    };

    const markAsFav=()=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('status',true);

      try{
          axios.post(baseUrl+'/student-add-favorte-course/',_formData,{
            headers: {
              'content-type':'multipart/form-data'
          }
          })
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'This Course Successfully added to your Favorite list',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
                  setFavoriteStatus('success')
              }
          });
      }catch(error){
          console.log(error);
      }
    };

    const removeFav=(pk)=>{
      const _formData=new FormData();
      _formData.append('course',course_id);
      _formData.append('student',studentId);
      _formData.append('status',false);

      try{
          axios.get(baseUrl+'/student-remove-favorite-course/'+course_id+'/'+studentId,{
            headers: {
              'content-type':'multipart/form-data'
          }
          })
          .then((res)=>{
              if(res.status==200 || res.status==201){
                  Swal.fire({
                      title:'This Course Successfully removed from your Favorite list',
                      icon:'success',
                      toast:true,
                      timer:3000,
                      position:'top-right',
                      timerProgressBar: true,
                      showConfirmButton: false
                  });
                  setFavoriteStatus('')
              }
          });
      }catch(error){
          console.log(error);
      }
    };
    

    useEffect(()=>{
      document.title=`Kannari Music Academy | ${courseData.title || 'Course Details'}`
    }, [courseData.title])

  // Don't render if not logged in
  if (studentLoginStatus !== 'true') {
    return <LoadingSpinner fullScreen size="xl" text="Redirecting to login..." />;
  }

  // Show loading spinner while course data is being fetched
  if (loading) {
    return (
      <div className="course-detail-container">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} isMobile={isMobile} />
        <div className="course-detail-content">
          {isMobile && (
            <div className="course-mobile-header">
              <button 
                className="course-mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <i className="bi bi-list" aria-hidden="true"></i>
              </button>
              <div className="course-mobile-title">Loading Course...</div>
            </div>
          )}
          <div className="course-detail-main" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh'
          }}>
            <LoadingSpinner size="lg" text="Loading course details..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="course-detail-container">
        {/* Mobile Header */}
        {isMobile && (
          <div className="course-mobile-header">
            <div className="course-mobile-header-content">
              <button 
                className="course-mobile-menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar"
              >
                <i className="bi bi-list" aria-hidden="true"></i>
              </button>
              <div className="course-mobile-title">{courseData.title}</div>
            </div>
          </div>
        )}

        {/* Sidebar Overlay */}
        {isMobile && (
          <div 
            className={`course-sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}

        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen}
          isMobile={isMobile}
        />

        <div className="course-detail-content">
          <div className="course-detail-main">
        {/* Back Button */}
        <div className="course-back-section">
          <div className="course-back-container">
            <Link 
              to='/student/my-courses'
              className="course-back-link"
            >
              <i className="bi bi-arrow-left course-back-icon" aria-hidden="true"></i>
              <span>Back to My Courses</span>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="course-hero-section">
          <div className='course-hero-container'>
            <div className='course-hero-row'>
              {/* Course Image */}
              <div className='course-image-col'>
                <div className='course-image-wrapper'>
                  {courseData.featured_img ? (
                    <img 
                      src={courseData.featured_img.startsWith('http') ? courseData.featured_img : `${siteUrl}media/${courseData.featured_img}`} 
                      className="course-featured-image"
                      alt={courseData.title}
                      onError={(e) => {
                        console.error('Image failed to load. URL:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML += '<div class="course-image-placeholder"><i class="bi bi-music-note-beamed course-placeholder-icon"></i></div>';
                      }}
                    />
                  ) : (
                    <div className="course-image-placeholder">
                      <i className="bi bi-music-note-beamed course-placeholder-icon"></i>
                    </div>
                  )}
                </div>
                <div className="course-action-buttons">
                  {/* Show access restriction message if course is restricted */}
                  {!courseAccess.checking && !courseAccess.can_access && (
                    <div className="course-access-banner" style={{
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      border: '1px solid #fca5a5',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <i className="bi bi-lock-fill" style={{ color: 'white', fontSize: '18px' }}></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: '#7f1d1d', marginBottom: '4px' }}>
                          Subscription Required
                        </div>
                        <div style={{ fontSize: '13px', color: '#991b1b' }}>
                          {courseAccess.reason || 'You need an active subscription to access this course'}
                        </div>
                      </div>
                    </div>
                  )}

                  {userLoginStatus === 'success' && enrolledStatus !== 'success' && (
                    courseAccess.can_access ? (
                      <button 
                        type='button' 
                        onClick={enrollCourse}
                        className="course-btn course-btn-enroll"
                      >
                        <i className='bi bi-plus-circle'></i> Enroll Now
                      </button>
                    ) : (
                      <Link 
                        to='/student/subscriptions' 
                        className='course-btn course-btn-enroll'
                        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                      >
                        <i className='bi bi-star-fill'></i> Upgrade to Enroll
                      </Link>
                    )
                  )}
                  {enrolledStatus === 'success' && userLoginStatus === 'success' &&
                    <Link 
                      to={`/student/learn/${course_id}`} 
                      className='course-btn course-btn-learn'
                    >
                      <i className='bi bi-play-fill'></i> {courseProgress && courseProgress.progress_percentage > 0 ? 'Continue Learning' : 'Start Learning'}
                    </Link>
                  }
                  {userLoginStatus !== 'success' && 
                    <Link 
                      to='/student/login' 
                      className='course-btn course-btn-login'
                    >
                      Login to Enroll
                    </Link>
                  }
                </div>
              </div>

              {/* Course Info */}
              <div className='course-info-col'>
                <h1 className="course-title">
                  {courseData.title}
                </h1>
                
                <p className="course-description">
                  {courseData.description}
                </p>

                {/* Course Meta */}
                <div className="course-meta-grid">
                  {/* Instructor */}
                  <div className="course-meta-item">
                    <p className="course-meta-label">
                      <i className='bi bi-person-badge' aria-hidden="true"></i>Instructor
                    </p>
                    <Link 
                      to={`/teacher-detail/${teacherData.id}`}
                      className="course-meta-value"
                    >
                      {teacherData.full_name}
                    </Link>
                  </div>

                  {/* Category */}
                  <div className="course-meta-item category">
                    <p className="course-meta-label">
                      <i className='bi bi-tag' aria-hidden="true"></i>Category
                    </p>
                    <span className="course-meta-value">
                      {courseData.category?.title || 'General'}
                    </span>
                  </div>

                  {/* Technologies */}
                  <div className="course-meta-item tech">
                    <p className="course-meta-label">
                      <i className='bi bi-tools' aria-hidden="true"></i>Technologies
                    </p>
                    <div className="course-tech-badges">
                      {courseData.techs?.split(',').map((tech, idx) => (
                        <span 
                          key={idx}
                          className="course-tech-badge"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="course-stats">
                  {/* Rating */}
                  <div className="course-stat-box course-stat-rating">
                    <div className="course-stat-value">
                      {avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : 'New'}
                    </div>
                    <p className="course-stat-label">
                      <i className='bi bi-star-fill'></i>Rating
                    </p>
                  </div>

                  {/* Students */}
                  <div className="course-stat-box course-stat-students">
                    <div className="course-stat-value">
                      {courseData.total_enrolled_students || 0}
                    </div>
                    <p className="course-stat-label">
                      <i className='bi bi-people'></i>Students
                    </p>
                  </div>

                  {/* Views */}
                  <div className="course-stat-box course-stat-views">
                    <div className="course-stat-value">
                      {courseViews}
                    </div>
                    <p className="course-stat-label">
                      <i className='bi bi-eye'></i>Views
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content & Rating */}
        <div className='course-content-section'>
          <div className='course-content-row'>
            {/* Left Column - Course Structure */}
            <div style={{width: '100%'}}>
              {/* Course Modules */}
              {userLoginStatus == 'success' && enrolledStatus=='success' && chapterData.length > 0 && (
                <div className="course-modules-card">
                  <h3 className="course-card-title">
                    <i className='bi bi-collection-play course-card-icon' aria-hidden="true"></i>
                    Course Content
                  </h3>
                  <div className="course-modules-list">
                    {chapterData && chapterData.length > 0 ? (
                      chapterData.map((chapter, index) => {
                        console.log('Rendering chapter:', chapter);
                        return (
                          <div 
                            key={chapter.id}
                            className="course-module-item"
                          >
                            <span className="course-module-number">
                              {index + 1}
                            </span>
                            <div className="course-module-info">
                              <p className="course-module-title">
                                {chapter.title || 'Untitled Chapter'}
                              </p>
                              <p className="course-module-lessons">
                                {(chapter.module_lessons && chapter.module_lessons.length) || chapter.total_lessons || 0} lessons
                              </p>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p style={{color: '#9ca3af', textAlign: 'center', padding: '20px'}}>No chapters available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Rating Section */}
              {enrolledStatus=='success' && userLoginStatus=='success' && (
                <div className="course-rating-card">
                  <h3 className="course-card-title">
                    <i className='bi bi-star-fill course-card-icon' style={{color: '#f59e0b'}}></i>
                    Course Rating
                  </h3>

                  {ratingStatus != 'success' ? (
                    <>
                      <button 
                        className='course-rating-btn' 
                        data-bs-toggle="modal" 
                        data-bs-target="#ratingModal"
                      >
                        <i className='bi bi-star'></i>Rate This Course
                      </button>

                      {/* Rating Modal */}
                      <div className="modal fade" id="ratingModal" tabIndex="-1" aria-labelledby="ratingModalLabel" aria-hidden="true">
                        <div className="modal-dialog modal-lg">
                          <div className="course-modal-content modal-content">
                            <div className="course-modal-header modal-header">
                              <h5 className="course-modal-title modal-title" id="ratingModalLabel">
                                Rate "{courseData.title}"
                              </h5>
                              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="course-modal-body modal-body">
                              <div className="course-form-group">
                                <label className="course-form-label">
                                  <i className='bi bi-star-fill text-warning'></i>Rating
                                </label>
                                <select 
                                  onChange={handleChange} 
                                  className='course-form-select form-select' 
                                  name='rating'
                                >
                                  <option value="">Select Rating</option>
                                  <option value="1">⭐ 1 - Poor</option>
                                  <option value="2">⭐⭐ 2 - Fair</option>
                                  <option value="3">⭐⭐⭐ 3 - Good</option>
                                  <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
                                  <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
                                </select>
                              </div>
                              <div className="course-form-group">
                                <label className="course-form-label">
                                  <i className='bi bi-chat-dots'></i>Your Review
                                </label>
                                <textarea 
                                  onChange={handleChange} 
                                  name="reviews" 
                                  className="course-form-textarea form-control" 
                                  rows="5"
                                  placeholder="Share your experience with this course..."
                                />
                              </div>
                            </div>
                            <div className="course-modal-footer modal-footer">
                              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                              <button type="button" className="btn btn-primary" onClick={formSubmit}>
                                <i className='bi bi-check-lg'></i>Submit Rating
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="course-rating-success">
                      <i className='bi bi-check-circle'></i>
                      Thank you! You have already rated this course.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Quick Info */}
            <div style={{width: '100%'}}>
              <div className="course-quick-info-card">
                <h5 className="course-quick-info-title">
                  <i className='bi bi-info-circle' aria-hidden="true"></i>Course Info
                </h5>
                
                <div className="course-info-list">
                  <div className="course-info-item">
                    <p className="course-info-label">
                      Level
                    </p>
                    <span className="course-info-value">
                      {courseData.category?.title || 'All Levels'}
                    </span>
                  </div>

                  <div className="course-info-item">
                    <p className="course-info-label">
                      Students Enrolled
                    </p>
                    <span className="course-info-value">
                      {courseData.total_enrolled_students || 0}
                    </span>
                  </div>

                  <div className="course-info-item">
                    <p className="course-info-label">
                      Course Views
                    </p>
                    <span className="course-info-value">
                      {courseViews}
                    </span>
                  </div>

                  <div className="course-info-item">
                    <p className="course-info-label">
                      Average Rating
                    </p>
                    <div className="course-rating-display">
                      <span className="course-rating-value">
                        {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
                      </span>
                      <span className="course-rating-stars">
                        {avgRating > 0 ? '⭐'.repeat(Math.round(avgRating)) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Courses */}
        {relatedCourseData.length > 0 && (
          <div className='course-related-section'>
            <h2 className='course-related-title'>
              <i className='bi bi-music-note-list course-related-icon' aria-hidden="true"></i>
              Related Courses
            </h2>
            
            <div className='course-related-grid'>
              {relatedCourseData.slice(0, 4).map((rcourse, index) => (
                <Link 
                  to={`/detail/${rcourse.pk}`}
                  key={index}
                  className="course-related-card"
                >
                  <img 
                    src={`${siteUrl}media/${rcourse.fields.featured_img}`} 
                    className="course-related-image" 
                    alt={rcourse.fields.title}
                  />
                  <div className="course-related-body">
                    <h6 className="course-related-course-title">
                      {rcourse.fields.title}
                    </h6>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
          </div>
        </div>
    </div>
  )
}

export default CourseDetail
