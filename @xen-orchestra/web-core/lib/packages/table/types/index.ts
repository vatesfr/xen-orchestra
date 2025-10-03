import type { BodyCellRenderer } from './body-cell'
import type { BodyRowRenderer } from './body-row'
import type { Extensions } from './extensions'
import type { HeaderCellRenderer } from './header-cell'
import type { HeaderRowRenderer } from './header-row'
import type { TableRenderer } from './table'
import type { TBodyRenderer } from './tbody'
import type { THeadRenderer } from './thead'
import type { ComputedRef } from 'vue'

export * from './body-cell'
export * from './body-row'
export * from './extensions'
export * from './header-cell'
export * from './header-row'
export * from './table'
export * from './tbody'
export * from './thead'

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
  | THeadRenderer<TComponentProps, TExtensions, TPropsConfig>
  | TBodyRenderer<TComponentProps, TExtensions, TPropsConfig>
  | HeaderRowRenderer<TComponentProps, TExtensions, TPropsConfig>
  | HeaderCellRenderer<TComponentProps, TExtensions, TPropsConfig>
  | BodyRowRenderer<TComponentProps, TExtensions, TPropsConfig>
  | BodyCellRenderer<TComponentProps, TExtensions, TPropsConfig>

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
