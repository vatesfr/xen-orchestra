import _ from 'intl'
import cookies from 'cookies-js'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { subscribeNotifications } from 'xo'
import { addSubscriptions } from 'utils'
import { filter } from 'lodash'

const COLUMNS = [
  {
    default: true,
    name: _('date'),
    itemRenderer: ({ created, level }) => (
      <span>
        <Icon icon={level === 'warning' ? 'info' : 'alarm'} />{' '}
        <FormattedDate
          value={new Date(created)}
          month='long'
          day='numeric'
          year='numeric'
          hour='2-digit'
          minute='2-digit'
          second='2-digit'
        />
      </span>
    ),
    sortCriteria: 'created',
    sortOrder: 'desc',
  },
  {
    name: '',
    itemRenderer: ({ id, dismissed }) =>
      !dismissed && (
        <strong className='text-success'>{_('notificationNew')}</strong>
      ),
  },
]

const Notifications = decorate([
  addSubscriptions({
    notifications: subscribeNotifications,
  }),
  provideState({
    effects: {
      showMessage: (effects, notification) => () => {
        cookies.set(`notification:${notification.id}`, 'dismissed')
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
        filter(notifications, { dismissed: false }).length,
    },
  }),
  injectState,
  ({ state }) =>
    state.newNotifications > 0 ? (
      <span className='tag tag-pill tag-warning'>{state.newNotifications}</span>
    ) : null,
])
