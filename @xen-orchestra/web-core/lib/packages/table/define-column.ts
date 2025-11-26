import type { ColumnRenderer } from '@core/packages/table/types.ts'

export function defineColumn<TSetupArgs extends any[], TRenderHeadArgs extends any[], TRenderBodyArgs extends any[]>(
  setup: (...args: TSetupArgs) => ColumnRenderer<TRenderHeadArgs, TRenderBodyArgs>
) {
  return setup
}
