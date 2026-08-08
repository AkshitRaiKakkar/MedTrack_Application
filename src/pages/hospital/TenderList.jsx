import React, { useState, useEffect } from 'react';
import { listTenders } from '../../services/TenderService';

const TenderList = ({ onNavigate }) => {
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const data = await listTenders();
      setTenders(data || []);
    } catch (err) {
      console.error('Error fetching tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'OPEN': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-amber-100 text-amber-800',
      'AWARDED': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Tenders &amp; E-Auction</h2>
            <p className="text-sm text-secondary mt-1">
              Publish requirements, run multi-round bidding, compare bids and award winners.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('tender-create')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Publish Tender
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
          {tenders.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No tenders yet</h3>
              <p className="text-sm text-secondary mb-6">
                Publish your first requirement to invite suppliers and compare bids competitively.
              </p>
              <button
                onClick={() => onNavigate('tender-create')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Publish a Tender
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Tender</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Est. Budget</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Round</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Deadline</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {tenders.map(tender => (
                    <tr key={tender.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{tender.title}</div>
                        <div className="text-xs text-secondary">{tender.tenderCode}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 capitalize">
                        {tender.category || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatCurrency(tender.estimatedBudget)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {tender.currentRound}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(tender.deadline)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tender.status)}`}>
                          {tender.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigate('tender-detail', tender.id)}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {tenders.length > 0 && (
          <div className="mt-6 bg-card rounded-xl shadow-sm border border-subtle p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">How tenders work</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-secondary">
              <li>Publish a requirement with specifications, estimated budget and a bid deadline.</li>
              <li>Invited suppliers submit bids (price, lead time, quality score, delivery score).</li>
              <li>Close the round, compare bids side by side, or open a second round for better terms.</li>
              <li>Award the winner with a recorded reason - every step is kept in the audit log.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenderList;
