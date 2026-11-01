import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const ENV_PREFIX = 'REACT_APP_'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ENV_PREFIX)
  return {
    plugins: [react()],
    envPrefix: ENV_PREFIX,
    // moment/locale/* require the CommonJS copy, so without this Vite bundles a second, ESM moment that has no zh-cn.
    resolve: { alias: [{ find: /^moment$/, replacement: 'moment/moment.js' }] },
    server: { port: 3000 },
    build: {
      outDir: 'build',
      target: 'es2020',
      // One chunk for what every visit needs. Otherwise each new page cuts it into more, worse-compressing chunks.
      rolldownOptions: { output: { codeSplitting: { groups: [{ name: 'first-load', tags: ['$initial'] }] } } },
    },
    // Source reads process.env.*, including names that are never set, so this must stay a whole object.
    // Tests set process.env themselves, so the build-time values only apply outside test mode.
    define: mode === 'test' ? {} : { 'process.env': { ...env, NODE_ENV: mode, PUBLIC_URL: '' } },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['src/__tests__/setupTests.ts'],
      include: ['src/__tests__/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'json-summary'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/__tests__/**', 'src/Types/**', 'src/index.tsx', 'src/reportWebVitals.ts', '**/*.d.ts'],
        thresholds: { functions: 90 },
      },
    },
  }
})
