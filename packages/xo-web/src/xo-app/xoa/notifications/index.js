import _ from 'intl'
import classNames from 'classnames'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { addSubscriptions } from 'utils'
import { alert } from 'modal'
import { reportBug } from 'report-bug-button'
import { filter, some } from 'lodash'
import { FormattedDate } from 'react-intl'
import { injectState, provideState } from 'reaclette'
import { subscribeNotifications, dismissNotification } from 'xo'

const COLUMNS = [
  {
    name: '',
    itemRenderer: ({ level }) => level === 'warning' && <Icon icon='alarm' color='text-danger' />,
    sortCriteria: 'level',
  },
  {
    default: true,
    name: _('date'),
    itemRenderer: ({ created, read }) => {
      const Tag = read ? 'span' : 'strong'
      return (
        <Tag>
          <FormattedDate
            value={new Date(created)}
            month='long'
            day='numeric'
            year='numeric'
            hour='2-digit'
            minute='2-digit'
            second='2-digit'
          />
        </Tag>
      )
    },
    sortCriteria: 'created',
    sortOrder: 'desc',
  },
  {
    name: _('messageFrom'),
    itemRenderer: ({ read }) => {
      const Tag = read ? 'span' : 'strong'
      return <Tag>XO Team</Tag>
    },
    sortCriteria: '',
  },
  {
    name: _('messageSubject'),
    itemRenderer: ({ read, title }) => {
      const Tag = read ? 'span' : 'strong'
      return <Tag>{title}</Tag>
    },
    sortCriteria: 'title',
  },
  {
    name: '',
    itemRenderer: ({ id, read }) => !read && <strong className='text-success'>{_('notificationNew')}</strong>,
    sortCriteria: 'read',
  },
]

const ACTIONS = [
  {
    label: _('messageReply'),
    handler: notification =>
      reportBug({
        title: `Re: ${notification.title} (Ref: ${notification.id})`,
      }),
    icon: 'reply',
  },
]

const Notifications = decorate([
  addSubscriptions({
    notifications: subscribeNotifications,
  }),
  provideState({
    effects: {
      showMessage: (effects, notification) => () =>
        alert(
          <span>
            <Icon icon='notification' /> {notification.title}
          </span>,
          <div dangerouslySetInnerHTML={{ __html: marked(notification.message) }} />
        ).then(() => dismissNotification(notification.id)),
    },
  }),
  injectState,
  ({ notifications, effects }) => (
    <NoObjects
      collection={notifications}
      columns={COLUMNS}
      component={SortedTable}
      emptyMessage={_('noNotifications')}
      individualActions={ACTIONS}
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
      nNewNotifications: (_, { notifications }) => filter(notifications, { read: false }).length,
      someWarningNotifications: (_, { notifications }) => some(notifications, { level: 'warning', read: false }),
    },
  }),
  injectState,
  ({ state }) =>
    state.nNewNotifications > 0 ? (
      <span className={classNames('tag', 'tag-pill', state.someWarningNotifications ? 'tag-danger' : 'tag-warning')}>
        {state.nNewNotifications}
      </span>
    ) : null,
])
