import _, { messages } from 'intl'
import ChartistGraph from 'react-chartist'
import PropTypes from 'prop-types'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { Container, Row, Col } from 'grid'
import { forEach, map } from 'lodash'
import { injectIntl } from 'react-intl'

import Component from './base-component'
import Icon from './icon'
import { createSelector } from './selectors'
import { formatSize } from './utils'

// ===================================================================

const RESOURCES = ['disk', 'memory', 'cpus']

// ===================================================================

@injectIntl
export default class ResourceSetQuotas extends Component {
  static propTypes = {
    limits: PropTypes.object.isRequired,
  }

  _getQuotas = createSelector(
    () => this.props.limits,
    limits => {
      const quotas = {}

      forEach(RESOURCES, resource => {
        if (limits[resource] != null) {
          const { total, usage } = limits[resource]
          quotas[resource] = {
            total,
            usage,
          }
        }
      })

      return quotas
    }
  )

  render() {
    const {
      intl: { formatMessage },
    } = this.props
    const labels = [formatMessage(messages.availableResourceLabel), formatMessage(messages.usedResourceLabel)]
    const { cpus, disk, memory } = this._getQuotas()
    const quotas = [
      {
        header: (
          <span>
            <Icon icon='cpu' /> {_('cpuStatePanel')}
          </span>
        ),
        validFormat: true,
        quota: cpus,
      },
      {
        header: (
          <span>
            <Icon icon='memory' /> {_('memoryStatePanel')}
          </span>
        ),
        validFormat: false,
        quota: memory,
      },
      {
        header: (
          <span>
            <Icon icon='disk' /> {_('srUsageStatePanel')}
          </span>
        ),
        validFormat: false,
        quota: disk,
      },
    ]
    return (
      <Container>
        <Row>
          {map(quotas, ({ header, validFormat, quota }, key) => (
            <Col key={key} mediumSize={4}>
              <Card>
                <CardHeader>{header}</CardHeader>
                <CardBlock className='text-center'>
                  {quota !== undefined ? (
                    <div>
                      {Number.isFinite(quota.total) ? (
                        <ChartistGraph
                          data={{
                            labels,
                            series: [quota.total - quota.usage, quota.usage],
                          }}
                          options={{
                            donut: true,
                            donutWidth: 40,
                            showLabel: false,
                          }}
                          type='Pie'
                        />
                      ) : (
                        <p className='text-xs-center display-1'>&infin;</p>
                      )}
                      <p className='text-xs-center'>
                        {!Number.isFinite(quota.total)
                          ? _('unlimitedResourceSetUsage', {
                              usage: validFormat ? quota.usage?.toString() : formatSize(quota.usage),
                            })
                          : _('resourceSetQuota', {
                              total: validFormat ? quota.total?.toString() : formatSize(quota.total),
                              usage: validFormat ? quota.usage?.toString() : formatSize(quota.usage),
                            })}
                      </p>
                    </div>
                  ) : (
                    <p className='text-xs-center display-1'>&infin;</p>
                  )}
                </CardBlock>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    )
  }
}
