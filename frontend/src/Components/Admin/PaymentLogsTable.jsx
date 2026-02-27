import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import Swal from 'sweetalert2';

const PaymentLogsTable = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    payment_type: '',
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
      if (filters.payment_type) params.append('payment_type', filters.payment_type);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);

      const response = await axios.get(`${API_BASE_URL}/audit/payments/?${params}`);
      
      setLogs(response.data.results || []);
      setTotalCount(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / 8));
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      Swal.fire('Error', 'Failed to load payment logs', 'error');
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
      payment_type: '',
      status: '',
      search: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'failed':
        return 'status-failed';
      case 'pending':
        return 'status-pending';
      case 'refunded':
        return 'status-refunded';
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
            <label>Payment Type</label>
            <select
              value={filters.payment_type}
              onChange={(e) => handleFilterChange('payment_type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="subscription_purchase">Subscription Purchase</option>
              <option value="plan_upgrade">Plan Upgrade</option>
              <option value="plan_downgrade">Plan Downgrade</option>
              <option value="renewal">Renewal</option>
              <option value="refund">Refund</option>
              <option value="failed_attempt">Failed Attempt</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
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
            <label>Search Transaction ID</label>
            <input
              type="text"
              placeholder="Search by transaction ID..."
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
          <LoadingSpinner size="md" text="Loading payment logs..." />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <div className="mb-3 text-muted">
            <small>Showing {logs.length} of {totalCount} payments</small>
          </div>

          {logs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Student</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <small className="font-monospace text-truncate" style={{ maxWidth: '150px' }}>
                          {log.transaction_id}
                        </small>
                      </td>
                      <td>
                        <small>{log.student_name}</small>
                      </td>
                      <td>
                        <small>{log.subscription_plan_name || 'N/A'}</small>
                      </td>
                      <td>
                        <strong>${typeof log.final_amount === 'number' ? log.final_amount.toFixed(2) : parseFloat(log.final_amount || 0).toFixed(2)}</strong>
                      </td>
                      <td>
                        <small className="text-capitalize text-muted">
                          {log.payment_type?.replace('_', ' ')}
                        </small>
                      </td>
                      <td>
                        <small className="text-capitalize">
                          {log.payment_method || 'N/A'}
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
              <p>No payment logs found</p>
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

const getPaymentIcon = (status) => {
  switch (status) {
    case 'completed':
      return 'check-circle-fill text-success';
    case 'failed':
      return 'x-circle-fill text-danger';
    case 'pending':
      return 'clock-fill text-warning';
    case 'refunded':
      return 'arrow-repeat text-info';
    default:
      return 'question-circle';
  }
};

const formatAmount = (amount) => {
  if (typeof amount === 'number') return amount.toFixed(2);
  return parseFloat(amount || 0).toFixed(2);
};

const showDetails = (log) => {
  const details = `
    <div style="text-align: left;">
      <p><strong>Transaction ID:</strong> <code>${log.transaction_id}</code></p>
      <p><strong>Student:</strong> ${log.student_name}</p>
      <p><strong>Plan:</strong> ${log.subscription_plan_name || 'N/A'}</p>
      <p><strong>Payment Type:</strong> ${log.payment_type?.replace('_', ' ')}</p>
      <p><strong>Status:</strong> ${log.status}</p>
      <p><strong>Amount:</strong> $$${formatAmount(log.final_amount)}</p>
      <p><strong>Tax:</strong> $$${formatAmount(log.tax_amount)}</p>
      <p><strong>Discount:</strong> $$${formatAmount(log.discount_amount)}</p>
      <p><strong>Payment Method:</strong> ${log.payment_method || 'N/A'}</p>
      <p><strong>Email:</strong> ${log.user_email || 'N/A'}</p>
      <p><strong>IP Address:</strong> ${log.user_ip_address || 'N/A'}</p>
      <p><strong>Processed At:</strong> ${new Date(log.created_at).toLocaleString()}</p>
      <p><strong>Completed At:</strong> ${log.completed_at ? new Date(log.completed_at).toLocaleString() : 'N/A'}</p>
      ${log.receipt_url ? `<p><strong><a href="${log.receipt_url}" target="_blank">View Receipt</a></strong></p>` : ''}
      ${log.invoice_number ? `<p><strong>Invoice:</strong> ${log.invoice_number}</p>` : ''}
      ${log.error_message ? `<p><strong>Error:</strong> ${log.error_message}</p>` : ''}
      ${log.error_code ? `<p><strong>Error Code:</strong> ${log.error_code}</p>` : ''}
    </div>
  `;

  Swal.fire({
    title: 'Payment Log Details',
    html: details,
    icon: getPaymentIcon(log.status).includes('success') ? 'success' : 'info',
    confirmButtonText: 'Close',
    width: '600px'
  });
};

export default PaymentLogsTable;
