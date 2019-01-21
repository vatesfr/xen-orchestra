import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import cookies from 'cookies-js'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import SortedTable from 'sorted-table'
import updater from 'xoa-updater'
import { alert } from 'modal'
import { FormattedDate } from 'react-intl'
import { some } from 'lodash'

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
    itemRenderer: ({ id }) => !cookies.get(`notification:${id}`) && 'NEW',
  },
]

const Notification = ({ notification: { message } }) => (
  <div dangerouslySetInnerHTML={{ __html: marked(message) }} />
)

export default class Notifications extends Component {
  _getNotifications = () =>
    updater
      ._call('getMessages')
      .then(notifications => this.setState({ notifications }))

  _showMessage = async notification => {
    cookies.set(`notification:${notification.id}`, 'dismissed')
    await alert(
      <span>
        <Icon icon='notification' /> {_('notification')}
      </span>,
      <Notification notification={notification} />
    )
    await this._getNotifications()
  }

  componentDidMount = this._getNotifications

  render() {
    return (
      <div>
        <ActionButton
          btnStyle='primary'
          className='mb-1'
          handler={this._getNotifications}
          icon='refresh'
        >
          {_('refresh')}
        </ActionButton>
        <SortedTable
          columns={COLUMNS}
          collection={this.state.notifications}
          rowAction={this._showMessage}
          stateUrlParam='s'
        />
      </div>
    )
  }
}

export class NotificationTag extends Component {
  componentDidMount() {
    updater._call('getMessages').then(notifications => {
      this.setState({
        newNotifications: some(
          notifications,
          notification => !cookies.get(`notification:${notification.id}`)
        ),
      })
    })
  }

  render() {
    return this.state.newNotifications ? <Icon icon='notification' /> : null
  }
}
