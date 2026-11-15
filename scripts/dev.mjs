import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Local development serves at the server root; production builds use `/KomaYomi-docs/`.
const cli = fileURLToPath(new URL('../node_modules/vitepress/bin/vitepress.js', import.meta.url))

const child = spawn(process.execPath, [cli, 'dev', '--port', '5174'], {
  stdio: 'inherit',
  env: { ...process.env, DOCS_BASE: '/' },
})

child.on('exit', (code) => process.exit(code ?? 0))
