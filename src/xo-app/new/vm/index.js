import _, { messages } from 'messages'
import ActionButton from 'action-button'
import BaseComponent from 'base-component'
import cloneDeep from 'lodash/cloneDeep'
import { Button } from 'react-bootstrap-4/lib'
import classNames from 'classnames'
import concat from 'lodash/concat'
import debounce from 'lodash/debounce'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isArray from 'lodash/isArray'
import keys from 'lodash/keys'
import map from 'lodash/map'
import pullAt from 'lodash/pullAt'
import React from 'react'
import size from 'lodash/size'
import store from 'store'
import Wizard, { Section } from 'wizard'
import { injectIntl } from 'react-intl'

import {
  createVm
} from 'xo'

import {
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
  formatSize
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

@connectStore(() => {
  const getTemplates = createGetObjectsOfType('VM-template').sort()
  return (state, props) => {
    return {
      templates: getTemplates(state, props)
    }
  }
})
@injectIntl
export default class NewVm extends BaseComponent {
  constructor () {
    super()

    this._uniqueId = 0
  }

  get uniqueId () {
    return this._uniqueId++
  }

  get _isDiskTemplate () {
    const { template } = this.state
    return template.template_info.disks.length === 0 && template.name_label !== 'Other install media'
  }

  _setRef (key, value) {
    if (!this.refs[key]) {
      console.log('Cannot set ref ', key)
      return
    }
    const type = this.refs[key].type
    if (type === 'text' || type === 'number') {
      this.refs[key].value = value || ''
      return
    }
    this.refs[key].value = value
  }

  _reset = () => {
    const { refs } = this
    forEach(keys(refs), key => {
      if (key === 'pool') {
        return
      }
      switch (this.refs[key].type) {
        case 'text':
        case 'number':
          this.refs[key].value = ''
          break
        case 'select-one':
          this.refs[key].value = 0
          break
        default: this.refs[key].value = undefined
      }
    })
    this.setState({
      bootAfterCreate: true,
      fastClone: true,
      CPUs: undefined,
      configDrive: undefined,
      existingDisks: {},
      installMethod: undefined,
      installIso: undefined,
      memory: undefined,
      name_description: undefined,
      name_label: undefined,
      template: undefined,
      VDIs: [],
      VIFs: []
    })
  }

  _create = () => {
    const { state } = this
    let installation
    switch (state.installMethod) {
      case 'ISO':
        installation = {
          method: 'cdrom',
          repository: state.installIso
        }
        break
      case 'network':
        const matches = /^(http|ftp|nfs)/i.exec(state.installNetwork)
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

    let cloudContent
    if (state.configDrive) {
      const hostname = state.name_label.replace(/^\s+|\s+$/g, '').replace(/\s+/g, '-')
      if (this.installMethod === 'SSH') {
        cloudContent = '#cloud-config\nhostname: ' + hostname + '\nssh_authorized_keys:\n  - ' + state.sshKey + '\n'
      } else {
        cloudContent = state.customConfig
      }
    }

    if (state.template.name_label === 'CoreOS') {
      cloudContent = 'CoreOS'
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
      cpuWeight: undefined, // TODO: implement UI
      name_description: state.name_description,
      memory: state.memory,
      pv_args: state.pv_args,
      // Boolean: if true, boot the VM right after its creation
      bootAfterCreate: state.bootAfterCreate,
      /* String:
       * - if 'CoreOS': vm.getCloudInitConfig --> vm.createCloudInitConfigDrive --> docker.register
       * - else: vm.createCloudInitConfigDrive(..., cloudContent) --> vm.setBootOrder
       */
      cloudContent

    }
    createVm(data)
  }

  _selectPool = pool => {
    this.setState({ pool })
    this._reset()
  }

  _getIsInPool = createSelector(
    () => this.state.pool,
    pool => object => object.$pool === pool.id
  )

  _getSrPredicate = createSelector(
    () => this.state.pool,
    pool => disk => disk.$pool === pool.id && disk.content_type === 'user'
  )

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

    const state = store.getState()
    console.log('template = ', template)
    console.log('template infos = ', template.template_info)

    const existingDisks = {}
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(state, vbdId)
      if (vbd.is_cd_drive) {
        return
      }
      const vdi = getObject(state, vbd.VDI)
      existingDisks[this.uniqueId] = {
        name_label: vdi.name_label,
        name_description: vdi.name_description,
        size: vdi.size,
        $SR: vdi.$SR
      }
    })

    const VIFs = []
    forEach(template.VIFs, vifId => {
      const vif = getObject(state, vifId)
      VIFs.push({
        mac: vif.MAC,
        network: vif.$network,
        id: this.uniqueId
      })
    })

    this.setState({
      // infos
      name_label: template.name_label,
      template,
      name_description: template.name_description || this.state.name_description || '',
      // performances
      memory: template.memory.size,
      CPUs: template.CPUs.number,
      // installation
      installMethod: template.install_methods && template.install_methods[0] || this.state.installMethod,
      // interfaces
      VIFs,
      // disks
      existingDisks,
      VDIs: map(template.template_info.disks, disk => ({ ...disk, device: this.uniqueId }))
    }, () => forEach(this.state, (element, key) => {
      !isArray(element) && this._setRef(key, element)
    }))
  }

  _addVdi = () => this.setState({ VDIs: concat(this.state.VDIs, {
    device: String(this.uniqueId),
    type: 'system'
  }) })
  _removeVdi = index => {
    const VDIs = cloneDeep(this.state.VDIs)
    pullAt(VDIs, index)
    this.setState({ VDIs })
  }
  _addInterface = () => this.setState({ VIFs: concat(this.state.VIFs, {
    id: this.uniqueId
  }) })
  _removeInterface = index => {
    const VIFs = cloneDeep(this.state.VIFs)
    pullAt(VIFs, index)
    this.setState({ VIFs })
  }

  _getOnChange = (prop) => param => {
    const _param = param && param.target ? param.target.value : param
    this.setState({ [prop]: _param })
  }
  _getOnChangeCheckbox = (prop) => event => {
    this.setState({ [prop]: event.target.checked })
  }
  _getOnChangeObject = (stateElement, key, stateProperty, targetProperty) => {
    const debouncer = debounce(param => {
      const stateValue = cloneDeep(this.state[stateElement])
      stateValue[key][stateProperty] = param[targetProperty] || param
      this.setState({ [stateElement]: stateValue })
    }, 100)
    return param => {
      const _param = param.target ? param.target.value : param
      debouncer(_param)
    }
  }
  _getOnChangeObjectCheckbox = (stateElement, key, stateProperty, targetProperty) => {
    const debouncer = debounce(param => {
      const stateValue = cloneDeep(this.state[stateElement])
      stateValue[key][stateProperty] = param
      this.setState({ [stateElement]: stateValue })
    }, 100)
    return event => {
      const _param = event.target.checked
      debouncer(_param)
    }
  }

  render () {
    return <div>
      <h1>
        {_('newVmCreateNewVmOn', {
          pool: <span className={styles.inlineSelect}>
            <SelectPool ref='pool' onChange={this._selectPool} />
          </span>
        })}
      </h1>
      {this.state.pool && <div>
        <Wizard>
          {this._renderInfos()}
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
              this._isInfosDone() &&
              this._isPerformancesDone() &&
              this._isInstallSettingsDone() &&
              this._isInterfacesDone() &&
              this._isDisksDone()
            )}
            handler={this._create}
            icon='new-vm-create'
            redirectOnSuccess='/home'
            type='submit'
          >
            {_('newVmCreate')}
          </ActionButton>
        </div>
      </div>}
    </div>
  }

  _renderInfos = () => {
    return <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfosDone()}>
      <SectionContent>
        <Item label='newVmNameLabel'>
          <input ref='name_label' onChange={this._getOnChange('name_label')} className='form-control' type='text' required />
        </Item>
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
        <Item label='newVmDescriptionLabel'>
          <input ref='name_description' onChange={this._getOnChange('name_description')} className='form-control' type='text' />
        </Item>
      </SectionContent>
    </Section>
  }
  _isInfosDone = () => {
    const { template, name_label } = this.state
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
      </SectionContent>
    </Section>
  }
  _isPerformancesDone = () => {
    const { CPUs, memory } = this.state
    return CPUs && memory !== undefined
  }

  _renderInstallSettings = () => {
    const { template } = this.state
    if (!template) {
      return
    }
    const { configDrive, installMethod, pool } = this.state
    return <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
      {this._isDiskTemplate ? <SectionContent>
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
          <input ref='sshKey' onChange={this._getOnChange('sshKey')} disabled={installMethod !== 'SSH'} className='form-control' type='text' />
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
          <input onChange={this._getOnChange('installMethod')} name='installMethod' value='ISO' type='radio' />
          {' '}
          <span>{_('newVmIsoDvdLabel')}</span>
          {' '}
          <span className={styles.inlineSelect}>
            <SelectSr
              disabled={installMethod !== 'ISO'}
              onChange={this._getOnChange('installIso')}
              predicate={sr => sr.$pool === pool.id && sr.content_type !== 'user'}
              ref='installIso'
            />
          </span>
        </Item>
        <Item>
          <input onChange={this._getOnChange('installMethod')} name='installMethod' value='network' type='radio' />
          {' '}
          <span>{_('newVmNetworkLabel')}</span>
          {' '}
          <input ref='installNetwork' onChange={this._getOnChange('installNetwork')} disabled={installMethod !== 'network'} placeholder='e.g: http://ftp.debian.org/debian' type='text' className='form-control' />
        </Item>
        {template.virtualizationMode === 'pv'
          ? <Item label='newVmPvArgsLabel'>
            <input ref='pv_args' onChange={this._getOnChange('pv_args')} className='form-control' type='text' />
          </Item>
          : <span>
            <Item>
              <input onChange={this._getOnChange('installMethod')} name='installMethod' value='PXE' type='radio' />
              {' '}
              <span>{_('newVmPxeLabel')}</span>
            </Item>
          </span>
        }
      </SectionContent>}
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
    } = this.state
    switch (installMethod) {
      case 'customConfig': return customConfig
      case 'ISO': return installIso
      case 'network': return installNetwork
      case 'PXE': return true
      case 'SSH': return sshKey
      default: return template && this._isDiskTemplate && !configDrive
    }
  }

  _renderInterfaces = () => {
    const { formatMessage } = this.props.intl
    return <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
      <SectionContent column>
        {map(this.state.VIFs, (vif, index) => <div>
          <LineItem key={index}>
            <Item label='newVmMacLabel'>
              <input ref={`mac_${vif.id}`} onChange={this._getOnChangeObject('VIFs', index, 'mac')} defaultValue={vif.mac} placeholder={formatMessage(messages.newVmMacPlaceholder)} className='form-control' type='text' />
            </Item>
            <Item label='newVmNetworkLabel'>
              <span className={styles.inlineSelect}>
                <SelectNetwork
                  defaultValue={vif.network}
                  onChange={this._getOnChangeObject('VIFs', index, '$network', 'id')}
                  predicate={this._getIsInPool()}
                  ref='network'
                />
              </span>
            </Item>
            <Item>
              <Button onClick={() => this._removeInterface(index)} bsStyle='secondary'>
                <Icon icon='new-vm-remove' />
              </Button>
            </Item>
          </LineItem>
          {index < this.state.VIFs.length - 1 && <hr />}
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
  _isInterfacesDone = () => every(this.state.VIFs, vif =>
    vif.network
  )

  _renderDisks = () => {
    return <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
      <SectionContent column>

        {/* Existing disks */}
        {map(this.state.existingDisks, (disk, index) => <div>
          <LineItem key={index}>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                <SelectSr
                  defaultValue={disk.$SR}
                  onChange={this._getOnChangeObject('existingDisks', index, '$SR', 'id')}
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
                onChange={this._getOnChangeObject('existingDisks', index, 'name_label')}
                ref={`name_label_${index}`}
                type='text'
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <input
                className='form-control'
                defaultValue={disk.name_description}
                onChange={this._getOnChangeObject('existingDisks', index, 'name_description')}
                ref={`name_description_${index}`}
                type='text'
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                defaultValue={disk.size}
                onChange={this._getOnChangeObject('existingDisks', index, 'size')}
                readOnly={!this.state.configDrive}
                ref={`size_${index}`}
              />
            </Item>
          </LineItem>
          {index < size(this.state.existingDisks) + this.state.VDIs.length - 1 && <hr />}
        </div>
        )}

        {/* VDIs */}
        {map(this.state.VDIs, (vdi, index) => <div>
          <LineItem key={vdi.device}>
            <Item label='newVmSrLabel'>
              <span className={styles.inlineSelect}>
                <SelectSr
                  defaultValue={vdi.SR}
                  onChange={this._getOnChangeObject('VDIs', index, 'SR', 'id')}
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
                  onChange={this._getOnChangeObjectCheckbox('VDIs', index, 'bootable')}
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
                onChange={this._getOnChangeObject('VDIs', index, 'name_label')}
                ref={`name_label_${vdi.device}`}
                type='text'
              />
            </Item>
            <Item label='newVmDescriptionLabel'>
              <input
                className='form-control'
                defaultValue={vdi.name_description}
                onChange={this._getOnChangeObject('VDIs', index, 'name_description')}
                ref={`name_description_${vdi.device}`}
                type='text'
              />
            </Item>
            <Item label='newVmSizeLabel'>
              <SizeInput
                className={styles.sizeInput}
                defaultValue={vdi.size}
                onChange={this._getOnChangeObject('VDIs', index, 'size')}
                ref={`size_${vdi.device}`}
              />
            </Item>
            <Item>
              <Button onClick={() => this._removeVdi(index)} bsStyle='secondary'>
                <Icon icon='new-vm-remove' />
              </Button>
            </Item>
          </LineItem>
          {index < this.state.VDIs.length - 1 && <hr />}
        </div>
      )}
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
  _isDisksDone = () => every(this.state.VDIs, vdi =>
      vdi.SR && vdi.name_label && vdi.size !== undefined
    ) &&
    every(this.state.existingDisks, (vdi, index) =>
      vdi.$SR && vdi.name_label && vdi.size !== undefined
    )

  _renderSummary = () => {
    const { bootAfterCreate, CPUs, fastClone, memory, template, VDIs, VIFs } = this.state
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
          {template && (template.$VBDs.length + VDIs.length) || 0}x{' '}
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
