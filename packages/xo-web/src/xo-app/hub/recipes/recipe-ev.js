import _ from 'intl'
import ActionButton from 'action-button'
import ButtonLink from 'button-link'
import decorate from 'apply-decorators'
import Icon from 'icon'
import marked from 'marked'
import React from 'react'
import { Card, CardBlock, CardHeader } from 'card'
import { form } from 'modal'
import { connectStore } from 'utils'
import { createGetObjectsOfType } from 'selectors'
import { createEasyVirtVM } from 'xo'
import { injectState, provideState } from 'reaclette'
import { success } from 'notification'
import { withRouter } from 'react-router'

import RecipeForm from './recipe-form-ev'

const RECIPE_INFO = {
  id: 'test',
  name: 'EasyVirt VM',
  description: 'Creates an EasyVirt VM with parameters and application inside',
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

        const { vmName, vmIpAddress, gatewayIpAddress, network, sr, sshKey, xoUsername, xoPassword } = recipeParams

        markRecipeAsCreating(RECIPE_INFO.id)

        const vmId = await createEasyVirtVM({
          vmName,
          vmIpAddress,
          gatewayIpAddress,
          network: network.id,
          sr: sr.id,
          sshKey,
          xoUsername,
          xoPassword,
        })
        markRecipeAsDone(RECIPE_INFO.id)

        success(
          _('recipeCreatedSuccessfully'),
          <ButtonLink btnStyle='success' size='small' to={`/home?s=id:${vmId}&t=VM`}>
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
