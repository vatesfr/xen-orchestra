import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import Dropzone from 'dropzone'
import Icon from 'icon'
import React from 'react'
import { formatSize } from 'utils'
import { importConfig, exportConfig } from 'xo'

// ===================================================================

export default class Config extends Component {
  componentWillMount() {
    this.state = { importStatus: 'noFile' }
  }

  _importConfig = () => {
    this.setState({ importStatus: 'start' }, () =>
      importConfig(this.state.configFile).then(
        () => this.setState({ configFile: undefined, importStatus: 'end' }),
        () =>
          this.setState({ configFile: undefined, importStatus: 'importError' })
      )
    )
  }

  _handleDrop = files =>
    this.setState({
      configFile: files && files[0],
      importStatus: 'selectedFile',
    })

  _unselectFile = () =>
    this.setState({ configFile: undefined, importStatus: 'noFile' })

  _renderImportStatus = () => {
    const { configFile, importStatus } = this.state

    switch (importStatus) {
      case 'noFile':
        return _('noConfigFile')
      case 'selectedFile':
        return (
          <span>{`${configFile.name} (${formatSize(configFile.size)})`}</span>
        )
      case 'start':
        return <Icon icon='loading' />
      case 'end':
        return <span className='text-success'>{_('importConfigSuccess')}</span>
      case 'importError':
        return <span className='text-danger'>{_('importConfigError')}</span>
    }
  }

  render() {
    const { configFile } = this.state

    return (
      <div>
        {process.env.XOA_PLAN < 5 ? (
          <div className='mb-1'>
            <h2>
              <Icon icon='import' /> {_('importConfig')}
            </h2>
            <form id='import-form'>
              <Dropzone onDrop={this._handleDrop} message={_('importTip')} />
              {this._renderImportStatus()}
              <div className='form-group pull-right'>
                <ActionButton
                  btnStyle='primary'
                  className='mr-1'
                  disabled={!configFile}
                  form='import-form'
                  handler={this._importConfig}
                  icon='import'
                  type='submit'
                >
                  {_('importConfig')}
                </ActionButton>
                <Button onClick={this._unselectFile}>
                  {_('importVmsCleanList')}
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <h2 className='text-danger'>{_('noConfigImportCommunity')}</h2>
            <p>
              {_('considerSubscribe', {
                link: (
                  <a href='https://xen-orchestra.com'>
                    https://xen-orchestra.com
                  </a>
                ),
              })}
            </p>
          </div>
        )}
        <br />
        <div className='mt-1'>
          <h2>
            <Icon icon='export' /> {_('exportConfig')}
          </h2>
          <Button btnStyle='primary' onClick={exportConfig}>
            {_('downloadConfig')}
          </Button>
        </div>
      </div>
    )
  }
}
