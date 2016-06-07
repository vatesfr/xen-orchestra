import _ from 'messages'
import BaseComponent from 'base-component'
import { Button } from 'react-bootstrap-4/lib'
import classNames from 'classnames'
import concat from 'lodash/concat'
import every from 'lodash/every'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import isArray from 'lodash/isArray'
import keys from 'lodash/keys'
import map from 'lodash/map'
import pullAt from 'lodash/pullAt'
import React from 'react'
import store from 'store'
import Wizard, { Section } from 'wizard'

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
  SizeInput
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

// import { Debug } from 'utils'
/* eslint-disable camelcase */
const SectionContent = ({ summary, column, children }) => (
  <div className={classNames(
    'form-inline',
    summary ? styles.summary : styles.sectionContent,
    column && styles.column
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
    {label && <span><label>{_(label)}</label>{' '}</span>}
    {children}
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
export default class NewVm extends BaseComponent {
  constructor () {
    super()

    this._uniqueId = 0
  }

  get uniqueId () {
    return this._uniqueId++
  }

  get _isDiskTemplate () {
    return this.state.VDIs.length === 0 || this.state.template.name_label === 'Other install media'
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
      name_label: undefined,
      template: undefined,
      name_description: undefined,
      CPUs: undefined,
      memory: undefined,
      installMethod: undefined,
      VDIs: [],
      VIFs: []
    })
  }

  _create = () => {
    const { state } = this
    const args = {
      name_label: state.name_label,
      template: state.template.id,
      name_description: state.name_description,
      CPUs: state.CPUs,
      memory: state.memory,
      pv_args: state.pv_args,
      VIFs: state.VIFs,
      VDIs: state.VDIs
    }
    createVm(args)
  }

  _selectPool = pool => {
    this.setState({ pool })
    this._reset()
  }

  _isInPool = createSelector(
    () => this.state.pool,
    pool => object => object.$pool === pool.id
  )

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }

    const state = store.getState()
    console.log('template = ', template)

    const VDIs = []
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(state, vbdId)
      if (vbd.is_cd_drive) {
        return
      }
      const vdi = getObject(state, vbd.VDI)
      const filteredVdi = {
        bootable: vbd.bootable,
        device: undefined, // TODO
        name_label: vdi.name_label,
        name_description: vdi.name_description || 'Created by XO',
        size: vdi.size,
        SR: vdi.$SR,
        type: vdi.type
      }
      VDIs.push(filteredVdi)
    })

    const VIFs = []
    forEach(template.VIFs, vifId => {
      const vif = getObject(state, vifId)
      const filteredVif = {
        mac: vif.MAC,
        network: vif.$network
      }
      VIFs.push(filteredVif)
    })

    this.setState({
      // infos
      template,
      name_label: '',
      name_description: template.name_description,
      // performances
      memory: template.memory.size,
      CPUs: template.CPUs.number,
      // interfaces
      VIFs,
      // disks
      VDIs
    }, () => forEach(this.state, (element, key) => {
      !isArray(element) && this._setRef(key, element)
    }))
  }

  _selectInstallMethod = event => this.setState({ installMethod: event.target.value })

  _addVdi = () => this.setState({ VDIs: concat(this.state.VDIs, {
    id: this.uniqueId,
    type: 'system'
  }) })
  _removeVdi = index => {
    const VDIs = this.state.VDIs.slice(0)
    pullAt(VDIs, index)
    this.setState({ VDIs })
  }
  _addInterface = () => this.setState({ VIFs: concat(this.state.VIFs, { id: this.uniqueId }) })
  _removeInterface = index => {
    const VIFs = this.state.VIFs.slice(0)
    pullAt(VIFs, index)
    this.setState({ VIFs })
  }

  _onChange = (ref, index, stateProp, targetProp) => event => {
    const stateValue = this.state[ref] && this.state[ref].slice && this.state[ref].slice(0)
    if (isArray(stateValue)) {
      stateValue[index][stateProp] = event.target ? event.target.value[targetProp] || event.target.value : event[targetProp] || event
      this.setState({ stateValue })
      return
    }

    this.setState({ [ref]: event.target ? event.target.value[targetProp] || event.target.value : event[targetProp] || event })
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
      {/* <button onClick={this._test}>CLICK ME</button> */}
      {this.state.pool && <div>
        <Wizard>
          {this._renderInfos()}
          {this._renderPerformances()}
          {this._renderInstallSettings()}
          {this._renderInterfaces()}
          {this._renderDisks()}
          {this._renderSummary()}
        </Wizard>
        <div style={{display: 'flex', justifyContent: 'space-around'}}>
          <Button
            bsStyle='secondary'
            className={styles.button}
            onClick={this._reset}
          >
            <Icon icon='new-vm-reset' />
            {' '}
            {_('newVmReset')}
          </Button>
          <Button
            bsStyle='primary'
            className={styles.button}
            disabled={!(
              this._isInfoDone() &&
              this._isPerformancesDone() &&
              this._isInstallSettingsDone() &&
              this._isInterfacesDone() &&
              this._isDisksDone()
            )}
            onClick={this._create}
            type='submit'
          >
            <Icon icon='new-vm-create' />
            {' '}
            {_('newVmCreate')}
          </Button>
        </div>
      </div>}
    </div>
  }

  _renderInfos = () => {
    return <Section icon='new-vm-infos' title='newVmInfoPanel' done={this._isInfoDone()}>
      <SectionContent>
        <Item label='newVmNameLabel'>
          <input ref='name_label' onChange={this._onChange('name_label')} className='form-control' type='text' required />
        </Item>
        <Item label='newVmTemplateLabel'>
          <span className={styles.inlineSelect}>
            <SelectVmTemplate
              onChange={this._initTemplate}
              placeholder={_('newVmSelectTemplate')}
              predicate={this._isInPool()}
              ref='template'
            />
          </span>
        </Item>
        <Item label='newVmDescriptionLabel'>
          <input ref='name_description' onChange={this._onChange('name_description')} className='form-control' type='text' />
        </Item>
      </SectionContent>
    </Section>
  }
  _isInfoDone = () => {
    const { template, name_label, name_description } = this.state
    return name_label && template && name_description
  }

  _renderPerformances = () => {
    return <Section icon='new-vm-perf' title='newVmPerfPanel' done={this._isPerformancesDone()}>
      <SectionContent>
        <Item label='newVmVcpusLabel'>
          <input ref='CPUs' onChange={this._onChange('CPUs')} className='form-control' type='number' />
        </Item>
        <Item label='newVmRamLabel'>
          <SizeInput ref='memory' onChange={this._onChange('memory')} className={styles.sizeInput} />
        </Item>
      </SectionContent>
    </Section>
  }
  _isPerformancesDone = () => {
    const { CPUs, memory } = this.state
    return CPUs && memory
  }

  _renderInstallSettings = () => {
    const { installMethod, pool, template } = this.state
    return <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done={this._isInstallSettingsDone()}>
      {template && (this._isDiskTemplate ? <SectionContent>
        <input onChange={this._selectInstallMethod} name='installMethod' value='ISO' type='radio' />
        <Item label='newVmIsoDvdLabel'>
          <span className={styles.inlineSelect}>
            <SelectSr
              disabled={installMethod !== 'ISO'}
              onChange={this._onChange('installIso')}
              predicate={sr => sr.$pool === pool.id && sr.content_type !== 'user'}
              ref='installIso'
            />
          </span>
        </Item>
        <input onChange={this._selectInstallMethod} name='installMethod' value='network' type='radio' />
        <Item label='newVmNetworkLabel'>
          <input ref='installNetwork' onChange={this._onChange('installNetwork')} disabled={installMethod !== 'network'} placeholder='e.g: http://ftp.debian.org/debian' type='text' className='form-control' />
        </Item>
        {template.virtualizationMode === 'pv'
          ? <Item label='newVmPvArgsLabel'>
            <input ref='pv_args' onChange={this._onChange('pv_args')} className='form-control' type='text' />
          </Item>
          : <span>
            <input onChange={this._selectInstallMethod} name='installMethod' value='PXE' type='radio' />
            <Item label='newVmPxeLabel' />
          </span>
        }
      </SectionContent>
    : <SectionContent>
      <input onChange={this._selectInstallMethod} name='installMethod' value='SSH' type='radio' />
      <Item label='newVmSshKey'>
        <input ref='sshKey' onChange={this._onChange('sshKey')} disabled={installMethod !== 'SSH'} className='form-control' type='text' />
      </Item>
      <input onChange={this._selectInstallMethod} name='installMethod' value='customConfig' type='radio' />
      <Item label='newVmCustomConfig'>
        <textarea
          className='form-control'
          disabled={installMethod !== 'customConfig'}
          onChange={this._onChange('customConfig')}
          ref='customConfig'
          type='text'
        />
      </Item>
    </SectionContent>)}
    </Section>
  }
  _isInstallSettingsDone = () => {
    const {
      customConfig,
      installIso,
      installMethod,
      installNetwork,
      sshKey
    } = this.state
    switch (installMethod) {
      case 'customConfig': return customConfig
      case 'ISO': return installIso
      case 'network': return installNetwork
      case 'PXE': return true
      case 'SSH': return sshKey
      default: return false
    }
  }

  _renderInterfaces = () => {
    return <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done={this._isInterfacesDone()}>
      <SectionContent column>
        {map(this.state.VIFs, (vif, index) => <LineItem key={index}>
          <Item label='newVmMacLabel'>
            <input ref={`mac_${vif.id}`} onChange={this._onChange('VIFs', index, 'mac')} defaultValue={vif.mac} className='form-control' type='text' />
          </Item>
          <Item label='newVmNetworkLabel'>
            <span className={styles.inlineSelect}>
              <SelectNetwork
                defaultValue={vif.network}
                onChange={this._onChange('VIFs', index, '$network', 'id')}
                predicate={this._isInPool}
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
    vif.mac && vif.network
  )

  _renderDisks = () => {
    return <Section icon='new-vm-disks' title='newVmDisksPanel' done={this._isDisksDone()}>
      <SectionContent column>
        {map(this.state.VDIs, (vdi, index) => <LineItem key={vdi.id}>
          <Item label='newVmSrLabel'>
            <span className={styles.inlineSelect}>
              <SelectSr
                defaultValue={vdi.SR}
                onChange={this._onChange('VDIs', index, 'SR', 'id')}
                predicate={this._isInPool}
                ref={`sr_${vdi.id}`}
              />
            </span>
          </Item>
          {' '}
          <Item className='checkbox'>
            <label>
              <input
                defaultValue={vdi.bootable}
                onChange={this._onChange('VDIs', index, 'bootable')}
                ref={`bootable_${vdi.id}`}
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
              onChange={this._onChange('VDIs', index, 'name_label')}
              ref={`name_label_${vdi.id}`}
              type='text'
            />
          </Item>
          <Item label='newVmDescriptionLabel'>
            <input
              className='form-control'
              defaultValue={vdi.name_description}
              onChange={this._onChange('VDIs', index, 'name_description')}
              ref={`name_description_${vdi.id}`}
              type='text'
            />
          </Item>
          <Item label='newVmSizeLabel'>
            <SizeInput
              className={styles.sizeInput}
              defaultValue={vdi.size}
              onChange={this._onChange('VDIs', index, 'size')}
              ref={`size_${vdi.id}`}
            />
          </Item>
          <Item>
            <Button onClick={() => this._removeVdi(index)} bsStyle='secondary'>
              <Icon icon='new-vm-remove' />
            </Button>
          </Item>
        </LineItem>
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
    vdi.SR && vdi.name_label && vdi.name_description
  )

  _renderSummary = () => {
    const { CPUs, memory, VDIs, VIFs } = this.state
    return <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
      <SectionContent summary>
        <Item>
          {CPUs || 0}x{' '}
          <Icon icon='cpu' />
        </Item>
        <Item>
          {memory ? formatSize(memory) : '0 B'}{' '}
          <Icon icon='memory' />
        </Item>
        <Item>
          {VDIs.length}x{' '}
          <Icon icon='disk' />
        </Item>
        <Item>
          {VIFs.length}x{' '}
          <Icon icon='network' />
        </Item>
      </SectionContent>
    </Section>
  }
}
/* eslint-enable camelcase*/
