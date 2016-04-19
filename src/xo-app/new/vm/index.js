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
      <form className='blocks'>
      {/* INFOS */ }
        <Block icon='infos' title='newVmInfoPanel'>
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
        </Block>
        {/* PERFORMANCES */ }
        <Block icon='perf' title='newVmPerfPanel'>
          <FormItem label='newVmVcpusLabel'>
            <input className='form-control' type='number'/>
          </FormItem>
          <FormItem label='newVmRamLabel'>
            <input className='form-control' type='text'/>
          </FormItem>
        </Block>
        {/* INSTALL SETTINGS */ }
        <Block icon='install-settings' title='newVmInstallSettingsPanel'>
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
        </Block>
        {/* INTERFACES */ }
        <Block icon='interfaces' title='newVmInterfacesPanel'>
          <div style={{margin: '0.5em'}}>
            <Row>
              <Col size={10}>
                <div className='form-inline'>
                  <div className='form-group'>
                    <label>{_('newVmMacLabel')}</label>&nbsp;&nbsp;
                    <input className='form-control' type='text'/>
                  </div>
                  &nbsp;&nbsp;
                  <div className='form-group'>
                    <label>{_('newVmNetworkLabel')}</label>&nbsp;&nbsp;
                    <select className='form-control'>
                      {map(['Network 1', 'Network 2', 'Network 3'], (network, index) =>
                        <option key={index} value={index}>{network}</option>
                    )}
                    </select>
                  </div>
                </div>
              </Col>
              <Col size={1}>
                <Button bsStyle='secondary'>
                  <Icon icon='new-vm-remove' />
                </Button>
              </Col>
            </Row>
          </div>
          <Button bsStyle='secondary'>
            <Icon icon='new-vm-add' />&nbsp;
            {_('newVmAddInterface')}
          </Button>
        </Block>
        {/* DISKS */ }
        <Block icon='disks' full title='newVmDisksPanel'>
          <div style={{margin: '0.5em'}}>
            <Row>
              <Col size={10}>
                <div className='form-inline'>
                  <div className='form-group'>
                    <label>{_('newVmSrLabel')}</label>&nbsp;&nbsp;
                    <input className='form-control' type='text'/>
                  </div>
                  &nbsp;&nbsp;
                  <div className='form-group checkbox'>
                    <label>
                      <input type='checkbox'/>&nbsp;
                      {_('newVmBootableLabel')}
                    </label>
                  </div>
                  &nbsp;&nbsp;&nbsp;&nbsp;
                  <div className='form-group'>
                    <label>{_('newVmNameLabel')}</label>&nbsp;&nbsp;
                    <input className='form-control' type='text'/>
                  </div>
                  &nbsp;&nbsp;
                  <div className='form-group'>
                    <label>{_('newVmDescriptionLabel')}</label>&nbsp;&nbsp;
                    <input className='form-control' type='text'/>
                  </div>
                </div>
              </Col>
              <Col size={1}>
                <Button bsStyle='secondary'>
                  <Icon icon='new-vm-remove' />
                </Button>
              </Col>
            </Row>
          </div>
          <Button bsStyle='secondary'>
            <Icon icon='new-vm-add' />&nbsp;
            {_('newVmAddDisk')}
          </Button>
        </Block>
        {/* SUMMARY */ }
        <Block icon='summary' full title='newVmSummaryPanel'>
          Summary panel.
        </Block>
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

const Block = ({ icon, title, full, children }) => <div className={classNames(
  'block',
  full ? 'full' : 'half'
)}>
  <div className='card-new-vm'>
    <div className='card-header-new-vm'>
      {icon && <Icon icon={`new-vm-${icon}`} />} {_(title)}
    </div>
    <div className='card-block-new-vm'>
      {children}
    </div>
  </div>
</div>
Block.propTypes = {
  icon: PropTypes.string,
  title: PropTypes.string.isRequired
}

const FormItem = ({ label, children }) => <Row className='form-group'>
  <Col largeSize={3}><label className='form-control-label'>{_(label)}</label></Col>
  <Col largeSize={9}>{children}</Col>
</Row>
FormItem.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
}
