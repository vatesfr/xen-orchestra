import BaseComponent from 'base-component'
import concat from 'lodash/concat'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import find from 'lodash/find'
import isEmpty from 'lodash/isEmpty'
import keys from 'lodash/keys'
import map from 'lodash/map'
import React from 'react'
import some from 'lodash/some'

import _ from '../../intl'
import Icon from 'icon'
import invoke from '../../invoke'
import SingleLineRow from '../../single-line-row'
import { Col } from '../../grid'
import { getDefaultNetworkForVif } from '../utils'
import {
  SelectHost,
  SelectNetwork,
  SelectSr
} from '../../select-objects'
import {
  connectStore
} from '../../utils'
import {
  createFilter,
  createGetObjectsOfType,
  createPicker,
  createSelector
} from '../../selectors'

import { isSrWritable } from '../'

const LINE_STYLE = { paddingBottom: '1em' }

@connectStore(() => {
  const getNetworks = createGetObjectsOfType('network')
  const getPifs = createGetObjectsOfType('PIF')
  const getPools = createGetObjectsOfType('pool')

  const getVms = createFilter(
    createGetObjectsOfType('VM').pick(
      (_, props) => props.vms
    ),
    () => vm => vm.power_state === 'Running'
  )

  const getNonRunningVms = createFilter(
    createGetObjectsOfType('VM').pick(
      (_, props) => props.vms
    ),
    () => vm => vm.power_state !== 'Running'
  )

  const getVbdsByVm = createGetObjectsOfType('VBD').pick(
    createSelector(
      getVms,
      vms => concat(...map(vms, vm => vm.$VBDs))
    )
  ).groupBy('VM')

  const getVifsByVM = createGetObjectsOfType('VIF').pick(
    createSelector(
      getVms,
      vms => concat(...map(vms, vm => vm.VIFs))
    )
  ).groupBy('$VM')

  return {
    networks: getNetworks,
    nonRunningVms: getNonRunningVms,
    pifs: getPifs,
    pools: getPools,
    vbdsByVm: getVbdsByVm,
    vifsByVm: getVifsByVM,
    vms: getVms
  }
}, { withRef: true })
export default class MigrateVmsModalBody extends BaseComponent {
  constructor (props) {
    super(props)

    this._getHostPredicate = createSelector(
      () => this.props.vms,
      vms => host => some(vms, vm => host.id !== vm.$container)
    )

    this._getSrPredicate = createSelector(
      () => this.state.host,
      host => (host
        ? sr => isSrWritable(sr) && (sr.$container === host.id || sr.$container === host.$pool)
        : false
      )
    )

    this._getNetworkPredicate = createSelector(
      createPicker(
        () => this.props.pifs,
        () => this.state.host.$PIFs
      ),
      pifs => {
        if (!pifs) {
          return false
        }

        const networks = {}
        forEach(pifs, pif => {
          pif.ip && (networks[pif.$network] = true)
        })

        return network => networks[network.id]
      }
    )
  }

  componentDidMount () {
    this._selectHost(this.props.host)
  }

  get value () {
    const { vms } = this.props
    if (isEmpty(vms)) {
      return { badPowerState: true }
    }
    const { networks, pifs, vbdsByVm, vifsByVm } = this.props
    const { host, migrationNetworkId, networkId, smartVifMapping, srId } = this.state

    // Map VM --> ( Map VDI --> SR )
    const mapVmsMapVdisSrs = {}
    forEach(vbdsByVm, (vbds, vm) => {
      const mapVdisSrs = {}
      forEach(vbds, vbd => {
        if (!vbd.is_cd_drive && vbd.VDI) {
          mapVdisSrs[vbd.VDI] = srId
        }
      })
      mapVmsMapVdisSrs[vm] = mapVdisSrs
    })

    const defaultNetwork = invoke(() => {
      // First PIF with an IP.
      const pifId = host && find(host.$PIFs, pif => pifs[pif].ip)
      const pif = pifId && pifs[pifId]

      return pif && pif.$network
    })

    // Map VM --> ( Map VIF --> network )
    const mapVmsMapVifsNetworks = {}
    forEach(vms, vm => {
      const mapVifsNetworks = {}
      forEach(vifsByVm[vm.id], vif => {
        mapVifsNetworks[vif.id] = smartVifMapping
          ? getDefaultNetworkForVif(vif, host, pifs, networks) || defaultNetwork
          : networkId
      })
      mapVmsMapVifsNetworks[vm.id] = mapVifsNetworks
    })
    return {
      mapVmsMapVdisSrs,
      mapVmsMapVifsNetworks,
      migrationNetwork: migrationNetworkId,
      targetHost: host && host.id,
      vms
    }
  }

  _selectHost = host => {
    if (!host) {
      this.setState({ targetHost: undefined })
      return
    }
    const { pools, pifs } = this.props
    const defaultMigrationNetworkId = find(pifs, pif => pif.$host === host.id && pif.management).$network
    const defaultSrId = pools[host.$pool].default_SR
    this.setState({
      host,
      intraPool: every(this.props.vms, vm => vm.$pool === host.$pool),
      migrationNetworkId: defaultMigrationNetworkId,
      networkId: defaultMigrationNetworkId,
      smartVifMapping: true,
      srId: defaultSrId
    })
  }
  _selectMigrationNetwork = migrationNetwork => this.setState({ migrationNetworkId: migrationNetwork.id })
  _selectNetwork = network => this.setState({ networkId: network.id })
  _selectSr = sr => this.setState({ srId: sr.id })
  _toggleSmartVifMapping = () => this.setState({ smartVifMapping: !this.state.smartVifMapping })

  render () {
    if (isEmpty(this.props.vms)) {
      return <div>
        <Icon icon='error' />
        {' '}
        {_('migrateVmBadPowerState')}
      </div>
    }
    const { nonRunningVms } = this.props
    const {
      host,
      intraPool,
      migrationNetworkId,
      networkId,
      smartVifMapping,
      srId
    } = this.state
    return <div>
      <div style={LINE_STYLE}>
        <SingleLineRow>
          <Col size={6}>{_('migrateVmSelectHost')}</Col>
          <Col size={6}>
            <SelectHost
              onChange={this._selectHost}
              predicate={this._getHostPredicate()}
              value={host}
            />
          </Col>
        </SingleLineRow>
      </div>
      {intraPool === false &&
        <div style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmSelectMigrationNetwork')}</Col>
            <Col size={6}>
              <SelectNetwork
                onChange={this._selectMigrationNetwork}
                predicate={this._getNetworkPredicate()}
                value={migrationNetworkId}
              />
            </Col>
          </SingleLineRow>
        </div>
      }
      {host && [
        <div key='sr' style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmsSelectSr')}</Col>
            <Col size={6}>
              <SelectSr
                onChange={this._selectSr}
                predicate={this._getSrPredicate()}
                value={srId}
              />
            </Col>
          </SingleLineRow>
        </div>,
        <div key='network' style={LINE_STYLE}>
          <SingleLineRow>
            <Col size={6}>{_('migrateVmsSelectNetwork')}</Col>
            <Col size={6}>
              <SelectNetwork
                disabled={smartVifMapping}
                onChange={this._selectNetwork}
                predicate={this._getNetworkPredicate()}
                value={networkId}
              />
            </Col>
          </SingleLineRow>
          <SingleLineRow>
            <Col size={6} offset={6}>
              <input type='checkbox' onChange={this._toggleSmartVifMapping} checked={smartVifMapping} />
              {' '}
              {_('migrateVmsSmartMapping')}
            </Col>
          </SingleLineRow>
        </div>
      ]}
      {!isEmpty(nonRunningVms) && <div>
        <Icon icon='error' />
        {' '}
        {_('migrateVmSomeBadPowerState', { vm: nonRunningVms[keys(nonRunningVms)[0]].name_label })}
      </div>}
    </div>
  }
}
