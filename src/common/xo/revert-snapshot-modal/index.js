import _ from 'intl'
import BaseComponent from 'base-component'
import React from 'react'

export default class RevertSnapshotModalBody extends BaseComponent {
  state = { snapshotBefore: true }

  get value () {
    return this.state
  }

  render () {
    return <div>
      <div>{_('revertVmModalMessage')}</div>
      <br />
      <label>
        <input type='checkbox' onChange={this.toggleState('snapshotBefore')} checked={this.state.snapshotBefore} />
        {' '}
        {_('revertVmModalSnapshotBefore')}
      </label>
    </div>
  }
}
