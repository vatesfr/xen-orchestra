import i18n from '@core/i18n.ts'
import { setup } from '@storybook/vue3-vite'
import type { Preview } from '@storybook/vue3-vite'
import { createPinia } from 'pinia'
import '@core/assets/css/base.pcss'
import '@core/assets/css/_themes.pcss'

setup(app => {
  app.use(createPinia())
  app.use(i18n)
})

const preview: Preview = {
  globalTypes: {
    colorMode: {
      description: 'Color mode',
      toolbar: {
        icon: 'sun',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    colorMode: 'light',
  },

  decorators: [
    (story, { globals }) => {
      document.documentElement.classList.toggle('dark', globals.colorMode === 'dark')
      document.documentElement.classList.toggle('light', globals.colorMode !== 'dark')

      return story()
    },
  ],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
