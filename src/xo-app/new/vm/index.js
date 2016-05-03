import _ from 'messages'
import { Button } from 'react-bootstrap-4/lib'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component } from 'react'
import {
  routes
} from 'utils'
import Wizard, { Section } from 'wizard'

@routes()
export default class NewVm extends Component {
  render () {
    return <div>
      <h1>{_('newVmCreateNewVmOn')}lab1</h1>
      <Wizard>
        {/* INFOS */ }
        <Section icon='new-vm-infos' title='newVmInfoPanel' done>
          <SectionContent>
            <Item label='newVmNameLabel'>
              <input className='form-control' type='text'/>
            </Item>
            <Item label='newVmTemplateLabel'>
              <select className='form-control'>
                {map(['Template 1', 'Template 2', 'Template 3'], (template, index) =>
                  <option key={index} value={index}>{template}</option>
              )}
              </select>
            </Item>
            <Item label='newVmDescriptionLabel'>
              <input className='form-control' type='text'/>
            </Item>
          </SectionContent>
        </Section>
        {/* PERFORMANCES */ }
        <Section icon='new-vm-perf' title='newVmPerfPanel' done>
          <SectionContent>
            <Item label='newVmVcpusLabel'>
              <input className='form-control' type='number'/>
            </Item>
            <Item label='newVmRamLabel'>
              <input className='form-control' type='text'/>
            </Item>
          </SectionContent>
        </Section>
        {/* INSTALL SETTINGS */ }
        <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel' done>
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
              <input className='form-control' type='text'/>
            </Item>
          </SectionContent>
        </Section>
        {/* INTERFACES */ }
        <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' done>
          <SectionContent column>
            <LineItem>
              <Item label='newVmMacLabel'>
                <input className='form-control' type='text'/>
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
                <Icon icon='new-vm-add' />&nbsp;
                {_('newVmAddInterface')}
              </Button>
            </Item>
          </SectionContent>
        </Section>
        {/* DISKS */ }
        <Section icon='new-vm-disks' title='newVmDisksPanel'>
          <SectionContent column>
            <LineItem>
              <Item label='newVmSrLabel'>
                <input className='form-control' type='text'/>
              </Item>
              &nbsp;&nbsp;
              <Item className='checkbox'>
                <label>
                  <input type='checkbox'/>&nbsp;
                  {_('newVmBootableLabel')}
                </label>
              </Item>
              <Item label='newVmNameLabel'>
                <input className='form-control' type='text'/>
              </Item>
              <Item label='newVmDescriptionLabel'>
                <input className='form-control' type='text'/>
              </Item>
              <Item>
                <Icon icon='new-vm-remove' />
              </Item>
            </LineItem>
            <LineItem>
              <Item label='newVmSrLabel'>
                <input className='form-control' type='text'/>
              </Item>
              &nbsp;&nbsp;
              <Item className='checkbox'>
                <label>
                  <input type='checkbox'/>&nbsp;
                  {_('newVmBootableLabel')}
                </label>
              </Item>
              <Item label='newVmNameLabel'>
                <input className='form-control' type='text'/>
              </Item>
              <Item label='newVmDescriptionLabel'>
                <input className='form-control' type='text'/>
              </Item>
              <Item>
                <Icon icon='new-vm-remove' />
              </Item>
            </LineItem>
            <Item>
              <Button bsStyle='secondary'>
                <Icon icon='new-vm-add' />&nbsp;
                {_('newVmAddDisk')}
              </Button>
            </Item>
          </SectionContent>
        </Section>
        {/* SUMMARY */ }
        <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
          <SectionContent summary>
            <Item>
              0x&nbsp;
              <Icon icon='cpu' />
            </Item>
            <Item>
              0B&nbsp;
              <Icon icon='memory' />
            </Item>
            <Item>
              0x&nbsp;
              <Icon icon='disk' />
            </Item>
            <Item>
              1x&nbsp;
              <Icon icon='network' />
            </Item>
          </SectionContent>
        </Section>
      </Wizard>
      <div style={{display: 'flex', justifyContent: 'space-around'}}>
        <Button bsStyle='secondary' style={{fontSize: '1.8em'}}>
          <Icon icon='new-vm-reset' />&nbsp;
          {_('newVmReset')}
        </Button>
        <Button bsStyle='primary' type='submit' style={{fontSize: '1.8em'}}>
          <Icon icon='new-vm-create' />&nbsp;
          {_('newVmCreate')}
        </Button>
      </div>
    </div>
  }
}

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
  <div style={{
    display: 'flex',
    alignItems: 'baseline',
    flexWrap: 'wrap'
  }}>
    {children}
  </div>
)

const Item = ({ label, children }) => (
  <span style={{ whiteSpace: 'nowrap', margin: '0.5em' }}>
    {label && <span><label>{_(label)}</label>&nbsp;&nbsp;</span>}
    {children}
  </span>
)
