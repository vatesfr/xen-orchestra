import _ from 'messages'
import BaseComponent from 'base-component'
import { Button } from 'react-bootstrap-4/lib'
import forEach from 'lodash/forEach'
import Icon from 'icon'
import keys from 'lodash/keys'
import map from 'lodash/map'
import React from 'react'
import { SelectPool, SelectVmTemplate } from 'select-objects'
import Wizard, { Section } from 'wizard'

import {
  connectStore
} from 'utils'

import {
  createGetObjectsOfType
} from 'selectors'

import styles from './index.css'

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
  get _params () {
    const { refs } = this
    const params = {}
    forEach(keys(refs), key => {
      params[key] = refs[key].value
    })
    return params
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
    console.log('RESET')
  }

  _create = () => {
    console.log('CREATE', this._params)
  }

  _selectPool = pool => {
    console.log('new pool = ', pool)
    this.setState({ pool })
  }

  render () {
    return <div>
      <h1>
        {_('newVmCreateNewVmOn', {
          /* TODO: style out of render */
          pool: <span className={styles.inlineSelect}>
            <SelectPool onChange={this._selectPool} />
          </span>
        })}
      </h1>
      {this.state.pool && <div>
        <Wizard>
          {/* INFOS */}
          <Section icon='new-vm-infos' title='newVmInfoPanel'>
            <SectionContent>
              <Item label='newVmNameLabel'>
                <input ref='name_label' className='form-control' type='text' />
              </Item>
              <Item label='newVmTemplateLabel'>
                <span className={styles.inlineSelect}>
                  <SelectVmTemplate
                    onChange={this._initExistingValues}
                    predicate={vm => vm.$pool === this.state.pool.id}
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
                <input ref='memory' className='form-control' type='text' />
              </Item>
            </SectionContent>
          </Section>
          {/* INSTALL SETTINGS */}
          <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel'>
            <SectionContent>
              <Item label='newVmIsoDvdLabel'>
                <select className='form-control'>
                  {map(['ISO 1', 'ISO 2', 'DVD 1', 'DVD 2'], (iso, index) =>
                    <option key={index} value={index}>{iso}</option>
                )}
                </select>
              </Item>
              <Item label='newVmNetworkLabel'>
                <select className='form-control'>
                  {map(['Network 1', 'Network 2', 'Network 3'], (network, index) =>
                    <option key={index} value={index}>{network}</option>
                )}
                </select>
              </Item>
              <Item label='newVmPvArgsLabel'>
                <input className='form-control' type='text' />
              </Item>
            </SectionContent>
          </Section>
          {/* INTERFACES */}
          <Section icon='new-vm-interfaces' title='newVmInterfacesPanel'>
            <SectionContent column>
              <LineItem>
                <Item label='newVmMacLabel'>
                  <input className='form-control' type='text' />
                </Item>
                <Item label='newVmNetworkLabel'>
                  <select className='form-control'>
                    {map(['Network 1', 'Network 2', 'Network 3'], (network, index) =>
                      <option key={index} value={index}>{network}</option>
                  )}
                  </select>
                </Item>
                <Item>
                  <Icon icon='new-vm-remove' />
                </Item>
              </LineItem>
              <Item>
                <Button bsStyle='secondary'>
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
              <LineItem>
                <Item label='newVmSrLabel'>
                  <input className='form-control' type='text' />
                </Item>
                {' '}
                <Item className='checkbox'>
                  <label>
                    <input type='checkbox' />
                    {' '}
                    {_('newVmBootableLabel')}
                  </label>
                </Item>
                <Item label='newVmNameLabel'>
                  <input className='form-control' type='text' />
                </Item>
                <Item label='newVmDescriptionLabel'>
                  <input className='form-control' type='text' />
                </Item>
                <Item>
                  <Icon icon='new-vm-remove' />
                </Item>
              </LineItem>
              <LineItem>
                <Item label='newVmSrLabel'>
                  <input className='form-control' type='text' />
                </Item>
                {' '}
                <Item className='checkbox'>
                  <label>
                    <input type='checkbox' />
                    {' '}
                    {_('newVmBootableLabel')}
                  </label>
                </Item>
                <Item label='newVmNameLabel'>
                  <input className='form-control' type='text' />
                </Item>
                <Item label='newVmDescriptionLabel'>
                  <input className='form-control' type='text' />
                </Item>
                <Item>
                  <Icon icon='new-vm-remove' />
                </Item>
              </LineItem>
              <Item>
                <Button bsStyle='secondary'>
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
