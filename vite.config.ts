import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const ENV_PREFIX = 'REACT_APP_'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ENV_PREFIX)
  return {
    plugins: [react()],
    envPrefix: ENV_PREFIX,
    server: { port: 3000 },
    build: { outDir: 'build', target: 'es2020' },
    // Source reads process.env.*, including names that are never set, so this must stay a whole object.
    define: { 'process.env': { ...env, NODE_ENV: mode, PUBLIC_URL: '' } },
  }
})
