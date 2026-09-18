# Palm Villa Platform — Scope of Capabilities

**Companion to the project proposal · Scope baseline**

This document lists, in plain language, everything the Palm Villa platform will let your customers and your team do. It is the agreed scope baseline for the quoted work:

- **If a capability is listed here, it is included** in the quoted delivery.
- **If it is not listed here, it is not included.** The "Not included in this delivery" section makes the deliberate exclusions explicit, with notes on when each can be added.
- Every capability has a reference number (A1, B4, …) so we can point at specific items when reviewing — "add this", "remove that", or "this wasn't in scope".
- A capability marked **added to the original scope** came after the proposal was written, and says where it came from. One marked *awaiting your agreement* is built but not part of the quoted delivery until you agree it.
- Open decisions are numbered in the questions register (N7, C2, …), and the notes below point to them where a screen depends on one.

---

## What is being delivered

One web application, one shared database, serving three surfaces:

1. **Public booking site** — where customers check availability, book, and pay.
2. **Operations portal** — the desktop workspace for reservations, finance, and management. This replaces the spreadsheet.
3. **Field screens** — simple phone-browser screens for security and housekeeping. Nothing to install.

Everyone works from the same live data, so availability, payments, and booking status are always consistent across all three.

---

## A. What customers can do (public site)

| # | Capability |
|---|---|
| A1 | Check live availability for any dates — without messaging anyone — **delivered** |
| A2 | See the exact itemised price before booking: nightly rate, extra persons, sofa beds, early check-in, late check-out — **delivered, except early check-in, which is not sold online (see N31)** |
| A3 | Book a facility day pass online, with per-person rates and family bundles applied automatically — the system always charges the cheapest applicable combination — **delivered** |
| A4 | Book a short stay online; the unit is held while payment completes — **delivered; see the notes below** |
| A5 | Receive bank transfer instructions (BIBD / Baiduri) with a unique payment reference to include in the transfer — **delivered** |
| A6 | Upload their transfer slip directly, instead of sending it over WhatsApp — **delivered** |
| A7 | Provide guest details and identity document as part of the booking, replacing the paper/WhatsApp collection step — **delivered; see the notes below** |
| A8 | Receive booking confirmation and an entry QR code by email — delivered as a forwardable image so staff can also send it in an existing WhatsApp conversation — **delivered; see the notes below and under D** |
| A9 | Look up their own booking any time using booking reference + phone number — **delivered** |
| A10 | Get answers to common questions from a self-serve FAQs page — **delivered, with the questions written by your staff (F9); see the notes below** |
| A11 | Browse a public landing page presenting the day-pass facilities, the unit types and "from" rates, with an enquiry route for long-term lets — **added to the original scope; built, awaiting your agreement, and not yet part of the quoted delivery** |

> **A4 is secured by the deposit, like B16.** You confirmed that a booking is held by the BND 100 security deposit with the stay paid on arrival, which is how the business already works. The public flow asks a customer for the deposit rather than the whole stay; everything else about A4 is unchanged.

> **A4 does not promise a timer.** Asked how long a unit should be held for a guest who says they are transferring, the answer was *indefinitely, until somebody checks* (N7) — so nothing releases a booking automatically, by decision rather than by omission. The public flow states the reference and the amount and says the unit is held until payment is confirmed; a countdown the system does not enforce would be a promise it does not keep.

> **A1–A5 as delivered.** A customer picks a unit type, sees what is free on every night for the next two months with the nightly rate on each one, gets an itemised price before committing to anything, and books — a day pass or a short stay. They are then shown the reference, the amount and the bank accounts to transfer to.
>
> Ten things worth saying plainly, because they are the decisions behind the screens:
>
> - **A short stay is held by the deposit, and the stay is paid on arrival** — B16. The customer transfers BND 100, somebody verifies it in the payments queue, and the booking is confirmed with the stay still owed in full. **The desk works the same way**: the booking form takes the deposit as the booking is made and asks whether the guest is paying the deposit alone or the stay with it. The deposit is what makes a booking a booking — money for the stay never confirms one whose deposit is still owed, and a guest whose deposit is not in cannot be checked in until the office records it.
> - **A guest who would rather pay everything now can.** You named two cases for what a guest transfers when booking — the deposit only, or the full amount with the deposit — and both are offered, **with paying in full as the default**, so that settling later is something a guest chooses rather than something the form chooses for them. It is one transfer and two figures on the queue, because the refundable deposit and the money for the stay are different things and stay apart. This is not part payment: the stay is settled in full either way, only sooner.
> - **There is no countdown, by decision.** A hold is indefinite (N7), so the page says the unit is held until the transfer is confirmed. An indefinite hold is only safe while somebody works the queue.
> - **The system picks the unit, not the customer.** A customer chooses a *type*; the system assigns a door and the desk can move it. Units of one type are not interchangeable (bed configurations differ), so offering a choice of door would be giving away a decision nobody has agreed to give away.
> - **The day-pass form says which ages it means.** Each guest row names the ages its rate covers — *Under 1*, *Ages 1–11*, *12 and over* — read from the bands on *Property settings* rather than typed into the page, so a parent is not guessing which row a nine-year-old belongs in and a band you re-price or re-bound describes itself correctly the same day.
> - **The landing page sells what the pass admits, and never names what it does not.** The day-pass section shows a card per facility ticked *Included in day pass*, in your order, so the front page, the booking page and your settings screen cannot disagree.
> - **A day pass never asks the customer to find the bundle.** The engine tries every arrangement and charges the cheapest, so two adults and a child pay BND 20 rather than BND 25 without needing to know a bundle exists. **As you confirmed, a bundle applies as many times as it fits**, and anyone left over pays per person — so four adults and two children pay BND 40, and two adults and three children BND 30.
> - **A booking says how much parking the unit includes, and still records every car.** The stay forms — yours and the customer's — name the unit type's parking under the registration rows, and say so plainly once more plates are entered than there are spaces. They do not refuse the extra car: your guard looks arrivals up by plate, so a registration the form turned away is a car he cannot match at the barrier. **This is not a bay count.** It is the allowance you set per unit type; how many bays the building actually has is still a question for you (R3), and the answer decides whether this becomes a charge or a hard limit. Day passes are unaffected.
> - **The public site is defended without a CAPTCHA.** A hidden field, a request counter, and a cap on how many unpaid bookings one phone number may hold at once. The last is the one that protects rooms; the numbers behind all three are in the register.
> - **The 2-bedroom is not on sale.** It has no units until the count is agreed (N1), so it is not offered rather than shown as full on every night.

> **A6 and A7 as delivered.** A customer who has transferred sends the screenshot from the same page that told them where to transfer, and sends their IC from it too — so the desk stops asking for either over WhatsApp. Four things worth saying plainly:
>
> - **They can replace what they sent, and can never open it again.** A dark photograph is fixed by sending a better one, which supersedes it. Nothing hands the file back: a booking link gets forwarded, and a link that returned a photograph of somebody's IC would be a leak one forward away. The page says a file is on file and when it arrived, and that is all.
> - **A guest's upload never disturbs one your staff filed.** Where the desk has already attached the slip, the guest is told it is on file rather than quietly replacing it; and an IC photographed at the counter stays exactly where it is.
> - **Neither is compulsory.** A booking is never refused for want of a file, and a guest who sends nothing is registered at the door as they are today. What A7 changes is how often that is necessary.
> - **The transfer slip works for the deposit.** The one transfer an online booking actually asks for is the security deposit, which is deliberately not a payment, so the slip is filed against the deposit and appears on the payments queue beside it like any other.
>
> **One question for you, and it is not blocking:** when a guest has sent their IC ahead of arriving, does the desk still need to see the physical card at check-in, or is the copy on file enough? The document is kept either way; the answer only decides what the arrival screen asks of your staff.

> **A9 and A10 as delivered.** A customer who has lost the link to their booking types the reference from their transfer and the phone number they booked with, and lands on their booking. A visitor who has not booked yet reads the answers to the questions guests actually ask, with every rate and time on the page read live from Property settings.
>
> Four things worth saying plainly:
>
> - **A9 is the route back for a guest without the email.** It is the only way back to a booking for a guest who booked without an email address, or who has lost the email.
> - **A booking taken at the desk gets a link the first time somebody looks it up.** Walk-in bookings have never needed one; a guest who rings up asking to see their booking is the case that changes that. The link is created on the spot, the same link every time afterwards, and the booking's history records that it was issued and how it was found.
> - **Somebody who knows a reference and the number it was booked with can open that booking.** That is the capability, stated plainly. A reference is short and sequential because it has to be typed into a bank transfer, so the phone number is what actually protects the booking, backed by a limit on how many attempts one device or one reference gets. **The figures are in the register (N47) and are awaiting your agreement.**
> - **The FAQs page answers only what has been confirmed, and leaves the rest off.** Each question opens to show its answer, and your staff write them from the portal (F9), which also lets them choose a few for the landing page. Eight questions a guest would obviously ask are still open — what a stay includes at the facilities, whether cancelling early costs less, house rules, opening hours, and four more — and they are left off the page until they are answered. An answer agreed with you can be on the site the same day, from *Admin → Website settings → FAQs*. The page also says nothing yet about the confirmation email or the entry QR code; both exist, so that is an answer your staff can add.

---

> **A8 as delivered.** A customer who books receives two emails: one when they book, carrying the reference, what to transfer, the bank accounts and a link back to their own booking page; one when the desk verifies the money, confirming it and saying what is left to pay on arrival. Without them, everything a customer needed lived on one page behind one link — close the tab and the only way back was to message the office, which is the habit this product exists to replace.
>
> Five things worth saying plainly:
>
> - **A confirmed booking gets its entry QR code the moment it is confirmed.** The confirmation email shows it and attaches it as an image a guest can forward to whoever is driving; the guest's own booking page shows it too, for a guest who booked without an email address; and the booking screen has a *Download image* button for the desk to send it over WhatsApp. A guard scans it with the phone's normal camera and lands on that guest's gate card (D3). Anybody else who scans it sees only a first name and initial, the reference, the dates and whether the booking is confirmed. If a code is forwarded somewhere it should not be, the desk replaces it from the booking screen and the old one stops working at once.
> - **The emails are sent from `noreply@bruneiapartment.com`** (N42), and the same address sends the staff *Forgot password?* link (F8).
> - **One email per booking, and only ever these two.** The booking form promises "we will not email you anything else", so it is a standing constraint rather than a preference: no reminders, no marketing, no receipts for each payment. A guest who pays in three instalments hears once.
> - **The confirmation states what is actually left to pay.** A guest who sent everything up front is not told the whole stay is due on arrival. The email and the booking page read the same figure from the same place, so they cannot disagree — and a guest cannot be asked twice for money they have already sent.
> - **A guest cannot be used to send mail to a stranger.** Anyone can reach the booking form, so the address a booking names is capped at a few emails a day — the only limit in the system that protects somebody other than the property.
>
> **Two things the desk should know.** A booking made online without an email address says so on its own screen, so somebody knows to confirm by phone or WhatsApp. And when an email cannot be delivered, that is recorded on the booking's history with the reason, and the portal's notifications say so (F11) — the desk falls back to WhatsApp, which is what it does today anyway.

> **A11 is provisional.** A1–A10 describe a booking site; a marketing landing page is a separate surface that was built ahead of agreement and is recorded here so the baseline stays honest. It is included in the quoted work only once confirmed.

---

## B. What Reservations / Front Office can do (portal)

| # | Capability |
|---|---|
| B1 | See every booking across all streams in a calendar view and a list view — the single source of truth replacing Excel |
| B2 | Create a walk-in booking on the spot, using the same availability check and pricing engine as the public site — no double-entry, no divergent prices |
| B3 | Amend and cancel bookings, with every change recorded (who, what, when) |
| B4 | Work a payment verification queue: each pending booking shows reference, guest, amount expected, waiting time, and the uploaded slip |
| B5 | Confirm payments by matching **both** reference and amount — a short payment is flagged, never silently accepted |
| B6 | Manually match a transfer to a booking when a customer forgets the reference. This is part of the confirm dialog itself: clearing the reference field is how staff say the bank showed none, which makes the dialog's note required and records the row as matched by hand. It covers a **security deposit** as well as a payment for the stay. |
| B7 | Record cash payments against a booking: who collected, when, how much |
| B8 | See each unit's live status through its full lifecycle: available → held → booked → occupied → awaiting inspection → cleaning → available |
| B9 | Mark units out of service, or as leased long-term, so availability always reflects reality |
| B10 | Access guest records and identity documents, subject to permission (see G-series) |
| B11 | Discount a booking at the desk — a fixed amount or a percentage — with a typed reason recorded against it. Discounting is its own permission, so it can be withheld from a role that otherwise takes bookings, and every discount given appears in the audit trail. **(added to the original scope at your team's request)** |
| B12 | Keep free-text notes on any booking: an append-only thread with who wrote each note and when, so context stops living in WhatsApp. Each note is marked for the office or for housekeeping. **(added to the original scope at your team's request)** |
| B13 | Settle what an amendment left owing: a booking shows what has been paid and what is still outstanding, and the difference can be taken in cash or by bank transfer from the booking itself. A top-up transfer goes through the same verification queue as any other. **(added to the original scope — the gap the amend feature created)** |
| B14 | Keep a note against a **unit** — a sticking door, a temperamental aircon, where the spare key lives. It belongs to the unit rather than to whoever is staying in it, so it survives every booking, and every change to it is recorded with who made it and when. **(added to the original scope at the owner's request)** |
| B15 | Waive the security deposit on a booking at the desk, with a typed reason recorded in the booking's history — the case is a guest extending their stay, where the deposit is already held under the first booking. Waiving is its own permission, so it can be withheld from a role that otherwise takes bookings, and a waived booking checks in taking nothing and says so. **(added to the original scope at the owner's request)** |
| B16 | Take an advance booking secured by the security deposit: the guest transfers the BND 100 when they book, the unit is held until someone verifies it, and the stay itself is settled on arrival. A guest who cancels or does not turn up forfeits the deposit. A customer booking online transfers the deposit and the queue verifies it; the desk form takes it as a booking is made, in cash or as a transfer, and asks whether the guest is paying the deposit alone or the stay with it. The deposit is what confirms a booking, so money for the stay never confirms one whose deposit is still owed, and check-in refuses a booking whose deposit is not in. A deposit that arrives short of the quoted figure — a guest who sends half now and the rest later, or a bank fee off the top — is recorded, shown as short wherever the deposit appears, and secures nothing until the desk tops it up from the booking; check-in refuses a short deposit as firmly as a missing one. **(added to the original scope at the owner's request, replacing the walk-ins-only rule the scope was written against; delivered)** |
| B17 | Book a guest who is waiting at the gate with nothing taken at the desk: the unit is held for them, and the guard takes the deposit and then the stay in cash when they drive in (D6). Only for a stay starting today, and never with a waived deposit. **(a correction to how the desk and the gate work together rather than an addition: the guard cannot make a booking himself and calls the office, N54; within the quoted delivery)** |

> **B3 and B16: cancelling and not turning up.** A guest who cancels or does not turn up forfeits the deposit in the system, not only in the policy. Four things worth saying plainly:
>
> - **Cancelling asks what happens to the deposit, and keeping it is the default.** A booking made by mistake, or cancelled by you, is not the case the rule is about, so the desk can give the deposit back instead, against the reason it already has to type. A kept deposit leaves the "what do we owe back" ledger and counts as revenue on the day it was kept.
> - **The desk can mark a no-show**, from the day the guest was due. It keeps the deposit and puts the room back on sale for the nights they did not use — a guest who turns up later is booked afresh.
> - **A transfer that was promised and never arrived keeps nothing.** It drops out of the payments queue when the booking closes; if the money turns up anyway, it goes back outside the system.
> - **Money paid for the stay is refunded outside the system.**
>
> **Two questions for you, neither blocking** (N49 and N50): whether giving a deposit back on a cancellation should need a second person, and whether a no-show should wait until the day after the guest was due.

**B8 as delivered.** All eight states are live: available, held, booked and occupied from the bookings; **awaiting inspection** and **cleaning** from the housekeeping phone screen (C1–C3); and out of service and leased long-term from B9. The board does not call a unit available on a guest's last day while the guest is still in it.

**B1 as delivered.** Every stay, hold and lease is laid out on the calendar by unit and by night, one month at a time, coloured by state; an empty night starts a booking with the night and the unit type filled in (B2). Day passes are not on the grid, because they occupy no unit; they appear in the list view.

---

## C. What Housekeeping can do (phone)

| # | Capability |
|---|---|
| C1 | See today's check-outs on a single phone screen |
| C2 | Record a unit inspection: outcome, notes, and photographs as evidence |
| C3 | Mark a unit as ready once it is clean, so the units board and the office can see it. A unit is never taken out of availability for cleaning, so marking it ready changes what the board says, not what can be sold. Whether it should hold back the next guest's check-in is a question for you (N53). |

> **C1–C3 as delivered.** A cleaner signs in on their phone straight to today's departures: the guests due out, the units waiting to be inspected and the units being cleaned, with any unit somebody arrives in today at the top. Four things worth saying plainly:
>
> - **The cleaner checks the guest out** when the guest has left the keys in the unit. When the unit is empty on the guest's last day, *Guest has left* checks them out from the phone and the unit moves to inspection. A guest who hands the keys back at the gate is checked out there instead (D5). The button appears on the last day and not before, so a guest who is only out for the day cannot be checked out this way; a guest who leaves early is checked out at the desk.
> - **Ready is a status, not a gate.** Marking a unit ready tells the office it is clean. Check-in and availability do not wait on it.
> - **The cleaner sees what the office wrote for them, and nothing else.** Each unit shows its own standing note and the booking's notes marked for housekeeping. Notes for the office never reach the phone.
> - **Photographs taken on the phone go up.** Each is made smaller on the phone first, so a camera photograph is not refused for its size. The smaller copy carries no location and no camera timestamp; the system records when it arrived and who sent it.
>
> **Decided on your behalf, for you to confirm:** on the day one guest leaves and the next arrives, the board shows the unit as awaiting inspection or cleaning rather than booked; and a unit marked ready cannot be un-marked.

---

## D. What Security can do (phone)

| # | Capability |
|---|---|
| D1 | See today's expected arrivals on a single phone screen, built to remain usable on poor signal |
| D2 | Look up an arriving guest by **vehicle registration** or name |
| D3 | Check a guest in by scanning their QR code with the phone's normal camera — no app, no special scanner. The guard is the front desk and hands over the keys (N54), so he checks the guest in at the gate — by plate or name, or by scanning the QR code. |
| D4 | See the booking's payment status at the gate, so an unpaid arrival is flagged rather than waved through — and paid there where the guard can take the money (D6), or routed to the office where he cannot (N54) |
| D5 | Check a guest out at the gate when they hand back the keys, on their last day or after it — the unit moves straight to inspection. **(a correction to how the gate was scoped rather than an addition to it: the guard is the front desk, N54; within the quoted delivery)** |
| D6 | Take the cash a guest still owes at the gate and record it under the guard's name — the security deposit, the rest of a short deposit, the stay, or a day pass — counted in the day's cash-up like the desk's. The guard never confirms a bank transfer. **(a correction to how the gate was scoped rather than an addition to it: the guard is handed pending cash, N54; within the quoted delivery)** |

A forwarded or leaked QR code grants nothing by itself — check-in authority comes from the logged-in staff member, and each code can be revoked and re-issued.

> **D1–D6 as delivered.** A guard signs in on their phone straight to the Gate: every stay due today, the guests leaving today, every day pass, and the guests already staying, each with the plates to match against the car. The guard checks guests in (D3) and out (D5), admits day passes, and takes the cash guests owe (D6). Five things worth saying plainly:
>
> - **The guard is the front desk, as you confirmed.** He checks a guest in when he hands over the keys, checks them out when the keys come back, and admits a day pass, which closes it. He cannot make a booking — the card tells him to call the office — and the office can book a guest who is waiting at the barrier for him to collect (B17).
> - **The guard takes the cash a guest still owes, and sees a figure only to take it.** The card works out what the money is for — the deposit first, then the stay, or a day pass — so he never has to tell one from another, and records it under his name. A phone signed in without permission to take cash carries no prices at all. He never confirms a bank transfer, and nothing is taken while a transfer for the same money is waiting to be checked.
> - **A guest is checked out at the gate only on their last day, or after it.** The gate cannot tell a guest leaving from one out for the evening, and a check-out cannot be undone, so an early departure is the office's. A guest still owing for the stay is asked for it first, because once they are checked out nothing more can be recorded against the booking.
> - **It is built for a weak signal, not for none.** The day's list loads once and the guard's typing filters it on the phone. Whether the guardhouse has signal at all is still a question for you (C3).
> - **The QR code saves typing, and plate lookup stays first-class.** A guard scans a guest's code with the phone's normal camera and lands on that guest's card, with the same buttons and the same checks as on the list — scanning changes nothing about what he may do. If his sign-in has lapsed, he signs in from that page and lands back on the guest. A code lets nobody in by itself: anyone else who scans it sees a first name and initial, the dates and whether the booking is confirmed. Plate and name lookup, which the requirements always expected to carry most of the traffic, works the same way.
>
> **Decided on your behalf, for you to confirm:** a guest who turns up before their booking starts is sent to the office rather than let in; nobody is checked out at the gate before their last day; a unit not marked ready is said on the guard's card and never stops the check-in; a day pass is admitted only when it is paid in full and on its own date; and a booking left for the gate to collect must start today and cannot waive its deposit. **Four details you have settled** (N55–N58):
> - The guard never hands back the BND 100; the office processes it in the few days after check-out.
> - How the guard's cash reaches the office is left to your own arrangements.
> - A guest who leaves still owing for the stay is dealt with by the office, outside the system, because nothing can be recorded against a booking once it is checked out.
> - Booking a guest for the gate to collect stays today-only.

---

## E. What Finance can do (portal)

| # | Capability |
|---|---|
| E1 | See all security deposits currently held, as a live ledger — "what do we owe back right now" answered in one screen |
| E2 | Approve deposit releases — the approval is only available once the inspection is recorded, and is logged as a formal event (who approved, when, how much) |
| E3 | Record itemised charges against a deposit, each with a reason and author; where charges exceed the deposit, the balance is tracked as an amount owed with a shareable statement |
| E4 | Run a daily cash-up view: cash recorded in the system versus cash banked |
| E5 | View reports: occupancy by unit and type, revenue by stream, outstanding deposits, outstanding charges, and day-pass volume against capacity — **each table downloadable as a CSV** for the period and filters on screen |

**E4 and E5 as delivered.** The reports screen answers occupancy by unit and by type over any period, revenue by stream, day-pass guests per day against capacity, and what is held and owed right now; the daily cash-up is its own screen, comparing the cash the desk recorded against the cash somebody took to the bank, day by day.

Five things worth saying plainly, because they are the decisions behind the figures:

- **The cash-up counts booking payments, not deposits.** A cash security deposit goes into the same drawer, so the day states how much of it is there — but it is money you owe back rather than money you earned, and adding it to the takings would bank a liability as revenue. Whether Finance would rather count the drawer as one figure is a question in the register (N27).
- **Banking is recorded, never edited.** A trip to the bank is a physical act with a witness, so a correction is a second entry and the day's difference moves. Both entries stay on the day, with who recorded each.
- **Revenue is money received, not money quoted.** A payment counts on the day it actually arrived — cash on the day it was taken, a transfer on the date read off the bank — and a payment nobody has confirmed counts for nothing. So the revenue figure agrees with what the bank holds rather than with what bookings were worth.
- **A tenancy shows no revenue, and says so.** A long lease is recorded as occupancy with no money attached (full tenancy management is X5), so it appears in occupancy and at zero in revenue.
- **Day-pass volume is guests, against the capacity set today.** A family of five fills five places. No facility capacity has been agreed yet (C2), so the table reads *No limit set* until one is typed in Property settings; from then on it shows how full each day was.

**E1–E3 as delivered.** The ledger answers what is held right now, a deposit has its own screen carrying the inspection, its itemised charges and the release approval, and a released deposit prints a statement to send on.

- **An inspection carries photographs** — any number, stored privately, deleted automatically after two years.
- **Checking a guest in and out is part of it**, because a deposit is collected on arrival and inspected after departure. Checking in and checking out are permissions of their own, and the guard holds both (see D).

---

## F. What the Owner / Admin can do (portal)

| # | Capability |
|---|---|
| F1 | Manage staff accounts and assign roles — one person can hold several roles (e.g. Front Office + Finance + Admin), so the system fits the team as it is today and as it grows |
| F2 | Adjust what each role is allowed to do, without developer involvement |
| F3 | Configure pricing, facility inclusion and capacity, and document retention periods — pending decisions (e.g. whether gym, snooker or sauna are included in the day pass) become a settings change, not a development change. Hold durations are not among them, because a hold is indefinite (N7) |
| F4 | Review the full audit trail: every change to bookings, payments, deposits, and charges, with actor and timestamp |
| F5 | Export all business data at any time in a usable format — the data is yours |
| F6 | Name the units the way they are labelled on the actual doors, and set how many of each type the building has — so the system matches the building without a developer. Names are set as a pattern per unit type and can be adjusted one at a time where a block does not follow the pattern. Every rename is recorded, and a unit that has hosted a booking is taken out of service rather than deleted, so its history survives. **(added to the original scope — it takes two open questions off the critical path)** |
| F7 | Replace the photographs on the public site from the portal — the front-page photo, one for each day-pass facility and each unit type on the landing page, and the four "Follow along" tiles. Add, replace or remove a photo, write the description that goes with it, and choose which part stays in view when the site crops it. A repaint, a renovation or a new photo shoot is an upload, not a developer deploy. **(added to the original scope; agreed and delivered)** |
| F8 | Staff who forget their password reset it themselves from a link emailed to them, instead of waiting for an administrator. An administrator can still reset anyone's password, which is how staff without an email address they can reach get back in. **(added to the original scope; built and switched on, awaiting your agreement)** |
| F9 | Write the questions and answers on the public site from the portal — add, reword, reorder and remove a question under one of five topics, and choose up to six to show on the landing page as well. An answer never has a price, time or bank account typed into it: it names the figure, and the site fills it in from Property settings, so a rate changed there is the rate every answer quotes. A question whose answer has just been agreed goes on the site the same day, not in the next developer deploy. **(added to the original scope; built, awaiting your agreement)** |
| F10 | Write and publish the privacy policy on the public site from the portal — start from a template shaped to what the site collects and to Brunei's Personal Data Protection Order 2025, rewrite it as you see fit in a word-processor-style editor (headings, bullet and numbered lists, bold; pasting from Word or Google Docs keeps them), and publish it when the wording is approved. Until a policy is published, the *Privacy policy* link in the website's footer is inactive; once it is, the footer and the guest's IC upload link to it. Every published version is kept. **The wording is yours to write and approve: this delivers the means to publish a policy, not the policy itself, and not advice on whether it is compliant.** **(added to the original scope; built, awaiting your agreement)** |
| F11 | Hear about what needs attention without going to look — the bell at the top of the portal lists new bookings made on the website, payments waiting to be checked, and booking emails that could not be sent, each opening the booking or the verification queue. Each person sees only what their role lets them act on, never what they did themselves, and a dot on the bell says something is new until they open it. **(added to the original scope; built, awaiting your agreement)** |
| F12 | Find anything from one box at the top of the portal (or Ctrl K / ⌘K) — a booking by its reference, the guest's name or phone, or the unit; a payment waiting to be checked; a deposit; a unit; or a screen by its name. Each result opens the record, and nobody is shown anything their role does not let them open. **(added to the original scope; built, awaiting your agreement)** |
| F13 | Decide what a guest can add to a stay — add an extra (a karaoke set, a cot, anything the building buys), change its name, price or description, take it off the booking forms for a while, remove it, or put it back. Say how many of each you own and the system will not let two bookings take the same one on the same night, freeing it when the guests leave. The sofa bed is there to begin with; everything else is yours to add. **(added to the original scope; built, awaiting your agreement)** |

> **Website settings.** F7, F9 and F10 are the three tabs of one screen, *Admin → Website settings*: Photos, FAQs and Privacy policy. Each tab has its own permission, so a member of staff sees only the tabs they have been given.

> **F7 as delivered.** Every photograph on the landing page is managed from *Website settings → Photos*, one photo per place: the front-page photo, a card for each facility the day pass admits, a card for each unit type, and the four "Follow along" tiles. The first two lists follow *Property settings*, so a facility your staff tick into the day pass — or a unit type they add — gets its photo place the same day, with no developer involved. A photo is made smaller and turned the right way up before it is sent, previewed exactly as the site will crop it, and live on the website as soon as it is saved. Removing one puts the grey placeholder back and deletes the file.
>
> - **A facility's card can be switched off.** Each day-pass facility on the Photos tab has *Show on the front page*, for a facility you have no photo of yet or would rather not advertise. It takes the card off the landing page and nothing else: the day-pass booking page still lists everything the pass admits, because the customer is still buying it.
> - **Its own permission.** Changing the photos needs *Manage website photos*, which Admin holds and any other role can be given with one tick in Roles & staff — so whoever runs the Instagram account can be trusted with the photos without also being given pricing, roles or the audit log. Every change is recorded in the audit log.
> - **These are public files.** A photo on the website can be seen by anyone, so the upload dialog asks staff not to use one where a guest can be recognised without their permission. Whose permission that needs is a policy question for the business (R4).
> - **The landing page itself (A11) is still provisional.** F7 manages the places that page shows today; if the page changes, the photo places follow it.

> **F8 as built.** *Forgot password?* sits on the staff sign-in screen. A member of staff types their email address and receives a link that works once, for an hour — asking again cancels the earlier link. The screen gives the same answer whether or not the address belongs to anyone, so it cannot be used to find out who works here, a disabled account is sent nothing, and every reset email is recorded in the audit log. If email sending is ever unavailable, the screen says so and tells staff to ask an administrator.

> **F9 as built.** The FAQs are managed from *Website settings → FAQs*. The tab opens on what is on the front page (up to six, in page order), then every topic with its questions — each showing its answer as the site will show it — and a question is put on the front page, moved up or down, edited or removed from its own row.
>
> - **Live figures, not typed ones.** The editor's *Insert live figure* menu puts a named figure into an answer — the security deposit, the nightly rates, the bank accounts and thirteen more — and the preview shows it filled in. A figure the site cannot fill in is refused on save; an amount typed by hand, like "BND 100", is pointed out but allowed, because a sentence sometimes means exactly that.
> - **Its own permission.** Changing the FAQs needs *Manage website FAQs*, which Admin holds and any other role can be given with one tick in Roles & staff. It is separate from the photos permission, because a photograph and a sentence about payment are different trusts, and from settings, so whoever keeps the site's wording current is not handed pricing, roles or the audit log. Every change is recorded in the audit log, including what a removed question said.
> - **A link never breaks.** A question's address is set when it is added, so rewording it does not break a link staff have already sent over WhatsApp.
> - **The site starts with twenty questions**, six of them on the front page. The eight still open are not among them (see A10). The five topics are fixed rather than something staff edit.
> - **The front-page section follows A11**, which is still provisional; the FAQs page itself is A10.

> **F11 as built.** The bell checks for news when the portal opens, every minute while the portal is on screen, and whenever staff come back to the tab. It covers the last fourteen days, newest first; older events are in the audit log. Opening it marks what it shows as seen, for that person on every device.
>
> - **Three kinds, on purpose.** A website booking (to anyone who can see bookings), a payment to verify (to anyone who can verify payments) and a booking email that failed (to anyone who can see bookings). A hold never expires (N7), so there is no "hold expired" notification.
> - **Nothing new is stored.** Each notification is an entry the audit log already holds; the only new record is when each person last opened the bell.

> **F12 as built.** Search looks at the same details as each list screen's own search box, so a result there matches a result here. It shows the first five of each kind, and the list screen holds the rest. A payment result opens the verification queue, filtered to that booking. Records are searched once two characters are typed; a screen's name matches from the first letter.

> **F13 as built.** The extras are managed from *Admin → Property settings → Extras*, and the list they make is the list all three booking forms offer — the website, the desk's walk-in form and the edit screen — so a booking taken online and one taken at the counter can never disagree about what something costs.
>
> - **What an extra is.** A name, an optional line of description shown under the counter, a price, and — optionally — how many you own. It is charged **once for the whole stay**, however many nights it is, which is how the sofa bed already worked. Extras are for stays; day passes keep their own prices.
> - **Off the form, or gone.** *On sale* takes something off the booking forms without removing it — the thing still exists, it just is not being sold this month. *Remove* takes it off the list as well. Neither touches a booking that already has one: it keeps it, at what it was quoted, on its receipt.
> - **Removing never deletes.** A removed extra sits under *Removed* and can be put back with one click. It comes back **not on sale**, deliberately, so a price nobody has looked at for six months does not go straight onto the public website.
> - **The count is real, and it is new.** Before this, the sofa bed's number was only ever checked against the booking being made — so two bookings could each take two of two beds on the same night and nothing objected. Now an extra is held for the nights of the stay and released when the booking ends or is cancelled, and the booking that would take one more than there are is refused. The booking forms show how many are free for the dates chosen.
> - **Leaving the count blank means "nobody has counted these"** — which is deliberately not the same as zero, and is where the sofa bed still sits (N8). Nothing is limited until a number is given, so a blank never stops a booking.
> - **Its own audit trail.** Adding, repricing, recounting, taking off sale, removing and restoring are each recorded with who did it. Changing the extras needs the same permission as the rest of Property settings.
> - **One thing it does not do yet.** A FAQ answer can quote the sofa bed's price as a live figure, and still does. A *new* extra does not get a live figure of its own — an answer mentioning the karaoke set would have to state its price in words, and would not follow a later reprice.

> **F3, F4 and F5 as delivered.** Property settings edits the rates, the day-pass prices, what a day pass admits, how long each kind of document is kept, and the bank accounts customers transfer to. The audit log reads the whole trail on one screen. Every table the business runs on downloads as a spreadsheet — from the screen that holds its records, so the bookings come off the register and the deposits off the ledger.
>
> Five things worth saying plainly, because they are the decisions behind the screens:
>
> - **There is no setting for how long a hold lasts.** A unit is held indefinitely until somebody checks (N7), so a hold-duration setting would be a number that changed nothing.
> - **A rate change is not retrospective.** A booking already taken keeps the price it was quoted; only a new booking, or an amendment to an existing one, is priced at the new rate. The screen says so where the rates are edited.
> - **Shortening a retention period does apply to files already held.** Cut identity documents to six months and every one on file is re-dated to six months after its stay; anything then past its date stops being viewable at once and is destroyed on the next nightly run. The record that the file existed, who uploaded it and who opened it survives either way.
> - **The export is the records, never the files.** Documents come out as a list of what was held — kind, size, who uploaded it, when it stops being kept — and an identity document's filename is left out, because it usually carries the guest's name and IC number and a spreadsheet is not protected the way the document screen is.
> - **The audit log and the export are Admin-only, and downloads are not themselves logged.** Both decisions are in the register for your confirmation.
>
> **One thing F3 cannot finish alone:** every facility's day-pass capacity is empty, because no capacity has been agreed (C2). The field is there; the number is yours. The same is true of how many sofa beds there are (N8) — the field is on the Extras tab now, and one number turns the availability rule on.

---

## G. Built-in guarantees (system-wide)

| # | Capability |
|---|---|
| G1 | **Double booking is structurally impossible** — enforced by the database itself, not by staff vigilance or an approval step |
| G2 | Identity documents are stored encrypted, in private storage, and can only be viewed by roles explicitly granted access — Security and Housekeeping have none by default |
| G3 | Every access to an identity document is logged: who viewed which document, and when |
| G4 | Documents are kept under a configurable retention policy and deleted automatically when it expires — replacing indefinite accumulation, in line with Brunei's Personal Data Protection Order 2025 |
| G5 | The accounting record pack (transfer slip + IC + confirmation + itemised booking) is generated automatically per booking — no more manual PDF assembly |
| G6 | Automatic daily backups, with a restore procedure tested before go-live |
| G7 | Errors are monitored and reported automatically, so problems announce themselves |

**G2, G3 and G4 as delivered, with B10.** Documents are real throughout: a guest's IC on the booking, a transfer slip on a payment (**B4**), and photographs on an inspection (**C2**). All three sit in private storage that nothing on the public internet can reach, are opened only through a link that expires after a minute, and are deleted automatically when their period ends — twelve months after checkout for identity documents, seven years for slips, two years for photographs. Those periods are settings, not code.

Four things worth saying plainly, because they are what the guarantees actually mean in daily use:

- **Seeing that a document exists and being able to open it are different permissions.** Anyone who can view a booking can see that the IC was collected and when. Only Admin and Front Office can open it. Security and Housekeeping have no access to the file at all, as promised.
- **Every opening is recorded on the booking's own history** — who opened which document and when — so G3 is something you can read rather than something you are told about.
- **When a document is deleted, the record that it existed stays.** The file is destroyed; the trail of who attached it and who ever opened it survives, because those are the questions asked *after* a document is gone.
- **A file is checked for what it actually is**, not what it is named. A document renamed to look like a photograph is stored as what it really is, or refused.

**G5 as delivered.** Every booking with a verified payment carries an accounting pack — one PDF with the itemised booking, the record of who confirmed each payment and what they saw in the bank, the transfer slip copied in, and the record of the guest's identity document — assembled by the system the moment a payment is verified, and rebuilt overnight whenever a slip or IC is attached later, a payment is confirmed, or the booking changes. It sits on the booking beside the payments, opens like any other document, and is kept for seven years. Two things worth saying plainly:

- **The IC is referenced in the pack, not copied into it.** The pack records that the IC was collected, when and by whom. It does not carry the image, because the pack is kept seven years and can be opened by every role that can view a booking, while the IC itself is kept twelve months and opened only by Admin and Front Office. Copying it in would quietly undo both of those promises. You confirmed that the accountant does **not** need the image in the pack.
- **An earlier version of a pack is never lost.** When a pack is rebuilt, the previous one is recorded as replaced on the booking's history, so what was sent to the accountant last month remains answerable.

**Customers can upload their own documents (A6, A7)**, and staff keep the control they have, for the guest who sends them over WhatsApp anyway. Everything in the G-series applies unchanged: the same private storage, the same permission to open an identity document, the same access log, the same retention clock. A6 and A7 change who may put a file *in*, never who may take one out.

**One question for you:** what should happen to a guest's identity document when their booking is **cancelled**? It follows the same twelve-month clock counted from the stay they never took. You may want it destroyed sooner. See the register.

---

## Delivery phases

The quoted delivery covers Phases 1 and 2.

**Phase 1 — Operations portal first.** The staff-facing system: unit registry, pricing, availability, booking management, payment verification, cash recording, deposits and inspections, document storage, accounting packs, roles, and reporting. The spreadsheet is the acute pain, so it is replaced first — the business is materially better off within weeks, before anything is exposed publicly.

**Phase 2 — Customer-facing.** The public booking site (day passes and short stays, payment instructions, slip upload), QR issue and delivery, the security check-in screen, the housekeeping checkout screen, and the FAQ.

---

## Not included in this delivery

These exclusions are deliberate. Each is either not needed on day one or depends on an external step. All are natural later additions — the system is designed so none of them requires rework.

| # | Excluded | Notes |
|---|---|---|
| X1 | Online card payments | Requires Baiduri / BIBD merchant onboarding. The payment layer is built so a gateway plugs in later without changing booking logic. |
| X2 | Automated bank statement matching | The unique payment reference on every booking is the groundwork; a statement-import matcher is a later addition that reduces the manual queue to exceptions only. |
| X3 | WhatsApp Business API integration | Confirmations and QR codes are delivered by email plus a forwardable image for WhatsApp, which works from day one. |
| X4 | Native iOS / Android apps | The field screens are mobile web — nothing to install, nothing to update. |
| X5 | Full long-term tenancy management | Rent collection workflow, agreements, e-signing, renewals. Units can be marked leased long-term so availability stays correct; a thin tenancy module (tenancy records, per-month rent tracking, agreement files) is a defined Phase 3 extension. |
| X6 | Channel / OTA sync (Airbnb, Booking.com) | Not part of the current sales model. |
| X7 | Events and party bookings as a self-service product | Can be handled as manual bookings in the portal; a dedicated product is a later decision. |
| X8 | Smart locks / automated gate control | Physical access remains as-is; the system tells Security who to expect. |
| X9 | Multi-property administration screens | The data layer supports additional properties from day one; the management UI for it is built when a second property is real. |
| X10 | Migration of historical documents | The system holds data from go-live onward. The existing folder of accumulated documents stays outside the system. |
| X11 | Part payments — a guest *choosing* to pay part of the **stay** now and the rest later | Not in the quoted delivery (N16). **Read this against B16:** a guest pays the BND 100 security deposit to secure a booking and the stay on arrival, which is not part payment — the deposit is a separate refundable amount and the stay is still settled in full, in one go. What remains out is a guest choosing to split the stay itself, say BND 200 of a BND 400 booking. **Nor is B16's deposit top-up part payment:** the product does not *offer* anybody a deposit in instalments; it copes with money that arrived short of what was asked for, and refuses to confirm the booking until the deposit is whole. **Note the distinction from B13:** the system can track an outstanding balance, because an amendment can leave one. What it does not do is let a guest opt into instalments. |

---

## Details to confirm together

None of these block the delivery; each settles how a particular screen behaves.

1. Number of 2-bedroom units, and confirmation of the total unit count (N1). A setting rather than a build step (F6), so it can be answered on the day the system is handed over.
2. Whether stated max occupancy is a hard cap, or the point above which the extra-person charge applies (N2).
3. Pricing under age 1 for a day pass (N3). **The age boundary is settled:** 1 to 11 pay the child rate, 12 and above the adult rate.
4. ~~Family bundle pricing for other family shapes.~~ **Answered:** a bundle applies as many times as it fits, and anyone left over pays per person.
5. ~~Which payment is forfeited on cancellation or no-show.~~ **Answered:** the BND 100 security deposit is kept, and a booking payment is refunded.
6. ~~Standard check-in time.~~ **Answered:** 14:00, with check-out at 12:00. Whether early check-in is sold, and on what rule, is still open (N31).
7. ~~How long an unpaid booking holds a unit.~~ **Answered:** indefinitely, until somebody checks the payment (N7).
8. Total sofa beds available across the property (N8).
9. Whether guests may choose a bed configuration, or staff assign it (N9).
10. Whether a staff discount needs a ceiling, or a second person's approval above some figure (N17). It is currently uncapped and fully recorded rather than gated.
11. Whether part payments should be possible at all (N16) — see X11 above.
12. ~~What the office needs to tell housekeeping about a guest.~~ **Built:** the cleaner's phone shows the notes the office marks for housekeeping, and the unit's own note (N18).

---

*This document describes functional scope only. Pricing, timeline, and commercial terms are covered in the accompanying proposal.*
