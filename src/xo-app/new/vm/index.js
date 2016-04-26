import _ from 'messages'
import { Button } from 'react-bootstrap-4/lib'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component } from 'react'
import {
  routes
} from 'utils'
import Wizard, { LineItem, Item, Section } from 'wizard'

@routes()
export default class NewVm extends Component {
  render () {
    return <div>
      <h1>{_('newVmCreateNewVmOn')}lab1</h1>
      <Wizard>
        {/* INFOS */ }
        <Section icon='new-vm-infos' title='newVmInfoPanel'>
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
        </Section>
        {/* PERFORMANCES */ }
        <Section icon='new-vm-perf' title='newVmPerfPanel'>
          <Item label='newVmVcpusLabel'>
            <input className='form-control' type='number'/>
          </Item>
          <Item label='newVmRamLabel'>
            <input className='form-control' type='text'/>
          </Item>
        </Section>
        {/* INSTALL SETTINGS */ }
        <Section icon='new-vm-install-settings' title='newVmInstallSettingsPanel'>
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
        </Section>
        {/* INTERFACES */ }
        <Section icon='new-vm-interfaces' title='newVmInterfacesPanel' column>
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
        </Section>
        {/* DISKS */ }
        <Section icon='new-vm-disks' title='newVmDisksPanel' column>
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
        </Section>
        {/* SUMMARY */ }
        <Section icon='new-vm-summary' title='newVmSummaryPanel' summary>
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
        </Section>
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
      </Wizard>
    </div>
  }
}
