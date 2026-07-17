import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      all: true,
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/*.d.ts'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
    },
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
