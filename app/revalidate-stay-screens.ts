import { revalidatePath } from 'next/cache'

/**
 * Everything that shows a booking's state, a unit's state, or a deposit.
 *
 * Shared by the portal's check-in and check-out and the gate's check-in, which
 * move the same booking and must refresh the same screens — two private copies
 * of this list would be the first to disagree about one of them.
 *
 * Longer than the other revalidation lists in the product because checking in
 * is the one act that touches all three registers at once: the booking moves,
 * the unit becomes occupied, and the deposit's stage moves with the guest. The
 * field screens are here because a guest checked in at the desk has to leave
 * the guard's list of cars to expect.
 */
export function revalidateStayScreens(reference: string, unitRef: string | null): void {
  revalidatePath('/portal/bookings')
  revalidatePath(`/portal/bookings/${reference}`)
  revalidatePath('/portal/deposits')
  revalidatePath(`/portal/deposits/${reference}`)
  revalidatePath('/portal/units')

  if (unitRef) {
    revalidatePath(`/portal/units/${unitRef}`)
  }

  revalidatePath('/portal')
  revalidatePath('/field/arrivals')
}
