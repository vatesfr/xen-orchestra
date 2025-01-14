export type LinearChartData = {
  label: string
  data: {
    timestamp: number
    value: number
  }[]
}[]

export type ValueFormatter = (value: number) => string
