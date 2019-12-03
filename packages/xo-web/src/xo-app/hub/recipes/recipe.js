import _ from 'intl'
import ActionButton from 'action-button'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createKubernetesCluster } from 'xo'
import { injectState, provideState } from 'reaclette'
import { withRouter } from 'react-router'

import RecipeForm from './recipe-form'

const RECIPE_INFOS = {
  name: 'Kubernetes cluster',
  description:
    'Creates a Kubernetes cluster composed of 1 master and a configurable number of nodes working for the master.',
}

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
            pool: {},
          },
          render: props => <RecipeForm {...props} />,
          header: (
            <span>
              <Icon icon='add-vm' /> {RECIPE_INFOS.name}
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
  ({ effects }) => (
    <Card shadow>
      <CardHeader>{RECIPE_INFOS.name}</CardHeader>
      <CardBlock>
        <div
          className='text-muted'
          dangerouslySetInnerHTML={{
            __html: marked(RECIPE_INFOS.description),
          }}
        />
        <hr />
        <ActionButton block handler={effects.create} icon='deploy'>
          {_('create')}
        </ActionButton>
      </CardBlock>
    </Card>
  ),
])
