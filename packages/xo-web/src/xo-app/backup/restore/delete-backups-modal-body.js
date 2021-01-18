import _ from 'intl'
import classNames from 'classnames'
import Component from 'base-component'
import React from 'react'
import { forEach, map, orderBy } from 'lodash'
import { createFilter, createSelector } from 'selectors'
import { Toggle } from 'form'
import { getRenderXoItemOfType } from 'render-xo-item'

const BACKUP_RENDERER = getRenderXoItemOfType('backup')

const _escapeDot = id => id.replace('.', '\0')

export default class DeleteBackupsModalBody extends Component {
  get value() {
    return this._getSelectedBackups()
  }

  _selectAll = () => {
    const selected = this._getSelectedBackups().length === 0

    const state = {}
    forEach(this.props.backups, backup => {
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
    (backups, selectedBackups) => backups.length === selectedBackups.length
  )

  _getBackups = createSelector(
    () => this.props.backups,
    backups => orderBy(backups, 'timestamp', 'desc')
  )

  render() {
    return (
      <div>
        <div>{_('deleteBackupsSelect')}</div>
        <div className='list-group'>
          {map(this._getBackups(), backup => (
            <button
              className={classNames(
                'list-group-item',
                'list-group-item-action',
                this.state[_escapeDot(backup.id)] && 'active'
              )}
              data-id={backup.id}
              key={backup.id}
              onClick={this.toggleState(_escapeDot(backup.id))}
              type='button'
            >
              {BACKUP_RENDERER(backup)}
            </button>
          ))}
        </div>
        <div>
          <Toggle iconSize={1} onChange={this._selectAll} value={this._getAllSelected()} />{' '}
          {_('deleteVmBackupsSelectAll')}
        </div>
      </div>
    )
  }
}
