import _ from 'intl'
import ActionButton from 'action-button'
import { Button } from 'react-bootstrap-4/lib'
import Component from 'base-component'
import Dropzone from 'dropzone'
import Icon from 'icon'
import React from 'react'
import Upgrade from 'xoa-upgrade'
import {
  formatSize
} from 'utils'
import {
  importConfig,
  exportConfig
} from 'xo'

// ===================================================================

export default class Config extends Component {
  componentWillMount () {
    this.state = { importStatus: 'noFile' }

    if (window.FileReader) {
      this.reader = new window.FileReader()
      this.reader.addEventListener('load', this._parseAndImport)
      this.componentWillUnmount = () => this.reader.removeEventListener('load', this._parseAndImport)
    }
  }

  _parseAndImport = e => {
    let config

    try {
      config = JSON.parse(e.target.result)
    } catch (error) {
      this.setState({ importStatus: 'parseError' })
      return
    }

    return importConfig(config).then(
      () => this.setState({ configFile: undefined, importStatus: 'end' }),
      () => this.setState({ configFile: undefined, importStatus: 'importError' })
    )
  }

  _readFile = () => {
    this.setState({ importStatus: 'start' }, () =>
      this.reader.readAsBinaryString(this.state.configFile)
    )
  }

  _handleDrop = files =>
    this.setState({
      configFile: files && files[0],
      importStatus: 'selectedFile'
    })

  _unselectFile = () => this.setState({ configFile: undefined, importStatus: 'noFile' })

  _renderImportStatus = () => {
    const { configFile, importStatus } = this.state

    switch (importStatus) {
      case 'noFile':
        return _('noConfigFile')
      case 'selectedFile':
        return <span>{`${configFile.name} (${formatSize(configFile.size)})`}</span>
      case 'start':
        return <Icon icon='loading' />
      case 'end':
        return <span className='text-success'>{_('importConfigSuccess')}</span>
      case 'importError':
        return <span className='text-danger'>{_('importConfigError')}</span>
      case 'parseError':
        return <span className='text-danger'>{_('parseConfigError')}</span>
    }
  }

  render () {
    const { configFile } = this.state

    if (process.env.XOA_PLAN < 2) {
      return <div><Upgrade place='vmImport' available={2} /></div>
    }

    return <div>
      {process.env.XOA_PLAN < 5
        ? (this.reader && <div className='mb-1'>
          <h2><Icon icon='import' /> {_('importConfig')}</h2>
          <form id='import-form'>
            <Dropzone onDrop={this._handleDrop} message={_('importTip')} />
            {this._renderImportStatus()}
            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                className='mr-1'
                disabled={!configFile}
                form='import-form'
                handler={this._readFile}
                icon='import'
                type='submit'
              >
                {_('importConfig')}
              </ActionButton>
              <Button
                bsStyle='secondary'
                onClick={this._unselectFile}
              >
                {_('importVmsCleanList')}
              </Button>
            </div>
          </form>
        </div>)
        : <div>
          <h2 className='text-danger'>{_('noConfigImportCommunity')}</h2>
          <p>{_('considerSubscribe', { link: <a href='https://xen-orchestra.com'>https://xen-orchestra.com</a> })}</p>
        </div>
      }
      <br />
      <div className='mt-1'>
        <h2><Icon icon='export' /> {_('exportConfig')}</h2>
        <Button bsStyle='primary' onClick={exportConfig}>{_('downloadConfig')}</Button>
      </div>
    </div>
  }
}
