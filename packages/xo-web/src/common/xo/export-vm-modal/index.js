import BaseComponent from 'base-component'
import React from 'react'

import _ from '../../intl'
import SelectCompression from '../../select-compression'

export default class ExportVmModalBody extends BaseComponent {
  state = {
    compression: '',
  }

  get value() {
    const compression = this.state.compression
    return compression === 'zstd' ? 'zstd' : compression === 'native'
  }

  render() {
    return (
      <div>
        <strong>{_('compression')}</strong>
        <SelectCompression
          onChange={this.linkState('compression')}
          value={this.state.compression}
        />
      </div>
    )
  }
}
