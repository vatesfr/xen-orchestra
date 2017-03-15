import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import classNames from 'classnames'
import DebounceInput from 'react-debounce-input'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import isIp from 'is-ip'
import Page from '../page'
import React from 'react'
import store from 'store'
import Tags from 'tags'
import Tooltip from 'tooltip'
import Wizard, { Section } from 'wizard'
import { Button } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import { Limits } from 'usage'
import {
  clamp,
  every,
  filter,
  find,
  forEach,
  get,
  includes,
  isArray,
  isEmpty,
  join,
  map,
  slice,
  size,
  sum,
  sumBy
} from 'lodash'
import {
  addSshKey,
  createVm,
  createVms,
  getCloudInitConfig,
  subscribeCurrentUser,
  subscribePermissions,
  subscribeResourceSets,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT
} from 'xo'
import {
  SelectHost,
  SelectIp,
  SelectNetwork,
  SelectPool,
  SelectResourceSet,
  SelectResourceSetIp,
  SelectResourceSetsNetwork,
  SelectResourceSetsSr,
  SelectResourceSetsVdi,
  SelectResourceSetsVmTemplate,
  SelectSr,
  SelectSshKey,
  SelectVdi,
  SelectVmTemplate
} from 'select-objects'
import {
  SizeInput,
  Toggle
} from 'form'
import {
  addSubscriptions,
  buildTemplate,
  connectStore,
  firstDefined,
  formatSize,
  noop,
  resolveResourceSet
} from 'utils'
import {
  createFilter,
  createSelector,
  createGetObject,
  createGetObjectsOfType,
  getUser
} from 'selectors'

import styles from './index.css'

const DEBOUNCE_TIMEOUT = 300
const NB_VMS_MIN = 2
const NB_VMS_MAX = 100

/* eslint-disable camelcase */

const getObject = createGetObject((_, id) => id)

// Sub-components

const SectionContent = ({ column, children }) => (
  <div className={classNames(
    'form-inline',
    styles.sectionContent,
    column && styles.sectionContentColumn
  )}>
    {children}
  </div>
)

const LineItem = ({ children }) => (
  <div className={styles.lineItem}>
    {children}
  </div>
)

const Item = ({ label, children, className }) => (
  <span className={styles.item}>
    {label && <span>{label}&nbsp;</span>}
    <span className={classNames(styles.input, className)}>{children}</span>
  </span>
)

@injectIntl
class Vif extends BaseComponent {
  render () {
    const {
      intl: { formatMessage },
      ipPoolPredicate,
      networkPredicate,
      onChangeAddresses,
      onChangeMac,
      onChangeNetwork,
      onDelete,
      pool,
      resourceSet,
      vif
    } = this.props

    return <LineItem>
      <Item label={_('newVmMacLabel')}>
        <DebounceInput
          className='form-control'
          debounceTimeout={DEBOUNCE_TIMEOUT}
          onChange={onChangeMac}
          placeholder={formatMessage(messages.newVmMacPlaceholder)}
          rows={7}
          value={vif.mac}
        />
      </Item>
      <Item label={_('newVmNetworkLabel')}>
        <span className={styles.inlineSelect}>
          {pool ? <SelectNetwork
            onChange={onChangeNetwork}
            predicate={networkPredicate}
            value={vif.network}
          />
          : <SelectResourceSetsNetwork
            onChange={onChangeNetwork}
            resourceSet={resourceSet}
            value={vif.network}
          />}
        </span>
      </Item>
      <LineItem>
        <span className={styles.inlineSelect}>
          {pool ? <SelectIp
            containerPredicate={ipPoolPredicate}
            multi
            onChange={onChangeAddresses}
            value={vif.addresses}
          />
          : <SelectResourceSetIp
            containerPredicate={ipPoolPredicate}
            multi
            onChange={onChangeAddresses}
            resourceSetId={resourceSet.id}
            value={vif.addresses}
          />}
        </span>
      </LineItem>
      <Item>
        <Button onClick={onDelete} bsStyle='secondary'>
          <Icon icon='new-vm-remove' />
        </Button>
      </Item>
    </LineItem>
  }
}

// =============================================================================

@addSubscriptions({
  resourceSets: subscribeResourceSets,
  permissions: subscribePermissions,
  user: subscribeCurrentUser
})
@connectStore(() => ({
  isAdmin: createSelector(
    getUser,
    user => user && user.permission === 'admin'
  ),
  networks: createGetObjectsOfType('network').sort(),
  pool: createGetObject((_, props) => props.location.query.pool),
  pools: createGetObjectsOfType('pool'),
  templates: createGetObjectsOfType('VM-template').sort(),
  userSshKeys: createSelector(
    (_, props) => {
      const user = props.user
      return user && user.preferences && user.preferences.sshKeys
    },
    keys => keys
  ),
  srs: createGetObjectsOfType('SR')
}))
@injectIntl
export default class NewVm extends BaseComponent {
  static contextTypes = {
    router: React.PropTypes.object
  }

  constructor () {
    super()

    this._uniqueId = 0
    // NewVm's form's state is stored in this.state.state instead of this.state
    // so it can be emptied easily with this.setState({ state: {} })
    this.state = { state: {} }
  }

  componentDidMount () {
    this._reset()
  }

  _getResourceSet = () => {
    const { location: { query: { resourceSet: resourceSetId } }, resourceSets } = this.props
    return resourceSets && find(resourceSets, ({ id }) => id === resourceSetId)
  }

  _getResolvedResourceSet = createSelector(
    this._getResourceSet,
    resolveResourceSet
  )

// Utils -----------------------------------------------------------------------

  getUniqueId () {
    return this._uniqueId++
  }
  get _isDiskTemplate () {
    const { template } = this.state.state
    return template &&
      template.template_info.disks.length === 0 && template.name_label !== 'Other install media'
  }
  _setState = (newValues, callback) => {
    this.setState({ state: {
      ...this.state.state,
      ...newValues
    }}, callback)
  }
  _replaceState = (state, callback) =>
    this.setState({ state }, callback)
  _linkState = (path, targetPath) =>
    this.linkState(`state.${path}`, targetPath)
  _toggleState = path =>
    this.toggleState(`state.${path}`)

// Actions ---------------------------------------------------------------------

  _reset = () => {
    this._replaceState({
      bootAfterCreate: true,
      configDrive: false,
      CPUs: '',
      cpuCap: '',
      cpuWeight: '',
      existingDisks: {},
      fastClone: true,
      multipleVms: false,
      name_label: '',
      name_description: '',
      nameLabels: map(Array(NB_VMS_MIN), (_, index) => `VM_${index + 1}`),
      namePattern: '{name}_%',
      nbVms: NB_VMS_MIN,
      VDIs: [],
      VIFs: [],
      seqStart: 1,
      share: false,
      tags: []
    })
  }

  _create = () => {
    const { state } = this.state
    let installation
    switch (state.installMethod) {
      case 'ISO':
        installation = {
          method: 'cdrom',
          repository: state.installIso.id
        }
        break
      case 'network':
        const matches = /^(http|ftp|nfs)/i.exec(state.installNetwork)
        if (!matches) {
          throw new Error('invalid network URL')
        }
        installation = {
          method: matches[1].toLowerCase(),
          repository: state.installNetwork
        }
        break
      case 'PXE':
        installation = {
          method: 'network',
          repository: 'pxe'
        }
    }

    let cloudConfig
    if (state.configDrive) {
      const hostname = state.name_label.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '-')
      if (state.installMethod === 'SSH') {
        cloudConfig = `#cloud-config\nhostname: ${hostname}\nssh_authorized_keys:\n${
          join(map(state.sshKeys, keyId => {
            return this.props.userSshKeys[keyId] ? `  - ${this.props.userSshKeys[keyId].key}\n` : ''
          }), '')
        }`
      } else {
        cloudConfig = state.customConfig
      }
    } else if (state.template.name_label === 'CoreOS') {
      cloudConfig = state.cloudConfig
    }

    // Split allowed IPs into IPv4 and IPv6
    const { VIFs } = state
    const _VIFs = map(VIFs, vif => {
      const _vif = { ...vif }
      delete _vif.addresses
      _vif.allowedIpv4Addresses = []
      _vif.allowedIpv6Addresses = []
      forEach(vif.addresses, ip => {
        if (!isIp(ip)) {
          return
        }
        if (isIp.v4(ip)) {
          _vif.allowedIpv4Addresses.push(ip)
        } else {
          _vif.allowedIpv6Addresses.push(ip)
        }
      })
      return _vif
    })

    const resourceSet = this._getResourceSet()

    const data = {
      affinityHost: state.affinityHost && state.affinityHost.id,
      clone: !this.isDiskTemplate && state.fastClone,
      existingDisks: state.existingDisks,
      installation,
      name_label: state.name_label,
      template: state.template.id,
      VDIs: state.VDIs,
      VIFs: _VIFs,
      resourceSet: resourceSet && resourceSet.id,
      // vm.set parameters
      CPUs: state.CPUs,
      cpuWeight: state.cpuWeight === '' ? null : state.cpuWeight,
      cpuCap: state.cpuCap === '' ? null : state.cpuCap,
      name_description: state.name_description,
      memoryStaticMax: state.memoryStaticMax,
      memoryMin: state.memoryDynamicMin,
      memoryMax: state.memoryDynamicMax,
      pv_args: state.pv_args,
      autoPoweron: state.autoPoweron,
      bootAfterCreate: state.bootAfterCreate,
      share: state.share,
      cloudConfig,
      coreOs: state.template.name_label === 'CoreOS',
      tags: state.tags
    }

    return state.multipleVms ? createVms(data, state.nameLabels) : createVm(data)
  }

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

    this._setState({ template })

    const storeState = store.getState()
    const isInResourceSet = this._getIsInResourceSet()
    const { state } = this.state
    const { pool } = this.props
    const resourceSet = this._getResolvedResourceSet()

    const existingDisks = {}
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(storeState, vbdId, resourceSet)
      if (!vbd || vbd.is_cd_drive) {
        return
      }
      const vdi = getObject(storeState, vbd.VDI, resourceSet)
      if (vdi) {
        existingDisks[this.getUniqueId()] = {
          name_label: vdi.name_label,
          name_description: vdi.name_description,
          size: vdi.size,
          $SR: pool || isInResourceSet(vdi.$SR)
            ? vdi.$SR
            : resourceSet.objectsByType['SR'][0].id
        }
      }
    })

    const VIFs = []
    forEach(template.VIFs, vifId => {
      const vif = getObject(storeState, vifId, resourceSet)
      VIFs.push({
        id: this.getUniqueId(),
        network: pool || isInResourceSet(vif.$network)
          ? vif.$network
          : resourceSet.objectsByType['network'][0].id
      })
    })
    if (VIFs.length === 0) {
      const networkId = this._getDefaultNetworkId()
      VIFs.push({
        id: this.getUniqueId(),
        network: networkId
      })
    }
    const name_label = state.name_label === '' || !state.name_labelHasChanged ? template.name_label : state.name_label
    const name_description = state.name_description === '' || !state.name_descriptionHasChanged ? template.name_description || '' : state.name_description
    const replacer = this._buildTemplate()
    this._setState({
      // infos
      name_label,
      template,
      name_description,
      nameLabels: map(Array(+state.nbVms), (_, index) => replacer({ name_label, name_description, template }, index + 1)),
      // performances
      CPUs: template.CPUs.number,
      cpuCap: '',
      cpuWeight: '',
      memoryDynamicMax: template.memory.dynamic[1],
      // installation
      installMethod: template.install_methods && template.install_methods[0] || 'SSH',
      sshKeys: this.props.userSshKeys && this.props.userSshKeys.length && [ 0 ],
      customConfig: '#cloud-config\n#hostname: myhostname\n#ssh_authorized_keys:\n#  - ssh-rsa <myKey>\n#packages:\n#  - htop\n',
      // interfaces
      VIFs,
      // disks
      existingDisks,
      VDIs: map(template.template_info.disks, disk => {
        const device = String(this.getUniqueId())
        return {
          ...disk,
          device,
          name_description: disk.name_description || 'Created by XO',
          name_label: (name_label || 'disk') + '_' + device,
          SR: pool
            ? pool.default_SR
            : resourceSet.objectsByType['SR'][0].id
        }
      })
    })

    if (template.name_label === 'CoreOS') {
      getCloudInitConfig(template.id).then(
        cloudConfig => this._setState({ cloudConfig }),
        noop
      )
    }
  }

// Selectors -------------------------------------------------------------------

  _getIsInPool = createSelector(
    () => {
      const { pool } = this.props
      return pool && pool.id
    },
    poolId => ({ $pool }) =>
      $pool === poolId
  )
  _getIsInResourceSet = createSelector(
    () => {
      const resourceSet = this._getResourceSet()
      return resourceSet && resourceSet.objects
    },
    objectsIds => id => includes(objectsIds, id)
  )

  _getCanOperate = createSelector(
    () => this.props.permissions,
    permissions => ({ id }) =>
      this.props.isAdmin || permissions && permissions[id] && permissions[id].operate
  )
  _getVmPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => vm =>
      isInResourceSet(vm.id) || isInPool(vm)
  )
  _getSrPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => disk =>
      (isInResourceSet(disk.id) || isInPool(disk)) && disk.content_type !== 'iso' && disk.size > 0
  )
  _getIsoPredicate = createSelector(
    () => this.props.pool && this.props.pool.id,
    poolId => sr => (poolId == null || poolId === sr.$pool) && sr.SR_type === 'iso'
  )
  _getIpPoolPredicate = createSelector(
    () => !!this.props.pool,
    () => {
      const { resourceSet } = this.props
      return resourceSet && resourceSet.ipPools
    },
    () => this.props.vif,
    (pool, ipPools, vif) => ipPool => {
      if (!ipPool) {
        return false
      }
      return pool || (
        ipPools &&
        includes(ipPools, ipPool.id) &&
        find(ipPool.networks, ipPoolNetwork => ipPoolNetwork === vif.network)
      )
    }
  )
  _getNetworkPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => network =>
      isInResourceSet(network.id) || isInPool(network)
  )
  _getPoolNetworks = createSelector(
    () => this.props.networks,
    () => {
      const { pool } = this.props
      return pool && pool.id
    },
    (networks, poolId) => filter(networks, network => network.$pool === poolId)
  )
  _getOperatablePools = createFilter(
    () => this.props.pools,
    this._getCanOperate,
    [ (pool, canOperate) => canOperate(pool) ]
  )
  _getAffinityHostPredicate = createSelector(
    () => this.props.pool,
    () => this.state.state.existingDisks,
    () => this.state.state.VDIs,
    () => this.props.srs,
    (pool, existingDisks, VDIs, srs) => {
      if (!srs) {
        return false
      }

      const containers = [
        ...map(existingDisks, disk => get(srs, `${disk.$SR}.$container`)),
        ...map(VDIs, disk => get(srs, `${disk.SR}.$container`))
      ]
      return host => host.$pool === pool.id &&
        every(containers, container =>
          container === pool.id || container === host.id
        )
    }
  )
  _getDefaultNetworkId = () => {
    const resourceSet = this._getResolvedResourceSet()
    if (resourceSet) {
      const { network } = resourceSet.objectsByType
      return !isEmpty(network) && network[0].id
    }
    const network = find(this._getPoolNetworks(), network => {
      const pif = getObject(store.getState(), network.PIFs[0])
      return pif && pif.management
    })
    return network && network.id
  }
  _buildTemplate = createSelector(
    () => this.state.state.namePattern,
    namePattern => buildTemplate(namePattern, {
      '{name}': state => state.name_label || '',
      '%': (_, i) => i
    })
  )

// On change -------------------------------------------------------------------
  /*
   * if index: the element to be modified should be an array/object
   * if stateObjectProp: the array/object contains objects and stateObjectProp needs to be modified
   * if targetObjectProp: the event target value is an object and the new value is the targetObjectProp of this object
   *
   * SCHEMA:                                      EXAMPLE:
   *
   * state: {                                     this.state.state: {
   *   [prop]: {                                    existingDisks: {
   *     [index]: {                                   0: {
   *       [stateObjectProp]: TO BE MODIFIED            name_label: TO BE MODIFIED
   *       ...                                          name_description
   *     }                                              ...
   *     ...                                          }
   *   }                                              1: {...}
   *   ...                                          }
   * }                                            }
   */
  _getOnChange (prop, index, stateObjectProp, targetObjectProp) {
    return event => {
      let value
      if (index !== undefined) { // The element should be an array or an object
        value = this.state.state[prop]
        value = isArray(value) ? [ ...value ] : { ...value } // Clone the element
        let eventValue = getEventValue(event)
        eventValue = targetObjectProp ? eventValue[targetObjectProp] : eventValue // Get the new value
        if (value[index] && stateObjectProp) {
          value[index][stateObjectProp] = eventValue
        } else {
          value[index] = eventValue
        }
      } else {
        value = getEventValue(event)
      }
      this._setState({ [prop]: value })
    }
  }
  _getOnChangeCheckbox (prop, index, stateObjectProp) {
    return event => {
      let value
      if (index !== undefined) {
        value = this.state.state[prop]
        value = [ ...value ]
        let eventValue = event.target.checked
        stateObjectProp ? value[index][stateObjectProp] = eventValue : value[index] = eventValue
      } else {
        value = event.target.checked
      }
      this._setState({ [prop]: value })
    }
  }
  _onChangeSshKeys = keys => this._setState({ sshKeys: map(keys, key => key.id) })

  _updateNbVms = () => {
    const { nbVms, nameLabels, seqStart } = this.state.state
    const nbVmsClamped = clamp(nbVms, NB_VMS_MIN, NB_VMS_MAX)
    const newNameLabels = [ ...nameLabels ]

    if (nbVmsClamped < nameLabels.length) {
      this._setState({ nameLabels: slice(newNameLabels, 0, nbVmsClamped) })
    } else {
      const replacer = this._buildTemplate()
      for (let i = +seqStart + nameLabels.length; i <= +seqStart + nbVmsClamped - 1; i++) {
        newNameLabels.push(replacer(this.state.state, i))
      }
      this._setState({ nameLabels: newNameLabels })
    }
  }
  _updateNameLabels = () => {
    const { nameLabels, seqStart } = this.state.state
    const nbVms = nameLabels.length
    const newNameLabels = []
    const replacer = this._buildTemplate()

    for (let i = +seqStart; i <= +seqStart + nbVms - 1; i++) {
      newNameLabels.push(replacer(this.state.state, i))
    }
    this._setState({ nameLabels: newNameLabels })
  }
  _selectResourceSet = resourceSet => {
    const { pathname } = this.props.location

    this.context.router.push({
      pathname,
      query: resourceSet && { resourceSet: resourceSet.id }
    })
    this._reset()
  }
  _selectPool = pool => {
    const { pathname } = this.props.location

    this.context.router.push({
      pathname,
      query: pool && { pool: pool.id }
    })
    this._reset()
  }
  _addVdi = () => {
    const { state } = this.state
    const { pool } = this.props
    const device = String(this.getUniqueId())

    this._setState({ VDIs: [ ...state.VDIs, {
      device,
      name_description: 'Created by XO',
      name_label: (state.name_label || 'disk') + '_' + device,
      SR: pool && pool.default_SR,
      type: 'system'
    }] })
  }
  _removeVdi = index => {
    const { VDIs } = this.state.state

    this._setState({ VDIs: [ ...VDIs.slice(0, index), ...VDIs.slice(index + 1) ] })
  }
  _addInterface = () => {
    const networkId = this._getDefaultNetworkId()

    this._setState({ VIFs: [ ...this.state.state.VIFs, {
      id: this.getUniqueId(),
      network: networkId
    }] })
  }
  _removeInterface = index => {
    const { VIFs } = this.state.state

    this._setState({ VIFs: [ ...VIFs.slice(0, index), ...VIFs.slice(index + 1) ] })
  }

  _addNewSshKey = () => {
    const { newSshKey, sshKeys } = this.state.state
    const { userSshKeys } = this.props
    const splitKey = newSshKey.split(' ')
    const title = splitKey.length === 3 ? splitKey[2].split('\n')[0] : newSshKey.substring(newSshKey.length - 10, newSshKey.length)

    // save key
    addSshKey({
      title,
      key: newSshKey
    }).then(() => {
      // select key
      this._setState({
        sshKeys: [ ...(sshKeys || []), userSshKeys ? userSshKeys.length : 0 ],
        newSshKey: ''
      })
    })
  }

  _getRedirectionUrl = id =>
    this.state.state.multipleVms ? '/home' : `/vms/${id}`

// MAIN ------------------------------------------------------------------------

  _renderHeader = () => {
    const { pool } = this.props
    const showSelectPool = !isEmpty(this._getOperatablePools())
    const showSelectResourceSet = !this.props.isAdmin && !isEmpty(this.props.resourceSets)
    const selectPool = <span className={styles.inlineSelect}>
      <SelectPool
        onChange={this._selectPool}
        predicate={this._getCanOperate()}
        value={pool}
      />
    </span>
    const selectResourceSet = <span className={styles.inlineSelect}>
      <SelectResourceSet
        onChange={this._selectResourceSet}
        value={this.props.location.query.resourceSet}
      />
    </span>
    return <Container>
      <Row>
        <Col mediumSize={12}>
          <h2>
            {showSelectPool && showSelectResourceSet
              ? _('newVmCreateNewVmOn2', {
                select1: selectPool,
                select2: selectResourceSet
              })
              : showSelectPool || showSelectResourceSet
              ? _('newVmCreateNewVmOn', {
                select: showSelectPool ? selectPool : selectResourceSet
              })
              : _('newVmCreateNewVmNoPermission')
            }
          </h2>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { pool } = this.props
    return <Page header={this._renderHeader()}>
      {(pool || this._getResourceSet()) && <form id='vmCreation'>
        <Wizard>
          {this._renderInfo()}
          {this._renderPerformances()}
          {this._renderInstallSettings()}
          {this._renderInterfaces()}
          {this._renderDisks()}
          {this._renderAdvanced()}
          {this._renderSummary()}
        </Wizard>
        <div className={styles.submitSection}>
          <ActionButton
            btnStyle='secondary'
            className={styles.button}
            handler={this._reset}
            icon='new-vm-reset'
          >
            {_('newVmReset')}
          </ActionButton>
          <ActionButton
            btnStyle='primary'
            className={styles.button}
            disabled={!(
              this._isInfoDone() &&
              this._isPerformancesDone() &&
              this._isInstallSettingsDone() &&
              this._isInterfacesDone() &&
              this._isDisksDone() &&
              this._isAdvancedDone()
            ) || !this._availableResources()}
            form='vmCreation'
            handler={this._create}
            icon='new-vm-create'
            redirectOnSuccess={this._getRedirectionUrl}
          >
            {_('newVmCreate')}
          </ActionButton>
        </div>
      </form>}
    </Page>
  }

// INFO ------------------------------------------------------------------------

  _renderInfo = () => {
    const {
      name_description,
      name_label,
      template
    } = this.state.state
    return <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfoDone()}>
      <SectionContent>
        <Item label={_('newVmTemplateLabel')}>
          <span className={styles.inlineSelect}>
            {this.props.pool ? <SelectVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              predicate={this._getVmPredicate()}
              value={template}
            />
            : <SelectResourceSetsVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              resourceSet={this._getResolvedResourceSet()}
              value={template}
            />}
          </span>
        </Item>
        <Item label={_('newVmNameLabel')}>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            onChange={this._getOnChange('name_label')}
            value={name_label}
          />
        </Item>
        <Item label={_('newVmDescriptionLabel')}>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            onChange={this._getOnChange('name_description')}
            value={name_description}
          />
        </Item>
      </SectionContent>
    </Section>
  }
  _isInfoDone = () => {
    const { template, name_label } = this.state.state
    return name_label && template
  }

  _renderPerformances = () => {
    const { CPUs, memoryDynamicMax } = this.state.state
    return <Section icon='new-vm-perf' title='newVmPerfPanel' done={this._isPerformancesDone()}>
      <SectionContent>
        <Item label={_('newVmVcpusLabel')}>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            min={0}
            onChange={this._getOnChange('CPUs')}
            type='number'
            value={CPUs}
          />
        </Item>
        <Item label={_('newVmRamLabel')}>
          <SizeInput
            className={styles.sizeInput}
            onChange={this._linkState('memoryDynamicMax')}
            value={firstDefined(memoryDynamicMax, null)}
          />
        </Item>
      </SectionContent>
    </Section>
  }
  _isPerformancesDone = () => {
    const { CPUs, memoryDynamicMax } = this.state.state
    return CPUs && memoryDynamicMax != null
  }

// INSTALL SETTINGS ------------------------------------------------------------

  _renderInstallSettings = () => {
    const { template } = this.state.state
    if (!template) {
      return
    }
    const {
      cloudConfig,
      configDrive,
      customConfig,
      installIso,
      installMethod,
      installNetwork,
      newSshKey,
      pv_args,
      sshKeys
    } = this.state.state
    const { formatMessage } = this.props.intl
    return <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
      {this._isDiskTemplate ? <SectionContent key='diskTemplate' column>
        <LineItem>
          <div className={styles.configDrive}>
            <span className={styles.configDriveToggle}>
              {_('newVmConfigDrive')}
            </span>
            &nbsp;
            <span className={styles.configDriveToggle}>
              <Toggle
                value={configDrive}
                onChange={this._getOnChange('configDrive')}
              />
            </span>
          </div>
        </LineItem>
        <LineItem>
          <span>
            <input
              checked={installMethod === 'SSH'}
              disabled={!configDrive}
              name='installMethod'
              onChange={this._getOnChange('installMethod')}
              type='radio'
              value='SSH'
            />
            {' '}
            <span>{_('newVmSshKey')}</span>
          </span>
          &nbsp;
          <span className={classNames('input-group', styles.fixedWidth)}>
            <DebounceInput
              className='form-control'
              disabled={!configDrive || installMethod !== 'SSH'}
              debounceTimeout={DEBOUNCE_TIMEOUT}
              onChange={this._getOnChange('newSshKey')}
              value={newSshKey}
            />
            <span className='input-group-btn'>
              <Button className='btn btn-secondary' onClick={this._addNewSshKey} disabled={!newSshKey}>
                <Icon icon='add' />
              </Button>
            </span>
          </span>
          {this.props.userSshKeys && this.props.userSshKeys.length > 0 && <span className={styles.fixedWidth}>
            <SelectSshKey
              disabled={!configDrive || installMethod !== 'SSH'}
              onChange={this._onChangeSshKeys}
              multi
              value={sshKeys || []}
            />
          </span>}
        </LineItem>
        <LineItem>
          <input
            checked={installMethod === 'customConfig'}
            disabled={!configDrive}
            name='installMethod'
            onChange={this._getOnChange('installMethod')}
            type='radio'
            value='customConfig'
          />
          &nbsp;
          <span>{_('newVmCustomConfig')}</span>
          &nbsp;
          <DebounceInput
            className={classNames('form-control', styles.customConfig)}
            debounceTimeout={DEBOUNCE_TIMEOUT}
            disabled={!configDrive || installMethod !== 'customConfig'}
            element='textarea'
            onChange={this._getOnChange('customConfig')}
            value={customConfig}
          />
        </LineItem>
      </SectionContent>
      : <SectionContent>
        <Item>
          <span className={styles.item}>
            <input
              checked={installMethod === 'ISO'}
              name='installMethod'
              onChange={this._getOnChange('installMethod')}
              type='radio'
              value='ISO'
            />
            &nbsp;
            <span>{_('newVmIsoDvdLabel')}</span>
            &nbsp;
            <span className={styles.inlineSelect}>
              {this.props.pool ? <SelectVdi
                disabled={installMethod !== 'ISO'}
                onChange={this._getOnChange('installIso')}
                srPredicate={this._getIsoPredicate()}
                value={installIso}
              />
              : <SelectResourceSetsVdi
                disabled={installMethod !== 'ISO'}
                onChange={this._getOnChange('installIso')}
                resourceSet={this._getResolvedResourceSet()}
                srPredicate={this._getIsoPredicate()}
                value={installIso}
              />}
            </span>
          </span>
        </Item>
        {template.virtualizationMode === 'pv'
          ? <span>
            <Item>
              <input
                checked={installMethod === 'network'}
                name='installMethod'
                onChange={this._getOnChange('installMethod')}
                type='radio'
                value='network'
              />
              {' '}
              <span>{_('newVmNetworkLabel')}</span>
              {' '}
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                disabled={installMethod !== 'network'}
                key='networkInput'
                onChange={this._getOnChange('installNetwork')}
                placeholder={formatMessage(messages.newVmInstallNetworkPlaceHolder)}
                value={installNetwork}
              />
            </Item>
            <Item label={_('newVmPvArgsLabel')} key='pv'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('pv_args')}
                value={pv_args}
              />
            </Item>
          </span>
          : <Item>
            <input
              checked={installMethod === 'PXE'}
              name='installMethod'
              onChange={this._getOnChange('installMethod')}
              type='radio'
              value='PXE'
            />
            {' '}
            <span>{_('newVmPxeLabel')}</span>
          </Item>
        }
      </SectionContent>}
      {template.name_label === 'CoreOS' && <div>
        <label>{_('newVmCloudConfig')}</label>
        <DebounceInput
          className='form-control'
          debounceTimeout={DEBOUNCE_TIMEOUT}
          element='textarea'
          onChange={this._getOnChange('cloudConfig')}
          rows={7}
          value={cloudConfig}
        />
      </div>}
    </Section>
  }
  _isInstallSettingsDone = () => {
    const {
      configDrive,
      customConfig,
      installIso,
      installMethod,
      installNetwork,
      sshKeys,
      template
    } = this.state.state
    switch (installMethod) {
      case 'customConfig': return customConfig || !configDrive
      case 'ISO': return installIso
      case 'network': return /^(http|ftp|nfs)/i.exec(installNetwork)
      case 'PXE': return true
      case 'SSH': return !isEmpty(sshKeys) || !configDrive
      default: return template && this._isDiskTemplate && !configDrive
    }
  }

// INTERFACES ------------------------------------------------------------------

  _renderInterfaces = () => {
    const { state: { VIFs } } = this.state

    return <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
      <SectionContent column>
        {map(VIFs, (vif, index) => <div key={index}>
          <Vif
            onChangeAddresses={this._linkState(`VIFs.${index}.addresses`, '*.id')}
            onChangeMac={this._linkState(`VIFs.${index}.mac`)}
            onChangeNetwork={this._linkState(`VIFs.${index}.network`, 'id')}
            onDelete={() => this._removeInterface(index)}
            pool={this.props.pool}
            resourceSet={this._getResolvedResourceSet()}
            vif={vif}
          />
          {index < VIFs.length - 1 && <hr />}
        </div>)}
        <Item>
          <Button onClick={this._addInterface} bsStyle='secondary'>
            <Icon icon='new-vm-add' />
            {' '}
            {_('newVmAddInterface')}
          </Button>
        </Item>
      </SectionContent>
    </Section>
  }
  _isInterfacesDone = () => every(this.state.state.VIFs, vif =>
    vif.network
  )

// DISKS -----------------------------------------------------------------------

  _renderDisks = () => {
    const {
      state: {
        configDrive,
        existingDisks,
        VDIs
      }
    } = this.state
    const { pool } = this.props
    let i = 0
    const resourceSet = this._getResolvedResourceSet()

    return <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
      <SectionContent column>

        {/* Existing disks */}
        {map(existingDisks, (disk, index) => <div key={i}>
          <LineItem>
            <Item label={_('newVmSrLabel')}>
              <span className={styles.inlineSelect}>
                {pool ? <SelectSr
                  onChange={this._getOnChange('existingDisks', index, '$SR', 'id')}
                  predicate={this._getSrPredicate()}
                  value={disk.$SR}
                />
                : <SelectResourceSetsSr
                  onChange={this._getOnChange('existingDisks', index, '$SR', 'id')}
                  predicate={this._getSrPredicate()}
                  resourceSet={resourceSet}
                  value={disk.$SR}
                />}
              </span>
            </Item>
            {' '}
            <Item label={_('newVmNameLabel')}>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('existingDisks', index, 'name_label')}
                value={disk.name_label}
              />
            </Item>
            <Item label={_('newVmDescriptionLabel')}>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('existingDisks', index, 'name_description')}
                value={disk.name_description}
              />
            </Item>
            <Item label={_('newVmSizeLabel')}>
              <SizeInput
                className={styles.sizeInput}
                onChange={this._getOnChange('existingDisks', index, 'size')}
                readOnly={!configDrive}
                value={firstDefined(disk.size, null)}
              />
            </Item>
          </LineItem>
          {i++ < size(existingDisks) + VDIs.length - 1 && <hr />}
        </div>)}

        {/* VDIs */}
        {map(VDIs, (vdi, index) => <div key={vdi.device}>
          <LineItem>
            <Item label={_('newVmSrLabel')}>
              <span className={styles.inlineSelect}>
                {pool ? <SelectSr
                  onChange={this._getOnChange('VDIs', index, 'SR', 'id')}
                  predicate={this._getSrPredicate()}
                  value={vdi.SR}
                />
                : <SelectResourceSetsSr
                  onChange={this._getOnChange('VDIs', index, 'SR', 'id')}
                  predicate={this._getSrPredicate()}
                  resourceSet={resourceSet}
                  value={vdi.SR}
                />}
              </span>
            </Item>
            <Item label={_('newVmNameLabel')}>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('VDIs', index, 'name_label')}
                value={vdi.name_label}
              />
            </Item>
            <Item label={_('newVmDescriptionLabel')}>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('VDIs', index, 'name_description')}
                value={vdi.name_description}
              />
            </Item>
            <Item label={_('newVmSizeLabel')}>
              <SizeInput
                className={styles.sizeInput}
                onChange={this._getOnChange('VDIs', index, 'size')}
                value={firstDefined(vdi.size, null)}
              />
            </Item>
            <Item>
              <Button onClick={() => this._removeVdi(index)} bsStyle='secondary'>
                <Icon icon='new-vm-remove' />
              </Button>
            </Item>
          </LineItem>
          {index < VDIs.length - 1 && <hr />}
        </div>)}
        <Item>
          <Button onClick={this._addVdi} bsStyle='secondary'>
            <Icon icon='new-vm-add' />
            {' '}
            {_('newVmAddDisk')}
          </Button>
        </Item>
      </SectionContent>
    </Section>
  }
  _isDisksDone = () => every(this.state.state.VDIs, vdi =>
      vdi.SR && vdi.name_label && vdi.size !== undefined
    ) &&
    every(this.state.state.existingDisks, (vdi, index) =>
      vdi.$SR && vdi.name_label && vdi.size !== undefined
    )

// ADVANCED --------------------------------------------------------------------

  _renderAdvanced = () => {
    const {
      affinityHost,
      autoPoweron,
      bootAfterCreate,
      cpuCap,
      cpuWeight,
      memoryDynamicMin,
      memoryDynamicMax,
      memoryStaticMax,
      multipleVms,
      nameLabels,
      namePattern,
      nbVms,
      seqStart,
      share,
      showAdvanced,
      tags
    } = this.state.state
    const { formatMessage } = this.props.intl
    return <Section icon='new-vm-advanced' title='newVmAdvancedPanel' done={this._isAdvancedDone()}>
      <SectionContent column>
        <Button bsStyle='secondary' onClick={this._toggleState('showAdvanced')}>
          {showAdvanced ? _('newVmHideAdvanced') : _('newVmShowAdvanced')}
        </Button>
      </SectionContent>
      {showAdvanced && [
        <hr />,
        <SectionContent>
          <Item>
            <input
              checked={bootAfterCreate}
              onChange={this._getOnChangeCheckbox('bootAfterCreate')}
              type='checkbox'
            />
            &nbsp;
            {_('newVmBootAfterCreate')}
          </Item>
          <Item>
            <input
              checked={autoPoweron}
              onChange={this._getOnChangeCheckbox('autoPoweron')}
              type='checkbox'
            />
            &nbsp;
            {_('autoPowerOn')}
          </Item>
          <Item className={styles.tags}>
            <Tags labels={tags} onChange={this._linkState('tags')} />
          </Item>
        </SectionContent>,
        <SectionContent>
          <Item>
            <input
              checked={share}
              onChange={this._getOnChangeCheckbox('share')}
              type='checkbox'
            />
            &nbsp;
            {_('newVmShare')}
          </Item>
        </SectionContent>,
        <SectionContent>
          <Item label={_('newVmCpuWeightLabel')}>
            <DebounceInput
              className='form-control'
              debounceTimeout={DEBOUNCE_TIMEOUT}
              min={0}
              max={65535}
              onChange={this._getOnChange('cpuWeight')}
              placeholder={formatMessage(messages.newVmDefaultCpuWeight, { value: XEN_DEFAULT_CPU_WEIGHT })}
              type='number'
              value={cpuWeight}
            />
          </Item>
          <Item label={_('newVmCpuCapLabel')}>
            <DebounceInput
              className='form-control'
              debounceTimeout={DEBOUNCE_TIMEOUT}
              min={0}
              onChange={this._getOnChange('cpuCap')}
              placeholder={formatMessage(messages.newVmDefaultCpuCap, { value: XEN_DEFAULT_CPU_CAP })}
              type='number'
              value={cpuCap}
            />
          </Item>
        </SectionContent>,
        <SectionContent>
          <Item label={_('newVmDynamicMinLabel')}>
            <SizeInput value={firstDefined(memoryDynamicMin, null)} onChange={this._linkState('memoryDynamicMin')} className={styles.sizeInput} />
          </Item>
          <Item label={_('newVmDynamicMaxLabel')}>
            <SizeInput value={firstDefined(memoryDynamicMax, null)} onChange={this._linkState('memoryDynamicMax')} className={styles.sizeInput} />
          </Item>
          <Item label={_('newVmStaticMaxLabel')}>
            <SizeInput value={firstDefined(memoryStaticMax, null)} onChange={this._linkState('memoryStaticMax')} className={styles.sizeInput} />
          </Item>
        </SectionContent>,
        <SectionContent>
          <Item label={_('newVmMultipleVms')}>
            <Toggle value={multipleVms} onChange={this._getOnChange('multipleVms')} />
          </Item>
          <Item label={_('newVmMultipleVmsPattern')}>
            <DebounceInput
              className='form-control'
              debounceTimeout={DEBOUNCE_TIMEOUT}
              disabled={!multipleVms}
              onChange={this._getOnChange('namePattern')}
              placeholder={formatMessage(messages.newVmMultipleVmsPatternPlaceholder)}
              value={namePattern}
            />
          </Item>
          <Item label={_('newVmFirstIndex')}>
            <DebounceInput
              className={'form-control'}
              debounceTimeout={DEBOUNCE_TIMEOUT}
              disabled={!multipleVms}
              onChange={this._getOnChange('seqStart')}
              type='number'
              value={seqStart}
            />
          </Item>
          <Item className='input-group'>
            <DebounceInput
              className='form-control'
              debounceTimeout={DEBOUNCE_TIMEOUT}
              disabled={!multipleVms}
              max={NB_VMS_MAX}
              min={NB_VMS_MIN}
              onChange={this._getOnChange('nbVms')}
              type='number'
              value={nbVms}
            />
            <span className='input-group-btn'>
              <Tooltip content={_('newVmNumberRecalculate')}>
                <Button bsStyle='secondary' disabled={!multipleVms} onClick={this._updateNbVms}>
                  <Icon icon='arrow-right' />
                </Button>
              </Tooltip>
            </span>
          </Item>
          <Item>
            <Tooltip content={_('newVmNameRefresh')}>
              <a className={styles.refreshNames} onClick={this._updateNameLabels}><Icon icon='refresh' /></a>
            </Tooltip>
          </Item>
          {multipleVms && <LineItem>
            {map(nameLabels, (nameLabel, index) =>
              <Item key={`nameLabel_${index}`}>
                <input type='text' className='form-control' value={nameLabel} onChange={this._getOnChange('nameLabels', index)} />
              </Item>
            )}
          </LineItem>}
        </SectionContent>,
        <SectionContent>
          <Item label={_('newVmAffinityHost')}>
            <SelectHost
              onChange={this._linkState('affinityHost')}
              predicate={this._getAffinityHostPredicate()}
              value={affinityHost}
            />
          </Item>
        </SectionContent>
      ]}
    </Section>
  }
  _isAdvancedDone = () => {
    const { memoryDynamicMin, memoryDynamicMax, memoryStaticMax } = this.state.state
    return memoryDynamicMax != null &&
      (memoryDynamicMin == null || memoryDynamicMin <= memoryDynamicMax) &&
      (memoryStaticMax == null || memoryDynamicMax <= memoryStaticMax)
  }

// SUMMARY ---------------------------------------------------------------------

  _renderSummary = () => {
    const {
      CPUs,
      existingDisks,
      fastClone,
      memoryDynamicMax,
      multipleVms,
      nameLabels,
      VDIs,
      VIFs
    } = this.state.state

    const factor = multipleVms ? nameLabels.length : 1
    const resourceSet = this._getResourceSet()
    const limits = resourceSet && resourceSet.limits
    const cpusLimits = limits && limits.cpus
    const memoryLimits = limits && limits.memory
    const diskLimits = limits && limits.disk

    return <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
      <Container>
        <Row>
          <Col size={3} className='text-xs-center'>
            <h2>
              {CPUs || 0}x{' '}
              <Icon icon='cpu' />
            </h2>
          </Col>
          <Col size={3} className='text-xs-center'>
            <h2>
              {memoryDynamicMax ? formatSize(memoryDynamicMax) : '0 B'}
              {' '}
              <Icon icon='memory' />
            </h2>
          </Col>
          <Col size={3} className='text-xs-center'>
            <h2>
              {size(existingDisks) + VDIs.length || 0}x{' '}
              <Icon icon='disk' />
            </h2>
          </Col>
          <Col size={3} className='text-xs-center'>
            <h2>
              {VIFs.length}x{' '}
              <Icon icon='network' />
            </h2>
          </Col>
        </Row>
        {limits && <Row>
          <Col size={3}>
            {cpusLimits && <Limits
              limit={cpusLimits.total}
              toBeUsed={CPUs * factor}
              used={cpusLimits.total - cpusLimits.available}
            />}
          </Col>
          <Col size={3}>
            {memoryLimits && <Limits
              limit={memoryLimits.total}
              toBeUsed={memoryDynamicMax * factor}
              used={memoryLimits.total - memoryLimits.available}
            />}
          </Col>
          <Col size={3}>
            {diskLimits && <Limits
              limit={diskLimits.total}
              toBeUsed={(sumBy(VDIs, 'size') + sum(map(existingDisks, disk => disk.size))) * factor}
              used={diskLimits.total - diskLimits.available}
            />}
          </Col>
        </Row>}
      </Container>
      {this._isDiskTemplate && <div style={{display: 'flex'}}>
        <span style={{margin: 'auto'}}>
          <input
            checked={fastClone}
            onChange={this._getOnChangeCheckbox('fastClone')}
            type='checkbox'
          />
          {' '}
          <Icon icon='vm-fast-clone' />
          {' '}
          {_('fastCloneVmLabel')}
        </span>
      </div>}
    </Section>
  }

  _availableResources = () => {
    const resourceSet = this._getResourceSet()

    if (!resourceSet) {
      return true
    }

    const {
      CPUs,
      existingDisks,
      memoryDynamicMax,
      VDIs,
      multipleVms,
      nameLabels
    } = this.state.state
    const factor = multipleVms ? nameLabels.length : 1

    return !(
      CPUs * factor > get(resourceSet, 'limits.cpus.available') ||
      memoryDynamicMax * factor > get(resourceSet, 'limits.memory.available') ||
      (sumBy(VDIs, 'size') + sum(map(existingDisks, disk => disk.size))) * factor > get(resourceSet, 'limits.disk.available')
    )
  }
}
/* eslint-enable camelcase */
