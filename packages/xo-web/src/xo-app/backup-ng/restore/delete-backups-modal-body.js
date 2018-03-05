import classNames from 'classnames'
import Component from 'base-component'
import React from 'react'
import { FormattedDate } from 'react-intl'
import { filter, map, orderBy } from 'lodash'
import { createSelector } from 'selectors'

export default class DeleteBackupsModalBody extends Component {
  get value () {
    const { state } = this
    return filter(
      this.props.backups,
      backup => state[backup.id.replace('.', '#')]
    )
  }

  _getBackups = createSelector(
    () => this.props.backups,
    backups => orderBy(backups, 'timestamp', 'desc')
  )

  render () {
    return (
      <div className='list-group'>
        {map(this._getBackups(), backup => (
          <button
            className={classNames(
              'list-group-item',
              'list-group-item-action',
              this.state[backup.id.replace('.', '#')] && 'active'
            )}
            data-id={backup.id}
            key={backup.id}
            onClick={this.toggleState(backup.id.replace('.', '#'))}
            type='button'
          >
            <span
              className='tag tag-info'
              style={{ textTransform: 'capitalize' }}
            >
              {backup.mode}
            </span>{' '}
            <span className='tag tag-warning'>{backup.remote.name}</span>{' '}
            <FormattedDate
              value={new Date(backup.timestamp)}
              month='long'
              day='numeric'
              year='numeric'
              hour='2-digit'
              minute='2-digit'
              second='2-digit'
            />
          </button>
        ))}
      </div>
    )
  }
}
