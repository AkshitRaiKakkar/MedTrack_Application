import React, { useState, useEffect, useCallback } from 'react';
import { eventStream, getEvents, getUnreadCounts, markEventsAsRead, markAllEventsAsRead } from '../../services/EventStreamService';
import { useAuth } from '../../context/AuthContext';

const categoryIcons = {
  MAINTENANCE: '🔧',
  EQUIPMENT: '🏥',
  PROCUREMENT: '📦',
  SHIPMENT: '🚚',
  APPROVAL: '✅',
  SLA: '⚠️'
};

const severityColors = {
  INFO: 'text-blue-600 bg-blue-50 border-blue-200',
  WARNING: 'text-amber-600 bg-amber-50 border-amber-200',
  CRITICAL: 'text-red-600 bg-red-50 border-red-200'
};

const ActivityCenter = ({ onClose, onNavigate }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ total: 0, byCategory: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterCategory, setFilterCategory] = useState(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [connected, setConnected] = useState(false);

  const loadEvents = useCallback(async (pageNum = 0, append = false) => {
    try {
      const data = await getEvents({
        category: filterCategory || undefined,
        unreadOnly: showUnreadOnly,
        page: pageNum,
        size: 20
      });
      const newEvents = data.content || [];
      setEvents(prev => append ? [...prev, ...newEvents] : newEvents);
      setHasMore(!data.last);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, [filterCategory, showUnreadOnly]);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const data = await getUnreadCounts();
      setUnreadCounts(data);
    } catch (err) {
      console.error('Failed to load unread counts:', err);
    }
  }, []);

  useEffect(() => {
    loadEvents(0, false);
    loadUnreadCounts();
  }, [loadEvents, loadUnreadCounts]);

  useEffect(() => {
    if (!user?.token) return;

    const unsubEvent = eventStream.onEvent((event) => {
      // Prepend new event to list
      setEvents(prev => [event, ...prev]);
      // Update unread counts
      loadUnreadCounts();
    });

    const unsubConn = eventStream.onConnectionChange((conn) => {
      setConnected(conn);
    });

    // Connect to WebSocket
    eventStream.connect(user.id, user.token);

    return () => {
      unsubEvent();
      unsubConn();
      eventStream.disconnect();
    };
  }, [user, loadUnreadCounts]);

  const handleMarkRead = async (eventIds) => {
    try {
      await markEventsAsRead(eventIds);
      setEvents(prev => prev.map(e => eventIds.includes(e.id) ? { ...e, read: true } : e));
      loadUnreadCounts();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllEventsAsRead(100);
      setEvents(prev => prev.map(e => ({ ...e, read: true })));
      loadUnreadCounts();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadEvents(page + 1, true);
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryLabel = (cat) => {
    return cat.charAt(0) + cat.slice(1).toLowerCase();
  };

  const categories = [
    { value: null, label: 'All' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'EQUIPMENT', label: 'Equipment' },
    { value: 'PROCUREMENT', label: 'Procurement' },
    { value: 'SHIPMENT', label: 'Shipment' },
    { value: 'APPROVAL', label: 'Approval' },
    { value: 'SLA', label: 'SLA' }
  ];

  if (loading && events.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30"
        onClick={() => onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Activity Center</h2>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${connected ? 'text-green-600 bg-green-50' : 'text-gray-500 bg-gray-100'}`}>
              {connected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Live
                </>
              ) : (
                'Offline'
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCounts.total > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mark All Read ({unreadCounts.total})
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => {
                  setFilterCategory(cat.value);
                  loadEvents(0, false);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  filterCategory === cat.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.label}
                {cat.value && unreadCounts.byCategory[cat.value] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                    {unreadCounts.byCategory[cat.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={e => {
                setShowUnreadOnly(e.target.checked);
                loadEvents(0, false);
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Unread only
          </label>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto">
          {events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500">No activity yet</p>
              <p className="text-sm text-gray-400 mt-1">Events will appear here in real-time</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {events.map(event => (
                <div
                  key={event.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!event.read ? 'bg-blue-50/50' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-gray-100">
                      {categoryIcons[event.category] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          {event.detail && (
                            <p className="text-sm text-gray-600 mt-1 truncate">{event.detail}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[event.severity] || severityColors.INFO} flex-shrink-0`}>
                          {event.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100">{getCategoryLabel(event.category)}</span>
                        </span>
                        <span>{formatTime(event.createdAt)}</span>
                        {event.actor && <span>by {event.actor}</span>}
                      </div>
                    </div>
                    {!event.read && (
                      <button
                        onClick={() => handleMarkRead([event.id])}
                        className="flex-shrink-0 p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                        aria-label="Mark as read"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityCenter;