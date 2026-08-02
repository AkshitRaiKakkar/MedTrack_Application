import React, { useState, useEffect } from 'react';
import { getApprovalInbox, decideApprovalStep } from '../../services/ProcurementService';

const ApprovalInbox = ({ onNavigate }) => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);

  useEffect(() => {
    fetchInbox();
  }, []);

  const fetchInbox = async () => {
    try {
      const data = await getApprovalInbox();
      setSteps(data || []);
    } catch (err) {
      console.error('Error fetching approval inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (stepId, approve) => {
    const comment = prompt(approve ? 'Approval comment (optional):' : 'Rejection reason (required):');
    if (!approve && (!comment || !comment.trim())) {
      alert('Rejection reason is required');
      return;
    }

    setDeciding(stepId);
    try {
      await decideApprovalStep(stepId, approve, comment || '');
      alert(approve ? 'Step approved successfully!' : 'Step rejected');
      fetchInbox();
    } catch (err) {
      console.error('Error deciding step:', err);
      alert('Failed to record decision. Please try again.');
    } finally {
      setDeciding(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-amber-100 text-amber-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Approval Inbox</h2>
          <p className="text-sm text-secondary mt-1">Review and decide on pending approval steps assigned to you</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
          {steps.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No pending approvals</h3>
              <p className="text-sm text-secondary">You have no approval steps awaiting your decision.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Request</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Equipment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Requester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Urgency</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Step</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Due</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {steps.map(step => (
                    <tr key={step.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.requestCode || `REQ-${step.id}`}</div>
                        <div className="text-xs text-secondary">{step.status}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.equipmentName}</div>
                        <div className="text-xs text-secondary">Qty: {step.quantity} × ${step.unitCost}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{step.requesterName}</div>
                        <div className="text-xs text-secondary">{step.requesterEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(step.urgency)}`}>
                          {step.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-800">Group {step.stepGroup}</div>
                        <div className="text-xs text-secondary">{step.approverRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                          {step.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {step.approvalDueAt ? new Date(step.approvalDueAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {step.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDecision(step.id, true)}
                              disabled={deciding === step.id}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDecision(step.id, false)}
                              disabled={deciding === step.id}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-secondary">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalInbox;