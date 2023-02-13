import _ from 'intl'
import decorate from 'apply-decorators'
import React from 'react'
import { Col, Row } from 'grid'
import { connectStore, formatSize } from 'utils'
import { createFinder, createGetObject, createGetObjectsOfType, createSelector } from 'selectors'
import { injectState, provideState } from 'reaclette'
import { isEmpty, map } from 'lodash'
import { SelectNetwork } from 'select-objects'
import { SizeInput } from 'form'

const VmData = decorate([
  connectStore(() => {
    const getHostMaster = createGetObject((_, props) => props.value.pool.master)
    const getPifs = createGetObjectsOfType('PIF').pick((state, props) => getHostMaster(state, props).$PIFs)
    const getDefaultNetworkId = createSelector(createFinder(getPifs, [pif => pif.management]), pif => pif.$network)

    return {
      defaultNetwork: getDefaultNetworkId,
    }
  }),
  provideState({
    effects: {
      onChangeValue(__, { name, value }) {
        const { onChange, value: prevValue } = this.props
        onChange({
          ...prevValue,
          [name]: value,
        })
      },
      onChangeDisks(__, { name, value }) {
        const { onChange, value: prevValue } = this.props
        const disks = prevValue.disks ?? []
        // name-index or description-index
        const data = name.split('-')
        const index = data[1]
        const prevData = disks[index]
        disks[index] = { ...prevData, [data[0]]: value }
        onChange({
          ...prevValue,
          disks,
        })
      },
      onChangeNetworks(__, { name, value }) {
        const { onChange, value: prevValue } = this.props
        const networks = prevValue.networks ?? []
        networks[name.split('-')[1]] = value
        onChange({
          ...prevValue,
          networks,
        })
      },
    },
    computed: {
      networkPredicate:
        (_, { value: { pool } }) =>
        network =>
          pool.id === network.$pool,
    },
  }),
  injectState,
  ({
    defaultNetwork,
    effects: { onChangeDisks, onChangeNetworks, onChangeValue },
    state: { networkPredicate },
    value,
  }) => (
    <div>
      <Row>
        <Col mediumSize={6}>
          <div className='form-group'>
            <label>{_('vmNameLabel')}</label>
            <input
              className='form-control'
              name='nameLabel'
              onChange={onChangeValue}
              defaultValue={value.nameLabel}
              type='text'
              required
            />
          </div>
          <div className='form-group'>
            <label>{_('vmNameDescription')}</label>
            <input
              className='form-control'
              name='description'
              onChange={onChangeValue}
              defaultValue={value.description}
              type='text'
            />
          </div>
        </Col>
        <Col mediumSize={6}>
          <div className='form-group'>
            <label>{_('nCpus')}</label>
            <input
              className='form-control'
              name='nCpus'
              defaultValue={value.nCpus}
              onChange={onChangeValue}
              type='number'
              required
            />
          </div>
          <div className='form-group'>
            <label>{_('vmMemory')}</label>
            <SizeInput defaultValue={value.memory} name='memory' onChange={onChangeValue} required />
          </div>
        </Col>
      </Row>
      <Row>
        <Col mediumSize={6}>
          {!isEmpty(value.disks)
            ? map(value.disks, (disk, diskId) => (
                <Row key={diskId}>
                  <Col mediumSize={6}>
                    <div className='form-group'>
                      <label>
                        {_('diskInfo', {
                          position: `${disk.position}`,
                          capacity: formatSize(disk.capacity),
                        })}
                      </label>
                      <input
                        className='form-control'
                        name={`name-${diskId}`}
                        onChange={onChangeDisks}
                        defaultValue={disk.name}
                        type='text'
                        required
                      />
                    </div>
                  </Col>
                  <Col mediumSize={6}>
                    <div className='form-group'>
                      <label>{_('diskDescription')}</label>
                      <input
                        className='form-control'
                        name={`description-${diskId}`}
                        defaultValue={disk.description}
                        onChange={onChangeDisks}
                        type='text'
                        required
                      />
                    </div>
                  </Col>
                </Row>
              ))
            : _('noDisks')}
        </Col>
        <Col mediumSize={6}>
          {value.networks?.length > 0
            ? map(value.networks, (name, networkId) => (
                <div className='form-group' key={networkId}>
                  <label>{_('networkInfo', { name })}</label>
                  <SelectNetwork
                    defaultValue={defaultNetwork}
                    name={`network-${networkId}`}
                    onChange={onChangeNetworks}
                    predicate={networkPredicate}
                  />
                </div>
              ))
            : _('noNetworks')}
        </Col>
      </Row>
      {value.storage !== undefined && (
        <Row className='mt-1'>
          <Col mediumSize={12}>
            <div className='form-group'>
              <label>{_('homeSrPage')}:</label>{' '}
              <span>
                {_('vmSrUsage', {
                  free: formatSize(value.storage.free),
                  total: formatSize(value.storage.used + value.storage.free),
                  used: formatSize(value.storage.used),
                })}
              </span>
            </div>
          </Col>
        </Row>
      )}
    </div>
  ),
])

export default VmData
