import _ from 'intl'
import classNames from 'classnames'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { subscribeNotifications, dismissNotification } from 'xo'
import { addSubscriptions } from 'utils'
import { filter, some } from 'lodash'

const COLUMNS = [
  {
    name: '',
    itemRenderer: ({ level }) =>
      level === 'warning' && <Icon icon='alarm' color='text-danger' />,
  },
  {
    default: true,
    name: _('date'),
    itemRenderer: ({ created }) => (
      <FormattedDate
        value={new Date(created)}
        month='long'
        day='numeric'
        year='numeric'
        hour='2-digit'
        minute='2-digit'
        second='2-digit'
      />
    ),
    sortCriteria: 'created',
    sortOrder: 'desc',
  },
  {
    name: '',
    itemRenderer: ({ id, read }) =>
      !read && <strong className='text-success'>{_('notificationNew')}</strong>,
  },
]

const Notifications = decorate([
  addSubscriptions({
    notifications: subscribeNotifications,
  }),
  provideState({
    effects: {
      showMessage: (effects, notification) => () => {
        dismissNotification(notification.id)
        return alert(
          <span>
            <Icon icon='notification' /> {_('notification')}
          </span>,
          <div
            dangerouslySetInnerHTML={{ __html: marked(notification.message) }}
          />
        ).then(subscribeNotifications.forceRefresh)
      },
    },
  }),
  injectState,
  ({ notifications, effects }) => (
    <SortedTable
      columns={COLUMNS}
      collection={notifications || []}
      rowAction={effects.showMessage}
      stateUrlParam='s'
    />
  ),
])
export { Notifications as default }

export const NotificationTag = decorate([
  addSubscriptions({
    notifications: subscribeNotifications,
  }),
  provideState({
    computed: {
      newNotifications: (_, { notifications }) =>
        filter(notifications, { read: false }).length,
      someWarningNotifications: (_, { notifications }) =>
        console.log('notifications', notifications) ||
        some(notifications, { level: 'warning', read: false }),
    },
  }),
  injectState,
  ({ state }) =>
    state.newNotifications > 0 ? (
      <span
        className={classNames(
          'tag',
          'tag-pill',
          state.someWarningNotifications ? 'tag-danger' : 'tag-warning'
        )}
      >
        {state.newNotifications}
      </span>
    ) : null,
])
