import React, { useState, useEffect } from 'react';
import { createProcurementRequest } from '../../services/ProcurementService';

const ProcurementRequestWizard = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    equipmentCode: '',
    equipmentName: '',
    quantity: 1,
    unitCost: '',
    urgency: 'MEDIUM',
    category: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const urgencies = [
    { value: 'LOW', label: 'Low - Routine replenishment' },
    { value: 'MEDIUM', label: 'Medium - Needed within 2 weeks' },
    { value: 'HIGH', label: 'High - Needed within 1 week' },
    { value: 'CRITICAL', label: 'Critical - Emergency/patient safety' }
  ];

  const categories = [
    { value: 'IMAGING', label: 'Imaging Equipment' },
    { value: 'LABORATORY', label: 'Laboratory & Diagnostics' },
    { value: 'SURGICAL', label: 'Surgical & Operating Room' },
    { value: 'PATIENT_CARE', label: 'Patient Care & Monitoring' },
    { value: 'IT_INFRASTRUCTURE', label: 'IT & Infrastructure' },
    { value: 'FACILITIES', label: 'Facilities & Building Systems' },
    { value: 'OTHER', label: 'Other' }
  ];

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!formData.equipmentCode.trim()) newErrors.equipmentCode = 'Equipment code is required';
      if (!formData.equipmentName.trim()) newErrors.equipmentName = 'Equipment name is required';
      if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
      if (!formData.unitCost || parseFloat(formData.unitCost) < 0) newErrors.unitCost = 'Valid unit cost is required';
    } else if (currentStep === 2) {
      if (!formData.urgency) newErrors.urgency = 'Urgency is required';
      if (!formData.category) newErrors.category = 'Category is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      const payload = {
        equipmentCode: formData.equipmentCode.trim(),
        equipmentName: formData.equipmentName.trim(),
        quantity: formData.quantity,
        unitCost: parseFloat(formData.unitCost),
        urgency: formData.urgency,
        category: formData.category,
        notes: formData.notes.trim() || null
      };
      await createProcurementRequest(payload);
      alert('Procurement request created successfully!');
      onNavigate('dashboard');
    } catch (err) {
      console.error('Error creating request:', err);
      alert('Failed to create request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const totalCost = (formData.quantity || 0) * (parseFloat(formData.unitCost) || 0);

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['Details', 'Approval', 'Review'].map((label, idx) => (
              <div key={label} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > idx + 1 ? 'bg-green-600 text-white' :
                  step === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > idx + 1 ? '✓' : idx + 1}
                </div>
                <span className={`text-xs mt-1 font-medium ${
                  step >= idx + 1 ? 'text-primary' : 'text-secondary'
                }`}>{label}</span>
              </div>
            ))}
            <div className="hidden md:flex flex-1 mx-4">
              <div className="h-1 bg-gray-200 relative overflow-hidden">
                <div className={`h-full bg-blue-600 transition-all duration-300 ${step === 1 ? 'w-0' : step === 2 ? 'w-1/2' : 'w-full'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-subtle p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 1 ? 'Request Details' : step === 2 ? 'Approval Policy' : 'Review & Submit'}
            </h2>
            <p className="text-sm text-secondary mt-1">
              {step === 1 && 'Enter the equipment details and estimated cost'}
              {step === 2 && 'Select urgency and category for approval routing'}
              {step === 3 && 'Review your request before submitting'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Request Details */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Code *</label>
                    <input
                      type="text"
                      name="equipmentCode"
                      value={formData.equipmentCode}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.equipmentCode ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., MRI-3T-001"
                    />
                    {errors.equipmentCode && <p className="text-red-500 text-xs mt-1">{errors.equipmentCode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
                    <input
                      type="text"
                      name="equipmentName"
                      value={formData.equipmentName}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.equipmentName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="e.g., 3T MRI Scanner"
                    />
                    {errors.equipmentName && <p className="text-red-500 text-xs mt-1">{errors.equipmentName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="1"
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.quantity ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Unit Cost *</label>
                    <input
                      type="number"
                      name="unitCost"
                      value={formData.unitCost}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.unitCost ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="0.00"
                    />
                    {errors.unitCost && <p className="text-red-500 text-xs mt-1">{errors.unitCost}</p>}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">Estimated Total Cost</span>
                    <span className="text-2xl font-bold text-blue-700">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-1">Budget will be reserved upon submission</p>
                </div>
              </>
            )}

            {/* Step 2: Approval Policy */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Urgency *</label>
                    <select
                      name="urgency"
                      value={formData.urgency}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.urgency ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {urgencies.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                    </select>
                    {errors.urgency && <p className="text-red-500 text-xs mt-1">{errors.urgency}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg ${errors.category ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Special requirements, delivery instructions, preferred vendors, etc."
                  ></textarea>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Your request will be routed through approval steps based on hospital policy.
                    Requests over $50,000 cannot be self-approved by the requester.
                  </p>
                </div>
              </>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Equipment Details</h4>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <dt className="text-secondary">Code</dt>
                      <dd className="font-medium">{formData.equipmentCode}</dd>
                      <dt className="text-secondary">Name</dt>
                      <dd className="font-medium">{formData.equipmentName}</dd>
                      <dt className="text-secondary">Quantity</dt>
                      <dd className="font-medium">{formData.quantity}</dd>
                      <dt className="text-secondary">Unit Cost</dt>
                      <dd className="font-medium">${parseFloat(formData.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                      <dt className="text-secondary">Total Cost</dt>
                      <dd className="font-bold text-blue-700">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</dd>
                      <dt className="text-secondary">Urgency</dt>
                      <dd className="font-medium capitalize">{formData.urgency.toLowerCase()}</dd>
                      <dt className="text-secondary">Category</dt>
                      <dd className="font-medium capitalize">{formData.category.toLowerCase().replace('_', ' ')}</dd>
                    </dl>
                  </div>

                  {formData.notes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{formData.notes}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      By submitting, you confirm the information is accurate and authorize budget reservation.
                      The request will enter the approval workflow based on configured policies.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-subtle">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcurementRequestWizard;