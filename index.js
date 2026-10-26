import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'

/**
 * Host half of the Plugin Sessions studio.
 *
 * The Client half already knows a bundle's name, version, rows and metadata
 * from `pluginManager.listBundles()`. What it cannot know is where a
 * profile-installed bundle actually lives on disk, so this Host half answers
 * exactly that: the profile directory, the recorded dependency spec, the
 * resolved source directory, and the bundle's patch file.
 *
 * It is read-only. Editing the plugin stays the Agent's job inside the
 * modification session, through the ordinary file and plugin-manager tools.
 */

const NAME_RE = /^@?[A-Za-z0-9][A-Za-z0-9._/-]*$/

function profileDirOf(ctx) {
  const fromEnv = process.env.DSH_PROFILE_DIR
  if (typeof fromEnv === 'string' && fromEnv.trim()) return fromEnv
  const dir = ctx.get('pluginManager')?.profile?.dir
  return typeof dir === 'string' && dir.trim() ? dir : undefined
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return undefined
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function realDirectory(path) {
  if (!isDirectory(path)) return undefined
  try {
    return realpathSync.native(path)
  } catch {
    return path
  }
}

/** Resolve a `link:` / `file:` dependency spec to an absolute directory. */
function resolveLocalSpec(profileDir, spec) {
  if (typeof spec !== 'string') return undefined
  const trimmed = spec.trim()
  const match = /^(link|file):(.+)$/.exec(trimmed)
  if (!match) return undefined
  const target = match[2].trim()
  if (!target) return undefined
  const absolute = isAbsolute(target) ? target : resolve(profileDir, target)
  return isDirectory(absolute) ? absolute : undefined
}

function dependencyOf(manifest, name) {
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    const table = manifest?.[section]
    if (table && typeof table === 'object' && Object.hasOwn(table, name)) {
      return { section, spec: table[name] }
    }
  }
  return undefined
}

function patchPathOf(sourceDir, manifest) {
  const declared = manifest?.dsh?.bundle?.patch
  if (typeof declared !== 'string' || declared.trim() === '') return undefined
  const path = isAbsolute(declared) ? declared : resolve(sourceDir, declared)
  return existsSync(path) ? path : undefined
}

function factsFor(ctx, name) {
  const profileDir = profileDirOf(ctx)
  if (!profileDir) {
    return { ok: false, error: { code: 'no-profile', message: 'profile directory is unavailable' } }
  }
  const manifest = readJson(join(profileDir, 'package.json'))
  if (!manifest) {
    return { ok: false, error: { code: 'no-manifest', message: 'profile package.json is unreadable' } }
  }
  const dependency = dependencyOf(manifest, name)
  const localSpec = dependency === undefined ? undefined : resolveLocalSpec(profileDir, dependency.spec)
  const sourceDir = localSpec === undefined ? undefined : realDirectory(localSpec)
  const installedDir =
    sourceDir === undefined ? realDirectory(join(profileDir, 'node_modules', name)) : undefined
  const source = sourceDir === undefined ? undefined : readJson(join(sourceDir, 'package.json'))
  const patchPath = sourceDir === undefined || source === undefined ? undefined : patchPathOf(sourceDir, source)
  return {
    ok: true,
    value: {
      name,
      profileDir,
      spec: dependency === undefined ? null : String(dependency.spec),
      section: dependency === undefined ? null : dependency.section,
      editable: sourceDir !== undefined,
      sourceDir: sourceDir ?? null,
      installedDir: installedDir ?? null,
      patchPath: patchPath ?? null,
      manifest:
        source === undefined
          ? undefined
          : {
              name: typeof source.name === 'string' ? source.name : null,
              version: typeof source.version === 'string' ? source.version : null,
              description: typeof source.description === 'string' ? source.description : null,
            },
    },
  }
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export function apply(ctx) {
  const connection = ctx.get('connection')
  if (!connection?.fetch?.register) return

  ctx.effect(
    () =>
      connection.fetch.register({
        path: '/api/plugin-studio/facts',
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: async (request) => {
          if (request.method !== 'POST') {
            return json(405, { ok: false, error: { code: 'method', message: 'POST only' } })
          }
          let payload
          try {
            payload = await request.json()
          } catch {
            return json(400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON' } })
          }
          const name = typeof payload?.name === 'string' ? payload.name.trim() : ''
          if (name === '' || name.length > 214 || !NAME_RE.test(name)) {
            return json(400, { ok: false, error: { code: 'bad-request', message: 'invalid bundle name' } })
          }
          try {
            return json(200, factsFor(ctx, name))
          } catch (error) {
            return json(500, {
              ok: false,
              error: { code: 'internal', message: String(error?.message || error) },
            })
          }
        },
      }),
    'plugin-studio: plugin facts route',
  )
}

// `connection` must exist before `apply` runs, or the route is silently skipped.
export const inject = ['connection']
