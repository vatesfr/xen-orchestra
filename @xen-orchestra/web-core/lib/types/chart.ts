export type LinearChartData = {
  label: string
  data: {
    timestamp: number
    value: number | string | null
  }[]
}[]

export type ValueFormatter = (value: number | null) => string
