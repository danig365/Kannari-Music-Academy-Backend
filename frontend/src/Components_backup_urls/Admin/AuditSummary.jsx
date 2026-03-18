import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const AuditSummary = ({ data }) => {
  if (!data) return null;

  const { uploads, payments, access } = data;

  // Payment status distribution chart
  const paymentStatusChart = {
    labels: ['Completed', 'Failed', 'Pending', 'Refunded'],
    datasets: [
      {
        label: 'Payments',
        data: [
          payments?.completed || 0,
          payments?.failed || 0,
          payments?.pending || 0,
          payments?.refunded || 0
        ],
        backgroundColor: [
          '#28a745',
          '#dc3545',
          '#ffc107',
          '#17a2b8'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  // Upload status distribution
  const uploadStatusChart = {
    labels: ['Successful', 'Failed', 'Pending'],
    datasets: [
      {
        label: 'Uploads',
        data: [
          uploads?.successful || 0,
          uploads?.failed || 0,
          (uploads?.total || 0) - (uploads?.successful || 0) - (uploads?.failed || 0)
        ],
        backgroundColor: [
          '#28a745',
          '#dc3545',
          '#ffc107'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  // Payment types distribution
  const paymentTypeData = payments?.by_type || [];
  const paymentTypeChart = {
    labels: paymentTypeData.map(item => item.payment_type?.replace('_', ' ') || 'Other'),
    datasets: [
      {
        label: 'Count',
        data: paymentTypeData.map(item => item.count),
        backgroundColor: [
          '#0d6efd',
          '#6c757d',
          '#198754',
          '#dc3545',
          '#fd7e14',
          '#20c997'
        ],
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  // Access denial reasons
  const denialReasons = access?.denial_reasons || [];

  return (
    <div className="audit-summary">
      {/* Key Metrics Row */}
      <div className="summary-cards mb-4">
        {/* Uploads Metrics */}
        <div>
          <div className="card summary-card success">
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-cloud-upload summary-card-icon"></i>
              <div>
                <div className="summary-card-label">Total Uploads</div>
                <div className="summary-card-value">{uploads?.total || 0}</div>
                <div className="summary-card-subtext">
                  Success rate: {(uploads?.success_rate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card summary-card">
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-check-circle summary-card-icon" style={{ color: '#28a745' }}></i>
              <div>
                <div className="summary-card-label">Successful</div>
                <div className="summary-card-value">{uploads?.successful || 0}</div>
                <div className="summary-card-subtext">
                  Last 7 days: {uploads?.recent_7_days || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card summary-card danger">
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-exclamation-circle summary-card-icon" style={{ color: '#dc3545' }}></i>
              <div>
                <div className="summary-card-label">Failed</div>
                <div className="summary-card-value">{uploads?.failed || 0}</div>
                <div className="summary-card-subtext">
                  Need attention
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payments Metrics */}
        <div>
          <div className="card summary-card" style={{ borderTopColor: '#28a745', borderTopWidth: '4px' }}>
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-credit-card summary-card-icon" style={{ color: '#28a745' }}></i>
              <div>
                <div className="summary-card-label">Total Revenue</div>
                <div className="summary-card-value">${(payments?.total_revenue || 0).toLocaleString()}</div>
                <div className="summary-card-subtext">
                  Completed: {payments?.completed || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Success Rate */}
        <div>
          <div className="card summary-card" style={{ borderTopColor: '#0d6efd', borderTopWidth: '4px' }}>
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-percent summary-card-icon"></i>
              <div>
                <div className="summary-card-label">Success Rate</div>
                <div className="summary-card-value">{(payments?.success_rate || 0).toFixed(1)}%</div>
                <div className="summary-card-subtext">
                  Failed: {payments?.failed || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Metrics */}
        <div>
          <div className="card summary-card" style={{ borderTopColor: '#17a2b8', borderTopWidth: '4px' }}>
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-door-open summary-card-icon" style={{ color: '#17a2b8' }}></i>
              <div>
                <div className="summary-card-label">Total Access</div>
                <div className="summary-card-value">{access?.total || 0}</div>
                <div className="summary-card-subtext">
                  Last 7 days: {access?.recent_7_days || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card summary-card" style={{ borderTopColor: '#28a745', borderTopWidth: '4px' }}>
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-check summary-card-icon" style={{ color: '#28a745' }}></i>
              <div>
                <div className="summary-card-label">Access Allowed</div>
                <div className="summary-card-value">{access?.allowed || 0}</div>
                <div className="summary-card-subtext">
                  Rate: {(access?.allow_rate || 0).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card summary-card danger">
            <div className="d-flex flex-column align-items-center p-3">
              <i className="bi bi-ban summary-card-icon" style={{ color: '#dc3545' }}></i>
              <div>
                <div className="summary-card-label">Access Denied</div>
                <div className="summary-card-value">{access?.denied || 0}</div>
                <div className="summary-card-subtext">
                  Rate: {(100 - (access?.allow_rate || 0)).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid mb-4">
        <div>
          <div className="card chart-section">
            <div className="card-body">
              <h5>Payment Status Distribution</h5>
              <Pie 
                data={paymentStatusChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="card chart-section">
            <div className="card-body">
              <h5>Upload Status Distribution</h5>
              <Pie 
                data={uploadStatusChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Details Row */}
      <div className="details-grid mb-4">
        <div className="chart-col-large">
          <div className="card chart-section">
            <div className="card-body">
              <h5>Payment Types</h5>
              <Bar 
                data={paymentTypeChart}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Count'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        <div className="chart-col-small">
          <div className="card chart-section">
            <div className="card-body">
              <h5>Access Denial Reasons</h5>
              {denialReasons.length > 0 ? (
                <div className="denial-reasons-list">
                  {denialReasons.map((reason, index) => (
                    <div key={index} className="denial-reason-item mb-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-truncate" title={reason.denial_reason}>
                          {reason.denial_reason || 'Unknown'}
                        </span>
                        <span className="badge bg-danger">{reason.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center mb-0">No denials recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Row */}
      {payments?.by_method && payments.by_method.length > 0 && (
        <div className="detail-full mb-4">
          <div className="card chart-section">
            <div className="card-body">
              <h5>Payment Methods</h5>
              <div className="methods-grid">
                {payments.by_method.map((method, index) => (
                  <div key={index} className="payment-method-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-capitalize">{method.payment_method}</span>
                      <strong>{method.count}</strong>
                    </div>
                    <small className="text-muted">
                      {((method.count / (payments?.total || 1)) * 100).toFixed(1)}%
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Types Row */}
      {uploads?.by_type && uploads.by_type.length > 0 && (
        <div className="detail-full">
          <div className="card chart-section">
            <div className="card-body">
              <h5>Upload Types</h5>
              <div className="types-grid">
                {uploads.by_type.map((type, index) => (
                  <div key={index} className="upload-type-card p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-capitalize">{type.upload_type?.replace('_', ' ')}</span>
                      <strong>{type.count}</strong>
                    </div>
                    <small className="text-muted">
                      {((type.count / (uploads?.total || 1)) * 100).toFixed(1)}%
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditSummary;
