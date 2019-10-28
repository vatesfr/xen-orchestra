import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import React from 'react'
import { Card, CardBlock } from 'card'
import { Col, Row } from 'grid'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createKubernetesCluster } from 'xo'
import { injectState, provideState } from 'reaclette'
import { withRouter } from 'react-router'

import RecipeForm from './recipe-form'

export default decorate([
  withRouter,
  connectStore(() => {
    const getPools = createGetObjectsOfType('pool')
    return {
      pools: getPools,
    }
  }),
  provideState({
    initialState: () => ({
      selectedInstallPools: [],
    }),
    effects: {
      async create() {
        const recipeParams = await form({
          defaultValue: {
            mapPoolsSrs: {},
            pools: [],
          },
          render: props => <RecipeForm {...props} />,
          header: (
            <span>
              <Icon icon='add-vm' /> Kubernetes cluster
            </span>
          ),
          size: 'medium',
        })

        const {
          pool,
          network,
          masterName,
          nbNodes,
          sshKey,
          networkCidr,
        } = recipeParams
        try {
          await createKubernetesCluster({
            poolId: pool.id,
            networkId: network.id,
            masterName,
            nbNodes,
            sshKey,
            networkCidr,
          })
        } catch (error) {
          // TODO
        }
      },
    },
  }),
  injectState,
  ({
    effects,
    hubInstallingResources,
    id,
    name,
    size,
    state,
    totalDiskSize,
  }) => (
    <Card shadow>
      <CardBlock>
        <div>
          <span className='text-muted'>Name</span>
          {'  '}
          <strong>Kubernetes cluster</strong>
        </div>
        <hr />
        <Row>
          <Col mediumSize={6}>
            <ActionButton block handler={effects.create} icon='deploy'>
              {_('create')}
            </ActionButton>
          </Col>
        </Row>
      </CardBlock>
    </Card>
  ),
])
