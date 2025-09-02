import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Collapse from 'collapse'
import Component from 'base-component'
import Dropzone from 'dropzone'
import Icon from 'icon'
import React from 'react'
import { connectStore, resolveId } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import {
  esxiCheckInstall,
  esxiListVms,
  importVddkLib,
  importVmsFromEsxi,
  installNbdInfo,
  installNbdKit,
  isSrWritable,
} from 'xo'
import { find, isEmpty, keyBy, map, pick } from 'lodash'
import { injectIntl } from 'react-intl'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { Password, Select, Toggle } from 'form'
import { SelectNetwork, SelectPool, SelectSr, SelectVmTemplate } from 'select-objects'

import VmData from './vm-data'
import { getRedirectionUrl } from '../utils'

const N_IMPORT_VMS_IN_PARALLEL = 2
function EsxiCheckResults({ esxiCheck }) {
  return (
    <ul className='list-group'>
      {Object.entries(esxiCheck).map(([name, value]) => {
        const { status, error, version, expectedVersion } = value
        return (
          <li key={name}>
            <Icon icon={status} size='lg' fixedWidth />
            &nbsp;
            {name} : {status === 'success' && ' ok'}
            {status === 'error' && `"${error}"`}
            &nbsp;
            {status === 'error' && _('esxiCheckingPrerequisiteError')}
            {version && status === 'alarm' && _('esxiCheckedPrerequisiteVersion', { version, expectedVersion })}
          </li>
        )
      })}
    </ul>
  )
}
@injectIntl
@connectStore({
  hostsById: createGetObjectsOfType('host'),
  pifsById: createGetObjectsOfType('PIF'),
})
class EsxiImport extends Component {
  state = {
    concurrency: N_IMPORT_VMS_IN_PARALLEL,
    hostIp: '',
    installingEsxiLib: false,
    isConnected: false,
    password: '',
    skipSslVerify: true,
    stopSource: true,
    stopOnError: true,
    template: undefined,
    user: '',
    vddkFile: undefined,
    esxiCheck: undefined,
    esxiCheckError: undefined,
  }

  componentWillMount() {
    this._esxiCheck()
  }
  _esxiCheck() {
    this.setState({ esxiCheck: undefined, installingEsxiLib: false }, async () => {
      const esxiCheck = await esxiCheckInstall()
      this.setState({ esxiCheck })
    })
  }
  _handleDropVddk = files => {
    this.setState({ vddkFile: files?.[0] })
  }
  _handleImportVddk = async () => {
    this.setState({ installingEsxiLib: true })
    try {
      await importVddkLib({ file: this.state.vddkFile })
    } catch (error) {
      this.setState({ esxiCheckError: error })
    }
    return this._esxiCheck()
  }
  _installNbdInfo = async () => {
    this.setState({ installingEsxiLib: true })
    await installNbdInfo()
    return this._esxiCheck()
  }
  _installNbKit = async () => {
    this.setState({ installingEsxiLib: true })
    await installNbdKit()
    return this._esxiCheck()
  }
  _getDefaultNetwork = createSelector(
    () => this.state.pool?.master,
    () => this.props.hostsById,
    () => this.props.pifsById,
    (master, hostsById, pifsById) =>
      master === undefined ? undefined : find(pick(pifsById, hostsById[master].$PIFs), pif => pif.management)?.$network
  )

  _getSelectVmOptions = createSelector(
    () => this.state.vmsById,
    vmsById =>
      map(vmsById, vm => ({
        label: vm.nameLabel,
        value: vm.id,
      }))
  )

  _getNetworkPredicate = createSelector(
    () => this.state.pool?.id,
    poolId => (poolId === undefined ? undefined : network => network.$poolId === poolId)
  )

  _getSrPredicate = createSelector(
    () => this.state.pool?.id,
    poolId => (poolId === undefined ? undefined : sr => isSrWritable(sr) && sr.$poolId === poolId)
  )

  _importVms = () => {
    const { concurrency, hostIp, network, password, skipSslVerify, sr, stopSource, stopOnError, user, template, vms } =
      this.state
    return importVmsFromEsxi({
      concurrency: +concurrency,
      host: hostIp,
      network: network?.id ?? this._getDefaultNetwork(),
      password,
      sr: resolveId(sr),
      sslVerify: !skipSslVerify,
      stopOnError,
      stopSource,
      template: template.id,
      user,
      vms: vms.map(vm => vm.value),
    })
  }

  _connect = async () => {
    const { hostIp, skipSslVerify, password, user } = this.state
    const vms = await esxiListVms(hostIp, user, password, !skipSslVerify)
    this.setState({ isConnected: true, vmsById: keyBy(vms, 'id') })
  }

  _disconnect = () => {
    this.setState({ isConnected: false })
  }

  _onChangePool = pool => {
    this.setState({ pool, sr: pool.default_SR })
  }

  _resetConnectForm = () => {
    this.setState({
      skipSslVerify: false,
      hostIp: '',
      isConnected: false,
      password: '',
      user: '',
    })
  }

  _resetImportForm = () => {
    this.setState({
      concurrency: N_IMPORT_VMS_IN_PARALLEL,
      network: undefined,
      pool: undefined,
      sr: undefined,
      stopSource: false,
      stopOnError: true,
      vms: undefined,
    })
  }

  render() {
    const { intl } = this.props
    const {
      concurrency,
      esxiCheck,
      hostIp,
      installingEsxiLib,
      isConnected,
      network = this._getDefaultNetwork(),
      password,
      pool,
      skipSslVerify,
      sr,
      stopSource,
      stopOnError,
      user,
      vddkFile,
      vms,
      vmsById,
    } = this.state

    if (esxiCheck === undefined) {
      return <div>checking</div>
    }

    // cehck nbdkit, nbdinfo, nbdkit plugin vddk
    for (const [library, fn] of [
      ['nbdinfo', this._installNbdInfo],
      ['nbdkit', this._installNbKit],
      ['nbdkitPluginVddk', this._installNbKit],
    ]) {
      const check = esxiCheck[library]
      if (check.status !== 'success') {
        return (
          <div>
            {check.version === undefined && (
              <div>
                <p>{_('esxiLibraryNotInstalled', { library })}</p>
                <div className='form-group pull-right'>
                  <ActionButton btnStyle='primary' className='mr-1' handler={fn} icon='import'>
                    {_('esxiLibraryAutoInstall', { library })}
                  </ActionButton>
                  {installingEsxiLib && <p>{_('esxiLibraryInstalling', { library })}</p>}
                  {!installingEsxiLib && <p>{_('esxiLibraryManualInstall')}</p>}
                </div>
              </div>
            )}
            {check.version !== undefined && (
              <p>
                {_('esxiLibraryOutdated', { library, expectedVersion: check.expectedVersion, version: check.version })}
              </p>
            )}
          </div>
        )
      }
    }

    if (esxiCheck.vddk?.status === 'error') {
      return (
        <div>
          <p>
            {_('esxiLibraryInfo')} :{' '}
            <a
              href='https://developer.broadcom.com/sdks/vmware-virtual-disk-development-kit-vddk/9.0'
              target='_blank'
              rel='noreferrer'
            >
              {_('esxiLibraryLink')}
            </a>
          </p>
          <Dropzone multiple={false} onDrop={this._handleDropVddk} message={_('esxiVddkLibrary')} accept='.tar.gz' />
          {vddkFile && (
            <div className='form-group pull-right'>
              <ActionButton btnStyle='primary' className='mr-1' handler={this._handleImportVddk} icon='import'>
                {_('esxiVddkLibraryImport')}
              </ActionButton>
            </div>
          )}
        </div>
      )
    }

    if (!isConnected) {
      return (
        <form>
          <Row>
            <EsxiCheckResults esxiCheck={esxiCheck} />
          </Row>
          <Row>
            <LabelCol>{_('hostIp')}</LabelCol>
            <InputCol>
              <Input
                className='form-control'
                onChange={this.linkState('hostIp')}
                placeholder='192.168.2.20'
                required
                value={hostIp}
              />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('user')}</LabelCol>
            <InputCol>
              <Input
                className='form-control'
                onChange={this.linkState('user')}
                placeholder={intl.formatMessage(messages.user)}
                required
                value={user}
              />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('password')}</LabelCol>
            <InputCol>
              <Password
                onChange={this.linkState('password')}
                placeholder={intl.formatMessage(messages.password)}
                required
                value={password}
              />
            </InputCol>
          </Row>
          <Row>
            <LabelCol>{_('esxiImportSslCertificate')}</LabelCol>
            <InputCol>
              <Toggle onChange={this.toggleState('skipSslVerify')} value={skipSslVerify} />
            </InputCol>
          </Row>
          <div className='form-group pull-right'>
            <ActionButton btnStyle='primary' className='mr-1' handler={this._connect} icon='connect' type='submit'>
              {_('serverConnect')}
            </ActionButton>
            <Button onClick={this._resetConnectForm}>{_('formReset')}</Button>
          </div>
        </form>
      )
    }

    return (
      <form>
        <Row>
          <LabelCol>{_('nImportVmsInParallel')}</LabelCol>
          <InputCol>
            <input
              className='form-control'
              onChange={this.linkState('concurrency')}
              type='number'
              value={concurrency}
            />
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('vms')}</LabelCol>
          <InputCol>
            <Select
              disabled={isEmpty(vmsById)}
              multi
              onChange={this.linkState('vms')}
              options={this._getSelectVmOptions()}
              required
              value={vms}
            />
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('vmImportToPool')}</LabelCol>
          <InputCol>
            <SelectPool onChange={this._onChangePool} required value={pool} />
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('vmImportToSr')}</LabelCol>
          <InputCol>
            <SelectSr
              disabled={pool === undefined}
              onChange={this.linkState('sr')}
              predicate={this._getSrPredicate()}
              required
              value={sr}
            />
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('network')}</LabelCol>
          <InputCol>
            <SelectNetwork
              disabled={pool === undefined}
              onChange={this.linkState('network')}
              predicate={this._getNetworkPredicate()}
              required
              value={network}
            />
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('esxiImportStopSource')}</LabelCol>
          <InputCol>
            <Toggle onChange={this.toggleState('stopSource')} value={stopSource} />
            <small className='form-text text-muted'>{_('esxiImportStopSourceDescription')}</small>
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('stopOnError')}</LabelCol>
          <InputCol>
            <Toggle onChange={this.toggleState('stopOnError')} value={stopOnError} />
            <small className='form-text text-muted'>{_('esxiImportStopOnErrorDescription')}</small>
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('originalTemplate')}</LabelCol>
          <InputCol>
            <SelectVmTemplate
              autoSelectSingleOption={false}
              disabled={isEmpty(pool)}
              hasSelectAll
              multi={false}
              onChange={this.linkState('template')}
              required
            />
          </InputCol>
        </Row>

        {!isEmpty(vms) && (
          <div>
            <hr />
            <h5>{_('vmsToImport', { nVms: vms.length })}</h5>
            {vms.map(vm => (
              <Collapse className='mt-1 mb-1' buttonText={vm.label} key={vm.value} size='small'>
                <div className='mt-1'>
                  <VmData data={vmsById[vm.value]} />
                </div>
              </Collapse>
            ))}
          </div>
        )}
        <div className='form-group pull-right'>
          <ActionButton
            btnStyle='primary'
            className='mr-1'
            disabled={isEmpty(vms)}
            handler={this._importVms}
            icon='import'
            redirectOnSuccess={getRedirectionUrl}
            type='submit'
          >
            {_('newImport')}
          </ActionButton>
          <Button className='mr-1' onClick={this._disconnect}>
            {_('disconnectServer')}
          </Button>
          <Button onClick={this._resetImportForm}>{_('formReset')}</Button>
        </div>
      </form>
    )
  }
}

export default EsxiImport
