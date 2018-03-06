import _ from 'intl'
import classNames from 'classnames'
import Component from 'base-component'
import Icon from 'icon'
import React from 'react'
import { FormattedDate } from 'react-intl'
import { forEach, map, orderBy } from 'lodash'
import { createFilter, createSelector } from 'selectors'
import { Toggle } from 'form'

const _escapeDot = id => id.replace('.', '\0')

export default class DeleteBackupsModalBody extends Component {
  get value () {
    return this._getSelectedBackups()
  }

  _selectAll = () => {
    const selected = this._getSelectedBackups().length === 0

    const state = {}
    // TODO: [DELTA] remove filter
    forEach(this.props.backups.filter(b => b.mode !== 'delta'), backup => {
      state[_escapeDot(backup.id)] = selected
    })

    this.setState(state)
  }

  _getSelectedBackups = createFilter(
    () => this.props.backups,
    createSelector(
      () => this.state,
      state => backup => state[_escapeDot(backup.id)]
    )
  )

  _getAllSelected = createSelector(
    () => this.props.backups,
    this._getSelectedBackups,
    (backups, selectedBackups) =>
      // TODO: [DELTA] remove filter
      backups.filter(b => b.mode !== 'delta').length === selectedBackups.length
  )

  _getBackups = createSelector(
    () => this.props.backups,
    backups => orderBy(backups, 'timestamp', 'desc')
  )

  render () {
    return (
      <div>
        <div>{_('deleteVmBackupsSelect')}</div>
        <div className='list-group'>
          {map(this._getBackups(), backup => (
            <button
              className={classNames(
                'list-group-item',
                'list-group-item-action',
                backup.mode === 'delta' && 'disabled', // TODO: [DELTA] remove
                this.state[_escapeDot(backup.id)] && 'active'
              )}
              data-id={backup.id}
              key={backup.id}
              onClick={
                backup.mode !== 'delta' && // TODO: [DELTA] remove
                this.toggleState(_escapeDot(backup.id))
              }
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
        <div>
          <Toggle
            iconSize={1}
            onChange={this._selectAll}
            value={this._getAllSelected()}
          />{' '}
          {_('deleteVmBackupsSelectAll')}
        </div>
        {/* TODO: [DELTA] remove div and i18n message */}
        <div>
          <em>
            <Icon icon='info' /> {_('deleteVmBackupsDeltaInfo')}
          </em>
        </div>
      </div>
    )
  }
}
