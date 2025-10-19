import React, { useState, useEffect } from 'react';
import { Activity, Users, UserPlus, Edit, Trash2, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ActivitySummary {
  total_users: number;
  total_contacts: number;
  total_changelog_entries: number;
  users_logged_in_today: number;
  contacts_created_today: number;
  contacts_updated_today: number;
  contacts_deleted_today: number;
  most_active_user_today: string;
  most_active_user_today_count: number;
  last_login_time: string | null;
  last_login_user: string | null;
  last_contact_created: string | null;
  last_contact_created_by: string | null;
}

interface ActivityTimelineEntry {
  activity_timestamp: string;
  user_name: string;
  action: string;
  entity: string;
  description: string;
  entity_name: string | null;
}

export const ActivityDashboard: React.FC = () => {
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [timeline, setTimeline] = useState<ActivityTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadActivityData();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadActivityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActivityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load activity summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_system_activity_summary');

      if (summaryError) {
        console.error('Failed to load activity summary:', summaryError);
        setError('Failed to load activity summary');
        return;
      }

      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }

      // Load recent activity timeline
      const { data: timelineData, error: timelineError } = await supabase
        .rpc('get_user_activity_timeline', { p_limit: 10 });

      if (timelineError) {
        console.error('Failed to load activity timeline:', timelineError);
      } else if (timelineData) {
        setTimeline(timelineData);
      }

    } catch (err) {
      console.error('Error loading activity data:', err);
      setError('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create': return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'update': return <Edit className="w-4 h-4 text-blue-600" />;
      case 'delete': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'login': return <Activity className="w-4 h-4 text-purple-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'text-green-800 bg-green-100';
      case 'update': return 'text-blue-800 bg-blue-100';
      case 'delete': return 'text-red-800 bg-red-100';
      case 'login': return 'text-purple-800 bg-purple-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  if (loading && !summary) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <Activity className="w-12 h-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Failed to Load Activity Data</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadActivityData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          System Activity Dashboard
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Users</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{summary.total_users}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Contacts</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-300">{summary.total_contacts}</p>
              </div>
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Logins Today</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{summary.users_logged_in_today}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Today's Activity</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
                  {summary.contacts_created_today + summary.contacts_updated_today + summary.contacts_deleted_today}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Today's Contact Activity */}
      {summary && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Today's Contact Activity</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <UserPlus className="w-6 h-6 text-green-600 mb-1" />
              <span className="text-2xl font-bold text-green-600">{summary.contacts_created_today}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
            </div>
            <div className="flex flex-col items-center">
              <Edit className="w-6 h-6 text-blue-600 mb-1" />
              <span className="text-2xl font-bold text-blue-600">{summary.contacts_updated_today}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Updated</span>
            </div>
            <div className="flex flex-col items-center">
              <Trash2 className="w-6 h-6 text-red-600 mb-1" />
              <span className="text-2xl font-bold text-red-600">{summary.contacts_deleted_today}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Deleted</span>
            </div>
          </div>
        </div>
      )}

      {/* Most Active User */}
      {summary && summary.most_active_user_today !== 'No activity' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Most Active User Today</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {summary.most_active_user_today.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{summary.most_active_user_today}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {summary.most_active_user_today_count} activities
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Timeline */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {timeline.length > 0 ? (
            timeline.map((entry, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">{entry.user_name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(entry.action)}`}>
                      {entry.action}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(entry.activity_timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{entry.description}</p>
                  {entry.entity_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {entry.entity}: {entry.entity_name}
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Last Activity Info */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="font-medium text-gray-900 dark:text-white mb-1">Last Login</p>
            <p className="text-gray-600 dark:text-gray-300">
              {summary.last_login_user || 'No logins'} - {formatTimestamp(summary.last_login_time)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <p className="font-medium text-gray-900 dark:text-white mb-1">Last Contact Created</p>
            <p className="text-gray-600 dark:text-gray-300">
              {summary.last_contact_created_by || 'No contacts'} - {formatTimestamp(summary.last_contact_created)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};