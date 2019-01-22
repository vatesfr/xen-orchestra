import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import cookies from 'cookies-js'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import SortedTable from 'sorted-table'
import { alert } from 'modal'
import { FormattedDate } from 'react-intl'
import { filter } from 'lodash'
import { getNotifications } from 'xo'

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
  _refreshNotifications = () =>
    getNotifications().then(notifications => this.setState({ notifications }))

  _showMessage = async notification => {
    cookies.set(`notification:${notification.id}`, 'dismissed')
    await alert(
      <span>
        <Icon icon='notification' /> {_('notification')}
      </span>,
      <Notification notification={notification} />
    )
    await this._refreshNotifications()
  }

  componentDidMount = this._refreshNotifications

  render() {
    return (
      <div>
        <ActionButton
          btnStyle='primary'
          className='mb-1'
          handler={this._refreshNotifications}
          icon='refresh'
        >
          {_('refresh')}
        </ActionButton>
        <SortedTable
          columns={COLUMNS}
          collection={this.state.notifications || []}
          rowAction={this._showMessage}
          stateUrlParam='s'
        />
      </div>
    )
  }
}

export class NotificationTag extends Component {
  _refresh = () =>
    getNotifications().then(notifications => {
      this.setState({
        newNotifications: filter(
          notifications,
          notification => !cookies.get(`notification:${notification.id}`)
        ).length,
      })
    })

  componentDidMount() {
    this._refresh()
    this._interval = setInterval(this._refresh, 1e4)
  }

  componentWillUnmount() {
    clearInterval(this._interval)
  }

  render() {
    const { newNotifications } = this.state
    return newNotifications > 0 ? (
      <span className='tag tag-pill tag-warning'>{newNotifications}</span>
    ) : null
  }
}
