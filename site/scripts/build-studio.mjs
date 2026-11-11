import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { loadEnv } from 'vite'

const root = process.cwd()
const output = '.studio-build'
const publicAdmin = 'public/admin'

// The Sanity CLI runs outside Astro, so load the same .env values the site
// build uses. Vercel supplies them through the process environment.
const env = loadEnv(process.env.NODE_ENV ?? 'production', root, '')
for (const [key, value] of Object.entries(env)) {
  if (process.env[key] === undefined) process.env[key] = value
}

await rm(output, { recursive: true, force: true })
await rm(publicAdmin, { recursive: true, force: true })

execFileSync('npx', ['sanity', 'build', output, '--yes'], {
  stdio: 'inherit',
  env: process.env,
})

// `sanity build` puts the Studio at the output root, but with basePath
// `/admin` its assets already point at `/admin/static/...`. Copy just the
// Studio entry and assets into the Astro public folder so `/admin` serves it.
await mkdir(publicAdmin, { recursive: true })
const html = await readFile(`${output}/index.html`, 'utf8')
await writeFile(
  `${publicAdmin}/index.html`,
  html.replaceAll('="/static/', '="/admin/static/'),
)
await cp(`${output}/static`, `${publicAdmin}/static`, { recursive: true })
await cp(`${output}/vendor`, `${publicAdmin}/vendor`, { recursive: true }).catch(() => {})
await rm(output, { recursive: true, force: true })

console.log(`Sanity Studio built into ${publicAdmin}`)
