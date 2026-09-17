import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

import { ExportCsvButton } from '@/components/portal/export-csv'
import { SectionCard } from '@/components/portal/section-card'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/lib/auth/permissions'
import type { Actor } from '@/lib/auth/require-permission'
import { exportGroup } from '@/lib/db/export'
import { readFaqFacts } from '@/lib/db/faq-facts'
import { listFaqs } from '@/lib/db/faqs'
import { listStaff } from '@/lib/db/staff'
import { formatInstantAsDate } from '@/lib/domain/dates'
import { env } from '@/lib/env'
import {
  FAQ_TOPICS,
  MAX_FEATURED_FAQS,
  faqsByTopic,
  frontPageFaqs,
  renderFaqAnswer,
} from '@/lib/domain/faq'

import type { WebsiteTabView } from '../website-tab'

import { FaqBoard, type FaqRowView, type FaqTopicView } from './faq-board'
import { NewFaqButton } from './new-faq-button'

/**
 * The questions and answers on the public website (capability F9) — the FAQs
 * tab of Website settings.
 *
 * The screen shows this tab only to somebody holding `faq.manage`; the gate
 * that matters is the first line of every action in ./actions.ts.
 *
 * Two parts. What the front page shows comes first, because it is the part a
 * visitor sees without looking for it; then every topic, including an empty
 * one, since an empty topic is somewhere staff may want to add a question. The
 * list's previews fill the figures in, so staff read what a guest will read.
 */
export async function faqsTab(actor: Actor): Promise<WebsiteTabView> {
  const [faqs, facts, staff] = await Promise.all([listFaqs(), readFaqFacts(), listStaff()])
  const names = new Map(staff.map((account) => [account.id, account.displayName]))
  const featuredCount = faqs.filter((faq) => faq.featured).length
  const frontPage = frontPageFaqs(faqs)
  const grouped = new Map(faqsByTopic(faqs).map((group) => [group.topic.id, group.faqs]))

  const topics: FaqTopicView[] = FAQ_TOPICS.map((topic) => ({
    id: topic.id,
    title: topic.title,
    rows: (grouped.get(topic.id) ?? []).map((faq): FaqRowView => ({
      id: faq.id,
      slug: faq.slug,
      // The whole link, not the fragment the row prints. Staff send one answer
      // over WhatsApp (lib/domain/faq.ts), and a fragment is not something
      // anybody can send — it needs the site's host in front of it, which is
      // `SITE_ORIGIN` and is not this screen's host once the staff side moves
      // to its own subdomain (architecture.md §3).
      url: `${env.siteOrigin}/faq#${faq.slug}`,
      topic: faq.topic,
      question: faq.question,
      answer: faq.answer,
      featured: faq.featured,
      updatedAt: faq.updatedAt,
      preview: renderFaqAnswer(faq.answer, facts).join(' '),
      changed:
        faq.updatedBy === null
          ? 'Written when the site was set up'
          : `Changed ${formatInstantAsDate(faq.updatedAt)} by ${names.get(faq.updatedBy) ?? 'a former colleague'}`,
    })),
  }))

  return {
    lead: 'The questions and answers on the public website. A change is live as soon as it is saved.',
    actions: (
      <>
        {hasPermission(actor.permissions, 'config.manage') ? (
          <ExportCsvButton tables={exportGroup('faqs')} />
        ) : null}
        <Button asChild variant="tertiary">
          <Link href="/faq" target="_blank" rel="noopener noreferrer">
            <ExternalLink aria-hidden />
            View the FAQs page
          </Link>
        </Button>
        <NewFaqButton facts={facts} featuredCount={featuredCount} />
      </>
    ),
    content: (
      <div className="grid gap-xl">
        <SectionCard
          id="faqs-front-page"
          title="On the front page"
          hint={`The website's front page shows up to ${MAX_FEATURED_FAQS} FAQs, in the order the FAQs page lists them. Tick "Front page" on a FAQ below to add it.`}
          actions={
            <span className="micro-label text-muted-foreground tabular-nums">
              {featuredCount} of {MAX_FEATURED_FAQS}
            </span>
          }
        >
          {frontPage.length > 0 ? (
            <ol className="grid list-decimal gap-xs pl-lg text-body-md text-foreground marker:text-muted-foreground marker:tabular-nums">
              {frontPage.map((faq) => (
                <li key={faq.id}>{faq.question}</li>
              ))}
            </ol>
          ) : (
            <p className="text-body-sm text-muted-foreground">
              None yet, so the front page leaves its FAQs section out. Tick &ldquo;Front page&rdquo;
              on a FAQ below to show it there.
            </p>
          )}
        </SectionCard>

        <FaqBoard topics={topics} facts={facts} featuredCount={featuredCount} />
      </div>
    ),
  }
}
