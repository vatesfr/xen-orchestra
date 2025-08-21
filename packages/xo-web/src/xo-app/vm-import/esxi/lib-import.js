import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import Dropzone from 'dropzone'
import Icon from 'icon'
import React from 'react'
import { Container } from 'grid'
import { linkState } from 'reaclette-utils'
import { importVddkLib } from 'xo'
import { injectIntl } from 'react-intl'
import { injectState, provideState } from 'reaclette'

// ===================================================================

const getInitialState = () => ({
  file: undefined,
})

export const LibImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      handleDrop: async function (_, files) {
        return { file: files[0] }
      },
      import:
        () =>
        async ({ file }) =>
          importVddkLib({ file }),
      linkState,
      reset: getInitialState,
    },
  }),
  injectIntl,
  injectState,
  ({ effects, state: { file } }) => (
    <Container>
      <form id='import-form'>
        <div className='mb-1'>
          <a
            className='text-info'
            href='https://xcp-ng.org/blog/2022/05/05/how-to-create-a-local-iso-repository-in-xcp-ng/'
            rel='noreferrer'
            target='_blank'
          >
            <Icon icon='info' /> {_('isoImportRequirement')}
          </a>
        </div>
        <div>
          <Dropzone
            multiple={false}
            onDrop={effects.handleDrop}
            message={_('dropDisksFiles', { types: 'tar.gz' })}
            accept='.tar.gz'
          />
          {file && (
            <div className='form-group pull-right'>
              <ActionButton
                btnStyle='primary'
                className='mr-1'
                form='import-form'
                handler={effects.import}
                icon='import'
                redirectOnSuccess='/import/vmware'
                type='submit'
              >
                Import library
              </ActionButton>
              <Button onClick={effects.reset}>{_('formReset')}</Button>
            </div>
          )}
        </div>
      </form>
    </Container>
  ),
])
