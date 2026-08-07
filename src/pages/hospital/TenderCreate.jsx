import React, { useState } from 'react';
import { createTender, publishTender } from '../../services/TenderService';

const TenderCreate = ({ onNavigate }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    specifications: '',
    category: '',
    quantity: 1,
    estimatedBudget: '',
    deadline: '',
    invitedSupplierEmails: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [publishAfterCreate, setPublishAfterCreate] = useState(true);
  const [error, setError] = useState('');

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('A tender title is required.');
      return;
    }
    if (!form.deadline) {
      setError('A bid deadline is required.');
      return;
    }
    if (!form.quantity || Number(form.quantity) < 1) {
      setError('Quantity must be at least 1.');
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      specifications: form.specifications.trim() || null,
      category: form.category.trim() || null,
      quantity: Number(form.quantity),
      estimatedBudget: form.estimatedBudget ? Number(form.estimatedBudget) : null,
      deadline: new Date(form.deadline).toISOString(),
      invitedSupplierEmails: form.invitedSupplierEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0)
    };

    setSubmitting(true);
    setError('');
    try {
      const tender = await createTender(payload);
      if (publishAfterCreate) {
        const published = await publishTender(tender.id);
        alert(`Tender ${published.tenderCode} published! Suppliers can now submit bids until ${new Date(published.deadline).toLocaleString()}.`);
      } else {
        alert('Tender saved as draft. Publish it from the tender detail page when ready.');
      }
      onNavigate('tender-detail', tender.id);
    } catch (err) {
      console.error('Error creating tender:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create tender.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white";
  const labelClass = "block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5";

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Publish a Tender</h2>
            <p className="text-sm text-secondary mt-1">
              Publish the requirement, specifications and deadline; invited suppliers will bid.
            </p>
          </div>
          <button
            onClick={() => onNavigate('tenders')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Tenders
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm border border-subtle p-6 space-y-5">
          <div>
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={update('title')}
              placeholder="e.g. MRI Machine 3T — 12-Month Supply Contract"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={update('description')}
              rows={3}
              placeholder="What is being procured and why?"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Specifications</label>
            <textarea
              value={form.specifications}
              onChange={update('specifications')}
              rows={4}
              placeholder="Technical specs, compliance requirements, delivery terms, service level, warranty..."
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <input
                type="text"
                value={form.category}
                onChange={update('category')}
                placeholder="e.g. Imaging"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                min="1"
                value={form.quantity}
                onChange={update('quantity')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Estimated Budget (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.estimatedBudget}
                onChange={update('estimatedBudget')}
                placeholder="e.g. 250000"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bid Deadline *</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={update('deadline')}
              className={inputClass}
            />
            <p className="text-xs text-secondary mt-1">Bids will not be accepted after this time for the first round.</p>
          </div>

          <div>
            <label className={labelClass}>Invited Supplier Emails</label>
            <textarea
              value={form.invitedSupplierEmails}
              onChange={update('invitedSupplierEmails')}
              rows={2}
              placeholder="Comma-separated supplier account emails, e.g. med-supply@vendor.com, devices@vendor2.com"
              className={inputClass}
            />
            <p className="text-xs text-secondary mt-1">Leave empty to open the tender to all registered suppliers.</p>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={publishAfterCreate}
              onChange={(e) => setPublishAfterCreate(e.target.checked)}
              className="rounded border-subtle"
            />
            Publish immediately (suppliers can bid right away)
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : publishAfterCreate ? 'Create & Publish' : 'Save Draft'}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tenders')}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenderCreate;
