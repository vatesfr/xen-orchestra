import FormControl from '@mui/material/FormControl'
import MenuItem from '@mui/material/MenuItem'
import React from 'react'
import SelectMaterialUi, { SelectProps } from '@mui/material/Select'
import { iteratee } from 'lodash'
import { SelectChangeEvent, Theme } from '@mui/material'
import { SxProps } from '@mui/system'
import { withState } from 'reaclette'

import IntlMessage from './IntlMessage'

type AdditionalProps = Record<string, any>

interface ParentState {}

interface State {}

interface Props extends SelectProps {
  additionalProps?: AdditionalProps
  containerStyle?: SxProps<Theme>
  onChange: (e: SelectChangeEvent<unknown>) => void
  optionRenderer?: string | { (item: any, additionalProps: any): number | string }
  options: any[] | undefined
  value: any
  valueRenderer?: string | { (item: any, additionalProps: any): number | string }
}

interface ParentEffects {}

interface Effects {}

interface Computed {
  renderOption: (item: any, additionalProps?: AdditionalProps) => React.ReactNode
  renderValue: (item: any, additionalProps?: AdditionalProps) => number | string
  options?: JSX.Element[]
}

const Select = withState<State, Props, Effects, Computed, ParentState, ParentEffects>(
  {
    computed: {
      // @ts-ignore
      renderOption: (_, { optionRenderer }) => iteratee(optionRenderer),
      // @ts-ignore
      renderValue: (_, { valueRenderer }) => iteratee(valueRenderer),
      options: (state, { additionalProps, options, optionRenderer, valueRenderer }) =>
        options?.map(item => {
          const label =
            optionRenderer === undefined
              ? item.name ?? item.label ?? item.name_label ?? item
              : state.renderOption(item, additionalProps)
          const value =
            valueRenderer === undefined
              ? item.value ?? item.id ?? item.$id ?? item
              : state.renderValue(item, additionalProps)

          if (value === undefined) {
            console.error('Computed value is undefined')
          }

          return (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          )
        }),
    },
  },
  ({
    additionalProps,
    containerStyle,
    displayEmpty = true,
    effects,
    multiple,
    options,
    required,
    resetState,
    state,
    ...props
  }) => (
    <FormControl sx={containerStyle}>
      <SelectMaterialUi multiple={multiple} required={required} displayEmpty={displayEmpty} {...props}>
        {!multiple && (
          <MenuItem value=''>
            <em>
              <IntlMessage id='none' />
            </em>
          </MenuItem>
        )}
        {state.options}
      </SelectMaterialUi>
    </FormControl>
  )
)

export default Select
