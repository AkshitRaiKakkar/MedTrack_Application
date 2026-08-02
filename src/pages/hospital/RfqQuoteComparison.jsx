import React, { useState, useEffect } from 'react';
import { listQuotesForRequest, acceptQuote } from '../../services/ProcurementService';

const RfqQuoteComparison = ({ requestId, onNavigate }) => {
  const [quotes, setQuotes] = useState([]);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);

  useEffect(() => {
    if (requestId) {
      fetchData();
    }
  }, [requestId]);

  const fetchData = async () => {
    try {
      const [quotesData, requestData] = await Promise.all([
        listQuotesForRequest(requestId),
        // We'll get request from quotes or separate call
      ]);
      setQuotes(quotesData || []);
    } catch (err) {
      console.error('Error fetching quotes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (quoteId) => {
    if (!window.confirm('Accept this quote and create purchase order? Other quotes will be rejected.')) return;

    setAccepting(quoteId);
    try {
      await acceptQuote(requestId, quoteId);
      alert('Quote accepted and purchase order created!');
      onNavigate('dashboard');
    } catch (err) {
      console.error('Error accepting quote:', err);
      alert('Failed to accept quote. Please try again.');
    } finally {
      setAccepting(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (val) => {
    if (!val) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
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
            <h2 className="text-2xl font-bold text-gray-800">Quote Comparison</h2>
            <p className="text-sm text-secondary mt-1">Request: {requestId}</p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-subtle overflow-hidden">
          {quotes.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-800 mb-1">No quotes received yet</h3>
              <p className="text-sm text-secondary">Suppliers have not submitted quotes for this request.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Supplier</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Quote Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Lead Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Warranty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-secondary uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {quotes.map(quote => (
                    <tr key={quote.id} className={`hover:bg-gray-50 ${quote.status === 'ACCEPTED' ? 'bg-green-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{quote.supplierName}</div>
                        <div className="text-xs text-secondary">{quote.supplierEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {formatCurrency(quote.quoteAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {quote.leadTimeDays} day{quote.leadTimeDays !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {quote.warrantyMonths} month{quote.warrantyMonths !== 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(quote.status)}`}>
                          {quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {quote.submittedAt ? new Date(quote.submittedAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {quote.notes || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {quote.status === 'PENDING' ? (
                          <button
                            onClick={() => handleAccept(quote.id)}
                            disabled={accepting === quote.id}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                          >
                            {accepting === quote.id ? 'Accepting...' : 'Accept'}
                          </button>
                        ) : quote.status === 'ACCEPTED' ? (
                          <span className="inline-flex px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                            ✓ Accepted
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                            Not Selected
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick comparison summary */}
        {quotes.length > 1 && quotes.some(q => q.status === 'PENDING') && (
          <div className="mt-6 bg-card rounded-xl shadow-sm border border-subtle p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-secondary">Lowest Price</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(Math.min(...quotes.filter(q => q.status === 'PENDING').map(q => q.quoteAmount)))}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-secondary">Fastest Delivery</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.min(...quotes.filter(q => q.status === 'PENDING').map(q => q.leadTimeDays))} days
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-secondary">Longest Warranty</p>
                <p className="text-2xl font-bold text-blue-700">
                  {Math.max(...quotes.filter(q => q.status === 'PENDING').map(q => q.warrantyMonths))} months
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RfqQuoteComparison;