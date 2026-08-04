import React, { useState, useEffect, useCallback } from 'react';
import { eventStream, getEvents, getUnreadCounts, markEventsAsRead, markAllEventsAsRead } from '../../services/EventStreamService';
import { useAuth } from '../../context/AuthContext';
import { getLocalDemoEvents, saveLocalDemoEvents } from '../../components/hospital/ActivityCenterDemoEvents';
import ActivityCenterEventDetailModal from '../../components/hospital/ActivityCenterEventDetailModal';

const categoryIcons = {
  MAINTENANCE: '🔧',
  EQUIPMENT: '🏥',
  PROCUREMENT: '📦',
  SHIPMENT: '🚚',
  APPROVAL: '✅',
  SLA: '⚠️'
};

const severityColors = {
  INFO: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  WARNING: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  CRITICAL: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
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

  // Selected event for detail modal
  const [selectedEventModal, setSelectedEventModal] = useState(null);

  // Helper to compute local unread stats
  const computeUnreadCounts = (eventList) => {
    const byCategory = {};
    let total = 0;
    eventList.forEach((e) => {
      if (!e.read) {
        total++;
        byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      }
    });
    return { total, byCategory };
  };

  const loadEvents = useCallback(async (pageNum = 0, append = false) => {
    setLoading(true);
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
      console.warn('Backend API unavailable, using local demo event fallback:', err);
      let localList = getLocalDemoEvents();
      if (filterCategory) {
        localList = localList.filter((e) => e.category === filterCategory);
      }
      if (showUnreadOnly) {
        localList = localList.filter((e) => !e.read);
      }
      setEvents(prev => append ? [...prev, ...localList] : localList);
      setHasMore(false);
      setUnreadCounts(computeUnreadCounts(localList));
    } finally {
      setLoading(false);
    }
  }, [filterCategory, showUnreadOnly]);

  const loadUnreadCounts = useCallback(async () => {
    try {
      const data = await getUnreadCounts();
      setUnreadCounts(data);
    } catch (err) {
      const localList = getLocalDemoEvents();
      setUnreadCounts(computeUnreadCounts(localList));
    }
  }, []);

  useEffect(() => {
    loadEvents(0, false);
    loadUnreadCounts();
  }, [loadEvents, loadUnreadCounts]);

  useEffect(() => {
    if (!user?.token) return;

    const unsubEvent = eventStream.onEvent((event) => {
      setEvents(prev => [event, ...prev]);
      loadUnreadCounts();
    });

    const unsubConn = eventStream.onConnectionChange((conn) => {
      setConnected(conn);
    });

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
    } catch (err) {
      console.warn('Backend API unavailable, marking as read locally');
    }
    setEvents(prev => {
      const updated = prev.map(e => eventIds.includes(e.id) ? { ...e, read: true } : e);
      saveLocalDemoEvents(updated);
      setUnreadCounts(computeUnreadCounts(updated));
      return updated;
    });
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllEventsAsRead(100);
    } catch (err) {
      console.warn('Backend API unavailable, marking all read locally');
    }
    setEvents(prev => {
      const updated = prev.map(e => ({ ...e, read: true }));
      saveLocalDemoEvents(updated);
      setUnreadCounts(computeUnreadCounts(updated));
      return updated;
    });
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
    return cat ? cat.charAt(0) + cat.slice(1).toLowerCase() : 'General';
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

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-xs"
        onClick={() => onClose()}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 shadow-xl flex flex-col h-full z-10 border-r border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Activity Center</h2>
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${connected ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {connected ? 'Live WS' : 'Demo / Standalone'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {unreadCounts.total > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Mark All Read ({unreadCounts.total})
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map(cat => (
              <button
                key={cat.value || 'all'}
                onClick={() => {
                  setFilterCategory(cat.value);
                  loadEvents(0, false);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                  filterCategory === cat.value
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat.label}
                {cat.value && unreadCounts.byCategory[cat.value] > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                    {unreadCounts.byCategory[cat.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={e => {
                setShowUnreadOnly(e.target.checked);
                loadEvents(0, false);
              }}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show Unread Only
          </label>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto">
          {loading && events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
              <span className="mt-3 text-xs text-slate-400 font-medium">Fetching real-time telemetry events...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 font-bold">No Activity Events Found</p>
              <p className="text-xs text-slate-400 mt-1">Events will populate automatically as equipment tasks occur.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map(event => (
                <div
                  key={event.id}
                  onClick={() => setSelectedEventModal(event)}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${!event.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {categoryIcons[event.category] || '📌'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                            {event.title}
                            {!event.read && (
                              <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                            )}
                          </h4>
                          {event.detail && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">{event.detail}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${severityColors[event.severity] || severityColors.INFO} flex-shrink-0`}>
                          {event.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {getCategoryLabel(event.category)}
                        </span>
                        <span>{formatTime(event.createdAt)}</span>
                        {event.actor && <span>by {event.actor}</span>}
                      </div>
                    </div>
                    {!event.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead([event.id]);
                        }}
                        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
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
            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Events'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Inspection Modal */}
      {selectedEventModal && (
        <ActivityCenterEventDetailModal
          event={selectedEventModal}
          onClose={() => setSelectedEventModal(null)}
          onMarkAsRead={handleMarkRead}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

export default ActivityCenter;