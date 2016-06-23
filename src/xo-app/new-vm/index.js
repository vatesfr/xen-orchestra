import _, { messages } from 'intl'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import classNames from 'classnames'
import debounce from 'lodash/debounce'
import every from 'lodash/every'
import filter from 'lodash/filter'
import find from 'lodash/find'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isArray from 'lodash/isArray'
import isObject from 'lodash/isObject'
import map from 'lodash/map'
import React from 'react'
import size from 'lodash/size'
import store from 'store'
import toArray from 'lodash/toArray'
import Wizard, { Section } from 'wizard'
import { Button } from 'react-bootstrap-4/lib'
import { injectIntl } from 'react-intl'
import {
  createVm,
  createVms,
  getCloudInitConfig
} from 'xo'
import {
  SelectVdi,
  SelectNetwork,
  SelectPool,
  SelectSr,
  SelectVmTemplate
} from 'select-objects'
import {
  SizeInput,
  Toggle
} from 'form'
import {
  connectStore,
  formatSize,
  getEventValue,
  noop
} from 'utils'
import {
  createSelector,
  createGetObject,
  createGetObjectsOfType
} from 'selectors'

import styles from './index.css'

/* eslint-disable camelcase */
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

const getObject = createGetObject((_, id) => id)

@connectStore(() => ({
  templates: createGetObjectsOfType('VM-template').sort(),
  networks: createGetObjectsOfType('network').sort()
}))
@injectIntl
export default class NewVm extends BaseComponent {
  constructor () {
    super()

    this._uniqueId = 0
    // NewVm's state is stored in this.state.state instead of this.state
    // so it can be emptied easily with this.setState(state: {})
    this.state = { state: {} }
  }

  getPoolNetworks = createSelector(
    () => this.props.networks,
    () => this.state.state.pool && this.state.state.pool.id,
    (networks, poolId) => filter(networks, network => network.$pool === poolId)
  )

  getUniqueId () {
    return this._uniqueId++
  }

  get _isDiskTemplate () {
    const { template } = this.state.state
    return template.template_info.disks.length === 0 && template.name_label !== 'Other install media'
  }

  _setInputValue (ref, value) {
    if (!this.refs[ref]) {
      return
    }
    const type = this.refs[ref].type
    if (type === 'text' || type === 'number') {
      this.refs[ref].value = value || ''
      return
    }
    this.refs[ref].value = value
  }

  _setInterfacesInputValues () {
    const { VIFs } = this.state.state
    const { refs } = this
    forEach(VIFs, vif => {
      refs[`mac_${vif.id}`].value = vif.mac || ''
      refs[`network_${vif.id}`].value = vif.network
    })
  }

  _setDisksInputValues () {
    const { existingDisks, VDIs } = this.state.state
    const { refs } = this
    forEach(toArray(existingDisks), (disk, index) => {
      refs[`sr_${index}`].value = disk.$SR
      refs[`name_label_${index}`].value = disk.name_label
      refs[`name_description_${index}`].value = disk.name_description
      refs[`size_${index}`].value = disk.size
    })
    forEach(VDIs, vdi => {
      refs[`sr_${vdi.device}`].value = vdi.SR
      refs[`bootable_${vdi.device}`].value = vdi.bootable
      refs[`name_label_${vdi.device}`].value = vdi.name_label
      refs[`name_description_${vdi.device}`].value = vdi.name_description
      refs[`size_${vdi.device}`].value = vdi.size
    })
  }

  _updateNbVms = event => {
    const nameLabels = []
    this.refs.nbVms.value = Math.max(Math.min(this.refs.nbVms.value, 100), 2)
    for (let i = 1; i <= this.refs.nbVms.value; i++) {
      nameLabels.push(`${this.state.state.name_label || 'VM'}_${i}`)
    }
    this._setState({ nameLabels })
  }

  _updateNameLabels = () => {
    const nbVms = this.state.state.nameLabels.length
    this._setState({ nameLabels: [] }, () => {
      const nameLabels = []
      for (let i = 1; i <= nbVms; i++) {
        nameLabels.push(`${this.state.state.name_label || 'VM'}_${i}`)
      }
      this._setState({ nameLabels })
    })
  }

  _setState = (newValues, callback) => {
    this.setState({ state: {
      ...this.state.state,
      ...newValues
    }}, callback)
  }
  _replaceState = (state, callback) =>
    this.setState({ state }, callback)

  _reset = pool => {
    const { refs } = this
    forEach(refs, (ref, key) => {
      if (ref.tagName === 'INPUT' || ref.tagName === 'TEXTAREA') {
        ref.value = ''
      } else if (key !== 'pool') {
        ref.value = undefined
      }
    })
    // CPU weight should be "Normal" by default
    refs.cpuWeight && (refs.cpuWeight.value = 1)
    // Number of VMs should be 2 by default
    refs.nbVms && (refs.nbVms.value = 2)
    const previousPool = this.state.state.pool
    this._replaceState({
      bootAfterCreate: true,
      cpuWeight: 1,
      existingDisks: {},
      fastClone: true,
      nameLabels: ['VM_1', 'VM_2'],
      pool: pool || previousPool,
      VDIs: [],
      VIFs: []
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
        cloudConfig = '#cloud-config\nhostname: ' + hostname + '\nssh_authorized_keys:\n  - ' + state.sshKey + '\n'
      } else {
        cloudConfig = state.customConfig
      }
    } else if (state.template.name_label === 'CoreOS') {
      cloudConfig = state.cloudConfig
    }

    const data = {
      clone: state.fastClone,
      existingDisks: state.existingDisks,
      installation,
      name_label: state.name_label,
      template: state.template.id,
      VDIs: state.VDIs,
      VIFs: state.VIFs,
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
    if (state.multipleVms) {
      return createVms(data, state.nameLabels)
    } else {
      return createVm(data)
    }
  }

  _selectPool = pool =>
    this._reset(pool)

  _getIsInPool = createSelector(
    () => this.state.state.pool.id,
    poolId => object => object.$pool === poolId
  )

  _getSrPredicate = createSelector(
    () => this.state.state.pool.id,
    poolId => disk => disk.$pool === poolId && disk.content_type === 'user'
  )

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

    const storeState = store.getState()

    const existingDisks = {}
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(storeState, vbdId)
      if (vbd.is_cd_drive) {
        return
      }
      const vdi = getObject(storeState, vbd.VDI)
      existingDisks[this.getUniqueId()] = {
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: vdi.size,
        $SR: vdi.$SR
      }
    })

    const VIFs = []
    forEach(template.VIFs, vifId => {
      const vif = getObject(storeState, vifId)
      VIFs.push({
        id: this.getUniqueId(),
        network: vif.$network
      })
    })
    if (VIFs.length === 0) {
      const network = find(this.getPoolNetworks(), network => network.name_label === 'Host internal management network')
      VIFs.push({
        id: this.getUniqueId(),
        network: network && network.id
      })
    }
    const { state } = this.state
    const name_label = state.name_label === '' || !state.name_labelHasChanged ? template.name_label : state.name_label
    this._setState({
      // infos
      name_label,
      template,
      name_description: state.name_description === '' || !state.name_descriptionHasChanged ? template.name_description || '' : state.name_description,
      nameLabels: [`${name_label}_1`, `${name_label}_2`],
      // performances
      memory: template.memory.size,
      CPUs: template.CPUs.number,
      cpuWeight: 1,
      // installation
      installMethod: template.install_methods && template.install_methods[0] || state.installMethod,
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
          SR: state.pool.default_SR
        }
      })
    }, () => forEach(this.state.state, (element, key) => {
      !isArray(element) && !isObject(element) && this._setInputValue(key, element)
      this._setInterfacesInputValues()
      this._setDisksInputValues()
    }))

    getCloudInitConfig(template.id).then(cloudConfig => {
      this._setState({ cloudConfig }, () => {
        this.refs.cloudConfig && (this.refs.cloudConfig.value = cloudConfig)
      })
    },
    noop)
  }

  _addVdi = () => {
    const { state } = this.state
    const device = String(this.getUniqueId())
    this._setState({ VDIs: [ ...state.VDIs, {
      device,
      name_description: 'Created by XO',
      name_label: (state.name_label || 'disk') + '_' + device,
      SR: state.pool.default_SR,
      type: 'system'
    }] })
  }
  _removeVdi = index => {
    const { VDIs } = this.state.state
    this._setState({ VDIs: [ ...VDIs.slice(0, index), ...VDIs.slice(index + 1) ] })
  }
  _addInterface = () => {
    const network = find(this.getPoolNetworks(), network => network.name_label === 'Host internal management network')
    this._setState({ VIFs: [ ...this.state.state.VIFs, {
      id: this.getUniqueId(),
      network: network && network.id
    }] })
  }
  _removeInterface = index => {
    const { VIFs } = this.state.state
    this._setState({ VIFs: [ ...VIFs.slice(0, index), ...VIFs.slice(index + 1) ] })
  }

  _getOnChange (prop) {
    const debouncer = debounce(param => {
      this._setState({
        [prop]: param,
        name_labelHasChanged: this.state.state.name_labelHasChanged || prop === 'name_label',
        name_descriptionHasChanged: this.state.state.name_descriptionHasChanged || prop === 'name_description'
      })
    }, 100)
    return param => {
      const _param = param && param.target ? param.target.value : param
      debouncer(_param)
    }
  }
  _getOnChangeCheckbox (prop) {
    const debouncer = debounce(checked =>
      this._setState({ [prop]: checked }), 100
    )
    return event => {
      const _param = event.target.checked
      debouncer(_param)
    }
  }
  _getOnChangeArrayValue (stateElement, index) {
    const debouncer = debounce(param => {
      let stateValue = this.state.state[stateElement]
      stateValue[index] = param
      this._setState({ [stateElement]: stateValue })
    }, 100)
    return param => debouncer(getEventValue(param))
  }
  _getOnChangeArrayObject (stateElement, key, stateProperty, targetProperty) {
    const debouncer = debounce(param => {
      let stateValue = this.state.state[stateElement]
      stateValue = isArray(stateValue) ? [ ...stateValue ] : { ...stateValue }
      stateValue[key][stateProperty] = param && param[targetProperty] || param
      this._setState({ [stateElement]: stateValue })
    }, 100)
    return param => debouncer(getEventValue(param))
  }
  _getOnChangeArrayObjectCheckbox (stateElement, key, stateProperty, targetProperty) {
    const debouncer = debounce(param => {
      const stateValue = { ...this.state.state[stateElement] }
      stateValue[key][stateProperty] = param
      this._setState({ [stateElement]: stateValue })
    }, 100)
    return event => {
      const _param = event.target.checked
      debouncer(_param)
    }
  }

  _getRedirectionUrl = id =>
    this.state.state.multipleVms ? '/home' : `/vms/${id}`

  render () {
    return <div>
      <h1>
        {_('newVmCreateNewVmOn', {
          pool: <span className={styles.inlineSelect}>
            <SelectPool ref='pool' onChange={this._selectPool} />
          </span>
        })}
      </h1>
      {this.state.state.pool && <form id='vmCreation' ref='form'>
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
    </div>
  }

  _renderInfo = () => {
    const { multipleVms, nameLabels } = this.state.state
    return <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfoDone()}>
      <SectionContent>
        <Item label='newVmTemplateLabel'>
          <span className={styles.inlineSelect}>
            <SelectVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              predicate={this._getIsInPool()}
              ref='template'
            />
          </span>
        </Item>
        <Item label='newVmNameLabel'>
          <input ref='name_label' onChange={this._getOnChange('name_label')} className='form-control' type='text' required />
        </Item>
        <Item label='newVmDescriptionLabel'>
          <input ref='name_description' onChange={this._getOnChange('name_description')} className='form-control' type='text' />
        </Item>
      </SectionContent>
      <SectionContent column>
        <LineItem>
          <Item>
            <Toggle ref='multipleVms' onChange={this._getOnChange('multipleVms')} />
            <div className='input-group'>
              <input type='number' disabled={!multipleVms} min={2} max={100} ref='nbVms' className='form-control' defaultValue={2} />
              <span className='input-group-btn'>
                <Button bsStyle='secondary' disabled={!multipleVms} onClick={this._updateNbVms}><Icon icon='arrow-right' /></Button>
              </span>
            </div>
            <a style={{cursor: 'pointer'}} onClick={this._updateNameLabels}><Icon icon='refresh' /></a>
          </Item>
        </LineItem>
        {multipleVms && <LineItem>
          {map(nameLabels, (nameLabel, index) =>
            <Item key={`nameLabel_${index}`}>
              <input type='text' className='form-control' defaultValue={nameLabel} onChange={this._getOnChangeArrayValue('nameLabels', index)} ref={`nameLabel_${index}`} />
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
    return <Section icon='new-vm-perf' title='newVmPerfPanel' done={this._isPerformancesDone()}>
      <SectionContent>
        <Item label='newVmVcpusLabel'>
          <input ref='CPUs' onChange={this._getOnChange('CPUs')} className='form-control' type='number' />
        </Item>
        <Item label='newVmRamLabel'>
          <SizeInput ref='memory' onChange={this._getOnChange('memory')} className={styles.sizeInput} />
        </Item>
        <Item label='newVmCpuWeightLabel'>
          <select
            className='form-control'
            defaultValue={1}
            onChange={this._getOnChange('cpuWeight')}
            ref='cpuWeight'
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

  _renderInstallSettings = () => {
    const { template } = this.state.state
    if (!template) {
      return
    }
    const { configDrive, installMethod, pool } = this.state.state
    return <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
      {this._isDiskTemplate ? <SectionContent key='diskTemplate'>
        <div className={styles.configDrive}>
          <span className={styles.configDriveToggle}>
            {_('newVmConfigDrive')}
          </span>
          <span className={styles.configDriveToggle}>
            <Toggle
              defaultValue={false}
              onChange={this._getOnChange('configDrive')}
            />
          </span>
        </div>
        <Item>
          <input disabled={!configDrive} onChange={this._getOnChange('installMethod')} name='installMethod' value='SSH' type='radio' />
          {' '}
          <span>{_('newVmSshKey')}</span>
          {' '}
          <input onChange={this._getOnChange('sshKey')} disabled={installMethod !== 'SSH'} className='form-control' type='text' />
        </Item>
        <Item>
          <input disabled={!configDrive} onChange={this._getOnChange('installMethod')} name='installMethod' value='customConfig' type='radio' />
          {' '}
          <span>{_('newVmCustomConfig')}</span>
          {' '}
          <textarea
            className='form-control'
            disabled={installMethod !== 'customConfig'}
            onChange={this._getOnChange('customConfig')}
            ref='customConfig'
            type='text'
          />
        </Item>
      </SectionContent>
      : <SectionContent>
        <Item>
          <span className={styles.item}>
            <input onChange={this._getOnChange('installMethod')} name='installMethod' value='ISO' type='radio' />
            &nbsp;
            <span>{_('newVmIsoDvdLabel')}</span>
            &nbsp;
            <span className={styles.inlineSelect}>
              <SelectVdi
                disabled={installMethod !== 'ISO'}
                onChange={this._getOnChange('installIso')}
                srPredicate={sr => sr.$pool === pool.id && sr.SR_type === 'iso'}
                ref='installIso'
              />
            </span>
          </span>
        </Item>
        <Item>
          <input onChange={this._getOnChange('installMethod')} name='installMethod' value='network' type='radio' />
          {' '}
          <span>{_('newVmNetworkLabel')}</span>
          {' '}
          <input key='networkInput' ref='installNetwork' onChange={this._getOnChange('installNetwork')} disabled={installMethod !== 'network'} placeholder='e.g: http://ftp.debian.org/debian' type='text' className='form-control' />
        </Item>
        {template.virtualizationMode === 'pv'
          ? <Item label='newVmPvArgsLabel' key='pv'>
            <input onChange={this._getOnChange('pv_args')} className='form-control' type='text' />
          </Item>
          : <Item>
            <input onChange={this._getOnChange('installMethod')} name='installMethod' value='PXE' type='radio' />
            {' '}
            <span>{_('newVmPxeLabel')}</span>
          </Item>
        }
      </SectionContent>}
      {template.name_label === 'CoreOS' && <div>
        <label>{_('newVmCloudConfig')}</label>
        <textarea
          className='form-control'
          onChange={this._getOnChange('cloudConfig')}
          ref='cloudConfig'
          rows={7}
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
      case 'customConfig': return customConfig
      case 'ISO': return installIso
      case 'network': return /^(http|ftp|nfs)/i.exec(installNetwork)
      case 'PXE': return true
      case 'SSH': return sshKey
      default: return template && this._isDiskTemplate && !configDrive
    }
  }

  _renderInterfaces = () => {
    const { formatMessage } = this.props.intl
    const { VIFs } = this.state.state
    return <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
      <SectionContent column>
        {map(VIFs, (vif, index) => <div key={index}>
          <LineItem>
            <Item label='newVmMacLabel'>
              <input ref={`mac_${vif.id}`} onChange={this._getOnChangeArrayObject('VIFs', index, 'mac')} defaultValue={vif.mac} placeholder={formatMessage(messages.newVmMacPlaceholder)} className='form-control' type='text' />
            </Item>
            <Item label='newVmNetworkLabel'>
              <span className={styles.inlineSelect}>
                <SelectNetwork
                  defaultValue={vif.network}
                  onChange={this._getOnChangeArrayObject('VIFs', index, 'network', 'id')}
                  predicate={this._getIsInPool()}
                  ref={`network_${vif.id}`}
                />
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

  _renderDisks = () => {
    const { configDrive, existingDisks, VDIs } = this.state.state
    return <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
      <SectionContent column>

        {/* Existing disks */}
        {map(toArray(existingDisks), (disk, index) => <div key={index}>
          <LineItem>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                <SelectSr
                  defaultValue={disk.$SR}
                  onChange={this._getOnChangeArrayObject('existingDisks', index, '$SR', 'id')}
                  predicate={this._getSrPredicate()}
                  ref={`sr_${index}`}
                />
              </span>
            </Item>
            {' '}
            <Item label='newVmNameLabel'>
              <input
                className='form-control'
                defaultValue={disk.name_label}
                onChange={this._getOnChangeArrayObject('existingDisks', index, 'name_label')}
                ref={`name_label_${index}`}
                type='text'
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <input
                className='form-control'
                defaultValue={disk.name_description}
                onChange={this._getOnChangeArrayObject('existingDisks', index, 'name_description')}
                ref={`name_description_${index}`}
                type='text'
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                defaultValue={disk.size}
                onChange={this._getOnChangeArrayObject('existingDisks', index, 'size')}
                readOnly={!configDrive}
                ref={`size_${index}`}
              />
            </Item>
          </LineItem>
          {index < size(existingDisks) + VDIs.length - 1 && <hr />}
        </div>)}

        {/* VDIs */}
        {map(VDIs, (vdi, index) => <div key={vdi.device}>
          <LineItem>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                <SelectSr
                  defaultValue={vdi.SR}
                  onChange={this._getOnChangeArrayObject('VDIs', index, 'SR', 'id')}
                  predicate={this._getSrPredicate()}
                  ref={`sr_${vdi.device}`}
                />
              </span>
            </Item>
            {' '}
            <Item className='checkbox'>
              <label>
                <input
                  checked={vdi.bootable}
                  onChange={this._getOnChangeArrayObjectCheckbox('VDIs', index, 'bootable')}
                  ref={`bootable_${vdi.device}`}
                  type='checkbox'
                />
                {' '}
                {_('newVmBootableLabel')}
              </label>
            </Item>
            <Item label='newVmNameLabel'>
              <input
                className='form-control'
                defaultValue={vdi.name_label}
                onChange={this._getOnChangeArrayObject('VDIs', index, 'name_label')}
                ref={`name_label_${vdi.device}`}
                type='text'
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <input
                className='form-control'
                defaultValue={vdi.name_description}
                onChange={this._getOnChangeArrayObject('VDIs', index, 'name_description')}
                ref={`name_description_${vdi.device}`}
                type='text'
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                defaultValue={vdi.size}
                onChange={this._getOnChangeArrayObject('VDIs', index, 'size')}
                ref={`size_${vdi.device}`}
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

  _renderSummary = () => {
    const { bootAfterCreate, CPUs, existingDisks, fastClone, memory, VDIs, VIFs } = this.state.state
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
      <div style={{display: 'flex'}}>
        <span style={{margin: 'auto'}}>
          <input
            checked={fastClone}
            onChange={this._getOnChangeCheckbox('fastClone')}
            ref='fastClone'
            type='checkbox'
          />
          {' '}
          <Icon icon='vm-fast-clone' />
          {' '}
          {_('fastCloneVmLabel')}
        </span>
      </div>
      <div style={{display: 'flex'}}>
        <span style={{margin: 'auto'}}>
          <input
            checked={bootAfterCreate}
            onChange={this._getOnChangeCheckbox('bootAfterCreate')}
            ref='bootAfterCreate'
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
