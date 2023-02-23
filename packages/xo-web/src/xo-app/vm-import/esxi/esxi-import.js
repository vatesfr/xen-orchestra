import _, { messages } from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import Component from 'base-component'
import React from 'react'
import { connectStore } from 'utils'
import { createGetObjectsOfType, createSelector } from 'selectors'
import { esxiConnect, importVmFromEsxi, isSrWritable } from 'xo'
import { find, isEmpty, keyBy, map, pick } from 'lodash'
import { injectIntl } from 'react-intl'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { Password, Select } from 'form'
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
    hasCertificate: true,
    hostIp: '',
    isConnected: false,
    password: '',
    user: '',
  }

  componentWillMount() {}

  componentDidUpdate(prevProps, prevState) {}

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

  _importVm = async () => {
    const { hasCertificate, hostIp, network, password, sr, user, vm } = this.state
    return importVmFromEsxi({
      host: hostIp,
      network: network?.id ?? this._getDefaultNetwork(),
      password,
      sr,
      sslVerify: hasCertificate,
      user,
      vm: vm.value,
    })
  }

  _connect = async () => {
    const { hostIp, hasCertificate, password, user } = this.state
    const vms = await esxiConnect(hostIp, user, password, hasCertificate)
    this.setState({ isConnected: true, vmsById: keyBy(vms, 'id') })
  }

  _onChangeVm = vm => {
    this.setState({ vm })
  }

  _onChangeNetwork = network => {
    this.setState({ network })
  }

  _onChangePool = pool => {
    this.setState({ pool, sr: pool.default_SR })
  }
  _onChangeSr = sr => {
    this.setState({ sr })
  }

  _toggleCertificateCheck = ({ target: { checked, name } }) => {
    this.setState({ [name]: checked })
  }

  _reset = () => {
    this.setState({
      hasCertificate: true,
      hostIp: '',
      isConnected: false,
      network: undefined,
      password: '',
      pool: undefined,
      sr: undefined,
      user: '',
      vm: undefined,
      vmsById: undefined,
    })
  }

  render() {
    const { intl } = this.props
    const {
      hasCertificate,
      hostIp,
      isConnected,
      network = this._getDefaultNetwork(),
      password,
      pool,
      sr,
      user,
      vm,
      vmsById,
    } = this.state

    return (
      <div>
        {!isConnected ? (
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
              <LabelCol>{_('sslCertificate')}</LabelCol>
              <InputCol>
                <input
                  checked={hasCertificate}
                  name='hasCertificate'
                  onChange={this._toggleCertificateCheck}
                  type='checkbox'
                  value={hasCertificate}
                />
              </InputCol>
            </Row>
            <div className='form-group pull-right'>
              <ActionButton btnStyle='primary' className='mr-1' handler={this._connect} icon='connect' type='submit'>
                {_('serverConnect')}
              </ActionButton>
              <Button onClick={this._reset}>{_('formReset')}</Button>
            </div>
          </form>
        ) : (
          <form id='esxi-migrate-form'>
            <Row>
              <LabelCol>{_('vm')}</LabelCol>
              <InputCol>
                <Select
                  disabled={isEmpty(vmsById)}
                  onChange={this._onChangeVm}
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
                  onChange={this._onChangeSr}
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
                  onChange={this._onChangeNetwork}
                  predicate={this._getNetworkPredicate()}
                  required
                  value={network}
                />
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
                form='esxi-migrate-form'
                handler={this._importVm}
                icon='import'
                redirectOnSuccess={getRedirectUrl}
                type='submit'
              >
                {_('newImport')}
              </ActionButton>
              <Button onClick={this._reset}>{_('formReset')}</Button>
            </div>
          </form>
        )}
      </div>
    )
  }
}

export default EsxiImport
