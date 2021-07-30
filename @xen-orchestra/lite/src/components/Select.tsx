import React from 'react'
import IntlMessage from './IntlMessage'

import intl from '../lang/en.json'
import { withState } from 'reaclette'
import styled from 'styled-components'

export type Options<T> = {
  render: { (item: T, additionalProps?: AdditionalProps): React.ReactNode }
  value: { (item: T, additionalProps?: AdditionalProps): string | number | readonly string[] | undefined }
}

type AdditionalProps = { [key: string]: any }

interface ParentState {}

interface State {}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  additionalProps?: Record<string, any>
  collection?: unknown[]
  optionsRender: Options<any>
  placeholder?: keyof typeof intl
}

interface ParentEffects {}

interface Effects {}

interface Computed {}

const StyledSelect = styled.select`
background-color: #e4dfdf;
  padding: 5px;
`
const StylesOption = styled.option`
`

const Select = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {},
  ({ additionalProps, collection, effects, multiple, optionsRender, placeholder, resetState, state, ...props }) => (
    <StyledSelect multiple={multiple} {...props}>
      {!multiple && (
        <IntlMessage id={placeholder ?? 'selectChoice'}>
          {message => <StylesOption value=''>{message}</StylesOption>}
        </IntlMessage>
      )}
      {collection?.map((item, index) => (
        <StylesOption key={index} value={optionsRender.value(item, additionalProps)}>
          {optionsRender.render(item, additionalProps)}
        </StylesOption>
      ))}
    </StyledSelect>
  )
)

export default Select
