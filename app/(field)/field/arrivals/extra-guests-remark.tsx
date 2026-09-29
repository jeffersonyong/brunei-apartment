import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MAX_EXTRA_GUESTS_REMARK_LENGTH } from '@/lib/domain/extra-guests'

/**
 * Anything the guard wants the office to know about people beyond the booking
 * — it goes into the note on the booking beside the count. Posted as `remark`.
 */
export function ExtraGuestsRemark() {
  return (
    <div className="grid gap-sm">
      <Label htmlFor="extra-guests-remark">Anything to add (optional)</Label>
      <Textarea
        id="extra-guests-remark"
        name="remark"
        maxLength={MAX_EXTRA_GUESTS_REMARK_LENGTH}
        placeholder="Came in a second car"
      />
    </div>
  )
}
