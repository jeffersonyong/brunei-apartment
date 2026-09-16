// Pushes the migrations merged into main to the hosted Supabase project — and
// only those.
//
//   npm run db:push:hosted -- --dry-run   list what is pending, change nothing
//   npm run db:push:hosted                push it, then check it landed
//
// `supabase db push` sends every migration in the folder it runs from, and the
// shared working folder often has a branch checked out whose migration has not
// been reviewed. So this never pushes from here: it checks out origin/main in
// a temporary folder, links it to the same project, and pushes from that. A
// migration reaches the hosted database by being merged, which makes the pull
// request the approval.
//
// Before pushing it asks the database which migrations it already has, over
// the Management API's read-only query endpoint, and refuses when the database
// holds one that main does not — that is history somebody pushed from a branch,
// and pushing on top of it would bury the question. After pushing it asks again
// and fails unless every pending migration is recorded.
//
// Credentials come from .env.hosted.local (the npm script loads it), never the
// command line: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD.

import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/** What `supabase link` leaves behind, and all the CLI needs to stay linked. */
const LINK_FILES = ['project-ref', 'linked-project.json', 'pooler-url', 'postgres-version']
const MIGRATION_FILE = /^(\d{14})_.+\.sql$/

const repo = resolve(import.meta.dirname, '..')
const isDryRun = process.argv.includes('--dry-run')

function required(name) {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    throw new Error(
      `Missing ${name}. Run this as \`npm run db:push:hosted\`, which loads .env.hosted.local.`,
    )
  }

  return value.trim()
}

/**
 * Runs a command in the repository, throwing when it fails. On Windows `npx`
 * is a .cmd file and needs a shell, so the arguments are quoted into one
 * string rather than handed to the shell separately.
 *
 * The command name itself is left bare. cmd.exe resolves `%~dp0` inside a
 * batch file invoked by a quoted bare name to the current folder rather than
 * the file's own, so `"npx"` looks for npm in this repository and fails with
 * MODULE_NOT_FOUND. The names passed here are fixed words with no spaces.
 */
function run(command, args, { capture = false } = {}) {
  const options = {
    cwd: repo,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  }
  const result =
    process.platform === 'win32'
      ? spawnSync([command, ...args.map((part) => `"${part}"`)].join(' '), {
          ...options,
          shell: true,
        })
      : spawnSync(command, args, options)

  if (result.status !== 0) {
    const detail = capture && result.stderr ? `: ${result.stderr.trim()}` : ''

    throw new Error(`\`${command} ${args.join(' ')}\` failed${detail}`)
  }

  return capture ? result.stdout.trim() : ''
}

/** The migration versions the hosted database has recorded, read-only. */
async function appliedVersions({ projectRef, accessToken }) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'select version from supabase_migrations.schema_migrations order by version',
        read_only: true,
      }),
    },
  )
  const body = await response.json().catch(() => null)

  if (!response.ok || !Array.isArray(body)) {
    throw new Error(
      `Could not read the hosted migration history (${response.status}): ${JSON.stringify(body)}`,
    )
  }

  return new Set(body.map((row) => String(row.version)))
}

function mergedMigrations(worktree) {
  return readdirSync(join(worktree, 'supabase', 'migrations'))
    .flatMap((name) => {
      const match = MIGRATION_FILE.exec(name)

      return match ? [{ version: match[1], name }] : []
    })
    .sort((a, b) => a.version.localeCompare(b.version))
}

function linkWorktree(worktree) {
  const source = join(repo, 'supabase', '.temp')
  const target = join(worktree, 'supabase', '.temp')

  mkdirSync(target, { recursive: true })

  for (const file of LINK_FILES) {
    if (existsSync(join(source, file))) {
      copyFileSync(join(source, file), join(target, file))
    }
  }
}

function removeWorktree(worktree) {
  // Best effort: a leftover temporary folder is untidy, not dangerous.
  spawnSync('git', ['worktree', 'remove', '--force', worktree], { cwd: repo, stdio: 'ignore' })

  if (existsSync(worktree)) {
    rmSync(worktree, { recursive: true, force: true })
    spawnSync('git', ['worktree', 'prune'], { cwd: repo, stdio: 'ignore' })
  }
}

async function main() {
  const credentials = {
    accessToken: required('SUPABASE_ACCESS_TOKEN'),
    projectRef: required('SUPABASE_PROJECT_REF'),
  }

  required('SUPABASE_DB_PASSWORD')

  // The folder must be linked to the project these credentials are for, or the
  // history below would be read from one database and the push sent to another.
  const linkedRefFile = join(repo, 'supabase', '.temp', 'project-ref')
  const linkedRef = existsSync(linkedRefFile) ? readFileSync(linkedRefFile, 'utf8').trim() : ''

  if (linkedRef !== credentials.projectRef) {
    throw new Error(
      linkedRef === ''
        ? `This folder is not linked to a Supabase project. Run \`npx supabase link --project-ref ${credentials.projectRef}\` first.`
        : `This folder is linked to ${linkedRef}, but .env.hosted.local is for ${credentials.projectRef}. Re-link before pushing.`,
    )
  }

  run('git', ['fetch', 'origin', 'main'], { capture: true })

  const commit = run('git', ['log', '-1', '--format=%h %s', 'origin/main'], { capture: true })
  const worktree = mkdtempSync(join(tmpdir(), 'palm-villa-push-'))

  try {
    run('git', ['worktree', 'add', '--detach', worktree, 'origin/main'], { capture: true })
    linkWorktree(worktree)

    const merged = mergedMigrations(worktree)
    const applied = await appliedVersions(credentials)
    const mergedVersions = new Set(merged.map((migration) => migration.version))
    const unknown = [...applied].filter((version) => !mergedVersions.has(version))

    console.log(`origin/main: ${commit}`)
    console.log(
      `${merged.length} migrations merged; ${applied.size} recorded on ${credentials.projectRef}.`,
    )

    if (unknown.length > 0) {
      throw new Error(
        `The hosted database has migrations main does not: ${unknown.join(', ')}. ` +
          'One was pushed from a branch. Merge it, or repair the history, before pushing more.',
      )
    }

    const pending = merged.filter((migration) => !applied.has(migration.version))

    if (pending.length === 0) {
      console.log('\nNothing to push: the hosted database is up to date.')
      return
    }

    console.log(`\nPending:\n${pending.map((migration) => `  • ${migration.name}`).join('\n')}`)

    if (isDryRun) {
      console.log('\nDry run: nothing was pushed.')
      return
    }

    console.log('')
    run('npx', [
      '--no-install',
      'supabase',
      'db',
      'push',
      '--linked',
      '--yes',
      '--workdir',
      worktree,
    ])

    const after = await appliedVersions(credentials)
    const missing = pending.filter((migration) => !after.has(migration.version))

    if (missing.length > 0) {
      throw new Error(
        `The push finished but these are not recorded: ${missing.map((m) => m.name).join(', ')}.`,
      )
    }

    console.log(
      `\n✓ Pushed ${pending.length} migration${pending.length === 1 ? '' : 's'}; the hosted history now matches main.`,
    )
  } finally {
    removeWorktree(worktree)
  }
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`)
  process.exitCode = 1
})
