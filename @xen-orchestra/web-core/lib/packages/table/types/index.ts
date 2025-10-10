import type { Extensions, TableRenderer, TableCellRenderer, TableRowRenderer, TableSectionRenderer } from '.'
import type { ComputedRef } from 'vue'

export * from './table-cell'
export * from './table-row'
export * from './extensions'
export * from './table'
export * from './table-section'

export type ComponentLoader<TProps> = () => Promise<{
  default: abstract new () => {
    $props: TProps
  }
}>

export type PropsOverride<TComponentProps> = Partial<TComponentProps> & Record<string, any>

export type Renderer<
  TComponentProps extends Record<string, any>,
  TExtensions extends Extensions<TComponentProps>,
  TPropsConfig extends Record<string, any>,
> =
  | TableRenderer<TComponentProps, TExtensions, TPropsConfig>
  | TableSectionRenderer<TComponentProps, TExtensions, TPropsConfig>
  | TableRowRenderer<TComponentProps, TExtensions, TPropsConfig>
  | TableCellRenderer<TComponentProps, TExtensions, TPropsConfig>

export type Sources<T = any> = ComputedRef<T[]>

export type TransformProperty<
  TSource,
  TUseSource,
  TPropertyName extends string = 'transform',
> = TUseSource extends TSource
  ? { [K in TPropertyName]?: (source: TUseSource, index: number) => Partial<TSource> }
  : {
      [K in TPropertyName]: (
        source: TUseSource,
        index: number
      ) => Partial<TSource> & {
        [K in keyof TSource as K extends keyof TUseSource
          ? TUseSource[K] extends TSource[K]
            ? never
            : K
          : K]: TSource[K]
      }
    }
