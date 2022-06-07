import { Theme as ThemeMui, ThemeOptions as ThemeOptionsMui } from '@mui/material/styles'
declare module '@mui/material/styles' {
  // FIXME: when https://github.com/microsoft/TypeScript/issues/40315 is fixed.
  // issue: Type 'Theme'/'ThemeOptions' recursively references itself as a base type.
  interface Theme extends ThemeMui {
    background: {
      primary: {
        dark: string
        light: string
      }
    }
  }
  interface ThemeOptions extends ThemeOptionsMui {
    background?: {
      primary?: {
        dark?: string
        light?: string
      }
    }
  }

  // https://mui.com/material-ui/customization/palette/#adding-new-colors
  interface Palette {
    lightGray: Palette['primary']
  }

  interface PaletteOptions {
    lightGray: PaletteOptions['primary']
  }
}
