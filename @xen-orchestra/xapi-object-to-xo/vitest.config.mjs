import { defineConfig } from 'vitest/config'

// happy-dom, not node: the point of the POC is that this code runs off-server.
export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/**/*.test.mjs'],
  },
})
