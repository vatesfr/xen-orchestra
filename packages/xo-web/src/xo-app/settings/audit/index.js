import _ from 'intl'
import addSubscriptions from 'add-subscriptions'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import Icon from 'icon'
import NoObjects from 'no-objects'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { FormattedDate, injectIntl } from 'react-intl'
import { startCase } from 'lodash'
import { subscribeAuditRecords } from 'xo'
import { User } from 'render-xo-item'

const displayRecord = record =>
  alert(
    <span>
      <Icon icon='audit' /> {_('auditRecord')}
    </span>,
    <Copiable tagName='pre'>{JSON.stringify(record, null, 2)}</Copiable>
  )

const INDIVIDUAL_ACTIONS = [
  {
    handler: displayRecord,
    icon: 'preview',
    label: _('displayAuditRecord'),
  },
]

const COLUMNS = [
  {
    itemRenderer: ({ subject: { userId, userName } }) =>
      userId !== undefined ? (
        <User
          defaultRender={
            <Copiable tagName='p' text={userId} className='text-muted'>
              {_('auditDeletedUser', { name: userName })}
            </Copiable>
          }
          id={userId}
          link
          newTab
        />
      ) : (
        <p className='text-muted'>{_('noUser')}</p>
      ),
    name: _('user'),
    sortCriteria: 'subject.userName',
  },
  {
    name: _('ip'),
    valuePath: 'subject.userIp',
  },
  {
    itemRenderer: ({ data, event }) =>
      event === 'apiCall' ? data.method : startCase(event),
    name: _('auditActionEvent'),
    sortCriteria: ({ data, event }) =>
      event === 'apiCall' ? data.method : event,
  },
  {
    itemRenderer: ({ time }) => (
      <FormattedDate
        day='numeric'
        hour='2-digit'
        minute='2-digit'
        month='short'
        second='2-digit'
        value={new Date(time)}
        year='numeric'
      />
    ),
    name: _('date'),
    sortCriteria: 'time',
    sortOrder: 'desc',
  },
]

export default decorate([
  addSubscriptions({
    records: subscribeAuditRecords,
  }),
  injectIntl,
  ({ records, intl: { formatMessage } }) => (
    <NoObjects
      collection={records}
      columns={COLUMNS}
      component={SortedTable}
      defaultColumn={3}
      emptyMessage={
        <span className='text-muted'>
          <Icon icon='alarm' />
          &nbsp;
          {_('noAuditRecordAvailable')}
        </span>
      }
      individualActions={INDIVIDUAL_ACTIONS}
      stateUrlParam='s'
    />
  ),
])
