import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import React from 'react'
import { connectStore } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { esxiListVms, importVmFromEsxi, isSrWritable } from 'xo'
import { find, isEmpty, keyBy, map, pick } from 'lodash'
import { injectIntl } from 'react-intl'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { Password, Select, Toggle } from 'form'
import { SelectNetwork, SelectPool, SelectSr } from 'select-objects'

import VmData from './vm-data'

const getRedirectUrl = vmId => `/vms/${vmId}`

@injectIntl
@connectStore({
  hostsById: createGetObjectsOfType('host'),
  pifsById: createGetObjectsOfType('PIF'),
})
class EsxiImport extends Component {
  state = {
    skipSslVerify: false,
    thin: false,
    stopSource: false,
    hostIp: '',
    isConnected: false,
    password: '',
    user: '',
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
    () => this.props.pool?.id,
    poolId => (poolId === undefined ? undefined : network => network.$poolId === poolId)
  )

  _getSrPredicate = createSelector(
    () => this.props.pool?.id,
    poolId => (poolId === undefined ? undefined : sr => isSrWritable(sr) && sr.$poolId === poolId)
  )

  _importVm = () => {
    const { hostIp, network, password, skipSslVerify, sr, stopSource, thin, user, vm } = this.state
    return importVmFromEsxi({
      host: hostIp,
      network: network?.id ?? this._getDefaultNetwork(),
      password,
      sr,
      sslVerify: !skipSslVerify,
      stopSource,
      thin,
      user,
      vm: vm.value,
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
      thin: false,
      stopSource: false,
      hostIp: '',
      isConnected: false,
      password: '',
      user: '',
    })
  }

  _resetImportForm = () => {
    this.setState({
      network: undefined,
      pool: undefined,
      sr: undefined,
      vm: undefined,
    })
  }

  render() {
    const { intl } = this.props
    const {
      thin,
      stopSource,
      hostIp,
      isConnected,
      network = this._getDefaultNetwork(),
      password,
      pool,
      skipSslVerify,
      sr,
      user,
      vm,
      vmsById,
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

    return (
      <form>
        <Row>
          <LabelCol>{_('vm')}</LabelCol>
          <InputCol>
            <Select
              disabled={isEmpty(vmsById)}
              onChange={this.linkState('vm')}
              options={this._getSelectVmOptions()}
              required
              value={vm}
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
          <LabelCol>{_('esxiImportThin')}</LabelCol>
          <InputCol>
            <Toggle onChange={this.toggleState('thin')} value={thin} />
            <small className='form-text text-muted'>{_('esxiImportThinDescription')}</small>
          </InputCol>
        </Row>
        <Row>
          <LabelCol>{_('esxiImportStopSource')}</LabelCol>
          <InputCol>
            <Toggle onChange={this.toggleState('thin')} value={stopSource} />
          </InputCol>
        </Row>
        {vm !== undefined && (
          <div>
            <hr />
            <h5>{_('vmsToImport', { nVms: 1 })}</h5>
            <VmData data={vmsById[vm.value]} />
          </div>
        )}
        <div className='form-group pull-right'>
          <ActionButton
            btnStyle='primary'
            className='mr-1'
            disabled={vm === undefined}
            handler={this._importVm}
            icon='import'
            redirectOnSuccess={getRedirectUrl}
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
