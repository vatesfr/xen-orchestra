import _ from 'intl'
import ActionButton from 'action-button'
import Button from 'button'
import decorate from 'apply-decorators'
import React from 'react'
import { importVm, isSrWritable } from 'xo'
import { injectState, provideState } from 'reaclette'
import { Input } from 'debounce-input-decorator'
import { InputCol, LabelCol, Row } from 'form-grid'
import { isEmpty } from 'lodash'
import { linkState } from 'reaclette-utils'
import { Select } from 'form'
import { SelectPool, SelectSr } from 'select-objects'

import { getRedirectionUrl } from './utils'

const FILE_TYPES = [
  {
    label: 'XVA',
    value: 'xva',
  },
]

const getInitialState = () => ({
  pool: undefined,
  sr: undefined,
  type: {
    label: 'XVA',
    value: 'xva',
  },
  url: '',
})

const UrlImport = decorate([
  provideState({
    initialState: getInitialState,
    effects: {
      handleImport() {
        const { type, url } = this.state
        const file = {
          name: decodeURIComponent(url.slice(url.lastIndexOf('/') + 1)),
        }
        return importVm(file, type.value, undefined, this.state.sr, url)
      },
      linkState,
      onChangePool: (_, pool) => ({ pool, sr: pool.default_SR }),
      onChangeSr: (_, sr) => ({ sr }),
      reset: getInitialState,
    },
    computed: {
      srPredicate:
        ({ pool }) =>
        sr =>
          isSrWritable(sr) && sr.$poolId === pool?.uuid,
    },
  }),
  injectState,
  ({
    effects: { handleImport, linkState, onChangePool, onChangeSr, reset },
    state: { pool, sr, srPredicate, type, url },
  }) => (
    <div>
      <Row>
        <LabelCol>{_('vmImportToPool')}</LabelCol>
        <InputCol>
          <SelectPool value={pool} onChange={onChangePool} required />
        </InputCol>
      </Row>
      <Row>
        <LabelCol>{_('vmImportToSr')}</LabelCol>
        <InputCol>
          <SelectSr disabled={pool === undefined} onChange={onChangeSr} predicate={srPredicate} required value={sr} />
        </InputCol>
      </Row>
      <Row>
        <LabelCol>{_('url')}</LabelCol>
        <InputCol>
          <Input
            className='form-control'
            name='url'
            onChange={linkState}
            placeholder='https://my-company.net/vm.xva'
            type='url'
          />
        </InputCol>
      </Row>
      <Row>
        <LabelCol>{_('fileType')}</LabelCol>
        <InputCol>
          <Select name='type' onChange={linkState} options={FILE_TYPES} required value={type} />
        </InputCol>
      </Row>

      <div className='form-group pull-right'>
        <ActionButton
          btnStyle='primary'
          className='mr-1'
          disabled={isEmpty(url)}
          form='import-form'
          handler={handleImport}
          icon='import'
          redirectOnSuccess={getRedirectionUrl}
          type='submit'
        >
          {_('newImport')}
        </ActionButton>
        <Button onClick={reset}>{_('formReset')}</Button>
      </div>
    </div>
  ),
])

export default UrlImport
