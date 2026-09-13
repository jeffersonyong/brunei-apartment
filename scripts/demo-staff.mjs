// Creates two demo field accounts — Demo Security and Demo Housekeeping — so
// the phone screens can be tried against the local stack as the people they
// are for.
//
//   node --env-file=.env.local scripts/demo-staff.mjs
//   (or: npm run db:demo-staff; `npm run db:seed-demo` runs it last)
//
// Local development only, like supabase/seeds/demo.sql. Each account is named
// for what it is and uses the reserved `.test` domain, so neither can be
// mistaken for a member of staff — and the script refuses any Supabase URL
// that is not on this machine, so it cannot create them in a hosted project.
//
// The password comes from DEMO_STAFF_PASSWORD. When it is unset the script
// says so and does nothing, so seeding the demo bookings never fails for want
// of a demo login.
//
// Idempotent, like scripts/bootstrap-admin.mjs: re-running finds the accounts
// and re-grants their roles.

import { createClient } from '@supabase/supabase-js'

const ACCOUNTS = [
  { email: 'security@demo.palmvilla.test', name: 'Demo Security', role: 'security' },
  { email: 'housekeeping@demo.palmvilla.test', name: 'Demo Housekeeping', role: 'housekeeping' },
]

function required(name) {
  const value = process.env[name]

  if (!value || value.trim() === '') {
    console.error(`Missing ${name}. Set it in the environment (see .env.example) and re-run.`)
    process.exit(1)
  }

  return value
}

const password = process.env.DEMO_STAFF_PASSWORD

if (!password) {
  console.log('DEMO_STAFF_PASSWORD is not set, so no demo field accounts were created.')
  process.exit(0)
}

if (password.length < 8) {
  console.error('DEMO_STAFF_PASSWORD must be at least 8 characters, the policy every account uses.')
  process.exit(1)
}

const url = required('NEXT_PUBLIC_SUPABASE_URL')
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
const host = new URL(url).hostname

if (host !== '127.0.0.1' && host !== 'localhost') {
  console.error(
    `Refusing to create demo accounts against ${host}: this script is for the local stack.`,
  )
  process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** The auth user, created or found. */
async function ensureUser(account) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: account.name },
  })

  if (!error) {
    console.log(`Created ${account.email}.`)
    return data.user
  }

  if (error.code !== 'email_exists') {
    console.error(`Could not create ${account.email}: ${error.message}`)
    process.exit(1)
  }

  for (let page = 1; page <= 20; page += 1) {
    const { data: pageData, error: listError } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    })

    if (listError) {
      console.error(`Could not list users: ${listError.message}`)
      process.exit(1)
    }

    const match = pageData.users.find(
      (user) => (user.email ?? '').toLowerCase() === account.email.toLowerCase(),
    )

    if (match) {
      console.log(`${account.email} already exists.`)
      return match
    }

    if (pageData.users.length < 100) break
  }

  console.error(`GoTrue says ${account.email} exists, but it was not found by listing users.`)
  process.exit(1)
}

async function singleRow(table, columns, filters) {
  let query = supabase.from(table).select(columns)

  for (const [column, value] of Object.entries(filters)) {
    query = query.eq(column, value)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Could not read ${table}: ${error.message}`)
    process.exit(1)
  }

  if (data.length !== 1) {
    console.error(
      `Expected exactly one row in ${table} for ${JSON.stringify(filters)}, found ${data.length}. Run \`npm run db:reset\` (the seed creates the property and the roles).`,
    )
    process.exit(1)
  }

  return data[0]
}

const property = await singleRow('property', 'id', {})

for (const account of ACCOUNTS) {
  const user = await ensureUser(account)
  const role = await singleRow('staff_role', 'id', { property_id: property.id, slug: account.role })

  const { error } = await supabase
    .from('user_role')
    .upsert(
      { user_id: user.id, property_id: property.id, role_id: role.id },
      { onConflict: 'user_id,role_id' },
    )

  if (error) {
    console.error(`Could not grant ${account.role} to ${account.email}: ${error.message}`)
    process.exit(1)
  }

  console.log(`${account.email} holds the ${account.role} role.`)
}
