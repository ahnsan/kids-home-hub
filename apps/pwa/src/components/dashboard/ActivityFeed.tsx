/**
 * ActivityFeed component - Recent transactions and activities
 */

import { type FunctionComponent } from 'preact';
import { Card } from '../common/Card';

export interface Activity {
  id: string;
  type: 'money' | 'points' | 'screen' | 'chore';
  childName: string;
  childAvatar: string;
  description: string;
  amount?: string;
  timestamp: Date;
  icon: string;
}

export interface ActivityFeedProps {
  activities?: Activity[];
  maxItems?: number;
}

const activityColors = {
  money: {
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    icon: 'bg-primary-100'
  },
  points: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'bg-amber-100'
  },
  screen: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'bg-purple-100'
  },
  chore: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'bg-green-100'
  }
};

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export const ActivityFeed: FunctionComponent<ActivityFeedProps> = ({
  activities = [],
  maxItems = 5
}) => {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-gray-900">Recent Activity</h3>
          <p class="text-xs text-surface-500 mt-0.5">Latest family updates</p>
        </div>
        <div class="text-2xl">📊</div>
      </div>

      {displayActivities.length === 0 ? (
        <div class="text-center py-8">
          <div class="w-16 h-16 mx-auto mb-3 bg-surface-50 rounded-full flex items-center justify-center">
            <span class="text-3xl">📭</span>
          </div>
          <p class="text-sm text-surface-500">No recent activity</p>
          <p class="text-xs text-surface-400 mt-1">Activity will appear here as you use the app</p>
        </div>
      ) : (
        <div class="space-y-3">
          {displayActivities.map(activity => {
            const colors = activityColors[activity.type];

            return (
              <div
                key={activity.id}
                class="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors"
              >
                {/* Icon */}
                <div
                  class={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.icon}`}
                >
                  <span class="text-lg">{activity.icon}</span>
                </div>

                {/* Content */}
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <div class="flex items-center gap-2 mt-1">
                        <img
                          src={activity.childAvatar}
                          alt={activity.childName}
                          class="w-4 h-4 rounded-full"
                        />
                        <p class="text-xs text-surface-500">{activity.childName}</p>
                        <span class="text-surface-300">•</span>
                        <p class="text-xs text-surface-400">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                    {activity.amount && (
                      <div class={`text-sm font-semibold ${colors.text} whitespace-nowrap`}>
                        {activity.amount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activities.length > maxItems && (
        <div class="mt-4 pt-4 border-t border-surface-100 text-center">
          <button class="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            View all activity
          </button>
        </div>
      )}
    </Card>
  );
};
