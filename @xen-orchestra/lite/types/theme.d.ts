import { Theme, ThemeOptions, Palette, PaletteOptions } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Mode {
    light?: string
    dark?: string
  }

  interface Background {
    primary?: Mode
    secondary?: Mode
    Blue?: Mode
    Green?: Mode
    Orange?: Mode
    Red?: Mode
  }

  interface CustomPalette extends Omit<Palette, 'background'> {
    background: Background
  }

  interface CustomPaletteOptions extends Omit<PaletteOptions, 'background'> {
    background?: Background
  }

  interface CustomTheme extends Omit<Theme, 'palette'>, CustomPalette {}

  interface CustomThemeOptions extends Omit<ThemeOptions, 'palette'>, CustomPalette {}

  export function createTheme(options?: CustomThemeOptions): CustomTheme
}
