import * as ComplexMatcher from 'complex-matcher'
import _ from 'intl'
import ActionButton from 'action-button'
import ButtonLink from 'button-link'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { escapeRegExp } from 'lodash'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createKubernetesCluster } from 'xo'
import { injectState, provideState } from 'reaclette'
import { success } from 'notification'
import { withRouter } from 'react-router'

import RecipeForm from './recipe-form'

const RECIPE_INFOS = {
  id: '05abc8a8-ebf4-41a6-b1ed-efcb2dbf893d',
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
      recipeCreatingResources: state => state.recipeCreatingResources,
    }
  }),
  provideState({
    initialState: () => ({
      selectedInstallPools: [],
    }),
    effects: {
      async create() {
        const { markRecipeAsCreating, markRecipeAsCreated } = this.props
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

        markRecipeAsCreating(RECIPE_INFOS.id)

        const {
          pool,
          network,
          masterName,
          nbNodes,
          sshKey,
          networkCidr,
        } = recipeParams

        const tag = await createKubernetesCluster({
          poolId: pool.id,
          networkId: network.id,
          masterName,
          nbNodes: +nbNodes,
          sshKey,
          networkCidr,
        })

        const filter = new ComplexMatcher.Property(
          'tags',
          new ComplexMatcher.RegExp(`^${escapeRegExp(tag)}$`, 'i')
        )

        success(
          _('recipeCreatedSuccessfully'),
          <ButtonLink
            btnStyle='primary'
            size='small'
            to={`/home?p=1&s=${filter}`}
          >
            {_('recipeViewCreatedVMs')}
          </ButtonLink>
        )

        markRecipeAsCreated(RECIPE_INFOS.id)
      },
    },
  }),
  injectState,
  ({ effects, recipeCreatingResources }) => (
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
        <ActionButton
          block
          handler={effects.create}
          icon='deploy'
          pending={recipeCreatingResources[RECIPE_INFOS.id]}
        >
          {_('create')}
        </ActionButton>
      </CardBlock>
    </Card>
  ),
])
