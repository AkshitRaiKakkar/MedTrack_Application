import React, { useState, useEffect } from 'react';
import { listReceivingRecords, recordReceiving } from '../../services/ProcurementService';

const ReceivingScreen = ({ requestId, onNavigate }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    quantityReceived: 1,
    condition: 'GOOD',
    serialNumbers: '',
    warrantyExpiry: '',
    discrepancyNotes: ''
  });
  const [errors, setErrors] = useState({});

  const conditions = [
    { value: 'EXCELLENT', label: 'Excellent - New, unused, perfect condition' },
    { value: 'GOOD', label: 'Good - Functional, minor cosmetic wear' },
    { value: 'DAMAGED', label: 'Damaged - Functional but with issues' },
    { value: 'MISSING', label: 'Missing - Items not received' }
  ];

  useEffect(() => {
    if (requestId) fetchRecords();
  }, [requestId]);

  const fetchRecords = async () => {
    try {
      const data = await listReceivingRecords(requestId);
      setRecords(data || []);
    } catch (err) {
      console.error('Error fetching receiving records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.quantityReceived || formData.quantityReceived < 1) {
      newErrors.quantityReceived = 'Quantity must be at least 1';
    }
    if (!formData.condition) {
      newErrors.condition = 'Condition is required';
    }
    if (formData.warrantyExpiry && isNaN(Date.parse(formData.warrantyExpiry))) {
      newErrors.warrantyExpiry = 'Invalid date format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        quantityReceived: formData.quantityReceived,
        condition: formData.condition,
        serialNumbers: formData.serialNumbers.trim() || null,
        warrantyExpiry: formData.warrantyExpiry || null,
        discrepancyNotes: formData.discrepancyNotes.trim() || null
      };
      await recordReceiving(requestId, payload);
      alert('Receiving recorded successfully!');
      setShowModal(false);
      setFormData({ quantityReceived: 1, condition: 'GOOD', serialNumbers: '', warrantyExpiry: '', discrepancyNotes: '' });
      fetchRecords();
    } catch (err) {
      console.error('Error recording receiving:', err);
      alert('Failed to record receiving. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case 'EXCELLENT': return 'bg-green-100 text-green-800';
      case 'GOOD': return 'bg-blue-100 text-blue-800';
      case 'DAMAGED': return 'bg-amber-100 text-amber-800';
      case 'MISSING': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalReceived = records.reduce((sum, r) => sum + (r.quantityReceived || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Receiving Records</h2>
            <p className="text-sm text-secondary mt-1">Request: {requestId}</p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary card */}
        <div className="bg-card rounded-xl shadow-sm border border-subtle p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-secondary">Total Received</p>
              <p className="text-3xl font-bold text-blue-700">{totalReceived}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-secondary">Records</p>
              <p className="text-3xl font-bold text-green-700">{records.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-secondary">Conditions</p>
              <p className="text-3xl font-bold text-purple-700">
                {new Set(records.map(r => r.condition)).size}
              </p>
            </div>
          </div>
        </div>

        {/* Records table */}
        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden mb-6">
          {records.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No receiving records yet</h3>
              <p className="text-sm text-secondary">Record the first receiving for this request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Qty Received</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Condition</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Serial Numbers</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Warranty Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Discrepancies</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.receivedAt ? new Date(record.receivedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{record.quantityReceived}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(record.condition)}`}>
                          {record.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {record.serialNumbers || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {record.warrantyExpiry ? new Date(record.warrantyExpiry).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {record.discrepancyNotes || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.receivedBy || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add record button */}
        <div className="text-center">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
          >
            + Record New Receiving
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-subtle flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Record Receiving</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    name="quantityReceived"
                    value={formData.quantityReceived}
                    onChange={handleChange}
                    min="1"
                    required
                    className={`w-full px-3 py-2 border rounded-lg ${errors.quantityReceived ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.quantityReceived && <p className="text-red-500 text-xs mt-1">{errors.quantityReceived}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    required
                    className={`w-full px-3 py-2 border rounded-lg ${errors.condition ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    {conditions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serial Numbers (comma-separated)</label>
                  <textarea
                    name="serialNumbers"
                    value={formData.serialNumbers}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SN-001, SN-002, SN-003"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiry</label>
                  <input
                    type="date"
                    name="warrantyExpiry"
                    value={formData.warrantyExpiry}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg ${errors.warrantyExpiry ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                  {errors.warrantyExpiry && <p className="text-red-500 text-xs mt-1">{errors.warrantyExpiry}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discrepancy Notes</label>
                  <textarea
                    name="discrepancyNotes"
                    value={formData.discrepancyNotes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any issues, missing items, damage details..."
                  ></textarea>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Recording...' : 'Record Receiving'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivingScreen;