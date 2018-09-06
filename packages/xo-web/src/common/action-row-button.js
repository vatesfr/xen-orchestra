import styled from 'styled-components'

import ActionButton from '../action-button'

export default styled(ActionButton).attrs({
  size: 'small',
})`
  opacity: 0.5;

  tr:hover &,
  tr:focus & {
    opacity: 1;
  }
`
