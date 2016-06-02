import _ from 'messages'
import BaseComponent from 'base-component'
import { Button } from 'react-bootstrap-4/lib'
import concat from 'lodash/concat'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import keys from 'lodash/keys'
import map from 'lodash/map'
import pullAt from 'lodash/pullAt'
import React from 'react'
import store from 'store'
import Wizard, { Section } from 'wizard'

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
  connectStore
} from 'utils'

import {
  createGetObject,
  createGetObjectsOfType
} from 'selectors'

import styles from './index.css'

// import { Debug } from 'utils'

const SectionContent = ({ summary, column, children }) => (
  <div style={{
    alignItems: 'baseline',
    display: 'flex',
    flex: summary ? '1 1 20em' : '1 1 40em',
    flexDirection: column ? 'column' : 'row',
    flexWrap: 'wrap',
    fontSize: summary ? '2em' : '1em',
    justifyContent: summary && 'space-around'
  }}
    className='form-inline'>
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
  // const getPools = createGetObjectsOfType('pool').sort()
  return (state, props) => {
    return {
      // pools: getPools(state, props),
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

  get _params () {
    const { refs } = this
    const params = {}
    forEach(keys(refs), key => {
      params[key] = refs[key].value
    })
    return params
  }

  get _isDiskTemplate () {
    return this.state.VBDs.length === 0 || this.state.template.name_label === 'Other install media'
  }

  _setRef (key, value) {
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
    this.setState({ template: undefined, VBDs: [], VIFs: [] })
    console.log('RESET')
  }

  _create = () => {
    console.log('CREATE', this._params)
  }

  _selectPool = pool => this.setState({ pool, numberOfDisks: 1 })

  _isInPool = object => object.$pool === this.state.pool.id

  _initTemplate = template => {
    if (!template) {
      return this._reset()
    }
    const state = store.getState()
    console.log('template = ', template)
    this._setRef('name_description', template.name_description)
    this._setRef('memory', template.memory.size)
    this._setRef('CPUs', template.CPUs.number)
    // template.PV_args && this._setRef('PV_args', template.PV_args)

    const VBDs = []
    forEach(template.$VBDs, vbdId => {
      const vbd = getObject(state, vbdId)
      if (!vbd.is_cd_drive) {
        vbd.vdi = getObject(state, vbd.VDI)
        VBDs.push(vbd)
      }
    })

    this.setState({
      template,
      VBDs,
      VIFs: map(template.VIFs, vif => getObject(state, vif))
    })
  }

  _addVdi = () => this.setState({ VBDs: concat(this.state.VBDs, { id: this.uniqueId }) })
  _removeVdi = index => {
    const VBDs = this.state.VBDs.slice(0)
    pullAt(VBDs, index)
    this.setState({ VBDs })
  }
  _addInterface = () => this.setState({ VIFs: concat(this.state.VIFs, { id: this.uniqueId }) }, () => console.log('VIFS = ', this.state.VIFs))
  _removeInterface = index => {
    const VIFs = this.state.VIFs.slice(0)
    pullAt(VIFs, index)
    this.setState({ VIFs })
  }

  render () {
    const { pool, template } = this.state
    return <div>
      <h1>
        {_('newVmCreateNewVmOn', {
          pool: <span className={styles.inlineSelect}>
            <SelectPool onChange={this._selectPool} />
          </span>
        })}
      </h1>
      {pool && <div>
        <Wizard>
          {/* INFOS */}
          <Section icon='new-vm-infos' title='newVmInfoPanel'>
            <SectionContent>
              <Item label='newVmNameLabel'>
                <input ref='name_label' className='form-control' type='text' required />
              </Item>
              <Item label='newVmTemplateLabel'>
                <span className={styles.inlineSelect}>
                  <SelectVmTemplate
                    onChange={this._initTemplate}
                    placeholder={_('newVmSelectTemplate')}
                    predicate={this._isInPool}
                    ref='template'
                  />
                </span>
              </Item>
              <Item label='newVmDescriptionLabel'>
                <input ref='name_description' className='form-control' type='text' />
              </Item>
            </SectionContent>
          </Section>
          {/* PERFORMANCES */}
          <Section icon='new-vm-perf' title='newVmPerfPanel'>
            <SectionContent>
              <Item label='newVmVcpusLabel'>
                <input ref='CPUs' className='form-control' type='number' />
              </Item>
              <Item label='newVmRamLabel'>
                <SizeInput ref='memory' className={styles.sizeInput} />
              </Item>
            </SectionContent>
          </Section>
          {/* INSTALL SETTINGS */}
          <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel'>
            {template && (this._isDiskTemplate ? <SectionContent>
              <Item label='newVmIsoDvdLabel'>
                <span className={styles.inlineSelect}>
                  <SelectSr
                    predicate={sr => sr.$pool === pool.id && sr.content_type === 'iso'}
                    ref='installIso'
                  />
                </span>
              </Item>
              <Item label='newVmNetworkLabel'>
                <span className={styles.inlineSelect}>
                  <SelectNetwork
                    predicate={this._isInPool}
                    ref='network'
                  />
                </span>
              </Item>
              <Item label='newVmPvArgsLabel'>
                <input ref='PV_args' className='form-control' type='text' />
              </Item>
            </SectionContent>
          : <SectionContent>
            <span>CONFIG DRIVE</span>
          </SectionContent>)}
          </Section>
          {/* INTERFACES */}
          <Section icon='new-vm-interfaces' title='newVmInterfacesPanel'>
            <SectionContent column>
              {map(this.state.VIFs, (vif, index) => <LineItem key={vif.id}>
                <Item label='newVmMacLabel'>
                  <input ref={`mac_${vif.id}`} defaultValue={vif.MAC} className='form-control' type='text' />
                </Item>
                <Item label='newVmNetworkLabel'>
                  <span className={styles.inlineSelect}>
                    <SelectNetwork
                      defaultValue={vif.$network}
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
          {/* DISKS */}
          <Section icon='new-vm-disks' title='newVmDisksPanel'>
            <SectionContent column>
              {map(this.state.VBDs, (vbd, index) => <LineItem key={vbd.id}>
                <Item label='newVmSrLabel'>
                  <span className={styles.inlineSelect}>
                    <SelectSr
                      predicate={this._isInPool}
                      ref={`sr_${vbd.id}`}
                      defaultValue={vbd.vdi && vbd.vdi.$SR}
                    />
                  </span>
                </Item>
                {' '}
                <Item className='checkbox'>
                  <label>
                    <input ref={`bootable_${vbd.id}`} defaultValue={vbd.vdi && vbd.bootable} type='checkbox' />
                    {' '}
                    {_('newVmBootableLabel')}
                  </label>
                </Item>
                <Item label='newVmNameLabel'>
                  <input ref={`vdiName_${vbd.id}`} defaultValue={vbd.vdi && vbd.vdi.name_label} className='form-control' type='text' />
                </Item>
                <Item label='newVmDescriptionLabel'>
                  <input ref={`vdiDescription_${vbd.id}`} defaultValue={vbd.vdi && vbd.vdi.name_description} className='form-control' type='text' />
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
          {/* SUMMARY */}
          <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
            <SectionContent summary>
              <Item>
                0x{' '}
                <Icon icon='cpu' />
              </Item>
              <Item>
                0B{' '}
                <Icon icon='memory' />
              </Item>
              <Item>
                0x{' '}
                <Icon icon='disk' />
              </Item>
              <Item>
                1x{' '}
                <Icon icon='network' />
              </Item>
            </SectionContent>
          </Section>
        </Wizard>
        <div style={{display: 'flex', justifyContent: 'space-around'}}>
          <Button onClick={this._reset} bsStyle='secondary' className={styles.button}>
            <Icon icon='new-vm-reset' />
            {' '}
            {_('newVmReset')}
          </Button>
          <Button onClick={this._create} bsStyle='primary' type='submit' className={styles.button}>
            <Icon icon='new-vm-create' />
            {' '}
            {_('newVmCreate')}
          </Button>
        </div>
      </div>}
    </div>
  }
}
