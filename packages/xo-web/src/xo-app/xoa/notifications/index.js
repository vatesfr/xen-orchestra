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

const COLUMNS = [
  {
    default: true,
    name: 'Date',
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
    updater._call('getMessages').then(messages => this.setState({ messages }))

  _showMessage = async notification => {
    cookies.set(`notification:${notification.id}`, 'dismissed')
    await alert(
      <span>
        <Icon icon='notification' /> Notification
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
          Refresh
        </ActionButton>
        <SortedTable
          columns={COLUMNS}
          collection={this.state.messages}
          rowAction={this._showMessage}
          stateUrlParam='s'
        />
      </div>
    )
  }
}
