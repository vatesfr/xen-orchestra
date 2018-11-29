import _ from 'intl'
import Copiable from 'copiable'
import defined from '@xen-orchestra/defined'
import Icon from 'icon'
import isEmpty from 'lodash/isEmpty'
import map from 'lodash/map'
import React from 'react'
import HomeTags from 'home-tags'
import renderXoItem from 'render-xo-item'
import Tooltip from 'tooltip'
import { addTag, editVm, removeTag } from 'xo'
import { BlockLink } from 'link'
import { FormattedRelative } from 'react-intl'
import { Container, Row, Col } from 'grid'
import { Number, Size } from 'editable'
import {
  createFinder,
  createGetObjectsOfType,
  createGetVmLastShutdownTime,
  createSelector,
} from 'selectors'
import {
  connectStore,
  formatSize,
  osFamily,
  VIRTUALIZATION_MODE_LABEL,
} from 'utils'
import {
  CpuSparkLines,
  MemorySparkLines,
  NetworkSparkLines,
  XvdSparkLines,
} from 'xo-sparklines'

export default connectStore(() => {
  const getVgpus = createGetObjectsOfType('vgpu')
    .pick((_, { vm }) => vm.$VGPUs)
    .sort()

  const getAttachedVgpu = createFinder(getVgpus, vgpu => vgpu.currentlyAttached)

  const getVgpuTypes = createGetObjectsOfType('vgpuType').pick(
    createSelector(getVgpus, vgpus => map(vgpus, 'vgpuType'))
  )

  return {
    lastShutdownTime: createGetVmLastShutdownTime(),
    vgpu: getAttachedVgpu,
    vgpuTypes: getVgpuTypes,
  }
})(
  ({
    lastShutdownTime,
    statsOverview,
    vgpu,
    vgpuTypes,
    vm,
    vmTotalDiskSpace,
  }) => (
    <Container>
      {/* TODO: use CSS style */}
      <br />
      <Row className='text-xs-center'>
        <Col mediumSize={3}>
          <h2>
            <Number
              value={vm.CPUs.number}
              onChange={vcpus => editVm(vm, { CPUs: vcpus })}
            />
            x <Icon icon='cpu' size='lg' />
          </h2>
          <BlockLink to={`/vms/${vm.id}/stats`}>
            {statsOverview && <CpuSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <h2 className='form-inline'>
            <Size
              value={defined(vm.memory.dynamic[1], null)}
              onChange={memory => editVm(vm, { memory })}
            />
            &nbsp;
            <span>
              <Icon icon='memory' size='lg' />
            </span>
          </h2>
          <BlockLink to={`/vms/${vm.id}/stats`}>
            {statsOverview && <MemorySparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/vms/${vm.id}/network`}>
            <h2>
              {vm.VIFs.length}x <Icon icon='network' size='lg' />
            </h2>
          </BlockLink>
          <BlockLink to={`/vms/${vm.id}/stats`}>
            {statsOverview && <NetworkSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/vms/${vm.id}/disks`}>
            <h2>
              {formatSize(vmTotalDiskSpace)} <Icon icon='disk' size='lg' />
            </h2>
          </BlockLink>
          <BlockLink to={`/vms/${vm.id}/stats`}>
            {statsOverview && <XvdSparkLines data={statsOverview} />}
          </BlockLink>
        </Col>
      </Row>
      {/* TODO: use CSS style */}
      <br />
      <Row className='text-xs-center'>
        <Col mediumSize={3}>
          {vm.power_state === 'Running' ? (
            <div>
              <p className='text-xs-center'>
                {_('started', {
                  ago: <FormattedRelative value={vm.startTime * 1000} />,
                })}
              </p>
            </div>
          ) : (
            <p className='text-xs-center'>
              {lastShutdownTime
                ? _('vmHaltedSince', {
                    ago: <FormattedRelative value={lastShutdownTime * 1000} />,
                  })
                : _('vmNotRunning')}
            </p>
          )}
        </Col>
        <Col mediumSize={3}>
          <p>{_(VIRTUALIZATION_MODE_LABEL[vm.virtualizationMode])}</p>
          {vgpu !== undefined && (
            <p>{renderXoItem(vgpuTypes[vgpu.vgpuType])}</p>
          )}
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/vms/${vm.id}/network`}>
            {vm.addresses && vm.addresses['0/ip'] ? (
              <Copiable tagName='p'>{vm.addresses['0/ip']}</Copiable>
            ) : (
              <p>{_('noIpv4Record')}</p>
            )}
          </BlockLink>
        </Col>
        <Col mediumSize={3}>
          <BlockLink to={`/vms/${vm.id}/advanced`}>
            <Tooltip
              content={vm.os_version ? vm.os_version.name : _('unknownOsName')}
            >
              <h1>
                <Icon
                  className='text-info'
                  icon={
                    vm.os_version &&
                    vm.os_version.distro &&
                    osFamily(vm.os_version.distro)
                  }
                />
              </h1>
            </Tooltip>
          </BlockLink>
        </Col>
      </Row>
      {!vm.xenTools && vm.power_state === 'Running' && (
        <Row className='text-xs-center'>
          <Col>
            <Icon icon='error' />
            <em> {_('noToolsDetected')}.</em>
          </Col>
        </Row>
      )}
      {/* TODO: use CSS style */}
      <br />
      <Row>
        <Col>
          <h2 className='text-xs-center'>
            <HomeTags
              type='VM'
              labels={vm.tags}
              onDelete={tag => removeTag(vm.id, tag)}
              onAdd={tag => addTag(vm.id, tag)}
            />
          </h2>
        </Col>
      </Row>
      {isEmpty(vm.current_operations) ? null : (
        <Row className='text-xs-center'>
          <Col>
            <h4>
              {_('vmCurrentStatus')} {map(vm.current_operations)[0]}
            </h4>
          </Col>
        </Row>
      )}
    </Container>
  )
)
