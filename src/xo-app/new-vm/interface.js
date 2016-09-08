import DebounceInput from 'react-debounce-input'
import find from 'lodash/find'
import Icon from 'icon'
import React from 'react'
import { messages } from 'intl'
import { Button } from 'react-bootstrap-4/lib'
import { injectIntl } from 'react-intl'
import {
  SelectIp,
  SelectNetwork,
  SelectResourceSetsNetwork
} from 'select-objects'

import {
  Item,
  LineItem
} from './item'
import styles from './index.css'

const DEBOUNCE_TIMEOUT = 300

const Interface = injectIntl(({
  addresses,
  index,
  intl,
  linkState,
  mac,
  network,
  networkPredicate,
  removeInterface,
  setState,
  useResourceSet
}) => {
  const { formatMessage } = intl
  const _ipPoolPredicate = pool =>
    find(pool.networks, poolNetwork => poolNetwork === network)

  return <LineItem>
    <Item label='newVmMacLabel'>
      <DebounceInput
        className='form-control'
        debounceTimeout={DEBOUNCE_TIMEOUT}
        onChange={linkState(`VIFs.${index}.mac`)}
        placeholder={formatMessage(messages.newVmMacPlaceholder)}
        rows={7}
        value={mac}
      />
    </Item>
    <Item label='newVmNetworkLabel'>
      <span className={styles.inlineSelect}>
        {!useResourceSet ? <SelectNetwork
          onChange={linkState(`VIFs.${index}.network`, 'id')}
          predicate={networkPredicate}
          value={network}
        />
        : <SelectResourceSetsNetwork
          onChange={linkState(`VIFs.${index}.network`, 'id')}
          resourceSet={this.state.resourceSet}
          value={network}
        />}
      </span>
    </Item>
    <LineItem>
      <span className={styles.inlineSelect}>
        <SelectIp
          containerPredicate={_ipPoolPredicate}
          multi
          onChange={linkState(`VIFs.${index}.addresses`, 'id')}
          value={addresses}
        />
      </span>
    </LineItem>
    <Item>
      <Button onClick={removeInterface} bsStyle='secondary'>
        <Icon icon='new-vm-remove' />
      </Button>
    </Item>
  </LineItem>
})
export { Interface as default }
