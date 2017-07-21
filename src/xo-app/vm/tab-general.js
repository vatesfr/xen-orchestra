import _ from 'intl'
import Copiable from 'copiable'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import HomeTags from 'home-tags'
import Tooltip from 'tooltip'
import { addTag, editVm, removeTag } from 'xo'
import { createGetVmLastShutdownTime } from 'selectors'
import { BlockLink } from 'link'
import { FormattedRelative } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { Number, Size } from 'editable'
import {
  connectStore,
  firstDefined,
  formatSize,
  osFamily
} from 'utils'
import {
  CpuSparkLines,
  MemorySparkLines,
  VifSparkLines,
  XvdSparkLines
} from 'xo-sparklines'

export default connectStore(() => {
  return { lastShutdownTime: createGetVmLastShutdownTime() }
})(
 ({
  lastShutdownTime,
  statsOverview,
  vm,
  vmTotalDiskSpace
}) => <Container>
  {/* TODO: use CSS style */}
  <br />
  <Row className='text-xs-center'>
    <Col mediumSize={3}>
      <h2><Number value={vm.CPUs.number} onChange={vcpus => editVm(vm, { CPUs: vcpus })} />x <Icon icon='cpu' size='lg' /></h2>
      <BlockLink to={`/vms/${vm.id}/stats`}>{statsOverview && <CpuSparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <h2 className='form-inline'>
        <Size value={firstDefined(vm.memory.dynamic[1], null)} onChange={memory => editVm(vm, { memory })} />
        &nbsp;<span><Icon icon='memory' size='lg' /></span>
      </h2>
      <BlockLink to={`/vms/${vm.id}/stats`}>{statsOverview && <MemorySparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/vms/${vm.id}/network`}><h2>{vm.VIFs.length}x <Icon icon='network' size='lg' /></h2></BlockLink>
      <BlockLink to={`/vms/${vm.id}/stats`}>{statsOverview && <VifSparkLines data={statsOverview} />}</BlockLink>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/vms/${vm.id}/disks`}><h2>{formatSize(vmTotalDiskSpace)} <Icon icon='disk' size='lg' /></h2></BlockLink>
      <BlockLink to={`/vms/${vm.id}/stats`}>{statsOverview && <XvdSparkLines data={statsOverview} />}</BlockLink>
    </Col>
  </Row>
  {/* TODO: use CSS style */}
  <br />
  <Row className='text-xs-center'>
    <Col mediumSize={3}>
      {vm.power_state === 'Running'
        ? <div>
          <p className='text-xs-center'>{_('started', { ago: <FormattedRelative value={vm.startTime * 1000} /> })}</p>
        </div>
        : <p className='text-xs-center'>
          { lastShutdownTime
            ? _('vmHaltedSince', {ago: <FormattedRelative value={lastShutdownTime * 1000} />})
            : _('vmNotRunning')
          }
        </p>
      }
    </Col>
    <Col mediumSize={3}>
      <p>
        {vm.virtualizationMode === 'pv'
          ? _('paraVirtualizedMode')
          : _('hardwareVirtualizedMode')
        }
      </p>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/vms/${vm.id}/network`}>
        {vm.addresses && vm.addresses['0/ip']
          ? <Copiable tagName='p'>
            {vm.addresses['0/ip']}
          </Copiable>
          : <p>{_('noIpv4Record')}</p>
        }
      </BlockLink>
    </Col>
    <Col mediumSize={3}>
      <BlockLink to={`/vms/${vm.id}/advanced`}><Tooltip content={vm.os_version ? vm.os_version.name : _('unknownOsName')}><h1><Icon className='text-info' icon={vm.os_version && vm.os_version.distro && osFamily(vm.os_version.distro)} /></h1></Tooltip></BlockLink>
    </Col>
  </Row>
  {!vm.xenTools && vm.power_state === 'Running' &&
    <Row className='text-xs-center'>
      <Col><Icon icon='error' /><em> {_('noToolsDetected')}.</em></Col>
    </Row>
  }
  {/* TODO: use CSS style */}
  <br />
  <Row>
    <Col>
      <h2 className='text-xs-center'>
        <HomeTags type='VM' labels={vm.tags} onDelete={tag => removeTag(vm.id, tag)} onAdd={tag => addTag(vm.id, tag)} />
      </h2>
    </Col>
  </Row>
  {isEmpty(vm.current_operations)
    ? null
    : <Row className='text-xs-center'>
      <Col>
        <h4>{_('vmCurrentStatus')}{' '}{map(vm.current_operations)[0]}</h4>
      </Col>
    </Row>
  }
</Container>
)
