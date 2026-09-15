import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PrivacyPolicyDocument } from '@/components/privacy-policy-document'
import { readPublishedPrivacyPolicy } from '@/lib/db/privacy-policy'
import { formatInstantAsDate } from '@/lib/domain/dates'
import { parsePrivacyPolicy } from '@/lib/domain/privacy-policy'

export const metadata: Metadata = {
  title: 'Privacy policy — Palm Villa',
  description:
    'How Palm Villa collects, uses and protects the personal data guests give us when they book.',
}

/**
 * The privacy policy, as staff last published it (capability F10).
 *
 * **Staff write every word of it** from Admin → Privacy policy, and
 * this page adds only its title and the date it last changed. Until something
 * is published there is no page — a 404, and the footer's link is inert — so
 * the site never shows an empty notice or a template nobody approved.
 *
 * `force-dynamic`, like `/faq`: a new version is the version the next visitor
 * reads, and the page is one small read.
 */
export const dynamic = 'force-dynamic'

export default async function PrivacyPolicyPage() {
  const policy = await readPublishedPrivacyPolicy()

  if (!policy) {
    notFound()
  }

  return (
    <section aria-labelledby="privacy-heading" className="bg-card px-xl py-3xl">
      <div className="mx-auto w-full max-w-[720px]">
        <p className="micro-label text-accent-foreground">Your personal data</p>
        <h1
          id="privacy-heading"
          className="mt-md font-display text-display-md text-foreground sm:text-display-lg"
        >
          Privacy policy
        </h1>
        <p className="mt-md text-body-md text-muted-foreground">
          Last updated {formatInstantAsDate(policy.publishedAt)}
        </p>

        <PrivacyPolicyDocument
          className="mt-2xl border-t border-divider pt-xl"
          blocks={parsePrivacyPolicy(policy.body)}
        />
      </div>
    </section>
  )
}
