import Component from 'base-component'
import React from 'react'

import _ from '../../intl'

export default class SnapshotVmModalBody extends Component {
  get value() {
    return this.state.saveMemory
  }

  render() {
    return (
      <label>
        <input
          type='checkbox'
          onChange={this.linkState('saveMemory')}
          checked={this.state.saveMemory}
        />{' '}
        {_('snapshotSaveMemory')}
      </label>
    )
  }
}
