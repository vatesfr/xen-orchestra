import _ from 'intl'
import ActionButton from 'action-button'
import Component from 'base-component'
import Dropzone from 'dropzone'
import Icon from 'icon'
import React from 'react'
import { uploadAirgapDataPack } from 'xo'

export default class UploadAirgapDataPack extends Component {
  state = {
    airgapDataPack: undefined,
    rejectedFile: undefined,
  }

  _handleDrop = (files, rejectedFiles) => {
    this.setState({
      airgapDataPack: files?.[0],
      rejectedFile: files?.[0] === undefined ? rejectedFiles?.[0] : undefined,
    })
  }

  _handleUpload = () =>
    uploadAirgapDataPack({ file: this.state.airgapDataPack }).then(() => {
      this.setState({ airgapDataPack: undefined })
    })

  _handleRemove = () => {
    this.setState({ airgapDataPack: undefined })
  }

  render() {
    const { airgapDataPack, rejectedFile } = this.state

    return (
      <div>
        <h2>{_('airgapDataPack')}</h2>
        <p>{_('airgapDataPackDescription')}</p>
        <Dropzone multiple={false} onDrop={this._handleDrop} accept='.tar.xz' message={_('dropFileHere')} />
        {rejectedFile !== undefined && (
          <p className='text-danger'>{_('airgapDataPackFileRejected', { name: rejectedFile.name })}</p>
        )}
        {airgapDataPack && (
          <p>
            <Icon icon='file' /> {airgapDataPack.name}{' '}
            <ActionButton
              btnStyle='danger'
              handler={this._handleRemove}
              icon='remove'
              size='small'
              tooltip={_('removeAirgapDataPack')}
            />
          </p>
        )}
        {airgapDataPack && (
          <div className='form-group pull-right'>
            <ActionButton btnStyle='primary' className='mr-1' handler={this._handleUpload} icon='import'>
              {_('uploadAirgapDataPack')}
            </ActionButton>
          </div>
        )}
      </div>
    )
  }
}
