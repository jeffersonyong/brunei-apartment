'use client'

import { RouteError } from '@/components/route-error'
import { contact } from '@/lib/domain/contact'

/**
 * A public page that failed to load, between the site's header and footer —
 * see RouteError. A customer is pointed at WhatsApp rather than at a person
 * they cannot name, because that is where the building answers.
 */
export default function PublicError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-xl py-3xl">
      <RouteError
        error={error}
        retry={retry}
        help={
          <>
            If it keeps happening,{' '}
            <a href={contact.whatsappUrl} target="_blank" rel="noreferrer" className="underline">
              message us on WhatsApp
            </a>{' '}
            and we&rsquo;ll sort it out.
          </>
        }
        home={{ href: '/', label: 'Back to the home page' }}
      />
    </div>
  )
}
