import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../LoadingSpinner';
import AuditSummary from './AuditSummary';
import UploadLogsTable from './UploadLogsTable';
import PaymentLogsTable from './PaymentLogsTable';
import AccessLogsTable from './AccessLogsTable';
import MessageLogsTable from './MessageLogsTable';
import ActivityLogsTable from './ActivityLogsTable';
import './AuditLogsDashboard.css';

const AuditLogsDashboard = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch summary data on mount and when tab changes
  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/audit/summary/`);
      if (response.data.bool) {
        setSummaryData(response.data.summary);
      }
    } catch (err) {
      console.error('Error fetching audit summary:', err);
      setError('Failed to load audit summary data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchSummary();
  };

  const handleExport = async (logType) => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/audit/export/${logType}/`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${logType}_logs.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError('Failed to export logs');
    }
  };

  return (
    <div className="audit-logs-dashboard py-4">
      {/* Header */}
      <div className="dashboard-header mb-4">
        {/* Title Row */}
        <div className="row mb-3 mb-md-0">
          <div className="col-12 col-md-6">
            <h2 className="mb-2" style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)' }}>
              <i className="bi bi-shield-check"></i> Audit Logs Dashboard
            </h2>
            <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)' }}>
              Track all user access, file uploads, and payment transactions
            </p>
          </div>
          
          {/* Buttons Row - Desktop */}
          <div className="col-12 col-md-6 d-none d-md-flex justify-content-end align-items-start gap-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn btn-primary"
              title="Refresh audit logs data"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span className="ms-2">Refresh</span>
            </button>
            
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleExport('uploads')}
                title="Download upload logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1">Uploads</span>
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleExport('payments')}
                title="Download payment logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1">Payments</span>
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleExport('access')}
                title="Download access logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1">Access</span>
              </button>
            </div>
          </div>
        </div>

        {/* Buttons Row - Mobile */}
        <div className="row d-md-none">
          <div className="col-12 mb-2">
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="btn btn-primary w-100"
              title="Refresh audit logs data"
            >
              <i className="bi bi-arrow-clockwise"></i>
              <span className="ms-2">Refresh</span>
            </button>
          </div>
          <div className="col-12">
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary btn-sm flex-grow-1"
                onClick={() => handleExport('uploads')}
                title="Download upload logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1 d-none d-sm-inline">Uploads</span>
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm flex-grow-1"
                onClick={() => handleExport('payments')}
                title="Download payment logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1 d-none d-sm-inline">Payments</span>
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm flex-grow-1"
                onClick={() => handleExport('access')}
                title="Download access logs as CSV"
              >
                <i className="bi bi-download"></i>
                <span className="ms-1 d-none d-sm-inline">Access</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-circle"></i> {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <LoadingSpinner size="md" text="Loading audit logs data..." />
        </div>
      )}

      {/* Tabs */}
      {!loading && (
        <div>
          <ul className="nav nav-tabs border-bottom mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
                type="button"
                role="tab"
              >
                <i className="bi bi-graph-up"></i> Summary & Analytics
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'uploads' ? 'active' : ''}`}
                onClick={() => setActiveTab('uploads')}
                type="button"
                role="tab"
              >
                <i className="bi bi-cloud-upload"></i> Upload Logs
                {summaryData && (
                  <span className="badge bg-info ms-2">
                    {summaryData.uploads?.total || 0}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveTab('payments')}
                type="button"
                role="tab"
              >
                <i className="bi bi-credit-card"></i> Payment Logs
                {summaryData && (
                  <span className="badge bg-success ms-2">
                    {summaryData.payments?.total || 0}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'access' ? 'active' : ''}`}
                onClick={() => setActiveTab('access')}
                type="button"
                role="tab"
              >
                <i className="bi bi-door-open"></i> Access Logs
                {summaryData && (
                  <span className="badge bg-warning ms-2">
                    {summaryData.access?.total || 0}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'messages' ? 'active' : ''}`}
                onClick={() => setActiveTab('messages')}
                type="button"
                role="tab"
              >
                <i className="bi bi-chat-dots"></i> Messages
                {summaryData && summaryData.messages && (
                  <span className="badge bg-purple ms-2" style={{ backgroundColor: '#7c3aed' }}>
                    {summaryData.messages.total || 0}
                  </span>
                )}
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button 
                className={`nav-link ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
                type="button"
                role="tab"
              >
                <i className="bi bi-activity"></i> Activity Logs
                {summaryData && summaryData.activity && (
                  <span className="badge bg-secondary ms-2">
                    {summaryData.activity.total || 0}
                  </span>
                )}
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {/* Summary Tab */}
            {activeTab === 'summary' && summaryData && (
              <AuditSummary data={summaryData} />
            )}

            {/* Upload Logs Tab */}
            {activeTab === 'uploads' && (
              <UploadLogsTable key={refreshKey} />
            )}

            {/* Payment Logs Tab */}
            {activeTab === 'payments' && (
              <PaymentLogsTable key={refreshKey} />
            )}

            {/* Access Logs Tab */}
            {activeTab === 'access' && (
              <AccessLogsTable key={refreshKey} />
            )}

            {/* Messages Tab */}
            {activeTab === 'messages' && (
              <MessageLogsTable key={refreshKey} />
            )}

            {/* Activity Logs Tab */}
            {activeTab === 'activity' && (
              <ActivityLogsTable key={refreshKey} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogsDashboard;
