import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import clamp from 'lodash/clamp'
import classNames from 'classnames'
import DebounceInput from 'react-debounce-input'
import every from 'lodash/every'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import getEventValue from 'get-event-value'
import Icon from 'icon'
import includes from 'lodash/includes'
import isArray from 'lodash/isArray'
import isEmpty from 'lodash/isEmpty'
import isObject from 'lodash/isObject'
import map from 'lodash/map'
import Page from '../page'
import React from 'react'
import size from 'lodash/size'
import slice from 'lodash/slice'
import store from 'store'
import Wizard, { Section } from 'wizard'
import { Button } from 'react-bootstrap-4/lib'
import { Container, Row, Col } from 'grid'
import { injectIntl } from 'react-intl'
import {
  createVm,
  createVms,
  getCloudInitConfig,
  subscribePermissions,
  subscribeResourceSets
} from 'xo'
import {
  SelectNetwork,
  SelectPool,
  SelectResourceSet,
  SelectResourceSetsNetwork,
  SelectResourceSetsSr,
  SelectResourceSetsVdi,
  SelectResourceSetsVmTemplate,
  SelectSr,
  SelectVdi,
  SelectVmTemplate
} from 'select-objects'
import {
  SizeInput,
  Toggle
} from 'form'
import {
  connectStore,
  formatSize,
  noop,
  resolveResourceSets
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

// Sub-components --------------------------------------------------------------

const SectionContent = ({ summary, column, children }) => (
  <div className={classNames(
    'form-inline',
    summary ? styles.summary : styles.sectionContent,
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
const Item = ({ label, children }) => (
  <span className={styles.item}>
    {label && <span>{_(label)}&nbsp;</span>}
    <span className={styles.input}>{children}</span>
  </span>
)

// -----------------------------------------------------------------------------

const getObject = createGetObject((_, id) => id)

@connectStore(() => ({
  isAdmin: createSelector(
    getUser,
    user => user && user.permission === 'admin'
  ),
  networks: createGetObjectsOfType('network').sort(),
  pools: createGetObjectsOfType('pool'),
  templates: createGetObjectsOfType('VM-template').sort()
}))
@injectIntl
export default class NewVm extends BaseComponent {
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

  componentWillMount () {
    this._unsubscribeResourceSets = subscribeResourceSets(resourceSets => {
      this.setState({
        resourceSets: resolveResourceSets(resourceSets)
      })
    })
    this._unsubscribePermissions = subscribePermissions(permissions => {
      this.setState({
        permissions
      })
    })
  }

  componentWillUnmount () {
    this._unsubscribeResourceSets()
    this._unsubscribePermissions()
  }

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

// Actions ---------------------------------------------------------------------

  _reset = ({ pool, resourceSet } = { pool: this.state.pool, resourceSet: this.state.resourceSet }) => {
    this.setState({ pool, resourceSet })
    this._replaceState({
      bootAfterCreate: true,
      configDrive: false,
      CPUs: '',
      cpuWeight: 1,
      existingDisks: {},
      fastClone: true,
      multipleVms: false,
      name_label: '',
      name_description: '',
      nameLabels: map(Array(NB_VMS_MIN), (_, index) => `VM_${index + 1}`),

      nbVms: NB_VMS_MIN,
      VDIs: [],
      VIFs: []
    })
  }

  _create = () => {
    const { resourceSet, state } = this.state
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
        cloudConfig = '#cloud-config\nhostname: ' + hostname + '\nssh_authorized_keys:\n  - ' + state.sshKey + '\n'
      } else {
        cloudConfig = state.customConfig
      }
    } else if (state.template.name_label === 'CoreOS') {
      cloudConfig = state.cloudConfig
    }

    const data = {
      clone: !this.isDiskTemplate && state.fastClone,
      existingDisks: state.existingDisks,
      installation,
      name_label: state.name_label,
      template: state.template.id,
      VDIs: state.VDIs,
      VIFs: state.VIFs,
      resourceSet: resourceSet && resourceSet.id,
      // TODO: To be added in xo-server
      // vm.set parameters
      CPUs: state.CPUs,
      cpuWeight: state.cpuWeight,
      name_description: state.name_description,
      memory: state.memory,
      pv_args: state.pv_args,
      // Boolean: if true, boot the VM right after its creation
      bootAfterCreate: state.bootAfterCreate,
      cloudConfig,
      coreOs: state.template.name_label === 'CoreOS'
    }

    return state.multipleVms ? createVms(data, state.nameLabels) : createVm(data)
  }
  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

    this._setState({ template })

    const storeState = store.getState()
    const _isInResourceSet = this._getIsInResourceSet()
    const { pool, resourceSet, state } = this.state

    const existingDisks = {}
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(storeState, vbdId)
      if (!vbd || vbd.is_cd_drive) {
        return
      }
      const vdi = getObject(storeState, vbd.VDI)
      if (vdi) {
        existingDisks[this.getUniqueId()] = {
          name_label: vdi.name_label,
          name_description: vdi.name_description,
          size: vdi.size,
          $SR: pool || _isInResourceSet(vdi.$SR, 'SR')
            ? vdi.$SR
            : resourceSet.objectsByType['SR'][0].id
        }
      }
    })

    const VIFs = []
    forEach(template.VIFs, vifId => {
      const vif = getObject(storeState, vifId)
      VIFs.push({
        id: this.getUniqueId(),
        network: pool || _isInResourceSet(vif.$network, 'network')
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
    this._setState({
      // infos
      name_label,
      template,
      name_description: state.name_description === '' || !state.name_descriptionHasChanged ? template.name_description || '' : state.name_description,
      nameLabels: map(Array(+state.nbVms), (_, index) => `${name_label}_${index + 1}`),
      // performances
      memory: template.memory.size,
      CPUs: template.CPUs.number,
      cpuWeight: 1,
      // installation
      installMethod: template.install_methods && template.install_methods[0] || state.installMethod,
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
      const { pool } = this.state
      return pool && pool.id
    },
    poolId => ({ $pool }) =>
      $pool === poolId
  )
  _getIsInResourceSet = createSelector(
    () => {
      const { resourceSet } = this.state
      return resourceSet && resourceSet.objectsByType
    },
    objectsByType => (obj, objType) => {
      const [id, type] = isObject(obj) ? [obj.id, obj.type] : [obj, objType]
      return objectsByType && includes(map(objectsByType[type], object => object.id), id)
    }
  )
  _getCanOperate = createSelector(
    () => this.state.permissions,
    permissions => ({ id }) =>
      this.props.isAdmin || permissions && permissions[id] && permissions[id].operate
  )
  _getVmPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => vm =>
      isInResourceSet(vm) || isInPool(vm)
  )
  _getSrPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => disk =>
      (isInResourceSet(disk) || isInPool(disk)) && disk.content_type !== 'iso' && disk.size > 0
  )
  _getIsoPredicate = () => disk =>
    disk.content_type === 'iso'
  _getNetworkPredicate = createSelector(
    this._getIsInPool,
    this._getIsInResourceSet,
    (isInPool, isInResourceSet) => network =>
      isInResourceSet(network) || isInPool(network)
  )
  _getPoolNetworks = createSelector(
    () => this.props.networks,
    () => {
      const { pool } = this.state
      return pool && pool.id
    },
    (networks, poolId) => filter(networks, network => network.$pool === poolId)
  )
  _getOperatablePools = createFilter(
    () => this.props.pools,
    this._getCanOperate,
    [ (pool, canOperate) => canOperate(pool) ]
  )
  _getDefaultNetworkId = () => {
    const { resourceSet } = this.state
    if (resourceSet) {
      return resourceSet.objectsByType['network'][0].id
    }
    const network = find(this._getPoolNetworks(), network => {
      const pif = getObject(store.getState(), network.PIFs[0])
      return pif && pif.management
    })
    return network && network.id
  }

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
  _updateNbVms = () => {
    const { nbVms, name_label, nameLabels } = this.state.state
    const nbVmsClamped = clamp(nbVms, NB_VMS_MIN, NB_VMS_MAX)
    const newNameLabels = [ ...nameLabels ]
    if (nbVmsClamped < nameLabels.length) {
      this._setState({ nameLabels: slice(newNameLabels, 0, nbVmsClamped) })
    } else {
      for (let i = nameLabels.length + 1; i <= nbVmsClamped; i++) {
        newNameLabels.push(`${name_label || 'VM'}_${i}`)
      }
      this._setState({ nameLabels: newNameLabels })
    }
  }
  _updateNameLabels = () => {
    const { name_label, nameLabels } = this.state.state
    const nbVms = nameLabels.length
    const newNameLabels = []
    for (let i = 1; i <= nbVms; i++) {
      newNameLabels.push(`${name_label || 'VM'}_${i}`)
    }
    this._setState({ nameLabels: newNameLabels })
  }
  _selectResourceSet = resourceSet =>
    this._reset({ pool: undefined, resourceSet })
  _selectPool = pool =>
    this._reset({ pool, resourceSet: undefined })
  _addVdi = () => {
    const { pool, state } = this.state
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

  _getRedirectionUrl = id =>
    this.state.state.multipleVms ? '/home' : `/vms/${id}`

// MAIN ------------------------------------------------------------------------

  _renderHeader = () => {
    const { pool, resourceSet, resourceSets } = this.state
    const showSelectPool = !isEmpty(this._getOperatablePools())
    const showSelectResourceSet = !this.props.isAdmin && !isEmpty(resourceSets)
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
        value={resourceSet}
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
                select: isEmpty(this._getOperatablePools()) ? selectResourceSet : selectPool
              })
              : _('newVmCreateNewVmNoPermission')
            }
          </h2>
        </Col>
      </Row>
    </Container>
  }

  render () {
    const { resourceSet, pool } = this.state
    return <Page header={this._renderHeader()}>
      {(pool || resourceSet) && <form id='vmCreation'>
        <Wizard>
          {this._renderInfo()}
          {this._renderPerformances()}
          {this._renderInstallSettings()}
          {this._renderInterfaces()}
          {this._renderDisks()}
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
              this._isDisksDone()
            )}
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
      multipleVms,
      name_description,
      name_label,
      nameLabels,
      nbVms,
      template
    } = this.state.state
    return <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfoDone()}>
      <SectionContent>
        <Item label='newVmTemplateLabel'>
          <span className={styles.inlineSelect}>
            {this.state.pool ? <SelectVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              predicate={this._getVmPredicate()}
              value={template}
            />
            : <SelectResourceSetsVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              resourceSet={this.state.resourceSet}
              value={template}
            />}
          </span>
        </Item>
        <Item label='newVmNameLabel'>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            onChange={this._getOnChange('name_label')}
            value={name_label}
          />
        </Item>
        <Item label='newVmDescriptionLabel'>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            onChange={this._getOnChange('name_description')}
            value={name_description}
          />
        </Item>
      </SectionContent>
      <SectionContent column>
        <LineItem>
          <Item>
            {_('newVmMultipleVms')}
            &nbsp;&nbsp;
            <Toggle value={multipleVms} onChange={this._getOnChange('multipleVms')} />
            <br />
            <div className='input-group'>
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
                <Button bsStyle='secondary' disabled={!multipleVms} onClick={this._updateNbVms}><Icon icon='arrow-right' /></Button>
              </span>
            </div>
            <a className={styles.refreshNames} onClick={this._updateNameLabels}><Icon icon='refresh' /></a>
          </Item>
        </LineItem>
        {multipleVms && <LineItem>
          {map(nameLabels, (nameLabel, index) =>
            <Item key={`nameLabel_${index}`}>
              <input type='text' className='form-control' value={nameLabel} onChange={this._getOnChange('nameLabels', index)} />
            </Item>
          )}
        </LineItem>}
      </SectionContent>
    </Section>
  }
  _isInfoDone = () => {
    const { template, name_label } = this.state.state
    return name_label && template
  }

  _renderPerformances = () => {
    const { CPUs, cpuWeight, memory } = this.state.state
    return <Section icon='new-vm-perf' title='newVmPerfPanel' done={this._isPerformancesDone()}>
      <SectionContent>
        <Item label='newVmVcpusLabel'>
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            min={0}
            onChange={this._getOnChange('CPUs')}
            type='number'
            value={CPUs}
          />
        </Item>
        <Item label='newVmRamLabel'>
          <SizeInput value={memory} onChange={this._getOnChange('memory')} className={styles.sizeInput} />
        </Item>
        <Item label='newVmCpuWeightLabel'>
          <select
            className='form-control'
            onChange={this._getOnChange('cpuWeight')}
            value={cpuWeight}
          >
            {_('newVmCpuWeightQuarter', message => <option value={0.25}>{message}</option>)}
            {_('newVmCpuWeightHalf', message => <option value={0.5}>{message}</option>)}
            {_('newVmCpuWeightNormal', message => <option value={1}>{message}</option>)}
            {_('newVmCpuWeightDouble', message => <option value={2}>{message}</option>)}
          </select>
        </Item>
      </SectionContent>
    </Section>
  }
  _isPerformancesDone = () => {
    const { CPUs, memory } = this.state.state
    return CPUs && memory !== undefined
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
      pv_args,
      sshKey
    } = this.state.state
    return <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
      {this._isDiskTemplate ? <SectionContent key='diskTemplate'>
        <div className={styles.configDrive}>
          <span className={styles.configDriveToggle}>
            {_('newVmConfigDrive')}
          </span>
          <span className={styles.configDriveToggle}>
            <Toggle
              value={configDrive}
              onChange={this._getOnChange('configDrive')}
            />
          </span>
        </div>
        <Item>
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
          {' '}
          <DebounceInput
            className='form-control'
            debounceTimeout={DEBOUNCE_TIMEOUT}
            disabled={!configDrive || installMethod !== 'SSH'}
            onChange={this._getOnChange('sshKey')}
            type='text'
            value={sshKey}
          />
        </Item>
        <Item>
          <input
            checked={installMethod === 'customConfig'}
            disabled={!configDrive}
            name='installMethod'
            onChange={this._getOnChange('installMethod')}
            type='radio'
            value='customConfig'
          />
          {' '}
          <span>{_('newVmCustomConfig')}</span>
          {' '}
          <DebounceInput
            className={classNames('form-control', styles.customConfig)}
            debounceTimeout={DEBOUNCE_TIMEOUT}
            disabled={!configDrive || installMethod !== 'customConfig'}
            element='textarea'
            onChange={this._getOnChange('customConfig')}
            value={customConfig}
          />
        </Item>
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
              {this.state.pool ? <SelectVdi
                disabled={installMethod !== 'ISO'}
                onChange={this._getOnChange('installIso')}
                srPredicate={this._getIsoPredicate()}
                value={installIso}
              />
              : <SelectResourceSetsVdi
                disabled={installMethod !== 'ISO'}
                onChange={this._getOnChange('installIso')}
                resourceSet={this.state.resourceSet}
                srPredicate={this._getIsoPredicate()}
                value={installIso}
              />}
            </span>
          </span>
        </Item>
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
            placeholder='e.g: http://ftp.debian.org/debian'
            value={installNetwork}
          />
        </Item>
        {template.virtualizationMode === 'pv'
          ? <Item label='newVmPvArgsLabel' key='pv'>
            <DebounceInput
              className='form-control'
              debounceTimeout={DEBOUNCE_TIMEOUT}
              onChange={this._getOnChange('pv_args')}
              value={pv_args}
            />
          </Item>
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
      sshKey,
      template
    } = this.state.state
    switch (installMethod) {
      case 'customConfig': return customConfig || !configDrive
      case 'ISO': return installIso
      case 'network': return /^(http|ftp|nfs)/i.exec(installNetwork)
      case 'PXE': return true
      case 'SSH': return sshKey || !configDrive
      default: return template && this._isDiskTemplate && !configDrive
    }
  }

// INTERFACES ------------------------------------------------------------------

  _renderInterfaces = () => {
    const { formatMessage } = this.props.intl
    const {
      state: { VIFs },
      pool
    } = this.state
    return <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
      <SectionContent column>
        {map(VIFs, (vif, index) => <div key={index}>
          <LineItem>
            <Item label='newVmMacLabel'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('VIFs', index, 'mac')}
                placeholder={formatMessage(messages.newVmMacPlaceholder)}
                rows={7}
                value={vif.mac}
              />
            </Item>
            <Item label='newVmNetworkLabel'>
              <span className={styles.inlineSelect}>
                {pool ? <SelectNetwork
                  onChange={this._getOnChange('VIFs', index, 'network', 'id')}
                  predicate={this._getNetworkPredicate()}
                  value={vif.network}
                />
                : <SelectResourceSetsNetwork
                  onChange={this._getOnChange('VIFs', index, 'network', 'id')}
                  resourceSet={this.state.resourceSet}
                  value={vif.network}
                />}
              </span>
            </Item>
            <Item>
              <Button onClick={() => this._removeInterface(index)} bsStyle='secondary'>
                <Icon icon='new-vm-remove' />
              </Button>
            </Item>
          </LineItem>
          {index < VIFs.length - 1 && <hr />}
        </div>
        )}
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
      state: { configDrive,
      existingDisks,
      VDIs },
      pool
    } = this.state
    let i = 0
    return <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
      <SectionContent column>

        {/* Existing disks */}
        {map(existingDisks, (disk, index) => <div key={i}>
          <LineItem>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                {pool ? <SelectSr
                  onChange={this._getOnChange('existingDisks', index, '$SR', 'id')}
                  predicate={this._getSrPredicate()}
                  value={disk.$SR}
                />
                : <SelectResourceSetsSr
                  onChange={this._getOnChange('existingDisks', index, '$SR', 'id')}
                  predicate={this._getSrPredicate()}
                  resourceSet={this.state.resourceSet}
                  value={disk.$SR}
                />}
              </span>
            </Item>
            {' '}
            <Item label='newVmNameLabel'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('existingDisks', index, 'name_label')}
                value={disk.name_label}
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('existingDisks', index, 'name_description')}
                value={disk.name_description}
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                onChange={this._getOnChange('existingDisks', index, 'size')}
                readOnly={!configDrive}
                value={disk.size || 0}
              />
            </Item>
          </LineItem>
          {i++ < size(existingDisks) + VDIs.length - 1 && <hr />}
        </div>)}

        {/* VDIs */}
        {map(VDIs, (vdi, index) => <div key={vdi.device}>
          <LineItem>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                {pool ? <SelectSr
                  onChange={this._getOnChange('VDIs', index, 'SR', 'id')}
                  predicate={this._getSrPredicate()}
                  value={vdi.SR}
                />
                : <SelectResourceSetsSr
                  onChange={this._getOnChange('VDIs', index, 'SR', 'id')}
                  predicate={this._getSrPredicate()}
                  resourceSet={this.state.resourceSet}
                  value={vdi.SR}
                />}
              </span>
            </Item>
            {' '}
            <Item className='checkbox'>
              <label>
                <input
                  checked={!!vdi.bootable}
                  onChange={this._getOnChangeCheckbox('VDIs', index, 'bootable')}
                  type='checkbox'
                />
                {' '}
                {_('newVmBootableLabel')}
              </label>
            </Item>
            <Item label='newVmNameLabel'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('VDIs', index, 'name_label')}
                value={vdi.name_label}
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <DebounceInput
                className='form-control'
                debounceTimeout={DEBOUNCE_TIMEOUT}
                onChange={this._getOnChange('VDIs', index, 'name_description')}
                value={vdi.name_description}
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                onChange={this._getOnChange('VDIs', index, 'size')}
                value={vdi.size || 0}
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

// SUMMARY ---------------------------------------------------------------------

  _renderSummary = () => {
    const {
      bootAfterCreate,
      CPUs,
      existingDisks,
      fastClone,
      memory,
      VDIs,
      VIFs
    } = this.state.state
    return <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
      <SectionContent summary>
        <span>
          {CPUs || 0}x{' '}
          <Icon icon='cpu' />
        </span>
        <span>
          {memory ? formatSize(memory) : '0 B'}
          {' '}
          <Icon icon='memory' />
        </span>
        <span>
          {size(existingDisks) + VDIs.length || 0}x{' '}
          <Icon icon='disk' />
        </span>
        <span>
          {VIFs.length}x{' '}
          <Icon icon='network' />
        </span>
      </SectionContent>
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
      <div style={{display: 'flex'}}>
        <span style={{margin: 'auto'}}>
          <input
            checked={bootAfterCreate}
            onChange={this._getOnChangeCheckbox('bootAfterCreate')}
            type='checkbox'
          />
          {' '}
          {_('newVmBootAfterCreate')}
        </span>
      </div>
    </Section>
  }
}
/* eslint-enable camelcase*/
