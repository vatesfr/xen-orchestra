import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import ReactSelect from 'react-select'
import uncontrollableInput from 'uncontrollable-input'
import { AutoSizer, CellMeasurer, CellMeasurerCache, List } from 'react-virtualized'

const SELECT_STYLE = {
  minWidth: '10em',
}
const MENU_STYLE = {
  overflow: 'hidden',
  whiteSpace: 'normal',
}

@uncontrollableInput()
export default class Select extends React.PureComponent {
  static defaultProps = {
    maxHeight: 200,

    multi: ReactSelect.defaultProps.multi,
    required: ReactSelect.defaultProps.required,
    simpleValue: ReactSelect.defaultProps.simpleValue,
    valueKey: ReactSelect.defaultProps.valueKey,
  }

  static propTypes = {
    autoSelectSingleOption: PropTypes.bool, // default to props.required
    maxHeight: PropTypes.number,
    options: PropTypes.array, // cannot be an object
  }

  _cellMeasurerCache = new CellMeasurerCache({
    fixedWidth: true,
  })

  // https://github.com/JedWatson/react-select/blob/dd32c27d7ea338a93159da5e40bc06697d0d86f9/src/utils/defaultMenuRenderer.js#L4
  _renderMenu(opts) {
    const { focusOption, options, selectValue } = opts

    const focusFromEvent = event => focusOption(options[event.currentTarget.dataset.index])
    const selectFromEvent = event => selectValue(options[event.currentTarget.dataset.index])
    const renderRow = opts2 => this._renderRow(opts, opts2, focusFromEvent, selectFromEvent)

    let focusedOptionIndex = options.indexOf(opts.focusedOption)
    if (focusedOptionIndex === -1) {
      focusedOptionIndex = undefined
    }

    const { length } = options
    const { maxHeight } = this.props
    const { rowHeight } = this._cellMeasurerCache

    let height = 0
    for (let i = 0; i < length; ++i) {
      height += rowHeight({ index: i })
      if (height > maxHeight) {
        height = maxHeight
        break
      }
    }

    return (
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            deferredMeasurementCache={this._cellMeasurerCache}
            height={height}
            rowCount={length}
            rowHeight={rowHeight}
            rowRenderer={renderRow}
            scrollToIndex={focusedOptionIndex}
            width={width}
          />
        )}
      </AutoSizer>
    )
  }
  _renderMenu = this._renderMenu.bind(this)

  _renderRow(
    { focusedOption, focusOption, inputValue, optionClassName, optionRenderer, options, selectValue },
    { index, key, parent, style },
    focusFromEvent,
    selectFromEvent
  ) {
    const option = options[index]
    const { disabled } = option

    return (
      <CellMeasurer cache={this._cellMeasurerCache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
        <div
          className={classNames('Select-option', optionClassName, {
            'is-disabled': disabled,
            'is-focused': option === focusedOption,
          })}
          data-index={index}
          onClick={disabled ? undefined : selectFromEvent}
          onMouseEnter={disabled ? undefined : focusFromEvent}
          style={style}
          title={option.title}
        >
          {optionRenderer(option, index, inputValue)}
        </div>
      </CellMeasurer>
    )
  }

  componentDidMount() {
    this.componentDidUpdate()
  }

  componentDidUpdate() {
    const { props } = this
    const { autoSelectSingleOption = props.required, multi, options, simpleValue, value } = props
    let option
    if (
      autoSelectSingleOption &&
      options != null &&
      (value == null || (simpleValue && value === '') || (multi && value.length === 0)) &&
      ([option] = options.filter(_ => !_.disabled)).length === 1
    ) {
      props.onChange(simpleValue ? option[props.valueKey] : multi ? [option] : option)
    }
  }

  render() {
    const { props } = this
    const { multi } = props
    return (
      <ReactSelect
        backspaceToRemoveMessage=''
        clearable={multi || !props.required}
        closeOnSelect={!multi}
        isLoading={!props.disabled && props.options == null}
        style={SELECT_STYLE}
        valueRenderer={props.optionRenderer}
        {...props}
        menuRenderer={this._renderMenu}
        menuStyle={MENU_STYLE}
      />
    )
  }
}
