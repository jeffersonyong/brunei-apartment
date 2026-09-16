import { beforeEach, describe, expect, it, vi } from 'vitest'

const getClaims = vi.fn()
const getUser = vi.fn()
let requestHeaders = new Headers()

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ auth: { getClaims, getUser } }),
}))

vi.mock('next/headers', () => ({
  headers: async () => requestHeaders,
}))

const { getAuthenticatedUser, getVerifiedUser } = await import('./session')

const ID = '11111111-1111-4111-8111-111111111111'

const CLAIMS = {
  data: {
    claims: {
      sub: ID,
      aud: 'authenticated',
      email: 'ana@example.com',
      user_metadata: { display_name: 'Ana' },
    },
  },
  error: null,
}

const USER = {
  data: { user: { id: ID, email: 'ana@example.com', user_metadata: { display_name: 'Ana' } } },
  error: null,
}

beforeEach(() => {
  getClaims.mockReset()
  getUser.mockReset()
  requestHeaders = new Headers()
})

describe('getAuthenticatedUser', () => {
  it('reads the user from the verified token and never asks the auth server', async () => {
    getClaims.mockResolvedValue(CLAIMS)

    expect(await getAuthenticatedUser()).toEqual({
      id: ID,
      email: 'ana@example.com',
      displayName: 'Ana',
    })
    expect(getUser).not.toHaveBeenCalled()
  })

  it('stands the email in for a missing or blank name', async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: ID,
          aud: 'authenticated',
          email: 'ana@example.com',
          user_metadata: { display_name: ' ' },
        },
      },
      error: null,
    })

    expect((await getAuthenticatedUser())?.displayName).toBe('ana@example.com')
  })

  it('is null when the token does not verify', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('Invalid JWT signature') })

    expect(await getAuthenticatedUser()).toBeNull()
  })

  it('refuses a token that does not belong to a signed-in user', async () => {
    getClaims.mockResolvedValue({ data: { claims: { sub: ID, aud: 'anon' } }, error: null })

    expect(await getAuthenticatedUser()).toBeNull()
  })

  // An action can be posted to a URL the proxy does not check, so a token
  // revoked elsewhere must still be refused there.
  it.each([
    ['a Next-Action header', { 'next-action': 'abc123' }],
    ['a form posted without JavaScript', { 'content-type': 'multipart/form-data; boundary=x' }],
    ['a url-encoded form', { 'content-type': 'application/x-www-form-urlencoded' }],
  ])('asks the auth server for a request carrying %s', async (_, sent) => {
    requestHeaders = new Headers(sent)
    getUser.mockResolvedValue(USER)

    expect((await getAuthenticatedUser())?.id).toBe(ID)
    expect(getUser).toHaveBeenCalledOnce()
    expect(getClaims).not.toHaveBeenCalled()
  })

  it('refuses an action whose session the auth server has revoked, however valid the token', async () => {
    requestHeaders = new Headers({ 'next-action': 'abc123' })
    getClaims.mockResolvedValue(CLAIMS)
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('session_not_found') })

    expect(await getAuthenticatedUser()).toBeNull()
  })

  it('is null when there is no session', async () => {
    getClaims.mockResolvedValue({ data: null, error: null })

    expect(await getAuthenticatedUser()).toBeNull()
  })
})

describe('getVerifiedUser', () => {
  it('asks the auth server and maps the same way', async () => {
    getUser.mockResolvedValue({
      data: { user: { id: ID, email: 'ana@example.com', user_metadata: {} } },
      error: null,
    })

    expect(await getVerifiedUser()).toEqual({
      id: ID,
      email: 'ana@example.com',
      displayName: 'ana@example.com',
    })
    expect(getClaims).not.toHaveBeenCalled()
  })

  it('is null when the auth server refuses the session', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('session_not_found') })

    expect(await getVerifiedUser()).toBeNull()
  })
})
