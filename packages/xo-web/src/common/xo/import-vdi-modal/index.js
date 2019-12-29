import _ from 'intl'
import Component from 'base-component'
import Dropzone from 'dropzone'
import React from 'react'

export default class ImportVdiModalBody extends Component {
  get value() {
    return this.state.file
  }

  render() {
    const { file } = this.state
    return (
      <Dropzone
        onDrop={this.linkState('file', '0')}
        message={file === undefined ? _('selectVdiMessage') : file.name}
        multiple={false}
      />
    )
  }
}
