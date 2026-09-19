import type { PropertyContact } from './contact'

/**
 * A starting point for the privacy policy (capability F10) — **not** a policy.
 *
 * Staff press *Start from template* and get this in the editor, to rewrite as
 * much as they like. It is shaped to what this product actually collects and
 * to the headings Brunei's Personal Data Protection Order 2025 gives a notice a
 * reason to have: what is collected and why, consent and withdrawing it, who
 * it goes to (including abroad — the database is in Singapore), how long it is
 * kept, how it is protected, access and correction, and a named Data
 * Protection Officer. Whether the finished wording meets the Order is the
 * client's to decide (open question R5).
 *
 * **Everything this product cannot know is a `[Fill in: …]` gap**, and a gap
 * left in refuses to publish (`checkPrivacyPolicyForPublishing`) — so an
 * unedited template can never go live by accident. What it can know, the
 * telephone numbers, is filled in.
 *
 * **No retention period is stated**, for prd.md §13's reason: the periods are
 * Property settings (capability F3), and a sentence repeating one would start
 * lying the first time somebody shortens it. Staff may still write one in.
 */
export function privacyPolicyTemplate(contact: PropertyContact): string {
  const phones = contact.phones.map((phone) => phone.display).join(', ')

  return `## Who we are
Palm Villa is an apartment building in ${contact.locality}, Brunei Darussalam, run by [Fill in: the name of the company or person that operates Palm Villa].
This policy explains what personal data we collect when you book a day pass or a stay with us, why we collect it, who we share it with, and what you can ask us to do with it. We handle personal data in line with Brunei Darussalam's Personal Data Protection Order, 2025.

## What we collect
- Your name and phone number, so we can hold your booking and contact you about it.
- Your email address, if you give us one, to send your booking confirmation.
- The registration of each vehicle you arrive in, so our security team can admit you.
- A copy of the lead guest's identity card (IC), to register a stay.
- Your bank transfer slip, if you send us one, as a record of your payment.
- The details of your booking: the dates, the unit, who is coming and what you paid.
[Fill in: anything else you collect, such as CCTV recordings — or delete this line.]

## Why we collect it
We use your personal data to:
- take, confirm and manage your booking;
- check your payment and keep our accounting records;
- register your stay and admit you at the gate;
- contact you about your booking;
- keep our guests, staff and building safe;
- meet our obligations under the law.
We do not sell your personal data, and we do not use it to send you marketing.

## Your consent
By making a booking and giving us your details, you consent to our using them for the purposes above.
You may withdraw your consent at any time by contacting us (see "Contact us" below). If you do, we may not be able to go ahead with your booking, and we may still need to keep some records where the law requires us to.

## Who we share it with
Our staff see your personal data only where their work needs it. Your identity card can be opened only by staff who are permitted to, and every time it is opened is recorded.
We use service providers to run our booking system — for hosting, storing data and sending email. Some of them store or process personal data outside Brunei Darussalam, including in Singapore. We choose providers that protect personal data to a standard comparable to the protection it has in Brunei Darussalam.
[Fill in: anyone else you share personal data with, such as your accountant, or the authorities when the law requires it.]

## How long we keep it
We keep personal data only for as long as we need it for the purposes above, or for as long as the law requires.
Copies of identity cards are deleted automatically when their retention period ends after your stay. Payment and accounting records are kept for longer, because accounting records must be.

## How we protect it
Your personal data is kept in private storage that only our booking system and permitted staff can reach. It is never published.
If a data breach is likely to cause significant harm to the people affected, or is of a significant scale, we will notify the Authority for Info-communications Technology Industry of Brunei Darussalam (AITI), and the people affected where we are required to.

## Seeing and correcting your data
You may ask us for a copy of the personal data we hold about you and how it has been used, and ask us to correct anything that is wrong. Contact our Data Protection Officer below. We may need to confirm who you are before we reply.
[Fill in: how soon you will reply to a request, for example within 30 days.]

## Contact us
Data Protection Officer: [Fill in: the name or job title of your Data Protection Officer]
Email: [Fill in: the email address requests should go to]
Phone: ${phones}
Address: [Fill in: your postal address]

## Changes to this policy
We may update this policy from time to time. The date at the top of this page shows when it last changed.
`
}
