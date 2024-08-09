import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Collapse from 'collapse'
import Component from 'base-component'
import React from 'react'
import { connectStore, resolveId } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { esxiListVms, importVmsFromEsxi, isSrWritable } from 'xo'
import { find, isEmpty, keyBy, map, pick } from 'lodash'
import { injectIntl } from 'react-intl'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { Password, Select, Toggle } from 'form'
import { SelectNetwork, SelectRemote, SelectPool, SelectSr, SelectVmTemplate } from 'select-objects'

import VmData from './vm-data'
import { getRedirectionUrl } from '../utils'

const N_IMPORT_VMS_IN_PARALLEL = 2

@injectIntl
@connectStore({
  hostsById: createGetObjectsOfType('host'),
  pifsById: createGetObjectsOfType('PIF'),
})
class EsxiImport extends Component {
  state = {
    concurrency: N_IMPORT_VMS_IN_PARALLEL,
    hostIp: '',
    isConnected: false,
    password: '',
    skipSslVerify: false,
    stopSource: false,
    stopOnError: true,
    template: undefined,
    user: '',
    workDirRemote: undefined,
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
    const {
      concurrency,
      hostIp,
      network,
      password,
      skipSslVerify,
      sr,
      stopSource,
      stopOnError,
      user,
      template,
      vms,
      workDirRemote,
    } = this.state
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
      workDirRemote: workDirRemote?.id,
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
      hostIp,
      isConnected,
      network = this._getDefaultNetwork(),
      password,
      pool,
      skipSslVerify,
      sr,
      stopSource,
      stopOnError,
      user,
      vms,
      vmsById,
      workDirRemote,
    } = this.state

    if (!isConnected) {
      return (
        <form>
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
    // check if at least one VM has at least one disk chain
    // with at least one extent stored on vsan
    const useExportVmMigration =
      !isEmpty(vms) &&
      vms.some(({ value }) => {
        return vmsById[value].hasAllExtentsListed === false
      })
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
        {useExportVmMigration && (
          <Row>
            <LabelCol>{_('workDirLabel')}</LabelCol>
            <InputCol>
              <SelectRemote required value={workDirRemote?.id} onChange={this.linkState('workDirRemote')} />
            </InputCol>
          </Row>
        )}
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
        {useExportVmMigration && 'warningVsanImport'}
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
