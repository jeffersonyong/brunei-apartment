'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requirePermission } from '@/lib/auth/require-permission'
import {
  addBookingExtra,
  moveBookingExtra,
  restoreBookingExtra,
  retireBookingExtra,
  updateBookingExtra,
  type ExtraWriteError,
} from '@/lib/db/booking-extras'
import { checkExtraDraft, type ExtraProblem } from '@/lib/domain/extras'

/**
 * Adding, editing, reordering, removing and restoring the booking extras
 * (capability F13).
 *
 * **The permission is checked before anything is read** — `config.manage`, the
 * same one the rest of Property settings uses, because an extra is a price and
 * a price is configuration (architecture.md §4). The draft is then checked in
 * lib/domain/extras.ts; the database repeats every one of those checks for a
 * request that did not come through here, and holds the one rule this cannot
 * see — a stock figure against what live bookings already carry.
 *
 * Every change revalidates the settings screen and the two booking surfaces
 * that offer extras. `/stay` is `force-dynamic` and needs no help, but the
 * landing page and the FAQs page quote the sofa bed's price through a live
 * figure, so a reprice has to reach them.
 */

export interface ExtraActionState {
  status: 'idle' | 'error' | 'done'
  message?: string
  fieldErrors?: Partial<Record<ExtraProblem['field'], string>>
}

const UNREADABLE: ExtraActionState = {
  status: 'error',
  message: 'That form could not be read. Reload the page and try again.',
}

const flag = z.enum(['true', 'false'])

const draftSchema = z.object({
  name: z.string(),
  description: z.string(),
  fee: z.string(),
  stock: z.string(),
  bookable: flag,
})

const editSchema = draftSchema.extend({
  extraId: z.uuid(),
  expectedUpdatedAt: z.string().min(1),
})

const moveSchema = z.object({ extraId: z.uuid(), direction: z.enum(['up', 'down']) })
const oneSchema = z.object({ extraId: z.uuid() })

function draftFields(formData: FormData) {
  return {
    name: formData.get('name'),
    description: formData.get('description') ?? '',
    fee: formData.get('fee'),
    stock: formData.get('stock') ?? '',
    bookable: formData.get('bookable'),
  }
}

function problemsToFields(
  problems: readonly ExtraProblem[],
): Partial<Record<ExtraProblem['field'], string>> {
  return Object.fromEntries(problems.map((problem) => [problem.field, problem.message]))
}

function refused(error: ExtraWriteError): ExtraActionState {
  return { status: 'error', message: error.message }
}

/**
 * The extras reach three public surfaces: the booking form reads them live,
 * and the landing and FAQ pages quote the sofa bed's fee through the
 * `{sofa bed charge}` figure. The portal screen is revalidated too, because
 * the board it re-renders is the list that just changed.
 */
function revalidateExtras(): void {
  revalidatePath('/settings/property')
  revalidatePath('/bookings/new')
  revalidatePath('/faq')
  revalidatePath('/')
}

export async function addExtraAction(
  _previous: ExtraActionState,
  formData: FormData,
): Promise<ExtraActionState> {
  const actor = await requirePermission('config.manage')
  const parsed = draftSchema.safeParse(draftFields(formData))

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkExtraDraft({
    ...parsed.data,
    bookable: parsed.data.bookable === 'true',
  })

  if (!checked.ok) {
    return { status: 'error', fieldErrors: problemsToFields(checked.problems) }
  }

  const result = await addBookingExtra({ draft: checked.value, actorId: actor.userId })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateExtras()

  return { status: 'done' }
}

export async function updateExtraAction(
  _previous: ExtraActionState,
  formData: FormData,
): Promise<ExtraActionState> {
  const actor = await requirePermission('config.manage')
  const parsed = editSchema.safeParse({
    ...draftFields(formData),
    extraId: formData.get('extraId'),
    expectedUpdatedAt: formData.get('expectedUpdatedAt'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const checked = checkExtraDraft({
    ...parsed.data,
    bookable: parsed.data.bookable === 'true',
  })

  if (!checked.ok) {
    return { status: 'error', fieldErrors: problemsToFields(checked.problems) }
  }

  const result = await updateBookingExtra({
    extraId: parsed.data.extraId,
    draft: checked.value,
    expectedUpdatedAt: parsed.data.expectedUpdatedAt,
    actorId: actor.userId,
  })

  if (!result.ok) {
    // `stock_below_committed` lands on the stock field rather than the form's
    // banner: it is a correction to one number, and the sentence names it.
    return result.error.code === 'stock_below_committed'
      ? { status: 'error', fieldErrors: { stock: result.error.message } }
      : refused(result.error)
  }

  revalidateExtras()

  return { status: 'done' }
}

export async function moveExtraAction(
  _previous: ExtraActionState,
  formData: FormData,
): Promise<ExtraActionState> {
  const actor = await requirePermission('config.manage')
  const parsed = moveSchema.safeParse({
    extraId: formData.get('extraId'),
    direction: formData.get('direction'),
  })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await moveBookingExtra({
    extraId: parsed.data.extraId,
    direction: parsed.data.direction,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateExtras()

  return { status: 'done' }
}

export async function removeExtraAction(
  _previous: ExtraActionState,
  formData: FormData,
): Promise<ExtraActionState> {
  const actor = await requirePermission('config.manage')
  const parsed = oneSchema.safeParse({ extraId: formData.get('extraId') })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await retireBookingExtra({
    extraId: parsed.data.extraId,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateExtras()

  return { status: 'done' }
}

export async function restoreExtraAction(
  _previous: ExtraActionState,
  formData: FormData,
): Promise<ExtraActionState> {
  const actor = await requirePermission('config.manage')
  const parsed = oneSchema.safeParse({ extraId: formData.get('extraId') })

  if (!parsed.success) {
    return UNREADABLE
  }

  const result = await restoreBookingExtra({
    extraId: parsed.data.extraId,
    actorId: actor.userId,
  })

  if (!result.ok) {
    return refused(result.error)
  }

  revalidateExtras()

  return { status: 'done' }
}
