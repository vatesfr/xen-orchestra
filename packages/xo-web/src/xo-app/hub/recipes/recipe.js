import * as ComplexMatcher from 'complex-matcher'
import _ from 'intl'
import ActionButton from 'action-button'
import ButtonLink from 'button-link'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import escapeRegExp from 'lodash/escapeRegExp.js'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createKubernetesCluster } from 'xo'
import { injectState, provideState } from 'reaclette'
import { success } from 'notification'
import { withRouter } from 'react-router'

import RecipeForm from './recipe-form'

const RECIPE_INFO = {
  id: '05abc8a8-ebf4-41a6-b1ed-efcb2dbf893d',
  name: 'Kubernetes cluster',
  description:
    'Creates a Kubernetes cluster composed of 1 master and a configurable number of nodes working for the master.',
}

export default decorate([
  withRouter,
  connectStore(() => ({
    pools: createGetObjectsOfType('pool'),
    recipeCreatingResources: state => state.recipeCreatingResources,
  })),
  provideState({
    initialState: () => ({
      selectedInstallPools: [],
    }),
    effects: {
      async create() {
        const { markRecipeAsCreating, markRecipeAsDone } = this.props
        const recipeParams = await form({
          defaultValue: {
            pool: {},
          },
          render: props => <RecipeForm {...props} value={{ nbNodes: 1, ...props.value }} />,
          header: (
            <span>
              <Icon icon='hub-recipe' /> {RECIPE_INFO.name}
            </span>
          ),
          size: 'medium',
        })

        const {
          gatewayIpAddress,
          masterIpAddress,
          masterName,
          nbNodes,
          network,
          networkMask,
          sr,
          sshKey,
          workerNodeIpAddresses,
        } = recipeParams

        markRecipeAsCreating(RECIPE_INFO.id)
        const tag = await createKubernetesCluster({
          gatewayIpAddress,
          masterIpAddress,
          masterName,
          nbNodes: +nbNodes,
          network: network.id,
          networkMask,
          sr: sr.id,
          sshKey,
          workerNodeIpAddresses,
        })
        markRecipeAsDone(RECIPE_INFO.id)

        const filter = new ComplexMatcher.Property('tags', new ComplexMatcher.RegExp(`^${escapeRegExp(tag)}$`, 'i'))

        success(
          _('recipeCreatedSuccessfully'),
          <ButtonLink btnStyle='success' size='small' to={`/home?s=${encodeURIComponent(filter)}`}>
            {_('recipeViewCreatedVms')}
          </ButtonLink>,
          8e3
        )
      },
    },
  }),
  injectState,
  ({ effects, recipeCreatingResources }) => (
    <Card shadow>
      <CardHeader>{RECIPE_INFO.name}</CardHeader>
      <CardBlock>
        <div
          className='text-muted'
          dangerouslySetInnerHTML={{
            __html: marked(RECIPE_INFO.description),
          }}
        />
        <hr />
        <ActionButton block handler={effects.create} icon='deploy' pending={recipeCreatingResources[RECIPE_INFO.id]}>
          {_('create')}
        </ActionButton>
      </CardBlock>
    </Card>
  ),
])
