import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import Swal from 'sweetalert2';

const AccessLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    access_type: '',
    was_allowed: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      
      // Add filters
      if (filters.access_type) params.append('access_type', filters.access_type);
      if (filters.was_allowed) params.append('was_allowed', filters.was_allowed);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API_BASE_URL}/audit/access/?${params}`);
      
      setLogs(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / 8));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching access logs:', error);
      Swal.fire('Error', 'Failed to load access logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({
      access_type: '',
      was_allowed: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const getAccessIcon = (accessType) => {
    switch (accessType) {
      case 'course_view':
        return 'eye-fill text-info';
      case 'lesson_view':
        return 'play-fill text-primary';
      case 'course_enroll':
        return 'plus-circle-fill text-success';
      case 'course_unenroll':
        return 'dash-circle-fill text-danger';
      case 'download_material':
        return 'download text-warning';
      case 'lesson_complete':
        return 'check-circle-fill text-success';
      default:
        return 'question-circle';
    }
  };

  const getAccessLabel = (accessType) => {
    const labels = {
      'course_view': 'Course View',
      'lesson_view': 'Lesson View',
      'course_enroll': 'Course Enrollment',
      'course_unenroll': 'Course Unenrollment',
      'download_material': 'Download Material',
      'lesson_complete': 'Lesson Completed'
    };
    return labels[accessType] || accessType;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPaginationItems = () => {
    const items = [];
    const maxPages = Math.min(totalPages, 5);
    
    for (let i = 1; i <= maxPages; i++) {
      items.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button 
            className="page-link"
            onClick={() => setCurrentPage(i)}
            style={{ cursor: 'pointer' }}
          >
            {i}
          </button>
        </li>
      );
    }
    
    return items;
  };

  return (
    <div className="table-container">
      {/* Filters */}
      <div className="filter-section mb-4">
        <h6 className="mb-3"><i className="bi bi-funnel"></i> Filters</h6>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>Access Type</label>
            <select
              value={filters.access_type}
              onChange={(e) => handleFilterChange('access_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="course_view">Course View</option>
              <option value="lesson_view">Lesson View</option>
              <option value="course_enroll">Course Enrollment</option>
              <option value="course_unenroll">Course Unenrollment</option>
              <option value="download_material">Download Material</option>
              <option value="lesson_complete">Lesson Completed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Access Status</label>
            <select
              value={filters.was_allowed}
              onChange={(e) => handleFilterChange('was_allowed', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Allowed</option>
              <option value="false">Denied</option>
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group d-flex align-items-end gap-2">
            <button
              className="btn btn-primary btn-sm"
              onClick={fetchLogs}
            >
              <i className="bi bi-search"></i> Search
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleResetFilters}
            >
              <i className="bi bi-arrow-counterclockwise"></i> Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <LoadingSpinner size="md" text="Loading access logs..." />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <div className="mb-3 text-muted">
            <small>Showing {logs.length} of {totalCount} access logs</small>
          </div>

          {logs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Access Type</th>
                    <th>Course/Resource</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>IP Address</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <small>{log.user_display || 'Unknown'}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi bi-${getAccessIcon(log.access_type)}`}></i>
                          <small>{getAccessLabel(log.access_type)}</small>
                        </div>
                      </td>
                      <td>
                        <small className="text-truncate" style={{ maxWidth: '200px' }}>
                          {log.course_name || log.lesson_name || 'N/A'}
                        </small>
                      </td>
                      <td>
                        {log.was_allowed ? (
                          <span className="badge bg-success">Allowed</span>
                        ) : (
                          <span className="badge bg-danger">Denied</span>
                        )}
                      </td>
                      <td>
                        <small>
                          {log.duration_seconds 
                            ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s`
                            : '-'
                          }
                        </small>
                      </td>
                      <td>
                        <small className="font-monospace">{log.ip_address || 'N/A'}</small>
                      </td>
                      <td>
                        <small>{formatDate(log.created_at)}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-link btn-sm"
                          onClick={() => showDetails(log)}
                          title="View details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <p>No access logs found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-section">
              <span className="pagination-info">Page {currentPage} of {totalPages}</span>
              <ul className="pagination">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    First
                  </button>
                </li>
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                </li>
                {getPaginationItems()}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button 
                    className="page-link"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Last
                  </button>
                </li>
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const showDetails = (log) => {
  const details = `
    <div style="text-align: left;">
      <p><strong>User:</strong> ${log.user_display || 'Unknown'}</p>
      <p><strong>Access Type:</strong> ${getAccessTypeLabel(log.access_type)}</p>
      <p><strong>Status:</strong> ${log.was_allowed ? '<span style="color: green;">✓ Allowed</span>' : '<span style="color: red;">✗ Denied</span>'}</p>
      ${log.denial_reason ? `<p><strong>Denial Reason:</strong> ${log.denial_reason}</p>` : ''}
      <p><strong>Course:</strong> ${log.course_name || 'N/A'}</p>
      <p><strong>Lesson:</strong> ${log.lesson_name || 'N/A'}</p>
      <p><strong>Duration:</strong> ${log.duration_seconds ? `${Math.floor(log.duration_seconds / 60)}m ${log.duration_seconds % 60}s` : 'N/A'}</p>
      <p><strong>IP Address:</strong> ${log.ip_address || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date(log.created_at).toLocaleString()}</p>
    </div>
  `;

  Swal.fire({
    title: 'Access Log Details',
    html: details,
    icon: log.was_allowed ? 'success' : 'warning',
    confirmButtonText: 'Close',
    width: '600px'
  });
};

const getAccessTypeLabel = (type) => {
  const labels = {
    'course_view': 'Course View',
    'lesson_view': 'Lesson View',
    'course_enroll': 'Course Enrollment',
    'course_unenroll': 'Course Unenrollment',
    'download_material': 'Download Material',
    'lesson_complete': 'Lesson Completed'
  };
  return labels[type] || type;
};

export default AccessLogsTable;
