'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

/**
 * A password field with an eye that shows what was typed (Jeff, 13 September
 * 2026).
 *
 * **Hidden until asked.** A password is typed at a desk other people walk past
 * and on a phone at a guardhouse, so it starts as dots, and the eye shows it for
 * as long as the person wants to check a character — then hides it again. Being
 * shown is this field's own state and is never remembered: a new dialog, a
 * reload or another screen starts hidden.
 *
 * The eye sits inside the field's right edge, the search field's clear-button
 * construction (components/portal/search-field.tsx): the input keeps its one
 * hairline and its height, and the field reads as one control rather than an
 * input with a button beside it.
 *
 * - `type="button"`, so it never submits the form.
 * - `aria-pressed` says whether the password is showing, and the label says
 *   what pressing it does.
 * - A pointer press does not take focus from the field, so a person typing
 *   keeps the caret where it was.
 */

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>

export function PasswordInput({ className, disabled, ...props }: PasswordInputProps) {
  const [isShown, setIsShown] = useState(false)

  return (
    <div className="relative">
      <Input
        {...props}
        disabled={disabled}
        type={isShown ? 'text' : 'password'}
        // Room for the eye, so a long password never runs under it.
        className={cn('pr-[34px]', className)}
      />
      <button
        type="button"
        aria-label={isShown ? 'Hide password' : 'Show password'}
        aria-pressed={isShown}
        aria-controls={props.id}
        disabled={disabled}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setIsShown((shown) => !shown)}
        className="absolute top-1/2 right-xs inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {isShown ? (
          <EyeOff aria-hidden className="size-4" />
        ) : (
          <Eye aria-hidden className="size-4" />
        )}
      </button>
    </div>
  )
}
