import _ from 'messages'
import { Button } from 'react-bootstrap-4/lib'
import classNames from 'classnames'
import { Col, Row } from 'grid'
import Icon from 'icon'
import map from 'lodash/map'
import React, { Component, PropTypes } from 'react'
import {
  routes
} from 'utils'

@routes()
export default class NewVm extends Component {
  render () {
    return <div>
      <h1>{_('newVmCreateNewVmOn')}lab1</h1>
      <form>
        {/* INFOS */ }
        <Step icon='infos' title='newVmInfoPanel'>
          <FormItem label='newVmNameLabel'>
            <input className='form-control' type='text'/>
          </FormItem>
          <FormItem label='newVmTemplateLabel'>
            <select className='form-control'>
              {map(['Template 1', 'Template 2', 'Template 3'], (template, index) =>
                <option key={index} value={index}>{template}</option>
            )}
            </select>
          </FormItem>
          <FormItem label='newVmDescriptionLabel'>
            <input className='form-control' type='text'/>
          </FormItem>
        </Step>
        {/* PERFORMANCES */ }
        <Step icon='perf' title='newVmPerfPanel'>
          <FormItem label='newVmVcpusLabel'>
            <input className='form-control' type='number'/>
          </FormItem>
          <FormItem label='newVmRamLabel'>
            <input className='form-control' type='text'/>
          </FormItem>
        </Step>
        {/* INSTALL SETTINGS */ }
        <Step icon='install-settings' title='newVmInstallSettingsPanel'>
          <FormItem label='newVmIsoDvdLabel'>
            <select className='form-control'>
              {map(['ISO 1', 'ISO 2', 'DVD 1', 'DVD 2'], (iso, index) =>
                <option key={index} value={index}>{iso}</option>
            )}
            </select>
          </FormItem>
          <FormItem label='newVmNetworkLabel'>
            <select className='form-control'>
              {map(['Network 1', 'Network 2', 'Network 3'], (network, index) =>
                <option key={index} value={index}>{network}</option>
            )}
            </select>
          </FormItem>
          <FormItem label='newVmPvArgsLabel'>
            <input className='form-control' type='text'/>
          </FormItem>
        </Step>
        {/* INTERFACES */ }
        <Step icon='interfaces' title='newVmInterfacesPanel' column>
          <div>
            <div>
              <label>{_('newVmMacLabel')}</label>&nbsp;&nbsp;
              <input className='form-control' type='text'/>
            </div>
            <div>
              <label>{_('newVmNetworkLabel')}</label>&nbsp;&nbsp;
              <select className='form-control'>
                {map(['Network 1', 'Network 2', 'Network 3'], (network, index) =>
                  <option key={index} value={index}>{network}</option>
              )}
              </select>
            </div>
            <Button bsStyle='secondary'>
              <Icon icon='new-vm-remove' />
            </Button>
          </div>
          <Button bsStyle='secondary'>
            <Icon icon='new-vm-add' />&nbsp;
            {_('newVmAddInterface')}
          </Button>
        </Step>
        {/* DISKS */ }
        <Step icon='disks' title='newVmDisksPanel' column>
          <div>
            <div>
              <label>{_('newVmSrLabel')}</label>&nbsp;&nbsp;
              <input className='form-control' type='text'/>
            </div>
            &nbsp;&nbsp;
            <div className='checkbox'>
              <label>
                <input type='checkbox'/>&nbsp;
                {_('newVmBootableLabel')}
              </label>
            </div>
            <div>
              <label>{_('newVmNameLabel')}</label>&nbsp;&nbsp;
              <input className='form-control' type='text'/>
            </div>
            <div>
              <label>{_('newVmDescriptionLabel')}</label>&nbsp;&nbsp;
              <input className='form-control' type='text'/>
            </div>
            <Button bsStyle='secondary'>
              <Icon icon='new-vm-remove' />
            </Button>
          </div>
          <Button bsStyle='secondary'>
            <Icon icon='new-vm-add' />&nbsp;
            {_('newVmAddDisk')}
          </Button>
        </Step>
        {/* SUMMARY */ }
        <Step icon='summary' title='newVmSummaryPanel'>
          Summary panel.
        </Step>
        <div style={{width: '100%'}}>
          <Row>
            <Col size={1} offset={3}>
              <Button bsStyle='secondary' style={{fontSize: '1.8em'}}>
                <Icon icon='new-vm-reset' />&nbsp;
                {_('newVmReset')}
              </Button>
            </Col>
            <Col size={1} offset={4}>
              <Button bsStyle='primary' type='submit' style={{fontSize: '1.8em'}}>
                <Icon icon='new-vm-create' />&nbsp;
                {_('newVmCreate')}
              </Button>
            </Col>
          </Row>
        </div>
      </form>
    </div>
  }
}

const Step = ({ icon, title, column, children }) => <Row className='wizard-step'>
  <div style={{flex: '0 0 15em'}}>
    <h4>{icon && <Icon icon={`new-vm-${icon}`} />} {_(title)}</h4>
  </div>
  <div style={{flex: '0.9 1 50%'}} className={classNames(
      'wizard-block',
      column && 'column'
  )}>
    {children}
  </div>
</Row>
Step.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired
}

const FormItem = ({ label, children }) => <div style={{flex: '1'}} className='form-group'>
  <label style={{whiteSpace: 'nowrap'}}>{_(label)}</label>&nbsp;&nbsp;
  {children}
</div>
FormItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}
