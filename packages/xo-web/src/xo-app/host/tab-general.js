import * as CM from 'complex-matcher'
import _ from 'intl'
import Copiable from 'copiable'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import store from 'store'
import HomeTags from 'home-tags'
import { addTag, getBiosInfo, removeTag, subscribeIpmiSensors } from 'xo'
import { BlockLink } from 'link'
import { Container, Row, Col } from 'grid'
import { FormattedRelative } from 'react-intl'
import { addSubscriptions, formatSize, formatSizeShort, hasLicenseRestrictions } from 'utils'
import { injectState, provideState } from 'reaclette'
import Usage, { UsageElement } from 'usage'
import { getObject } from 'selectors'
import { CpuSparkLines, MemorySparkLines, NetworkSparkLines, LoadSparkLines } from 'xo-sparklines'
import { Pool } from 'render-xo-item'
import { isEmpty } from 'lodash'
import LicenseWarning from './license-warning'

export default decorate([
  addSubscriptions(({ host }) => ({
    ipmiSensors: subscribeIpmiSensors(host),
  })),
  provideState({
    computed: {
      areHostsVersionsEqual: ({ areHostsVersionsEqualByPool }, { host }) => areHostsVersionsEqualByPool[host.$pool],
      inMemoryVms: (_, { vms }) => {
        const result = []
        for (const key of Object.keys(vms)) {
          const vm = vms[key]
          const { power_state } = vm
          if (power_state === 'Running' || power_state === 'Paused') {
            result.push(vm)
          }
        }
        return result
      },
      cpuHighestTemp: (_, { ipmiSensors }) => {
        let cpu
        let cpuTemp = 0
        ipmiSensors?.cpuTemp?.forEach(cpuInfo => {
          const temp = parseFloat(cpuInfo.Reading)
          if (temp > cpuTemp) {
            cpuTemp = temp
            cpuInfo.temp = temp
            cpu = cpuInfo
          }
        })
        return cpu
      },

      fanHighestSpeed: (_, { ipmiSensors }) => {
        let fan
        let fanSpeed = 0
        ipmiSensors?.fanSpeed?.forEach(fanInfo => {
          const speed = parseFloat(fanInfo.Reading)
          if (speed > fanSpeed) {
            fanSpeed = speed
            fanInfo.speed = speed
            fan = fanInfo
          }
        })
        return fan
      },
      fansKo: (_, { ipmiSensors }) => ipmiSensors?.fanStatus?.filter(fanStatus => fanStatus.Event !== "'OK'"),
      psusKo: (_, { ipmiSensors }) =>
        ipmiSensors?.psuStatus?.filter(psuStatus => psuStatus.Event !== "'Presence detected'"),
      nFansOk: ({ fansKo }, { ipmiSensors }) => ipmiSensors?.fanStatus?.length - fansKo?.length,
      nPsusOk: ({ psusKo }, { ipmiSensors }) => ipmiSensors?.psuStatus?.length - psusKo?.length,
      biosData: async (_, { host }) => {
        const biosInfo = await getBiosInfo(host)
        return typeof biosInfo === 'object' && biosInfo !== null ? biosInfo : undefined
      },
    },
  }),
  injectState,
  ({
    statsOverview,
    host,
    nVms,
    vmController,
    ipmiSensors,
    state: {
      areHostsVersionsEqual,
      biosData,
      cpuHighestTemp,
      fanHighestSpeed,
      fansKo,
      inMemoryVms,
      nFansOk,
      nPsusOk,
      psusKo,
    },
  }) => {
    const pool = getObject(store.getState(), host.$pool)
    const vmsFilter = encodeURIComponent(new CM.Property('$container', new CM.String(host.id)).toString())

    return (
      <Container>
        <br />
        <Row className='text-xs-center'>
          <Col mediumSize={3}>
            <h2>
              {host.CPUs.cpu_count}x <Icon icon='cpu' size='lg' />
            </h2>
            <BlockLink to={`/hosts/${host.id}/stats`}>
              {statsOverview && <CpuSparkLines data={statsOverview} />}
            </BlockLink>
          </Col>
          <Col mediumSize={3}>
            <h2>
              {formatSize(host.memory.size)} <Icon icon='memory' size='lg' />
            </h2>
            <BlockLink to={`/hosts/${host.id}/stats`}>
              {statsOverview && <MemorySparkLines data={statsOverview} />}
            </BlockLink>
          </Col>
          <Col mediumSize={3}>
            <BlockLink to={`/hosts/${host.id}/network`}>
              <h2>
                {host.$PIFs.length}x <Icon icon='network' size='lg' />
              </h2>
            </BlockLink>
            <BlockLink to={`/hosts/${host.id}/stats`}>
              {statsOverview && <NetworkSparkLines data={statsOverview} />}
            </BlockLink>
          </Col>
          <Col mediumSize={3}>
            <BlockLink to={`/hosts/${host.id}/storage`}>
              <h2>
                {host.$PBDs.length}x <Icon icon='disk' size='lg' />
              </h2>
            </BlockLink>
            <BlockLink to={`/hosts/${host.id}/stats`}>
              {statsOverview && <LoadSparkLines data={statsOverview} />}
            </BlockLink>
          </Col>
        </Row>
        <br />
        <Row className='text-xs-center'>
          <Col mediumSize={3}>
            <p className='text-xs-center'>
              {_('started', {
                ago: <FormattedRelative value={host.startTime * 1000} />,
              })}
            </p>
          </Col>
          <Col mediumSize={3}>
            <p>
              {host.productBrand} {host.version} (
              {host.productBrand !== 'XCP-ng' ? host.license_params.sku_type : 'GPLv2'}){' '}
              {hasLicenseRestrictions(host) && <LicenseWarning iconSize='lg' />}
            </p>
          </Col>
          <Col mediumSize={3}>
            <Copiable tagName='p'>{host.address}</Copiable>
          </Col>
          <Col mediumSize={3}>
            <p>
              {host.bios_strings['system-manufacturer']} {host.bios_strings['system-product-name']}
            </p>
          </Col>
        </Row>
        <br />
        <Row>
          <Col className='text-xs-center'>
            <BlockLink to={`/home?t=VM&s=${vmsFilter}`}>
              <h2>
                {nVms}x <Icon icon='vm' size='lg' />
              </h2>
            </BlockLink>
          </Col>
        </Row>
        <br />
        <Row>
          <Col className='text-xs-center'>
            <h5>{_('hostTitleRamUsage')}</h5>
          </Col>
        </Row>
        <Row>
          <Col smallOffset={1} mediumSize={10}>
            <Usage total={host.memory.size}>
              <UsageElement
                highlight
                tooltip={`${host.productBrand} (${formatSize(vmController.memory.size)})`}
                value={vmController.memory.size}
              />
              {inMemoryVms.map(vm => (
                <UsageElement
                  tooltip={`${vm.name_label} (${formatSize(vm.memory.size)})`}
                  key={vm.id}
                  value={vm.memory.size}
                  href={`#/vms/${vm.id}`}
                />
              ))}
            </Usage>
          </Col>
        </Row>
        <Row>
          <Col className='text-xs-center'>
            <h5>
              {_('memoryHostState', {
                memoryUsed: formatSizeShort(host.memory.usage),
                memoryTotal: formatSizeShort(host.memory.size),
                memoryFree: formatSizeShort(host.memory.size - host.memory.usage),
              })}
            </h5>
          </Col>
        </Row>
        <Row>
          {pool && host.id === pool.master && (
            <Row className='text-xs-center'>
              <Col>
                <h3>
                  <span className='tag tag-pill tag-info'>{_('pillMaster')}</span>
                </h3>
              </Col>
            </Row>
          )}
        </Row>
        <Row>
          <Col>
            <h2 className='text-xs-center'>
              <HomeTags
                type='host'
                labels={host.tags}
                onDelete={tag => removeTag(host.id, tag)}
                onAdd={tag => addTag(host.id, tag)}
              />
            </h2>
          </Col>
        </Row>
        {!areHostsVersionsEqual && (
          <Row className='text-xs-center text-danger'>
            <Col>
              <p>
                <Icon icon='alarm' /> {_('notAllHostsHaveTheSameVersion', { pool: <Pool id={host.$pool} link /> })}
              </p>
            </Col>
          </Row>
        )}
        {biosData !== undefined && (
          <Row className='text-xs-center'>
            <Col>
              <Icon icon='bios-version' size={3} />
              <p>
                {_('currentBiosVersion', { version: biosData.currentBiosVersion })}{' '}
                <Icon
                  icon={biosData.isUpToDate ? 'success' : 'false'}
                  className={biosData.isUpToDate ? 'text-success' : 'text-danger'}
                />
                <br />
                {!biosData.isUpToDate && (
                  <a href={biosData.biosLink} target='_blank' rel='noreferrer'>
                    {_('downloadBiosUpdate', { version: biosData.latestBiosVersion })}
                  </a>
                )}
              </p>
            </Col>
          </Row>
        )}
        {ipmiSensors !== undefined && !isEmpty(ipmiSensors) && (
          <Row className='mt-3'>
            <Col>
              <Row>
                <IpmiSensorCard icon='ipmi'>
                  {_('keyValue', {
                    key: _('ipmi'),
                    value: (
                      <b>
                        {ipmiSensors.bmcStatus.Event === "'OK'" ? (
                          <a href={`http://${ipmiSensors.generalInfo.ip}`} target='_blank' rel='noopener noreferrer'>
                            {ipmiSensors.generalInfo.ip}
                          </a>
                        ) : (
                          <span className='text-danger'>{ipmiSensors.bmcStatus.Event}</span>
                        )}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='total-power'>
                  {_('keyValue', {
                    key: _('totalPower'),
                    value: (
                      <b>
                        {ipmiSensors.totalPower.Reading} {ipmiSensors.totalPower.Units}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='psu'>
                  {psusKo !== undefined && psusKo.length !== 0 && (
                    <span>
                      {_('nPsuStatus', {
                        n: ipmiSensors.psuStatus.length - nPsusOk,
                        status: (
                          <b>
                            <Icon icon='false' className='text-danger' />
                          </b>
                        ),
                      })}{' '}
                      ({psusKo.map(psu => psu.Name.split('_')[0]).join(', ')})
                      <br />
                    </span>
                  )}
                  {nPsusOk !== 0 &&
                    _('nPsuStatus', {
                      n: nPsusOk,
                      status: (
                        <b>
                          <Icon icon='success' className='text-success' />
                        </b>
                      ),
                    })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='cpu-temperature'>
                  {_('highestCpuTemperature', {
                    n: ipmiSensors.cpuTemp.length,
                    degres: (
                      <b>
                        {cpuHighestTemp.temp}°{cpuHighestTemp.Units}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
              </Row>
              <Row className='mt-1'>
                <IpmiSensorCard icon='fan-status'>
                  {fansKo !== undefined && fansKo.length !== 0 && (
                    <span>
                      {_('nFanStatus', {
                        n: ipmiSensors.fanStatus.length - nFansOk,
                        status: (
                          <b>
                            <Icon icon='false' className='text-danger' />
                          </b>
                        ),
                      })}{' '}
                      ({fansKo.map(fan => fan.Name.split('_')[0]).join(', ')})
                      <br />
                    </span>
                  )}
                  {nFansOk !== 0 &&
                    _('nFanStatus', {
                      n: nFansOk,
                      status: (
                        <b>
                          <Icon icon='success' className='text-success' />
                        </b>
                      ),
                    })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='fan-speed'>
                  {_('highestFanSpeed', {
                    n: ipmiSensors.fanSpeed.length,
                    speed: (
                      <b>
                        {fanHighestSpeed.speed} {fanHighestSpeed.Units}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='inlet'>
                  {_('keyValue', {
                    key: _('inletTemperature'),
                    value: (
                      <b>
                        {ipmiSensors.inletTemp.Reading}°{ipmiSensors.inletTemp.Units}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
                <IpmiSensorCard icon='outlet'>
                  {_('keyValue', {
                    key: _('outletTemperature'),
                    value: (
                      <b>
                        {ipmiSensors.outletTemp.Reading}°{ipmiSensors.outletTemp.Units}
                      </b>
                    ),
                  })}
                </IpmiSensorCard>
              </Row>
            </Col>
          </Row>
        )}
      </Container>
    )
  },
])

const IpmiSensorCard = ({ children, icon, label, value, ...props }) => (
  <Col mediumSize={3} {...props}>
    <div>
      <h2 className='text-xs-center'>
        <Icon icon={icon} size='lg' />
      </h2>
      <div className='text-xs-center'>{children}</div>
    </div>
  </Col>
)
