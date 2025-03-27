import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import Button from 'button'
import classNames from 'classnames'
import defined, { get } from '@xen-orchestra/defined'
import Icon from 'icon'
import isIp from 'is-ip'
import Link from 'link'
import Page from '../page'
import PropTypes from 'prop-types'
import React from 'react'
import renderXoItem from 'render-xo-item'
import SelectBootFirmware from 'select-boot-firmware'
import SelectCoresPerSocket from 'select-cores-per-socket'
import store from 'store'
import Tags from 'tags'
import Tooltip from 'tooltip'
import Wizard, { Section } from 'wizard'
import { compileTemplate } from '@xen-orchestra/template'
import { confirm } from 'modal'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import {
  AvailableTemplateVars,
  DEFAULT_CLOUD_CONFIG_TEMPLATE,
  DEFAULT_NETWORK_CONFIG_TEMPLATE,
  NetworkConfigInfo,
} from 'cloud-config'
import { Input as DebounceInput, Textarea as DebounceTextarea } from 'debounce-input-decorator'
import { Limits } from 'usage'
import {
  clamp,
  every,
  filter,
  find,
  forEach,
  includes,
  isEmpty,
  isEqual,
  join,
  map,
  size,
  slice,
  sum,
  sumBy,
} from 'lodash'
import {
  addSshKey,
  createVm,
  createVms,
  getCloudInitConfig,
  getPoolGuestSecureBootReadiness,
  isSrShared,
  subscribeCurrentUser,
  subscribeIpPools,
  subscribeResourceSets,
  XEN_DEFAULT_CPU_CAP,
  XEN_DEFAULT_CPU_WEIGHT,
} from 'xo'
import {
  SelectCloudConfig,
  SelectHost,
  SelectIp,
  SelectNetwork,
  SelectNetworkConfig,
  SelectPool,
  SelectResourceSet,
  SelectResourceSetIp,
  SelectResourceSetsNetwork,
  SelectResourceSetsSr,
  SelectResourceSetsVdi,
  SelectResourceSetsVmTemplate,
  SelectRole,
  SelectSr,
  SelectSshKey,
  SelectSubject,
  SelectVdi,
  SelectVgpuType,
  SelectVmTemplate,
} from 'select-objects'
import { SizeInput, Toggle } from 'form'
import { addSubscriptions, connectStore, formatSize, generateReadableRandomString, resolveIds } from 'utils'
import {
  createFilter,
  createFinder,
  createGetObject,
  createGetObjectsOfType,
  createSelector,
  getIsPoolAdmin,
  getResolvedResourceSets,
  getUser,
} from 'selectors'

import styles from './index.css'

const MULTIPLICAND = 2
const NB_VMS_MIN = 2
const NB_VMS_MAX = 100
const ACL_LEVELS = {
  admin: 'danger',
  operator: 'primary',
  viewer: 'success',
}

/* eslint-disable camelcase */

const getObject = createGetObject((_, id) => id)

// Sub-components

const SectionContent = ({ column, children }) => (
  <div className={classNames('form-inline', styles.sectionContent, column && styles.sectionContentColumn)}>
    {children}
  </div>
)

const LineItem = ({ children }) => <div className={styles.lineItem}>{children}</div>

const Item = ({ label, children, className }) => (
  <span className={styles.item}>
    {label && (
      <span>
        {label}
        &nbsp;
      </span>
    )}
    <span className={classNames(styles.input, className)}>{children}</span>
  </span>
)

@addSubscriptions({
  // eslint-disable-next-line standard/no-callback-literal
  ipPoolsConfigured: cb => subscribeIpPools(ipPools => cb(ipPools.length > 0)),
})
@injectIntl
class Vif extends BaseComponent {
  _getIpPoolPredicate = createSelector(
    () => this.props.vif,
    vif => ipPool => includes(ipPool.networks, vif.network)
  )

  render() {
    const {
      intl: { formatMessage },
      ipPoolsConfigured,
      networkPredicate,
      onChangeAddresses,
      onChangeMac,
      onChangeNetwork,
      onDelete,
      pool,
      resourceSet,
      vif,
    } = this.props

    return (
      <LineItem>
        <Item label={_('newVmMacLabel')}>
          <DebounceInput
            className='form-control'
            onChange={onChangeMac}
            placeholder={formatMessage(messages.newVmMacPlaceholder)}
            rows={7}
            value={vif.mac}
          />
        </Item>
        <Item label={_('newVmNetworkLabel')}>
          <span className={styles.inlineSelect}>
            {pool ? (
              <SelectNetwork onChange={onChangeNetwork} predicate={networkPredicate} value={vif.network} />
            ) : (
              <SelectResourceSetsNetwork
                onChange={onChangeNetwork}
                predicate={networkPredicate}
                resourceSet={resourceSet}
                value={vif.network}
              />
            )}
          </span>
        </Item>
        {ipPoolsConfigured && (
          <LineItem>
            <span className={styles.inlineSelect}>
              {pool ? (
                <SelectIp
                  containerPredicate={this._getIpPoolPredicate()}
                  multi
                  onChange={onChangeAddresses}
                  value={vif.addresses}
                />
              ) : (
                <SelectResourceSetIp
                  containerPredicate={this._getIpPoolPredicate()}
                  multi
                  onChange={onChangeAddresses}
                  resourceSetId={resourceSet.id}
                  value={vif.addresses}
                />
              )}
            </span>
          </LineItem>
        )}
        <Item>
          <Button onClick={onDelete}>
            <Icon icon='new-vm-remove' />
          </Button>
        </Item>
      </LineItem>
    )
  }
}

class AddAclsModal extends BaseComponent {
  get value() {
    return this.state
  }

  render() {
    const { action, subjects } = this.state
    return (
      <form>
        <div className='form-group'>
          <SelectSubject multi onChange={this.linkState('subjects')} value={subjects} />
        </div>
        <div className='form-group'>
          <SelectRole onChange={this.linkState('action')} value={action} />
        </div>
      </form>
    )
  }
}

// =============================================================================

const isVdiPresent = vdi => !vdi.missing

@addSubscriptions({
  resourceSets: subscribeResourceSets,
  user: subscribeCurrentUser,
})
@connectStore(() => {
  const getIsAdmin = createSelector(getUser, user => user && user.permission === 'admin')
  const getNetworks = createGetObjectsOfType('network').sort()
  const getPool = createGetObject((_, props) => props.location.query.pool)
  const getPools = createGetObjectsOfType('pool')
  const getSrs = createGetObjectsOfType('SR')
  const getTemplate = createGetObject((_, props) => props.location.query.template)
  const getTemplates = createGetObjectsOfType('VM-template').sort()
  const getUserSshKeys = createSelector(
    (_, props) => {
      const user = props.user
      return user && user.preferences && user.preferences.sshKeys
    },
    keys => keys
  )
  const getHosts = createGetObjectsOfType('host')
  return (state, props) => ({
    isAdmin: getIsAdmin(state, props),
    isPoolAdmin: getIsPoolAdmin(state, props),
    networks: getNetworks(state, props),
    pool: getPool(state, props),
    pools: getPools(state, props),
    resolvedResourceSets: getResolvedResourceSets(
      state,
      props,
      props.pool === undefined // to get objects as a self user
    ),
    srs: getSrs(state, props),
    template: getTemplate(state, props, props.pool === undefined),
    templates: getTemplates(state, props),
    userSshKeys: getUserSshKeys(state, props),
    hosts: getHosts(state, props),
  })
})
@injectIntl
export default class NewVm extends BaseComponent {
  static contextTypes = {
    router: PropTypes.object,
  }

  constructor() {
    super()

    this._uniqueId = 0
    // NewVm's form's state is stored in this.state.state instead of this.state
    // so it can be emptied easily with this.setState({ state: {} })
    this.state = { state: {} }
  }

  componentDidMount() {
    this._reset(() => {
      const { template } = this.props
      if (template !== undefined) {
        this._initTemplate(this.props.template)
      }
    })
  }

  async componentDidUpdate(prevProps) {
    const template = this.props.template
    if (get(() => prevProps.template.id) !== get(() => template.id)) {
      this._initTemplate(template)
    }

    if (
      !isEqual(prevProps.resourceSets, this.props.resourceSets) ||
      prevProps.location.query.resourceSet !== this.props.location.query.resourceSet
    ) {
      this._setState({
        share: this._getResourceSet()?.shareByDefault ?? false,
      })
    }

    const pool = this.props.pool
    if (
      get(() => prevProps.pool.id) !== get(() => pool.id) ||
      (pool === undefined && get(() => template.id) !== get(() => prevProps.template.id))
    ) {
      const poolId = pool?.id ?? template?.$pool
      this.setState({
        poolGuestSecurebootReadiness: poolId === undefined ? undefined : await getPoolGuestSecureBootReadiness(poolId),
      })
    }
  }

  _getResourceSet = createFinder(
    () => this.props.resourceSets,
    createSelector(
      () => this.props.location.query.resourceSet,
      resourceSetId => resourceSet => (resourceSet !== undefined ? resourceSetId === resourceSet.id : undefined)
    )
  )

  _getResolvedResourceSet = createFinder(
    () => this.props.resolvedResourceSets,
    createSelector(this._getResourceSet, resourceSet =>
      resourceSet !== undefined ? resolvedResourceSet => resolvedResourceSet.id === resourceSet.id : false
    )
  )

  // Utils -----------------------------------------------------------------------

  get _isDiskTemplate() {
    const { template } = this.props
    return template && template.$VBDs.length !== 0 && template.name_label !== 'Other install media'
  }
  _setState = (newValues, callback) => {
    this.setState(
      {
        state: {
          ...this.state.state,
          ...newValues,
        },
      },
      callback
    )
  }
  _replaceState = (state, callback) => this.setState({ state }, callback)
  _linkState = (path, targetPath) => this.linkState(`state.${path}`, targetPath)
  _toggleState = path => this.toggleState(`state.${path}`)

  // Actions ---------------------------------------------------------------------

  _reset = callback => {
    this._replaceState(
      {
        acls: [],
        bootAfterCreate: true,
        copyHostBiosStrings: this._templateHasBiosStrings(),
        coresPerSocket: undefined,
        CPUs: '',
        cpuCap: '',
        cpusMax: '',
        cpuWeight: '',
        destroyCloudConfigVdiAfterBoot: false,
        existingDisks: {},
        fastClone: true,
        hvmBootFirmware: '',
        installMethod: 'noConfigDrive',
        multipleVms: false,
        name_label: '',
        name_description: '',
        nameLabels: map(Array(NB_VMS_MIN), (_, index) => `VM_${index + 1}`),
        namePattern: '{name}%',
        nbVms: NB_VMS_MIN,
        VDIs: [],
        VIFs: [],
        secureBoot: false,
        seqStart: 1,
        share: this._getResourceSet()?.shareByDefault ?? false,
        tags: [],
        createVtpm: this._templateNeedsVtpm(),
      },
      callback
    )
  }

  _selfCreate = () => {
    const { VDIs, existingDisks, memoryDynamicMax } = this.state.state
    const { template } = this.props
    const disksSize = sumBy(VDIs, 'size') + sumBy(existingDisks, 'size')
    const templateDisksSize = sumBy(template.template_info.disks, 'size')
    const templateMemoryDynamicMax = template.memory.dynamic[1]
    const templateVcpusMax = template.CPUs.max

    return this._getCpusMax() > MULTIPLICAND * templateVcpusMax ||
      memoryDynamicMax > MULTIPLICAND * templateMemoryDynamicMax ||
      disksSize > MULTIPLICAND * templateDisksSize
      ? confirm({
          title: _('createVmModalTitle'),
          body: _('createVmModalWarningMessage'),
        }).then(this._create)
      : this._create()
  }

  _create = () => {
    const { state } = this.state
    let installation
    switch (state.installMethod) {
      case 'ISO':
        installation = {
          method: 'cdrom',
          repository: state.installIso.id,
        }
        break
      case 'network':
        const matches = /^(http|ftp|nfs)/i.exec(state.installNetwork)
        if (!matches) {
          throw new Error('invalid network URL')
        }
        installation = {
          method: matches[1].toLowerCase(),
          repository: state.installNetwork,
        }
        break
      case 'PXE':
        installation = {
          method: 'network',
          repository: 'pxe',
        }
    }

    let cloudConfig
    let cloudConfigs
    let networkConfig
    if (state.installMethod !== 'noConfigDrive') {
      if (state.installMethod === 'SSH') {
        const format = hostname => hostname.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '-')
        const stringifiedKeys = join(
          map(state.sshKeys, keyId => {
            return this.props.userSshKeys[keyId] ? `  - ${this.props.userSshKeys[keyId].key}\n` : ''
          }),
          ''
        )

        cloudConfig = `#cloud-config\nhostname: ${format(state.name_label)}\nssh_authorized_keys:\n${stringifiedKeys}`
        if (state.multipleVms) {
          cloudConfigs = map(
            state.nameLabels,
            nameLabel => `#cloud-config\nhostname: ${format(nameLabel)}\nssh_authorized_keys:\n${stringifiedKeys}`
          )
        }
      } else if (state.installMethod === 'customConfig') {
        const replacer = this._buildTemplate(defined(state.customConfig, DEFAULT_CLOUD_CONFIG_TEMPLATE))
        cloudConfig = replacer(this.state.state, 0)
        if (state.multipleVms) {
          const seqStart = state.seqStart
          cloudConfigs = map(state.nameLabels, (_, i) => replacer(state, i + +seqStart))
        }
        networkConfig = state.networkConfig
      }
    } else if (this._isCoreOs()) {
      cloudConfig = state.cloudConfig
      if (state.multipleVms) {
        cloudConfigs = new Array(state.nbVms).fill(state.cloudConfig)
      }
    }

    // Split allowed IPs into IPv4 and IPv6
    const { VIFs } = state
    const _VIFs = map(VIFs, vif => {
      const _vif = { ...vif }
      if (_vif.mac?.trim() === '') {
        delete _vif.mac
      }
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
    const { template } = this.props

    // Either use `memory` OR `memory*` params
    let { memory, memoryStaticMax, memoryDynamicMin, memoryDynamicMax } = state
    if ((memoryStaticMax != null || memoryDynamicMin != null) && memoryDynamicMax == null) {
      memoryDynamicMax = memory
    }
    if (memoryDynamicMax != null) {
      memory = undefined
    }

    const data = {
      acls: state.acls.map(acl => ({ subject: acl.subject.id, action: acl.action.id })),
      affinityHost: state.affinityHost && state.affinityHost.id,
      clone: this._isDiskTemplate && state.fastClone,
      existingDisks: state.existingDisks,
      installation,
      name_label: state.name_label,
      template: template.id,
      VDIs: state.VDIs,
      VIFs: _VIFs,
      resourceSet: resourceSet && resourceSet.id,
      // vm.set parameters
      coresPerSocket: state.coresPerSocket === null ? undefined : state.coresPerSocket,
      CPUs: state.CPUs,
      cpusMax: this._getCpusMax(),
      cpuWeight: state.cpuWeight === '' ? null : state.cpuWeight,
      cpuCap: state.cpuCap === '' ? null : state.cpuCap,
      name_description: state.name_description,
      memory,
      memoryMax: memoryDynamicMax,
      memoryMin: memoryDynamicMin,
      memoryStaticMax,
      pv_args: state.pv_args,
      autoPoweron: state.autoPoweron,
      bootAfterCreate: state.bootAfterCreate,
      copyHostBiosStrings:
        state.hvmBootFirmware !== 'uefi' && !this._templateHasBiosStrings() && state.copyHostBiosStrings,
      createVtpm: state.createVtpm,
      destroyCloudConfigVdiAfterBoot: state.destroyCloudConfigVdiAfterBoot,
      secureBoot: state.secureBoot,
      share: state.share,
      cloudConfig,
      networkConfig: this._isCoreOs() ? undefined : networkConfig,
      coreOs: this._isCoreOs(),
      tags: state.tags,
      vgpuType: get(() => state.vgpuType.id),
      gpuGroup: get(() => state.vgpuType.gpuGroup),
      hvmBootFirmware: state.hvmBootFirmware === '' ? undefined : state.hvmBootFirmware,
    }

    return state.multipleVms ? createVms(data, state.nameLabels, cloudConfigs) : createVm(data)
  }

  _onChangeTemplate = template => {
    const { pathname, query } = this.props.location
    this.context.router.push({
      pathname,
      query: { ...query, template: template && template.id },
    })
  }

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

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
        existingDisks[vbd.position] = {
          name_label: vdi.name_label,
          name_description: vdi.name_description,
          size: vdi.size,
          $SR: pool || isInResourceSet(vdi.$SR) ? vdi.$SR : this._getDefaultSr(template),
        }
      }
    })

    let VIFs = []
    const defaultNetworkIds = this._getDefaultNetworkIds(template)
    forEach(
      // iterate template VIFs in device order
      template.VIFs.map(id => getObject(storeState, id, resourceSet)).sort((a, b) => a.device - b.device),

      vif => {
        VIFs.push({
          network: pool || isInResourceSet(vif.$network) ? vif.$network : defaultNetworkIds[0],
        })
      }
    )
    if (VIFs.length === 0) {
      VIFs = defaultNetworkIds.map(id => ({ network: id }))
    }
    const name_label = state.name_label === '' || !state.name_labelHasChanged ? template.name_label : state.name_label
    const name_description =
      state.name_description === '' || !state.name_descriptionHasChanged
        ? template.other.default_template === 'true' || template.name_description === undefined
          ? ''
          : template.name_description
        : state.name_description
    const replacer = this._buildVmsNameTemplate()
    this._setState({
      // infos
      name_label,
      name_description,
      nameLabels: map(Array(+state.nbVms), (_, index) =>
        replacer({ name_label, name_description, template }, index + 1)
      ),
      copyHostBiosStrings: !isEmpty(template.bios_strings),
      // performances
      CPUs: template.CPUs.number,
      cpusMax: template.CPUs.max,
      cpuCap: '',
      cpuWeight: '',
      hvmBootFirmware: defined(() => template.boot.firmware, ''),
      memory: template.memory.dynamic[1],
      // installation
      installMethod: (template.install_methods != null && template.install_methods[0]) || 'noConfigDrive',
      sshKeys: this.props.userSshKeys && this.props.userSshKeys.length && [0],
      // interfaces
      VIFs,
      // disks
      existingDisks,
      VDIs: map(template.template_info.disks, disk => {
        return {
          ...disk,
          name_description: disk.name_description || 'Created by XO',
          name_label: (name_label || 'disk') + '_' + generateReadableRandomString(5),
          SR: this._getDefaultSr(template),
        }
      }),
      // settings
      secureBoot: template.secureBoot,
      createVtpm: this._templateNeedsVtpm(),
    })

    if (this._isCoreOs()) {
      getCloudInitConfig(template.id).then(
        cloudConfig => this._setState({ cloudConfig, coreOsDefaultTemplateError: false }),
        () => this._setState({ coreOsDefaultTemplateError: true })
      )
    }
  }

  // Selectors -------------------------------------------------------------------

  _getIsInPool = createSelector(
    () => {
      const { pool } = this.props
      return pool && pool.id
    },
    poolId =>
      ({ $pool }) =>
        $pool === poolId
  )
  _getIsInResourceSet = createSelector(
    () => {
      const resourceSet = this._getResourceSet()
      return resourceSet && resourceSet.objects
    },
    objectsIds => id => includes(objectsIds, id)
  )

  _getVmPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => vm => isInResourceSet(vm.id) || isInPool(vm)
  )
  _getSrPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    () => this.props.template,
    () => this.props.pool === undefined,
    (isInPool, isInResourceSet, template, self) => disk =>
      (self ? isInResourceSet(disk.id) : isInPool(disk)) &&
      disk.content_type !== 'iso' &&
      disk.size > 0 &&
      template !== undefined &&
      template.$pool === disk.$pool
  )
  _getIsoPredicate = createSelector(
    () => this.props.pool && this.props.pool.id,
    poolId => sr => (poolId == null || poolId === sr.$pool) && sr.SR_type === 'iso'
  )
  _getNetworkPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    () => this.props.pool === undefined,
    () => this.props.template,
    (isInPool, isInResourceSet, self, template) => network =>
      (self ? isInResourceSet(network.id) : isInPool(network)) &&
      template !== undefined &&
      template.$pool === network.$pool
  )
  _getPoolNetworks = createSelector(
    () => this.props.networks,
    () => {
      const { pool } = this.props
      return pool && pool.id
    },
    (networks, poolId) => filter(networks, network => network.$pool === poolId)
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
        ...map(existingDisks, disk => get(() => srs[disk.$SR].$container)),
        ...map(VDIs, disk => get(() => srs[disk.SR].$container)),
      ]
      return host =>
        host.$pool === pool.id && every(containers, container => container === pool.id || container === host.id)
    }
  )

  _getAutomaticNetworks = createSelector(
    createFilter(this._getPoolNetworks, [network => network.automatic]),
    networks => networks.map(_ => _.id)
  )

  _getDefaultNetworkIds = template => {
    if (template === undefined) {
      return []
    }

    if (this.props.pool === undefined) {
      const network = find(this._getResolvedResourceSet().objectsByType.network, {
        $pool: template.$pool,
      })
      return network !== undefined ? [network.id] : []
    }

    const automaticNetworks = this._getAutomaticNetworks()
    if (automaticNetworks.length !== 0) {
      return automaticNetworks
    }

    const network = find(this._getPoolNetworks(), network => {
      const pif = getObject(store.getState(), network.PIFs[0])
      return pif && pif.management
    })

    return network !== undefined ? [network.id] : []
  }

  _buildVmsNameTemplate = createSelector(
    () => this.state.state.namePattern,
    namePattern => this._buildTemplate(namePattern)
  )

  _buildTemplate = pattern =>
    compileTemplate(pattern, {
      '{index}': (_, i) => i,
      '{name}': state => state.name_label || '',
      '%': (state, i) => (state.multipleVms ? i : '%'),
    })

  _templateHasBiosStrings = createSelector(
    () => this.props.template,
    template => template !== undefined && !isEmpty(template.bios_strings)
  )

  _getVgpuTypePredicate = createSelector(
    () => this.props.pool,
    pool => vgpuType => pool !== undefined && pool.id === vgpuType.$pool
  )

  _isCoreOs = createSelector(
    () => this.props.template,
    template => template && template.name_label === 'CoreOS'
  )

  _isHvm = createSelector(
    () => this.props.template,
    template => template && template.virtualizationMode === 'hvm'
  )

  _templateNeedsVtpm = () => this.props.template?.needsVtpm

  // On change -------------------------------------------------------------------

  _onChangeSshKeys = keys => this._setState({ sshKeys: map(keys, key => key.id) })

  _updateNbVms = () => {
    const { nbVms, nameLabels, seqStart } = this.state.state
    const nbVmsClamped = clamp(nbVms, NB_VMS_MIN, NB_VMS_MAX)
    const newNameLabels = [...nameLabels]

    if (nbVmsClamped < nameLabels.length) {
      this._setState({ nameLabels: slice(newNameLabels, 0, nbVmsClamped) })
    } else {
      const replacer = this._buildVmsNameTemplate()
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
    const replacer = this._buildVmsNameTemplate()

    for (let i = +seqStart; i <= +seqStart + nbVms - 1; i++) {
      newNameLabels.push(replacer(this.state.state, i))
    }
    this._setState({ nameLabels: newNameLabels })
  }
  _selectResourceSet = resourceSet => {
    const { pathname } = this.props.location

    this.context.router.push({
      pathname,
      query: resourceSet && { resourceSet: resourceSet.id },
    })
    this._reset()
  }
  _selectPool = pool => {
    const { pathname } = this.props.location

    this.context.router.push({
      pathname,
      query: pool && { pool: pool.id },
    })
    this._reset()
  }
  _getDefaultSr = template => {
    const { pool } = this.props

    if (pool !== undefined) {
      return pool.default_SR
    }

    if (template === undefined) {
      return
    }

    const defaultSr = getObject(store.getState(), template.$pool, true).default_SR

    return includes(
      resolveIds(
        filter(
          this._getResolvedResourceSet().objectsByType.SR,
          sr => sr.$pool === template.$pool && sr.content_type !== 'iso' && sr.size > 0
        )
      ),
      defaultSr
    )
      ? defaultSr
      : undefined
  }
  _addVdi = () => {
    const { state } = this.state
    const { template } = this.props

    this._setState({
      VDIs: [
        ...state.VDIs,
        {
          name_description: 'Created by XO',
          name_label: (state.name_label || 'disk') + '_' + generateReadableRandomString(5),
          SR: this._getDefaultSr(template),
          type: 'system',
        },
      ],
    })
  }
  _removeVdi = index => {
    const { VDIs } = this.state.state

    this._setState({
      VDIs: [...VDIs.slice(0, index), ...VDIs.slice(index + 1)],
    })
  }
  _addInterface = () => {
    const { template } = this.props
    const { state } = this.state

    this._setState({
      VIFs: [...state.VIFs, { network: this._getDefaultNetworkIds(template)[0] }],
    })
  }
  _removeInterface = index => {
    const { VIFs } = this.state.state

    this._setState({
      VIFs: [...VIFs.slice(0, index), ...VIFs.slice(index + 1)],
    })
  }

  _addNewSshKey = () => {
    const { newSshKey, sshKeys } = this.state.state
    const { userSshKeys } = this.props
    const splitKey = newSshKey.split(' ')
    const title = splitKey.length === 3 ? splitKey[2].split('\n')[0] : newSshKey.slice(-10)

    // save key
    addSshKey({
      title,
      key: newSshKey,
    }).then(() => {
      // select key
      this._setState({
        sshKeys: [...(sshKeys || []), userSshKeys ? userSshKeys.length : 0],
        newSshKey: '',
      })
    })
  }

  _getRedirectionUrl = id => (this.state.state.multipleVms ? '/home' : `/vms/${id}`)

  _handleBootFirmware = value =>
    this._setState({
      hvmBootFirmware: value,
      secureBoot: false,
      createVtpm: value === 'uefi' ? this._templateNeedsVtpm() : false,
    })

  _addAcls = async () => {
    const { action, subjects } = await confirm({
      title: _('vmAddAcls'),
      icon: 'menu-settings-acls',
      body: <AddAclsModal />,
    })

    if (action == null) {
      return
    }

    // Remove ACLs that are being re-assigned
    const subjectIds = subjects.map(subject => subject.id)
    const acls = this.state.state.acls.filter(acl => !subjectIds.includes(acl.subject.id))

    if (isEmpty(subjects)) {
      return
    }

    this._setState({ acls: [...acls, ...subjects.map(subject => ({ action, subject }))] })
  }

  _removeAcl = event => {
    const { action, subject } = event.currentTarget.dataset
    this._setState({
      acls: this.state.state.acls.filter(acl => acl.action.id !== action || acl.subject.id !== subject),
    })
  }

  // MAIN ------------------------------------------------------------------------

  _renderHeader = () => {
    const { isAdmin, isPoolAdmin, pool, resourceSets } = this.props
    const selectPool = (
      <span className={styles.inlineSelect}>
        <SelectPool onChange={this._selectPool} value={pool} />
      </span>
    )
    const selectResourceSet = (
      <span className={styles.inlineSelect}>
        <SelectResourceSet onChange={this._selectResourceSet} value={this.props.location.query.resourceSet} />
      </span>
    )
    return (
      <Container>
        <Row>
          <Col mediumSize={12}>
            <h2>
              {isAdmin || (isPoolAdmin && process.env.XOA_PLAN > 3) || !isEmpty(resourceSets)
                ? _('newVmCreateNewVmOn', {
                    select: isAdmin || isPoolAdmin ? selectPool : selectResourceSet,
                  })
                : _('newVmCreateNewVmNoPermission')}
            </h2>
          </Col>
        </Row>
      </Container>
    )
  }

  render() {
    const { pool } = this.props
    return (
      <Page header={this._renderHeader()}>
        {(pool || this._getResourceSet()) && (
          <form id='vmCreation'>
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
              <ActionButton className={styles.button} handler={this._reset} icon='new-vm-reset'>
                {_('newVmReset')}
              </ActionButton>
              <ActionButton
                btnStyle='primary'
                className={styles.button}
                disabled={
                  !(
                    this._isInfoDone() &&
                    this._isPerformancesDone() &&
                    this._isInstallSettingsDone() &&
                    this._isInterfacesDone() &&
                    this._isDisksDone() &&
                    this._isAdvancedDone()
                  ) || !this._availableResources()
                }
                form='vmCreation'
                handler={pool === undefined ? this._selfCreate : this._create}
                icon='new-vm-create'
                redirectOnSuccess={this._getRedirectionUrl}
              >
                {_('newVmCreate')}
              </ActionButton>
            </div>
          </form>
        )}
      </Page>
    )
  }

  // INFO ------------------------------------------------------------------------

  _renderInfo = () => {
    const { name_description, name_label } = this.state.state
    const { template } = this.props
    return (
      <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfoDone()}>
        <SectionContent>
          <Item label={_('newVmTemplateLabel')}>
            <span className={styles.inlineSelect}>
              {this.props.pool ? (
                <SelectVmTemplate
                  onChange={this._onChangeTemplate}
                  placeholder={_('newVmSelectTemplate')}
                  predicate={this._getVmPredicate()}
                  value={template}
                />
              ) : (
                <SelectResourceSetsVmTemplate
                  onChange={this._onChangeTemplate}
                  placeholder={_('newVmSelectTemplate')}
                  resourceSet={this._getResolvedResourceSet()}
                  value={template}
                />
              )}
            </span>
          </Item>
          <Item label={_('newVmNameLabel')}>
            <DebounceInput className='form-control' onChange={this._linkState('name_label')} value={name_label} />
          </Item>
          <Item label={_('newVmDescriptionLabel')}>
            <DebounceInput
              className='form-control'
              onChange={this._linkState('name_description')}
              value={name_description}
            />
          </Item>
        </SectionContent>
      </Section>
    )
  }
  _isInfoDone = () => {
    const { name_label } = this.state.state
    const { template } = this.props
    return name_label && template
  }

  _getCpusMax = createSelector(
    () => this.state.state.CPUs,
    () => this.state.state.cpusMax,
    Math.max
  )

  _renderPerformances = () => {
    const { coresPerSocket, CPUs, memory, memoryDynamicMax } = this.state.state
    const { template } = this.props
    const { pool } = this.props
    const memoryThreshold = get(() => template.memory.static[0])
    const selectCoresPerSocket = (
      <SelectCoresPerSocket
        disabled={pool === undefined || template === undefined}
        maxCores={get(() => pool.cpus.cores)}
        maxVcpus={this._getCpusMax()}
        onChange={this._linkState('coresPerSocket')}
        value={coresPerSocket}
      />
    )

    return (
      <Section icon='new-vm-perf' title='newVmPerfPanel' done={this._isPerformancesDone()}>
        <SectionContent>
          <Item label={_('newVmVcpusLabel')}>
            <DebounceInput
              className='form-control'
              min={0}
              onChange={this._linkState('CPUs')}
              type='number'
              value={CPUs}
            />
          </Item>
          <Item label={_('newVmRamLabel')}>
            <SizeInput
              className={styles.sizeInput}
              onChange={this._linkState('memory')}
              value={defined(memory, null)}
            />{' '}
            {memoryDynamicMax == null && memory != null && memory < memoryThreshold && (
              <Tooltip
                content={_('newVmRamWarning', {
                  threshold: formatSize(memoryThreshold),
                })}
              >
                <Icon icon='alarm' className='text-warning' size='lg' />
              </Tooltip>
            )}
          </Item>
          <Item label={_('vmCpuTopology')}>
            {pool !== undefined ? (
              selectCoresPerSocket
            ) : (
              <Tooltip content={_('requiresAdminPermissions')}>{selectCoresPerSocket}</Tooltip>
            )}
          </Item>
        </SectionContent>
      </Section>
    )
  }
  _isPerformancesDone = () => {
    const { CPUs, memory, memoryDynamicMax } = this.state.state
    return CPUs && (memory != null || memoryDynamicMax != null)
  }

  // INSTALL SETTINGS ------------------------------------------------------------

  _onChangeCloudConfig = cloudConfig => {
    this._setState({
      customConfig: get(() => cloudConfig.template),
    })
  }

  _onChangeNetworkConfig = networkConfig =>
    this._setState({
      networkConfig: get(() => networkConfig.template),
    })

  _renderInstallSettings = () => {
    const { coreOsDefaultTemplateError } = this.state.state
    const { template } = this.props
    if (!template) {
      return
    }
    const {
      cloudConfig,
      customConfig,
      networkConfig,
      installIso,
      installMethod,
      installNetwork,
      newSshKey,
      pv_args,
      sshKeys,
    } = this.state.state
    const { formatMessage } = this.props.intl
    return (
      <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
        {this._isDiskTemplate ? (
          <SectionContent key='diskTemplate' column>
            <LineItem>
              <label>
                <input
                  checked={installMethod === 'noConfigDrive'}
                  name='installMethod'
                  onChange={this._linkState('installMethod')}
                  type='radio'
                  value='noConfigDrive'
                />
                &nbsp;
                {_('noConfigDrive')}
              </label>
            </LineItem>
            <br />
            <LineItem>
              <label>
                <input
                  checked={installMethod === 'SSH'}
                  name='installMethod'
                  onChange={this._linkState('installMethod')}
                  type='radio'
                  value='SSH'
                />
                &nbsp;
                {_('newVmSshKey')}
              </label>
              &nbsp;
              <span className={classNames('input-group', styles.fixedWidth)}>
                <DebounceInput
                  className='form-control'
                  disabled={installMethod !== 'SSH'}
                  onChange={this._linkState('newSshKey')}
                  value={newSshKey}
                />
                <span className='input-group-btn'>
                  <Button onClick={this._addNewSshKey} disabled={!newSshKey}>
                    <Icon icon='add' />
                  </Button>
                </span>
              </span>
              {this.props.userSshKeys && this.props.userSshKeys.length > 0 && (
                <span className={styles.fixedWidth}>
                  <SelectSshKey
                    disabled={installMethod !== 'SSH'}
                    onChange={this._onChangeSshKeys}
                    multi
                    value={sshKeys || []}
                  />
                </span>
              )}
            </LineItem>
            <br />
            <LineItem>
              <label>
                <input
                  checked={installMethod === 'customConfig'}
                  name='installMethod'
                  onChange={this._linkState('installMethod')}
                  type='radio'
                  value='customConfig'
                />
                &nbsp;
                {_('newVmCustomConfig')}
              </label>
              &nbsp;
              <AvailableTemplateVars />
              &nbsp;
            </LineItem>
            <LineItem>
              <Item>
                <label className='text-muted'>
                  {_('newVmUserConfigLabel')}
                  <br />
                  <SelectCloudConfig disabled={installMethod !== 'customConfig'} onChange={this._onChangeCloudConfig} />
                  <DebounceTextarea
                    className='form-control text-monospace'
                    disabled={installMethod !== 'customConfig'}
                    onChange={this._linkState('customConfig')}
                    rows={7}
                    value={defined(customConfig, DEFAULT_CLOUD_CONFIG_TEMPLATE)}
                  />
                </label>
              </Item>
              {!this._isCoreOs() && (
                <Item>
                  <label className='text-muted'>
                    {_('newVmNetworkConfigLabel')} <NetworkConfigInfo />
                    <br />
                    <SelectNetworkConfig
                      disabled={installMethod !== 'customConfig'}
                      onChange={this._onChangeNetworkConfig}
                    />
                    <DebounceTextarea
                      className='form-control text-monospace'
                      disabled={installMethod !== 'customConfig'}
                      onChange={this._linkState('networkConfig')}
                      rows={7}
                      value={defined(networkConfig, DEFAULT_NETWORK_CONFIG_TEMPLATE)}
                    />
                  </label>
                </Item>
              )}
            </LineItem>
          </SectionContent>
        ) : (
          <SectionContent>
            {template.virtualizationMode === 'pv' ? (
              <span>
                <Item>
                  <input
                    checked={installMethod === 'network'}
                    name='installMethod'
                    onChange={this._linkState('installMethod')}
                    type='radio'
                    value='network'
                  />{' '}
                  <span>{_('newVmNetworkLabel')}</span>{' '}
                  <DebounceInput
                    className='form-control'
                    disabled={installMethod !== 'network'}
                    key='networkInput'
                    onChange={this._linkState('installNetwork')}
                    placeholder={formatMessage(messages.newVmInstallNetworkPlaceHolder)}
                    value={installNetwork}
                  />
                </Item>
                <Item label={_('newVmPvArgsLabel')} key='pv'>
                  <DebounceInput className='form-control' onChange={this._linkState('pv_args')} value={pv_args} />
                </Item>
              </span>
            ) : (
              <Item>
                <input
                  checked={installMethod === 'PXE'}
                  name='installMethod'
                  onChange={this._linkState('installMethod')}
                  type='radio'
                  value='PXE'
                />{' '}
                <span>{_('newVmPxeLabel')}</span>
              </Item>
            )}
          </SectionContent>
        )}
        <SectionContent>
          <span className={styles.item}>
            <input
              checked={installMethod === 'ISO'}
              name='installMethod'
              onChange={this._linkState('installMethod')}
              type='radio'
              value='ISO'
            />
            &nbsp;
            <span>{_('newVmIsoDvdLabel')}</span>
            &nbsp;
            <span className={styles.inlineSelect}>
              {this.props.pool ? (
                <SelectVdi
                  disabled={installMethod !== 'ISO'}
                  onChange={this._linkState('installIso')}
                  predicate={isVdiPresent}
                  srPredicate={this._getIsoPredicate()}
                  value={installIso}
                />
              ) : (
                <SelectResourceSetsVdi
                  disabled={installMethod !== 'ISO'}
                  onChange={this._linkState('installIso')}
                  predicate={isVdiPresent}
                  resourceSet={this._getResolvedResourceSet()}
                  srPredicate={this._getIsoPredicate()}
                  value={installIso}
                />
              )}
            </span>
          </span>
        </SectionContent>
        {this._isCoreOs() && (
          <div>
            <label>{_('newVmCloudConfig')}</label>{' '}
            {!coreOsDefaultTemplateError ? (
              <DebounceTextarea
                className='form-control text-monospace'
                onChange={this._linkState('cloudConfig')}
                rows={7}
                value={cloudConfig}
              />
            ) : (
              <Link to='settings/logs' target='_blank' className='text-danger'>
                <Icon icon='alarm' /> {_('coreOsDefaultTemplateError')}
              </Link>
            )}
          </div>
        )}
      </Section>
    )
  }
  _isInstallSettingsDone = () => {
    const { customConfig, installIso, installMethod, installNetwork, sshKeys } = this.state.state
    const { template } = this.props
    switch (installMethod) {
      case 'customConfig':
        return customConfig === undefined || customConfig.trim() !== '' || installMethod === 'noConfigDrive'
      case 'ISO':
        return installIso
      case 'network':
        return /^(http|ftp|nfs)/i.exec(installNetwork)
      case 'PXE':
        return true
      case 'SSH':
        return !isEmpty(sshKeys) || installMethod === 'noConfigDrive'
      default:
        return template && this._isDiskTemplate && installMethod === 'noConfigDrive'
    }
  }

  // INTERFACES ------------------------------------------------------------------

  _renderInterfaces = () => {
    const {
      state: { VIFs },
    } = this.state

    return (
      <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
        <SectionContent column>
          {map(VIFs, (vif, index) => (
            <div key={index}>
              <Vif
                networkPredicate={this._getNetworkPredicate()}
                onChangeAddresses={this._linkState(`VIFs.${index}.addresses`, '*.id')}
                onChangeMac={this._linkState(`VIFs.${index}.mac`)}
                onChangeNetwork={this._linkState(`VIFs.${index}.network`, 'id')}
                onDelete={() => this._removeInterface(index)}
                pool={this.props.pool}
                resourceSet={this._getResolvedResourceSet()}
                vif={vif}
              />
              {index < VIFs.length - 1 && <hr />}
            </div>
          ))}
          <Item>
            <Button onClick={this._addInterface}>
              <Icon icon='new-vm-add' /> {_('newVmAddInterface')}
            </Button>
          </Item>
        </SectionContent>
      </Section>
    )
  }
  _isInterfacesDone = () => every(this.state.state.VIFs, vif => vif.network)

  // DISKS -----------------------------------------------------------------------

  _getDiskSrs = createSelector(
    () => this.state.state.existingDisks,
    () => this.state.state.VDIs,
    (existingDisks, vdis) => {
      const diskSrs = new Set()
      forEach(existingDisks, disk => diskSrs.add(disk.$SR))
      vdis.forEach(disk => diskSrs.add(disk.SR))
      return [...diskSrs]
    }
  )

  _srsNotOnSameHost = createSelector(
    this._getDiskSrs,
    () => this.props.srs,
    (diskSrs, srs) => {
      let container
      let sr
      return diskSrs.some(srId => {
        sr = srs[srId]
        return (
          sr !== undefined &&
          !isSrShared(sr) &&
          (container !== undefined ? container !== sr.$container : ((container = sr.$container), false))
        )
      })
    }
  )

  _renderDisks = () => {
    const {
      state: { installMethod, existingDisks, VDIs },
    } = this.state
    const { pool } = this.props
    let i = 0
    const resourceSet = this._getResolvedResourceSet()

    return (
      <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
        <SectionContent column>
          {/* Existing disks */}
          {map(existingDisks, (disk, index) => (
            <div key={i}>
              <LineItem>
                <Item label={_('newVmSrLabel')}>
                  <span className={styles.inlineSelect}>
                    {pool ? (
                      <SelectSr
                        onChange={this._linkState(`existingDisks.${index}.$SR`, 'id')}
                        predicate={this._getSrPredicate()}
                        value={disk.$SR}
                      />
                    ) : (
                      <SelectResourceSetsSr
                        onChange={this._linkState(`existingDisks.${index}.$SR`, 'id')}
                        predicate={this._getSrPredicate()}
                        resourceSet={resourceSet}
                        value={disk.$SR}
                      />
                    )}
                  </span>
                </Item>{' '}
                <Item label={_('newVmNameLabel')}>
                  <DebounceInput
                    className='form-control'
                    onChange={this._linkState(`existingDisks.${index}.name_label`)}
                    value={disk.name_label}
                  />
                </Item>
                <Item label={_('newVmDescriptionLabel')}>
                  <DebounceInput
                    className='form-control'
                    onChange={this._linkState(`existingDisks.${index}.name_description`)}
                    value={disk.name_description}
                  />
                </Item>
                <Item label={_('newVmSizeLabel')}>
                  <SizeInput
                    className={styles.sizeInput}
                    onChange={this._linkState(`existingDisks.${index}.size`)}
                    readOnly={installMethod === 'noConfigDrive'}
                    value={defined(disk.size, null)}
                  />
                </Item>
              </LineItem>
              {i++ < size(existingDisks) + VDIs.length - 1 && <hr />}
            </div>
          ))}

          {/* VDIs */}
          {map(VDIs, (vdi, index) => (
            <div key={index}>
              <LineItem>
                <Item label={_('newVmSrLabel')}>
                  <span className={styles.inlineSelect}>
                    {pool ? (
                      <SelectSr
                        onChange={this._linkState(`VDIs.${index}.SR`, 'id')}
                        predicate={this._getSrPredicate()}
                        value={vdi.SR}
                      />
                    ) : (
                      <SelectResourceSetsSr
                        onChange={this._linkState(`VDIs.${index}.SR`, 'id')}
                        predicate={this._getSrPredicate()}
                        resourceSet={resourceSet}
                        value={vdi.SR}
                      />
                    )}
                  </span>
                </Item>
                <Item label={_('newVmNameLabel')}>
                  <DebounceInput
                    className='form-control'
                    onChange={this._linkState(`VDIs.${index}.name_label`)}
                    value={vdi.name_label}
                  />
                </Item>
                <Item label={_('newVmDescriptionLabel')}>
                  <DebounceInput
                    className='form-control'
                    onChange={this._linkState(`VDIs.${index}.name_description`)}
                    value={vdi.name_description}
                  />
                </Item>
                <Item label={_('newVmSizeLabel')}>
                  <SizeInput
                    className={styles.sizeInput}
                    onChange={this._linkState(`VDIs.${index}.size`)}
                    value={defined(vdi.size, null)}
                  />
                </Item>
                <Item>
                  <Button onClick={() => this._removeVdi(index)}>
                    <Icon icon='new-vm-remove' />
                  </Button>
                </Item>
              </LineItem>
              {index < VDIs.length - 1 && <hr />}
            </div>
          ))}
          {this._srsNotOnSameHost() && (
            <span className='text-danger'>
              <Icon icon='alarm' /> {_('newVmSrsNotOnSameHost')}
            </span>
          )}
          <Item>
            <Button onClick={this._addVdi}>
              <Icon icon='new-vm-add' /> {_('newVmAddDisk')}
            </Button>
          </Item>
        </SectionContent>
      </Section>
    )
  }
  _isDisksDone = () =>
    every(this.state.state.VDIs, vdi => vdi.SR && vdi.name_label && vdi.size !== undefined) &&
    every(this.state.state.existingDisks, (vdi, index) => vdi.$SR && vdi.name_label && vdi.size !== undefined)

  // ADVANCED --------------------------------------------------------------------

  _renderAdvanced = () => {
    const {
      acls,
      affinityHost,
      autoPoweron,
      bootAfterCreate,
      copyHostBiosStrings,
      cpuCap,
      cpusMax,
      cpuWeight,
      createVtpm,
      destroyCloudConfigVdiAfterBoot,
      hvmBootFirmware,
      installMethod,
      memoryDynamicMin,
      memoryDynamicMax,
      memoryStaticMax,
      multipleVms,
      nameLabels,
      namePattern,
      nbVms,
      secureBoot,
      seqStart,
      share,
      showAdvanced,
      tags,
    } = this.state.state
    const { isAdmin, pool } = this.props
    const { formatMessage } = this.props.intl
    const isHvm = this._isHvm()
    const _copyHostBiosStrings =
      isAdmin && isHvm ? (
        <label>
          <input
            checked={hvmBootFirmware !== 'uefi' && (this._templateHasBiosStrings() || copyHostBiosStrings)}
            className='form-control'
            disabled={hvmBootFirmware === 'uefi' || this._templateHasBiosStrings()}
            onChange={this._toggleState('copyHostBiosStrings')}
            type='checkbox'
          />
          &nbsp;
          {_('copyHostBiosStrings')}
        </label>
      ) : null

    const isVtpmSupported = pool?.vtpmSupported ?? true

    return (
      <Section icon='new-vm-advanced' title='newVmAdvancedPanel' done={this._isAdvancedDone()}>
        <SectionContent column>
          <Button onClick={this._toggleState('showAdvanced')}>
            {showAdvanced ? _('newVmHideAdvanced') : _('newVmShowAdvanced')}
          </Button>
        </SectionContent>
        {showAdvanced && [
          <hr key='hr' />,
          <SectionContent key='advanced'>
            <Item>
              <input checked={bootAfterCreate} onChange={this._linkState('bootAfterCreate')} type='checkbox' />
              &nbsp;
              {_('newVmBootAfterCreate')}
            </Item>
            <Item>
              <input checked={autoPoweron} onChange={this._linkState('autoPoweron')} type='checkbox' />
              &nbsp;
              {_('autoPowerOn')}
            </Item>
            <Item className={styles.tags}>
              <Tags labels={tags} onChange={this._linkState('tags')} />
            </Item>
          </SectionContent>,
          <SectionContent key='destroyCloudConfigVdi'>
            <Item>
              <input
                checked={destroyCloudConfigVdiAfterBoot}
                disabled={installMethod === 'noConfigDrive' || !bootAfterCreate}
                id='destroyCloudConfigDisk'
                onChange={this._toggleState('destroyCloudConfigVdiAfterBoot')}
                type='checkbox'
              />
              <label htmlFor='destroyCloudConfigDisk'>
                &nbsp;
                {_('destroyCloudConfigVdiAfterBoot')}
              </label>
            </Item>
          </SectionContent>,
          this._getResourceSet() !== undefined && (
            <SectionContent>
              <Item>
                <input checked={share} onChange={this._linkState('share')} type='checkbox' />
                &nbsp;
                {_('newVmShare')}
              </Item>
            </SectionContent>
          ),
          <SectionContent key='newVmCpu'>
            <Item label={_('newVmCpuWeightLabel')}>
              <DebounceInput
                className='form-control'
                min={0}
                max={65535}
                onChange={this._linkState('cpuWeight')}
                placeholder={formatMessage(messages.newVmDefaultCpuWeight, {
                  value: XEN_DEFAULT_CPU_WEIGHT,
                })}
                type='number'
                value={cpuWeight}
              />
            </Item>
            <Item label={_('newVmCpuCapLabel')}>
              <DebounceInput
                className='form-control'
                min={0}
                onChange={this._linkState('cpuCap')}
                placeholder={formatMessage(messages.newVmDefaultCpuCap, {
                  value: XEN_DEFAULT_CPU_CAP,
                })}
                type='number'
                value={cpuCap}
              />
            </Item>
            <Item label={_('cpusMax')}>
              <DebounceInput
                className='form-control'
                onChange={this._linkState('cpusMax')}
                type='number'
                value={cpusMax}
              />
            </Item>
          </SectionContent>,
          <SectionContent key='newVmDynamic'>
            <Item label={_('newVmDynamicMinLabel')}>
              <SizeInput
                value={defined(memoryDynamicMin, null)}
                onChange={this._linkState('memoryDynamicMin')}
                className={styles.sizeInput}
              />
            </Item>
            <Item label={_('newVmDynamicMaxLabel')}>
              <SizeInput
                value={defined(memoryDynamicMax, null)}
                onChange={this._linkState('memoryDynamicMax')}
                className={styles.sizeInput}
              />
            </Item>
            <Item label={_('newVmStaticMaxLabel')}>
              <SizeInput
                value={defined(memoryStaticMax, null)}
                onChange={this._linkState('memoryStaticMax')}
                className={styles.sizeInput}
              />
            </Item>
          </SectionContent>,
          <SectionContent key='newVmMultipleVms'>
            <Item label={_('newVmMultipleVms')}>
              <Toggle value={multipleVms} onChange={this._linkState('multipleVms')} />
            </Item>
            <Item label={_('newVmMultipleVmsPattern')}>
              <DebounceInput
                className='form-control'
                disabled={!multipleVms}
                onChange={this._linkState('namePattern')}
                placeholder={formatMessage(messages.newVmMultipleVmsPatternPlaceholder)}
                value={namePattern}
              />
              &nbsp;
              <AvailableTemplateVars />
            </Item>
            <Item label={_('newVmFirstIndex')}>
              <DebounceInput
                className='form-control'
                disabled={!multipleVms}
                onChange={this._linkState('seqStart')}
                type='number'
                value={seqStart}
              />
            </Item>
            <Item>
              <Tooltip content={_('newVmNameRefresh')}>
                <a className={styles.refreshNames} onClick={this._updateNameLabels}>
                  <Icon icon='refresh' />
                </a>
              </Tooltip>
            </Item>
            <Item className='input-group'>
              <DebounceInput
                className='form-control'
                disabled={!multipleVms}
                max={NB_VMS_MAX}
                min={NB_VMS_MIN}
                onChange={this._linkState('nbVms')}
                type='number'
                value={nbVms}
              />
              <span className='input-group-btn'>
                <Tooltip content={_('newVmNumberRecalculate')}>
                  <Button disabled={!multipleVms} onClick={this._updateNbVms}>
                    <Icon icon='arrow-right' />
                  </Button>
                </Tooltip>
              </span>
            </Item>
            {multipleVms && (
              <LineItem>
                {map(nameLabels, (nameLabel, index) => (
                  <Item key={`nameLabel_${index}`}>
                    <input
                      type='text'
                      className='form-control'
                      value={nameLabel}
                      onChange={this._linkState(`nameLabels.${index}`)}
                    />
                  </Item>
                ))}
              </LineItem>
            )}
          </SectionContent>,
          isAdmin && (
            <SectionContent>
              <Item label={_('newVmAffinityHost')}>
                <SelectHost
                  onChange={this._linkState('affinityHost')}
                  predicate={this._getAffinityHostPredicate()}
                  value={affinityHost}
                />
              </Item>
            </SectionContent>
          ),
          isHvm && (
            <SectionContent>
              <Item label={_('vmVgpu')}>
                <SelectVgpuType onChange={this._linkState('vgpuType')} predicate={this._getVgpuTypePredicate()} />
              </Item>
            </SectionContent>
          ),
          isHvm && (
            <SectionContent>
              <Item label={_('vmBootFirmware')}>
                <SelectBootFirmware
                  host={affinityHost == null ? get(() => pool.master) : affinityHost.id}
                  onChange={this._handleBootFirmware}
                  value={hvmBootFirmware}
                />
              </Item>
            </SectionContent>
          ),
          hvmBootFirmware === 'uefi' && [
            <SectionContent key='secureBoot'>
              <Item label={_('secureBoot')}>
                <Toggle onChange={this._toggleState('secureBoot')} value={secureBoot} />
              </Item>
              {secureBoot && this.state.poolGuestSecurebootReadiness === 'not_ready' && (
                <span className='align-self-center text-danger ml-1'>
                  <a
                    href='https://docs.xcp-ng.org/guides/guest-UEFI-Secure-Boot/'
                    rel='noopener noreferrer'
                    className='text-danger'
                    target='_blank'
                  >
                    <Icon icon='alarm' /> {_('secureBootNotSetup')}
                  </a>
                </span>
              )}
            </SectionContent>,
            <SectionContent key='vtpm'>
              <Item label={_('enableVtpm')} className='d-inline-flex'>
                <Tooltip content={!isVtpmSupported ? _('vtpmNotSupported') : undefined}>
                  <Toggle onChange={this._toggleState('createVtpm')} value={createVtpm} disabled={!isVtpmSupported} />
                </Tooltip>
                {/* FIXME: link to VTPM documentation when ready */}
                {/* &nbsp;
                <Tooltip content={_('seeVtpmDocumentation')}>
                  <a className='text-info align-self-center' style={{ cursor: 'pointer' }} href='#'>
                    <Icon icon='info' />
                  </a>
                </Tooltip> */}
                {!createVtpm && this._templateNeedsVtpm() && (
                  <span className='align-self-center text-warning ml-1'>
                    <Icon icon='alarm' /> {_('warningVtpmRequired')}
                  </span>
                )}
              </Item>
            </SectionContent>,
          ],
          isAdmin && isHvm && (
            <SectionContent>
              <Item>
                {hvmBootFirmware === 'uefi' || this._templateHasBiosStrings() ? (
                  <Tooltip
                    content={hvmBootFirmware === 'uefi' ? _('vmBootFirmwareIsUefi') : _('templateHasBiosStrings')}
                  >
                    {_copyHostBiosStrings}
                  </Tooltip>
                ) : (
                  _copyHostBiosStrings
                )}
              </Item>
            </SectionContent>
          ),
          isAdmin && (
            <SectionContent>
              <Container className='w-100'>
                <Row>
                  <Col>
                    <span className='mr-1'>{_('vmAcls')}</span>
                    <ActionButton
                      btnStyle='primary'
                      handler={this._addAcls}
                      icon='add'
                      size='small'
                      tooltip={_('vmAddAcls')}
                    />
                  </Col>
                </Row>
                {acls.map(({ subject, action }) => (
                  <Row key={`${subject.id}.${action.id}`}>
                    <Col>
                      <span>{renderXoItem(subject)}</span>{' '}
                      <span className={`tag tag-pill tag-${ACL_LEVELS[action.id]}`}>{action.name}</span>{' '}
                      <Tooltip content={_('removeAcl')}>
                        <a data-action={action.id} data-subject={subject.id} onClick={this._removeAcl} role='button'>
                          <Icon icon='remove' />
                        </a>
                      </Tooltip>
                    </Col>
                  </Row>
                ))}
              </Container>
            </SectionContent>
          ),
        ]}
      </Section>
    )
  }
  _isAdvancedDone = () => {
    const lowerThan = (small, big) => small == null || big == null || small <= big
    const { memoryDynamicMin, memoryDynamicMax, memoryStaticMax } = this.state.state

    return lowerThan(memoryDynamicMin, memoryDynamicMax) && lowerThan(memoryDynamicMax, memoryStaticMax)
  }

  // SUMMARY ---------------------------------------------------------------------

  _renderSummary = () => {
    const { CPUs, existingDisks, fastClone, memory, memoryDynamicMax, multipleVms, nameLabels, VDIs, VIFs } =
      this.state.state

    const factor = multipleVms ? nameLabels.length : 1
    const resourceSet = this._getResourceSet()
    const limits = resourceSet && resourceSet.limits
    const cpusLimits = limits && limits.cpus
    const memoryLimits = limits && limits.memory
    const diskLimits = limits && limits.disk

    const _memory = memoryDynamicMax || memory || 0

    return (
      <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
        <Container>
          <Row>
            <Col size={3} className='text-xs-center'>
              <h2>
                {CPUs || 0}x <Icon icon='cpu' />
              </h2>
            </Col>
            <Col size={3} className='text-xs-center'>
              <h2>
                {_memory ? formatSize(_memory) : '0 B'} <Icon icon='memory' />
              </h2>
            </Col>
            <Col size={3} className='text-xs-center'>
              <h2>
                {size(existingDisks) + VDIs.length || 0}x <Icon icon='disk' />
              </h2>
            </Col>
            <Col size={3} className='text-xs-center'>
              <h2>
                {VIFs.length}x <Icon icon='network' />
              </h2>
            </Col>
          </Row>
          {limits && (
            <Row>
              <Col size={3}>
                {cpusLimits?.total !== undefined && (
                  <Limits limit={cpusLimits.total} toBeUsed={CPUs * factor} used={cpusLimits.usage} />
                )}
              </Col>
              <Col size={3}>
                {memoryLimits?.total !== undefined && (
                  <Limits limit={memoryLimits.total} toBeUsed={_memory * factor} used={memoryLimits.usage} />
                )}
              </Col>
              <Col size={3}>
                {diskLimits?.total !== undefined && (
                  <Limits
                    limit={diskLimits.total}
                    toBeUsed={(sumBy(VDIs, 'size') + sum(map(existingDisks, disk => disk.size))) * factor}
                    used={diskLimits.usage}
                  />
                )}
              </Col>
            </Row>
          )}
        </Container>
        {this._isDiskTemplate && (
          <div style={{ display: 'flex' }}>
            <span style={{ margin: 'auto' }}>
              <input checked={fastClone} onChange={this._linkState('fastClone')} type='checkbox' />{' '}
              <Icon icon='vm-fast-clone' /> {_('fastCloneVmLabel')}
            </span>
          </div>
        )}
      </Section>
    )
  }

  _availableResources = () => {
    const resourceSet = this._getResourceSet()

    if (!resourceSet) {
      return true
    }

    const { CPUs, existingDisks, memory, memoryDynamicMax, VDIs, multipleVms, nameLabels } = this.state.state
    const _memory = memoryDynamicMax || memory || 0
    const factor = multipleVms ? nameLabels.length : 1

    return !(
      CPUs * factor > get(() => resourceSet.limits.cpus.total - resourceSet.limits.cpus.usage) ||
      _memory * factor > get(() => resourceSet.limits.memory.total - resourceSet.limits.memory.usage) ||
      (sumBy(VDIs, 'size') + sum(map(existingDisks, disk => disk.size))) * factor >
        get(() => resourceSet.limits.disk.total - resourceSet.limits.disk.usage)
    )
  }
}
/* eslint-enable camelcase */
