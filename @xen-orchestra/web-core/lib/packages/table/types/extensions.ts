import type { PropsOverride, Renderer } from '.'

export type Extension<
  TConfig extends Record<string, any> = Record<string, any>,
  TComponentProps extends Record<string, any> = Record<string, any>,
> = (config: TConfig) => { props: PropsOverride<TComponentProps> }

export type Extensions<TComponentProps extends Record<string, any>> = Record<string, Extension<any, TComponentProps>>

export type ExtensionConfig<
  TRenderer extends Renderer<any, any, any>,
  TExtensionName extends keyof $Extensions,
  $Extensions extends Record<string, any> = TRenderer extends Renderer<any, infer TExtensions, any>
    ? { [K in keyof TExtensions]: Parameters<TExtensions[K]>[0] }
    : never,
> = $Extensions[TExtensionName]
