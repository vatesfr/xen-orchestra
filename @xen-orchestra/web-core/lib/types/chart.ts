export type LinearChartData = {
  label: string
  data: {
    timestamp: number
    value: number | null
  }[]
}[]

export type ValueFormatter = (value: number | null) => string
