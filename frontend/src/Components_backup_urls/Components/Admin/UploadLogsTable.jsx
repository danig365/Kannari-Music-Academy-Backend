import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import Swal from 'sweetalert2';

const UploadLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    upload_type: '',
    status: '',
    search: '',
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
      if (filters.upload_type) params.append('upload_type', filters.upload_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API_BASE_URL}/audit/uploads/?${params}`);
      
      setLogs(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / 8));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching upload logs:', error);
      Swal.fire('Error', 'Failed to load upload logs', 'error');
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
      upload_type: '',
      status: '',
      search: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
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
            <label>Upload Type</label>
            <select
              value={filters.upload_type}
              onChange={(e) => handleFilterChange('upload_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="lesson_content">Lesson Content</option>
              <option value="student_submission">Student Submission</option>
              <option value="profile_image">Profile Image</option>
              <option value="course_image">Course Image</option>
              <option value="study_material">Study Material</option>
              <option value="downloadable_resource">Downloadable Resource</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
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
          <div className="filter-group">
            <label>Search File Name</label>
            <input
              type="text"
              placeholder="Search by file name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

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
          <LoadingSpinner size="md" text="Loading upload logs..." />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <div className="mb-3 text-muted">
            <small>Showing {logs.length} of {totalCount} uploads</small>
          </div>

          {logs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>File Name</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploader</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Uploaded At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          <i className={`bi bi-${getFileIcon(log.file_type)}`}></i> {log.file_name}
                        </div>
                      </td>
                      <td>
                        <small className="text-muted">{log.file_type}</small>
                      </td>
                      <td>{log.file_size_display}</td>
                      <td>
                        <small>{log.user_display}</small>
                      </td>
                      <td>
                        <small className="text-capitalize text-muted">
                          {log.upload_type?.replace('_', ' ')}
                        </small>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
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
              <p>No upload logs found</p>
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

const getFileIcon = (fileType) => {
  if (!fileType) return 'file';
  
  const type = fileType.toLowerCase();
  if (['mp4', 'webm', 'mov', 'avi'].includes(type)) return 'play-circle';
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(type)) return 'music-note';
  if (type === 'pdf') return 'file-pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type)) return 'image';
  return 'file';
};

const showDetails = (log) => {
  const details = `
    <div style="text-align: left;">
      <p><strong>File Name:</strong> ${log.file_name}</p>
      <p><strong>File Type:</strong> ${log.file_type}</p>
      <p><strong>File Size:</strong> ${log.file_size_display}</p>
      <p><strong>Upload Type:</strong> ${log.upload_type?.replace('_', ' ')}</p>
      <p><strong>Uploader:</strong> ${log.user_display}</p>
      <p><strong>Status:</strong> ${log.status}</p>
      <p><strong>Uploaded At:</strong> ${new Date(log.created_at).toLocaleString()}</p>
      <p><strong>Completed At:</strong> ${log.completed_at ? new Date(log.completed_at).toLocaleString() : 'N/A'}</p>
      <p><strong>IP Address:</strong> ${log.ip_address || 'N/A'}</p>
      ${log.error_message ? `<p><strong>Error:</strong> ${log.error_message}</p>` : ''}
      ${log.file_path ? `<p><strong>Path:</strong> ${log.file_path}</p>` : ''}
    </div>
  `;

  Swal.fire({
    title: 'Upload Log Details',
    html: details,
    icon: 'info',
    confirmButtonText: 'Close'
  });
};

export default UploadLogsTable;
