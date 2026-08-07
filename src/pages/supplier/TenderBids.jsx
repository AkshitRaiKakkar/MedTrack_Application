import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { listTenders, submitTenderBid, withdrawTenderBid } from '../../services/TenderService';

const TenderBids = ({ onNavigate }) => {
  const { user } = useAuth();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  // Bid modal state
  const [bidTender, setBidTender] = useState(null);
  const [bidForm, setBidForm] = useState({ bidAmount: '', leadTimeDays: '', qualityScore: '', deliveryScore: '', notes: '' });

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const data = await listTenders();
      setTenders(data || []);
      setError('');
    } catch (err) {
      console.error('Error fetching tenders:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load tenders.');
    } finally {
      setLoading(false);
    }
  };

  const updateBid = (field) => (e) => setBidForm({ ...bidForm, [field]: e.target.value });

  const openBidModal = (tender) => {
    setBidTender(tender);
    const myBid = (tender.bids || []).find(b => b.status === 'SUBMITTED' && b.supplierEmail === user?.email);
    if (myBid) {
      setBidForm({
        bidAmount: myBid.bidAmount ?? '',
        leadTimeDays: myBid.leadTimeDays ?? '',
        qualityScore: myBid.qualityScore ?? '',
        deliveryScore: myBid.deliveryScore ?? '',
        notes: myBid.notes || ''
      });
    } else {
      setBidForm({ bidAmount: '', leadTimeDays: '', qualityScore: '', deliveryScore: '', notes: '' });
    }
    setError('');
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault();
    if (!bidTender) return;
    if (!bidForm.bidAmount || Number(bidForm.bidAmount) < 0) {
      setError('A valid bid amount is required.');
      return;
    }
    if (!bidForm.leadTimeDays || Number(bidForm.leadTimeDays) < 1) {
      setError('Lead time must be at least 1 day.');
      return;
    }

    setBusy('submit');
    setError('');
    try {
      await submitTenderBid(bidTender.id, {
        bidAmount: Number(bidForm.bidAmount),
        leadTimeDays: Number(bidForm.leadTimeDays),
        qualityScore: bidForm.qualityScore ? Number(bidForm.qualityScore) : null,
        deliveryScore: bidForm.deliveryScore ? Number(bidForm.deliveryScore) : null,
        notes: bidForm.notes.trim() || null
      });
      alert(`Bid submitted for "${bidTender.title}"!`);
      setBidTender(null);
      await fetchTenders();
    } catch (err) {
      console.error('Error submitting bid:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit bid.');
    } finally {
      setBusy(null);
    }
  };

  const handleWithdraw = async (tender, bidId) => {
    if (!window.confirm('Withdraw this bid? You can submit a new bid while the round is still open.')) return;
    setBusy(`withdraw-${bidId}`);
    try {
      await withdrawTenderBid(tender.id, bidId);
      await fetchTenders();
    } catch (err) {
      console.error('Error withdrawing bid:', err);
      setError(err.response?.data?.message || err.message || 'Failed to withdraw bid.');
    } finally {
      setBusy(null);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      'OPEN': 'bg-green-100 text-green-800',
      'CLOSED': 'bg-amber-100 text-amber-800',
      'AWARDED': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getBidStatusBadge = (status) => {
    const colors = {
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'WITHDRAWN': 'bg-gray-100 text-gray-600',
      'ACCEPTED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  const myBidsFor = (tender) => (tender.bids || []).filter(b => b.supplierEmail === user?.email);
  const biddingOpen = (tender) => tender.status === 'OPEN' && tender.biddingOpen;

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Open Tenders</h2>
            <p className="text-sm text-secondary mt-1">
              Tenders your supplier account is invited to. Submit bids before the deadline.
            </p>
          </div>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        {tenders.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm border border-subtle p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1m4 0h1M9 13h1m4 0h1M9 17h1m4 0h1" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-1">No open tenders</h3>
            <p className="text-sm text-secondary">
              You will see tenders here once a hospital invites your supplier account.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tenders.map(tender => {
              const myBids = myBidsFor(tender);
              const liveBid = myBids.find(b => b.status === 'SUBMITTED');
              const won = myBids.find(b => b.status === 'ACCEPTED');
              return (
                <div key={tender.id} className="bg-card rounded-xl shadow-sm border border-subtle p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-[240px]">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-800">{tender.title}</h3>
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tender.status)}`}>
                          {tender.status}
                        </span>
                      </div>
                      <p className="text-xs text-secondary mt-0.5">{tender.tenderCode} · Round {tender.currentRound}</p>
                      {tender.description && (
                        <p className="text-sm text-gray-600 mt-2">{tender.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-secondary uppercase tracking-wider font-semibold">Deadline</p>
                      <p className={`text-sm font-semibold ${biddingOpen(tender) ? 'text-green-700' : 'text-gray-600'}`}>
                        {formatDate(tender.deadline)}
                      </p>
                      <p className="text-xs text-secondary mt-1">
                        Est. budget: <span className="font-semibold text-gray-800">{formatCurrency(tender.estimatedBudget)}</span>
                      </p>
                    </div>
                  </div>

                  {tender.specifications && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-3 border border-subtle/50">
                      <p className="text-xs text-secondary uppercase tracking-wider font-semibold mb-1">Specifications</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{tender.specifications}</p>
                    </div>
                  )}

                  {/* My bids for this tender */}
                  {myBids.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-secondary uppercase tracking-wider font-semibold mb-2">Your bids</p>
                      <div className="space-y-2">
                        {myBids.map(bid => (
                          <div key={bid.id} className="flex items-center justify-between gap-3 bg-blue-50/60 rounded-lg p-3 flex-wrap">
                            <div className="flex items-center gap-3 flex-wrap text-sm">
                              <span className="font-semibold text-gray-800">{formatCurrency(bid.bidAmount)}</span>
                              <span className="text-secondary">R{bid.roundNumber}</span>
                              <span className="text-secondary">{bid.leadTimeDays != null ? `${bid.leadTimeDays}d` : '—'} lead time</span>
                              {bid.qualityScore != null && <span className="text-secondary">Quality {bid.qualityScore}</span>}
                              {bid.deliveryScore != null && <span className="text-secondary">Delivery {bid.deliveryScore}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getBidStatusBadge(bid.status)}`}>
                                {bid.status}
                              </span>
                              {bid.status === 'SUBMITTED' && biddingOpen(tender) && (
                                <button
                                  onClick={() => handleWithdraw(tender, bid.id)}
                                  disabled={busy === `withdraw-${bid.id}`}
                                  className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                                >
                                  Withdraw
                                </button>
                              )}
                              {bid.status === 'ACCEPTED' && (
                                <span className="inline-flex px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">🏆 You won</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {won && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                      Congratulations — your bid was accepted for this tender!
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    {biddingOpen(tender) ? (
                      <button
                        onClick={() => openBidModal(tender)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${liveBid ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                      >
                        {liveBid ? 'Update Bid' : 'Submit Bid'}
                      </button>
                    ) : (
                      <span className="text-xs text-secondary font-medium">
                        {tender.status === 'OPEN' ? 'Bidding closed for this round' : 'Bidding not open'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bid modal */}
      {bidTender && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Submit Bid</h3>
            <p className="text-sm text-secondary mb-1">
              {bidTender.title} — Round {bidTender.currentRound}
            </p>
            <p className="text-xs text-secondary mb-4">
              Deadline: {formatDate(bidTender.deadline)}. You can withdraw and resubmit while the round is open.
            </p>
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Bid Amount (USD) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bidForm.bidAmount}
                    onChange={updateBid('bidAmount')}
                    className="w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Lead Time (days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={bidForm.leadTimeDays}
                    onChange={updateBid('leadTimeDays')}
                    className="w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Quality Score (0–100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bidForm.qualityScore}
                    onChange={updateBid('qualityScore')}
                    className="w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Delivery Score (0–100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bidForm.deliveryScore}
                    onChange={updateBid('deliveryScore')}
                    className="w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  value={bidForm.notes}
                  onChange={updateBid('notes')}
                  rows={3}
                  placeholder="Compliance details, warranty, service inclusions..."
                  className="w-full px-3 py-2 border border-subtle rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-200 bg-white"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setBidTender(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy === 'submit'}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {busy === 'submit' ? 'Submitting...' : 'Submit Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderBids;
