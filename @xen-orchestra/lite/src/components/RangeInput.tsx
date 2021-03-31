import React from "react"

interface PropsRangeInput {
  defaultValue: number
  max: number
  min: number
  onChange: (value: number) => void
  step: number
}
const RangeInput: React.FC<PropsRangeInput> = ({ defaultValue, max, min, onChange, step }) => {
  const [currentValue, setCurrentValue] = React.useState(defaultValue)
  const input = React.createRef<HTMLInputElement>()

  const _onChange = React.useCallback(() => {
    if(input.current === null){
      return
    }
    setCurrentValue(+input.current.value)
    onChange(currentValue)
  },[input])

  return <input max={max} min={min} onChange={_onChange} ref={input} step={step} type="range" value={currentValue} />
}

export default RangeInput
