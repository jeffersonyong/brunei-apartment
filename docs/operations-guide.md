# Palm Villa operations guide

**Current as of 19 September 2026.** This guide describes the Palm Villa booking and operations system exactly as it works on that date. If a screen looks different from what is described here, the system has changed since, and the person who looks after the system (Jefferson) should be asked.

## How this guide is organised

1. **Introduction** (this part): what the system is, who uses it, where things are, and the few big rules that explain most of what it does.
2. **Creating bookings**: the New booking screen, how prices are worked out, the security deposit, holds and double booking.
3. **The booking's own page**: every booking status, checking in and out from the office, cancelling, no-shows, notes, history, identity documents, the entry QR code and the accounting pack.
4. **Finding and changing bookings**: the Dashboard, All bookings, the Calendar, search, notifications, and editing a booking.
5. **Payments**: the Verification queue, cash payments, the security deposit on a booking, balances and short deposits.
6. **Deposits, reports and finance**: what happens to the deposit after check-out, reports, the daily cash-up, accounting packs and spreadsheet downloads.
7. **Field screens**: the phone screens for the guard at the gate (who is also the front desk) and for housekeeping.
8. **Units, the unit registry and property settings**: the Units board, leases, out of service, prices and every other setting.
9. **Staff access and administration**: signing in, passwords, roles and permissions, the audit log, and the website settings (photos, FAQs, privacy policy).
10. **The customer side**: the public website and every email the system sends.
11. **End-to-end journeys**: how the pieces fit together from first booking to deposit returned.
12. **Things not settled yet**: questions the business has not answered, and what the system does in the meantime.
13. **Glossary**.

# 1. Introduction

## What the system is

Palm Villa is an apartment building in Brunei with three kinds of business:

- **Short stays**: a guest books an apartment for one or more nights.
- **Day passes**: a visitor pays to use the facilities (such as the pool and the playroom) for a day, without staying.
- **Long-term leases**: a unit let to a tenant for months. The system only records that a unit is leased and for which dates, so it cannot be sold; rent is not tracked in the system.

The system replaces WhatsApp and the Excel sheet as the one place bookings, payments and deposits are recorded. It has three parts, all in one system over one set of records:

| Part | Who uses it | Web address |
|---|---|---|
| **The public website** | Customers. They check what is free, book a stay or a day pass, send their IC and transfer slip, and find their booking again. | **bruneiapartment.com** |
| **The portal** | Office staff, on a computer (it also works on a phone). Every booking, payment, deposit, unit, report and setting. | **portal.bruneiapartment.com** |
| **The field screens** | The guard at the gate, on a phone: the **Gate** screen. Housekeeping, on a phone: the **Departures** screen. | **portal.bruneiapartment.com/field** |

Staff sign in at **portal.bruneiapartment.com**. Customers never sign in; they reach their booking through a private link in their email, or through **Find your booking** on the website.

## Who does what

Everyone who uses the portal or the field screens has their own account. What a person can do depends on the **roles** they hold. An Admin can give a person more than one role, change what each role is allowed to do, and add or disable accounts in **Admin → Roles & staff**. The five roles, as set up by default:

| Role | Who it is for | What they can do by default |
|---|---|---|
| **Admin** | The owner and whoever runs the system | Everything, including settings, roles, the audit log, identity documents and exporting all data. |
| **Front Office** | The office / reservations team | Create, edit and cancel bookings; give discounts; waive a deposit at booking; check guests in and out; admit day passes; record cash; verify bank transfers; raise charges against a deposit; manage units and leases; view identity documents. |
| **Security** | The guard. **The guard is also the front desk**: they hand over the keys and take them back. | See bookings; check stays in and out; admit day passes; take cash at the gate (deposit, stay or day pass). They **cannot** confirm that a bank transfer arrived, cannot create or change a booking (the screen says to call the office), and cannot open identity documents. |
| **Housekeeping** | Cleaners | See bookings; mark a guest as left when a unit is found empty with the keys in it; record the inspection after check-out, with photos; mark a unit ready; take a unit out of service. |
| **Finance** | The accountant / finance team | See bookings; verify bank transfers; waive charges; approve a deposit release; view reports and the daily cash-up. |

These are defaults. If a person's screen doesn't match this table, an Admin may have changed their roles. Section 9, *Staff access and administration*, lists every permission and what it allows.

**Where each person lands after signing in:** office roles land on the portal **Dashboard**. A guard lands straight on the **Gate** screen, and a cleaner straight on the **Departures** screen. Someone with both field jobs gets a chooser.

## Where things are in the portal

The portal's left-hand menu (on a phone, the menu button at the top) is grouped like this:

- **Overview**: **Dashboard**, today's arrivals, departures and figures.
- **Bookings**: **All bookings** (the register), **Calendar**, **New booking**.
- **Payments**: **Verification queue** (bank transfers to check), **Cash payments**.
- **Property**: **Units** (the board of every unit and what it is doing).
- **Finance**: **Deposits**, **Reports**, **Daily cash-up**.
- **Admin**: **Property settings**, **Unit registry**, **Website settings**, **Roles & staff**, **Audit log**.
- **Others**: **Settings** (your own account), **Public site**, **Field screens**.

Everyone sees the whole menu. Opening a screen you are not allowed to use shows a "You don't have access to this screen" card naming the permission it needs; nothing on it can be seen or changed. At the top of every portal screen are **search** (find a booking by its reference, the guest's name or phone, or the unit, or jump to a screen), and the **notifications** bell. Just left of the search box, past a thin divider, is **Ask anything** in violet-blue, with a four-pointed star (on a phone only the star shows).

**Ask anything** opens the help desk: the ChatGPT project that answers questions from this guide. The button opens it in a new tab, so the screen you are asking about stays open. It is only on the portal, not on the Gate or Departures phone screens, and it needs a ChatGPT account. It can't see or change anything in the system: describe what you see, or paste the message on screen.

## The big rules

Most questions about why the system did something come back to one of these.

1. **The security deposit secures a stay.** A stay booking is confirmed when its security deposit (BND 100 by default) is held **in full**. A deposit that arrives short secures nothing: the booking stays **Awaiting payment** (unconfirmed, the unit still held) and the guest cannot be checked in until it is topped up. The stay itself can be paid when booking or on arrival. A day pass has no deposit and is confirmed when it is paid.
2. **A hold never runs out.** A booking that has not been paid keeps its unit blocked until someone confirms the money or cancels the booking. Nothing expires on its own, so unpaid bookings have to be cancelled by the office.
3. **Double booking is impossible.** The system itself refuses a second booking for the same unit on the same night, even if two people book at the same moment.
4. **The guard takes cash but never says a transfer landed.** Only people who can check the bank (Front Office, Finance, Admin) can confirm a bank transfer. Check-in refuses a stay whose deposit is not held; admitting refuses a day pass that is not paid in full; nothing at the gate creates or edits a booking.
5. **Closed bookings are final.** Completed, Cancelled and No show bookings cannot be reopened or edited. A guest who comes back needs a new booking.
6. **Nothing is quietly deleted.** Payments, bankings and approvals cannot be edited away; mistakes are corrected with a new entry, and every important action is recorded in the booking's history and the audit log with who did it and when.
7. **Prices come from Property settings.** Changing a rate does not change bookings already made, but editing a booking reprices it at the current rates.
8. **Customers get two emails at most.** The **Booking email** (with payment instructions) goes only to customers who book on the website. The **Confirmation email** (with the entry QR code) goes when a booking becomes confirmed because its money was taken or checked, whether it was booked online or at the desk. Nothing is sent when staff create a booking, so **a desk booking paid in cash on the spot gets no email at all**. Nothing is sent either when a booking is edited, cancelled, checked in or checked out. See *The customer side*.
9. **Day passes are sold on the website only.** Staff cannot create a day pass in the portal.
10. **"Today" is Brunei time.** Every date in the system (arrivals, departures, the cash-up day) is the date in Brunei.

## When something goes wrong

- **A message beside a field or at the top of a form** is the system refusing something on purpose. Each section of this guide quotes those messages and says what to do.
- **A full-page "This page didn't load"** means something failed that the screen had no message for (for example, a permission was taken away while the page was open, or a unit went out of service at that moment). The action was not carried out. Press **Try again**; if it keeps happening, note the booking reference and the time and tell Jefferson.
- **Questions about the system** (how a screen works, something that looks broken) go to **Jefferson**. **Questions about policy** (whether to waive a fee, give a refund, bend a rule) go to **Jason**. This guide explains how the system works; it doesn't make policy.

---

# 2. Creating bookings

## What this area is for

This section covers how a new booking comes into existence and what it costs: the portal's **New booking** screen, the prices the system works out (stays, day passes, family bundles, extra guests, extras, late check-out, discounts), the security deposit and waiving it, how units are found free, holds, how double booking is prevented, booking references, and the three ways a desk booking can be paid when it is made (cash, bank transfer, or "at the gate").

- **Where it is:** portal (portal.bruneiapartment.com) → sidebar **Bookings → New booking**. There is also a **New booking** button at the top of **All bookings**, the **Dashboard**, and the **Calendar**. On the Calendar you can also pick nights on a unit's row, which opens a small dialog **Start this booking?** ("Nothing is held yet. The next screen takes the guest and the payment.") with **Continue**, which opens New booking with those dates, that unit type and that unit already chosen (the Calendar itself is covered in *Finding and changing bookings*).
- **Who uses it:** Front Office and Admin by default. The guard cannot make a booking — when a guest is waiting at the barrier he calls the office, and the office books them here.
- **What it replaces:** checking availability in the spreadsheet, working out the price by hand, and writing the booking into Excel and WhatsApp.

**What New booking makes, and what it does not:**

- It makes **short stays only** — a guest staying in a unit for one or more nights.
- It **cannot make a day pass.** There is no day-pass form anywhere in the portal or the field screens. A day pass is only booked on the public website's day-pass page (bruneiapartment.com). How a day pass is priced is explained below in *How a day pass is priced*; the customer's booking steps are in *The customer side*.
- It **does not make long-term tenancies.** Letting a unit long-term is done from the unit's own page (**Mark leased** and related actions), not as a booking — see *Units and property settings*. A leased unit simply stops showing as free on New booking for the lease's dates.

## Screens

### New booking — before dates are chosen

**Who can open it:** anyone signed in to the portal can open the screen from the sidebar, but only staff with the **Create bookings** permission (Front Office and Admin by default; an Admin can change who holds it in **Roles & staff**) can actually create a booking from it. Someone without that permission who fills the form in and presses the button gets the error screen "This page didn't load" (see *If you see an error* below).

What is on it:

- Page title **New booking**, with the line: "The security deposit is taken as the booking is made — it is what secures it. Say whether the guest is paying the stay with it, or settling that on arrival."
- A grey panel: "Choose check-in and check-out dates to see what is free. Check-out must be at least one night after check-in, and bookings open up to 62 days ahead." (The number of days is whatever is set in Property settings; 62 is the default.)
- A **Stay** field. It is one control for both dates: click it, click the arrival day, then click the **check-out morning** (the day the guest leaves, not their last night). The footer of the calendar says "Pick the arrival, then the check-out morning", then "— now pick the check-out morning" after the first click, then the dates and "· N nights, out on …". The field opens set to tonight (check-in today, check-out tomorrow). Days before today cannot be picked, and the latest check-out that can be picked is one day after the end of the booking window (by default 63 days from today).
- A **Check availability** button. Nothing happens until you press it — the dates are only used once you do.

### New booking — after pressing Check availability

Once dates are chosen, the screen shows:

**Availability tiles** — one per unit type (for example 2-bedroom, 3-bedroom, 4-bedroom, Semi-detached), each reading "**N** of **M** free". M counts only units that are in service; a unit marked out of service is not counted at all. A type the building has no units of shows "0 of 0 free".

If nothing at all is free, the screen shows "Nothing free for those dates. Try different dates." and no form.

Otherwise the booking form appears, on the left, with a **Booking summary** card on the right.

**The form, section by section:**

1. **Unit**
   - **Unit type** — "Any type" or one type. Each option shows the type's nightly rate, e.g. "3-bedroom — BND 200.00". Changing it narrows the unit list straight away and re-prices; it does not clear anything you have typed.
   - The unit list, labelled "**N free for these dates**" (or "N free for these dates in this type" when a type is chosen). Each unit shows as "unit reference — type", in unit-reference order. The form opens on the first free unit, or on the unit the Calendar sent you with.
   - If the chosen type has nothing free: "Nothing of this type is free for these dates. Choose another type, or change the dates above."
2. **Guests**
   - **Over 3** (at least 1; opens at 2) and **Aged 3 and under** (opens at 0). The age comes from Property settings; 3 is the default.
   - Note under them: "Guests aged 3 and under are not counted towards occupancy."
3. **Extras**
   - One counter per extra that is currently on sale (the list staff keep in Property settings → Extras; by default just **Sofa bed**). Under each counter: its price, e.g. "BND 28.00", then — only if a stock count has been entered — "N free" or "none free" for these nights. An extra that has been switched off or retired does not appear.
   - **Late check-out, hours**.
   - Note: "Check-in 14:00, check-out 12:00. Early check-in is not sold here: it depends on the unit being ready, so agree it with the guest on the day." (Times from Property settings.)
4. **Discount** — only shown to staff with **Discount bookings** (Front Office and Admin by default). A **Type** list: **No discount**, **Amount off, in BND**, **Percentage off**. With "No discount" it says "The booking is priced from the rate card. Choose a type above to take something off it." Choosing a type shows **Amount, BND** (or **Percentage**) and **Reason**, with the note "Required, and kept on the booking's record — the guest never sees it. Up to 280 characters."
5. **Guest** — **Name**, **Phone**, **Email**, all required. Phone has a country-code button that starts on +673 (Brunei); type the number without the country code, or press the code to pick another country (searchable). Under the fields: "The booking confirmation and the entry QR code are sent here." (Read *What happens next* in *How to create a stay booking* — creating the booking on this screen does not itself send an email.)
6. **Vehicles** — a **Registration** box (e.g. "BAA 1234"), typed letters show in capitals. **Add another vehicle** adds a row (up to 10). An **×** removes a row when there is more than one. Under the rows: "The 3-bedroom includes 2 parking spaces." (from the unit type's setting). If more cars are entered than the unit type includes, a warning replaces it: "The 3-bedroom includes 2 parking spaces. The extra car is still recorded so Security can match it at the gate, but it may not have a bay." — this is a warning only; the booking is not refused. At the bottom: a tick box **Arriving without a vehicle** — "Only for the rare guest with no car. Security check arrivals by registration, so a booking with neither a plate nor this box ticked cannot be matched at the gate." Ticking it greys out the registration boxes and anything typed in them is not saved.
7. **Payment**
   - **Paying now** (hidden when the method is "At the gate"):
     - When a deposit is being taken: a list with **Deposit only — BND 100.00** and **Deposit and the stay — BND …** (the second is the default). The caption says either "The deposit secures the booking. The stay is settled when the guest arrives." or "Nothing is owed on arrival."
     - When no deposit is being taken (waived, or the deposit is set to zero in settings): no choice, just "The stay — BND …" and "No deposit is quoted, so the stay is what secures the booking."
   - **Method**: **Cash — counted now**, **Bank transfer — verify later**, and — only when check-in is today and the deposit is not waived — **At the gate — the guard takes it**. The caption under it explains the choice: "Counted now, so the booking is confirmed as soon as it is created." / "The guest quotes the booking reference in the transfer. The booking waits in the verification queue until someone checks the bank." / "For the guest waiting at the gate. Nothing is taken now: the guard takes it when they drive up."
8. **Security deposit** — only shown to staff with **Waive the security deposit** (Front Office and Admin by default). A tick box **Waive the security deposit** with the note "BND 100.00, which secures the booking and is held until the unit has been inspected." See *How to waive the security deposit at booking*.

**The Booking summary card (right-hand side, stays in view as you scroll):**

- The dates ("Fri 18 Sept → Sun 20 Sept"), then "N nights · unit reference · N guests".
- The price lines, each with its amount, then **Total** in large figures. The total is **the stay only** — the security deposit is never inside it.
- When a deposit is being taken and the method is not "At the gate", a block headed **Taking now** (cash) or **Awaiting by transfer** (transfer), listing **Stay** (only when the stay is being paid now) and **Security deposit — refundable**, adding up to **To collect** (cash) or **To confirm** (transfer). This is the money crossing the counter today.
- A blue note where it matters:
  - At the gate: "Nothing is taken now. When the guest arrives, the guard takes the BND 100.00 deposit, then the BND … for the stay — and the deposit is what confirms the booking."
  - Deposit waived: "No security deposit — waived on this booking. Nothing is held against the stay, so the stay is paid now."
  - Deposit only: "Deposit only. The BND … for the stay is settled when the guest arrives."
- If the price cannot be worked out, a grey note says why instead of the lines (for example "Choose a unit to see the price.", "Nothing of this unit type is free for these dates.", or a pricing rule such as "Bookings open up to 62 days ahead." — see *If you see an error*).
- The button, which always states what will happen:
  - "**Create & take BND …**" — cash; the figure is exactly what you should be handed now.
  - "**Create & await BND …**" — bank transfer; the figure the guest should transfer.
  - "**Create & hold for the gate**" — at the gate.
  - "**Create booking**", greyed out — no price yet (no unit, or a pricing problem).
  - "**Creating…**" while it saves.
- Any error from saving appears in red under the button.

### The confirmation screen

After a successful save the whole screen is replaced by a confirmation (it is not a separate page — if you leave it, open the booking from All bookings instead). It shows:

- A title and badge:
  - **Booking confirmed** with a green **Confirmed** badge — cash. "Give the guest this reference — it is what they quote at the gate."
  - **Booking created** with an amber **Awaiting payment** badge — bank transfer. "The guest quotes this reference in the transfer description — it is how the payment is matched, and what they quote at the gate."
  - **Booking held** with a grey **Held** badge — at the gate. "Give the guest this reference. The guard takes the deposit and the stay when they reach the gate."
- **Reference** in large letters, e.g. **PV-4823**.
- **Unit**, **Dates** (with the number of nights), **Security deposit** and **Stay**, each saying what happened to that money: "BND 100.00 held" / "awaited" / "at the gate", "Waived", or "None quoted"; and for the stay "BND … paid" / "awaited" / "on arrival" / "at the gate".
- Notes:
  - At the gate: "The unit is held with nothing taken. The booking is on the guard's list now, and it is confirmed once he takes the deposit. If the guest never arrives, cancel it — nothing releases the unit on its own."
  - Transfer: "The unit is held for this booking now. It stays held until someone confirms the transfer landed, so this booking needs working off the verification queue." When both the deposit and the stay are being transferred it adds: "The deposit and the stay are two rows there — confirm each at its own figure, from the one transfer."
  - Deposit only (cash or transfer): "The BND … for the stay is settled when the guest arrives. Record it from the booking then — the deposit is already in." (For a transfer the deposit is not actually in yet — it is awaited until verified.)
- Buttons: **Add another booking** (a fresh New booking screen, with up-to-date availability), **View booking** (the booking's own page), and for a transfer **Open the verification queue**.

## How to …

### How to check which units are free for some dates

**Who can do this:** anyone who can open the portal. (Creating the booking afterwards needs **Create bookings** — Front Office and Admin by default; an Admin can change this.)
**Where:** Bookings → New booking → **Stay** field → **Check availability**.
**Steps:**
1. Click **Stay**, click the arrival day, then click the morning the guest leaves.
2. Press **Check availability**.
3. Read the tiles ("N of M free" per unit type), or use **Unit type** in the form to narrow the unit list.

**What happens next:** nothing is held or reserved by looking. A unit is only taken when a booking is created.

**Edge cases and limits:**
- A unit counts as free when no live booking or lease overlaps any night of the stay. A guest checking out on the morning your guest arrives does **not** block it — check-out day is not a night.
- These do block a unit: any booking that is **Held**, **Awaiting payment**, **Confirmed** or **Checked in** over those nights (including an online booking whose transfer nobody has checked yet, and a booking held "at the gate"); a long-term lease over those dates (an open-ended lease blocks every date from its start); and being **out of service** (out-of-service units are not listed at all).
- Only three statuses free a unit: **Cancelled**, **Expired** and **No show**. A **Completed** booking still counts for all the nights it was booked for. That only matters when a guest was checked out before their booked check-out date: the unit then stays blocked on New booking for the remaining booked nights, and a checked-in or completed booking cannot be amended to shorten it. If you need to sell those nights, ask Jefferson.
- Whether a unit has been cleaned or inspected is **not** checked here — New booking will offer a unit that is still being turned over. Readiness is shown on the Units board and the guard's screen.
- The dates in the form are the ones you last pressed **Check availability** for, shown in the Booking summary heading. If you change the **Stay** field and do not press **Check availability**, the form below is still for the old dates. Always check the summary heading before you create.
- The list is a snapshot from when the page loaded. Someone else (or a customer online) can take a unit a moment later; the system still refuses the second booking (see *Double booking*).

### How to create a stay booking

**Who can do this:** Front Office and Admin by default (permission **Create bookings**). An Admin can change who holds it in **Roles & staff**. Security, Housekeeping and Finance cannot by default.
**Where:** Bookings → New booking.
**Steps:**
1. Pick the dates in **Stay** and press **Check availability**.
2. Under **Unit**, choose a **Unit type** if you want to narrow the list, then choose the unit.
3. Enter the guests: **Over 3** and **Aged 3 and under**.
4. Add any extras (e.g. **Sofa bed**) and **Late check-out, hours** if agreed.
5. If giving a discount, fill in **Discount** (see *How to give a discount*).
6. Enter the guest's **Name**, **Phone** and **Email**.
7. Enter every vehicle registration, or tick **Arriving without a vehicle**.
8. Under **Payment**, choose **Paying now** (deposit only, or deposit and the stay) and the **Method**.
9. If the deposit should not be taken, tick **Waive the security deposit** (see that task).
10. Check the **Booking summary** and the figure on the button. For cash, take exactly that figure from the guest.
11. Press the button. Read the reference to the guest from the confirmation screen.

**What happens next:**

| You chose | Status the booking gets | Money recorded |
|---|---|---|
| Cash, deposit and the stay | **Confirmed** | Deposit held in cash; stay paid in cash |
| Cash, deposit only | **Confirmed** | Deposit held in cash; the stay is owed on arrival |
| Cash, deposit waived (or no deposit set) | **Confirmed** | Stay paid in cash |
| Bank transfer, deposit and the stay | **Awaiting payment** | Deposit transfer awaited and stay transfer awaited — two rows in the Verification queue |
| Bank transfer, deposit only | **Awaiting payment** | Deposit transfer awaited — one row in the Verification queue; stay owed on arrival |
| Bank transfer, deposit waived | **Awaiting payment** | Stay transfer awaited — one row in the Verification queue |
| At the gate | **Held** | Nothing |

- Cash taken here is recorded under your name, with the time, and counts in that day's **Daily cash-up** (see *Deposits, reports and finance*).
- A **bank transfer** booking holds the unit straight away and keeps holding it until someone verifies the transfer in the **Verification queue** or cancels the booking. Verifying the deposit is what confirms it (see *Payments*).
- An **at-the-gate** booking goes onto the guard's arrivals list. It becomes Confirmed when the guard takes the deposit in cash (see *Field screens*).
- The booking appears at once in **All bookings**, on the **Calendar**, on the **Dashboard** counters and, for today's arrivals, on the guard's gate screen.
- **Emails:** creating a booking on New booking **does not send the guest any email.** The "booking confirmed" email (which carries the entry QR code) is sent later, only when a payment or deposit that confirms the booking is recorded or verified — for example when the transfer is verified in the Verification queue, or when the guard takes the deposit at the gate. A booking that is **confirmed on the spot in cash never gets an automatic email.** For those guests, give them the reference, and if they need the entry QR code, download it from the booking's page (**Download image**) and send it by WhatsApp — see *The booking's own page*. The "booking created" email with the bank details is only sent for bookings the customer makes online. The full list of emails is in *The customer side*.
- The booking's **history** records who created it and how: "Created — walk-in, paid on the spot" (cash, and also — misleadingly — for an at-the-gate booking where nothing was taken) or "Created — walk-in, paying by transfer"; plus "Security deposit collected — BND 100.00, in cash" or "Security deposit transfer awaited — BND 100.00", "Cash recorded" or "Bank transfer awaited" for the stay, "Discount applied" if discounted, and "Security deposit waived" if waived. These entries are also in the **Audit log**.
- The entry QR code is created automatically at the moment the booking becomes Confirmed.

**Edge cases and limits:**
- Every booking made here is a short stay in one unit. For two units, make two bookings.
- Each booking creates a new guest record, even for a returning guest. The system does not match or merge returning guests.
- The price is re-worked on the server when you press the button, using the rates in Property settings at that moment. What you saw on screen is what is charged unless a rate was changed in between.
- A booking already made keeps its price even if the rates in Property settings change later. Only a new booking or an amendment uses the new rates.
- The latest check-out the Stay field allows is one day past the booking window (63 days from today by default). A stay longer than that cannot be booked here.
- There is no ID/IC capture on this form. Identity documents are added on the booking's page (see *The booking's own page*).

**Can it be undone?** A booking can never be deleted. To undo one made by mistake, **cancel** it from its own page (see *The booking's own page* — cancelling decides what happens to any deposit already taken). To correct details (dates, unit, guests, extras, name, phone, discount), use **Amend** (see *Finding and changing bookings*). **The email address cannot be changed after creation** — no screen edits it — so check it with the guest before pressing the button.

**If you see an error:** see the full list under *If you see an error* at the end of the next task.

### How to take a booking for a guest waiting at the gate ("At the gate")

**Who can do this:** Front Office and Admin by default (**Create bookings**); an Admin can change this. The guard cannot — he calls the office.
**Where:** Bookings → New booking → Payment → **Method** → **At the gate — the guard takes it**.
**Steps:**
1. Book as usual with check-in **today**.
2. Under **Method**, choose **At the gate — the guard takes it**. The **Paying now** question disappears.
3. Press **Create & hold for the gate**.
4. Tell the guard the reference (and the guest, if on the phone).

**What happens next:** the booking is **Held** with nothing taken. It appears on the guard's arrivals list. When the guest drives up, the guard takes the deposit first (which confirms the booking) and then the stay, in cash, under his own name (see *Field screens*). The confirmed email with the QR code goes out when the guard's deposit confirms it.

**Edge cases and limits:**
- Only offered when check-in is **today** (Brunei time). For a later date the option does not appear — take the deposit instead.
- Not allowed together with a waived deposit. If you tick **Waive the security deposit** after choosing At the gate, the method quietly switches back to **Cash — counted now**. Check the method before pressing the button.
- **Nothing ever releases a held booking on its own.** If the guest never arrives, someone must **cancel** it or the unit stays blocked. A held booking cannot be marked a no-show, because it was never confirmed.
- If the form was opened before midnight and saved after, the server refuses it (see errors).

### How to take an advance booking secured by the deposit (guest pays the stay on arrival)

**Who can do this:** Front Office and Admin by default (**Create bookings**); an Admin can change this.
**Where:** Bookings → New booking → Payment → **Paying now** → **Deposit only — BND 100.00**.
**Steps:**
1. Fill in the booking.
2. Under **Paying now**, choose **Deposit only**.
3. Under **Method**, choose **Cash** if the guest is handing you the BND 100 now, or **Bank transfer** if they will transfer it.
4. Press **Create & take BND 100.00** or **Create & await BND 100.00**.

**What happens next:** with cash the booking is **Confirmed** at once; with a transfer it is **Awaiting payment** until the deposit transfer is verified in the Verification queue. Either way the stay's full price is owed on arrival and is recorded from the booking's page when the guest pays (see *Payments*).

**Edge cases and limits:** "Deposit only" is only offered when a deposit is being taken. With a waived deposit, the stay itself must be paid (or transferred) now.

### How to give a discount

**Who can do this:** Front Office and Admin by default (permission **Discount bookings**); an Admin can change this. Staff without it do not see the Discount section at all.
**Where:** Bookings → New booking → **Discount**.
**Steps:**
1. Under **Type**, choose **Amount off, in BND** or **Percentage off**.
2. Enter the figure: an amount like **40** or **40.00** (no "BND", at most two decimals; a thousands comma such as **1,000.00** is fine), or a whole percentage from **1** to **100** (no "%" sign, no decimals).
3. Enter a **Reason** (required, up to 280 characters). The guest never sees it.
4. Check the new total in the Booking summary. A discount shows as its own line, "Discount — 10%" or "Discount", with a minus amount.

**What happens next:** the discount is saved on the booking with your name and reason, and the history shows "Discount applied". It is also in the **Audit log**.

**Edge cases and limits:**
- A percentage is taken off everything priced — nights, extra guests, extras and late check-out — and rounded to the nearest cent.
- The **security deposit is never discounted.**
- A discount can be anything up to the full price of the stay. 100% (a free stay) is allowed. There is no ceiling and no second sign-off. Whether there should be is not settled yet — ask Jefferson/Jason.
- Changing the **Type** clears the figure you typed.
- While typing, a figure the system cannot read is simply left out of the preview (the summary shows the full price); the error appears when you press the button.
- Changing or removing a discount later is done through **Amend** (see *Finding and changing bookings*). A percentage discount is re-worked if the stay's price changes; an amount discount stays the same amount.

**If you see an error:**
- "Enter a whole percentage between 1 and 100." — the percentage was blank, had a decimal or a % sign, or was out of range.
- "Enter an amount like 40.00." — the amount was blank, zero, or not a plain number.
- "Say why this booking is being discounted." — the reason is empty.
- "Keep the reason under 280 characters." — shorten the reason.
- "A discount cannot be more than the booking is worth." (in the summary card; the button is greyed out) — the amount is bigger than the stay's price. Lower it.
- "Choose a discount type." — rare; reload the page.

### How to waive the security deposit at booking

**Who can do this:** Front Office and Admin by default (permission **Waive the security deposit**); an Admin can change this. Staff without it do not see the Security deposit section.
**Where:** Bookings → New booking → **Security deposit** (last section) → **Waive the security deposit**.
**When to use it:** when a deposit is already held for this guest under another booking — the normal case is a guest extending their stay (see *Likely questions*) — or when the owner has agreed.
**Steps:**
1. Tick **Waive the security deposit**. A dialog opens: **Waive the BND 100.00 security deposit?** — "No deposit will be held against this stay. Waive it only when a deposit is already held under another booking, or the owner has agreed."
2. In **Why — and which booking holds the deposit**, type the reason, e.g. "Extends PV-1234 — the deposit is already held on that booking" (up to 280 characters). The reason is recorded in the booking's history with your name; the guest never sees it.
3. Press **Waive the deposit** (it stays greyed out until something is typed). **Keep the deposit**, closing the dialog, or pressing Escape leaves the box unticked.
4. The box now reads "Waived — "your reason"". Finish the booking.

**What happens next:** the booking carries no deposit. The stay must be paid now (cash) or transferred (bank transfer) — "Deposit only" and "At the gate" are no longer offered. The summary shows "No security deposit — waived on this booking. Nothing is held against the stay, so the stay is paid now." The confirmation shows **Security deposit: Waived**. The history shows "Security deposit waived", with the BND 100 that was not taken and the reason. At check-in no deposit is asked for.

**Edge cases and limits:**
- To change the reason before saving, untick and tick again.
- **A waiver can only be given when the booking is created.** No screen waives the deposit on an existing booking, and no screen puts a waived deposit back. If you forgot to tick it, or ticked it by mistake, there is no button to fix it — ask Jefferson/Jason what the office should do.
- Not allowed with "At the gate".

**If you see an error:**
- "Say why no deposit is being taken — for instance, which booking already holds one." — the reason was empty.
- "Keep the reason under 280 characters." — shorten it.
- "A booking with its deposit waived cannot be paid at the gate." — choose Cash or Bank transfer.

### If you see an error (New booking)

Messages shown beside a field, with "Check the highlighted fields." under the button:

- "Choose a unit." — no unit selected. Pick one under **Unit**.
- "Enter the guest name." — Name is empty.
- "Enter a contact number." — Phone is empty.
- "Enter an email address — the guest's confirmation and entry code are sent to it." — Email is empty. Email is required on every booking; there is no way round it.
- "Check the email address." — the email is not a usable address (e.g. missing "@" or a dot in the domain, or two addresses). Your browser may also stop you first with its own message about the email format.
- "Enter the vehicle registration, or tick "Arriving without a vehicle" if there is no car." — no plate and the box is not ticked.
- "Only a stay starting today can be paid at the gate." — "At the gate" was chosen but check-in is not today (usually because the form was left open past midnight). Choose Cash or Bank transfer, or re-check the dates.
- "A booking with its deposit waived cannot be paid at the gate." — see the waiver task.
- The discount and waiver messages listed in those tasks.
- Technical-looking messages such as "Too big: expected number to be <=12" (late check-out over 12 hours), "Too big: expected number to be <=50" (more than 50 guests in either box) or "Too big: expected string to have <=120 characters" (a name longer than 120 characters) — reduce the figure or shorten the text.

Messages in the summary card, with the button greyed out (fix the form and the price reappears):

- "Choose a unit to see the price."
- "Nothing of this unit type is free for these dates." — choose another type or change the dates.
- "Check-in cannot be in the past." — the page was loaded for a date that has now passed. Pick new dates.
- "Bookings open up to 62 days ahead." — check-in is beyond the booking window set in Property settings.
- "Check-out must be at least one night after check-in."
- "A booking needs at least one guest above the exempt age." — **Over 3** must be at least 1.
- "3-bedroom takes up to 8 guests; this party is 9." — only appears if Property settings is set to refuse a party over the maximum (see *Rules*). Reduce the party or choose a bigger unit type.
- "There are only 3 sofa bed across the property." — more of an extra was asked for than the property owns in total.
- "Sofa bed is not available to book." / "That extra is no longer on the list." — the extra was switched off or retired in Property settings while the form was open. Set it to 0, or reload the page.
- "A discount cannot be more than the booking is worth." — see the discount task.

Messages under the button after pressing it:

- "A-12 was booked for those dates while this form was open." (with the unit's reference) — someone else took that unit a moment before you. Nothing was saved and no money was recorded. Choose another unit (reload the page with **Check availability** for a fresh list) and create again.
- "Every sofa bed is taken for those nights." or "Only 1 sofa bed is free for those nights." — other bookings took that extra over those nights while the form was open. Nothing was saved. Lower the number and create again.
- "That unit does not exist." — the unit could not be found when saving. Reload New booking and choose another unit.

The error screen "**This page didn't load** — Something went wrong on our side. Trying again usually works…" with **Try again** and **Go to the dashboard**:

- Appears if you do not hold **Create bookings** (or **Discount bookings** / **Waive the security deposit** for those sections) — ask an Admin.
- Also appears if the chosen unit was taken out of service between opening the form and saving, or on a genuine fault. What you typed may be lost. Reload New booking and check whether the booking was created (search All bookings) before trying again. If it keeps happening, give Jefferson the reference number shown at the bottom.

## How prices are worked out

### How a stay is priced

Every price is made of separate lines that add up to the total. All figures below are the defaults and are set in **Admin → Property settings → Rates** and **Extras** (see *Units and property settings*).

| Line | How it is worked out | Default figures |
|---|---|---|
| Nights | Unit type's nightly rate × number of nights | 2-bedroom BND 180, 3-bedroom BND 200, 4-bedroom BND 250, Semi-detached BND 320 |
| Extra guests | Each guest **aged over 3** above the unit type's maximum × BND 7 × nights | Maximums: 2-bedroom 6, 3-bedroom 8, 4-bedroom 10, Semi-detached 20 |
| Extras | Quantity × the extra's price, **once per stay** (not per night) | Sofa bed BND 28 (includes one pillow and one blanket) |
| Late check-out | Hours × BND 15 (per hour, not a flat fee) | Standard check-out 12:00 |
| Discount | A minus line, if given | — |

- Children aged 3 and under are free and never count towards the maximum or the extra-guest charge.
- There are no weekend, seasonal or holiday rates, and no weekly or monthly rates. Every night costs the same.
- The line wording on the booking reads, for example, "3-bedroom — 2 nights", "Extra guests above 8 — 2 × 2 nights", "Sofa bed", "Late check-out — 2 hours", "Discount — 10%".
- **Early check-in is not sold anywhere in the system today.** Neither New booking nor Amend nor the website offers it, so an early check-in cannot be charged through the system even though Property settings has a per-hour rate for it. Whether and how to charge for it is not settled yet — ask Jefferson/Jason.
- Late check-out hours can only be added when the booking is made or amended, and a booking cannot be amended once the guest is checked in — so hours asked for on the morning of departure cannot be charged through the system.
- **A party over the maximum:** by default the extra guests are charged BND 7 a night each. Property settings → Rates → **When a party is over the maximum** can instead be set to **Refuse the booking**, in which case the form refuses the party.

Worked example (default figures): a 3-bedroom for 2 nights, 10 guests aged over 3 and one child aged 2, one sofa bed, 2 hours' late check-out: 200 × 2 = 400; 2 extra guests × 7 × 2 nights = 28; sofa bed 28; late check-out 2 × 15 = 30. Total **BND 486.00**, plus the BND 100 security deposit taken separately.

### Extras and their stock

- The extras offered are the list in **Admin → Property settings → Extras** (see *Units and property settings*). Only extras that are switched on and not retired appear on New booking.
- An extra can have a **stock** (how many the property owns). If the stock is blank, the system does not limit it at all — nobody has counted the sofa beds yet, so by default the sofa bed is unlimited.
- When a stock is entered, an extra is held for every night of the stay, across every live booking. The counter's "N free" shows how many are left on the busiest night of your dates. The database refuses the booking that would take one more than there are, even if two people book at the same moment.
- Extras are released exactly when the unit is: when the booking is cancelled, expires or is a no-show. Checking out does not release them early — a guest checked out before their booked check-out date still holds the extra (and the unit) for the remaining booked nights.
- Extras are for stays only. Day passes have no extras.

### The security deposit

- **How much:** one flat amount per stay booking, BND 100 by default (Property settings → Rates → **Security deposit**). It does not change with the unit type, number of nights or number of guests.
- **When:** it is taken **as the booking is made** — in cash at the desk, as a transfer the queue verifies, or (for "At the gate") by the guard when the guest arrives. It is what secures and confirms the booking.
- **What it is not:** it is not part of the stay's price. It is never inside the **Total**, never discounted, and does not reduce what the guest owes for the stay. It is refundable after check-out and inspection (see *Deposits, reports and finance*).
- **Day passes have no deposit.**
- **When there is none:** when waived at booking (with a reason), or if the amount is set to zero in Property settings — the confirmation then says "None quoted".

### How a day pass is priced

Day passes are sold only on the public website (see *The customer side*); staff cannot create one in the portal. The price is worked out automatically:

- Per person by age: **Under 1 free**, **Child (1 to 11) BND 5**, **Adult (12 and over) BND 10**. These age bands and prices are set in Property settings → Day pass.
- Family bundles: **2 adults + 1 child = BND 20** and **2 adults + 2 children = BND 25**.
- A bundle is applied **as many times as it fits**, and anyone left over pays per person. The system always charges the cheapest possible combination. Examples: 2 adults + 3 children = BND 30 (one 2+2 bundle plus a child); 4 adults + 2 children = BND 40 (two 2+1 bundles); 1 adult + 2 children = BND 20 (no bundle fits — per person).
- Free under-1s produce no price line but still count in the headcount.
- A day pass has no security deposit and no extras. It can be booked from today up to the booking window ahead (62 days by default), for up to 50 people in each age group.
- Each day has a limit on places if one is set: the smallest capacity among the facilities included in the day pass (Property settings → Day pass). If no capacity is set, there is no limit. Cancelled, expired and no-show passes give their places back.
- Whether under-1s are really free has never been confirmed by the owner — it is the current setting. This is not settled yet — ask Jefferson/Jason.

## Holds and double booking

### Holds

A **hold** means a unit is blocked for a booking that has not been paid for yet. Bookings that hold a unit without money in hand:

- **Held** — a stay booked online where the customer has not yet said they transferred, and a desk booking made "At the gate".
- **Awaiting payment** — a transfer has been promised (by the customer online, or by choosing Bank transfer on New booking) and nobody has verified it yet.

**Holds never expire.** There is no timer and no automatic release — the owner decided a unit is held until somebody checks. A held unit stays blocked until someone verifies the payment (which confirms the booking) or **cancels** the booking. So an abandoned online booking or a guest who never arrives at the gate blocks the unit until the office cancels it. A **Held** booking usually has nothing in the Verification queue (nobody has reported a transfer yet), so find these on **All bookings** with the **Held** status ticked. **Awaiting payment** bookings do sit in the Verification queue, oldest first (see *Payments*).

**Overriding a hold:** there is a permission called **Override booking holds** (held by Front Office and Admin by default) in Roles & staff, but **no screen uses it** — there is no "override hold" button anywhere. To free a unit held by an unpaid booking, cancel that booking from its page (see *The booking's own page*).

Online bookings have one limit that desk bookings do not: a customer can have at most three unpaid bookings on one phone number at a time (see *The customer side*). The desk is not limited.

### Double booking

Two bookings can never hold the same unit on the same night. This is enforced by the database itself, not by staff care, so it holds even when two staff (or a customer online) book at the same moment.

- On New booking you only ever see units that were free when the page loaded, so normally you never meet a clash.
- If someone takes the unit between your page loading and your pressing the button, the save is refused with "A-12 was booked for those dates while this form was open." Nothing is saved and no money is recorded. Pick another unit.
- A booking that ends on a given morning and one that starts that same day do not clash.
- Cancelled, expired and no-show bookings free their unit immediately.

## Booking references

- Every booking — stay or day pass, desk or online — gets a reference like **PV-4823**: "PV-" and a number.
- Numbers are given out in order and are at least four digits; after PV-9999 they simply grow (PV-10000). Numbers can be skipped (for example when a save is refused), and a gap means nothing.
- The reference is what the guest quotes at the gate and writes in the description of a bank transfer; it is how the payment is matched in the Verification queue.
- It is shown in large type on the confirmation screen and at the top of the booking's page. It never changes and is never reused.

## Rules the system enforces

- **Email, name, phone and a vehicle answer are required on every booking.** The email is required because the confirmation and entry code travel by email; a registration (or the explicit "Arriving without a vehicle") because Security match arrivals by plate.
- **A booking is secured by the security deposit.** Cash for the deposit confirms at once; a transferred deposit confirms only when verified. Money for the stay never confirms a booking that is still owed its deposit.
- **"At the gate" only for a stay starting today, and never with a waived deposit** — otherwise a unit could be held for free for a later date, and nothing would ever release it.
- **Check-in cannot be in the past or beyond the booking window** (62 days by default). A stay must be at least one night.
- **At least one guest over the exempt age.** Up to 50 in each box; late check-out up to 12 hours.
- **Discounts and waivers need a reason** and their own permissions, because they are the two fields that decide money is not taken.
- **The security deposit is never discounted and never part of the stay's total.**
- **No double booking** of a unit, and **no overselling** of an extra with a stock count — both enforced by the database.
- **Holds never expire**; only verifying or cancelling ends them.
- **Prices are always recalculated by the system** when the booking is saved; no one can type in a total.

## Likely questions

**Q: Can I book a day pass for a guest from the portal?**
A: No. There is no day-pass form in the portal or on the guard's phone. Day passes are booked on the public website's day-pass page (bruneiapartment.com). The guard can admit a paid day pass at the gate and take cash for one that is owed, but nobody can create one from the staff side.

**Q: How do I set up a long-term tenant?**
A: Not on New booking. Long-term lets are recorded on the unit's own page (see *Units and property settings*). Once a unit is marked leased, New booking stops showing it as free for the lease dates.

**Q: The unit I want isn't in the list. Why?**
A: It is booked (held, awaiting payment, confirmed or checked in) for at least one of those nights, leased, or out of service. Check the Calendar to see what is on it. If an old unpaid booking is blocking it, that booking must be cancelled — holds never expire on their own.

**Q: A guest is checked in and wants to stay another night. How do I extend?**
A: A checked-in booking cannot be amended. Make a **new booking** on New booking for the extra night(s), in the same unit, with check-in on the original check-out day. Tick **Waive the security deposit** and write which booking already holds the deposit, e.g. "Extends PV-1234 — the deposit is already held on that booking". Take payment for the new nights as usual. This needs both **Create bookings** and **Waive the security deposit** (Front Office and Admin by default).

**Q: The guard rang — a guest is at the barrier with no booking. What do I do?**
A: Book them on New booking with check-in today and Method **At the gate — the guard takes it**, press **Create & hold for the gate**, and give the guard the reference. He takes the deposit and then the stay in cash when they drive in.

**Q: The guest at the gate drove off. The booking is still Held.**
A: Cancel it from its page. Nothing releases a held booking on its own, and it cannot be marked a no-show because it was never confirmed.

**Q: The customer says they didn't get a confirmation email or QR code.**
A: Bookings made on New booking do not send an email when they are created. A booking paid in cash at the desk is confirmed straight away and never gets an automatic email. A transfer or at-the-gate booking gets the "booking confirmed" email (with the QR code) once its deposit is verified or taken. You can download the QR code from the booking's page (**Download image**) and send it by WhatsApp — see *The booking's own page*.

**Q: The guest gave the wrong email address. Can I fix it?**
A: No screen can change a booking's email address once it is saved. Check it carefully with the guest before creating the booking. Ask Jefferson if a wrong address needs correcting.

**Q: I forgot to tick "Waive the security deposit" (or ticked it by mistake). Can I change it now?**
A: No. The waiver can only be set when the booking is created, and no screen adds or removes it afterwards. This is not settled yet — ask Jefferson/Jason what the office should do.

**Q: Does the BND 100 deposit count towards the stay?**
A: No. It is a refundable deposit, separate from the stay's price. A BND 400 stay still owes BND 400 whether or not the deposit has been paid. The "Taking now" block adds the two together only to show what crosses the counter today.

**Q: The guest wants to pay just the deposit now and the rest when they arrive.**
A: Choose **Deposit only** under Paying now. The stay is recorded from the booking's page when they pay on arrival.

**Q: The guest will pay by transfer. Which bank account do I give them?**
A: New booking and the confirmation screen do not show the property's bank accounts. They are kept in Admin → Property settings → Bank accounts, which only Admin can open by default. The system does not send the guest the bank details for a booking made at the desk either (no email goes out when staff create a booking). So give the guest Palm Villa's account details yourself, the way the office always has — ask an Admin for them if you don't have them to hand. Tell the guest to put the booking reference in the transfer description.

**Q: A regular wants 10% off. Can I do that?**
A: If you hold **Discount bookings** (Front Office and Admin by default), choose **Percentage off**, enter 10 and a reason. There is no ceiling and no approval step, but every discount is recorded with your name and reason.

**Q: Why is the Discount (or Security deposit) section missing for me?**
A: You don't hold **Discount bookings** (or **Waive the security deposit**). Ask an Admin.

**Q: I pressed Create and got "This page didn't load". Was the booking made?**
A: Possibly not — search **All bookings** for the guest's name before trying again, so you don't make it twice. The most common causes are not holding **Create bookings**, or the unit being taken out of service while the form was open.

**Q: It says "A-12 was booked for those dates while this form was open."**
A: Someone else took that unit a moment before you. Nothing was saved and no money was recorded. Choose another unit and create again.

**Q: Can the guest check in early?**
A: The system doesn't sell early check-in. Standard check-in is 14:00; whether a guest can come earlier depends on the unit being ready — agree it with them on the day. There is no way to charge an early check-in fee through the system at the moment.

**Q: The family has three cars but the unit only includes two spaces.**
A: Enter all three plates. The form warns that the extra car may not have a bay, but it still saves the booking and records the car so Security can match it. (A customer booking online cannot do this: the website stops at the spaces the unit includes and asks them to message the office on WhatsApp at +673 8959798 first. If you agree to the extra car, add its plate to their booking with **Edit → Vehicles**.)

**Q: A guest doesn't have a car.**
A: Tick **Arriving without a vehicle**. Only use it when there really is no car — the guard matches arrivals by plate.

**Q: Can I hold a unit for a guest who will pay cash when they arrive next week?**
A: Only by taking the BND 100 deposit now (cash, or a transfer that is then verified). "At the gate" (nothing taken) is for today only.

**Q: I booked the wrong unit / wrong dates.**
A: Use **Amend** on the booking's page (see *Finding and changing bookings*). If the booking should not exist at all, cancel it. Bookings are never deleted.

**Q: Does changing the rates in Property settings change bookings already made?**
A: No. Existing bookings keep their price. Only new bookings and amendments use the new rates.

**Q: How many sofa beds are there?**
A: Nobody has entered a number yet, so the system doesn't limit them. Once a stock is entered in Property settings → Extras, the booking form shows how many are free and refuses to oversell.

**Q: Why does a booking I made at the gate say "Created — walk-in, paid on the spot" in its history when nothing was paid?**
A: That is how the history words every desk booking that was not a bank transfer, including "At the gate". The booking's status (**Held**) and its payments show the real position.

## Terms

- **New booking** — the portal screen where the office creates a stay booking.
- **Short stay** — a booking for one or more nights in a unit; the only kind New booking makes.
- **Day pass** — a booking to use the facilities on one day, with no unit; sold only on the website.
- **Tenancy / long-term let** — a unit let long-term, recorded on the unit's page, not as a booking.
- **Check-out morning** — the day the guest leaves; it is not a night and does not block the unit for the next guest.
- **Booking window** — how far ahead a booking can start (62 days by default).
- **Security deposit** — the refundable BND 100 (by default) taken when a stay is booked; it secures the booking and is separate from the stay's price.
- **Waive the security deposit** — booking without a deposit, with a recorded reason; usually because another booking already holds one.
- **Paying now** — whether the guest pays the deposit only, or the deposit and the stay, at booking.
- **At the gate** — a same-day booking made with nothing taken, for the guard to collect the deposit and the stay when the guest arrives.
- **Held** — a booking blocking its unit with nothing paid and no transfer promised yet.
- **Awaiting payment** — a booking blocking its unit while a promised transfer waits to be verified.
- **Confirmed** — the deposit (or, with no deposit, the stay) is in hand; the booking is secured.
- **Hold** — a unit blocked by an unpaid booking; holds never expire.
- **Extra** — an optional item a stay can add (e.g. sofa bed), charged once per stay.
- **Stock** — how many of an extra the property owns; blank means unlimited.
- **Extra guest charge** — BND 7 per night for each guest aged over 3 above the unit type's maximum (children aged 3 and under are not counted).
- **Exempt guest** — a child aged 3 and under; free and not counted.
- **Family bundle** — a fixed day-pass price for 2 adults + 1 child or 2 adults + 2 children.
- **Discount** — money taken off a stay's price, as an amount or a percentage, with a reason.
- **Booking reference** — the PV- number that identifies a booking forever.
- **Taking now / To collect / To confirm** — the summary block showing what crosses the counter at booking.

---

# 3. The booking's own page

## What this area is for

Every booking has one page in the portal that shows everything known about it and everything that can still be done to it. Staff reach it by clicking a booking anywhere in the portal (All bookings, the Calendar, the Dashboard's lists, the Verification queue, a search result, a notification) or by typing its address: **portal.bruneiapartment.com/bookings/** followed by the booking reference, for example **/bookings/PV-0123**. The reference is not case-sensitive, so **pv-0123** opens the same booking. The browser tab shows the reference as the page title, and the address can be sent to a colleague — it opens the same booking for them.

It replaces the WhatsApp thread, the row in the Excel sheet and the folder of IC photos: the guest's details, the money, the deposit, the entry code, the staff's notes, the identity documents and a full history of who did what, in one place.

**Who can open it:** anyone who holds the **View bookings** permission. By default that is all five roles — Admin, Front Office, Security, Housekeeping and Finance. An Admin can change who holds it in **Roles & staff**. What each person can *do* on the page depends on their other permissions; buttons they cannot use are simply not shown.

This section covers the page itself, every booking status and how a booking moves between them, checking in, checking out, admitting a day pass, cancelling, marking a no-show, notes, the history, identity documents, the entry QR code and the accounting pack. Taking money on this page — **Record a payment**, recording or topping up the security deposit, verifying a transfer — is covered in *Payments*. Changing a booking (the **Edit** button) is covered in *Finding and changing bookings → How to edit (amend) a booking*.

## Screens

### The booking page

**Who can open it:** anyone with **View bookings** (all five roles by default).

If you do not hold **View bookings**, the page shows **"You don't have access to this screen"** with the line *"Viewing bookings needs the "View bookings" permission. Ask an administrator if this is part of your job."*

If the reference does not exist (a typing mistake, or a reference from another system), the portal shows a plain "page could not be found" screen. Check the reference and try again, or search for the guest's name.

While the page is loading you see grey placeholder blocks in the shape of the page.

The page is laid out top to bottom like this:

1. **The header** — the reference, the status badge, the guest's name, and the action buttons.
2. **A one-line notice**, only on bookings that can no longer be edited.
3. **Guest & stay** and **Money**, side by side on a wide screen, stacked on a phone.
4. **Payments**
5. **Accounting pack**
6. **Entry QR code**
7. **Notes**
8. **History**

#### 1. The header

- **Title:** the booking reference (for example PV-0123).
- **Status badge** beside it — see *Every booking status* below for what each one means.
- **The guest's name.**
- **Action buttons** on the right. Only the ones that apply to this booking *and* that you are allowed to use appear:
  - **Check in** — a confirmed stay, for people who may check guests in. This is the page's one filled (main) button.
  - **Check out** — a checked-in stay, for people who may check guests out. Also the filled button. A booking never shows Check in and Check out together.
  - **Admit** — a confirmed day pass, for people who may admit day passes. Also the filled button.
  - **Edit** (pencil icon) — any booking that is Draft, Held, Awaiting payment or Confirmed, for people who may edit bookings. It also shows on a day pass, but a day pass cannot be edited: the button leads to "This booking has no stay to edit". See *Finding and changing bookings → How to edit (amend) a booking*.
  - **The "…" menu** (three dots, labelled "Actions for PV-…" for screen readers) — holds **Mark as no-show** and **Cancel booking** where they apply. If neither applies to you or to this booking, the three-dot button is not shown at all.

#### 2. The notice under the header

Shown only when the booking can no longer be edited:

- On a **Checked in** booking: *"This guest has checked in, so the booking can no longer be edited. Checking them out ends the stay."* (The dates, unit and extras can no longer be edited, but the party still can, with **Change** on the Party line.)
- On any **closed** booking (Completed, Cancelled, No show, Expired): *"This booking is closed. Its details are kept as a record and cannot be changed."*

#### 3a. Guest & stay card

Six or seven labelled readouts in two columns, then the **Identity** panel:

- **Guest** — the guest's name.
- **Phone** — the number exactly as it was typed. Tapping it on a phone starts a call.
- **Email** — the address (tap to open an email). If there is none it says **None on file**; on a booking made online without an address it adds *"Booked online without one — confirm by phone or WhatsApp"*. (An address has been required on every new booking since 17 September 2026, so this only appears on older bookings.)
- **Unit** — the unit reference (for example 3B-04). A day pass shows **No unit**.
- **Dates** — first night → check-out day, with the number of nights underneath ("2 nights"). A day pass shows **No stay dates**. The day pass's own date is shown in the **Admit** dialog, not in this card.
- **Party** — for a stay, the number of guests counted towards occupancy; if some guests are not counted (for example young children), a line underneath says *"plus 2 not counted towards occupancy"*. For a day pass, the number of people, with the age bands underneath (e.g. *"Adult × 2, Child × 1"*). Beside the number, a **Change** button for holders of **Edit bookings** on any booking that is not closed — including a guest already checked in, and a day pass. See *Finding and changing bookings → How to change the party (more or fewer people)*.
- **Vehicle** / **Vehicles** — the registration plates. If there are none, it says either **None** with *"The guest is arriving without one."* (the guest said they have no car), or **Not recorded** with *"Taken before a registration was required — add it when editing the booking."* (an old booking where nobody asked).
- **Identity** panel — see *Identity documents* below.

#### 3b. Money card

Covered in full in *Payments*. In short, it lists the booking's price lines, any discount (*"Discounted …"* — the reason is only ever shown to staff), the **Total**, what has been **Paid** (verified money only), and **Outstanding** or **Overpaid by** when the booking is not exactly settled. It may say *"A transfer is awaiting verification. It does not count towards what has been paid until someone has checked the bank."* or *"More has been taken than this booking is worth. Refunds are settled outside the system."* It holds the **Record a payment** button and the **Security deposit** panel (with **Record the deposit**, **Take the deposit in cash**, **Take it in cash instead**, **Top up the deposit** and the deposit's **Transfer slip**). The card's info tooltip reads: *"The security deposit secures the booking and is held apart from the total — never counted as revenue. It is taken when the booking is made, at the counter or by the transfer a customer promises online, and released after the unit has been inspected. Nothing is collected at check-in."* All of this is explained in *Payments*.

#### 4. Payments section

Every payment raised against the booking: the method (Cash or Bank transfer), a badge **Verified** or **Awaiting verification**, sometimes **Matched by hand**, the amount, who collected or verified it and when (or when it was raised), what the bank showed, any reason given, and the **Transfer slip** panel for a bank transfer. When there are none: *"No payment recorded against this booking."* Where a transfer is waiting and you may verify payments, the verification controls appear at the bottom of this section. All of this is covered in *Payments*.

#### 5. Accounting pack section

See *The accounting pack on the booking* below.

#### 6. Entry QR code section

See *The entry QR code* below.

#### 7. Notes section

Staff notes about the booking, newest first. See *Notes* below.

#### 8. History section

Everything recorded against the booking, newest first, ten to a page. See *History* below.

## Every booking status

A booking is always in exactly one of nine statuses. The status badge in the header, on All bookings and on the Calendar uses these exact words:

| Badge | Colour | What it means |
|---|---|---|
| **Draft** | grey | Started but not yet held. **No booking is ever left in Draft today** — every way of creating a booking moves it straight on. |
| **Held** | grey | The unit (or day-pass place) is reserved for a guest who has not paid yet. A booking made on the website starts here, and so does a desk booking left for the guard to collect ("pays at the gate"). **A hold never runs out on its own** — it lasts until someone confirms the money or cancels the booking. |
| **Awaiting payment** | amber | A bank transfer has been reported and is waiting for someone to check the bank. The unit stays reserved. |
| **Confirmed** | green | The booking is secured — by the security deposit being in hand, or, where no deposit is quoted (for example a day pass), by the booking being paid. The entry QR code is issued at this moment. A confirmed stay can still owe money for the stay itself. |
| **Checked in** | teal | The guest has the keys and is in the unit. |
| **Completed** | grey | Closed. For a stay: the guest has checked out. For a day pass: it has been admitted. |
| **Cancelled** | red | Closed without a stay. The unit and dates were released immediately. |
| **No show** | red | Closed because the guest never arrived. The unit was released for the nights they did not use. |
| **Expired** | red | Closed because a hold lapsed. **Nothing in the app expires a booking today** (the owner decided holds should last until someone acts), so you should never see this. |

**Completed, Cancelled, No show and Expired are final.** A booking in one of these can never move again, cannot be edited, and cannot be reopened. A guest who comes back needs a new booking.

### How a stay moves (short stays)

| From | To | What causes it | Who, by default |
|---|---|---|---|
| (new) | **Held** | The customer books on the website; or the desk creates a booking to be paid at the gate. | The customer; Front Office, Admin |
| (new) | **Awaiting payment** | The desk creates a booking paid by bank transfer. | Front Office, Admin |
| (new) | **Confirmed** | The desk creates a booking paid in cash (the deposit, or the whole price where no deposit is quoted). | Front Office, Admin |
| Held | **Awaiting payment** | The customer presses the "I have made the transfer" button on their booking page, or staff record the deposit as a bank transfer. | The customer; anyone who may record cash payments |
| Held or Awaiting payment | **Confirmed** | The deposit is verified in the Verification queue, or counted in cash; or, where no deposit is quoted or it is already in hand, the payment is verified or taken in cash. See *Payments* for the exact rules. | Verifying: Front Office, Finance, Admin. Cash: Front Office, Security, Admin |
| Draft, Held, Awaiting payment or Confirmed | **Cancelled** | **Cancel booking** from the "…" menu. | Front Office, Admin |
| Confirmed | **No show** | **Mark as no-show** from the "…" menu, from the arrival day onwards. | Front Office, Admin |
| Confirmed | **Checked in** | **Check in** — here or at the gate. Refused unless the security deposit is held in full. | Security, Front Office, Admin |
| Checked in | **Completed** | **Check out** — here, at the gate, or on the housekeeping screen. | Security, Housekeeping, Front Office, Admin |
| Held or Awaiting payment | Expired | Not used — nothing triggers it. | — |

A **Checked in** booking can only be checked out: it cannot be cancelled, marked a no-show or edited.

### How a day pass moves

Day passes are sold on the website only; the portal's New booking form makes stays.

| From | To | What causes it | Who, by default |
|---|---|---|---|
| (new) | **Held** | The customer books a day pass on the website. | The customer |
| Held | **Awaiting payment** | The customer presses "I have made the transfer". | The customer |
| Held or Awaiting payment | **Confirmed** | The transfer is verified in the Verification queue, or the pass is paid in cash at the desk or the gate. A day pass quotes no security deposit, so paying it is what confirms it. | Verifying: Front Office, Finance, Admin. Cash: Front Office, Security, Admin |
| Confirmed | **Completed** | **Admit** — at the gate or on this page, on the pass's own date only, and only when paid in full. Admitting closes the pass. | Security, Front Office, Admin |
| Draft, Held, Awaiting payment or Confirmed | **Cancelled** | **Cancel booking**. | Front Office, Admin |
| Confirmed | **No show** | **Mark as no-show**, from the pass's date onwards. | Front Office, Admin |

A day pass is **never checked in** and never checked out. If anyone tries (for example through an old link), the app refuses: *"This booking is a day pass. A day pass is admitted, not checked in."*

Cancelling or marking a day pass a no-show gives its places back to that day's day-pass capacity.

## How to check a guest in (from the portal)

**Who can do this:** anyone with **Check guests in** — by default Security, Front Office and Admin. An Admin can change this in **Roles & staff**.

**Where:** the booking page → **Check in** button in the header. (The guard normally does this at the gate — see *Field screens*. Both do exactly the same thing.)

**Steps:**
1. Open the booking. The **Check in** button appears only on a **Confirmed** stay.
2. Press **Check in**. A dialog opens titled **Check in [guest name]?** and says where the security deposit stands.
3. If the deposit is held in full, or the booking quotes no deposit (or it was waived), the dialog shows a button **Check in PV-…**. Press it.
4. If the deposit is not in, the dialog explains why and only offers **Close** — see *Edge cases* below. Sort out the deposit first, then press **Check in** again.

**What the dialog says before you press it:**
- Deposit held: *"The stay begins now. The BND 100.00 security deposit is already held — taken in cash on [date and time] — and stays held until the unit has been inspected and the release is approved."*
- Deposit waived at booking: *"The stay begins now. The security deposit was waived when this booking was made — "[reason]" — so nothing is held."*
- No deposit quoted: *"The stay begins now. This booking quotes no security deposit, so nothing is held."*
- Checking in on a different day from the booked first night (early or late): an extra line *"This booking is dated [date]. Checking in today is recorded as happening today."* This is a reminder, not a refusal.

**What happens next:**
- A message appears: **"[Guest] is checked in"** with *"BND 100.00 security deposit is held against the stay."*, or *"The security deposit was waived on this booking."*, or *"No security deposit was due on this booking."*
- The status becomes **Checked in**. The **Edit** button and the "…" menu disappear; the header now offers **Check out**.
- The booking can no longer be edited or cancelled.
- The unit shows as **Occupied** on the Units board. The deposit shows as **Guest in stay** on the Deposits list.
- The gate's lists move the guest from arriving to staying.
- The History gets a **Checked in** entry with your name and the time.
- **No money is taken and no email is sent.** Check-in never collects anything.

**Edge cases and limits:**
- **The deposit must be held in full.** Check-in is refused if the booking quotes a security deposit and it is not all in the safe. The dialog tells you which of three situations it is:
  - **Never taken:** *"The BND 100.00 security deposit secures this booking, and it is not in yet."* plus *"Nothing has been recorded against it. Record the deposit from the Money card below — in cash, or as a transfer for the queue — then check the guest in."*
  - **Transfer promised but not verified:** the same first line, plus *"The customer says they transferred it, and nobody has verified that yet. Confirm it from the payments queue, or take it in cash from the Money card below, then check the guest in."* (The words "Confirm it from the payments queue" are a link to the Verification queue.)
  - **Arrived short:** *"Only BND 60.00 of the BND 100.00 security deposit is held, and it is what secures this booking."* plus *"Top up the remaining BND 40.00 from the Money card below — in cash, or a transfer you have checked — then check the guest in."*
- **Money still owed for the stay does not stop check-in.** A guest whose booking was secured by the deposit usually pays for the stay on arrival. Take it from the Money card (*Payments*); the system lets you check them in either way.
- **The date is not checked.** The portal will check a guest in days before or after their booked first night. (The gate is stricter: it sends an early arrival to the office.) Checking in early does not change the booked dates — if the guest is really staying extra nights, edit the booking *before* checking in, because a checked-in booking cannot be edited.
- **Whether the unit is clean is not checked.** A unit not yet marked ready by Housekeeping can still be checked into; the app does not stop it.
- **Only Confirmed stays.** A Held or Awaiting payment booking has no Check in button — it has to be confirmed first.
- A day pass cannot be checked in — it is admitted.

**Can it be undone?** No. There is no "undo check-in". A checked-in booking can only be checked out. If a guest was checked in by mistake, add a note explaining what happened and tell Jefferson/Jason — the app has no way to put it back to Confirmed.

**If you see an error:**
- *"The BND 100.00 security deposit has not been taken. Record it from the booking, then check the guest in."* — nothing has been recorded against the deposit. Record it from the Money card's Security deposit panel, then check in.
- *"The BND 100.00 security deposit transfer has not been verified. Confirm it from the payments queue, or take it in cash from the booking, then check the guest in."* — the customer promised a transfer and nobody has confirmed it. Check the bank and verify it in the Verification queue (Front Office, Finance, Admin), or take the deposit in cash.
- *"Only BND 60.00 of the BND 100.00 security deposit is held. Top it up from the booking, then check the guest in."* — the deposit came in short, or the booking was edited to a higher deposit. Use **Top up the deposit** on the Money card. Do not go to the Verification queue — that transfer was already verified.
- *"Someone else moved this booking while you were working on it. Reload and try again."* — a colleague (often the guard at the gate) changed this booking a moment ago. Reload the page and look at the status.
- *"Cannot check in a booking that is checked in."* (or "…that is awaiting payment verification", etc.) — the booking is no longer Confirmed. Reload to see its current status.
- *"This booking is completed and cannot be changed."* (or cancelled, no show) — the booking is already closed.
- *"This booking is a day pass. A day pass is admitted, not checked in."* — use **Admit** instead.
- *"This booking could not be checked in. Reload the screen."* or *"That booking no longer exists."* — reload the page; if it persists, tell Jefferson.

## How to check a guest out (from the portal)

**Who can do this:** anyone with **Check guests out** — by default Security, Housekeeping, Front Office and Admin. An Admin can change this in **Roles & staff**.

**Where:** the booking page → **Check out** button in the header. (The guard normally does this at the gate when the keys come back; Housekeeping does it from their screen when they find the unit empty with the keys left inside — see *Field screens*.)

**Steps:**
1. Open the booking. **Check out** appears only on a **Checked in** stay.
2. **Before you check out, look at the Money card.** If the guest still owes for the stay, take it first (see *Payments*). The portal's check-out dialog does not remind you.
3. Press **Check out**. A dialog opens: **Check out [guest name]?** — *"The stay ends and the booking is closed — it cannot be edited or reopened afterwards. Any deposit stays held until Housekeeping records an inspection and the release is approved."*
4. Press **Check out** in the dialog (or **Not yet** to go back).

**What happens next:**
- A message appears: **"PV-… checked out"** — *"The deposit stays held until the unit is inspected."*
- The status becomes **Completed**. The booking is closed for good.
- **The security deposit is not released.** It moves to **Awaiting inspection** on the Deposits list. Housekeeping records the inspection, then Finance (or whoever holds **Approve deposit release**) approves the release — see *Deposits, reports and finance*.
- The unit shows **Awaiting inspection** on the Units board and appears on Housekeeping's turnover list; after the inspection it shows **Cleaning** until marked ready (see *Units and property settings*).
- The accounting pack is rebuilt overnight to show the new status.
- History: **Checked out**, with your name and the time.
- No money moves and no email is sent.

**Edge cases and limits:**
- **Any day.** The portal lets you check a guest out before their booked last day (the gate does not — an early departure is the office's to do). But **checking out early does not free the remaining nights**: the unit stays blocked on the Calendar and in availability until the original check-out date, and a Completed booking cannot be edited to shorten it. This is not settled yet — ask Jefferson/Jason if you need to resell those nights.
- **An overdue guest** (past their check-out date and still checked in) stays **Checked in** until someone checks them out; nothing closes the booking automatically.
- **After check-out, cash can no longer be recorded against the booking** — the Money card will refuse with *"This booking is completed, so cash cannot be recorded against it."* A guest who left owing money is the office's to deal with outside the system.

**Can it be undone?** No. A Completed booking cannot be reopened, edited or checked in again. If a guest was checked out by mistake and is still staying, add a note and tell Jefferson/Jason.

**If you see an error:**
- *"Someone else changed this booking while you were working on it. Reload and retry."* — a colleague acted on the booking at the same moment (for example the guard checked them out at the gate). Reload.
- *"Cannot check out a booking that is completed."* / *"This booking is completed and cannot be changed."* — already checked out. Reload to see who did it in the History.
- *"This booking could not be checked out. Reload the screen."* or *"That booking no longer exists."* — reload; if it persists, tell Jefferson.

## How to admit a day pass (from the portal)

**Who can do this:** anyone with **Admit day passes** — by default Security, Front Office and Admin. An Admin can change this in **Roles & staff**.

**Where:** the booking page → **Admit** button (ticket icon) in the header. The gate admits most passes (see *Field screens*); the portal button is for the visitor who was sent to the office — to pay the rest, or because the guard's list was out of date.

**Steps:**
1. Open the day pass booking. **Admit** appears only on a **Confirmed** day pass.
2. Press **Admit**. The dialog **Admit [name]?** says: *"A day pass for 3 people on [date]. Admitting uses it for the day and closes the booking — it cannot be edited or cancelled afterwards."*
3. If it is the pass's date and it is paid in full, press **Admit PV-…**. Otherwise the dialog explains why and only offers **Close**.

**What happens next:**
- A message: **"PV-… admitted"** — *"The day pass is used for today, and the booking is closed."*
- The status becomes **Completed**. The pass cannot be edited, cancelled or admitted again.
- The pass stays on the gate's list for the rest of the day, so a visitor who leaves and comes back is still recognised.
- History: **Admitted**, with your name and the time.
- No money is taken and no email is sent.

**Edge cases and limits:**
- **Only on the pass's own date**, counted in Brunei time. On any other day the dialog says *"This pass is for [date], and can only be admitted on that day."*
- **Only when paid in full** — verified payments must cover the whole price. A pass accepted with a short transfer is still owed money and is refused. The dialog says *"This pass is not paid in full. Take the rest from the Money card below, then admit it."* Take the rest (see *Payments*) and admit.
- A transfer still awaiting verification does not count as paid.
- The number of people is shown in the dialog so you can count heads; the app does not check headcount. If more people came than the pass is for, press **Change** beside **Party** first (see *Finding and changing bookings → How to change the party (more or fewer people)*), take what is then owed, and admit. Once admitted, the party can no longer be changed.

**Can it be undone?** No. An admitted pass is closed for good.

**If you see an error:**
- *"This day pass is for [date], and can only be admitted on that day."* — wrong day. Ask the visitor to come on the right day, or call the office to change the pass (only possible before it is admitted).
- *"This day pass is not paid in full. Take the rest from the booking, then admit it."* — record the missing money on the Money card, then admit.
- *"Someone else moved this booking while you were working on it. Reload and try again."* — often the gate admitted it a moment earlier. Reload.
- *"This booking is completed and cannot be changed."* — already admitted.
- *"Cannot admit a booking that is awaiting payment verification."* (or held) — the pass is not confirmed yet; the transfer must be verified or the pass paid in cash first.
- *"This booking is a stay. A stay is checked in, not admitted."* — use **Check in**.
- *"This day pass could not be admitted. Reload the screen."* or *"That booking no longer exists."* — reload; if it persists, tell Jefferson.

## How to cancel a booking

**Who can do this:** anyone with **Cancel bookings** — by default Front Office and Admin. An Admin can change this in **Roles & staff**. Security, Housekeeping and Finance cannot cancel.

**Where:** the booking page → "…" menu in the header → **Cancel booking** (shown in red).

**When:** only while the booking is **Draft, Held, Awaiting payment or Confirmed**. A checked-in guest cannot be cancelled (check them out instead), and a closed booking cannot be cancelled.

**Steps:**
1. Open the "…" menu and choose **Cancel booking**.
2. The dialog **Cancel PV-…?** says: *"The unit returns to availability immediately. The booking stays on the record and in the audit trail, but it cannot be reinstated — if this guest rebooks, that is a new booking."*
3. Type a **Reason** (required, at least 3 characters, at most 280). The hint says *"Recorded against the booking with your name and the time."* The example text is "Guest cancelled by phone".
4. **If a security deposit is held**, choose what happens to it (see below). Otherwise the dialog tells you why nothing is kept.
5. Read the line *"Anything paid for the stay itself is refunded outside the system."*
6. Press **Cancel booking** (or **Keep booking** to back out).

**The security deposit — what the dialog shows:**
- **Deposit held** (collected and still in the safe): a choice headed *"The BND 100.00 security deposit"*:
  - **Keep it — the guest cancelled** (selected by default) — *"Forfeited under the cancellation policy, and counted as revenue today."*
  - **Give it back — cancelled by us, or made in error** — *"Recorded as returned, against the reason above. Handing it back happens outside the system."*
  - If the deposit arrived short, an extra line: *"Only BND 60.00 arrived, BND 40.00 short of the quote. That is what is kept or given back."*
- **Transfer promised, never verified:** *"The deposit transfer was never verified, so nothing is held and nothing is kept. It leaves the payments queue — if the money does arrive, it is given back outside the system."*
- **Waived at booking:** *"The security deposit was waived when the booking was made ("[reason]"), so nothing is kept."*
- **Never taken:** *"No security deposit was taken against this booking, so nothing is kept."*
- **None quoted** (for example a day pass): *"This booking quotes no security deposit, so nothing is kept."*

**What happens next:**
- A message: **"PV-… cancelled"**, with *"BND 100.00 security deposit kept"* or *"BND 100.00 security deposit recorded as returned"* where a deposit was held.
- The status becomes **Cancelled** — final.
- **The unit and dates are released immediately** and can be sold again; for a day pass, its places go back into that day's capacity. Any extras on the booking (for example an extra bed) are freed too.
- **Deposit kept:** it leaves the "what do we owe back" ledger, shows as **Kept** on the Deposits list, and counts as revenue today in the *Kept deposits* column of Reports (see *Deposits, reports and finance*).
- **Deposit given back:** it is recorded as released at the moment of cancelling (no inspection is needed) and shows as **Released**. Hand the money back yourself — the system records it, it does not move it.
- **Promised deposit transfer:** it disappears from the Verification queue and can no longer be verified.
- **Money paid for the stay is not refunded by the system.** Refund it by hand (bank app or cash) — the system does not calculate or record the refund.
- **Nothing more can be taken:** cash cannot be recorded against a cancelled booking, and no deposit can be recorded, verified or topped up.
- **The entry QR code stops being shown** on this page. If the guest scans it, the page tells them the booking is no longer live.
- **No email is sent to the guest.** Tell them yourself.
- History: **Cancelled** with your reason in quotes; and, where a deposit was held, **Security deposit kept — BND 100.00, booking cancelled** or **Security deposit returned — BND 100.00, booking cancelled**, also with the reason.

**Edge cases and limits:**
- The system decides what happens to the deposit at the moment you press the button, from what is really on file — if a colleague verified the deposit a second before you pressed, it is treated as held (and kept, if the dialog had no choice to show you).
- **Keep is the default.** Choose **Give it back** only for a booking made in error or cancelled by the property. Whether the desk alone should be able to give a deposit back is not settled yet — ask Jefferson/Jason if you are unsure.
- **Notice period:** the deposit is kept however far ahead the guest cancels. Whether there should be a notice period is not settled yet — ask Jefferson/Jason.
- **A bank transfer for the stay that was still awaiting verification is not removed from the Verification queue by cancelling.** It stays there. Do not verify it as if the booking were live; deal with the refund outside the system and tell Finance.
- A deposit still held on a booking that was cancelled before 22 September 2026 (before the keep-or-return choice existed) is left on the Deposits list as **Held before arrival**, with nothing offered to settle it. Raise these with Jefferson.

**Can it be undone?** No. A cancelled booking can never be reinstated, and a kept or returned deposit cannot be changed afterwards. If you cancelled the wrong booking, make a new booking for the guest (see *Creating bookings*) and add a note on both bookings explaining what happened. A kept deposit on the wrong booking cannot be moved to the new one; tell Jefferson/Jason.

**If you see an error:**
- *"Say briefly why this booking is being cancelled."* — the reason is empty or under 3 characters.
- *"Keep the reason under 280 characters."* — shorten it.
- *"Check the highlighted fields."* — look at the reason box.
- *"Someone else changed this booking while you were working on it. Reload and try again."* — a colleague moved the booking (for example checked the guest in) while the dialog was open. Reload.
- *"Cannot cancel a booking that is checked in."* — the guest is in the unit. Check them out instead.
- *"This booking is cancelled and cannot be changed."* (or completed / no show) — already closed.
- *"That booking no longer exists."* — reload.

## How to mark a guest as a no-show

**Who can do this:** anyone with **Cancel bookings** — by default Front Office and Admin (the same permission as cancelling). An Admin can change this in **Roles & staff**.

**Where:** the booking page → "…" menu → **Mark as no-show**.

**When:** only on a **Confirmed** booking, and only **from the arrival day onwards** (the stay's first night, or a day pass's date, in Brunei time). Before that day the menu item does not appear. It stays available on every later day for as long as the booking is still Confirmed.

**Steps:**
1. Open the "…" menu and choose **Mark as no-show**.
2. The dialog **Mark PV-… as a no-show?** says: *"[Guest] did not arrive. The booking closes and cannot be reopened, and the unit goes back on sale for the nights they did not use — a guest who turns up later needs a new booking."*
3. It then says what happens to the deposit: *"The BND 100.00 security deposit is kept — a guest who does not arrive forfeits it — and counts as revenue today."*, or one of the "nothing is kept" lines listed under cancelling.
4. Press **Mark as no-show** (or **Not yet**). No reason is asked for.

**What happens next:**
- A message: **"PV-… marked as a no-show"**, with *"BND 100.00 security deposit kept"* where one was held.
- The status becomes **No show** — final.
- **The deposit is always kept** if one is held; there is no option to give it back. It shows as **Kept** and counts as revenue today.
- **The unit is released** for the booked nights, including tonight, so they can be sold again. A day pass's places return to capacity.
- A promised deposit transfer that was never verified lapses and leaves the Verification queue.
- No email is sent.
- History: **Marked no-show**, and **Security deposit kept — BND 100.00, guest did not arrive** where a deposit was held.

**Edge cases and limits:**
- Nothing marks no-shows automatically. A Confirmed booking whose dates have passed with nobody arriving stays Confirmed — and keeps its unit blocked — until someone marks it.
- A guest marked at 20:00 who turns up at 23:00 needs a new booking; the no-show cannot be reversed. Whether no-shows should only be allowed from the day after is not settled yet — ask Jefferson/Jason if you want to wait.
- A checked-in guest cannot be marked a no-show.

**Can it be undone?** No.

**If you see an error:**
- *"This guest is not due until [date], so they cannot be a no-show yet."* — it is before the arrival day. Wait until that day.
- *"This booking has no arrival date, so it cannot be marked a no-show."* — tell Jefferson; this should not happen.
- *"Someone else changed this booking while you were working on it. Reload and try again."* — reload.
- *"Cannot mark no show a booking that is checked in."* (or similar) — the guest has arrived. Reload.
- *"This booking could not be closed. Reload the screen."* / *"That booking no longer exists."* — reload.

## "Closing" a booking — which action to use

There is no separate "Close booking" button. A booking closes (becomes final) in one of four ways:

| Situation | Action | Final status |
|---|---|---|
| The guest stayed and has left | **Check out** | Completed |
| A day visitor has arrived | **Admit** | Completed |
| The guest or the property called it off before arrival | **Cancel booking** | Cancelled |
| The guest never came (on or after the arrival day) | **Mark as no-show** | No show |

After any of these, the page shows *"This booking is closed. Its details are kept as a record and cannot be changed."* Notes can still be added and identity documents attached to a closed booking.

## Notes

Notes are staff's own record of what they know about a booking — the things WhatsApp used to hold. They appear in the **Notes** section, newest first, each showing the author's initials and name, the date and time, and the text exactly as typed (line breaks kept). Notes written for housekeeping carry a **Housekeeping** badge; internal notes carry no badge. When there are none: **No notes yet** — *"Anything the desk needs to remember about this booking goes here."*

### How to add a note

**Who can do this:** anyone who can open the booking — anyone with **View bookings**, which is all five roles by default. There is no separate permission for notes.

**Where:** the booking page → **Notes** section → **Add note** (top right of the section).

**Steps:**
1. Press **Add note**. The dialog **Add a note** says *"Kept on this booking with your name and the time. Notes are never edited or deleted — a correction is a further note."*
2. Choose **Who is this for?**:
   - **Internal** (the default) — *"Office only. Nobody outside the portal sees this."*
   - **Housekeeping** — *"Shown to housekeeping alongside this unit on the field screen."*
3. Type the **Note** (up to 2,000 characters). The example text is "Guest is arriving late — porter has been told".
4. Press **Add note**. The button stays greyed out until you have typed something.

**What happens next:** a message **Note added**; the note appears at the top of the Notes section. A Housekeeping note appears read-only on the housekeeping phone screen beside this unit; an Internal note never does. Notes do not appear in the History section and are not audit events — the note itself carries who and when. The guest never sees any note.

**Edge cases and limits:**
- Notes can be added at any status, including closed bookings.
- A note about the **unit** rather than this stay (for example "the shower door sticks") belongs on the unit's own page, because it outlives the booking — see *Units and property settings*.
- If the save is refused, your text stays in the box so you do not have to retype it.

**Can it be undone?** No. Notes cannot be edited or deleted by anyone. To correct a note, add another note saying what was wrong.

**If you see an error:**
- *"Write the note before saving it."* — the note is empty or only spaces.
- *"Keep the note under 2000 characters."* — shorten it (the box stops you typing past the limit anyway).
- *"Choose who this note is for."* — pick Internal or Housekeeping.
- *"Check the highlighted fields."* — look at the highlighted box.
- *"That booking no longer exists."* — reload.

## History

The **History** section is the system's own record of everything that happened to the booking — who, what and when. It cannot be edited or deleted by anyone.

**Who can see it:** anyone who can open the booking.

**What each entry shows:** the actor's initials badge; what happened (in bold); the date and time; who did it — a staff name, **A former staff member** if their account has since been deleted, or **System** when no staff member did it; and, where the action asked for a reason, that reason in quotation marks underneath.

**"System" does not always mean the computer.** Things the **customer** did themselves on the website — booking online, pressing "I have made the transfer", uploading their IC or slip, finding their booking link — also show **System**, because the customer has no staff account. So do the nightly jobs (documents deleted when their retention period ends, accounting packs rebuilt).

**Order and pages:** newest first, 10 entries per page. When there are more than 10, a bar at the bottom shows *"1–10 of 23 events"* with **Previous page** / **Next page** arrows and page numbers. The page number is in the address, so a link to page 2 opens page 2. When there is nothing yet: *"Nothing recorded against this booking yet."*

**What is included:** the booking's own events, and also the events of its payments, its security deposit and every document ever attached to it (even documents since deleted — the record of who opened a guest's IC survives the IC). Charges against the deposit and the inspection are not here; they are on the deposit's own page (see *Deposits, reports and finance*). Notes are not here; they have their own section.

**What the entries say, and what they mean:**

*Creating and changing the booking*
- **Created — walk-in, paid on the spot** — made at the desk with cash. **Note:** a desk booking left for the guard to collect ("pays at the gate") also reads like this, even though nothing was taken.
- **Created — walk-in, paying by transfer** — made at the desk, paid by bank transfer.
- **Booked online — short stay** / **Booked online — day pass** — the customer made it on the website (shows "System").
- **Booking link issued — found by reference and phone** — the customer used *Find my booking* on the website to get their booking link back.
- **Edited** — the booking was amended; the reason is shown if one was given.
- **Party changed — 5 → 7** — somebody changed how many people the booking is for with **Change** on the Party line (from 5 people to 7, everybody counted). The **Why** is shown if one was given. When the guard added visitors to a day pass at the gate, it reads the same, with the reason "Visitors added at the gate".
- **Extra guests reported at the gate — 2 more** — the guard pressed **Extra** and told the office; his words are in **Notes**. **Extra guests added at the gate — 2 more** — the guard added the visitors to a day pass himself and took the difference.
- **Discount applied** / **Discount changed** / **Discount removed**
- **Held** — a wording that exists but is not recorded by anything today; a new held booking shows one of the Created / Booked online lines instead.

*Status changes*
- **Sent for verification** — a transfer was reported (usually the customer pressing "I have made the transfer"); the booking went to **Awaiting payment**.
- **Booking confirmed** — the booking became Confirmed. The entry beside it (a payment verified, cash recorded, or the deposit collected) says what confirmed it.
- **Checked in**, **Checked out**, **Admitted**
- **Cancelled** — with the reason in quotes.
- **Marked no-show**
- **Hold expired** — not used today.
- **Entry QR code replaced — the old code no longer opens this booking**

*Payments* (see *Payments*)
- **Bank transfer awaited**, **Cash recorded**, **Payment verified**, **Confirmed at an amount other than the total**, **Matched to a booking by hand**

*Security deposit* (see *Payments* and *Deposits*)
- **Security deposit waived**
- **Security deposit collected — BND 100.00, in cash** (or *in bank transfer*)
- **Security deposit transfer awaited — BND 100.00**
- **Security deposit topped up — BND 40.00, in cash — BND 100.00 held of BND 100.00**
- **Deposit accepted at an amount other than the BND 100.00 quoted figure**
- **Release approved — BND 100.00 returned** / **Release approved — BND 30.00 owed by the guest**
- **Amount owed settled — BND 30.00, in cash**
- **Security deposit kept — BND 100.00, booking cancelled** / **…, guest did not arrive**
- **Security deposit returned — BND 100.00, booking cancelled**

*Documents*
- **Identity document attached / opened / removed / deleted — retention period ended**
- **Transfer slip attached / opened / removed**
- **Inspection photograph attached / opened**
- **Accounting pack attached / opened / replaced by a newer pack**
- Every time anyone presses **Open** on a document, an "… opened" entry is written with their name. This is the record of who looked at a guest's IC.
- **Note:** when a guest uploads a new IC or slip from their own booking page, replacing one they sent earlier, the old one's entry reads **"Identity document replaced by a newer pack"** (or "Transfer slip replaced by a newer pack"). Despite the wording, it means the guest sent a newer file.

*Emails* (see *The customer side* for the emails themselves)
- **Booking email sent**, **Confirmation email sent**
- **Booking email could not be sent — [reason]** / **Confirmation email could not be sent — [reason]**, where the reason is one of: *the mail service could not be reached*, *the mail service did not answer in time*, *the mail service was rate-limiting us*, *the mail service was failing*, *the mail service refused it*, *the mail service answered in a way we could not read*, *no mail service is configured*, *too many emails to that address today*. This entry is the only place staff find out a guest never got their email — send them the details (and the entry QR code) on WhatsApp.

The same entries, for every booking at once, are in **Admin → Audit log** (see *Staff access and administration*).

## Identity documents

The guest's IC (or passport) is required for registration. It is kept on the booking in the **Identity** panel at the bottom of the **Guest & stay** card, in private storage that nothing on the internet can reach.

### What the Identity panel shows

- A heading **Identity** and, when there are files, a count (**1 document**, **2 documents**).
- When there are none: *"No identity document on file."* — a gap someone should close.
- Each file on its own row: its name, then *"[size] · Attached by [name] · kept until [date]"*. "Attached by the guest" means the guest uploaded it from their own booking page.
- **Open** and **Remove** buttons, for those allowed.
- For people who cannot open identity documents, the file's name is replaced by the words **Identity document** (because a file's name often contains the guest's name and IC number), there is no Open button, and a line says *"Identity documents are opened only by staff with permission to view them."* They can still see *that* an IC is on file, when and by whom — so a guard can see registration was done without seeing the document.
- A booking can hold several identity documents (front and back, or everyone in a family).
- Files past their retention date disappear from the panel immediately, even before the nightly deletion runs.

### Who can do what

| Action | Permission | Default roles |
|---|---|---|
| See that an IC is on file | View bookings | All five |
| **Open** an IC | View identity documents | Front Office, Admin |
| **Attach ID** / **Remove** an IC | Edit bookings | Front Office, Admin |

Security, Housekeeping and Finance cannot open, attach or remove identity documents. An Admin can change who holds each permission in **Roles & staff** — note that someone given **Edit bookings** without **View identity documents** could remove an IC they cannot open.

### How to attach an identity document

**Who can do this:** anyone with **Edit bookings** — by default Front Office and Admin.

**Where:** booking page → **Guest & stay** → **Identity** panel → **Attach ID** (or **Attach another** when one is already on file).

**Steps:**
1. Press **Attach ID**. The dialog **Attach [guest]'s identity document** says *"Stored privately, opened only by staff who are allowed to, and every time somebody opens it is recorded. Deleted automatically once its retention period ends."*
2. Press **Choose file** and pick the photo or scan. Accepted: *"JPEG, PNG, WebP or PDF, up to 4 MB."* One file at a time. (On an iPhone, photos are converted to JPEG automatically.)
3. Press **Attach**. It is greyed out until a file is chosen, and while a file is too big.

**What happens next:** a message **File attached**; the file appears in the panel; History gets **Identity document attached** with your name. The accounting pack is rebuilt overnight to record that an IC was collected (the pack notes the IC, it never contains the image).

**Edge cases and limits:**
- Allowed at any status — including after check-out or on a cancelled booking.
- The file's type is checked from its contents, not its name; a renamed file that is not really a photo or PDF is refused.
- When the guest uploads their own IC from their booking page, it appears here as "Attached by the guest". If the guest uploads again, their newer file replaces their earlier one; files attached by staff are never replaced by the guest's.
- Whether a guest's own upload is enough for registration, or the desk should still look at the physical IC on arrival, is not settled yet — ask Jefferson/Jason.

**If you see an error:**
- *"[filename] is larger than 4 MB. A photograph taken on a phone is usually well under it."* / *"That file is larger than 4 MB. A photograph taken on a phone is usually well under it."* — choose a smaller file, or take a screenshot of the photo.
- *"That is not a JPEG, PNG, WebP or PDF. Attach a photograph or a PDF."* — the file is some other format (for example HEIC from a computer, or a Word document).
- *"That file is empty. Choose the file again."* / *"Choose a file to attach."* — pick the file again.
- *"The file did not arrive in one piece. Try attaching it again."* — usually a poor connection; try again.
- *"No retention period is set for this kind of document, so it cannot be stored yet."* — an Admin needs to set the period in **Property settings → Documents**.
- *"That file has no usable name."* — rename the file and try again.
- *"That booking no longer exists."* / *"That document could not be attached."* — reload and try again; if it persists, tell Jefferson.
- If several problems happen, the dialog stays open and lists each file with its reason.

### How to open (view) an identity document

**Who can do this:** anyone with **View identity documents** — by default Front Office and Admin.

**Where:** booking page → **Identity** panel → **Open** on the file's row.

**Steps:** press **Open**. The file opens in a new browser tab.

**What happens next:**
- **Every press of Open is recorded** — History gets **Identity document opened** with your name and the time. This is permanent.
- The link the browser is sent to works for **60 seconds only**. Copying the file's web address and sending it to someone will not work — it will have expired. Do not forward IC images outside the system.

**If you see an error** (shown as a plain text page in the new tab):
- *"You do not have access to this document."* — you do not hold **View identity documents**.
- *"Sign in to open this document."* — your session ended; sign in again.
- *"That document has been deleted."* — someone removed it, or it was replaced.
- *"That document has passed its retention period and is being deleted."* — its keep-until date has passed.
- *"That document does not exist."* / *"That document no longer exists."* — reload the booking.

### How to remove an identity document

**Who can do this:** anyone with **Edit bookings** — by default Front Office and Admin.

**Where:** booking page → **Identity** panel → **Remove** on the file's row.

**Steps:**
1. Press **Remove**. The dialog **Remove [file name]?** says *"The file is deleted from storage and cannot be recovered. The record stays in this booking's history."*
2. Press **Remove** (or **Keep document**).

**What happens next:** a message **Document removed**; the file disappears; History gets **Identity document removed** with your name. The earlier "opened" entries stay.

**Can it be undone?** No — the file is gone. If you removed the wrong file and still have the photo, attach it again.

**If you see an error:** *"That document has already been removed."* (someone beat you to it — reload); *"That document no longer exists."*; *"That document could not be removed."* — reload and try again.

### How long identity documents are kept, and automatic deletion

- By default an identity document is kept **12 months after the booking's check-out date** — the booked check-out date, even if the guest left early.
- If the booking's dates are changed, the keep-until date moves with them.
- For a **day pass** (which has no check-out), the 12 months count from when the file was uploaded.
- For a **cancelled** booking, the 12 months still count from the check-out date of the stay that never happened. Whether a cancelled booking's IC should be deleted sooner is not settled yet — ask Jefferson/Jason.
- The period is a setting, changed by an Admin in **Property settings → Documents** (see *Units and property settings*). Changing it re-dates every file already on file.
- Each row shows its **kept until** date.
- Every night at about 03:00 (Brunei time) the system deletes the files whose date has passed. Each one gets a History entry **Identity document deleted — retention period ended** (shown as System). A file stops being openable the moment its date passes, even before that night's run.
- Other documents have their own periods: transfer slips and accounting packs 7 years from when they were filed, inspection photographs 2 years.

## The entry QR code

Every confirmed booking gets an entry QR code. The guard scans it with the phone's normal camera at the gate and it opens that guest's card on the gate screen (see *Field screens*). The code by itself lets nobody in — only a signed-in guard can check a guest in with it. Anyone else who scans it sees only a first name and initial, the reference, the dates and whether the booking is confirmed.

The code is sent to the guest inside the confirmation email and shown on the guest's own booking page (see *The customer side*). This section is how the desk gets it to a guest who did not receive it.

### What the Entry QR code section shows

- **Draft, Held or Awaiting payment:** *"The code is issued when the booking is confirmed."*
- **Confirmed or Checked in:** the QR image (200 px, on white), the booking reference in large type beside it, the line *"The guest shows this at the gate. Send it to them on WhatsApp if they have not had it by email."*, a **Download image** button, and — for those allowed — **Replace code** at the top right. The section's info tooltip reads *"The guard scans this at the gate to open the booking. It lets nobody in by itself — only a signed-in guard can check a guest in."*
- **Completed, Cancelled, No show or Expired:** the section is not shown at all. There is nothing to forward.
- If the section says *"The code cannot be shown until this system's site address (SITE_ORIGIN) is set. Ask whoever maintains it."* — that is a setup problem, not a problem with the booking. Tell Jefferson.

### How to send a guest their entry code

**Who can do this:** anyone who can open the booking (**View bookings**, all five roles by default).

**Where:** booking page → **Entry QR code** → **Download image**.

**Steps:**
1. Press **Download image**. A picture file named like **PV-0123-entry-qr.png** is saved to your phone or computer.
2. Send it to the guest in their WhatsApp conversation.

**What happens next:** nothing is recorded — downloading is not logged. The code is the same one in the guest's email.

**If you see an error** (plain text page): *"This booking has no entry code to download."* — the booking is not Confirmed or Checked in (or it closed a moment ago). *"You do not have access to this booking."* / *"Sign in to download this code."* — permission or session problem.

### How to replace an entry code (Replace code)

Use this when a code has leaked or been forwarded somewhere it should not be — for example the guest posted a photo of it, or a previous guest's partner still has it.

**Who can do this:** anyone with **Edit bookings** — by default Front Office and Admin. An Admin can change this in **Roles & staff**. The guard cannot.

**Where:** booking page → **Entry QR code** section → **Replace code** (top right).

**Steps:**
1. Press **Replace code**. The dialog **Replace the entry code for PV-…?** warns: *"The current code stops working at once — including the one in the guest's confirmation email and any copy already forwarded. Send the guest the new code afterwards."*
2. Press **Replace code** (or **Keep this code**).
3. Press **Download image** and send the new code to the guest.

**What happens next:**
- A message **"New entry code for PV-…"** — *"Download it and send it to the guest. The old one no longer works."*
- The old code stops working immediately. Scanning it gives the "not found" page.
- The confirmation email is **not** sent again — the guest's email still shows the old, dead code. You must send the new one yourself.
- The guest's own booking page shows the new code.
- History: **Entry QR code replaced — the old code no longer opens this booking**, with your name.

**Edge cases and limits:** only on **Confirmed** or **Checked in** bookings. You can replace a code as many times as needed.

**Can it be undone?** No — the old code cannot be brought back. Replace again if needed, and send the newest one.

**If you see an error:**
- *"This booking is not confirmed yet, so it has no code to replace."*
- *"This booking is closed, so there is no code to replace."*
- *"A new code could not be made. Try again."*
- *"The code could not be replaced. Reload the screen."* / *"That booking no longer exists."* — reload.

## The accounting pack on the booking

The accounting pack is a single PDF per booking for the accountant: the itemised booking, a record of each payment and who confirmed it (and what they saw in the bank), the transfer slips copied in, and a record that the guest's IC was collected — when and by whom. **The IC image itself is never put in the pack.** What is in a pack, and how packs are used by Finance, is covered in *Deposits, reports and finance*; this is what staff see on the booking.

### What the Accounting pack section shows

- **The newest pack**, as a row with its name, *"[size] · Assembled by the system · kept until [date]"* and an **Open** button. There is no Remove — nobody can delete a pack.
- **No pack yet, no verified payment:** *"No pack yet. One is assembled automatically once a payment has been verified."*
- **No pack yet, but a verified payment exists:** *"Not assembled yet. It is built overnight."*
- **While a pack is being built:** a moving bar with *"Assembling the pack"*, *"Rebuilding the pack"* or *"Rebuilding to include the latest payment"*. Right after a payment is verified the page watches for the new pack for about two minutes and shows it the moment it arrives.
- **Pack out of date:** *"The booking has changed since this was assembled. Rebuild it now, or leave it — it is rebuilt overnight."* (or just *"It is rebuilt overnight."* for people who cannot rebuild), and a **Rebuild now** link on the section's title line.
- The section's info tooltip: *"Built when a payment is verified, and rebuilt overnight after any change to the booking, its payments or its documents — or now, from Rebuild. Earlier versions stay on the history. The identity document is referenced, not copied in."*

**When a pack is made:** automatically a few seconds after a payment is verified or cash is recorded against the booking; and every night at about 02:00 (Brunei time) for any booking whose pack is missing or out of date — a slip or IC attached later, an edit, a check-out, a failed earlier attempt. The nightly run handles up to 25 bookings, so after a very busy day some packs may take more than one night. Recording or verifying the **security deposit** alone does not make a pack.

**When a pack is replaced**, the old PDF is deleted and only the History line **Accounting pack replaced by a newer pack** remains. Only the newest pack can be opened.

### How to open the accounting pack

**Who can do this:** anyone who can open the booking — all five roles by default.

**Where:** booking page → **Accounting pack** → **Open**. It opens in a new tab. Each open is recorded in History as **Accounting pack opened**. The same 60-second link rule and error pages apply as for identity documents.

### How to rebuild the accounting pack now

**Who can do this:** anyone with **Verify payments** — by default Front Office, Finance and Admin. An Admin can change this in **Roles & staff**.

**Where:** booking page → **Accounting pack** → **Rebuild now** (only shown when the pack is out of date and nothing is already being built).

**Steps:** press **Rebuild now** and wait a few seconds.

**What happens next:** a message **Accounting pack rebuilt** — *"It now carries everything on the booking."* The new pack replaces the old one; History gets the new pack's entry and **Accounting pack replaced by a newer pack**.

**If you see an error:**
- *"There is no verified payment on this booking, so there is no pack to assemble."* — a pack needs at least one verified payment.
- *"The pack could not be rebuilt. Try again in a moment."* — try again; if it keeps failing, leave it for the nightly run and tell Jefferson.
- *"That booking no longer exists."* — reload.

## Rules the system enforces

- **The status only moves along the allowed paths** listed in *Every booking status*. Every screen decides which buttons to show from those paths, and the database checks again when you press — so a button that disappears after a reload means someone else moved the booking.
- **Closed is closed.** Completed, Cancelled, No show and Expired never change again; a returning guest is a new booking. This keeps the history honest.
- **Check-in needs the security deposit held in full**, and checking in takes no money. The deposit is taken when the booking is made, because it is what secures the booking.
- **A day pass is admitted, not checked in**, only on its own date, and only when fully paid — because admitting closes it and nobody meets a day visitor again to collect what is owed.
- **Cancelling and marking a no-show settle the deposit at the same moment** — kept (the default, and always for a no-show) or given back (a cancellation the desk chooses). A kept deposit can never be changed afterwards, and no money can be taken on a booking that closed without a stay.
- **A cancellation needs a reason**; a no-show does not. A no-show is only allowed from the arrival day.
- **Cancelling and no-shows free the unit**; checking out does not shorten the booked dates.
- **Checked-in and closed bookings cannot be edited.** The one exception is the party: **Change** on the Party line still works on a checked-in guest (never on a closed booking).
- **Notes are permanent**; corrections are new notes. Anyone who can see the booking can add one.
- **The History is permanent** and records who did what, including every time someone opened a document.
- **Identity documents:** visible as "on file" to all who can see the booking, opened only by holders of *View identity documents*, every opening logged, links valid 60 seconds, deleted automatically when their retention date passes.
- **The entry QR code** is issued automatically when a booking is first confirmed, shown only while the booking is Confirmed or Checked in, grants nothing without a signed-in guard, and can be replaced (never just switched off).

## Likely questions

**Q: The Check in button is missing. Why?**
A: It only shows on a **Confirmed** stay, and only to people with *Check guests in* (Security, Front Office, Admin by default). If the booking is Held or Awaiting payment, it has to be confirmed first (see *Payments*). If it is a day pass, the button is **Admit** instead. If it is already Checked in, you will see **Check out**.

**Q: I press Check in and it only gives me a Close button.**
A: The security deposit is not held in full. The dialog says which: never taken (record it on the Money card), a transfer not yet verified (verify it in the Verification queue, or take it in cash), or short (use **Top up the deposit**). Then press Check in again.

**Q: The guest has paid the deposit but still owes for the room. Can I check them in?**
A: Yes. Only the deposit blocks check-in. Take the room money from the Money card (**Record a payment**) whenever they pay it — ideally before they leave, because once the booking is Completed, cash can no longer be recorded against it.

**Q: The guest arrived a day early. Can I check them in?**
A: The portal allows it and warns you the booking is dated another day. But checking in does not change the dates — if they are staying an extra night, edit the booking (and its price) *first*, because a checked-in booking cannot be edited. Whether the unit is ready is your call; the app does not check.

**Q: The guest is already checked in and more people have turned up. Can I charge for them?**
A: Yes. Press **Change** beside **Party** on the booking's Guest & stay card and enter the new numbers. A stay costs more only above the unit type's maximum guests; the extra-guest charge is then added for every night of the booking, and what is owed shows on the Money card and on the guard's Gate card as cash to take. See *Finding and changing bookings → How to change the party (more or fewer people)*.

**Q: I checked in the wrong guest / the wrong booking. How do I undo it?**
A: You cannot — there is no undo for check-in. The booking can only be checked out now. Add a note explaining the mistake and tell Jefferson/Jason.

**Q: The guest is leaving two days early. What happens to the other nights?**
A: Check them out as normal. The remaining booked nights stay blocked — the unit cannot be resold for them, and a Completed booking cannot be edited. This is not settled yet — ask Jefferson/Jason.

**Q: How do I cancel a booking where the guest is already in the room?**
A: You cannot cancel a Checked in booking. Check them out instead.

**Q: A guest cancelled. Do we keep the BND 100?**
A: By default, yes — the cancel dialog has **Keep it — the guest cancelled** already selected. Choose **Give it back** only if the booking was made in error or cancelled by us. Money paid for the room itself is refunded by hand, outside the system.

**Q: I cancelled and chose the wrong deposit option. Can I change it?**
A: No. A kept or returned deposit is final. Tell Jefferson/Jason.

**Q: I cancelled the wrong booking.**
A: A cancelled booking cannot be reinstated. Create a new booking for the guest and add a note on both. Tell Jefferson/Jason if a deposit was kept on the wrong booking.

**Q: The guest never showed up. What do I do?**
A: From their arrival day onwards, open the "…" menu and choose **Mark as no-show**. The deposit is kept and the unit goes back on sale for the nights they did not use. If they turn up later, they need a new booking.

**Q: "Mark as no-show" isn't in the menu.**
A: It only appears on a Confirmed booking, from the arrival day on, for people with *Cancel bookings* (Front Office, Admin). Before the arrival day it is hidden on purpose.

**Q: Does the guest get an email when I cancel?**
A: No. The system only ever sends two emails — when the booking is made and when it is confirmed. Tell the guest yourself.

**Q: The guest says the QR code in their email doesn't work.**
A: Check the booking's status — the code only works while it is Confirmed or Checked in. Check the History for **Entry QR code replaced** — if someone replaced it, the email's code is dead. Download the current code from **Entry QR code → Download image** and send it on WhatsApp.

**Q: A guest shared their QR code on social media. What do I do?**
A: Press **Replace code** (Front Office or Admin), then download the new code and send it to the guest. The old one stops working immediately. The code never lets anyone in by itself — only a signed-in guard can check a guest in.

**Q: The Entry QR code section has disappeared.**
A: It is hidden once the booking is Completed, Cancelled or No show. Before confirmation it says the code is issued on confirmation.

**Q: I'm a guard. Why can I see that an IC is on file but not open it?**
A: Opening identity documents needs *View identity documents* (Front Office and Admin). You can still see that it was collected, when and by whom.

**Q: Can I send the guest's IC photo to someone by copying the link?**
A: No. The link works for 60 seconds, every opening is recorded against your name, and IC images must not leave the system.

**Q: Where did the guest's IC go? It was there last month.**
A: Check the History. **Identity document deleted — retention period ended** means its keep-until date passed and the system deleted it. **Identity document removed** shows who removed it. A deleted IC cannot be recovered.

**Q: The History says "Identity document replaced by a newer pack". What pack?**
A: That wording is misleading. It means the guest uploaded a newer IC from their own booking page, which replaced the one they sent before.

**Q: The History says "System" did something. Who is that?**
A: No staff member. It is either the customer acting on the website (booking online, "I have made the transfer", uploading a document, finding their booking) or the system's nightly jobs.

**Q: The History says "Created — walk-in, paid on the spot" but the guest hasn't paid.**
A: A booking left for the guard to collect at the gate also shows that wording, even though nothing was taken. Check the Money card for what has actually been paid.

**Q: Can I edit or delete a note I wrote?**
A: No. Nobody can. Add a new note correcting it.

**Q: Will the cleaner see my note?**
A: Only if you chose **Housekeeping** under *Who is this for?* Internal notes are never shown on the field screens. The guest never sees any note.

**Q: The accounting pack says it is out of date.**
A: Something changed after it was made (a slip or IC attached, the booking edited, checked out). It will be rebuilt overnight, or press **Rebuild now** if you hold *Verify payments*.

**Q: Where is the old accounting pack we sent the accountant?**
A: When a pack is rebuilt, the old PDF is deleted; the History keeps a line **Accounting pack replaced by a newer pack** with the date. Only the current pack can be opened.

**Q: The page says "This page didn't load".**
A: Something went wrong on the server, or you tried an action you are no longer allowed to do (for example your permissions were just changed). Press **Try again**; if it keeps happening, give Jefferson the reference shown on the screen.

**Q: The booking is still "Held" after a week. Will it expire?**
A: No. Holds never expire on their own — the unit stays reserved until someone confirms the money or cancels the booking. Chase the guest or cancel it.

## Terms

- **Booking page** — the portal screen for one booking, at /bookings/ and the reference.
- **Booking reference** — the booking's code, for example PV-0123; not case-sensitive.
- **Status** — where a booking has got to: Draft, Held, Awaiting payment, Confirmed, Checked in, Completed, Cancelled, No show or Expired.
- **Held** — reserved for a guest who has not paid; never expires on its own.
- **Awaiting payment** — a bank transfer has been reported and is waiting to be checked.
- **Confirmed** — secured by the deposit, or paid where no deposit is quoted; the entry code is issued.
- **Checked in** — the guest has the keys and is in the unit.
- **Completed** — a stay that has checked out, or a day pass that has been admitted. Final.
- **Cancelled** — called off before arrival; the unit is released. Final.
- **No show** — the guest never arrived; the deposit is kept and the unit released. Final.
- **Expired** — a hold that lapsed; not used today.
- **Closed booking** — any booking that is Completed, Cancelled, No show or Expired; it can never change again.
- **Admit** — letting a day-pass visitor in; it closes the pass.
- **Check in / Check out** — the moves that start and end a stay; neither takes money.
- **Kept deposit** — a security deposit forfeited when a booking is cancelled or a no-show; counted as revenue that day.
- **Returned deposit** — a deposit given back on a cancellation the desk chose to refund; recorded, handed back outside the system.
- **Lapsed promise** — a deposit transfer the customer promised but nobody verified before the booking closed; nothing is kept.
- **Note** — a permanent staff comment on a booking, for the office (Internal) or for the cleaner (Housekeeping).
- **History** — the permanent record of everything that happened to a booking, who did it and when.
- **Identity document** — the guest's IC or passport copy, stored privately on the booking.
- **Retention period** — how long a document is kept before automatic deletion (IC: 12 months after check-out by default).
- **Entry QR code** — the code the guard scans to open the booking at the gate; issued on confirmation.
- **Replace code** — makes a new entry code and kills the old one.
- **Accounting pack** — the PDF record of a booking for the accountant, built automatically.
- **System** — shown as the actor when no staff member did something (the customer online, or a nightly job).

---

# 4. Finding and changing bookings

## What this area is for

This area covers the screens staff use to **find** a booking, to **see what is happening today and this month**, to **hear about new work**, and to **change a booking after it has been made**:

- **Dashboard** (sidebar: Overview → Dashboard) — today at a glance: who arrives, who leaves, how many bookings are waiting on a payment check, and how many units are occupied tonight.
- **All bookings** (sidebar: Bookings → All bookings) — the register of every booking, with search, filters and pages. It replaces the booking spreadsheet.
- **Calendar** (sidebar: Bookings → Calendar) — the booking calendar: one row per unit, one column per night, a coloured bar for everything that holds a unit. It answers "what is free, and when".
- **Search** (the **Search** box at the top right of every portal screen, or Ctrl K / ⌘K) — find a booking, a payment waiting to be checked, a deposit, a unit or a screen from anywhere.
- **Notifications** (the bell at the top right of every portal screen) — new online bookings, payments waiting to be verified, booking emails that could not be sent, and extra guests reported at the gate.
- **Ask anything** (violet-blue, with a four-pointed star, just left of the search box) — opens the ChatGPT help desk in a new tab, to ask how to do anything in the system.
- **Edit a booking** (the **Edit** button on a booking's own page) — change the dates, unit, guests, extras, late check-out, the guest's name and phone, the vehicles and (for staff allowed to) the discount. The screen is titled **Edit PV-XXXX**. Staff may call this "amending" a booking; on screen it is always **Edit**.
- **Change the party** (the **Change** button beside **Party** on a booking's own page) — change how many people a stay or day pass is for, including a guest already checked in.

All of these are in the staff portal at **portal.bruneiapartment.com**. "Today" everywhere in this area means **today in Brunei time**, whatever the clock on the device says.

What this area does not cover: making a new booking and how prices are worked out (see *Creating bookings*), the booking's own page, its statuses, check-in, check-out, cancelling and history (see *The booking's own page*), taking money (see *Payments*), deposits after check-out and CSV exports from the finance screens (see *Deposits, reports and finance*), and the emails the system sends (see *The customer side → Emails*).

---

## Screens

### Dashboard

**Who can open it:** anyone holding the **View bookings** permission — by default all five roles (Admin, Front Office, Security, Housekeeping, Finance). An Admin can change who holds it in **Roles & staff**.

**Who never sees it:** a staff member whose roles only let them work in the field is sent straight to their field screen instead of the Dashboard — even if they follow an old bookmark to it:

- the default **Security** role is sent to the **Gate** screen;
- the default **Housekeeping** role is sent to the **Departures** screen;
- someone who can do both field jobs, and nothing office-side, is sent to the **Field screens** chooser.

A person who also holds an office role (for example Front Office as well as Security) lands on the Dashboard as normal.

If the account holds no roles at all, or has lost **View bookings**, the Dashboard shows: **"You don't have access to this screen"** — "Seeing today's arrivals and departures needs the "View bookings" permission. Ask an administrator if this is part of your job."

**What is on it:**

The header shows **Dashboard** with today's date under it (for example "Thu 18 Sept"), and two buttons: **All bookings** and **New booking**.

Four figures ("tiles") come first. They are figures only — clicking them does nothing.

| Tile | What it counts |
|---|---|
| **Arrivals today** (green dot) | Bookings with status **Confirmed** whose check-in date is today. |
| **Departures today** (teal dot) | Bookings with status **Checked in** whose check-out date is today. |
| **Awaiting payment** (amber dot) | Every booking, of any date and any type, whose status is **Awaiting payment** — that is, a bank transfer has been promised and nobody has verified it yet. It is not limited to today. |
| **Occupied tonight** — "of N units" | Bookings that are **Confirmed** or **Checked in** and whose stay covers tonight (a guest arriving today counts; a guest who left this morning does not). "of N units" is every unit on record, including any that are out of service. |

What the tiles **do not** count:

- A booking that is **Held** or **Awaiting payment** and arrives today is **not** in "Arrivals today" and not in the "Arriving today" list — including a booking the office set up for the guard to collect payment at the gate. Only Confirmed bookings are listed.
- Once a guest is checked in, they drop off "Arrivals today". Once a guest is checked out, they drop off "Departures today".
- A guest still **Checked in** whose check-out date was yesterday or earlier is not in "Departures today".
- **Day passes** are not counted in arrivals, departures or occupancy — a day pass occupies no unit.
- **Long leases** set up on a unit are not bookings, so they do not count towards "Occupied tonight".
- Held and Awaiting-payment bookings do not count as occupied tonight, even though they hold the unit.

Below the tiles are two lists.

**Arriving today** — "Confirmed bookings checking in today, by unit. Each one's security deposit is already held — check-in takes nothing." Sorted by unit. Columns:

- **Reference** — the booking reference, for example PV-4821.
- **Guest** — the guest's name.
- **Unit** — the unit reference.
- **Vehicle** — every registration on the booking; **None** if the guest said they are arriving without a vehicle; "—" if no plate was ever recorded.
- **Checking out** — the check-out date.
- **Total** — the booking total in BND.
- **Status** — the status badge.

When there are none: **"No arrivals today"** — "Nothing is due to check in. Confirmed bookings appear here on their check-in date."

Note: the sentence "Each one's security deposit is already held" is not true of a booking whose deposit was waived when it was made — that booking holds no deposit. Check-in itself refuses a booking whose deposit is not held in full (see *The booking's own page → How to check a guest in (from the portal)*).

**Leaving today** — "Checked-in guests due out today. Each unit needs an inspection before its deposit can be released." Sorted by unit. Columns:

- **Reference**, **Guest**, **Unit**.
- **Checked in** — the stay's check-in date.
- **Deposit held** — the security deposit actually recorded against the booking, in BND. It shows **Not collected** (hover text: "No security deposit is held against this booking") when there is no deposit record — for example a booking whose deposit was waived.
- **Status**.

When there are none: **"No departures today"** — "Nothing is due out. Checked-in bookings appear here on their check-out date."

**The rows on the Dashboard do not open the booking.** To open one, copy the reference into **Search** (top right) or use **All bookings**.

The Dashboard reads live data each time it is opened. It does not refresh by itself — reload the page (or open it again from the sidebar) to see changes made since.

### All bookings (the bookings register)

**Who can open it:** anyone holding **View bookings** — by default all five roles. An Admin can change this in **Roles & staff**. Without it: **"You don't have access to this screen"** — "Seeing bookings needs the "View bookings" permission. Ask an administrator if this is part of your job."

The screen is titled **Bookings** — "Every booking across all streams — the single source of truth."

**Type tiles.** Three tiles across the top: **Short stay**, **Day pass**, **Tenancy**, each with a coloured dot (indigo, orange, magenta) and a count.

- The counts respect every filter you have set **except** the type itself — so choosing "Short stay" still shows how many day passes match your other filters.
- Clicking a tile shows only that type. Clicking the tile that is already selected clears it and shows all types again. A tile selects one type at a time; to see two types together, use the **Type** filter.
- **Tenancy** always reads 0: long leases are set up on the unit (see *Units and property settings*), not as bookings, so none appear in this register.

**The filter row** (directly above the table). Every filter takes effect as soon as you choose it — there is no Apply button.

- **Search box** — placeholder "Reference, guest, phone or unit". Finds bookings whose **reference, guest name, phone number or unit reference contains** what you type, ignoring capitals. "4821", "lim", "8959" and "3B" all work. It does **not** search email addresses, vehicle registrations, notes or amounts. The search runs when you stop typing for a moment, or at once when you press Enter. Press Esc, or click the small cross, to clear it. The characters , ( ) " \ * % _ are ignored, and only the first 80 characters count. A phone number is matched as it was stored — numbers taken with a country code are stored like "+673 8959798", so typing "8959798" finds it but "6738959798" (no space) does not.
- **Status** — tick one or several statuses: Draft, Held, Awaiting payment, Confirmed, Checked in, Completed, Expired, Cancelled, No show. Ticking "Confirmed" and "Checked in" together is the way to see who is actually booked in or in the building.
- **Type** — tick one or several of Short stay, Day pass, Tenancy (the same thing the tiles set, but allowing more than one).
- **Stay date** — pick a first and last day. A booking matches if **at least one of its nights falls on the days you picked** (not only bookings that *start* in the range). A guest who checks out on the first day you picked is not included; a guest who checks in on the last day is. **A Stay date filter hides every day pass**, even one sold for a day inside the range — to find day passes by day, use the Type filter and read the Dates column instead.
- **Clear** (funnel icon) — appears once any filter is on; clears them all.

The browser's **Back** button undoes the last filter change. The address of the page carries the filters, so a filtered view can be bookmarked or the link sent to a colleague — they will see the same filters (as long as they may open the screen).

**Buttons on the right of the filter row:**

- **Download CSV** — only shown to holders of **Edit settings, roles & the unit registry** (Admin only by default). See *How to download the bookings as a spreadsheet* below.
- **New booking** — opens the New booking screen. The button is shown to everyone who can open the register; the New booking screen itself needs the **Create bookings** permission (Front Office and Admin by default).

**The table.** Newest booking *taken* first (the booking made most recently is at the top of page 1), not sorted by arrival date. Columns:

| Column | What it shows |
|---|---|
| **Reference** | The booking reference, e.g. PV-4821. |
| **Guest** | The guest's name, with their phone number underneath. |
| **Type** | Short stay, Day pass or Tenancy, with its coloured dot. |
| **Unit** | The unit reference, or "—" for a day pass (hover: "Occupies no unit"). |
| **Dates** | For a stay: check-in → check-out, with the number of nights underneath. For a day pass: the day it is for, with "One day" underneath. "—" (hover: "No stay dates") if there is neither. |
| **Guests** | Everyone on the booking, including the young children who are not charged. The split is on the booking's own page. |
| **Total** | The booking total in BND. |
| **Status** | The status badge (colours below). |

Click anywhere on a row to open that booking's page. The row can also be opened in a new tab (middle-click or Ctrl-click the reference).

**Status badge colours** (the same everywhere in the portal):

- **Confirmed** — green.
- **Awaiting payment** — amber.
- **Checked in** — teal.
- **Draft**, **Held**, **Completed** — grey.
- **Expired**, **Cancelled**, **No show** — red.

**Pages.** Under the table: "1–25 of 47 bookings", a **Rows per page** choice (10, 25 or 50; 25 is the default), and page buttons (**First page**, **Previous page**, page numbers, **Next page**, **Last page**). Changing a filter always takes you back to page 1. If a bookmarked page number no longer exists (because bookings were cancelled or the filter now matches fewer), the screen shows the last page that does exist.

**When the table is empty:**

- With no filters: **"No bookings yet"** — "Bookings created in the portal or from the public site appear here." with a **Create a booking** button.
- With filters: **"No bookings match these filters"** — "Try a wider date range, or clear the filters to see everything." with a **Clear filters** button.

The register does not refresh by itself; reload to see bookings made since the page was opened.

### Calendar (the booking calendar)

**Who can open it:** anyone holding **View bookings** — by default all five roles. An Admin can change this. Without it: **"You don't have access to this screen"** — "Seeing the calendar needs the "View bookings" permission. Ask an administrator if this is part of your job."

The screen is titled **Booking calendar** — "Every stay, hold and lease across the building, by unit and by night. Day passes occupy no unit and are not on this grid."

**How to read it:**

- **One row per unit**, grouped by unit type. Each group starts with a band naming the type and how many units of it are shown ("Semi-detached · 6 units"). Units are listed in reference order. The unit column stays in place when you scroll sideways.
- **One column per night** of the month, headed by the weekday and the date. **Today's date** has a small outlined box around it. A slightly stronger line marks the start of each week (Monday).
- **A bar** is drawn across every night a unit is held. The bar covers the **nights** of the stay — a stay from the 14th to the 16th covers the 14th and the 15th. **The check-out day itself is left free**, because the next guest can check in that day.
- The bar shows the **guest's name** (or the tenant's name for a lease, or "Out of service"). A one-night bar is too short to show the name.
- A bar that **started before this month** has a small left arrow at its left edge and runs from the first column; a bar that **carries on into next month** (or has no end date) has a small right arrow at its right edge.
- **Hover over a bar** to see the name, the dates ("Mon 14 Sept → Wed 16 Sept", or "Since …" for an out-of-service unit, or "… → no end date" for an open lease), the status badge and the booking reference.
- **Click a bar** to open it: a booking bar opens the booking's page; a lease bar or out-of-service bar opens the unit's page.

**What the colours mean** — hover over the small (i) icon beside the counts for the key. A bar's colour is its status badge colour:

- **Draft** (grey) — "Started, not yet held."
- **Held** (grey) — "Held for a guest who has not paid yet."
- **Awaiting payment** (amber) — "A bank transfer is waiting to be verified."
- **Confirmed** (green) — "Paid, or secured by the deposit."
- **Checked in** (teal) — "The guest is in the unit."
- **Completed** (grey) — "The stay has ended; its booked nights stay blocked." A guest who checked out early still holds the rest of the nights they booked on the calendar.
- **No show** — listed in the key as "Nobody arrived; the booked nights stay blocked." **This line of the key is out of date:** a booking marked No show frees its unit, is **not** drawn on the calendar, and its nights can be sold again.
- **Leased** (grey) — "Let on a long lease — month to month if it has no end date."
- **Out of service** (red) — "Nobody can be put in it until it is returned to service." Drawn from the day the unit went out of service onwards.

**Cancelled** and **Expired** bookings are never drawn — they free the unit. Day passes are never drawn.

**The controls line:**

- **Type** — tick one or more unit types to show only those. **Clear** (funnel icon) clears the type choice.
- **Show empty units** — by default the calendar only shows units that have something on them this month. Tick this to show every unit, including the empty ones. With it unticked, the count reads, for example, "6 of 48 units".
- **The counts** — for example "48 units · 7 stays · 1 lease · 1 out of service" (a part that is zero is left out). "Stays" counts every booking bar on the chart this month, whatever its status.
- **Month and arrows** — the month being shown, with **Previous month** and **Next month** arrows. There is no "Today" button: opening Calendar from the sidebar always returns to the current month.
- **New booking** — only shown to holders of **Create bookings** (Front Office and Admin by default).

**When the calendar is empty:**

- **"No units yet"** — "The building has no units on record. An administrator sets them up on the unit registry screen."
- **"No units match this filter"** — "Try a different unit type, or clear the filter to see the whole building." with **Clear filters**.
- **"Nothing booked in September 2026"** (the month shown) — "No unit has a stay, a lease or an out-of-service period this month. The grid is showing only the units something happens in." with **Show every unit**.

The calendar reads live data when it is opened; reload to see changes.

### Search (top of every portal screen)

**Who can use it:** everyone signed in to the portal. What it finds depends on your permissions (below).

**Where:** the **Search** box at the top right of every portal screen, showing "Ctrl K" (or "⌘K" on a Mac/iPhone/iPad). On a narrow screen or phone it is a magnifying-glass icon. Pressing **Ctrl K** (or **⌘K**) anywhere in the portal opens or closes it.

**What it finds** (placeholder: "Reference, guest, phone, unit or screen…"):

| Group heading | What matches | Who sees this group | Opening a result goes to |
|---|---|---|---|
| **Screens** | A portal screen whose name, or whose sidebar group name, contains what you typed ("cash" finds Cash payments and Daily cash-up; "finance" lists the Finance screens). Only screens you are allowed to open. Public site and Field screens are not listed. | Everyone | That screen |
| **Bookings** | Bookings whose **reference, guest name, phone or unit** contains the text. Each shows the reference, guest name, status and unit · dates (or "Day pass"). | **View bookings** (all roles by default) | The booking's page |
| **Payments to verify** | Payments **waiting to be verified** whose booking reference, guest name, phone or unit contains the text. Each shows "Bank transfer to verify · BND …". Payments already verified are not listed. | **Verify payments** (Front Office, Finance, Admin by default) | The Verification queue, searched for that reference |
| **Deposits** | Security deposits whose booking reference, guest name or unit contains the text (not the phone). Each shows the deposit's stage, amount and unit. | **View bookings** | The deposit's own page |
| **Units** | Units whose reference or unit-type name contains the text. Each shows the unit type and its current status. | **Manage units** (Front Office, Housekeeping, Admin by default) | The unit's page |

Rules:

- **Screens are matched from the first letter; records (bookings, payments, deposits, units) need at least 2 characters.**
- At most **5 results per group**. If what you want is not among them, type more of it, or use the search box on All bookings, which pages through every match.
- It does **not** search email addresses, vehicle registrations, notes or amounts.
- The same characters are ignored as on All bookings (, ( ) " \ * % _), and at most 80 characters are used.
- Results appear as you type. Use the **up and down arrow keys** to move, **Enter** to open the highlighted result, or click one. **Esc** closes the search. Each time you open it, it starts empty.

**Messages you may see in the search panel:**

- Before typing: "Find a booking, payment, deposit or unit by its reference, the guest's name or phone, or the unit — or type a screen's name to go there."
- "Searching…" — the search is running.
- **"Nothing matches "…"."** — nothing you are allowed to see matches. Check the spelling, try part of the reference or the last digits of the phone, or remember that only 1 character searches screens only.
- **"Search is not available right now. Try again in a moment."** — the search could not reach the system (often a signal problem, or you have been signed out). Try again; if it persists, reload the page and sign in again.

### Notifications (the bell)

**Who sees it:** everyone signed in to the portal. What appears in it depends on your permissions.

**Where:** the bell icon at the top right of every portal screen, next to the light/dark theme switch.

**What raises a notification** — only four things:

| Notification title | When it appears | Who is told | Clicking it opens |
|---|---|---|---|
| **New online booking — short stay** / **New online booking — day pass** | A customer made a booking themselves on the public website. | Holders of **View bookings** (all roles by default) | The booking's page |
| **Payment to verify** | A booking was sent for payment verification — a customer pressed "I have made the transfer" on the website, or a staff member used **Record the deposit → Bank transfer — verify later** on a booking that was still **Held**. A booking created on New booking with bank transfer, and a stay transfer raised with **Record a payment**, do **not** raise this notification — tell a colleague who verifies payments, or check the queue yourself. The line shows the amount when there is one. | Holders of **Verify payments** (Front Office, Finance, Admin by default) | The **Verification queue** (not the booking) |
| **Booking email could not be sent** / **Confirmation email could not be sent** / **Email could not be sent** | The system tried to email a guest about their booking and the email failed. The reason is in the booking's history. | Holders of **View bookings** | The booking's page |
| **Extra guests at the gate** / **Visitors added at the gate** | The guard pressed **Extra** on the Gate: more people arrived than the booking is for. **Extra guests at the gate** means he told the office — change the booking's party (**Change** on the Party line) if an extra charge is due. **Visitors added at the gate** means he added them to a day pass and took the difference in cash himself, so it is only for your information. The line shows how many, e.g. "PV-1001 · Guest name · 2 more". The guard's note is in the booking's **Notes**. | Holders of **Edit bookings** (Front Office and Admin by default) | The booking's page |

Each line shows the title, then the booking reference · guest name (· amount, or · "2 more" for extra guests), and how long ago it happened ("5m", "2h 10m", "3 days").

Rules:

- **You are never notified of something you did yourself.** If you raised the transfer, your colleagues get "Payment to verify"; you do not.
- The bell shows the **newest 20** notifications from the **last 14 days**. Older ones are gone from the bell, but the events are still in the booking's history and the audit log.
- If the booking has since been removed, the line reads "A booking since removed" and cannot be clicked.
- Password-reset emails that fail are not shown here.
- Hold expiry is never notified, because holds do not expire on their own.
- The bell checks for new notifications about once a minute while the portal tab is on screen, and immediately when you come back to the tab.

**Read and unread:**

- A **small dark dot on the bell** means there is at least one notification you have not seen. (It is a dot, not a number.)
- Opening the bell marks **everything in it as seen** — there is no marking one at a time. The panel header shows "**N new**" for the ones that were new when you opened it, and each of those has a small dot beside it for as long as the panel stays open. When nothing is new, the header reads "**Last 14 days**".
- "Seen" is stored against your staff account, not the device, so opening the bell on the office computer also clears it on your phone. Each staff member has their own read state — you opening the bell does not clear it for anyone else.
- Seeing a notification does not do anything to the booking or payment — the payment still has to be verified in the Verification queue.

Messages in the bell:

- "Loading…" — the first check has not come back yet.
- **"Notifications could not be loaded. They will try again shortly."** — the check failed (poor signal, or signed out). It tries again automatically.
- **"Nothing in the last 14 days. New website bookings, payments to verify and emails that could not be sent will show here."** — nothing to show.

### Edit booking (changing a booking)

**Who can open it:** holders of **Edit bookings** — Front Office and Admin by default. An Admin can change who holds it in **Roles & staff**. Security (the guard), Housekeeping and Finance cannot edit a booking. Without the permission the screen shows **"You don't have access to this screen"** — "Changing a booking needs the "Edit bookings" permission. Ask an administrator if this is part of your job."

**Where:** open the booking (from All bookings, Calendar, Search or a notification) → **Edit** (pencil icon) beside the check-in / cancel buttons at the top of the booking's page. The Edit button only appears when the booking can still be changed and you hold **Edit bookings**.

The screen is titled **Edit PV-XXXX** — "Everything that changes is recorded against the booking." with a **Back** button.

It has three parts:

1. **The dates card** at the top: **Check-in** and **Check-out** date fields, a **Check these dates** button, and **Reset dates** (only shown once the dates differ from the booking's own).
2. **The form**, in sections: **Unit**, **Guests**, **Extras**, **Guest**, **Vehicles**, **Discount** (only for holders of **Discount bookings**), and **Note**.
3. **The price panel** on the right, headed **After this change**: the new dates, the unit and number of guests, the new price lines and total, a sentence about the difference from the old total, and the **Review change** button.

The sections in detail:

- **Unit** — "N available for these dates", and a list of every unit free for the whole of the chosen dates, **of any unit type**, written as "3B-04 — Semi-detached". The guest's present unit is marked **(current)** if it is still free for the new dates. Units that are out of service are never offered.
- **Guests** — **Over 3** (guests above the exempt age; at least 1) and **Aged 3 and under** (not charged). The age in both labels follows the exempt age set in Property settings (3 by default).
- **Extras** — one number box per extra currently on sale (for example a sofa bed), each with a hint of its fee and, where stock is counted, how many are free for these dates ("BND 28.00 · 2 free", "none free"). An extra the booking already holds that has since been taken off sale or removed is still shown, marked "no longer offered". Then **Late check-out, hours** (0 to 12).
- **Guest** — **Name** and **Phone** (with a country-code selector, Brunei by default).
- **Vehicles** — one **Registration** box per car, **Add another vehicle** (up to 10), a cross to remove a row, and the **Arriving without a vehicle** tick box ("Only for the rare guest with no car. Security check arrivals by registration, so a booking with neither a plate nor this box ticked cannot be matched at the gate."). Under the rows: "The [unit type] includes N parking spaces." — and a warning once more cars are entered than the unit includes: "…The extra car is still recorded so Security can match it at the gate, but it may not have a bay." The extra plates are still saved; nothing is refused.
- **Discount** (only for **Discount bookings** holders — Front Office and Admin by default) — **Type**: **No discount**, **Amount off, in BND**, or **Percentage off**; then **Amount, BND** or **Percentage**; then **Reason**.
- **Note** — **Why is this changing? (optional)**, up to 280 characters, placeholder "Guest asked for one more night". "Kept with the change, your name and the time."

---

## How to …

### How to see who is arriving and leaving today

**Who can do this:** anyone with **View bookings** (all roles by default) who is not sent to a field screen — in practice Admin, Front Office and Finance. Security and Housekeeping use their field screens (see *Field screens*). An Admin can change the permissions.

**Where:** sidebar → Overview → **Dashboard**. It is also the first screen office staff see after signing in.

**Steps:**
1. Open **Dashboard**. The date under the title is today in Brunei.
2. Read the four tiles for the day's numbers.
3. **Arriving today** lists every **Confirmed** booking checking in today; **Leaving today** lists every **Checked in** guest due out today, with the deposit held.
4. To open one of them, copy its reference into **Search** at the top right (the Dashboard rows are not links).

**What happens next:** nothing changes — the Dashboard only reads. Check-ins and check-outs are done from the booking's page or the field screens (see *The booking's own page* and *Field screens*).

**Edge cases and limits:**
- Held and Awaiting-payment bookings due today are not listed. To see everything arriving today whatever its status, go to **All bookings**, set **Stay date** to today–today, and look for bookings whose Dates start today.
- Day passes are not on the Dashboard. For today's day passes, use **All bookings** with **Type: Day pass** and look at the Dates column (do not use the Stay date filter — it hides day passes), or the Gate field screen.
- A guest who should have left yesterday but is still Checked in does not appear under "Leaving today". Find them on **All bookings** with **Status: Checked in**.
- The screen does not update by itself; reload it.

**If you see an error:** "You don't have access to this screen" — you lack **View bookings**; ask an Admin.

### How to find a booking

**Who can do this:** anyone with **View bookings** (all roles by default; an Admin can change this).

**Where:** the **Search** box at the top of any portal screen (fastest), or **All bookings** → search box.

**Steps (quick search):**
1. Click **Search** at the top right, or press **Ctrl K** (⌘K on Apple devices).
2. Type at least 2 characters of the **reference** (e.g. "4821"), the **guest's name**, part of their **phone number**, or the **unit** (e.g. "3B-04").
3. Pick the booking from the **Bookings** group (arrow keys + Enter, or click).

**Steps (register):**
1. Sidebar → Bookings → **All bookings**.
2. Type in the box "Reference, guest, phone or unit". Add **Status**, **Type** or **Stay date** filters if needed.
3. Click the row.

**Edge cases and limits:**
- Neither search looks at email addresses, vehicle registrations, notes or amounts. To find a booking by car plate, the guard's Gate screen looks up plates (see *Field screens*).
- Quick search shows at most 5 bookings. If you get too many, type more, or use All bookings.
- References are always PV- followed by digits; you can type them in lower case.
- A phone number is found by any run of digits exactly as stored (including any space after the country code).

**If you see an error:** "Nothing matches "…"." — nothing you can see matches; check spelling or type less. "Search is not available right now. Try again in a moment." — connection problem; try again, reload, or sign in again.

### How to filter the bookings register

**Who can do this:** anyone with **View bookings**.

**Where:** sidebar → Bookings → **All bookings** → the filter row above the table.

**Steps:**
1. To see one type, click its tile (**Short stay**, **Day pass**, **Tenancy**). Click it again to go back to all.
2. **Status** → tick the statuses you want (several allowed).
3. **Type** → tick types (several allowed).
4. **Stay date** → pick the first and last day. Bookings with at least one night on those days are shown.
5. Type in the search box to narrow further.
6. **Clear** removes every filter at once. The browser's Back button undoes the last change.

**Useful views:**
- Everything waiting on a bank check: **Status: Awaiting payment**.
- Who is in the building or booked in: **Status: Confirmed + Checked in**.
- Everything touching next week: **Stay date** = next Monday to Sunday.
- Bookings still being held without payment: **Status: Held**.

**Edge cases and limits:**
- The Stay date filter never shows day passes (see above).
- The tile counts ignore the type filter on purpose, so you can see how many of each type match your other filters.
- A filtered view can be bookmarked or its link sent to a colleague.

### How to download the bookings as a spreadsheet (CSV)

**Who can do this:** holders of **Edit settings, roles & the unit registry** — **Admin only** by default. Nobody else sees the button, and the download link refuses anyone else. An Admin can grant the permission, but it also gives access to settings, roles and the unit registry.

**Where:** **All bookings** → **Download CSV** (right of the filter row).

**Steps:**
1. Click **Download CSV**. A menu lists six files: **Bookings**, **Booking lines**, **Vehicles**, **Booking notes**, **Guests**, **Documents**.
2. Click one. It downloads as, for example, `palm-villa-bookings-2026-09-18.csv` (dated today in Brunei).

**What is in it:** the **whole table, every booking ever** — **not** the filtered view you are looking at. The Bookings file has one row per booking with reference, status, type, guest, phone, unit, unit type, check-in, check-out, guests charged and exempt, total, paid, security deposit, deposit waiver reason, discount details, vehicles, created and updated times. Status and type appear as the system's internal words (for example "checked_in", "short_stay") rather than the on-screen labels.

**Edge cases and limits:** filter the result in your spreadsheet program. Other CSVs (payments, deposits, reports) are on their own screens — see *Deposits, reports and finance*.

**If you see an error:** a page saying "Not found" when opening a download link means your account does not hold the permission.

### How to read the calendar and check what is free

**Who can do this:** anyone with **View bookings** (all roles by default).

**Where:** sidebar → Bookings → **Calendar**.

**Steps:**
1. Open **Calendar**. It shows this month, and only the units with something on them. Tick **Show empty units** to see every unit.
2. Use the arrows beside the month name to move to the previous or next month.
3. Use **Type** to show only one or more unit types.
4. Hover over a bar for details; click it to open the booking (or the unit, for a lease or out-of-service bar).
5. Empty cells in a row are free nights for that unit.

**Edge cases and limits:**
- The check-out day of a stay is shown free — the next guest can arrive that day.
- A completed stay keeps its nights blocked even if the guest left early.
- Cancelled, Expired and No-show bookings are not drawn; their nights are free.
- Day passes are not on the calendar.
- The calendar shows what the system will actually allow: if a night looks taken here, the system will refuse a booking on it.

### How to start a booking from the calendar

**Who can do this:** holders of **Create bookings** — Front Office and Admin by default (an Admin can change this). For anyone else, free nights cannot be clicked and there is no New booking button.

**Where:** **Calendar** → the row of the unit you want.

**Steps:**
1. In the unit's row, hover over the **arrival night** — a "+" appears — and click it. This marks the check-in date.
2. Move along the same row and click the **departure day** (the check-out date). The nights in between are shaded as you move. The departure day itself is not shaded, because the guest does not stay that night.
3. A box appears: **"Start this booking?"** — "Nothing is held yet. The next screen takes the guest and the payment." It lists **Unit**, **Check-in**, **Check-out** and **Nights**.
4. Click **Continue** to open **New booking** with the unit and dates filled in, or **Cancel** to start again.
5. Finish the booking on the New booking screen (see *Creating bookings*). Nothing is held until that booking is saved.

**Edge cases and limits:**
- The second click must be on a **later day in the same row**. Clicking a day before (or on) the first click, or in another unit's row, starts again from that day. Press **Esc** to cancel the selection.
- Every night of the stay must be free and bookable. You cannot select across an existing bar.
- **Past days cannot be clicked**, and nor can days beyond the advance-booking limit (62 days ahead by default, set in Property settings).
- **You can only click a free day as the departure.** If another booking starts on the day your guest leaves, that day is covered by a bar and cannot be clicked — so a back-to-back stay ending exactly where the next begins cannot be picked on the calendar. Use **New booking** directly and type the dates.
- For the same reason, a stay that runs into next month cannot be picked on the calendar (the departure day is not on the grid). Use **New booking** directly.

### How to use the notifications bell

**Who can do this:** everyone; what you see depends on your permissions (see *Notifications* above).

**Where:** the bell at the top right of any portal screen.

**Steps:**
1. A small dark dot on the bell means something new.
2. Click the bell. The list opens; new items have a dot and the header says "N new". Opening it marks them all as seen.
3. Click a line to go to the booking (or to the Verification queue for "Payment to verify").

**What happens next:** nothing happens to the booking or payment — you still have to act (verify the payment, contact the guest about the failed email, change the party for extra guests reported at the gate, and so on).

**Edge cases and limits:**
- There is no "mark as unread" and no way to dismiss one item.
- You are not told about things you did yourself.
- Items older than 14 days drop off; only the newest 20 are listed.

**If you see an error:** "Notifications could not be loaded. They will try again shortly." — wait; check your connection; reload if it persists.

### How to edit (amend) a booking

**Who can do this:** holders of **Edit bookings** — **Front Office and Admin** by default. The discount part needs **Discount bookings** as well (Front Office and Admin by default). An Admin can change both in **Roles & staff**. The guard (Security) cannot edit bookings — he calls the office.

**Where:** the booking's page → **Edit** (pencil icon) → the **Edit PV-XXXX** screen.

**Which bookings can be edited:** only bookings that are **Draft**, **Held**, **Awaiting payment** or **Confirmed**, and only **short stays**. A booking that is Checked in, Completed, Expired, Cancelled or No show cannot be edited. A day pass cannot be edited at all.

**What can be changed:**
- the **dates** (check-in and check-out);
- the **unit** — any unit free for the whole stay, including a unit of a different type;
- the number of **guests** (over the exempt age, and aged 3 and under) — though to change only the number of people, **Change** on the Party line is simpler and does not reprice the rest of the stay (see *How to change the party (more or fewer people)*);
- the **extras** (for example sofa beds) and their quantities;
- **late check-out hours** (0–12);
- the guest's **name** and **phone**;
- the **vehicle registrations**, or the "Arriving without a vehicle" tick;
- the **discount** — add, change or remove (only with **Discount bookings**);
- a **note** explaining the change.

**What cannot be changed here (or anywhere):**
- the guest's **email address** — there is no field for it on the Edit screen, and nowhere else in the portal changes it;
- the booking **type** (short stay / day pass / tenancy);
- the **status** — editing never moves the status (use the booking page's own buttons; see *The booking's own page*);
- **whether the security deposit is waived** — a waived deposit stays waived; a normal deposit cannot be waived after the booking is made;
- **early check-in** — not offered (no standard check-in time is set);
- **money already paid** — editing never records, moves or refunds a payment;
- the **booking reference** and the **entry code**.

**Steps:**
1. Open the booking and click **Edit**.
2. **If the dates are changing, do this first.** Change **Check-in** and/or **Check-out** in the top card and click **Check these dates**. The page reloads with the units free for those dates. (Changing dates reloads the form, so anything you had already changed further down is reset to the booking's current values — set the dates before anything else.) **Reset dates** puts the booking's own dates back.
3. Under **Unit**, choose the unit. If the guest's present unit is not free for the new dates you will see "[unit] is not free for these dates — another booking has it for part of the range. Move the guest to another unit, or change the dates." Choose another unit.
4. Change guests, extras, late check-out, name, phone, vehicles and discount as needed.
5. Optionally write **Why is this changing?** — for example "Guest asked for one more night".
6. Check the **After this change** panel on the right: the new price lines, the new total and the difference from the old total.
7. Click **Review change**. It stays greyed out until something has actually changed (you will see "Nothing has changed yet.") and until the price can be worked out.
8. A box **"Edit PV-XXXX?"** lists every change as "old → new" — Unit, Check-in, Check-out, Chargeable guests, Exempt guests, Vehicles, Guest, Phone, Discount, Total. "Recorded against the booking with your name and the time, and both the old and new values are kept." If you only added a note: "Only the note is being added — nothing about the stay itself changes."
9. Click **Save changes** (or **Keep editing** to go back).
10. A message "**PV-XXXX edited**" appears and you return to the booking's page.

**What happens next:**

- **The price is worked out again from scratch** using the pricing in **Property settings as it is today** — the nightly rate of the unit's type, the extra-person charge, the extras' fees and the late check-out rate. A booking that was quoted before a rate change **is repriced at the new rates as soon as it is edited**, even if you only changed the phone number. The panel shows this before you save, as a change in the Total.
- **A discount is re-applied to the new price.** A percentage discount is a percentage of the new price (10% off a stay extended by a night is 10% off the longer stay). A fixed-amount discount stays the same amount. If you do not hold **Discount bookings**, the booking's existing discount is kept exactly as it was.
- **If the new total is higher**, the panel says "Was BND X — a difference of BND Y more. The booking will show it as outstanding, and it can be settled from the booking screen." The booking's **Money** card then shows **Outstanding BND Y** and staff can take it in cash or raise a transfer from the booking page (see *Payments → How to record a payment from the booking page (cash or bank transfer)*). **The status does not change**: a Confirmed booking stays Confirmed while it owes money.
- **If the new total is lower**, the panel says "Was BND X — a difference of BND Y less. Refunds are settled outside the system." If more has been paid than the new total, the booking's Money card shows **Overpaid by BND Y** and "More has been taken than this booking is worth. Refunds are settled outside the system." The refund is done by a person (bank app or cash) — the system does not record it. This is not settled policy yet — ask Jefferson/Jason how refunds after a price reduction are to be handled and recorded.
- **Money already paid is untouched.** Verified payments stay as they are. A bank transfer already waiting in the Verification queue stays there; if the booking's price changed after the transfer was raised, the person verifying it is told "This booking has been repriced. Check the amount due and say why it differs." (see *Payments*).
- **The security deposit.** The booking's quoted deposit is re-set to the **deposit amount in Property settings today** (BND 100 by default) — unless the deposit was waived, in which case it stays at nothing. The deposit money already taken does not change. So if the configured deposit amount has gone up since the booking was made, editing the booking makes its deposit read as **short**, and **check-in will refuse until the difference is collected** (see *Payments → How to top up a short deposit*). If the configured amount is unchanged, nothing happens to the deposit.
- **The unit and nights move at once.** The old nights are freed and the new ones held, in one step. The calendar, the register, the Dashboard and availability on the booking forms all reflect the change.
- **The booking's history** shows **Edited** with your name, the time and your note in quotation marks. The old and new values of every field are stored with it (an Admin can see them in the audit log's CSV download). If the discount was added, changed or removed, a second entry appears: **Discount applied**, **Discount changed** or **Discount removed**.
- **Identity documents:** moving the check-out date moves the date on which any identity document on file is due to be deleted (see *The booking's own page → Identity documents*).
- **No email is sent** to the guest when a booking is edited. A guest who already received a confirmation still has the old details in that email; tell them about the change yourself. (See *The customer side → Emails* for what is sent and when.)
- **No notification** is raised for an edit.

**Undoing an edit:** there is no undo button. To reverse an edit, edit the booking again and put the old values back — the confirmation box shows the old values, and the booking's history keeps both. Note that putting the old values back **reprices at today's rates**, so if rates have changed the old total cannot always be restored exactly; if the booking had a discount you can adjust it (with **Discount bookings**) to match what was agreed. The history keeps a record of both edits.

**Edge cases and limits:**

- **Check-in date in the past.** The system will not price a stay whose check-in date is before today. So a **Confirmed booking whose check-in date has already passed** (the guest has not been checked in) **cannot be edited at all** — not even the phone number: the price panel shows "Check-in cannot be in the past." and **Review change** stays greyed out. Either check the guest in (see *The booking's own page*), or, if they did not come, mark the booking No show or cancel it and make a new one. (The number of people can still be changed with **Change** on the Party line.)
- **A guest already checked in cannot be edited.** The one exception is the number of people: **Change** on the booking's Party line works on a checked-in guest (see *How to change the party (more or fewer people)*). To extend an in-house guest, the stated procedure is a **second booking** for the extra nights on the same unit, with the security deposit **waived** and the reason naming the first booking (see *Creating bookings → How to waive the security deposit at booking*). Late check-out hours asked for on the morning of departure likewise cannot be charged through the system. Whether a checked-in stay should ever be editable is not settled yet — ask Jefferson/Jason.
- **Advance limit:** the new check-in cannot be more than the advance-booking limit ahead (62 days by default): "Bookings open up to 62 days ahead."
- **Check-out must be after check-in.** If you enter a check-out on or before the check-in and click **Check these dates**, the screen silently goes back to the booking's own dates — there is no error message. Check the dates shown in the **After this change** panel.
- **Extras taken off sale.** If the booking holds an extra that has since been taken off sale or removed in Property settings, the form still shows it ("no longer offered"), but **the booking cannot be saved while its quantity is above 0**: the price panel shows "[Extra] is not available to book." and Review change stays greyed out. You must set that extra to 0 (the guest loses it) or ask an Admin to put the extra back on sale first.
- **Extras stock:** you cannot ask for more of an extra than the property has in total ("There are only 2 sofa beds across the property."). If another booking has them on those nights, saving is refused (see errors below).
- **Guest limit:** if Property settings treat the unit type's maximum guests as a hard cap, too many guests is refused: "[Unit type] takes up to 6 guests; this party is 7." If instead the setting charges above the maximum, an extra-person line appears in the price.
- **Moving to a different unit type** reprices at that type's rate and changes the parking allowance shown under Vehicles.
- **Changing extras or late check-out** does not appear as its own line in the confirmation box — it shows only through the change in **Total**. If you swap extras so that the total stays the same, the form says "Nothing has changed yet" and you must add a note to be able to save; the confirmation box will then (wrongly) say only the note is being added, but the extras are saved too.
- **Vehicles:** registrations are saved in capitals with extra spaces removed, and duplicates are dropped. Up to 10 cars, 20 characters each. You must enter at least one registration or tick **Arriving without a vehicle**.
- **Two people editing at once:** if anything else changed the booking after you opened the Edit screen (another staff member edited it, a payment was verified, the guest checked in), your save is refused — see errors below. Reload and redo the change.
- **A booking held for payment at the gate** (a same-day booking the guard collects) can be edited like any other Held booking. Moving it to a later date keeps it Held with nothing paid, holding the unit — avoid this; take the deposit as usual for a later stay (see *Creating bookings*).
- **Nothing free:** if no unit (not even the guest's own) is free for the chosen dates, the form is replaced by **"Nothing is free for those dates"** — "Every unit is taken for the whole range, including the one this guest is in. Try a different range."

**If you see an error:**

On the Edit screen before saving (in the price panel):
- "**Choose a unit to see the price.**" — no unit is selected (usually after changing dates when the current unit is taken). Pick one.
- "**Check-in cannot be in the past.**" — see above; the booking cannot be edited.
- "**Bookings open up to 62 days ahead.**" (the number follows Property settings) — move the check-in earlier.
- "**Check-out must be at least one night after check-in.**" — fix the dates.
- "**A booking needs at least one guest above the exempt age.**" — set "Over 3" to at least 1.
- "**[Unit type] takes up to N guests; this party is M.**" — too many guests for that unit type; choose a bigger unit or fewer guests.
- "**[Extra] is not available to book.**" — the extra is off sale; set it to 0 or ask an Admin.
- "**That extra is no longer on the list.**" — the extra was deleted; reload the page.
- "**There is/are only N [extra] across the property.**" — lower the quantity.
- "**Enter a discount between 1% and 100%.**", "**Enter an amount to take off, like 40.00.**", "**A discount cannot be more than the booking is worth.**", "**Say why this booking is being discounted.**", "**Keep the reason under 280 characters.**" — fix the discount.

When you press **Save changes** (shown in the box or under the price panel; "Check the highlighted fields." means look at the messages under the fields):
- "**Check the highlighted fields.**" with, under a field:
  - "**Enter the vehicle registration, or tick "Arriving without a vehicle" if there is no car.**"
  - "**Enter the guest name.**" / "**Enter a contact number.**"
  - "**A booking needs at least one guest.**"
  - "**Choose a unit.**"
  - "**Choose a discount type.**", "**Enter a whole percentage between 1 and 100.**", "**Enter an amount like 40.00.**", "**Say why this booking is being discounted.**", "**Keep the reason under 280 characters.**"
  - "**Enter a valid date.**"
  - "**Too big: expected number to be <=12**" under late check-out — at most 12 late hours. "**Too big: expected number to be <=50**" — at most 50 guests of each kind. "**Too big: expected string to have <=120 characters**" / "<=40 characters" — the name or phone is too long.
- "**This booking is checked in and can no longer be edited.**" (or "…is completed / cancelled / expired / no show…") — the booking's status changed while you had the form open. It can no longer be edited.
- "**That booking no longer exists.**" — it was removed. Go back to All bookings.
- "**Someone else changed this booking while you were working on it. Reload and retry.**" — reload the Edit page (your changes are lost) and make them again.
- "**3B-04 was booked for those dates while this form was open.**" (the unit reference is named) — someone took that unit for some of those nights while you were working. Nothing was saved; the booking is exactly as it was. Reload and choose another unit or other dates.
- "**That unit does not exist.**" — the unit was removed; reload and choose another.
- "**Every sofa bed is taken for those nights.**" or "**Only 1 sofa bed is free for those nights.**" (with the extra's name) — other bookings hold that extra on those nights. Lower the quantity or change dates. Nothing was saved.
- "**One of the extras was taken while this form was open.**" — as above.
- A full-page "**This page didn't load**" with **Try again** — something unexpected failed (for example the unit was put out of service at that moment). Nothing was saved. Try again; if it keeps happening, give the reference shown to whoever looks after the system.

On opening the Edit screen:
- "**This booking is checked in**" — "The guest has already checked in, so the stay can no longer be changed here." with **Back to the booking**.
- "**This booking is completed**" / "**…cancelled**" / "**…expired**" / "**…no show**" — "Closed bookings are kept as a record and cannot be changed."
- "**This booking has no stay to edit**" — "It occupies no unit, so there are no dates or unit to change here." — it is a day pass. Day passes cannot be edited; the **Edit** button still appears on a day pass's page but leads here. To change a day pass, cancel it (see *The booking's own page*) and have the customer book a new one on the website — the portal cannot create a day pass (see *Creating bookings*).

### How to change the party (more or fewer people)

**Who can do this:** holders of **Edit bookings** — Front Office and Admin by default (an Admin can change this in **Roles & staff**). The guard cannot; he reports extra people from the Gate with **Extra**, and the office is told in the bell (see *Notifications*).

**Where:** the booking's page → **Guest & stay** card → **Change**, beside the **Party** number.

**Which bookings:** any booking that is not closed — **Draft**, **Held**, **Awaiting payment**, **Confirmed**, and also **Checked in**. It works on a **day pass** too. It is not offered on a Completed, Cancelled, No show or Expired booking (an admitted day pass is Completed). Unlike **Edit**, it works on a guest already checked in and on a booking whose check-in date has passed.

**Steps:**
1. Press **Change**. The box **Change the party** opens: "PV-XXXX. The price is worked out again for the new numbers. What has been paid stays as it is."
2. Enter the new numbers:
   - **A stay:** **Over 3** (at least 1) and **Aged 3 and under**. (The age follows the exempt age in Property settings, 3 by default.)
   - **A day pass:** one box per age band (for example **Adult**, **Child**), filled in with the pass as it was sold.
3. As soon as a number changes, the box shows what the change does:
   - "Total BND 486.00 → BND 500.00" and "**The guest will owe BND 14.00.**" — the guest now owes more;
   - or "**The booking will owe the guest BND 20.00. Settle it with them outside the system.**" — more has been paid than the new price;
   - or "What has been paid covers it exactly.";
   - or, when the price does not move, "No change to the price — the stay is still within what the unit takes before extra guests are charged." (for a day pass: "No change to the price.").
4. Optionally fill in **Why (optional)**, up to 280 characters — for example "Two more arrived at the gate".
5. Press **Save** (**Saving…**). It stays greyed out until a number has changed and the new price can be worked out. **Cancel** closes without saving.
6. A message "**Party changed**" with the reference appears.

**How the new price is worked out:**
- **A stay** costs more only for guests **over the exempt age above the unit type's maximum guests** (for example above 8 in a 3-bedroom). Each of those is charged the extra-guest rate in Property settings (BND 7 by default) **for every night of the booking**, including nights already spent. Children aged 3 and under are never charged. Going back down to the maximum or below removes the extra-guest line.
- **Everything else on the stay keeps the price it was sold at** — the nights, the extras and the late check-out are not repriced at today's rates (unlike **Edit**, which reprices the whole stay).
- **A percentage discount** is worked out again on the new price. **A fixed-amount discount** stays the same amount; if it is now bigger than the new price, the change is refused ("A discount cannot be more than the booking is worth.").
- **A day pass** is priced again in full for the new party, exactly as when it was sold — per person by age band, with family bundles used wherever they make it cheaper.

**What happens next:**
- The booking's **Party** line and the Gate card's **Guests** line show the new numbers. The **Money** card shows the new **Total**, and **Outstanding** or **Overpaid by** if the booking is no longer exactly settled.
- **If the guest now owes money**, take it from the booking page (**Record a payment**), or the guard takes it at the gate: the Gate card turns red ("Payment not settled") and shows it under **To take** as **The stay** or **Day pass**. The status does not change.
- **If the guest has now overpaid** (fewer people), the Money card shows **Overpaid by BND X**. Refund it outside the system.
- Any "… more people than booked — the office has been told." line on the Gate card disappears: the guard's report is answered.
- The booking's history shows **Party changed — 5 → 7** (everybody counted, before → after) with your name, the time and your **Why** in quotation marks.
- Nothing else changes: not the dates, the unit, the extras, the security deposit or any payment. No email is sent to the guest, and no notification is raised.

**Undoing:** press **Change** again and put the old numbers back (while the booking is still open). On a stay the price returns to what it was, apart from the extra-guest rate, which is always today's.

**Edge cases and limits:**
- **Fewer people never refunds anything by itself.** The difference shows as **Overpaid by** and is settled by a person.
- If Property settings are set to **Refuse the booking** for a party over the maximum, a stay can't be changed to more than the maximum: "3-bedroom takes up to 8 guests; this party is 9."
- A day pass is still bound by the day's visitor limit: "Only 2 more places are left that day." / "The facilities are full for that day, so nobody more can be added."
- The dates, unit and extras of a **checked-in** guest still cannot be changed. An extension after check-in is still a second booking, and late check-out asked for after check-in still cannot be charged through the system (see *How to edit (amend) a booking*).
- **Extra people found out only after the guest has checked out:** the booking is closed, so **Change** is not offered and no payment can be recorded against it. Charge them against the security deposit instead — the deposit's page → **Charges** → **Add charge**, with the amount and a reason such as "2 extra guests × 3 nights" (see *Deposits, reports and finance → How to raise a charge against a deposit*). It comes off what is returned to the guest when the release is approved; if it is more than the deposit, the rest is recorded as owed by the guest.
- **Change the party before the guest checks out** whenever you can: until then, what they owe shows on the Gate card and the guard can take it when the keys come back.

**If you see an error:**
- "A booking needs at least one guest above the exempt age." / "A booking needs at least one guest." — **Over 3** is 0.
- "Add at least one guest." — every band of a day pass is 0.
- "Nothing has changed. Change a number, or close this."
- "A discount cannot be more than the booking is worth." — the fixed-amount discount is bigger than the new price. Change or remove the discount first (see *How to add, change or remove a discount after booking*; that is done through **Edit**, before check-in).
- "Someone else changed this booking a moment ago. Reload and try again." / "Someone else changed this booking while you were working on it. Reload and retry." — reload the page and try again.
- "This booking is closed, so its party can no longer be changed." — it was checked out, admitted, cancelled or marked a no-show. Settle anything owed from the deposit, or outside the system.
- "That booking no longer exists." / "This booking could not be changed. Reload the screen."

### How to move a guest to another unit

**Who can do this:** **Edit bookings** holders (Front Office and Admin by default).

**Where:** booking page → **Edit** → **Unit**.

**Steps:**
1. Open the booking and click **Edit**. Leave the dates as they are.
2. Under **Unit**, pick the new unit from the list (only units free for the whole stay are listed, of any type).
3. Check the price panel — a different unit type means a different nightly rate.
4. **Review change** → **Save changes**.

**What happens next:** the old unit's nights are freed and the new unit's held immediately. The history shows **Edited** with Unit old → new. No email goes to the guest. The booking's entry code does not change.

**Edge cases and limits:** only for bookings not yet checked in (Draft, Held, Awaiting payment, Confirmed) with a check-in date of today or later. A checked-in guest cannot be moved in the system. Online bookings are given the first free unit of the chosen type automatically — this is how the desk changes that assignment.

### How to extend or shorten a stay (before check-in)

**Who can do this:** **Edit bookings** holders (Front Office and Admin by default).

**Where:** booking page → **Edit** → dates card.

**Steps:**
1. Change **Check-out** (and/or **Check-in**) and click **Check these dates**.
2. Keep the current unit if it is still marked **(current)**; otherwise choose another.
3. Check the new total and the difference.
4. Add a note, **Review change**, **Save changes**.
5. If the total went up, take the difference from the booking page (**Outstanding**) — see *Payments*. If it went down and the guest has overpaid, arrange the refund outside the system.

**Edge cases and limits:** a guest already checked in cannot be extended by editing — make a second booking with the deposit waived (see *Creating bookings*). Every night is repriced at today's rates.

### How to correct a guest's name, phone or car registration

**Who can do this:** **Edit bookings** holders (Front Office and Admin by default). The guard cannot; he should call the office.

**Where:** booking page → **Edit** → **Guest** and **Vehicles** sections.

**Steps:** change the field, **Review change**, **Save changes**.

**Edge cases and limits:**
- Saving also reprices the stay at today's rates — if rates changed since the booking was made, the confirmation box will show a Total change as well. Check it before saving.
- It cannot be done for a checked-in booking, a closed booking, a day pass, or a booking whose check-in date has passed.
- The **email address cannot be corrected** anywhere in the portal. If a guest's email is wrong, their emails (confirmation, entry code) go to the wrong address; give them the details another way. Raise this with Jefferson/Jason if it keeps happening.

### How to add, change or remove a discount after booking

**Who can do this:** holders of both **Edit bookings** and **Discount bookings** — Front Office and Admin by default. An Admin can change this. Without **Discount bookings** the Discount section is not shown, and the booking's existing discount is kept unchanged whatever else you edit.

**Where:** booking page → **Edit** → **Discount**.

**Steps:**
1. **Type**: **Amount off, in BND**, **Percentage off**, or **No discount** (to remove one).
2. Enter the **Amount, BND** (e.g. 40.00) or **Percentage** (whole number 1–100).
3. Enter the **Reason** (required, up to 280 characters).
4. **Review change** → **Save changes**.

**What happens next:** a negative discount line appears in the price and the total changes. The history shows **Edited** and **Discount applied / changed / removed**. A 100% discount (free stay) is allowed. See *Creating bookings → Discounts* for the full discount rules.

---

## Rules the system enforces

- **Only bookings not yet checked in and not closed can be edited** — Draft, Held, Awaiting payment, Confirmed. Checked-in and closed bookings are a record. The exception is the number of people: **Change** on the Party line also works on a checked-in guest and on a day pass, never on a closed booking. The system checks this again at the moment you save, so a guest checked in while you had the form open is refused.
- **Only short stays can be edited.** A day pass has no unit or dates to change.
- **A booking whose check-in date has passed cannot be edited**, because the pricing refuses a check-in date in the past.
- **Every edit reprices the whole stay at today's settings.** A party change (**Change** on the Party line) does not: it keeps the nights, extras and late check-out at the prices they were sold at and works out only the extra-guest charge (at today's rate, for every night) and a percentage discount again. The price is always worked out by the system, never typed in. A rate change in Property settings does not touch existing bookings until they are edited.
- **Editing moves no money.** A higher total becomes an outstanding balance settled from the booking; a lower total is refunded outside the system. The status never changes because of money owed.
- **The deposit decision is carried through.** A waived deposit stays waived; an unwaived one is re-quoted at the configured amount.
- **A discount is carried through** when the editor may not give discounts, and re-applied to the new price when a percentage.
- **Double booking is impossible.** The unit and nights are checked by the database at the moment of saving; if someone took them first, the edit is refused and nothing changes.
- **Out-of-service units are never offered**, and the database refuses to place a booking in one.
- **Extras stock is checked across every booking** on the nights concerned, at the moment of saving.
- **Only one person's edit wins.** If the booking changed after you opened the form, your save is refused rather than overwriting the other change.
- **Every edit is recorded** with who, when, the optional note, and both old and new values; discount changes get their own record.
- **All screens here use Brunei time** for "today".
- **Filters and searches only look at reference, guest name, phone and unit** (deposits: reference, name, unit). Email and car plates are not searched.
- **The calendar and the edit screen show exactly what the database will allow**: a night blocked on the calendar is one the system will refuse.
- **Notifications are only for work you can act on**, never for your own actions.

---

## Likely questions

**Q: Where do I see who is arriving today?**
A: **Dashboard** → "Arriving today". It lists Confirmed bookings checking in today. Held or Awaiting-payment bookings due today are not listed — for those, use **All bookings** with **Stay date** set to today.

**Q: A guest is on the Dashboard but I can't click them.**
A: The Dashboard rows are not links. Copy the reference into **Search** (top right, or Ctrl K) and open it from there.

**Q: The Dashboard doesn't show today's day passes.**
A: Correct — day passes occupy no unit and are not on the Dashboard or the Calendar. Use **All bookings** with **Type: Day pass** (not the Stay date filter, which hides day passes), or the Gate field screen.

**Q: I set a Stay date filter and all the day passes disappeared.**
A: The Stay date filter only matches stays, so it always hides day passes. Remove it and use **Type: Day pass** instead; the day each pass is for is in the Dates column.

**Q: Can I search by car registration or email?**
A: No — the portal search and the register search only match the reference, guest name, phone and unit. The guard's Gate screen looks up car plates.

**Q: The search says "Nothing matches".**
A: Check you typed at least 2 characters, try just the digits of the reference or the last digits of the phone, and remember email and plates are not searched. You also only see records your role may see.

**Q: Why is the Tenancy tile always 0?**
A: Long leases are set up on the unit, not as bookings, so they are not in the bookings register. They do appear on the **Calendar** as "Leased" bars.

**Q: The guest wants one more night. They haven't arrived yet.**
A: Booking page → **Edit** → change **Check-out** → **Check these dates** → keep the unit if it is still "(current)" → check the new total → **Review change** → **Save changes**. The extra amount shows as **Outstanding** on the booking; take it from the booking page.

**Q: The guest is already checked in and wants one more night.**
A: A checked-in booking's dates cannot be edited (only its party can, with **Change**). Make a **second booking** for the extra night on the same unit, starting on the current check-out date, with the security deposit **waived** and the reason naming the first booking (see *Creating bookings*).

**Q: The Edit button is missing.**
A: Either you do not hold **Edit bookings** (Front Office and Admin have it by default), or the booking is Checked in, Completed, Cancelled, Expired or No show — those cannot be edited.

**Q: I opened Edit and the price panel says "Check-in cannot be in the past." — I only want to change the phone number.**
A: The booking's check-in date has passed without the guest being checked in, and the system cannot edit such a booking at all. Check the guest in if they are here, or mark the booking No show / cancel it if they did not come.

**Q: I only changed the phone number but the Total changed too.**
A: Every edit reprices the stay at the rates in Property settings today. If the rates changed since the booking was made, the booking is repriced at the new ones. If that is not what was agreed, don't save — or, with **Discount bookings**, add a discount with a reason to honour the old price.

**Q: I edited the dates and my other changes vanished.**
A: Clicking **Check these dates** reloads the form with the booking's saved values. Set the dates first, then make the other changes.

**Q: I reduced the stay and the guest has paid too much. How do I refund?**
A: The booking shows **Overpaid by BND …**. Refunds are done outside the system (bank transfer or cash by a person); the portal does not record them. Ask Jefferson/Jason how they want refunds recorded.

**Q: The booking got more expensive after an edit. Is it still confirmed?**
A: Yes. Owing money does not change the status. The booking shows **Outstanding BND …** and the difference can be taken in cash or by transfer from the booking page (see *Payments*).

**Q: After editing, check-in now says the deposit is short.**
A: The edit re-quoted the deposit at the amount in Property settings today, which is higher than what was taken when the booking was made. Collect the difference from the booking page (see *Payments → How to top up a short deposit*); check-in will then work.

**Q: It says "Someone else changed this booking while you were working on it. Reload and retry."**
A: Something changed the booking after you opened the form (another edit, a payment verified, a check-in). Reload the Edit page and make your change again.

**Q: It says "[unit] was booked for those dates while this form was open."**
A: Another booking took that unit for some of those nights before you saved. Nothing was changed. Reload and pick another unit or other dates.

**Q: The booking holds a sofa bed and now I can't save — it says the sofa bed "is not available to book."**
A: That extra has been taken off sale or removed in Property settings, and a booking holding one cannot be saved. Set it to 0 (the guest loses it), or ask an Admin to put it back on sale, save, and take it off sale again.

**Q: Can I change the guest's email address?**
A: No — no screen in the portal changes it. Give the guest their details another way, and tell Jefferson/Jason.

**Q: I edited a booking by mistake. How do I undo it?**
A: There is no undo. Edit it again and put the old values back (the history keeps both). The price is worked out again at today's rates, so check the total matches what was agreed.

**Q: Does the guest get an email when I change their booking?**
A: No. Editing sends nothing. Tell the guest yourself. (See *The customer side → Emails*.)

**Q: Can the guard change a booking at the gate?**
A: No. Security has no Edit bookings permission. He calls the office, and the office edits it. For more people than booked he presses **Extra** on the Gate card, which leaves a note on the booking and a bell notification ("Extra guests at the gate") for everyone with Edit bookings. The one change he can make himself is adding visitors to a day pass for today and taking the difference in cash.

**Q: The bell says "Extra guests at the gate". What do I do?**
A: Open it (it goes to the booking), read the guard's note in **Notes**, and press **Change** beside **Party** to enter the real numbers. If that makes a stay go over the unit type's maximum, the extra-guest charge is added and shows as **Outstanding**; the guard can then take it at the gate, or you can take it with **Record a payment**. It works even if the guest is already checked in.

**Q: Can I edit a day pass — say the number of people?**
A: Not with **Edit** — it says "This booking has no stay to edit". But the number of people can be changed: press **Change** beside **Party** on the pass's page and set each age band. The pass is priced again (bundles included), and any difference shows as **Outstanding** or **Overpaid by**. This works until the pass is admitted. The pass's date cannot be changed; for another day, cancel the pass and have the customer book a new one on the website — day passes cannot be made from the portal. Any money already paid for the old pass is refunded outside the system.

**Q: I can't click a day on the calendar to start a booking.**
A: Past days, days beyond the advance-booking limit, days covered by a bar, and anything if you lack **Create bookings** cannot be clicked. To pick a stay that ends exactly when another booking begins, or that runs into next month, use **New booking** directly.

**Q: The calendar key says No show blocks the nights, but I don't see the no-show booking.**
A: The key is out of date. A No-show booking frees its unit and is not drawn; its nights can be sold again.

**Q: The notification dot won't go away / I opened the bell on another computer.**
A: Opening the bell marks everything as seen for your account on every device; the dot comes back only when something new arrives. If the bell cannot load ("Notifications could not be loaded…"), check your connection.

**Q: Why didn't I get a "Payment to verify" notification for the transfer I just raised?**
A: You are never notified of your own actions. You also need **Verify payments** to receive these at all. Colleagues are only notified when a booking moves to **Awaiting payment** (a customer's "I have made the transfer", or a deposit transfer raised on a **Held** booking); a transfer booked on New booking or raised with **Record a payment** notifies nobody, so tell whoever checks the bank.

**Q: How do I get a spreadsheet of the bookings?**
A: Only an Admin sees **Download CSV** on All bookings. It downloads every booking, not just the filtered ones.

---

## Terms

- **Dashboard** — the portal's home screen: today's arrivals, departures, bookings awaiting payment and occupancy.
- **All bookings / the register** — the list of every booking, with search, filters and pages.
- **Booking calendar** — the month grid of units by night, with a bar for every stay, hold, lease and out-of-service period.
- **Bar** — a coloured block on the calendar showing the nights a unit is held; its colour is the booking's status colour.
- **Type (stream)** — what was sold: Short stay, Day pass or Tenancy.
- **Stay date filter** — shows bookings with at least one night on the chosen days; never shows day passes.
- **Show empty units** — calendar option to include units with nothing on them that month.
- **Portal search** — the Search box (Ctrl K / ⌘K) at the top of every portal screen; finds screens, bookings, payments to verify, deposits and units.
- **Notifications bell** — the top-right bell listing new online bookings, payments to verify, failed booking emails and extra guests reported at the gate, from the last 14 days.
- **Edit (amend)** — changing a booking's dates, unit, guests, extras, late check-out, name, phone, vehicles or discount before check-in.
- **Reprice** — working out the booking's price again from Property settings as they are today; every edit does this.
- **Change the party** — the **Change** button beside **Party** on a booking's page: changes how many people a stay or day pass is for, even after check-in, and prices only that change.
- **Outstanding** — what a booking still owes (total minus verified payments), shown on the booking's Money card.
- **Overpaid by** — more has been paid than the booking's total; the difference is refunded outside the system.
- **(current)** — on the Edit screen, marks the unit the guest is booked into now.
- **Occupied tonight** — Confirmed and Checked-in bookings whose stay covers tonight.
- **Brunei time** — the time zone every "today" in the portal uses.

---

# 5. Payments — money coming in

## What this area is for

This area covers every way money arrives against a booking and how staff record it:

- **Verification queue** (sidebar: **Payments → Verification queue**; the screen's title is **Payment verification**). Every bank transfer a customer or staff member has said was sent, waiting for someone to check the bank app and confirm it. It covers both kinds of money: transfers for the **stay** and transfers for the **security deposit**.
- **Cash payments** (sidebar: **Payments → Cash payments**). A log of every cash payment for a stay, plus a **Record cash** button for recording cash against a booking by typing its reference.
- **The booking's own page** (open any booking): the **Money** card, with **Record a payment**, the **Security deposit** panel (with **Record the deposit**, **Confirm the transfer**, **Take it in cash instead** / **Take the deposit in cash**, and **Top up the deposit**), and the **Payments** card listing every payment with its own **Confirm** button.

It replaces checking WhatsApp screenshots against a spreadsheet: the system knows what each booking owes, which transfers are still waiting, who confirmed what and when, and whether the security deposit is in.

Two kinds of money, always kept apart:

- **Money for the stay** (the booking's price). This counts towards **Paid** on the booking and towards revenue.
- **The security deposit** (normally BND 100). It is a refundable amount the property holds and gives back after the stay. It is never counted as payment for the stay, never appears in **Paid**, and never appears on the Cash payments screen. It has its own ledger (see *Deposits, reports and finance*).

Who can do what, by default (an Admin can change who holds each permission in **Roles & staff**):

| Permission (as shown in Roles & staff) | Held by default | What it allows in this area |
|---|---|---|
| **Verify payments** | Admin, Front Office, Finance | Open the Verification queue; confirm that a bank transfer (stay or deposit) arrived; attach or remove a transfer slip; record a deposit top-up or a guest's owed amount *by bank transfer* (together with Record cash payments) |
| **Record cash payments** | Admin, Front Office, Security (the guard) | Open Cash payments and record cash; on the booking page: **Record a payment** (cash, or raise a transfer for the queue), **Record the deposit** (cash, or raise a deposit transfer for the queue), take a promised deposit in cash, **Top up the deposit** in cash |

So: **the guard can record cash but can never say a bank transfer landed.** Finance can confirm transfers but cannot record cash. Front Office and Admin can do both. Housekeeping can do neither.

## Screens

### Verification queue (Payment verification)

**Where:** sidebar **Payments → Verification queue**.

**Who can open it:** anyone holding **Verify payments** (Admin, Front Office and Finance by default). Anyone else sees **"You don't have access to this screen"** with the text *'Working the payment queue needs the "Verify payments" permission. Ask an administrator if this is part of your job.'* The guard (Security) and Housekeeping see this by default.

**The header says:** "Every bank transfer and every promised security deposit, the ones still waiting first. Check the amount in your bank app, then confirm — the longest wait is at the top. A guest who sent the deposit and the stay together is two rows here: confirm each at its own figure."

**What lands in it:**

- A **stay** transfer waiting to be checked. It is raised when:
  - a customer on the public site presses **I have made the transfer** and chose **Everything now** (the stay part becomes one row), or is booking a day pass (the whole pass price is one row) — see *The customer side* for what the customer sees;
  - staff create a booking at the desk and choose bank transfer for the stay (see *Creating bookings*);
  - staff press **Record a payment** on a booking and choose **Bank transfer — verify later** (for example to settle what an amendment added).
- A **security deposit** transfer waiting to be checked (a "promised" deposit). It is raised when:
  - a customer presses **I have made the transfer** on a short stay that quotes a deposit (whichever option they chose — **Just the deposit** or **Everything now** — the deposit is always its own row);
  - staff create a booking at the desk with the deposit by transfer;
  - staff press **Record the deposit** on a booking and choose **Bank transfer — verify later**.
- Cash never appears here. Cash has nothing to wait for; it goes straight to Cash payments (stay money) or the deposit ledger (deposit money).
- A booking a customer made online but has not yet pressed **I have made the transfer** on does **not** appear here yet — there is nothing to check until they say they sent it.

A customer who sends the deposit and the stay in one bank transfer (for example BND 700) creates **two rows**: BND 100 **Security deposit** and BND 600 **Stay**. Confirm each row at its own figure. Do not confirm one row for the whole BND 700.

**Order:** rows still waiting come first, **oldest wait at the top** (the queue is worked from the top down). Below them, verified stay payments, **newest first** (the most recently confirmed at the top of that half).

**Filters (top left):**

- A search box, **Reference or guest** — matches the booking reference, guest name or phone (for stay rows also the unit).
- **Show** — **Everything** (the default: waiting first, then verified), **Waiting** (only rows still to be checked), **Verified** (only stay payments already confirmed).
- **Clear** appears when a search is typed and clears the search.

To the right, a count: "*N* transfers" (or "*N* transfers waiting" on the Waiting view). Admins also see **Download CSV** (it needs the **Edit settings, roles & the unit registry** permission) — see *Deposits, reports and finance* for exports.

**Columns:**

| Column | What it shows |
|---|---|
| **Reference** | The booking reference, e.g. PV-4821. Clicking anywhere on the row opens the booking. |
| **Guest** | The guest's name. |
| **For** | **Stay** (bed icon) or **Security deposit** (padlock icon). This decides what confirming the row does — see below. A day pass's payment also shows as **Stay**. |
| **Arriving** | The first night of the stay, or a day pass's date. "—" if neither. |
| **Amount expected** (on the Waiting view) / **Amount** (on the other views) | For a waiting row: what the guest should have sent now. For a stay row that is what the booking still owes (its total less stay payments already verified); for a deposit row it is the deposit the booking quotes now. For a verified row: what actually arrived, with "of X due" underneath when that was different from what was due. |
| **Repriced** badge (under the amount) | The booking's price changed after the guest was told what to send (for example it was amended). Check the new figure before confirming. |
| **Waiting** | How long since the transfer was said to be sent: e.g. "45m", "3h 20m", "2 days". Hover for the exact time. "—" on verified rows. |
| **Slip** | **On file** (opens the customer's or staff's screenshot in a new tab) or **None** (stay row) / "—" (deposit row). A slip is evidence, not proof — always check the bank app. |
| **Action** | **Confirm** on a waiting row. On a verified row: a green tick and "Verified *date and time*". |

Underneath the table: "The bank app remains the check — a slip is evidence, not verification. Attach one from the booking."

**Rows per page:** 25 by default; 10 or 50 can be chosen in the footer.

**Empty states:** Everything view: "No bank transfers yet". Waiting view: "Nothing waiting on a transfer" — "Deposits and stays paid by bank transfer appear here until someone confirms the money landed. It is the deposit that confirms a booking." Verified view: "No payments verified yet". With a search that matches nothing: "No payments match these filters", with **Clear filters**.

**Where things go once confirmed:**

- A confirmed **stay** row stays in the queue, moving to the verified half (it is the log of confirmed transfers).
- A confirmed **security deposit** row **leaves the queue entirely**. Find it on the booking's **Security deposit** panel or on **Finance → Deposits**. The **Verified** view never shows deposits.
- A deposit row also leaves the queue if its booking is cancelled, marked no-show or expires before anyone confirms it (the promise "lapses").
- A **stay** row does **not** leave the queue when its booking is cancelled or expires. It stays in the Waiting half until someone confirms it. There is no button to remove or reject it (see *What to do when a transfer has not arrived*).

The **Payment to verify** notification in the bell (see *Finding and changing bookings*) goes to people who hold **Verify payments** when a customer presses **I have made the transfer** (or when a booking moves to **Awaiting payment** because staff raised a deposit transfer), and clicking it opens this queue.

### Cash payments

**Where:** sidebar **Payments → Cash payments**.

**Who can open it:** anyone holding **Record cash payments** (Admin, Front Office and Security by default). **Finance does not hold it by default**, so Finance sees **"You don't have access to this screen"** with *'Recording cash needs the "Record cash payments" permission, which sits with the front office. Ask an administrator if this is part of your job.'* (Finance reconciles cash on **Finance → Daily cash-up** instead.)

**The header says:** "Cash collected on site for a stay, recorded against a booking — who took it, when, and how much. A security deposit taken in cash is not here: it goes on the deposit ledger, recorded from the booking."

**What is listed:** every cash payment for a stay or a day pass, however it was recorded — from this screen's **Record cash** button, from **Record a payment** on a booking, from cash taken when a booking was created at the desk, and from cash the guard took at the gate. Deposit cash is never listed here.

**Filters:** a search box **Reference or guest** (also matches phone and unit), and a **Collected** date range. **Clear** clears both. The count to the right says "*N* payments" — how many match the filters, not just this page. The **Record cash** button is beside it.

**Columns:** **Collected** (date and time the cash was recorded), **Reference**, **Guest**, **Amount**, **Collected by** (the staff member's name with their initials; "Unknown" if they are no longer on the staff list), **Booking** (the booking's current status). Clicking a row opens the booking. **Newest first.** 25 rows per page by default (10 or 50 available).

**Total at the bottom:** the sum of every payment the filters match, across all pages, with the note: "Every payment these filters match, not just this page — and not a reconciliation. Comparing recorded cash against banked cash is the daily cash-up, a separate screen." (See *Deposits, reports and finance → Daily cash-up*.)

**Empty states:** "No cash recorded yet" — "Cash taken at the desk appears here as soon as it is recorded." With filters: "No cash payments match these filters", with **Clear filters**.

**There is no duplicate warning on this screen.** If you record the same cash twice, it is recorded twice, and a recorded payment cannot be deleted. (The gate's field screen does have a guard against the same cash being recorded twice — see *Field screens*.)

### The booking page: Money card

**Where:** open any booking (from **All bookings**, search, the queue, or Cash payments). The **Money** card sits beside the guest and stay details.

**Who sees it:** anyone who can view bookings. The buttons on it depend on permissions (below).

**What is on it, top to bottom:**

1. The booking's price lines and, if discounted, "Discounted …" with the reason.
2. **Total** — what the booking (the stay or pass) costs. The security deposit is not in it.
3. **Paid** — the sum of stay payments that are **verified** (cash recorded, or transfers confirmed). A transfer still waiting counts for nothing.
4. **Outstanding** *BND X* — shown only when the guest still owes something (Total minus Paid). Or **Overpaid by** *BND X* when more has been taken than the booking is worth. When the booking is exactly paid, neither line appears.
5. "A transfer is awaiting verification. It does not count towards what has been paid until someone has checked the bank." — shown while a stay transfer is waiting in the queue.
6. "More has been taken than this booking is worth. Refunds are settled outside the system." — shown when overpaid.
7. **Record a payment** — shown only when: you hold **Record cash payments**, something is **Outstanding**, and no stay transfer is already waiting. (Note: this button does not check the booking's status — see *Money after check-out or cancellation*.)
8. The **Security deposit** panel (see next section).

The card's help text says: "The security deposit secures the booking and is held apart from the total — never counted as revenue. It is taken when the booking is made, at the counter or by the transfer a customer promises online, and released after the unit has been inspected. Nothing is collected at check-in."

### The booking page: Security deposit panel

The grey panel inside the Money card headed with a padlock and **Security deposit**. What it shows depends on where the deposit has got to:

**No deposit recorded yet:**
- **Owed** *BND 100.00* (or **Quoted** if the booking is closed or quotes nothing), with one of:
  - "Nothing has been taken yet. The deposit is what secures this booking." — the booking is still waiting to be confirmed.
  - "Nothing has been taken yet — this booking was confirmed without it. Record the deposit before the guest is checked in; the door takes nothing." — a confirmed booking with no deposit (older bookings, or ones moved by hand).
  - "Waived when the booking was made: "*reason*". Nothing is collected against this stay." — the deposit was waived at booking (see *Creating bookings*).
  - "This booking quotes no security deposit, so nothing is collected against it." — e.g. a day pass.
  - "Nothing was taken against this stay, so nothing was kept." — a closed booking with nothing taken.
- **Record the deposit** button — for holders of **Record cash payments**, when a deposit is quoted and the booking is not closed.

**A deposit transfer promised but not yet confirmed** (badge **Transfer awaited**):
- Caption "Transfer awaited since *date and time*".
- The figure table shows **Held** and **To return** at the promised amount, but **nothing is actually held yet** — the badge **Transfer awaited** is what matters. Read it as "promised".
- **Confirm the transfer** — for holders of **Verify payments**. Opens the same confirm dialog as the queue.
- **Take it in cash instead** (for staff who also hold Verify payments) or **Take the deposit in cash** (for staff who don't, e.g. the guard) — for holders of **Record cash payments**, when the guest never sent the transfer and hands over cash.
- **Transfer slip** box: "No slip on file." with **Attach slip** (Verify payments holders), or the slip itself.

**A deposit held** (badges such as **Held before arrival**, **Guest in stay**, **Awaiting inspection**, **Ready to release**, **Released**, **Kept**):
- **Held** — what is actually held. **Less charges** — only if charges have been added. The last line: **To return** / **Would be owed** (before release) or **Returned** / **Owed by guest** (after release), or **Kept** if the deposit was kept on a cancellation or no-show.
- Caption "Taken in cash on *date*" or "Taken in bank transfer on *date*".
- **View the deposit** — opens the deposit's own screen (see *Deposits, reports and finance*).
- **Transfer slip** box for deposits that came by bank transfer.

**A deposit that is short** (badge **Short** beside the stage badge):
- Extra rows **Quoted** (what the booking asks for) and **Short** (the gap), e.g. Quoted BND 100.00, Held BND 50.00, Short BND 50.00.
- Caption "BND 50.00 short of the BND 100.00 this booking quotes." followed by either "The deposit is what secures this booking, so it is not secured until the rest is in." or "The guest cannot be checked in until the rest is in."
- **Top up the deposit** — for holders of **Record cash payments**, unless the booking closed without a stay. The **Short** flag disappears once the deposit is released or kept.

**A promise that lapsed** (booking cancelled, no-show or expired before the transfer was confirmed; badge **Never received**):
- **Promised** *BND 100.00* and "The transfer was never verified before the booking closed, so nothing was held and nothing was kept. If the money does arrive, it is given back outside the system."

### The booking page: Payments card

Below the Money card. Lists every stay payment on the booking (not the deposit). If none: "No payment recorded against this booking."

Each row shows:
- The method (**Cash** or **Bank transfer**) with a badge **Verified** or **Awaiting verification**, and **Matched by hand** if it was confirmed without a reference.
- The amount (what arrived, or what is expected while waiting).
- "Collected by *name* on *date*" (cash), "Verified by *name* on *date*" (transfer), or "Raised *date*" (still waiting).
- "Bank showed *reference*" — the reference the confirmer recorded.
- Any reason typed for an amount difference, and any note typed when confirming, in quotation marks.
- For bank transfers, a **Transfer slip** box: "No slip on file." with **Attach slip**, or the slip.

If a stay transfer is waiting and you hold **Verify payments**, a **Confirm** button sits at the bottom of the card. It opens the same dialog as the queue.

## How a transfer is matched to a booking

Every booking has a reference such as **PV-4821** (more digits once past 9999, e.g. PV-10432). The customer is asked to put it in the transfer description. When you check the bank app, you look for:

1. **The reference** — the transfer description should show PV-4821.
2. **The amount** — it should equal the **Amount expected** on the row (for a deposit, the quoted deposit).

The confirm dialog records both. The amount you type is compared with what is due **at that moment** (read fresh when you press Confirm), not with the figure the guest was told earlier. If the amount differs, a reason is required. If the reference is missing, a note is required and the payment is marked **Matched by hand**. Nothing is matched automatically — the system has no connection to the bank.

## How to …

### How to confirm a bank transfer for the stay

**Who can do this:** holders of **Verify payments** — Admin, Front Office and Finance by default (an Admin can change this in Roles & staff). The guard cannot.

**Where:** **Payments → Verification queue** → the row (For: **Stay**) → **Confirm**. Or on the booking page → **Payments** card → **Confirm**.

**Steps:**
1. Open your bank app and find the transfer.
2. Press **Confirm** on the row. The dialog **Confirm payment for PV-4821** opens: "The money for the stay. Check the amount against your bank app before confirming — the slip a guest sends is evidence, not verification."
3. **Amount received** is pre-filled with what is expected (shown underneath as "Expected BND X"). Change it to what actually arrived, like 442.00. A comma that separates thousands ("1,200.00") is fine, so a pre-filled figure can be confirmed untouched.
4. **Reference as it appeared** is pre-filled with the booking reference. Leave it if the bank shows that reference. Change it if the bank shows something different. **Clear it completely** if the bank showed no reference (see *How to confirm a transfer that came without the reference*).
5. **Notes (optional)** — anything worth keeping (who sent it, what time). Up to 280 characters.
6. If the amount differs, a panel appears (see *How to confirm an amount that is different*).
7. Press **Confirm** (or **Confirm with discrepancy** if the amount differs). **Not yet** closes without saving.

**What happens next:**
- The payment becomes **Verified**; **Paid** on the booking goes up by the amount received; the row moves to the verified half of the queue.
- What happens to the booking depends on the booking:
  - Booking **Awaiting payment**, quoting no deposit (a day pass, or a deposit waived), or its deposit already held in full → the booking becomes **Confirmed**. Message: "PV-4821 confirmed — Payment verified · *guest*". The guest is emailed their booking confirmation ("You are booked — Palm Villa PV-4821") if they gave an email address — see *The customer side* for the email.
  - Booking **Awaiting payment** but its deposit is not yet in (still promised, not taken, or short) → the payment is recorded but the booking stays **Awaiting payment**. Message: "Payment verified · PV-4821 — Confirm its security deposit to confirm the booking." No email yet; it goes when the deposit confirms the booking.
  - Booking already **Confirmed** (or later) → nothing about the booking changes. Message: "Payment verified · PV-4821 — *guest* — the booking was already confirmed." No email.
- An accounting pack for the booking is (re)built in the background (see *The booking's own page → Accounting pack*).
- The booking's history records "Payment verified", plus "Confirmed at an amount other than the total" if the amount differed, "Matched to a booking by hand" if there was no reference, and "Booking confirmed" if the booking moved.
- The dashboard's awaiting-payment figure and the bookings list update.

**Undoing:** a confirmation **cannot be undone** in the app. There is no un-verify, edit or delete for a payment. If you confirmed the wrong amount or the wrong booking, tell an Admin and Jefferson — it cannot be fixed from any screen.

**Edge cases and limits:**
- Only one person can confirm a row; if a colleague confirmed it a second earlier you get an error (below).
- The dialog checks the amount against what is due now. If the booking was amended (repriced) while the dialog was open, you are told and must give a reason.
- Confirming a transfer does not require a slip.
- A transfer already waiting in the queue can still be confirmed after the guest has checked out or after the booking was cancelled — the queue does not stop you. Check the booking's status before confirming a transfer for a booking that is **Cancelled**, **Expired** or **No show**; the money may need to go back (refunds happen outside the system).

**If you see an error:**
- "Enter the amount received." — the amount box is empty. Type the amount that arrived.
- "Enter an amount like 442.00." — the amount has a currency sign, letters, more than two decimals, or a comma in the wrong place (a comma is only accepted between groups of three digits, as in 1,200.00 — "1,20.00" or "12,00" is refused). Type digits and a point, like 1200.00 or 1,200.00.
- "This is less than the amount due. Say why it is being confirmed." / "This is more than the amount due. Say why it is being confirmed." — fill in **Why is this being confirmed?**.
- "No reference was quoted, so the note is the only thing identifying this transfer. Say what the bank showed." — you cleared the reference; write a note.
- "This payment has already been verified. Reload to see who confirmed it." — someone else got there first. Reload the page.
- "That payment no longer exists." — reload the page.
- "Someone else changed this booking while you were working on it. Reload and retry." — reload and try again.
- "This booking is still waiting on its security deposit, so the payment could not confirm it. Reload and try again." — rare; reload and try again.
- "This booking has been repriced. Check the amount due and say why it differs." — the booking's price changed while you had the dialog open (or you typed 0). Close, reload, and confirm against the new figure; give a reason if the amount received still differs.
- "Check the highlighted fields." — look for the red message under a field.

### How to confirm a security deposit transfer

**Who can do this:** holders of **Verify payments** — Admin, Front Office and Finance by default (Admin can change this). The guard cannot.

**Where:** **Payments → Verification queue** → the row (For: **Security deposit**) → **Confirm**. Or on the booking page → Money card → **Security deposit** panel → **Confirm the transfer**. Or on the deposit's own screen (see *Deposits, reports and finance*).

**Steps:**
1. Check the bank app for the deposit transfer (normally BND 100).
2. Press **Confirm** / **Confirm the transfer**. The dialog **Confirm the deposit for PV-4821** says: "The security deposit that secures this booking. Confirming it puts the money on the deposit ledger and confirms the booking. What the stay owes is unchanged by it."
3. **Amount received** is pre-filled with the deposit the booking quotes ("Quoted BND 100.00"). Change it if a different amount arrived.
4. **Reference as it appeared** — leave, change or clear it, exactly as for a stay transfer.
5. **Notes (optional)** — or required if you cleared the reference.
6. If the amount differs, fill in **Why is this being confirmed?**.
7. Press **Confirm** (or **Confirm with discrepancy**).

**What happens next:**
- The deposit is recorded as held (**collected**), by bank transfer, with your name and the time. It leaves the queue and appears on **Finance → Deposits** with stage **Held before arrival** (or later stages).
- **Paid** on the booking does **not** change. A deposit is not a payment for the stay; the stay is still owed in full unless paid separately.
- If the full quoted amount (or more) arrived and the booking was **Awaiting payment** → the booking becomes **Confirmed**. Message: "PV-4821 confirmed — Security deposit verified · *guest*". The guest is emailed their booking confirmation ("You are booked — Palm Villa PV-4821") if they gave an email.
- If **less** than the quoted amount arrived (accepted with a reason) → the deposit is recorded as **Short**, the booking is **not** confirmed, no email is sent, and the unit stays held. You must top it up later (see *How to top up a short deposit*). **Warning:** the message that appears in this case says "Security deposit verified · PV-4821 — *guest* — the booking was already confirmed." That wording is wrong for a short deposit — the booking is **not** confirmed. Check the booking: it will still say **Awaiting payment** and the deposit panel will show **Short**.
- If the booking was already **Confirmed** → nothing about the booking changes; the message ends "— the booking was already confirmed."
- No accounting pack is built for a deposit (the pack is for stay money).
- History: "Security deposit collected — BND 100.00, in bank transfer"; plus "Deposit accepted at an amount other than the BND 100.00 quoted figure" if it differed; "Matched to a booking by hand" if no reference; "Booking confirmed" if the booking moved.

**Undoing:** cannot be undone in the app.

**Edge cases and limits:**
- The amount is compared with the deposit the booking quotes **now**. If the booking was amended and the quoted deposit changed, use the new figure.
- More than the quote, with a reason, confirms the booking; the whole amount received is recorded as held.
- A deposit whose booking was cancelled, marked no-show or expired cannot be confirmed; it has already left the queue.
- If a guest sent the deposit and the stay together, confirm the deposit row at the deposit figure and the stay row at the stay figure. Whichever you do first, the booking is confirmed by the deposit row.

**If you see an error:**
- "Enter the amount that arrived." — the amount is empty, zero, or not a number.
- "That is not the BND 100.00 this booking quoted. Say why it is being accepted." — the amount differs and no reason was given (or the quote changed while the dialog was open). Give a reason or correct the amount.
- "No reference was quoted, so the note is the only thing identifying this transfer. Say what the bank showed." — write a note.
- "This deposit has already been verified. If it came up short, top it up from the booking." — someone already confirmed it. Reload. If it is short, use **Top up the deposit**.
- "Someone else moved this booking while you were working on it. Reload and try again."
- "Could not tell how this deposit was matched. Reload and try again."
- "That deposit no longer exists." — reload.
- "This booking has closed without a stay, so nothing more is taken against it. Reload to see how it closed." — the booking was cancelled, marked no-show or expired while you were working.
- "This deposit was kept when the booking closed, so nothing more is taken against it or charged to it."

### How to confirm a transfer that came without the reference (manual match)

**Who can do this:** holders of **Verify payments** (Admin, Front Office, Finance by default; Admin can change this).

**Where:** the same **Confirm** dialog, for a stay row or a deposit row.

**Steps:**
1. In the bank app, find a transfer you are confident belongs to this booking (sender name, amount, time).
2. Press **Confirm**. In **Reference as it appeared**, **delete the pre-filled reference so the box is empty** (its placeholder reads "Clear this if the bank showed none"). If the bank showed some other text instead of the reference, type that instead — then it is not a manual match and the note stays optional.
3. The box **Notes** becomes required and turns into a grey panel: "No reference was quoted, so this note is the only thing identifying the transfer. Recorded as a formal match with your name and the time." Write what the bank showed — e.g. "Sender name matches the guest and the amount is exact" or "sent by John's wife at 9pm, BIBD".
4. Check the amount and press **Confirm**.

**What happens next:** the payment or deposit is confirmed as normal, marked **Matched by hand** on the booking's Payments card, and the history adds "Matched to a booking by hand". Your note is shown on the booking.

**Undoing:** cannot be undone.

**Edge cases:** there is no separate "match manually" button — clearing the reference is how you say the bank showed none. A note of only spaces does not count.

**If you see an error:** "No reference was quoted, so the note is the only thing identifying this transfer. Say what the bank showed." — the note is empty. Write one.

### How to confirm an amount that is different (short or over)

**Who can do this:** holders of **Verify payments** for transfers; holders of **Record cash payments** for cash (Admin can change either).

**Where:** the **Confirm** dialog (transfers), or the cash dialogs.

**Steps (transfer):**
1. Type the amount that actually arrived in **Amount received**.
2. A grey panel appears: "**Short by BND 50.00** against the amount due." or "**Over by BND 50.00** against the amount due."
3. Fill in **Why is this being confirmed?** (up to 280 characters), e.g. "Guest is settling the balance in cash on arrival" or "Guest transferred the security deposit as well". Under it: "Recorded against the payment with your name and the time. No refund or balance is calculated — any difference is settled outside the system."
4. The button now reads **Confirm with discrepancy**. Press it.

**What happens next:**
- For a **stay** payment: the amount that arrived is what counts. **Paid** goes up by that amount, so a short payment leaves an **Outstanding** balance on the booking (which can be settled later with **Record a payment**), and an over-payment shows **Overpaid by**. The booking is confirmed exactly as it would be for the right amount — a short stay payment still confirms a booking that quotes no deposit or whose deposit is already in.
- For a **deposit**: a short deposit is recorded as **Short** and **does not confirm the booking** (see *Short deposits*). An over-large deposit confirms it, and the whole amount is held.
- History adds "Confirmed at an amount other than the total" (stay) or "Deposit accepted at an amount other than the quoted figure" (deposit), with your reason.

**Undoing:** cannot be undone.

**Edge cases:** a short **day pass** payment confirms the booking but the pass cannot be admitted until it is paid in full — the gate and the desk will refuse with "This day pass is not paid in full. Take the rest from the booking, then admit it." Take the rest as cash with **Record a payment**.

**If you see an error:** "This is less than the amount due. Say why it is being confirmed." / "This is more than the amount due. Say why it is being confirmed." — fill in the reason.

### What to do when a transfer has not arrived

**Who can do this:** staff with **Verify payments** decide; Front Office/Admin can cancel (see *The booking's own page*).

**Where:** Verification queue.

There is **no Reject button and no "not received" status**. A waiting row simply stays in the queue, oldest at the top, until someone confirms it. Nothing expires: the unit stays held for as long as the booking waits (this is the owner's decision). The system never chases the customer — following up is the desk's job.

What you can do:
1. **Wait and leave it.** Do not press Confirm until the money is in the bank app. Confirming the exact expected amount asks for no reason at all, so confirming money that never arrived would look like a real payment.
2. **The guest pays in cash instead:**
   - For a **deposit** row: open the booking → Security deposit panel → **Take it in cash instead** / **Take the deposit in cash**. This settles the promised transfer and removes it from the queue (see *How to take a promised deposit in cash*).
   - For a **stay** row: the booking page hides **Record a payment** while a stay transfer is waiting, so cash would have to go through **Payments → Cash payments → Record cash**. Be aware that the waiting transfer row then **stays in the queue** (there is no way to withdraw it), and it would now be matched against a smaller amount due. Tell a manager so it is not confirmed later by mistake.
3. **Cancel the booking** if the guest has gone (see *The booking's own page → Cancel*). A waiting **deposit** row leaves the queue and shows as **Never received**. A waiting **stay** row does **not** leave the queue.

This is not settled yet — whether there should be a proper "transfer never arrived" outcome is an open question. Ask Jefferson/Jason.

### How to record cash from the Cash payments screen

**Who can do this:** holders of **Record cash payments** — Admin, Front Office and Security (the guard) by default (Admin can change this). Not Finance by default.

**Where:** **Payments → Cash payments** → **Record cash**.

**Use it for:** money for a **stay** or a **day pass** only. **Never** for the security deposit — record the deposit from the booking page. Cash typed here always counts as stay money.

**Steps:**
1. Press **Record cash**. The dialog **Record cash** says: "Money for a stay, recorded as collected now, by you. The security deposit is not recorded here — it is taken from the booking itself, and it is what confirms one."
2. **Booking reference** — type the full reference, e.g. PV-4821 (upper or lower case is fine; the "PV-" part is needed).
3. **Amount collected** — count the notes and type the amount (e.g. 200.00, or 1,200.00 — a comma between thousands is fine). "Count the notes. If this is not what the booking still owes you will be asked why."
4. Press **Record cash**.
5. If the amount is not exactly what the booking still owes, the form comes back with a panel **This is not the amount due — why is that?** and the message "This is not the amount due. Say why that is, and it will be recorded with it." Type a reason (up to 280 characters, e.g. "Late check-out collected at the desk") and press **Record cash** again.

**What happens next:**
- The payment is recorded as **Cash**, **Verified**, collected by you, now. It appears at the top of this list and in **Paid** on the booking. Message: "BND 200.00 recorded — Cash against PV-4821".
- If the booking was waiting (**Draft**, **Held** or **Awaiting payment**) and quotes no deposit or its deposit is already held in full, the booking becomes **Confirmed** and the guest is emailed their confirmation ("You are booked — Palm Villa PV-4821") if they gave an email.
- If the booking is still waiting on its deposit, the cash is recorded but the booking stays waiting. Message: "Cash against PV-4821 — it is confirmed once its deposit is".
- An accounting pack is (re)built in the background.
- History: "Cash recorded", and "Booking confirmed" if it moved.
- It counts in that day's **Daily cash-up** under your name (see *Deposits, reports and finance*).

**Undoing:** cannot be undone or edited. There is no delete. A mistaken entry needs an Admin and Jefferson.

**Edge cases and limits:**
- The amount is compared with what the booking **still owes** (Total minus verified payments), not the whole total.
- This screen **does not check** whether a bank transfer for the same money is already waiting in the queue, and it **does not warn about duplicates**. Check the booking first.
- It will record an amount on a booking that is already fully paid if you give a reason — that creates an overpayment. Don't.
- It refuses bookings that are **Completed** (checked out), **Cancelled**, **No show** or **Expired**.
- Who and when are always you and now; you cannot back-date or record on a colleague's behalf.

**If you see an error:**
- "Enter the booking reference." / "Enter the amount collected." — a box is empty.
- "Enter an amount like 442.00." — remove currency signs or extra decimals, and any comma that is not between thousands (1,200.00 is fine; 1,20.00 is not).
- "No booking found with reference PV-4821." (with "Check the reference and try again." under the box) — check the reference, including the "PV-" part.
- "This booking is completed, so cash cannot be recorded against it." (or "cancelled", "no show", "expired") — the booking is closed. See *Money after check-out or cancellation*.
- "This is not the amount due. Say why that is, and it will be recorded with it." — give a reason.
- "Someone else changed this booking while you were working on it. Reload and retry."
- "This booking is still waiting on its security deposit, so the cash could not confirm it. Reload and try again."
- "That booking no longer exists."

### How to record a payment from the booking page (cash or bank transfer)

**Who can do this:** holders of **Record cash payments** — Admin, Front Office and Security by default (Admin can change this).

**Where:** booking page → **Money** card → **Record a payment**. The button only appears when something is **Outstanding** and no stay transfer is already waiting.

**Use it for:** settling what the booking still owes for the stay — typically the stay itself on arrival for a booking secured by its deposit, or the extra an amendment or a change to the party added. Not for the deposit (that is the **Security deposit** panel just below).

**Steps:**
1. Press **Record a payment**. The dialog says "PV-4821 still owes BND X for the stay. The security deposit is taken separately, from the panel below."
2. **Method**: **Cash — collected now** (the default) or **Bank transfer — verify later**.
3. **For cash:** **Amount collected** is pre-filled with what is outstanding. Count the notes; change it if the guest hands over a different amount. If it differs from the outstanding figure, a panel **This is not what is outstanding — why is that?** appears immediately — type a reason (e.g. "Guest paying the rest on arrival"). Press **Record cash**.
4. **For bank transfer:** there is no amount to type. The notice says "A transfer for BND X will appear in the verification queue. The booking is not settled until someone checks the bank and confirms it — the amount is entered then, against the statement." Press **Send to the queue**.
5. **Not yet** closes without saving.

**What happens next:**
- **Cash:** recorded as verified, collected by you. **Paid** goes up at once. Message "BND X recorded — Cash against PV-4821" (or "… — it is confirmed once its deposit is" if the booking is still waiting on its deposit). If this is what confirms the booking (booking waiting, no deposit owed), it becomes **Confirmed** and the confirmation email goes out. It appears on Cash payments and in the daily cash-up. An accounting pack is rebuilt.
- **Bank transfer:** a waiting row appears in the Verification queue for the outstanding amount. Message "Transfer awaiting verification — PV-4821 is in the payment queue". **Paid** does not change until someone with **Verify payments** confirms it. The booking status does not change. History: "Bank transfer awaited".
- The guard may raise a transfer this way: it only says the guest *intends* to transfer; someone who can check the bank still has to confirm it.

**Undoing:** neither can be undone. A raised transfer cannot be withdrawn — it stays in the queue until confirmed.

**Edge cases and limits:**
- Only one stay transfer can wait at a time per booking.
- The button is hidden when the booking is fully paid or overpaid.
- For amounts of BND 1,000 or more the cash amount is pre-filled with a comma ("1,200.00"). That is fine — record it as it is.
- See *Money after check-out or cancellation* for closed bookings.

**If you see an error:**
- "Enter an amount like 200.00." — the amount is empty, zero, has a comma in the wrong place (only a comma between thousands, as in 1,200.00, is accepted) or is not a number.
- "This is not what is outstanding. Say why." / "This is not the amount due. Say why that is, and it will be recorded with it." — give a reason.
- "This booking is fully paid. There is nothing left to collect."
- "This booking has been overpaid. Settle the difference outside the system."
- "A transfer is already awaiting verification on this booking. Confirm that one first."
- "This booking is completed, so cash cannot be recorded against it." (or cancelled / no show / expired).
- "Someone else changed this booking while you were working on it. Reload and retry."
- "This booking is still waiting on its security deposit, so the cash could not confirm it. Reload and try again."
- "That booking no longer exists." / "Check the highlighted fields."

### How to record the security deposit on a booking

**Who can do this:** holders of **Record cash payments** — Admin, Front Office and Security by default (Admin can change this).

**Where:** booking page → **Money** card → **Security deposit** panel → **Record the deposit**. Shown only when no deposit has been recorded yet, the booking quotes one, and the booking is not closed.

**When:** as soon as the guest pays it. The deposit is what secures the booking, and **check-in refuses a booking whose deposit is not held in full** — nothing is collected at check-in, so record it before the guest is checked in.

**Steps:**
1. Press **Record the deposit**. The dialog says "PV-4821 quotes a BND 100.00 refundable security deposit."
2. **How was it taken?** — **Cash — counted now** or **Bank transfer — verify later**. There is no amount to type: the deposit is always the booking's quoted figure.
3. Read the notice:
   - Cash: "BND 100.00 goes on the deposit ledger as money the property holds and owes back after the stay. This confirms the booking. What the stay owes is unchanged by it." (or "The booking is already confirmed, so nothing about it moves.")
   - Transfer: "A BND 100.00 transfer will appear in the verification queue. Nothing is held until someone checks the bank and confirms it — the unit stays held until then, and the booking is confirmed by that."
4. Press **Record the deposit** (cash) or **Send to the queue** (transfer).

**What happens next:**
- **Cash:** the deposit is held (stage **Held before arrival**), collected by you, now. If the booking was waiting (**Draft**, **Held** or **Awaiting payment**), it becomes **Confirmed** — even though the stay is still owed — and the guest gets the confirmation email if they gave an email. Message "BND 100.00 deposit collected — PV-4821 is confirmed" (or "Held against PV-4821"). History: "Security deposit collected — BND 100.00, in cash" and "Booking confirmed". It is **not** added to **Paid**, not on Cash payments, and appears on its own line in the daily cash-up.
- **Transfer:** a **Security deposit** row appears in the Verification queue; the panel shows **Transfer awaited**. A booking that was **Draft** or **Held** becomes **Awaiting payment**. Message "Deposit transfer awaited — PV-4821 is in the payment queue". History: "Security deposit transfer awaited — BND 100.00". Nothing is held until someone confirms it.

**Undoing:** cannot be undone. A promised transfer can later be settled in cash instead (next task), but cannot be deleted.

**Edge cases:** you cannot enter a different amount here. If the guest hands over less than the quoted deposit in cash, this is not the right button: the system has no way to record part of a deposit taken in cash (a deposit can only end up short when a bank transfer for less than the full amount is confirmed). Don't record the partial cash as the deposit. The booking stays held and cannot be checked in until the full deposit is recorded. What to do with a guest who only has part of the deposit in cash is not settled yet — ask Jefferson/Jason.

**If you see an error:**
- "Choose how the deposit was taken." — pick a method.
- "This booking quotes no security deposit, so there is nothing to take against it."
- "A security deposit is already held against this booking." — reload; it was already recorded.
- "This booking is already waiting on a deposit transfer. Confirm that one from the payments queue, or take the deposit in cash." — a transfer was already promised; you cannot promise a second one.
- "Someone else moved this booking while you were working on it. Reload and try again."
- "This booking has closed without a stay, so nothing more is taken against it. Reload to see how it closed."
- "That booking no longer exists."

### How to take a promised deposit in cash (the transfer never came)

**Who can do this:** holders of **Record cash payments** — Admin, Front Office and Security by default (Admin can change this).

**Where:** booking page → **Security deposit** panel (showing **Transfer awaited**) → **Take it in cash instead** (if you can also verify payments) or **Take the deposit in cash** (if you cannot, e.g. the guard).

**When:** the customer said they transferred the deposit (or staff raised a deposit transfer), but the money is not in the bank and the guest hands over cash instead. Do **not** confirm the transfer in the queue for money that came in cash.

**Steps:**
1. Press the button. The dialog **Take the deposit in cash** says "PV-4821 is waiting on a BND 100.00 transfer that has not been verified."
2. There is no method choice — it is cash. Notice: "The awaited transfer is settled by the BND 100.00 counted here, and the booking is confirmed. What the customer said they sent stays on the record, so the deposit still shows that a transfer was claimed."
3. Press **Record the deposit**.

**What happens next:** the deposit is held as cash, collected by you; the deposit row leaves the Verification queue; a booking that was **Awaiting payment** becomes **Confirmed** and the confirmation email goes out (if the guest has an email). History: "Security deposit collected — BND 100.00, in cash".

**Undoing:** cannot be undone. If the original transfer later turns up in the bank as well, the guest has paid twice; that refund happens outside the system.

**If you see an error:** the same as *How to record the security deposit on a booking*.

### How to top up a short deposit

**Who can do this:** holders of **Record cash payments** for cash — Admin, Front Office and Security by default. **To record the top-up as a bank transfer you also need Verify payments** (so Admin and Front Office, who hold both, by default). So the guard can only top up with cash; Finance cannot top up at all by default. Admin can change these.

**Where:** booking page → **Security deposit** panel (showing **Short**) → **Top up the deposit**.

**When:** the deposit held is less than the booking quotes — because a transfer was confirmed short, or because an amendment raised the quoted deposit after it was taken.

**Steps:**
1. Press **Top up the deposit**. The dialog says "PV-4821 holds BND 50.00 of the BND 100.00 it quotes."
2. **Amount received** is pre-filled with the gap ("Short by BND 50.00"). Change it if the guest gives less. You cannot enter more than the gap.
3. **How was it taken?** (only if you hold Verify payments): **Cash — counted now** or **Bank transfer — seen in the bank**. Choose bank transfer only if you have already seen the money in the bank app — a top-up never goes to the queue. Without Verify payments there is no choice: it is cash.
4. Read the notice: either "This leaves BND X still owed on the deposit, so the booking stays as it is. Nothing is held against the stay until the deposit is whole." or "It goes onto the same deposit, bringing it to the BND 100.00 quoted. This confirms the booking. What the stay owes is unchanged by it." (or "The booking is already confirmed, so nothing about it moves.")
5. Press **Record the top-up**.

**What happens next:**
- The amount is added to the same deposit. Message "BND 50.00 added to the deposit" with "PV-4821 is confirmed", "BND X still owed on the deposit", or "Held in full against PV-4821".
- If this makes the deposit whole and the booking was waiting, the booking becomes **Confirmed** and the confirmation email goes out. A top-up that leaves it still short changes nothing about the booking and sends nothing.
- The **Short** flag disappears once it is whole. The guest can now be checked in.
- History: "Security deposit topped up — BND 50.00, in cash — BND 100.00 held of BND 100.00". Cash top-ups appear on the daily cash-up's deposit line for the day they were taken.

**Undoing:** cannot be undone.

**Edge cases and limits:**
- Not offered, and refused, once the deposit is released or kept, or once the booking closed without a stay.
- Not possible on a deposit that is still only a promised transfer — confirm it (or take it in cash) first.

**If you see an error:**
- "Enter the amount that arrived." / "Enter an amount like 50.00." — fix the amount (must be more than zero; a comma is only accepted between thousands, as in 1,050.00).
- "This deposit is only BND 50.00 short. Enter that or less." — you typed more than the gap.
- "Nothing has been taken against this booking yet. Record the deposit instead."
- "This deposit is still an unverified transfer. Confirm it in the payments queue first."
- "This deposit has already been released."
- "This deposit is already the full quoted figure."
- "This booking closed without a stay, so nothing more is taken against its deposit."
- "This booking has closed without a stay, so nothing more is taken against it. Reload to see how it closed." / "This deposit was kept when the booking closed, so nothing more is taken against it or charged to it."
- "Someone else moved this booking while you were working on it. Reload and try again."
- "The top-up could not be recorded. Reload the screen and try again."

### How to attach a transfer slip (the customer's screenshot)

**Who can do this:** holders of **Verify payments** — Admin, Front Office and Finance by default (Admin can change this). Anyone who can view bookings can open a slip.

**Where:** booking page → **Payments** card → the bank transfer → **Transfer slip** → **Attach slip**; or for the deposit, **Security deposit** panel → **Transfer slip** → **Attach slip**.

**Steps:** press **Attach slip** ("The bank app is still the check — a slip is evidence, not verification. Kept privately as an accounting record."), choose the file (JPEG, PNG, WebP or PDF, up to 4 MB) and press **Attach**. The general upload steps are in *The booking's own page → Documents*.

**What happens next:** the queue's **Slip** column shows **On file**. Customers can also upload their own slip from their booking page (see *The customer side*). A slip does not confirm anything.

**Undoing:** a Verify payments holder can remove the slip from the same place.

**If you see an error:** "A slip belongs to a bank transfer. Cash was counted at the desk." — cash has no slip. "There is already a slip on file for this. Remove it before attaching another."

### How to record what a guest owed beyond the deposit (after release)

This is on the deposit's own screen and is covered in *Deposits, reports and finance*. The permission rule is the same as for top-ups: **Record as settled** needs **Record cash payments**; choosing **bank transfer** also needs **Verify payments**, so the guard can only record it as cash.

### How to deal with an overpayment or a refund

**Who:** Front Office/Admin/Finance, outside the system.

The app **never pays money back and never records a refund** of stay money. It only shows the figure:
- The Money card shows **Overpaid by BND X** and "More has been taken than this booking is worth. Refunds are settled outside the system." **Record a payment** disappears, and raising a transfer is refused with "This booking has been overpaid. Settle the difference outside the system."
- Cancelling a booking says "Anything paid for the stay itself is refunded outside the system." (see *The booking's own page → Cancel*).
- An amendment that lowers the price leaves the booking overpaid (see *Finding and changing bookings → Amend*).
- Giving back the security deposit is the release process on the Deposits screen (see *Deposits, reports and finance*).

Hand back or transfer the money as the business normally does. The overpaid figure stays on the booking; there is no way to mark it refunded.

## Money after check-out or cancellation

- **Cash cannot be recorded against a booking that is Completed (checked out), Cancelled, No show or Expired** — from the booking page, from Cash payments, or at the gate. The message is "This booking is completed, so cash cannot be recorded against it." (the status word changes).
- **Record the deposit** is not offered on a closed booking, and deposit money is refused on a booking that closed without a stay.
- **Take the stay money before the guest checks out.** The owner's decision is that a guest who leaves still owing is dealt with by the office outside the system. The gate's screen warns about this before check-out; **the portal's Check out dialog does not** — check the Money card for **Outstanding** before pressing Check out.
- **What the app does not currently stop:** on a completed or cancelled booking with something outstanding, **Record a payment** is still shown. Choosing cash is refused as above, but **Bank transfer — verify later** is accepted and puts a row in the queue, and a stay transfer already waiting can still be confirmed after check-out or cancellation. Do not raise new transfers against closed bookings; ask the office manager how to handle money that turns up late.
- **Top up the deposit** is still offered on a checked-out booking whose deposit is short and not yet released.

## What each money state means and what it unlocks

| State | What it means | What it unlocks |
|---|---|---|
| **Awaiting payment** (booking status) | Someone said money was sent, or the booking is waiting for its deposit to be confirmed. | Nothing yet. The unit stays held with no time limit. |
| **Transfer awaited** (deposit badge) | A deposit transfer was promised; nobody has seen it in the bank. Nothing is held. | Nothing. Check-in is refused. |
| **Deposit held** (badges **Held before arrival**, **Guest in stay**, etc.) | The full quoted deposit (or more) was counted in cash or confirmed in the bank. | **Confirms the booking** (if it was waiting) and sends the confirmation email. **Check-in is allowed** (a stay also needs the booking to be Confirmed). |
| **Short** (deposit badge) | Some of the deposit was taken, less than the booking quotes. | **Nothing.** A short deposit secures nothing: the booking is not confirmed, no email is sent, and check-in is refused ("Only BND 50.00 of the BND 100.00 security deposit is held. Top it up from the booking, then check the guest in."). The money that did arrive is held and recorded. |
| **Paid in full** (Money card: no Outstanding line) | Verified stay payments equal the total. | A **day pass** can be admitted only when paid in full (and confirmed, and on its date). For a stay, full payment is not required for check-in; the stay is normally settled on arrival. For a booking that quotes **no** deposit, paying confirms it. |
| **Outstanding** | Total minus verified stay payments is above zero. Waiting transfers don't count. | **Record a payment** is offered. The guard's gate screen asks for it before check-out. |
| **Overpaid by** | More stay money verified than the booking is worth. | Nothing; settle outside the system. |

Which money confirms a booking:
- A booking that **quotes a security deposit** is confirmed by that deposit **and nothing else** — counted in cash, or confirmed in full in the queue. Money for the stay never confirms it while the deposit is owed; it is recorded and reduces what is owed.
- A booking that **quotes no deposit** (a day pass, or a deposit waived at booking) is confirmed by its stay payment — cash recorded, or a transfer confirmed (even if short, with a reason).

The check-in refusals staff may see (see *The booking's own page → How to check a guest in (from the portal)*):
- "The BND 100.00 security deposit has not been taken. Record it from the booking, then check the guest in."
- "The BND 100.00 security deposit transfer has not been verified. Confirm it from the payments queue, or take it in cash from the booking, then check the guest in."
- "Only BND 50.00 of the BND 100.00 security deposit is held. Top it up from the booking, then check the guest in."

## Cash vs bank transfer vs other methods

- **Cash** — counted in hand; recorded as verified straight away; settles money at once. Recorded by anyone with **Record cash payments** (including the guard). Stay cash appears on **Cash payments** and in the daily cash-up total; deposit cash appears on the deposit ledger and on its own line in the daily cash-up, not in the total.
- **Bank transfer** — to BIBD or Baiduri (the account numbers are kept in **Property settings → Bank accounts**; see *Units and property settings*). A promised transfer counts for nothing until someone with **Verify payments** confirms it in the bank app. Exception: a deposit top-up or an owed amount recorded "seen in the bank" is recorded as already arrived and never goes to the queue — which is why it needs **Verify payments**.
- **No other method exists.** There is no card payment, no cheque, no online payment gateway. The app only records cash and bank transfers.

## Emails triggered by payment events

Only one email comes from this area: the **booking confirmation** ("You are booked — Palm Villa PV-4821"), sent once, at the moment a booking becomes **Confirmed**, and only if the guest gave an email address. It is sent when:
- a deposit transfer confirmed in full confirms the booking;
- a deposit counted in cash (including a promise taken in cash) confirms it;
- a top-up makes the deposit whole and confirms it;
- a stay payment (cash or confirmed transfer) confirms a booking that quotes no deposit or whose deposit is already in.

No email is sent when: a transfer or deposit transfer is raised, a stay payment is confirmed while the deposit is still owed, a short deposit is confirmed, a top-up still leaves it short, or anything is recorded against a booking that was already confirmed. There is no "payment received" receipt email. If sending fails, the booking's history shows it and the bell shows a notification. For the email's contents and failure handling see *The customer side → Emails*.

## Rules the system enforces

- **A short payment or overpayment is never silently accepted.** Any amount that differs from what is due needs a typed reason, for transfers and cash alike. The database enforces this, not just the screen.
- **Amounts are matched against what is owed now**, read fresh when you press the button, so an amendment made meanwhile is caught.
- **A transfer with no reference needs a note** and is marked **Matched by hand**.
- **A booking quoting a deposit is confirmed only by that deposit, in full.** A short deposit secures nothing.
- **Check-in takes no money** and refuses unless the deposit is held in full (or none is quoted).
- **A promised transfer counts for nothing** — not in **Paid**, not as a held deposit — until someone who can check the bank confirms it.
- **The guard never says a transfer landed.** Recording anything as a bank transfer that has already arrived needs **Verify payments**. Raising a transfer for the queue is allowed, because it records nothing as arrived.
- **One stay transfer waiting at a time per booking**, and one deposit per booking.
- **Deposit and stay money are never mixed.** The deposit is never in **Paid**, never on Cash payments, never revenue (unless kept on a cancellation or no-show — see *Deposits, reports and finance*).
- **Nothing is refunded, forfeited or netted by the payment screens.** Differences are stated; money movement happens outside the system.
- **Nothing expires.** A waiting transfer holds the unit until someone acts.
- **Recorded money cannot be edited or deleted.** Every payment, confirmation and deposit carries who did it and when, in an append-only history.
- **Amounts** are typed as digits with up to two decimals (e.g. 442.00) — no "BND", no minus sign. A comma between thousands (1,200.00) is accepted; a comma anywhere else (1,20.00 or 12,00) is refused.

## Likely questions

**Q: A customer says they paid but I can't see it in the queue.**
A: The queue only shows a transfer once the customer presses **I have made the transfer** on their booking page (or staff raise one). Search the queue by reference or name, and check **Show: Everything**. If a confirmed deposit is what you are looking for, it has left the queue — look at the booking's Security deposit panel or **Finance → Deposits**. If the customer never pressed the button, open the booking and use **Record the deposit → Bank transfer — verify later** (for the deposit) or **Record a payment → Bank transfer** (for the stay), then confirm it once you see it in the bank.

**Q: The customer sent BND 700 in one transfer but there are two rows.**
A: That's correct: BND 100 for the **Security deposit** and BND 600 for the **Stay**. Confirm each at its own figure. Don't type 700 into either.

**Q: The transfer is BND 50 short. What do I do?**
A: Type the amount that actually arrived and give a reason. For a stay payment the booking then shows BND 50 **Outstanding**, which can be collected later with **Record a payment**. For a deposit, the deposit shows **Short**, the booking is not confirmed and the guest can't be checked in until you **Top up the deposit**.

**Q: I confirmed a short deposit and the message said the booking was already confirmed. Is it?**
A: No. That message is misleading in this case. A short deposit never confirms a booking. Check the booking: it will still be **Awaiting payment** with a **Short** badge on the deposit. Top it up when the rest arrives.

**Q: A customer paid half the deposit by transfer and the rest in cash. What do I do?**
A: Confirm the transfer in the queue at the amount that arrived (e.g. 50.00) with a reason like "rest paid in cash at the desk". Then on the booking's Security deposit panel press **Top up the deposit**, enter the cash amount, choose **Cash — counted now**, and press **Record the top-up**. When the deposit is whole the booking is confirmed.

**Q: The guest forgot to put the reference on the transfer.**
A: Confirm it as normal, but clear the **Reference as it appeared** box and write a note saying why you are sure it's theirs (sender name, amount, time). It will be marked **Matched by hand**.

**Q: The transfer never arrived. How do I reject it?**
A: There is no reject button. Leave the row until the money arrives. If the guest pays the deposit in cash, use **Take it in cash instead** / **Take the deposit in cash** on the booking. If the guest has gone, cancel the booking (deposit rows then leave the queue; stay rows do not). Never press Confirm for money you can't see in the bank.

**Q: I'm the guard. Why can't I open the Verification queue?**
A: Checking the bank is not the guard's job by default — the guard holds **Record cash payments** but not **Verify payments**. You can take cash (deposit, stay, day pass) and record it. For a transfer, call the office.

**Q: As a guard, why is there no "Bank transfer" option when I top up a deposit?**
A: Recording a transfer as already arrived needs **Verify payments**, which the guard doesn't have. You can only top up with cash you've counted.

**Q: I'm Finance. Why can't I open Cash payments or record cash?**
A: Finance doesn't hold **Record cash payments** by default; Finance reconciles cash on **Daily cash-up**. Ask an Admin if you need it.

**Q: The "Record a payment" button is missing.**
A: It only appears when you hold **Record cash payments**, the booking has something **Outstanding**, and no stay transfer is already waiting in the queue. If a transfer is waiting, confirm or deal with that first. If the booking is fully paid or overpaid, there's nothing to collect.

**Q: The "Record the deposit" button is missing.**
A: It only shows when no deposit has been recorded yet, the booking quotes one, the booking isn't closed, and you hold **Record cash payments**. If the panel shows **Transfer awaited**, use **Confirm the transfer** or take it in cash; if it shows **Short**, use **Top up the deposit**.

**Q: I recorded cash against the wrong booking / twice / the wrong amount. How do I undo it?**
A: You can't from any screen — recorded payments can't be edited or deleted. Tell an Admin and Jefferson with the reference, amount and time.

**Q: I recorded the BND 100 deposit on the Cash payments screen by mistake.**
A: That screen always records stay money, so it now counts towards **Paid** and the cash-up total, not the deposit, and the booking still shows the deposit as owed. It can't be undone in the app; tell an Admin and Jefferson. In future, record deposits from the booking's Security deposit panel.

**Q: The guest wants to pay after they've checked out.**
A: Cash can't be recorded against a checked-out (Completed) booking. The owner's decision is that the office deals with it outside the system. Collect the stay before check-out — check the Money card before pressing Check out.

**Q: The amount box is pre-filled with a comma, like 1,200.00. Do I need to remove it?**
A: No. A comma between thousands is accepted, so a pre-filled figure can be confirmed or recorded as it is. Typing 1200.00 without the comma works too. "Enter an amount like 442.00" only appears if the comma is in the wrong place (1,20.00 or 12,00), or there is a currency sign, a letter or a third decimal.

**Q: The guest paid too much. How do I refund them?**
A: The app shows **Overpaid by BND X** but does not do or record refunds. Refund outside the system as the business normally does.

**Q: What does the "Repriced" badge mean?**
A: The booking's price changed after the guest was told what to send (usually an amendment). The **Amount expected** shows the new figure; if the guest sent the old one, confirm with a reason.

**Q: Does confirming a stay payment confirm the booking?**
A: Only if the booking quotes no deposit (e.g. a day pass or a waived deposit) or its deposit is already held in full. Otherwise the payment is recorded and the booking waits for its deposit; the message tells you "Confirm its security deposit to confirm the booking."

**Q: Can the guest check in if the stay isn't paid?**
A: Yes — check-in only needs the booking Confirmed and the deposit held in full. The stay is normally settled on arrival; take it with **Record a payment** (or the guard takes it at the gate).

**Q: Why does the Money card say Paid BND 0 when the guest paid the deposit?**
A: The deposit isn't a payment for the stay and never counts in **Paid**. It's shown in the Security deposit panel.

**Q: The deposit panel shows "Held BND 100.00" but the badge says Transfer awaited.**
A: While the badge says **Transfer awaited**, nothing is actually held — the figure is what was promised. It becomes real once someone confirms the transfer.

**Q: Does a slip prove the guest paid?**
A: No. Slips can be edited. Always check the bank app; the slip is kept as evidence and for the accounting pack.

**Q: Who confirmed this payment, and when?**
A: The booking's Payments card says "Verified by *name* on *date*" (or "Collected by" for cash), and the queue's verified rows show the time. The booking's history has the full trail.

## Terms

- **Verification queue / Payment verification** — the screen listing bank transfers (stay and deposit) waiting to be checked, then confirmed stay transfers.
- **Confirm (a transfer)** — saying you have seen the money in the bank app; needs **Verify payments**.
- **Verify payments** — the permission to confirm transfers (Admin, Front Office, Finance by default).
- **Record cash payments** — the permission to record money taken against a booking (Admin, Front Office, Security by default).
- **Booking reference / transfer reference** — the PV- code (e.g. PV-4821) the customer puts in the transfer description.
- **Amount expected** — what a waiting row should bring in now: the stay balance still owed, or the quoted deposit.
- **Matched by hand** — a transfer confirmed although the bank showed no reference; a note was required.
- **Confirm with discrepancy** — confirming an amount different from what was due, with a reason.
- **Repriced** — the booking's price changed after the guest was told what to send.
- **Paid** — the sum of verified stay payments; excludes the deposit and waiting transfers.
- **Outstanding** — Total minus Paid, when above zero.
- **Overpaid by** — Paid above the Total; refunded outside the system.
- **Paid in full** — nothing outstanding; needed to admit a day pass.
- **Security deposit** — the refundable amount (normally BND 100) that secures a booking; held apart from the stay's money.
- **Quoted** — the deposit the booking asks for.
- **Held** — the deposit actually taken.
- **Transfer awaited** — a deposit transfer promised but not yet confirmed; nothing held.
- **Short** — a deposit held below the quoted figure; secures nothing until topped up.
- **Top up the deposit** — adding the missing part of a short deposit.
- **Never received** — a promised deposit whose booking closed before it was confirmed.
- **Take it in cash instead / Take the deposit in cash** — settling a promised deposit transfer with cash at the desk.
- **Awaiting payment** — booking status while money (or the deposit) is waiting to be confirmed.
- **Transfer slip** — the customer's screenshot of a transfer; evidence, not proof.
- **Cash payments** — the log of cash taken for stays and day passes (never deposits).

---

# 6. Deposits, reports and finance

## What this area is for

This area is the money that is not a booking payment, and the figures the business is run on:

- **Deposits** (sidebar: **Finance → Deposits**) is the security deposit ledger. It answers "what deposits are we holding right now, and what do we owe back?" It also runs the whole after-check-out journey for a deposit: the unit is inspected, charges are raised or waived, somebody approves the release, and a printable statement is produced for the guest.
- **Reports** (sidebar: **Finance → Reports**) shows revenue by stream, occupancy by unit type and by unit, day-pass volume against capacity, and two "as of now" figures: deposits held and money owed by guests.
- **Daily cash-up** (sidebar: **Finance → Daily cash-up**) compares the cash recorded against bookings with the cash banked, day by day, and keeps a running "cash on hand" figure. Trips to the bank are recorded here.
- **Accounting packs** are PDFs the system builds by itself for each booking once a payment has been verified. They appear on the booking's own page.
- **CSV exports** ("Download CSV") let you take reports and whole tables away as spreadsheets.

It replaces the Excel sheets and WhatsApp messages used to track deposits, the manual assembly of PDF packs for the accountant, and counting the drawer against a notebook.

**Two things this area never does:** it never moves money, and it sends no emails. Approving a deposit release records who authorised what and the figures. The actual refund (cash handed back, or a transfer from the bank app) happens outside the system. Nothing in this area emails the guest. The statement is a page you print or save as PDF and send yourself.

---

## Screens

### Deposits (the ledger)

**Where:** sidebar **Finance → Deposits**.

**Who can open it:** anyone with the **View bookings** permission, which is every default role: Admin, Front Office, Security, Housekeeping and Finance. Without it you see "You don't have access to this screen" and the line 'Seeing the deposits held needs the "View bookings" permission. Ask an administrator if this is part of your job.' What each person can *do* on a deposit depends on their other permissions (see the tasks below).

**Heading text:** "Every security deposit the property is holding, what stands against it, and what has been given back. A deposit is taken when a booking is made, so most of what is here belongs to guests who have not arrived yet."

**The tiles across the top.** They count the whole ledger, and clicking a tile or filter does not change them:

| Tile | What it shows |
|---|---|
| **Total held** | The total BND of every deposit the property holds right now, and how many deposits that is. This figure is not clickable. |
| **Held before arrival** | Count of deposits held for guests who have not arrived yet. Click to show only these. |
| **Guest in stay** | Count of deposits for guests who are checked in now. Click to filter. |
| **Awaiting inspection** | Count of deposits where the guest has checked out and nobody has recorded an inspection yet. Click to filter. |
| **Ready to release** | Count of deposits where the unit has been inspected and a release can be approved now. Click to filter. |
| **Owed by guests** | The total BND guests still owe beyond their deposit (after a release where charges were more than the deposit, and nobody has recorded the money as paid), and how many guests owe it. Click to switch to that list. |

Clicking a tile that is already selected clears it. A stage tile replaces any stage selection rather than adding to it.

**What "held" means here.** A deposit is on the held list when the money has actually been seen (cash counted, or a transfer verified), has not been released, and was not kept on a cancellation or no-show. These are **not** on the held list:
- A transfer the customer says they have sent that nobody has checked yet (**Transfer awaited**). That work is in the Verification queue. See *Payments → Verification queue*.
- A deposit that was released. It is in the archive.
- A deposit kept when a booking was cancelled or the guest did not arrive (**Kept**).
- A promised transfer on a booking that closed without a stay (**Never received**).

**The filter row** (just above the table):
- **Search**, with the placeholder "Booking, guest or unit". It matches the booking reference, the guest's name or the unit.
- **Stage**: pick one or more of Held before arrival, Guest in stay, Awaiting inspection, Ready to release. This chip only narrows held deposits. Choosing a stage while you are looking at the "Owed by guests" list takes you back to the held list.
- **Stay date**: shows deposits whose stay *touches* the dates you choose, not only stays that start inside them. A deposit with no stay dates is hidden when a date range is set.
- **Clear** (funnel icon) appears when any filter is set and removes them all.
- **Download CSV**, on the right. Only Admin sees it by default (see *CSV exports*).

Filters live in the web address, so you can bookmark a filtered view or send the link to a colleague. The browser's Back button undoes a filter.

**The table columns:**

| Column | What it shows |
|---|---|
| **Booking** | The booking reference. The whole row opens the deposit's own page. |
| **Guest** | Guest name. |
| **Unit** | The unit, or a dash if the booking occupies no unit. |
| **Stay date** | Arrival → departure dates. |
| **Stage** | The stage badge (see *Deposit stages* below). |
| **Held** | What was actually taken. If less than the booking quotes and not yet released, an amber **Short BND x** badge appears under it. |
| **Charges** | Total of charges standing against the deposit (waived charges not counted). A dash means nothing is charged. |
| **Outcome** | For a deposit not yet released: "Held since <date and time>". For a released one: "Returned BND x" or "Owed BND x", and under it the release date, or "Settled" / "Not yet settled" when the guest owes money. |

**Sort order.** The held list is a work queue, not a register. **Ready to release** comes first, then **Awaiting inspection**, then **Guest in stay**, then **Held before arrival**. Within each group the oldest comes first, ordered by the stay's departure date (or, with no stay, by when the deposit was taken). The deposit that has waited longest is at the top.

**Paging.** The held list shows a page footer only when there are more rows than one page holds. The "Owed by guests" list always has a footer. **Rows per page** offers 10, 25 (default) or 50.

**The released archive.** The ledger has a view of all released deposits, newest release first. **No tile or button leads to it.** It opens only by typing the address with `?show=released` after `/deposits`. What you normally see is the held list, or the "Owed by guests" list via its tile.

**Empty states:**
- "No deposits held": "A security deposit is recorded when a booking is made — counted at the desk, or verified from the payments queue — and appears here until it has been released."
- "No deposits match these filters", with a **Clear filters** button.
- On the owed list: "Nothing to show here" / "No guest owes anything beyond their deposit.", with a **Show everything held** button.

### Deposit stages (the badge)

A deposit's stage is worked out from facts. Nobody sets it by hand. It only moves forward.

| Badge | Colour | Meaning | What happens next |
|---|---|---|---|
| **Transfer awaited** | amber | The customer says they transferred the deposit, but nobody has verified it. The property holds nothing yet. | Someone with Verify payments checks the bank (Verification queue, the deposit page or the booking). Not on the held list. |
| **Held before arrival** | green | The money is in. The guest has not arrived. | Nothing until the guest checks in. |
| **Guest in stay** | teal/active | The guest is checked in. | Check-out. Charges can already be raised now. |
| **Awaiting inspection** | amber | The guest has checked out and the unit has not been inspected. | Housekeeping (or Admin) records the inspection. |
| **Ready to release** | green | The unit has been inspected. The release can be approved now. | Finance or Admin approves the release. |
| **Released** | grey | A release has been approved (or the deposit was given back when a booking was cancelled). | Hand the money back outside the system. If the guest owes money, record it when paid. |
| **Kept** | grey | The booking was cancelled with "keep", or the guest did not arrive. The deposit is now the business's money and counts as revenue on that day. | Nothing. It cannot be charged against or released. |
| **Never received** | grey | A transfer was promised but never verified before the booking closed without a stay. | Nothing. Nobody is waiting on it. |

"Owed" is **not** a stage. A guest owing money is a fact about a released deposit. It shows in the Outcome column, the **Owed by guests** tile and the deposit's own page.

### A deposit's own page

**Where:** click a row on **Deposits**, or use the **View the deposit** link in the Security deposit panel on a booking's page. The address is `/deposits/<booking reference>`.

**Who can open it:** anyone with **View bookings**. Every action on it is shown only to people who hold that action's permission, so different people see different buttons on the same page. Nothing is shown greyed out.

**Top of the page:**
- **All deposits** (back link).
- The booking reference as the title, then a **Short** badge if the deposit is short of the quoted amount, the stage badge and the guest's name.
- For someone who may approve releases, when approval is not yet possible, a sentence under the title explains why (for example "The unit has not been inspected yet. Housekeeping records the inspection first."). People without that permission do not see the sentence.
- Buttons: **View booking details**; **Statement** (only after a release); **Approve release** (only for Finance/Admin, and only when the deposit is ready).

**Security deposit** section. The hint reads: "Held as a liability, and counted as revenue only when a guest who cancels or never arrives forfeits it. Released after the unit has been inspected and somebody has approved it; the approval is a record of who authorised what, and handing the money back happens outside the system." It holds a small figures table:
- **Quoted** and **Short**, only when less was taken than the booking quotes.
- **Held**: what was taken.
- **Less charges**: only when there are charges.
- A last line that changes with the stage: **To return** or **Would be owed** before a release (a forecast); **Returned** or **Owed by guest** after a release (fact); **Kept** for a forfeited deposit.

Under the table:
- If short: "BND x short of the BND y this booking quotes. It needs to be topped up before the booking is secured and the guest can be checked in — top it up from the booking…" with a link to the booking. Topping up is on the booking page (see *Payments*).
- Fields: **Collected** (date/time, "in cash" or "in bank transfer"), or **Transfer awaited** / **Transfer never verified** with "Promised <date>, not yet verified"; **Taken by**; **Stay** (unit · dates, or "Occupies no unit"); **Released** (date by name), if released; **Kept — did not arrive** or **Kept — cancelled** (date by name), if kept.
- The release note in quotation marks, if one was written.
- For someone with **Verify payments**, while a transfer is awaited, the same verify controls as the Verification queue (see *Payments → How to confirm a security deposit transfer*). Taking the deposit in cash instead is done from the booking, not here.

A person shown as "the system" did not do it by hand. "a former colleague" means the staff account no longer exists.

**Inspection** section:
- When inspected: an outcome badge (**Clean**, green; **Issues found**, amber), the date and time and who inspected, and the notes (or "Nothing was noted about the unit."). Below that is a **Photographs** panel listing the photos, or "None taken. A photograph is the cheapest evidence in a disputed charge.", plus **Add photographs** / **Add more** for people with **Record inspections**.
- When not inspected, one of these sentences shows:
  - "The guest has not arrived yet. The unit is inspected after they check out."
  - "The guest is still in the unit. It is inspected after they check out."
  - "Nobody has inspected the unit yet. The deposit cannot be released until somebody has." In this case a **Record inspection** button shows for people with **Record inspections**.
  - "Nobody stayed, so there is nothing to inspect. The deposit was settled when the booking closed."

**Charges** section: a table with **What for**, **Added by**, **Amount**, and a **Waive** button per charge for Finance/Admin. Waived charges stay in the list, struck through, with "Waived by <name> — "<reason>"". Under the table: "BND x stands against this deposit." or, when there are none, "Charges come off what is returned when the release is approved." The **Add charge** button is here for Front Office/Admin.

**Owed by the guest** section. It only appears after a release where charges were more than the deposit. It shows the amount owed, and either "The charges came to more than the deposit. The statement is what to send." or "Settled <date>, in cash/bank transfer." The hint reads: "The system keeps the record; recovering the money is a conversation. If this becomes common, the deposit itself is the thing to revisit." A **Record as settled** button shows for people with **Record cash payments**.

**History**: everything recorded against the deposit, newest first, in one list. That covers the deposit itself, the inspection, every charge, and the inspection photographs (including removed ones). Example lines: "Security deposit collected — BND 100.00, in cash", "Inspection recorded — issues found", "Charge added — BND 30.00", "Charge waived — BND 30.00", "Release approved — BND 70.00 returned", "Release approved — BND 30.00 owed by the guest", "Amount owed settled — BND 30.00, in cash", "Security deposit kept — BND 100.00, booking cancelled", "Security deposit returned — BND 100.00, booking cancelled". Empty: "Nothing recorded against this deposit yet."

**If the booking has no deposit yet**, the page shows "No deposit has been collected yet" and explains: "The BND x security deposit on this booking has not been taken yet. It is what secures the booking, and it is recorded from the booking itself — in cash, or as a transfer for the queue to verify. Nothing is collected at check-in." For a booking that quotes no deposit it says "This booking quotes no security deposit, so nothing is collected against it." There is a **View booking details** button. A booking reference that does not exist gives a "not found" page.

### The deposit statement (printable)

**Where:** the **Statement** button on a released deposit's page. The address is `/deposits/<reference>/statement`.

**Who can open it:** anyone with **View bookings**. Without it: "You don't have access to this statement".

**Before a release:** "Nothing to state yet" / "A statement is produced once the release has been approved, because that is when the figures stop moving." with an **Open the deposit** button.

**What it contains:** "Palm Villa", **Security deposit statement**, the booking reference; **Guest**, **Unit**, **Stay**, **Deposit taken** (date, cash or transfer); **Inspection** (outcome, date, notes, or "No inspection was recorded."); **Charges** (each standing charge's reason and amount, or "Nothing was charged against this deposit."). Waived charges are **not** shown on the statement. Then the totals: **Deposit quoted** (only if more than was held), **Deposit held**, **Less charges** (shown even when it is 0.00), then either **Returned to guest** or **Amount owed by guest**. Under **Approved** it gives the date and time and who approved, the release note if any, and "The amount owed was settled on <date>, in <method>." if that has been recorded. The footer reads "Prepared <today's date>. Figures are in Brunei dollars."

The figures are the ones frozen at approval. Adding or waiving charges afterwards is impossible, so the statement never changes after it is given out.

**Buttons:** **Back** (returns to wherever you came from) and **Print**. Print opens the browser's print dialog; choose "Save as PDF" to get a file to send by WhatsApp or email. The buttons do not appear on the printout.

### Reports

**Where:** sidebar **Finance → Reports**.

**Who can open it:** **View reports**: Finance and Admin by default. Others see "You don't have access to this screen" / 'Reading the reports needs the "View reports" permission, which sits with Finance. Ask an administrator if this is part of your job.'

**The period.** Every report on the screen covers one period, set with the **Period** chip. Its quick choices are **Today**, **Yesterday**, **Last 7 days** (today and the six days before), **Month to date**, **Last month** and **Year to date**, or you can pick any two dates on the calendar (both days included). With nothing chosen the screen shows **month to date** (the 1st of this month to today), and the heading says which dates. **Clear** appears only when you picked a period yourself. Changing the period resets the unit-type filter on "Occupancy by unit".

**Tiles:**

| Tile | What it is |
|---|---|
| **Revenue received** | Total revenue in the period (see "Revenue by stream"), with "n payments and n kept deposits in the period". |
| **Occupancy** | The building's occupancy for the period as a percentage, with "x of y unit-nights". |
| **Deposits held** | Right now, not for the period: the same figure as **Total held** on Deposits. Clicking opens Deposits. |
| **Owed by guests** | Right now: the total guests owe beyond their deposits. Clicking opens the "Owed by guests" list on Deposits. |

**Revenue by stream** (with a **Download CSV** button). Rows are **Short stay**, **Day pass** and **Tenancy**, always all three even at zero, then an **All streams** total row. Columns: **Type**, **Cash**, **Bank transfer**, **Kept deposits**, **Total**, **Payments** (number of payments). How it is counted:
- **Money received, not money quoted.** Only verified payments count. Booking totals, pending transfers and promises do not.
- **Dated by when the money was taken or checked, not by the stay.** Cash counts on the Brunei day it was collected. A bank transfer counts on the Brunei day someone confirmed it in the Verification queue — the confirm dialog has no box for the date the money appeared in the bank, so a transfer that sat unchecked over a weekend counts on the day it was confirmed. A stay's money counts in the period it was paid, not the period of the stay (cash basis).
- **Security deposits are not revenue**, whether held or given back. The one exception is a deposit **kept** because the guest cancelled or did not arrive. It counts in the **Kept deposits** column and the total on the day it was kept, in its booking's stream. It is **not** in the Cash or Bank transfer columns, so the Cash column still agrees with the cash-up.
- Money a guest pays for charges above their deposit (recorded as "settled") is **not** revenue here.
- A note under the table: "A long lease is recorded as an occupancy with no booking and no payments, so it appears in occupancy above and at zero here." Tenancy revenue therefore shows zero.

**Occupancy by type** (with **Download CSV**). One row per unit type, then a **The building** total row. Columns: **Type**, **Units**, **Nights occupied**, **Nights available**, **Occupancy**. How it is counted:
- A unit-night is occupied when a stay or lease covers it and is **confirmed**, **checked in**, **completed** or **leased**. Units that are only **held**, and no-shows, cancelled and expired bookings, do not count.
- Nights available = number of units of that type × nights in the period. **Units out of service still count as available.**
- Nights, not days. A stay from the 12th to the 14th is two nights (the 12th and 13th). The period's last day counts as a night.
- A type with no units shows "—" rather than 0%. With no unit types set up: "No unit types are configured, so there is nothing to measure occupancy against."
- A future period is allowed. It shows how full confirmed bookings make those dates.

**Occupancy by unit.** It has its own **Type** filter (with **Clear**), which narrows only this table and does not change the tiles or the by-type table. **Download CSV** sits beside the filter and exports what the filter shows. Columns: **Unit** (click to open the unit), **Type**, **Nights occupied** ("x of y"), **Occupancy**. Paged, with **Rows per page** 25, 50 or 100. Empty: "No units of that type. Units are added in the unit registry." or "No units are configured. The unit registry is where the building is described."

**Day passes against capacity** (with **Download CSV**). A line above the table gives the capacity. It reads "Capacity n a day — the smallest set on a facility the pass includes." or "No day-pass capacity is set, so nothing limits a day. Set one per facility in Property settings → Day pass." Rows are only the days on which passes were sold. Columns: **Date**, **Guests**, **Capacity**, **Full**. A **Period · x of y days** total row compares all the period's guests with capacity × every day of the period, including days nobody came. How it is counted:
- It counts **guests** (headcount), not passes. A family of five fills five places.
- It counts every pass whose booking is not cancelled, expired or a no-show. That includes passes still being paid for.
- Capacity is **today's** setting applied to every past day. The system keeps no history of capacity. "Closed" means capacity 0; "No limit set" means none.
- Empty: "No day passes were sold for a day in this period."

Each section has a small "i"/hint icon next to its title that repeats how it is counted.

### Daily cash-up

**Where:** sidebar **Finance → Daily cash-up**. The address is `/reports/cash-up`.

**Who can open it:** **View reports**, which is Finance and Admin by default. Front Office and the guard take cash but cannot open this screen by default. Others see "You don't have access to this screen" / 'Reconciling the day's cash needs the "View reports" permission, which sits with Finance. Ask an administrator if this is part of your job.'

**What it counts:**
- **Cash recorded**: cash **payments against bookings** (stays and day passes), on the Brunei day they were collected. This includes cash the guard takes at the gate.
- **Deposits taken**: cash taken that day for security deposits, including cash top-ups of short deposits. It is **shown beside the total, never added to it**, because a deposit is money held for the guest, not takings. It explains why the drawer holds more than "Cash recorded".
- Transfers are not counted: they never pass through the drawer. Money a guest pays for charges above their deposit ("Record as settled") is not counted either.
- **Banked**: what was recorded as banked on that day (see *How to record a banking*).
- **Cash on hand**: a **running balance**. It is everything taken, minus everything banked, since the system started, as it stood at the end of that day. It is not a per-day difference. One trip to the bank clears several days at once, and nothing needs matching day by day. This is the figure you can check by counting the safe.

**The period.** The same **Period** chip and quick choices as Reports, defaulting to month to date. It can never run past today: a later end date is cut back to today. A period that starts in the future shows "That period has not happened yet" / "A day can only be cashed up once the desk has taken the money. Pick a period ending today or earlier." with **Clear filters**.

**Tiles:** **Cash recorded** ("Cash payments against bookings"); **Banked** ("n bankings in the period"); **Cash on hand** at the end of the period ("Taken and not yet banked", or "Includes BND x brought forward" when cash was already unbanked before the period began); **Deposits taken** ("In the drawer, not in the total").

**Day by day** table. Every day in the period is listed, newest first, including quiet days: "a cash-up is read to confirm that nothing was missed". Columns: **Day** (click to open that day), **Cash recorded** (with the number of payments in small grey text), **Deposits taken**, **Banked**, **Cash on hand**, **State**. Paged, with **Rows per page** 25, 50 or 100.

**States (badges)**. These describe the running balance at the end of the day:

| Badge | Colour | Meaning |
|---|---|---|
| **Clear** | green | "Everything taken has reached the bank." Cash on hand is exactly 0. |
| **On hand** | grey | "Cash taken and not yet banked. The ordinary state between bank runs." Not a problem. |
| **Over-banked** | red | "More banked than was ever recorded as taken — a payment is missing, or a banking was entered twice." Cash on hand is negative (shown with a minus sign). This is the one state that is definitely wrong and will not fix itself by waiting. |

The **State** column heading has a legend icon explaining the three states. A **State** filter chip narrows the list to chosen states. It only hides rows; every row keeps the balance it really closed on. If nothing matches: "No days in this period are <state>." **Clear** removes the period and the states.

**Controls on the right:** **Download CSV** (see *CSV exports*) and **Record banking** (people with **Verify payments** who can open this screen, which in practice means Finance and Admin).

### One day's cash-up

**Where:** click a day on the Daily cash-up. The address is `/reports/cash-up/<date>`. Same permission as the cash-up.

**Top:** a **Daily cash-up** back link, the title **Cash-up**, and the day's state badge. **Previous day** / the date / **Next day** buttons step between days; **Next day** is greyed out on today. **Record banking** shows for Finance/Admin.

**Tiles:** **Cash recorded** (n payments), **Banked** (n bankings), **Cash on hand** at the end of this day (with the amount brought forward, if any).

**Cash payments:** every cash booking payment that day, newest first, with **Collected** (time), **Reference** (click to open the booking), **Guest**, **Collected by**, **Amount**, and a **Recorded** total row. Empty: "No cash taken this day" / "Cash recorded against a booking appears here, with who collected it." If deposit cash was taken that day, an "Also in the drawer" panel shows its total. It reads "Cash taken this day for security deposits, held as a liability rather than as takings — the deposits ledger is where they are answered for."

**Banked:** each banking recorded against this day, with **Recorded** (when it was entered), **By**, **Note**, **Amount**, and a **Banked** total row. Empty: "Nothing banked against this day yet", with a **Record banking** button for those allowed. Footnote: "A banking cannot be edited. If one was recorded wrongly, add a second entry — both stay on the day, and the balance moves."

A future date shows "That day has not happened yet". An invalid date in the address gives "not found".

### Accounting packs

An accounting pack is a PDF the system assembles by itself for each booking, for the accountant. It replaces building the pack by hand. It shows in the **Accounting pack** section of the booking's own page. Opening it, the **Rebuild now** button and what the section says are covered in *The booking's own page → Accounting pack*. Anyone with **View bookings** can open a pack. Nobody can upload or delete one by hand.

**When it is built:**
1. **When money is verified or recorded against the booking**: a transfer verified in the Verification queue, cash recorded from the booking or the Cash payments screen, or cash the guard takes at the gate for a stay or a day pass (not for the deposit). The pack is built a second or two after the click and does not slow the click down. If building fails, nothing is shown to the clerk (the payment itself did go through) and the nightly run tries again.
2. **Every night at 02:00 Brunei time** (the scheduled job runs at 18:00 UTC). It rebuilds every booking whose pack is missing or out of date. "Out of date" means that since the pack was built, the booking was changed (including check-in, check-out or an amendment), a payment was verified, or an identity document or transfer slip was attached or removed. **At most 25 packs are built per night**, oldest first. A large backlog clears over several nights. A booking whose pack fails stays on the list and is retried the next night.
3. **By hand**, with **Rebuild now** on the booking page. This needs **Verify payments**: Front Office, Finance and Admin by default.

A pack is only built once the booking has **at least one verified payment**. A booking with only a deposit, or only a pending transfer, has no pack. Security deposits never trigger a pack.

**What is in it:** a cover page ("Palm Villa", **Accounting record**, the reference) with **Booking reference**, **Assembled** (when), **Status at assembly**, **Type** (stream), **Guest**, **Phone**, **Vehicles**, **Unit**, **Stay**, **Party**. Then:
- **Itemised booking**: every price line (Description, Qty, Unit, Amount), **Total**, **Paid**, and **Outstanding**, **Overpaid** or "Settled in full.". It also shows the discount, if any, and a line about the security deposit: quoted and "Held separately and not part of this total; see the deposit statement.", or "waived at booking: <reason>", or "No security deposit was quoted on this booking."
- **Payments**: each payment with its status, who collected or verified it and when, the reference the bank showed, how it was matched (by payment reference, or by hand with the reason), any reason for an amount that differed, and which attachment is its slip ("None — cash is counted at the desk" for cash).
- **Identity document**: that the IC/passport was collected, when, by whom, and its record number. **The IC image is never copied into the pack.** The pack says why: the pack is kept 7 years and opened by anyone who can view bookings, while an IC is kept 12 months and only opened by people allowed to see identity documents.
- **Attachments**: each transfer slip on its own page, copied in, including a slip for the security deposit, labelled "transfer slip for the security deposit". A slip saved as WebP cannot be copied in, so its page says "This slip is stored in a format the pack cannot copy in. It is on file and opens from the booking."
- The file is named `<reference>-accounting-pack.pdf`. Names in scripts the PDF font cannot print (for example Chinese or Jawi) appear as "?", with a note saying so.

Packs are kept for 7 years by default. Older versions are kept in the booking's history.

---

## How to …

### How to see which deposits we hold right now

**Who can do this:** anyone with **View bookings** (every default role). An Admin can change who holds it in **Roles & staff**.
**Where:** **Finance → Deposits**.
**Steps:**
1. Read the **Total held** tile: the amount and number of deposits held right now.
2. The four stage tiles split that number by where each deposit is.
3. Use **Search**, **Stage** or **Stay date** to narrow the list, for example **Stay date** for "deposits for the August guests".
**What happens next:** nothing changes; this is read-only.
**Edge cases and limits:** unverified transfers, kept deposits and released deposits are not in "held". The same held total also appears on **Reports** as **Deposits held**.

### How to find a deposit

**Who can do this:** anyone with **View bookings**.
**Where:** **Finance → Deposits → Search**, or the booking's page → Security deposit panel → **View the deposit**, or the portal search at the top (it also finds released and kept deposits).
**Steps:** type the booking reference, guest name or unit, then click the row.
**Edge cases and limits:** the Deposits search box only searches the list you are on (held, or owed). To find a released or kept deposit, go through the booking or the portal search.

### How to record the inspection after check-out

**Who can do this:** people with **Record inspections**: Housekeeping and Admin by default. **Front Office, Finance and Security cannot** unless an Admin gives them the permission.
**Where:** Housekeeping normally does it on the phone from the field screens (see *Field screens → How to record an inspection, with photos*). From a desk: the deposit's page → **Inspection** → **Record inspection**, or the unit's page (see *Units*).
**Steps (deposit page):**
1. Open the deposit. The stage must be **Awaiting inspection** (guest checked out, no inspection yet).
2. Click **Record inspection**.
3. Under **How was the unit found?** choose **Clean** or **Issues found**.
4. If **Issues found**, fill in **What was found?** (required). If Clean, **Notes (optional)**. Up to 2,000 characters.
5. Optionally add photographs under **Photographs (optional)** (JPEG, PNG or WebP; each is made smaller before it is sent).
6. Click **Record inspection** (or **Record and attach** if photos were chosen).
**What happens next:** the toast says "<unit> inspected", then "The deposit can now be released." and how many photographs were attached. The deposit moves to **Ready to release**. The unit moves on in its turnover (see *Units*). The deposit history shows "Inspection recorded — clean" or "— issues found".
**Edge cases and limits:**
- The button only appears once the guest has **checked out**. Before that the card says the guest has not arrived or is still in the unit.
- **An inspection can never be changed or deleted once recorded.** The dialog warns: "What is recorded here is what the release is approved against, and it cannot be changed afterwards."
- Charges are separate. They can be raised whether or not anything was found.
- If some photographs fail to upload, the inspection is still recorded. The dialog switches to "Photographs of <unit>" / "The inspection is recorded. What is left is the photographs that did not go up." Choose them again and press **Attach photographs**, or close and add them later from the inspection card.
- One inspection per stay. A day pass has no unit, so nothing is inspected.
**If you see an error:**
- "This stay has not ended yet. A unit is inspected after the guest has checked out." Check the guest out first (see *The booking's own page*).
- "This stay has already been inspected." Somebody else recorded it; reload.
- "Say what was found. A charge against this deposit will be read against it." You chose Issues found with empty notes.
- "Choose how the unit was found." No outcome was chosen.
- "Keep the notes under 2,000 characters."
- "This booking occupies no unit, so there is nothing to inspect."
- "That booking no longer exists." Reload.

### How to add photographs to an inspection afterwards

**Who can do this:** **Record inspections** (Housekeeping, Admin).
**Where:** the deposit's page → **Inspection** → **Photographs** → **Add photographs** / **Add more**.
**Steps:** choose the files and send them. They are kept privately. Opening them needs **View bookings**.
**What happens next:** they are listed with who attached them, and the history records it. Removing a photograph is possible for the same people; the removal stays in the history (see *The booking's own page → Documents*).
**Edge cases and limits:** photos can be added only after an inspection exists. Inspection photographs are kept 24 months by default.

### How to raise a charge against a deposit

**Who can do this:** **Create charges**: Front Office and Admin by default (Finance cannot by default).
**Where:** the deposit's page → **Charges** → **Add charge**.
**Steps:**
1. Click **Add charge**.
2. **Amount**: dollars and cents, like 30.00 or 1,200.00. Do not type "BND".
3. **What is it for?**: required, 3 to 280 characters. It is printed on the guest's statement.
4. Click **Add charge**.
**What happens next:** the toast says "Charge added — Against <reference>." The charge appears in the table with your name, and the total standing against the deposit updates. **To return** goes down, or **Would be owed** appears. History: "Charge added — BND x".
**Edge cases and limits:**
- Charges can be added any time from when the deposit is **held**: before arrival, during the stay (for example a broken window on night two) or after check-out, **up until the release is approved**. After approval the button disappears for good.
- Not possible on an unverified transfer, a **Kept** deposit, or a booking that was cancelled or marked no-show.
- If the charge takes the total past what is held, the dialog warns: "This takes the charges past the BND x held. The difference becomes an amount owed by the guest, which the system records but cannot collect." It is allowed: the deposit is not a cap on what a guest can owe.
- **A charge cannot be edited or deleted.** A wrong charge must be **waived** by Finance or Admin, and then the right one added.
**If you see an error:**
- "Enter an amount." / "Enter an amount in dollars and cents, like 25.00." / "Enter an amount greater than zero."
- "Say what this charge is for." (under 3 characters) / "Say what this is for." / "Keep the reason under 280 characters."
- "This deposit has already been released, so its charges are closed. The statement is what was approved." Someone approved the release while you had the dialog open. The charge cannot be added in the system; recovering it is a conversation with the guest.
- "The deposit transfer has not been verified yet, so there is nothing held to charge against. Confirm it in the payments queue first."
- "This deposit was kept when the booking closed, so nothing more is taken against it or charged to it."
- "This booking has closed without a stay, so nothing more is taken against it. Reload to see how it closed."
- "That deposit no longer exists." Reload.

### How to waive (drop) a charge

**Who can do this:** **Waive charges**: Finance and Admin by default (not Front Office).
**Where:** the deposit's page → **Charges** → **Waive** on the charge's row.
**Steps:**
1. Click **Waive**. The dialog asks "Waive BND x?" and explains that the charge stops counting and the guest gets that much more back.
2. Fill in **Why is it being dropped?** (required, 3–280 characters).
3. Click **Waive charge** (or **Keep the charge** to back out).
**What happens next:** the toast says "Charge waived — BND x no longer comes off this deposit." The charge stays in the list, struck through, with "Waived by <name>" and your reason. The figures update. History: "Charge waived — BND x". A waived charge does **not** appear on the statement.
**Edge cases and limits:** only before the release is approved. **Waiving cannot be undone.** To reinstate it, raise a new charge (Front Office/Admin).
**If you see an error:** "Say why this charge is being dropped." / "Keep the reason under 280 characters." / "This charge has already been waived." / "This deposit has already been released, so its charges are closed. The statement is what was approved." / "Say what this is for." (empty reason reached the database).

### How to approve a deposit release

**Who can do this:** **Approve deposit release**: Finance and Admin by default. Front Office, Housekeeping and Security cannot.
**Where:** the deposit's page → **Approve release** (top right). It only appears when the deposit is **Ready to release**.
**Steps:**
1. Check the charges list is complete. Front Office should have raised every charge before you approve, because charges close at approval.
2. Click **Approve release**. The dialog "Approve the release for <reference>?" shows **Deposit held**, **Less n charges**, and **Returned to guest** (or **Owed by guest**).
3. Optionally write a **Note** (up to 280 characters). It is shown on the statement.
4. Click **Approve release of BND x** (or **Approve — BND x owed** when charges exceed the deposit). **Not yet** backs out.
**What happens next:**
- The deposit becomes **Released**. The figures are frozen and the charges close (no more adding or waiving).
- The toast says "Release approved", with "BND x goes back to <guest>." or "BND x is owed by <guest>."
- The **Statement** button appears.
- History: "Release approved — BND x returned" or "— BND x owed by the guest". The event keeps who, when, the figures, the number of charges and the inspection outcome.
- **No money moves and no email is sent.** Now hand the money back in cash or transfer it from the bank app, and send the statement if the guest wants it. The system does not record when or how the refund was actually handed over. There is no "paid back" step.
- If money is owed, the **Owed by the guest** section appears and the deposit counts in **Owed by guests**.
**How the refund is worked out:** returned = deposit held − charges not waived, never below zero. Owed = charges − deposit held, never below zero. Only one of the two is ever above zero. The amount used is what was actually **held** (for a short deposit, that is less than the quote). The figures are recalculated at the moment you click, so a charge added while the dialog was open **is included**. The toast gives the real final figure. Check it matches what you expected.
**Edge cases and limits:**
- The guest must have **checked out** and the unit must have been **inspected**. Without both, the button is hidden and approvers see the reason under the title.
- **The system does not stop the same person recording the inspection and approving the release** if they hold both permissions (Admin holds both). Keeping them separate is a staff rule, not a system rule.
- **A release cannot be undone or changed.** If it was approved too early or at the wrong figure, tell Jefferson; there is no button for it.
- There is no deadline or reminder. Deposits waiting longest sit at the top of **Ready to release** and **Awaiting inspection** on the ledger.
**If you see an error / reason shown:**
- "The unit has not been inspected yet. Housekeeping records the inspection first."
- "The guest has not checked out yet. The deposit is released after the stay ends."
- "The deposit transfer has not been verified yet. Confirm it in the payments queue first."
- "This deposit has already been released."
- "This deposit was kept when the booking closed without a stay, so there is nothing to release."
- "This booking closed without a stay, so there is no check-out or inspection for a release to follow."
- "Keep the note under 280 characters."
- "The release could not be approved. Reload the screen and try again."

### How to hand the deposit back (timing)

The guard **does not** give the BND 100 back when the keys are returned. The guard checks the guest out and the unit goes to inspection. **The office processes the deposit in the few days after check-out:** inspection → any charges → Finance/Admin approves the release → the money is handed back or transferred outside the system. Tell the guest to expect it within a few days rather than at the gate. The system sets no deadline and sends no reminder.

### How to print or send the deposit statement

**Who can do this:** anyone with **View bookings**.
**Where:** the deposit's page → **Statement** (only after a release).
**Steps:** click **Statement**, then **Print**, and print it or choose "Save as PDF" in the print dialog. Send the file to the guest yourself (WhatsApp or email). Use **Back** to return.
**Edge cases and limits:** it shows only charges that were not waived. The figures never change after approval. Recording an owed amount as settled later adds a line to it.

### How to record that a guest paid what they owed beyond the deposit

**Who can do this:** **Record cash payments**: Front Office, Security and Admin by default. Choosing **Bank transfer** also needs **Verify payments** (Front Office and Admin; not Security). **Finance cannot record this by default**, because Finance does not hold Record cash payments.
**Where:** the deposit's page → **Owed by the guest** → **Record as settled**. The section only appears after a release where charges exceeded the deposit.
**Steps:**
1. Click **Record as settled**. The dialog asks "Record BND x as settled?"
2. If you may record transfers, choose **How did it arrive?** (**Cash** or **Bank transfer**). Otherwise it is recorded as cash.
3. Click **Record as settled** (**Not yet** backs out).
**What happens next:** the toast says "Recorded as settled — BND x recovered against <reference>." The section reads "Settled <date>, in cash/bank transfer." The deposit leaves the **Owed by guests** list and total. The statement gains a "settled on" line. History: "Amount owed settled — BND x, in cash".
**Edge cases and limits:**
- **Whole amount only.** Part payments cannot be recorded, and nothing can write an unpaid amount off. An unpaid amount stays on **Owed by guests** indefinitely. This is not settled yet; ask Jefferson/Jason what to do with a guest who pays only part or never pays.
- This is **not a booking payment**. It is not in the daily cash-up, not in revenue, and not in the accounting pack.
- It cannot be undone.
**If you see an error:** "Nothing is owed until the release has been approved." / "This guest owes nothing beyond their deposit." / "This has already been recorded as settled." / "Choose how the money arrived." / "That deposit no longer exists."

### How to read the Reports screen for a period

**Who can do this:** **View reports**: Finance and Admin by default.
**Where:** **Finance → Reports**.
**Steps:**
1. Click **Period** and choose a quick option or two dates.
2. Read the tiles, then each table. Hover or tap the hint icon beside a title to see how it is counted.
3. For occupancy of particular unit types, use **Type** above **Occupancy by unit**.
4. Use **Download CSV** on a section to take it as a spreadsheet.
**What happens next:** nothing is changed. Figures are recalculated each time the page loads.
**Edge cases and limits:** **Deposits held** and **Owed by guests** are always "as of now", whatever the period. Changing the period clears the Type filter.

### How to record a banking (a trip to the bank)

**Who can do this:** **Verify payments** and able to open the cash-up (**View reports**), which by default means Finance and Admin. Front Office holds Verify payments but cannot open the screen by default.
**Where:** **Finance → Daily cash-up → Record banking**, or a single day's page → **Record banking**.
**Steps:**
1. Click **Record banking**.
2. **Date banked**: it defaults to the last day of the period on screen (or the day you are viewing). It cannot be later than today.
3. **Amount banked**: what actually went in, like 442.00 (a comma between thousands, as in 1,442.00, is fine). It does not have to match any day.
4. **Note (optional)**: up to 280 characters, for example "Morning run to BIBD."
5. Click **Record banking**.
**What happens next:** the toast says "BND x banked". **Cash on hand** drops by that amount **from the chosen date onwards**, and that day's **Banked** figure rises. The state badges update. Nothing is matched to particular days: one entry can cover several days' takings. It is recorded under your name and the time, and the Audit log shows "Cash banked — BND x, taken on <date>" (that date is the **Date banked** you entered, despite the word "taken"; the Cash banked export's "Cash taken on" column is the same date).
**Which date to choose:** enter **the day the money went to the bank** — the day of the bank trip. That is what the field **Date banked** asks for, and its hint says so: "The day the money went to the bank. It comes off the running balance from this day." The running balance is built on that meaning: a trip that covers several days' takings is simply one entry on the day of the trip. Two older lines of wording on the screen still say the opposite — the dialog's opening line ("against the day it was collected — not the day it was banked") and the empty "Banked" section of a day ("filed against the day the money was taken"), and if the date is left blank the message reads "Pick the day the cash was taken." Ignore those: they are left over from an earlier version of the cash-up and are due to be corrected. Use the day of the bank trip.
**Edge cases and limits:**
- **A banking can never be edited or deleted.** "It cannot be edited afterwards; a correction is a second entry." Both entries stay on the day and the balance moves.
- **Deposit cash is not in Cash on hand.** Cash on hand counts only cash payments for stays and day passes. If security-deposit cash from the drawer is taken to the bank too and the whole amount is recorded as one banking, the balance goes below zero and the day shows **Over-banked**. How deposit cash should be banked and recorded is not settled yet — ask Jefferson/Jason.
- Amounts must be above zero. If a banking was entered **too low**, add a second entry for the difference. If it was entered **too high** or twice (a day shows **Over-banked**), the system has no negative entry to cancel it. There is no agreed fix for this yet — tell Jefferson, and note it for Finance so the **Over-banked** day is understood.
**If you see an error:**
- "Pick the day the cash was taken." The date was empty. "Pick a day from the calendar." The date was not a valid date.
- "Cash cannot be banked against a day that has not happened. Today is <date>."
- "Enter how much went to the bank." (empty or zero) / "Enter an amount like 442.00." ("BND", more than two decimals, or a comma that is not between thousands).
- "Keep the note under 280 characters."
- "That property no longer exists." Reload and tell Jefferson.

### How to check a day's cash (and investigate a difference)

**Who can do this:** **View reports** (Finance, Admin).
**Where:** **Finance → Daily cash-up** → click the day.
**Steps:**
1. Compare **Cash on hand** with what is physically in the safe. Remember the drawer also holds that day's deposit cash (the "Also in the drawer" panel), which is not in Cash on hand.
2. Look at **Cash payments** to see each payment, the booking and **Collected by**. Click a reference to open the booking.
3. Look at **Banked** to see each entry, who recorded it and the note.
4. Use **Previous day** / **Next day** to walk through days.
**What happens next:** nothing is changed by looking.
**Edge cases and limits:** a day's figures can change later, and correctly so. A banking recorded late, or a payment recorded late with an earlier collection time, moves the day's balance. Nothing about a day is "closed" or locked: there is no "close day" button, and the state is always recalculated from the payments and bankings.
**Over-banked** means either a cash payment was never recorded (record it on the booking; see *Payments → How to record cash from the Cash payments screen*) or a banking was entered twice.

### How to download a report as CSV

**Who can do this:** **View reports** (Finance, Admin).
**Where:** the **Download CSV** button on each Reports section (Revenue by stream, Occupancy by type, Occupancy by unit, Day passes against capacity) and on the Daily cash-up.
**Steps:** set the period (and Type or State filters) first, then click **Download CSV**. The file downloads straight away.
**What happens next:** the file matches what is on screen: same period, same filters, every row (not just the current page). Amounts are plain numbers (for example 2360.00) with "(BND)" in the column heading, so a spreadsheet can add them up. Percentages are whole numbers. Files are named like `palm-villa-revenue-2026-09-01-to-2026-09-18.csv`. The cash-up file lists days **oldest first** (the screen shows newest first), with columns Date, Cash recorded (BND), Payments, Deposits taken (BND), Banked (BND), Bankings, Cash on hand (BND), State. The revenue file also has a **Deposits kept** count column.
**Edge cases and limits:** on the cash-up, an Admin gets a menu with **This view → Day by day (as filtered)** and **Whole tables → Cash banked**; everyone else gets a plain button for the day-by-day file. Opening a download link without View reports gives a plain "Not found" page. The cash-up download for a future period gives "That period has not happened yet".

### How to export whole tables (all business data)

**Who can do this:** **Edit settings, roles & the unit registry**: **Admin only** by default. Finance, Front Office and others do not see these buttons. If someone opens a whole-table link without the permission, the page just says "Not found".
**Where:** the **Download CSV** button at the top right of the screen that holds the records. Where a screen has several tables, the button opens a menu:

| Screen | Tables offered |
|---|---|
| **Bookings → All bookings** | Bookings, Booking lines, Vehicles, Booking notes, Guests, Documents |
| **Payments → Verification queue** | Payments |
| **Finance → Deposits** | Deposits, Charges |
| **Property → Units** | Units, Occupancy, Inspections |
| **Finance → Daily cash-up** | Cash banked (under "Whole tables") |
| **Admin → Roles & staff** | Staff, Roles |
| **Admin → Audit log** | Audit log |
| **Admin → Property settings** | Settings |
| **Admin → Website settings** (Photos, FAQs, Privacy policy tabs) | Website photos, Website FAQs, Privacy policy versions |

**Steps:** click **Download CSV** and choose the table if a menu opens.
**What happens next:** the whole table downloads, every row and not paged, as it stands right now. It is named like `palm-villa-deposits-2026-09-18.csv`. Downloads are **not** written to the audit log.
**Edge cases and limits:**
- A whole-table export ignores the screen's filters. It is the whole table. (Report downloads, by contrast, follow the screen.)
- Document exports list facts about files (kind, size, who attached them, retention) and never the files themselves, nor an identity document's file name.
- The **Deposits** file columns: Booking, Unit, Held (BND), Taken as, Collected, Inspection, Inspected, Charges (BND), Approved charges (BND), Released, Returned (BND), Release note, Owed (BND), Owed settled, Owed settled as, Kept, Kept (BND). **Charges**: Booking, Amount (BND), Reason, Raised, Waived, Waive reason. **Cash banked**: Cash taken on, Amount (BND), Note, Recorded by, Recorded at. "Recorded by" is an internal staff ID, not a name.
- Dates and times in these files are raw system timestamps (UTC), not Brunei-formatted dates.
- Text beginning with =, +, - or @ is written with a leading apostrophe so a spreadsheet does not run it as a formula.

---

## Rules the system enforces

- **A deposit is a liability, not revenue.** It is not a booking payment. It never counts toward what a booking has paid, the cash-up total or revenue. The one exception is a deposit **kept** on a cancellation or no-show, which becomes revenue on the day it is kept.
- **"Held" means money actually seen.** A promised, unverified transfer is not held, cannot be charged against and cannot be released.
- **The stage is worked out, never set by hand**, and it only moves forward.
- **Inspection comes before release.** A release needs the guest checked out *and* an inspection recorded. Both the screen and the database refuse otherwise.
- **Inspections are permanent.** No edit, no delete, one per stay. Notes are required when issues were found.
- **Charges need a reason and are never deleted.** A wrong charge is waived, with a reason, by Finance/Admin. Waived charges stay visible and count for nothing.
- **Raising and dropping charges are separate jobs.** Front Office raises, Finance waives (Admin can do both).
- **The deposit is not a cap on liability.** Charges above the deposit become an amount owed by the guest. The system records it; it cannot collect it.
- **Approval freezes everything.** Once released, charges close, the figures never change, and the statement shows exactly what was approved. The figures are calculated by the system at the moment of approval, from the charges standing then.
- **No money moves in the system.** A release records authorisation; the refund happens outside. No emails are sent from this area.
- **An owed amount is settled whole or not at all.** It is not a booking payment and is not in the cash-up.
- **A deposit given back on a cancellation** (the desk chose "return" when cancelling) is recorded as a release by the person who cancelled, using the same arithmetic. It shows as **Released** here and has a statement. See *The booking's own page → How to cancel a booking*.
- **Cash-up figures are never stored.** They are recalculated from payments, deposits and bankings every time, so late entries correctly change earlier days. Nothing locks a day.
- **Bankings are append-only**, above zero, and never on a future date.
- **Reports use received money only** (verified payments), dated by the day cash was collected or a transfer was confirmed. Occupancy counts sold or lived-in nights, and out-of-service units stay in the denominator.
- **Report downloads follow the screen; whole-table downloads are Admin-only** and ignore filters.

---

## Likely questions

**Q: A guest checked out and wants their BND 100 back now. Can the guard give it?**
A: No. The guard takes the keys and checks the guest out. The office processes the deposit in the few days after check-out: Housekeeping inspects, any charges are raised, then Finance or Admin approves the release, and the money is handed back or transferred. Tell the guest to expect it within a few days.

**Q: The "Approve release" button is missing.**
A: It only shows to people with **Approve deposit release** (Finance and Admin by default), and only when the deposit is **Ready to release**. If you are Finance/Admin, the reason is written under the deposit's title, usually "The unit has not been inspected yet. Housekeeping records the inspection first." or "The guest has not checked out yet…". If the deposit is already **Released**, there is nothing left to approve.

**Q: I'm Front Office. Why can't I record the inspection?**
A: Recording inspections needs **Record inspections**, which by default only Housekeeping and Admin hold. Ask Housekeeping to record it (usually from their phone), or ask an Admin to give you the permission.

**Q: Housekeeping recorded "Clean" by mistake, but the shower screen is cracked. Can we change it?**
A: No. An inspection cannot be edited once recorded. You can still charge for the damage: Front Office raises a charge with the reason, whatever the inspection said. Photographs can still be added to the inspection by Housekeeping or Admin.

**Q: I added the wrong charge amount. How do I fix it?**
A: Charges cannot be edited or deleted. Ask Finance or Admin to **Waive** the wrong charge (with a reason), then add the correct one. This only works before the release is approved.

**Q: The release has already been approved, but we just found more damage.**
A: The charges are closed once released, and the system will refuse ("This deposit has already been released, so its charges are closed…"). Recovering it is a conversation with the guest outside the system. A release cannot be undone; if something serious went wrong, tell Jefferson.

**Q: How is the refund amount calculated?**
A: Deposit actually held, minus all charges that were not waived. If the result would be below zero, the guest gets nothing back and the difference is recorded as **owed by the guest**. If the deposit arrived short (say BND 50 of 100), the calculation uses the BND 50 held.

**Q: Charges are more than the deposit. What happens?**
A: The approve button reads **Approve — BND x owed**. After approval nothing is returned, the guest owes the difference, and the deposit appears under **Owed by guests** on Deposits and Reports. Send the guest the **Statement**. When they pay, someone with **Record cash payments** (Front Office, Security or Admin) uses **Record as settled**.

**Q: The guest paid half of what they owed. How do I record that?**
A: You can't yet. The system only records the whole amount as settled, and it cannot write off an unpaid amount. Leave it until it is paid in full. This is not settled yet; ask Jefferson/Jason.

**Q: Finance says they can't record the owed amount as settled.**
A: That needs **Record cash payments**, which Finance does not hold by default. Front Office or Admin can do it (or the guard, for cash). An Admin can add the permission to Finance in **Roles & staff**.

**Q: Where do I mark that we actually handed the money back?**
A: There is no separate step. **Approve release** is the record of the refund being authorised, with who and when. The hand-over itself (cash or bank transfer) is not recorded in the system. If you want a trace, write it in the optional **Note** when approving.

**Q: Can the same person inspect and approve?**
A: The system allows it if they hold both permissions (Admin holds everything). The business rule is that Housekeeping inspects and a separate role (Finance or Jason) approves, so keep them separate in practice.

**Q: A deposit shows "Transfer awaited". Why isn't it in the Total held?**
A: The customer says they transferred it, but nobody has checked the bank. Until someone verifies it, the property holds nothing, so it is not in the ledger. Verify it from **Payments → Verification queue** or the deposit's page (needs **Verify payments**).

**Q: A guest cancelled. Where is their deposit on the Deposits screen?**
A: If it was kept, it is no longer held, so it is not on the held list. It shows **Kept** on its own page (open it from the booking or search), and it counts as revenue on the day it was kept, in the Reports **Kept deposits** column. If the desk chose to give it back, it is **Released** and has a statement.

**Q: How do I see all released deposits?**
A: No button leads there yet. Type the Deposits address followed by `?show=released`, or open a deposit from its booking. The **Owed by guests** tile lists released deposits where the guest still owes money.

**Q: Why can't Front Office or the guard open the Daily cash-up?**
A: The cash-up needs **View reports**, which by default only Finance and Admin hold. The business chose this as a check-and-balance, since the people who take the cash don't reconcile it. An Admin can change it.

**Q: The cash-up says "On hand". Is that a problem?**
A: No. **On hand** means cash has been taken and not banked yet, which is normal between bank runs. **Clear** means everything has been banked. Only **Over-banked** (red) means something is wrong.

**Q: A day shows "Over-banked". What does it mean?**
A: More has been recorded as banked than was ever recorded as taken. Either a cash payment was not entered in the system (enter it on the booking), or a banking was entered twice. Open the day to see who recorded what.

**Q: The drawer has more cash than "Cash on hand" says.**
A: Check the **Deposits taken** figure (and "Also in the drawer" on the day's page). Deposit cash sits in the same drawer but is deliberately kept out of the cash-up total, because it belongs to guests. Cash a guest paid for charges above their deposit (**Record as settled**) is not in the cash-up either, and is not shown anywhere on it.

**Q: I recorded a banking with the wrong amount. How do I delete it?**
A: Bankings can't be edited or deleted. If you entered too little, add a second entry for the difference. If you entered too much or entered it twice, the system has no way to take it back out. There is no agreed procedure for this yet. Tell Finance and Jefferson so the Over-banked day is understood.

**Q: I can't pick tomorrow's date in Record banking.**
A: Correct. Bankings can't be dated in the future ("Cash cannot be banked against a day that has not happened…").

**Q: Revenue on Reports doesn't match the booking totals.**
A: Reports count only money actually received and verified, on the day cash was collected or a transfer was confirmed. Booking totals, unpaid balances and pending transfers are not revenue. Security deposits are not revenue unless kept. A bank transfer counts on the day it was confirmed in the Verification queue, which may be a day or two after it reached the bank.

**Q: Why is Tenancy revenue zero?**
A: Long leases are recorded as occupancy with no booking and no payments, so they add occupancy but no revenue on this screen.

**Q: Occupancy looks low. Does it include out-of-service units?**
A: Yes. Units out of service still count as available nights, so a broken unit lowers the rate. Held (unpaid) bookings and no-shows do not count as occupied.

**Q: Why are there no Download CSV buttons on Bookings, Deposits or Units for me?**
A: Whole-table downloads need **Edit settings, roles & the unit registry**, which only Admin holds by default. Finance can still download every report and the cash-up day-by-day file from Reports and Daily cash-up.

**Q: When is the accounting pack made? The booking has none.**
A: A pack is built a moment after the first payment on the booking is verified or recorded (including cash at the gate), and rebuilt overnight at about 02:00 whenever the booking, its payments, IC or slips change. With no verified payment there is no pack; a deposit alone does not create one. Front Office, Finance and Admin can press **Rebuild now** on the booking. At most 25 packs are built per night, so after a busy period some may take an extra night.

**Q: Is the guest's IC inside the accounting pack?**
A: No, never. The pack records that the IC was collected, when and by whom; the image stays on the booking under its own permission and its 12-month retention.

---

## Terms

- **Security deposit** — the refundable amount (BND 100 by default) taken when a booking is made, held as a liability and returned after the stay, less any charges.
- **Held** — a deposit whose money has actually been seen (cash counted or transfer verified) and has not been released or kept.
- **Total held** — the sum of all deposits held right now; also shown on Reports as Deposits held.
- **Stage** — where a deposit has got to: Transfer awaited, Held before arrival, Guest in stay, Awaiting inspection, Ready to release, Released, Kept, Never received.
- **Short** — a deposit where less was taken than the booking quotes; topped up from the booking.
- **Inspection** — the permanent record of how the unit was found after check-out (Clean or Issues found), with notes and optional photographs.
- **Charge** — an itemised amount, with a reason and author, deducted from a deposit on release.
- **Waive (a charge)** — drop a charge with a reason; it stays visible but counts for nothing. Finance/Admin only.
- **Release / Approve release** — the recorded authorisation of what goes back to the guest; freezes the figures; moves no money.
- **Returned / To return** — what goes back to the guest after charges (after / before release).
- **Owed by guest / Would be owed** — how much charges exceed the deposit (after / before release).
- **Record as settled** — recording that a guest paid the whole amount they owed beyond the deposit.
- **Kept** — a deposit forfeited because the guest cancelled (with "keep") or did not arrive; revenue on the day kept.
- **Never received** — a promised deposit transfer that was never verified before the booking closed without a stay.
- **Statement** — the printable deposit statement for the guest, available after release.
- **Revenue received** — verified payments, dated by the day cash was collected or a transfer was confirmed, plus kept deposits; cash basis.
- **Unit-night** — one unit for one night; occupancy is occupied unit-nights ÷ available unit-nights.
- **Cash recorded** — cash booking payments taken on a day (desk and gate), excluding deposits.
- **Deposits taken** — cash taken for security deposits on a day; shown beside the cash-up, never in its total.
- **Banking** — a record that cash went to the bank; append-only, above zero, never future-dated.
- **Cash on hand** — running balance of cash taken and not yet banked, since the system started.
- **Clear / On hand / Over-banked** — the cash-up states: nothing unbanked / cash waiting to be banked (normal) / more banked than recorded (something is wrong).
- **Brought forward** — cash already unbanked before the start of the chosen period.
- **Accounting pack** — the PDF the system assembles per booking for the accountant (booking, lines, payments, slips, IC reference); built when money is verified and rebuilt nightly when out of date.
- **Download CSV** — spreadsheet export; report downloads follow the screen (View reports), whole-table downloads are Admin-only.

---

# 7. Field screens: the Gate and Departures phone screens

## What this area is for

The field screens are the phone screens for the people who work on their feet rather than at a desk:

- **The Gate**: for the security guard, who is also the front desk. He hands over keys, takes them back, lets day-pass visitors in, takes the cash a guest still owes, and tells the office when a car holds more people than booked. It replaces the paper list and the WhatsApp messages to the office asking "is this car booked?".
- **Departures**: for housekeeping. It lists every unit where a guest is leaving, a unit is waiting to be inspected, or a unit is being cleaned, with the next thing to do for each one. It replaces telling the office by message that a room is done.
- **The entry code page**: the page that opens when anyone scans a guest's entry QR code with a phone camera.

All of them are at **portal.bruneiapartment.com** and need a staff sign-in (except the entry code page, which anyone can open, but which only shows a staff member's actions to signed-in staff). They are web pages. There is nothing to install. They are built for a phone held in one hand, with large buttons, on a weak signal.

Addresses (for bookmarking):
- Field screens home (the chooser): portal.bruneiapartment.com/field
- Gate: portal.bruneiapartment.com/field/arrivals (the address still says "arrivals" because guards bookmarked it before it was renamed; the screen is called **Gate**)
- Departures: portal.bruneiapartment.com/field/departures

From the portal, the sidebar item **Others → Field screens** opens the field screens.

## Screens

### The field header (on every field screen)

At the top of every field screen is a plain bar reading **Palm Villa · Field**, with:
- **Portal**: only for people whose day is in the portal (Front Office, Finance and Admin by default). It goes back to the portal Dashboard. A guard or a cleaner does not get this button.
- **Sign out**: signs you out and returns you to the sign-in page. While it works it says **Signing out…** and cannot be tapped again.

For somebody who can work **both** the Gate and Departures (Admin by default, or anyone given both jobs), a switch appears under the header on the Gate and Departures screens with two segments, **Gate** and **Departures**. The current one is raised. Somebody with only one job never sees this bar.

### Who sees which field screen

| Screen | Opens for anyone holding | By default |
|---|---|---|
| **Gate** | "Check guests in" **or** "Admit day passes" | Security, Front Office, Admin |
| **Departures** (and its inspection page) | "Record inspections" | Housekeeping, Admin |

An Admin can change who holds these permissions in **Roles & staff**, and the screens follow the permissions, not the role names.

What each card then offers depends on the person's other permissions:
- **Check in** needs "Check guests in" (Security, Front Office, Admin).
- **Check out** at the Gate, and **Guest has left** on Departures, need "Check guests out" (Security, Housekeeping, Front Office, Admin).
- **Admit** needs "Admit day passes" (Security, Front Office, Admin).
- **Take BND …** (cash) needs "Record cash payments" (Security, Front Office, Admin). Without it, the card shows **no money figures at all**.
- **Inspect** needs "Record inspections" (Housekeeping, Admin).
- **Mark ready** needs "Manage units" (Housekeeping, Front Office, Admin).

Front Office holds "Check guests in", so it can open the Gate, but it does not hold "Record inspections", so it does not get Departures by default.

### Where people land after signing in

- **The guard (Security)** signs in straight onto the **Gate**.
- **Housekeeping** signs in straight onto **Departures**.
- **Front Office, Finance and Admin** land on the portal **Dashboard**. Front Office and Admin reach the Gate from **Others → Field screens** or by going to the address directly.

The rule: somebody lands on a field screen only when **every** permission they hold is one the field screens use (View bookings, Check guests in, Check guests out, Admit day passes, Record inspections, Record cash payments, Manage units) **and** at least one field screen is theirs. With one field screen they go straight to it. With two (for example, somebody given both the Security and Housekeeping roles) they land on the **Field screens** chooser. Anyone holding anything else, such as creating bookings, verifying payments or settings, lands on the portal.

This means that if an Admin gives the guard's role an extra office permission (for example "Verify payments" or "Create bookings"), guards will start landing on the portal Dashboard instead of the Gate after signing in.

If a guard or cleaner opens the portal Dashboard address (an old bookmark, say), they are sent on to their field screen.

If a sign-in was started from a scanned entry code, the person goes back to that entry code page after signing in instead.

### Field screens home (the chooser)

Title **Field screens**.
- **Two jobs**: one large card per screen, **Gate** and **Departures**. Tap one to open it.
- **One job**: this page is never shown. It sends you straight to your one screen.
- **No field job** (for example Finance): "There is nothing on the field screens for your account. They are for the gate and for inspecting units after guests leave — ask an administrator if either is part of your job."

### Gate

**Who can open it:** anyone holding "Check guests in" or "Admit day passes" (Security, Front Office, Admin by default). Anyone else sees: "This screen is for the gate, which needs the "Check guests in" or "Admit day passes" permission. Ask an administrator if that is part of your job."

**Top of the screen:** the title **Gate** and today's date (in Brunei time, e.g. "Fri 18 Sept").

**The search box** (stays at the top while you scroll). Placeholder: **Plate, name or reference**. Typing filters today's list at once, on the phone, with no signal needed once the page has loaded. It matches:
- any part of the guest's name (capitals don't matter);
- any part of the booking reference;
- any part of a vehicle plate, ignoring spaces, dashes and capitals. "baa1234", "BAA 1234" and "baa-1234" all find the plate BAA 1234.

**The refresh line**: "Updated 14:02" (the time the list was read) and a **Refresh** button (**Refreshing…** while it works). The list does **not** update by itself. A phone left open for an hour shows the list as it was an hour ago. Tap **Refresh** before relying on it.

**The sections**, each with a heading and a count:

1. **Arriving**: stays not yet checked in whose dates cover today. That is guests arriving today, guests who were due yesterday or earlier and haven't turned up yet (as long as the stay hasn't ended), and bookings still waiting on something (held, awaiting payment). Listed by unit. When empty (and nothing is typed in the search): "Nobody else is due to arrive today."
2. **Leaving today**: guests checked in whose check-out day is today **or has already passed** (overdue guests are here too). Shown only when there is somebody.
3. **Day passes**: today's day passes, including passes already admitted today (visitors go out and come back, so they stay on the list all day). Shown only when there are any.
4. **Already in**: guests checked in who are not due out yet. Their cars come and go. Shown only when there are any.

If something is typed and nobody on today's list matches: "Nobody on today's list matches "…"."

**"Not on today's list?"** Whenever something is typed, a box appears: "Not on today's list?" / "Search every open booking, whatever day it starts." and a button **Search all bookings for "…"** (pressing search on the phone keyboard does the same). This asks the server, so it needs signal. The results appear as a section **All bookings matching "…"**, nearest arrival first, up to 20 bookings. It searches open bookings only (not cancelled, expired, no-show or completed ones). If nothing is found: "No open booking matches. Call the office." If you then change what is typed, the old results disappear, because they were for a different search.

**Each booking card** shows, top to bottom:
- **Red cards.** A card whose money is not settled is **red**, with the words "**Payment not settled**" at the very top. That means any of: the security deposit is not held in full (none taken, only promised by a bank transfer nobody has checked yet, or short); something is still owed on the stay or the day pass; or a bank transfer for the booking is waiting to be checked. A closed booking (checked out, admitted pass, cancelled, expired, no-show) is never red, and nor is a booking that has been overpaid. **Every** phone sees the red, including one signed in without "Record cash payments" (which still sees no figures). Red is a warning to be careful with the booking; it does not stop anything by itself — the sentence and the buttons say what can be done.
- The **guest's name**.
- The **booking reference** · the unit (e.g. "3B-04"), or just "Day pass" for a day pass (how many it is for is on the **Guests** line).
- A **badge** (see the table below).
- A grey panel (white on a red card) with:
  - **Vehicle**: the plate(s), separated by " · ". "No car" if the booking says the guest has no vehicle. "Not recorded" if there is no plate and no "no car" answer.
  - **Staying** (for a stay: arrival – check-out day) or **Date** (for a day pass).
  - **Guests**: how many people the booking is for, to count the car against. For a stay, the number of people, followed by "· 2 aged 3 or under" when some of them are young children not counted towards the unit's maximum. For a day pass, the headcount followed by the age bands, e.g. "3 · Adult × 2, Child × 1". Beside it, a small **Extra** button for more people than booked (see *How to deal with more people than booked (the Extra button)*). It is shown to whoever may check stays in (on a stay) or admit passes (on a day pass). It is not shown on a stay that has checked out, or on a cancelled, expired or no-show booking; a pass admitted today still has it, to tell the office.
  - **To take**: only on the phone of somebody who may take cash, and only when there is money the gate may take now. It shows the amount and what it is for: **Security deposit**, **Rest of the deposit**, **The stay** or **Day pass**.
- **A sentence** saying what to do and why (the full list is in *Rules the system enforces → What each Gate sentence means*).
- Sometimes: "**2 more people than booked — the office has been told.**" A guard has already reported extra people with **Extra**, and the office has not changed the booking's party yet. It disappears once the office changes the party.
- Sometimes: "**3B-04 is not marked ready yet.**" (see *Unit readiness at the gate*).
- **Buttons**, full width at the bottom, only for things the reader is allowed to do:
  - a cash button **Take BND 100.00** (when money is to be taken), and/or
  - one move: **Check in**, **Check out** or **Admit**.
  A card that needs the office has **no button at all**, so there is nothing to press and then be refused.

When a card has both a cash button and a move, the move (e.g. **Check in**) is the dark main button and the cash button is the lighter one above it. When the cash button is the only button, it is the dark main one.

**The badges:**

| Badge | Meaning |
|---|---|
| **Expected** | A stay ready to be checked in: confirmed, deposit held in full, arriving today or late. |
| **Due out** | Checked in, and today is the check-out day. |
| **Overdue** | Checked in, and the check-out day has already passed. |
| **Paid** | A day pass paid in full for today: ready to admit. |
| **Admitted** | A day pass already admitted today. The visitors may come and go. |
| **To pay** | Something is missing, and it is money the reader can take at the gate themselves (deposit, rest of the deposit, the stay, or a day pass). |
| **Call office** | Something is missing that the gate cannot sort out, or the reader cannot take cash. |
| **Checked in** | A guest already in residence, not leaving today. |
| **Closed** | The booking is finished, cancelled, expired or a no-show (seen from a scanned code). |

**What the Gate never shows:** guests' phone numbers or email addresses, identity documents, prices or deposit figures (except the "To take" amount, and the day-pass prices used when adding visitors to a pass, and only to someone who may take cash). The red "Payment not settled" is shown to everyone, but it carries no figure.

**While loading**, the screen shows grey placeholder blocks in the shape of the list. **If it fails to load**: "This page didn't load" / "Something went wrong on our side. Trying again usually works. If the signal is weak, move and try again. If it keeps happening, tell the office and give them the reference below." with **Try again**, **Back to field screens**, and a "Reference" number to give the office.

### Departures

**Who can open it:** anyone holding "Record inspections" (Housekeeping and Admin by default). Anyone else sees: "This screen is for inspecting units after guests leave, which needs the "Record inspections" permission. Ask an administrator if that is part of your job."

**Top of the screen:** title **Departures**, today's date, and the refresh line ("Updated 14:02" · **Refresh**). Like the Gate, it does not update by itself.

When there is nothing to do: "Nothing to turn over right now. A unit appears here when its guest is due out."

**Three sections**, each shown only when it has units, with a count:
1. **Leaving today**: a guest still checked in whose check-out day is today or has passed.
2. **To inspect**: the guest has checked out and nobody has recorded an inspection yet.
3. **Being cleaned**: inspected, not yet marked ready.

Within each section, **units where the next guest arrives today come first**, then the rest in unit order (3B-2 before 3B-10).

Units stay on this list until the job is finished, not just for today: a unit checked out yesterday and never inspected is still under **To inspect** today.

**Each unit card** shows:
- The **unit** (e.g. 3B-04), in large text.
- The **guest's name** · **booking reference** of the stay that is ending.
- The **unit status badge**, the same words the office's Units board uses: usually **Occupied** (guest still in), **Awaiting inspection** or **Cleaning**.
- One line on where the turnover has got to:
  - "Due out today and still checked in."
  - "Was due out Thu 17 Sept and is still checked in." (overdue)
  - "Checked out. Not inspected yet."
  - "Inspected: clean. Mark it ready once it is clean." / "Inspected: issues found. Mark it ready once it is clean."
- "**Next guest arrives today**", in bold, when somebody is booked into this unit today.
- The office's notes, read-only, in a grey panel (only when there is something to say):
  - **About this unit**: the unit's standing note (e.g. "the balcony door sticks"), which the office keeps on the unit (see *Units and property settings*).
  - **From the office**: the office's notes marked for housekeeping on this stay, newest first, each with its date and time. Internal office notes never appear here (see *The booking's own page → Notes*).
- **One full-width action** for the next step:
  - **Leaving today** → **Guest has left**
  - **To inspect** → **Inspect 3B-04**
  - **Being cleaned** → **Mark ready**, plus a lighter **Add photos** button.

If the person may not take that step, they see a sentence instead of a button:
- "The gate or the office checks this guest out."
- "Somebody who records inspections looks at this unit next."
- "Somebody who manages units marks it ready."

**What Departures never shows:** phone numbers, emails, prices, deposits, or internal notes.

### Inspection page

Reached from **Inspect 3B-04** or **Add photos** on a Departures card. It is a page of its own (not a pop-up), because the keyboard and camera take over the phone while you use it.

**Who can open it:** "Record inspections" (Housekeeping, Admin by default). Anyone else sees: "Recording an inspection needs the "Record inspections" permission. Ask an administrator if that is part of your job."

At the top: a **Departures** back button, then the title **Inspect 3B-04** (or **Photos of 3B-04** if the inspection is already recorded), the guest's name and reference, and the same office notes as the card.

The form:
- **How was the unit found?**: two large choices, **Clean** and **Issues found**. One must be chosen.
- **Notes (optional)**, which becomes **What was found?** (required) when **Issues found** is chosen. Up to 2,000 characters. Under it: "Recorded with your name and the time, and cannot be changed afterwards."
- **Photos (optional)**: a button **Add photos** (then **Add more photos**). See *The photo picker*.
- The main button: **Record inspection** (no photos chosen) or **Record and send photos**. While working it says **Recording…** then **Sending photos…**.

If the inspection is already recorded (the unit is under **Being cleaned**), the page opens with the outcome and notes shown but greyed out and unchangeable, a note "The inspection of 3B-04 is recorded and cannot be changed. Photos can still be added to it.", the main button **Send photo** / **Send photos** (greyed until a photo is chosen), and **Back to departures**.

If the stay is no longer waiting for an inspection (already marked ready, or not on the list): "This stay is not waiting for an inspection. It may already be marked ready."
If the guest has not been checked out yet: "{Guest name} has not been checked out yet. Mark them as left from the list first."

### The photo picker

Used on the inspection page.
- **Add photos** opens the phone's own choice of **camera or photo library**, so photos taken earlier can be attached. Several can be chosen at once.
- Photos **add up**: choosing more adds them to the list, they don't replace it. Each one on the list shows its file name and size. An **X** button takes a photo off the list before sending (also possible for one that failed).
- Accepted: JPEG, PNG or WebP. The hint reads "JPEG, PNG or WebP. Made smaller on this phone before they are sent." iPhone photos are converted automatically when chosen.
- A photo over 25 MB is refused when chosen: "IMG_1234.jpg is larger than 25 MB and cannot be opened on a phone." (or "3 files are larger than 25 MB and cannot be opened on a phone.").
- Each photo is shrunk on the phone, then sent **one at a time**. Each shows **Sending…**, then **Sent**, or a red message saying why it failed. A failed photo stays on the list to send again.
- Photos cannot be added or removed while sending is in progress.

### Entry code page (what a scanned QR code opens)

Every confirmed booking has an entry QR code. It is sent to the guest in the confirmation email, shown on the guest's booking page, and available to the office on the booking screen (see *The booking's own page → Entry code* and *The customer side → Emails*). Scanning it with any phone camera opens a page on portal.bruneiapartment.com. **The code itself lets nobody in and grants nothing.** What the page shows depends on who is signed in on the phone that scanned it:

- **A signed-in guard (or anyone who can open the Gate)**: the title **Gate**, today's date, and **the same Gate card** for that one booking, with the same badge, sentence, "To take" amount and buttons (**Check in**, **Check out**, **Admit**, **Take BND …**) as on the Gate list. The same rules and refusals apply. The header reads **Palm Villa · Field** with a **Gate list** button back to the full list. Scanning only replaces typing the plate. It changes nothing about what is allowed.
- **Other signed-in staff** (e.g. Housekeeping, Finance): the summary below, plus an **Open the booking** button into the portal if they may view bookings.
- **Anybody not signed in** (the guest checking their own code, or a stranger with a screenshot): title **Palm Villa entry code**, and a card with only:
  - the guest's **first name and the next name's initial** (e.g. "Siti A."; a one-word name shows just its initial);
  - the **reference** and the **dates** (or "Day pass · date");
  - one sentence on where the booking stands:
    - "This booking is confirmed. Show this code at the gate."
    - "The guest is checked in."
    - "This booking has ended."
    - "This booking is no longer live." (cancelled, expired or no-show)
    - "This booking is not confirmed yet."
  - and a small line: "Palm Villa staff? **Sign in** to check this guest in." After signing in from there, the guard comes straight back to this booking's Gate card.

  No plate, unit, phone number or money is ever shown to someone not signed in.

**A code that opens nothing** (a replaced code, a damaged or mistyped one, or something that isn't a Palm Villa code) shows: "**This code does not open a booking**" / "It may have been replaced with a new one, or it is not a Palm Villa entry code. Guards can find the booking by plate or name on the Gate list; guests can ask the office for their current code." The **Gate list** link goes to the Gate. The page gives the same answer for all these cases on purpose, so nobody can learn anything by guessing codes.

**A code for a finished or cancelled booking still opens**, because the code outlives the booking: the guard sees the card with the badge **Closed** and "This booking is closed. Call the office."; a stranger sees "This booking has ended." or "This booking is no longer live."

When the office uses **Replace code** on the booking, the old code stops working immediately and shows "This code does not open a booking". The guest needs the new one from the office (see *The booking's own page → Entry code*).

## How to …

### How to find a car or guest at the gate

**Who can do this:** anyone who can open the Gate (Security, Front Office, Admin by default; an Admin can change this).
**Where:** Gate → search box.
**Steps:**
1. Type part of the plate, the guest's name, or the booking reference into **Plate, name or reference**. The list filters as you type. Spaces and dashes in plates don't matter.
2. If the car is on today's list, its card appears under **Arriving**, **Leaving today**, **Day passes** or **Already in**.
3. If not, tap **Search all bookings for "…"** (or search on the keyboard). This searches every open booking, whatever day it starts (up to 20 results, nearest arrival first).
4. Or scan the guest's entry QR code with the phone camera. It opens the same card.

**What happens next:** nothing is recorded. Searching is only looking.
**Edge cases and limits:**
- Filtering today's list works with no signal once the page has loaded. The "search all bookings" step needs signal.
- Search results never show the "not marked ready" line.
- Cancelled, expired, no-show and completed bookings are never in search results.
- A long search term is cut to 60 characters.
**If you see an error:**
- "Nobody on today's list matches "…"." Try **Search all bookings**, check the spelling of the plate, or ask the guest for their reference.
- "No open booking matches. Call the office." There is no open booking for this plate, name or reference. The guard cannot create a booking. Call the office.

### How to check a guest in (hand over the keys)

**Who can do this:** "Check guests in": Security, Front Office, Admin by default (an Admin can change this).
**Where:** Gate → **Arriving** → the guest's card → **Check in**. The same button appears on the card from a scanned entry code.
**Steps:**
1. Find the card. It shows the badge **Expected** only when the booking is ready to check in.
2. Check the plate against the car, and count the people against the **Guests** line. If there are more people than booked, tap **Extra** and tell the office (see *How to deal with more people than booked (the Extra button)*). It does not stop the check-in.
3. If the card has a **To take** amount for **The stay** and the guest is paying now, take the money first (see *How to take cash at the gate*). Paying the stay is **not** required to check in.
4. Tap **Check in**. A box asks "Check in {guest name}?", "{reference} · {unit}. The booking is marked as arrived now, under your name."
5. Tap **Check in** (it says **Checking in…**), or **Not yet** to back out.
6. A message confirms "{guest name} is checked in". Hand over the keys.

**What happens next:**
- The booking becomes **Checked in**, recorded in the booking's history under your name.
- The card moves from **Arriving** to **Already in** on the Gate (or to **Leaving today** on the check-out day).
- On the office's Units board the unit shows **Occupied**. The Dashboard, bookings list, the booking's page and the Deposits screens update.
- No email is sent to the guest on check-in. No money changes hands.
**Undoing:** a check-in **cannot be undone** from any screen. If a guest was checked in by mistake, tell the office straight away.
**Edge cases and limits:**
- Only a booking that is **confirmed** with its **security deposit held in full** (or no deposit quoted, or waived) can be checked in. The database refuses anything else, whoever presses the button.
- A guest arriving **before** the booking's first day is sent to the office: "Booked from {date}. Call the office." A guest arriving a day or more **late** (while the stay hasn't ended) is still shown as **Expected** and can be checked in.
- Money owed on the **stay** does not stop check-in. The deposit does. A card with anything unsettled is red ("Payment not settled"), but the red itself never stops check-in.
- More people than booked does not stop check-in either. Report it with **Extra**; the office changes the party and any extra charge then shows on the card as cash to take.
- A day pass is never checked in; it is **admitted**.
- The unit not being marked ready does **not** stop check-in (see *Unit readiness at the gate*).
- If the phone's list is old, the button still checks the booking again before doing anything, so a booking the office cancelled or changed a minute ago is refused, not checked in.
- If the reader lacks "Check guests in", a ready card says "All in order. Call the office to check them in." and shows no button.
**If you see an error:**
- "Already checked in. Nothing more to do." Somebody (another phone, the office) checked them in a moment ago. Nothing is wrong.
- "The deposit is not in. Call the office." The deposit is not held in full at the moment of the tap. Refresh the list. If the card now shows **Take BND …** for the deposit, take it, then check in. Otherwise call the office.
- "Booked from {date}. Call the office." The guest is early. The office decides (different unit, or amend the booking).
- "No deposit has been taken yet. Call the office." / "Only part of the deposit is in. Call the office." / "The deposit transfer has not been checked. Call the office." The deposit isn't in. Refresh: if you may take cash, the card will offer to take it. Otherwise call the office. (These refusal sentences always say "Call the office", even to a guard who can take cash. The card after a refresh shows the cash button if cash is the answer.)
- "This booking is not confirmed yet. Call the office." / "A transfer for this booking is waiting to be checked. Call the office." The office must verify something first.
- "This booking is closed. Call the office." It has been cancelled, marked a no-show or finished.
- "This booking changed a moment ago. Refresh the list and look again." Something moved under you. Tap **Refresh** and look at the card again.
- "That booking no longer exists. Refresh the list."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again." The phone could not reach the server. Nothing happened. Move to better signal and press again.

### How to check a guest out at the gate (keys handed back)

**Who can do this:** "Check guests out": Security, Housekeeping, Front Office, Admin by default (an Admin can change this). At the Gate this is normally the guard.
**Where:** Gate → **Leaving today** → the guest's card → **Check out** (also on a scanned code's card).
**Steps:**
1. Find the guest under **Leaving today** (badge **Due out**, or **Overdue** if the check-out day has passed).
2. If the card shows **To take … The stay**, take the stay payment **first** (see *How to take cash at the gate*). After check-out, no cash can be recorded against the booking, at the gate or in the office.
3. Take the keys back.
4. Tap **Check out**. The box asks "Check out {guest name}?", "{reference} · {unit}. Take the keys back first. They are checked out now, under your name, and the unit moves to inspection." If the stay is unpaid it also warns:
   - to a guard who can take cash: "The stay is not paid. Take the payment first — once they are checked out, it cannot be recorded against this booking."
   - to someone who cannot: "The stay is not paid. Once they are checked out, no payment can be recorded against this booking."
5. Tap **Check out** (**Checking out…**) or **Not yet**.
6. A message confirms "{guest name} is checked out".

**What happens next:**
- The booking becomes **Completed**, recorded in its history under your name.
- The unit moves to **Awaiting inspection** on the Units board and appears on housekeeping's Departures screen under **To inspect**.
- The security deposit is **not** handed back at the gate. The office handles it in the days after check-out: inspection, any charges, approval, then refund (see *Deposits, reports and finance*).
- The guest drops off the Gate list.
**Undoing:** a check-out **cannot be undone**. There is no way back to "checked in" on any screen.
**Edge cases and limits:**
- Only for a guest whose **check-out day is today or has passed**. A guest leaving **early** (before their last day) cannot be checked out at the gate, because the gate can't tell someone leaving from someone going out for dinner. Send them to the office, which checks them out from the booking page. The card of an early leaver is under **Already in** with no Check out button.
- Checking out does **not** shorten the booking. Nights the guest didn't use stay booked, and a checked-in or completed booking cannot be amended to free them (see *The booking's own page → How to check a guest out (from the portal)*).
- If a transfer for the stay is still waiting to be checked, the sentence says so ("A transfer for the stay is still waiting to be checked."). The gate takes no cash for it. The guard can still check out.
- Nothing stops a check-out when the stay is unpaid. That is deliberate: a guest who leaves owing is the office's to deal with outside the system.
- Housekeeping can also check the same guest out from Departures (**Guest has left**). Whoever does it first wins; the other is told it's already done.
**If you see an error:**
- "Already checked out. Nothing more to do." Housekeeping or the office checked them out a moment ago.
- "They are not due to leave today. Call the office." Their last day is later. The office checks out early leavers.
- "This booking changed a moment ago. Refresh the list and look again."
- "That booking no longer exists. Refresh the list."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again."

### How to admit a day-pass visitor

**Who can do this:** "Admit day passes": Security, Front Office, Admin by default (an Admin can change this).
**Where:** Gate → **Day passes** → the pass's card → **Admit** (also on a scanned code's card).
**Steps:**
1. Find the pass. The badge **Paid** means it is paid in full for today.
2. Count the people against the **Guests** line (e.g. "3 · Adult × 2, Child × 1"). If more people came than the pass is for, tap **Extra** first (see *How to deal with more people than booked (the Extra button)*).
3. If the badge is **To pay**, take the cash first (see *How to take cash at the gate*). The card then changes to **Paid**.
4. Tap **Admit**. The box asks "Admit {guest name}?", "{reference} · Day pass · 3 people. Check the number of people against the pass. Admitting uses it for today, under your name."
5. Tap **Admit** (**Admitting…**) or **Not yet**.
6. A message confirms "{guest name} is admitted".

**What happens next:**
- The pass is used and the booking becomes **Completed** (a day pass is closed the moment it is admitted).
- The card stays on today's list with the badge **Admitted** and "Admitted today. They may come and go.", so a car coming back after lunch is recognised. There is nothing more to press.
- Tomorrow it is no longer on the list.
**Undoing:** admitting **cannot be undone**.
**Edge cases and limits:**
- Only on the pass's **own date** (Brunei time). A pass for another day, earlier or later, goes to the office: "Day pass is for {date}. Call the office."
- Only when **paid in full** with verified money. Unlike a stay, an unpaid pass stops the car, because nobody meets a day visitor again to collect what is owed.
- If a bank transfer for the pass is waiting to be checked, the gate takes no cash for it: "A transfer for this booking is waiting to be checked. Call the office."
- More people than the pass covers: tap **Extra**. A guard who takes cash can add them to the pass and take the difference himself, on a pass for today that is paid or still to pay at the gate (not one waiting on a bank transfer). Otherwise **Extra** tells the office. See *How to deal with more people than booked (the Extra button)*.
**If you see an error:**
- "Already admitted. Nothing more to do." Another phone or the office admitted it a moment ago.
- "Day pass is not paid yet. Call the office." It isn't paid in full. If you can take cash, refresh and the card will offer **Take BND …**.
- "This day pass is for another day. Call the office." / "Day pass is for {date}. Call the office."
- "A transfer for this booking is waiting to be checked. Call the office."
- "This booking is closed. Call the office."
- "This booking changed a moment ago. Refresh the list and look again."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again."

### How to take cash at the gate (deposit, stay or day pass)

**Who can do this:** "Record cash payments": Security, Front Office, Admin by default (an Admin can change this). Without it, the Gate shows no money figures and no cash button.
**Where:** Gate → the card → **Take BND …** (also on a scanned code's card).

The card decides what the money is for, so the guard never has to decide between a deposit and a payment. The order is always:
1. **The security deposit first**: the whole deposit if none has been taken, or only a transfer was promised; or the **rest of the deposit** if it arrived short.
2. **Then the stay**: whatever is still owed on it, before check-in, while the guest is in residence, or before check-out.
3. **A day pass**: the whole amount owed on today's pass.

**Steps:**
1. Read the card's **To take** line, e.g. "BND 100.00 · Security deposit".
2. Tap **Take BND 100.00**. A box opens:
   - Deposit: "Take the BND 100.00 security deposit?"
   - Rest of a short deposit: "Take the BND 40.00 still owed on the deposit?"
   - The stay: "Take payment for {guest name}'s stay?"
   - Day pass: "Take BND 30.00 for the day pass?"
   with "{reference} · {unit or Day pass}. Count the notes first. It is recorded as cash, under your name."
3. If the deposit was promised by bank transfer, the box also says: "They said they sent this by bank transfer. Only take cash if that transfer did not go through — if it did, the office checks the bank instead." If the guest insists they transferred it, don't take cash. Call the office.
4. **For the stay only**, there is an **Amount taken** box filled in with what is owed, and the hint "BND X is owed. Anything else needs a reason." If the guest hands over a different amount, type what was actually handed over. A second box appears, "This is not what is owed — why?" (example: "Guest is paying the rest at the office tomorrow"). Up to 280 characters. The reason is required.
5. Count the notes, then tap **Take BND …** (it says **Recording…**), or **Not yet**.
6. A message confirms "BND 100.00 taken from {guest name}". If this money is what confirmed the booking, it adds "{reference} is confirmed".

**What happens next:**
- The money is recorded as **cash, collected by you**, with the time. It shows on the office's cash screens and in the **Daily cash-up** under your name (see *Payments → Cash payments* and *Deposits, reports and finance → Daily cash-up*). A cash deposit is shown beside the day's takings, not inside them.
- **Deposit taken**: the deposit is now held. If the booking was still waiting (held, or waiting on a transfer that never came), taking the deposit **confirms it**, and the guest is emailed their confirmation with the entry QR code (see *The customer side → Emails*). The card then moves on to the stay: badge **Expected**, "Deposit is in. The stay is not paid yet.", with **Take BND …** for the stay and **Check in**.
- **Rest of the deposit taken**: the deposit is now whole. If this completes a deposit on a booking that was waiting, the booking is confirmed and the guest is emailed.
- **Stay or day pass cash taken**: recorded as a payment against the booking, and the booking's accounting record is produced. If the booking was still waiting and nothing else was owed on the deposit (for example a day pass, or a stay with no deposit), this confirms it and the guest is emailed.
- The card refreshes and shows what is owed next, or nothing.
**Undoing:** a recorded payment **cannot be removed** from the gate or anywhere in the app. If money was recorded wrongly (wrong booking, wrong amount), tell the office straight away. The deposit follows its own release process after check-out (see *Deposits, reports and finance*).
**Edge cases and limits:**
- **Deposits and day passes are taken whole.** The amount can't be changed. A guest who can't pay the full deposit or pass is the office's to sort out.
- **Only the stay amount can be typed.** Anything other than what is owed, less **or more**, needs a reason. The reason is saved with the payment.
- **No cash while a bank transfer for the same money is waiting to be checked**, because it may already be in the bank. The card says "A transfer … is waiting to be checked" and offers no cash. Exception: the deposit can still be taken in cash while a transfer for the *stay* waits, because that is different money.
- **Nothing is taken** for a guest arriving before their booking's first day, a day pass for another day, or a closed booking.
- **Once a guest is checked out, no payment can be taken against the booking.** Take the stay money before checking out.
- **The same cash is never recorded twice.** The box sends back the figure it showed. If that is no longer what is owed (a colleague took it, or your first press actually went through), nothing is recorded and you are told to refresh.
- A guard with cash permission sees the badge **To pay** instead of **Call office** when the missing thing is money he can take himself.
- Taking cash at the gate never verifies a bank transfer. Only the office can do that.
**If you see an error:**
- "Already recorded. Refresh the list before taking any more money." The money has already been recorded (maybe by your own earlier press, or by the office). Refresh and look. Do **not** take it again.
- "What is owed changed a moment ago. Refresh the list and look again." The amount or kind of money owed changed since you opened the box. Refresh.
- "This booking is closed, so no money can be taken against it. Call the office." It is cancelled, marked a no-show, expired or checked out.
- "That booking no longer exists. Refresh the list."
- "Enter the amount taken, like 200.00." (and under the box "Enter an amount like 200.00.") The stay amount isn't a plain number. Use digits and a full stop, like **1368.00**. A comma between thousands is fine, so the box can be left exactly as it was filled in (e.g. **1,368.00**); a comma anywhere else ("1,36.00", "10,00") is refused.
- "This is not what is owed. Say why, and it is recorded with it." (and "This is not what is owed. Say why.") Fill in the reason box and press again.
- "That may not have gone through. Refresh the list: if the money still shows as owed, nothing was recorded." The phone lost signal and **the money may or may not have been recorded**. Do **not** press again straight away. Tap **Refresh** (or go back to the Gate list). If the card still shows the same **To take** amount, nothing was recorded and you can try again. If it doesn't, it was recorded.

### How to deal with more people than booked (the Extra button)

**Who can do this:** on a stay, "Check guests in" (Security, Front Office, Admin by default); on a day pass, "Admit day passes" (Security, Front Office, Admin by default). Adding visitors to a day pass yourself also needs "Record cash payments". An Admin can change all of these.
**Where:** Gate → the card → **Extra**, beside the **Guests** line (also on a scanned code's card). Not shown on a checked-out, cancelled, expired or no-show booking (a pass admitted today still has it).

**Why it exists:** a guest sometimes brings more people than the booking is for, for example to avoid the extra-guest charge. The guard is the one who sees the car, so he counts and says so, and the office changes the booking.

**Telling the office (every stay, and any day pass you can't settle yourself):**
1. Count the people in the car against **Guests**.
2. Tap **Extra**. The box **More people than booked?** says "{reference} · {unit}. Booked for 4. The office is told, and sorts out any extra charge." (For a day pass it names "Day pass · 3 people" instead of a unit.)
3. **How many more?** — the number of extra people (1 is filled in; up to 50).
4. **Anything to add (optional)** — e.g. "Came in a second car". Up to 280 characters.
5. Tap **Tell the office** (it says **Sending…**), or **Not now**.
6. A message confirms "The office is told: 2 more with {guest name}".

**What happens next (telling the office):**
- A note is added to the booking under your name, which the office reads on the booking page: "Reported at the gate: 2 more people arrived than the booking is for (booked for 4)." followed by anything you typed, in quotation marks.
- The office is told through the notifications bell ("Extra guests at the gate"), for everyone who can edit bookings.
- The card now says "**2 more people than booked — the office has been told.**", so a second guard at the barrier can see it has already been reported. If another guard reports more, the numbers add up. The line disappears once the office changes the booking's party.
- The booking's history shows "Extra guests reported at the gate — 2 more".
- **It never stops check-in, check-out or admitting.** Carry on as normal. If the office adds the people and that leaves money owed, the card turns red and, after a **Refresh**, shows it as cash to take (**To take … The stay** or **Day pass**).

**Adding visitors to a day pass yourself:** when a guard who can take cash taps **Extra** on a day pass for **today** that is either paid and ready to admit (**Paid**) or still to be paid at the gate (**To pay**), the box **Add visitors to the pass?** opens instead: "{reference} · Day pass · 3 people. Booked for 3. They are added to the pass, and you take the difference in cash, under your name."
1. Under **Extra visitors**, type how many more there are in each age band (e.g. **Adult**, **Child**).
2. The box works out the price again for the whole party, the same way the pass was priced (family bundles included), and shows "**Take BND 15.00** · the pass becomes BND 45.00". If the extra visitors cost nothing more, it says "Nothing more to pay". On a pass not yet paid at all, the amount to take is the whole new price.
3. **Anything to add (optional)**, as above.
4. Count the notes, then tap **Take BND 15.00** (or **Add them** when there is nothing to pay). It says **Recording…**.
5. A message confirms "BND 15.00 taken — 2 added to the pass" (or "2 added to the pass").
6. If the visitors won't pay, tap **They won't pay — tell the office** instead. The box switches to **More people than booked?** (above) and nothing is added to the pass.

**What happens next (adding to a pass):**
- The pass is now for the bigger party at the new price, and the cash is recorded as a payment **under your name**, like any cash taken at the gate. It shows on the office's cash screens and in the **Daily cash-up**.
- A note is added to the booking: "Added at the gate: Adult × 2 (the pass is now for 5). BND 15.00 taken in cash." (or "Nothing more to pay."), followed by anything you typed.
- The office's bell shows it as already dealt with: "Visitors added at the gate". The booking's history shows "Party changed — 3 → 5" and "Extra guests added at the gate — 2 more". The card does not show the "office has been told" line, because there is nothing left for the office to do.
- If the pass was still to be paid at the gate, this cash pays it in full: the card changes to **Paid** and the booking is confirmed, as with any day-pass cash.
- **Admit** stays on the card the whole time. Whether to admit before or after adding visitors is up to you and the office.

**Undoing:** neither can be undone from the gate. A wrong report, or visitors added by mistake, is for the office, which can change the party from the booking page while the booking is still open. Recorded cash cannot be removed anywhere in the app.

**Edge cases and limits:**
- **An admitted pass is closed**, so it takes no more money. **Extra** on it only tells the office, and the office cannot change a closed pass's party either, so the report stays a note: add visitors **before** tapping **Admit**.
- A pass for another day, or a pass with a bank transfer waiting to be checked, cannot take visitors at the gate. **Extra** only tells the office.
- A guard without "Record cash payments" always gets **More people than booked?**, on passes as well as stays.
- The day's visitor limit still applies. If the facilities are nearly full, the visitors can't be added (see errors).
- On a **stay**, extra people are only reported; the guard never changes a stay's party or its price.

**If you see an error:**
- "Only 2 more places are left that day. Call the office." / "The facilities are full for that day, so nobody more can be added. Call the office." — the day's visitor limit is reached. Nothing was added and nothing was taken.
- "What is owed changed a moment ago. Refresh the list and look again." — the pass's price or payments changed since the box opened. Nothing was added. Refresh.
- "Already recorded. Refresh the list before taking any more money." — the pass's headcount had already changed (maybe your own earlier press went through). Refresh and look before trying again. Do **not** take the money twice.
- "The visitors were added, but the BND 15.00 was not recorded. Take it with the Take button on the card." — the pass now includes the visitors and owes the difference, but the cash was not recorded. The card is red with **Take BND 15.00**: take it with that button.
- "This pass cannot take more visitors at the gate. Call the office." — the pass changed (admitted, a transfer is waiting, or it is not today's) since the list was read.
- "Taking cash is not part of your job here. Tell the office instead." — your account can't take cash; use **They won't pay — tell the office**.
- "Say who the extra visitors are." — every band is 0. / "Say how many more people arrived." — the number is 0 or empty.
- "This booking is closed. Call the office." / "That booking no longer exists. Refresh the list."
- "That did not reach the office. Refresh the list before trying again." — the phone lost signal. Refresh and look at the card before pressing again.

### How to handle a guest the office booked "at the gate" (walk-in paying at the barrier)

**Who can do this:** the office creates the booking (Front Office and Admin by default); the guard takes the money and checks in.
**Where:** the guard calls the office → the office uses **New booking** with payment **At the gate — the guard takes it** (see *Creating bookings*) → Gate → **Arriving**.
**Steps:**
1. A guest without a booking arrives. The guard **cannot create a booking**. Call the office.
2. The office books the stay with payment "At the gate". Nothing is paid yet, and the booking is **held** for the guest.
3. Tap **Refresh** on the Gate. The booking appears under **Arriving** with the badge **To pay**, "No deposit has been taken yet.", and **To take … Security deposit**.
4. Take the deposit: **Take BND …** → count → confirm. The booking becomes **confirmed**, and the guest is emailed the confirmation and entry code.
5. The card now shows **Expected**, "Deposit is in. The stay is not paid yet." Take the stay payment (**Take BND …**), then **Check in**.

**Edge cases and limits:**
- "At the gate" is only for a stay **starting today**, and never with the deposit waived. The office's form refuses otherwise: "Only a stay starting today can be paid at the gate." / "A booking with its deposit waived cannot be paid at the gate."
- If no deposit is quoted, the card goes straight to the stay: badge **To pay**, "Nothing has been paid for this stay yet.", and taking the stay cash confirms the booking.
- **If the guest drives off without paying**, tell the office to cancel the booking. Nothing releases the unit on its own. The hold never expires.
- The guard can check the guest in after the deposit even if the stay is not paid, but should take the stay payment first where possible.

### How to use a scanned entry code at the gate

**Who can do this:** anyone who can open the Gate. Anyone can scan, but only signed-in staff with a Gate job get buttons.
**Where:** the phone's own camera app → point at the guest's QR code → tap the link.
**Steps:**
1. Scan the code. The Gate card for that booking opens.
2. Act on it exactly as on the list (check in, check out, admit, take cash).
3. Tap **Gate list** to go back to the full list.
**Edge cases and limits:**
- If the phone shows "Palm Villa entry code" with a masked name and "Palm Villa staff? Sign in to check this guest in.", the phone is not signed in (or the session ended). Tap **Sign in**. After signing in you come back to this booking's card.
- If a signed-in Housekeeping or Finance person scans it, they see only the summary (and **Open the booking** if they can view bookings).
- "This code does not open a booking" means the code was replaced, is damaged, or isn't ours. Find the guest by plate or name on the **Gate list**, and tell the guest to ask the office for their current code.
- After you act on a scanned card, the confirmation message appears. To see the booking's latest state, tap **Gate list** (or scan again).

### How to mark a guest as left (housekeeping)

**Who can do this:** "Check guests out": Housekeeping, Security, Front Office, Admin by default (an Admin can change this). This is for a guest who left the keys in the unit.
**Where:** Departures → **Leaving today** → the unit's card → **Guest has left**.
**Steps:**
1. Check the unit is empty and the keys are there.
2. Tap **Guest has left**. The box asks "Has {guest name} left?", "{unit} · {reference}. The guest is checked out now, under your name, and the unit moves to inspection."
3. Tap **Guest has left** (**Checking out…**) or **Not yet**.
4. A message confirms "{guest name} is checked out" / "{unit} is ready to inspect."

**What happens next:** the booking becomes **Completed** under your name. The card moves to **To inspect** and the unit shows **Awaiting inspection**. The guest drops off the Gate's **Leaving today** list. The deposit waits for the inspection (see *Deposits, reports and finance*).
**Undoing:** a check-out **cannot be undone**.
**Edge cases and limits:**
- Only offered on or after the guest's check-out day. A guest who seems to have left early cannot be marked as left from the phone. Tell the office.
- Departures does **not** show whether the guest still owes for the stay, and this box gives no warning about it. Once checked out, no cash can be recorded against the booking, at the gate or in the office. If in doubt, check with the gate or the office before pressing.
- The Gate can check out the same guest. Whoever is first wins.
**If you see an error:**
- "This guest has already been checked out." Done already by the gate or the office.
- "This guest is not due to leave today, so nothing was recorded. If they have gone early, tell the office."
- "That stay is no longer on the list, so nothing was recorded. Refresh to see what is left to do."
- "Someone else moved this booking while you were working on it. Reload and try again." (or a similar sentence from the booking) Refresh and look again.
- "That did not go through, so nothing was recorded. Check the phone has signal and try again."

### How to record an inspection, with photos

**Who can do this:** "Record inspections": Housekeeping and Admin by default (an Admin can change this). Sending the photos uses the same permission.
**Where:** Departures → **To inspect** → **Inspect 3B-04** → inspection page.
**Steps:**
1. Look over the unit after the guest has checked out.
2. Under **How was the unit found?** tap **Clean** or **Issues found**.
3. If **Issues found**: under **What was found?** describe exactly what (e.g. "Shower screen cracked, bottom left. Two towels missing."). This is required, and it is what any charge against the guest's deposit will be judged against. If **Clean**, notes are optional.
4. Optionally tap **Add photos** and take or choose photos. Remove any wrong one with **X**.
5. Tap **Record inspection** (or **Record and send photos**).
6. The inspection is recorded first, then each photo is sent in turn. When everything has gone, a message confirms "{unit} inspected" (with "One photo sent." / "3 photos sent.") and the phone returns to Departures by itself.

**What happens next:**
- The inspection is recorded with your name and the time: the outcome, the notes and the photos. It appears on the booking's deposit in the office (see *Deposits, reports and finance → after check-out*).
- The unit moves to **Being cleaned** on Departures and **Cleaning** on the Units board.
- The deposit can now be dealt with. The office cannot approve the deposit release until an inspection is recorded ("The unit has not been inspected yet. Housekeeping records the inspection first."). If you chose **Issues found**, the office may add charges against the deposit based on your notes and photos.
**Undoing:** the outcome and notes **cannot be changed afterwards**, by anyone. Photos can still be added while the unit is under **Being cleaned**. Photos cannot be removed from the phone; someone with "Record inspections" can remove one from the deposit's page in the portal (see *Deposits, reports and finance*).
**Edge cases and limits:**
- A unit can be inspected only after the guest has checked out, and only once per stay.
- If some photos fail, the inspection is still recorded. The message says "Some photos did not go up — they are still on the list." The page stays open with the failed photos, a note "The inspection of 3B-04 is recorded and cannot be changed. Send the photos still on the list, or go back — photos can be added later.", a **Send photos** button and **Back to departures**.
- Photos can be added later from the card's **Add photos** button while the unit is **Being cleaned**. Once the unit is **marked ready**, the phone page no longer opens for it ("This stay is not waiting for an inspection. It may already be marked ready."), so add photos **before** marking ready. After that, photos can still be added in the portal, on the deposit's page → **Inspection** → **Add photographs** (see *Deposits, reports and finance*).
- Day passes have no unit and are never inspected.
**If you see an error:**
- "Choose how the unit was found." Tap **Clean** or **Issues found**.
- "Say what was found. A charge against this deposit will be read against it." You chose **Issues found** without describing them.
- "Keep the notes under 2,000 characters."
- "Check the highlighted fields."
- "This stay has already been inspected." Someone recorded it already. Refresh Departures.
- "This stay has not ended yet. A unit is inspected after the guest has checked out."
- "This booking occupies no unit, so there is nothing to inspect."
- "That stay is no longer on the list, so nothing was recorded. Refresh to see what is left to do."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again." The inspection never reached the server. Nothing is recorded. Try again with signal.
- Photo messages (shown under the photo's name): "That photo could not be opened in this browser. Save it as a JPEG and choose it again." / "That photo is still larger than 4 MB after resizing. Try a smaller one." / "That file is larger than 4 MB. A photograph taken on a phone is usually well under it." / "A photograph has to be an image. Attach a JPEG, PNG or WebP." / "Did not go through. Check the phone has signal and send it again." / "Not sent." In all these cases the photo stays on the list. Press **Send photos** again, or take it off with **X**.

### How to add photos to an inspection already recorded

**Who can do this:** "Record inspections": Housekeeping, Admin by default.
**Where:** Departures → **Being cleaned** → **Add photos** (opens **Photos of 3B-04**).
**Steps:** tap **Add photos**, choose or take them, then tap **Send photo** / **Send photos**. A message confirms "Photo sent" / "3 photos sent".
**Edge cases and limits:** on the phone, only while the unit is under **Being cleaned** (before it is marked ready). After that, use the deposit's page in the portal → **Inspection** → **Add photographs**. The outcome and notes are shown but cannot be changed.

### How to mark a unit ready (end of turnover)

**Who can do this:** "Manage units": Housekeeping, Front Office, Admin by default (an Admin can change this). On the phone the button is on Departures (which needs "Record inspections" to open). The office can also mark ready from the unit's page in the portal (see *Units and property settings*).
**Where:** Departures → **Being cleaned** → **Mark ready**.
**Steps:**
1. Finish cleaning. Add any last photos first (see above).
2. Tap **Mark ready**. The box asks "Mark 3B-04 ready?", "This tells the office 3B-04 is clean after {reference}, under your name. It cannot be undone, and it does not change who can be booked into the unit."
3. Tap **Mark ready** (**Marking…**) or **Not yet**.
4. A message confirms "3B-04 is ready" / "Marked ready after {reference}."

**What happens next:** the unit leaves Departures. On the Units board it shows whatever its bookings say (usually **Available**, or **Booked** if a guest is due). The Gate stops showing "3B-04 is not marked ready yet." for an arriving guest.
**Undoing:** **cannot be undone.**
**Edge cases and limits:**
- Needs a recorded inspection first.
- Refused once the **next guest has already checked in** to the unit. In that case the old turnover disappears from Departures by itself.
- Marking ready is information only. It does not affect whether the unit can be booked or checked into (see *Unit readiness at the gate*).
**If you see an error:**
- "Record the inspection first. A unit is marked ready after somebody has looked at it."
- "This unit has already been marked ready."
- "The next guest has already checked in, so this stay no longer needs marking ready."
- "The guest has not checked out yet, so the unit cannot be marked ready."
- "This booking occupies no unit, so there is nothing to mark ready."
- "That stay could not be identified. Refresh and try again." / "That stay no longer exists."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again."

### How to refresh a field screen, and what to do on a poor signal

**Who can do this:** anyone on a field screen.
**Where:** the refresh line under the title: "Updated 14:02" · **Refresh**.
**Steps:** tap **Refresh**. It re-reads the list in place (**Refreshing…**) and the time updates.
**What to know:**
- Field screens never update by themselves. Always check the "Updated" time.
- There is **no offline mode**. The list is not stored on the phone (it carries guests' names and plates, and a shared guardhouse phone should not keep yesterday's list). Once the page has loaded, filtering by plate or name works without signal. Everything else (search all bookings, any button) needs signal.
- Every button checks the booking again on the server before acting, so pressing on an out-of-date card never does the wrong thing. It is refused with a sentence telling you to refresh.
- If a button can't reach the server, you see "**That did not go through, so nothing was recorded. Check the phone has signal and try again.**" That is true: nothing happened, and you can try again.
- **Cash is the exception.** If taking cash loses signal, you see "**That may not have gone through. Refresh the list: if the money still shows as owed, nothing was recorded.**" The money may already be recorded. Refresh before trying again. If you press again when it was recorded, the system refuses: "Already recorded. Refresh the list before taking any more money."
- If a whole screen fails to open: "This page didn't load" with **Try again**, **Back to field screens**, and a Reference number to give the office.

### How to sign out of a field screen

**Who can do this:** anyone signed in.
**Where:** the field header → **Sign out**.
**Steps:** tap **Sign out** once. It says **Signing out…** while it works (on poor signal this can take a few seconds; don't tap again). You land on the sign-in page.
**What to know:** on a shared guardhouse phone, sign out at the end of a shift so the next person's actions are recorded under their own name. Everything done at the gate is recorded under whoever is signed in. The entry code page has no sign-out button; use the Gate list's header.

## Unit readiness at the gate

When a guest is **arriving** into a unit whose last guest has not checked out yet, or whose turnover (inspection and cleaning) isn't finished, the Gate card adds: "**{unit} is not marked ready yet.**"

This is **information only**. The guard can still check the guest in and hand over the keys. The system never stops a check-in because a unit isn't marked ready. Whether to wait, or call housekeeping or the office, is the guard's and the office's judgement. This is not settled yet — ask Jefferson/Jason whether an unready unit should stop check-in.

The line never appears on search results or for guests already checked in.

## What the guard is deliberately not allowed to do, and what the screen says instead

| The guard cannot… | What the screen says or does | Who does it instead |
|---|---|---|
| Create, amend or cancel a booking | No such buttons exist on the field screens. "No open booking matches. Call the office." | The office (New booking, including "At the gate") |
| Verify a bank transfer | "A transfer for this booking is waiting to be checked. Call the office." / "The deposit transfer has not been checked." | The office (Verification queue) |
| Take cash while a transfer for the same money waits | No cash button on that card | The office |
| Check in an early arrival | "Booked from {date}. Call the office." | The office |
| Check out a guest before their last day | "They are not due to leave today. Call the office." (no Check out button) | The office, from the booking page |
| Admit a pass on another day | "Day pass is for {date}. Call the office." | The office |
| Take part of a deposit, or part of a day pass | The amount is fixed | The office |
| Change a stay's party (more or fewer people) | **Extra** only tells the office: a note and a bell notification | The office (**Change** on the booking's Party line) |
| Give back the security deposit when the keys come back | Nothing at the gate refunds a deposit | The office, after inspection (see *Deposits*) |
| See guests' phone numbers, emails or identity documents | Not shown on any field screen | The office |
| Record a payment after check-out | "This booking is closed, so no money can be taken against it. Call the office." | The office deals with it outside the system |

The guard's sign-in has no **Portal** button. However, the Security role holds "View bookings" by default, so the office's booking pages will open if a guard types their address. An Admin can untick "View bookings" for Security in **Roles & staff** without affecting the Gate. This is not settled yet — ask Jefferson/Jason.

## Rules the system enforces

**What each Gate sentence means** (the line under the badge):

| Sentence on the card | Meaning | What to do |
|---|---|---|
| "Deposit is in and the stay is paid." | Ready. Nothing owed. | **Check in** |
| "Deposit is in. The stay is not paid yet." | Ready. Stay owed (guard can take it). | Take the stay money if paying now, then **Check in** |
| "Deposit is in. The office takes payment for the stay." | Ready. Stay owed, reader can't take cash. | **Check in**. The office collects |
| "Deposit is in. A transfer for the stay is waiting to be checked." | Ready. Stay transfer not verified yet. | **Check in**. No cash |
| "All in order. Call the office to check them in." | Ready, but the reader can't check in. | Call the office |
| "No deposit has been taken yet." (+ "Call the office." if you can't take cash) | No deposit at all | Take the deposit, or call the office |
| "They say the deposit was sent by bank transfer, and nobody has checked it." / "The deposit transfer has not been checked. Call the office." | A transfer was promised, not verified | Cash only if the transfer failed; otherwise the office checks the bank |
| "Only part of the deposit is in." (+ "Call the office.") | Short deposit | Take the rest, or call the office |
| "Nothing has been paid for this stay yet." (+ "Call the office.") | Unconfirmed booking, stay unpaid, deposit not needed or already in | Take the stay money, or call the office |
| "This booking is not confirmed yet. Call the office." | Not confirmed for another reason | Call the office |
| "A transfer for this booking is waiting to be checked. Call the office." | Unverified transfer | Call the office |
| "Booked from {date}. Call the office." | Early arrival | Call the office |
| "Due out today. Check them out when they hand back the keys." | Leaving today, paid | **Check out** when the keys come back |
| "Was due out {date}. Check them out when they hand back the keys." | Overdue | **Check out** |
| "Due out today. Take the stay payment before they leave. Check them out when they hand back the keys." | Leaving, stay owed | Take the stay money first, then **Check out** |
| "Due out today. The stay is not paid. Call the office before they leave." | Leaving, stay owed, reader can't take cash | Call the office |
| "Due out today. Check them out when they hand back the keys. A transfer for the stay is still waiting to be checked." | Leaving, transfer pending | **Check out**. No cash |
| "… Call the office when they hand back the keys." | Leaving, reader can't check out | Call the office |
| "Already checked in." | In residence | Nothing (take stay cash if the card offers it) |
| "Day pass is paid for today. Check the number of people against the pass." | Pass ready | **Admit** |
| "Day pass is not paid yet." (+ "Call the office.") | Pass unpaid | Take the cash, then **Admit**, or call the office |
| "Day pass is for {date}. Call the office." | Wrong day | Call the office |
| "Admitted today. They may come and go." | Pass used today | Nothing |
| "This booking is closed. Call the office." | Cancelled, finished, expired or no-show | Call the office |

**The rules, and why:**
- **The deposit secures the booking.** A stay whose quoted security deposit is not held in full cannot be checked in by anybody. The database refuses it, not just the screen. The gate may collect the deposit in cash.
- **Money owed on the stay never stops check-in or check-out.** Money owed on a day pass does stop admission, because admitting closes the pass.
- **One move per booking, checked twice.** The card decides what to offer, and the server decides again from fresh data at the moment of the tap. An out-of-date phone can't do the wrong thing.
- **Nobody is checked out before their last day from a phone** (Gate or Departures). The gate cannot tell leaving from going out. The office handles early departures.
- **Check-in, check-out, admitting, recording cash, recording an inspection and marking ready cannot be undone** from any screen.
- **Everything is recorded under the signed-in person's name** and time, in the booking's history and the audit log.
- **Figures only reach phones that may take the money.** Without "Record cash payments", no amounts are sent to the phone at all.
- **The same cash can't be recorded twice** from the gate: the figure shown must still be what is owed when the button is pressed.
- **A red card means the money is not settled** (deposit not held in full, stay or pass still owed, or a transfer waiting to be checked). Every reader sees it; it stops nothing by itself.
- **More people than booked never stops a car.** The guard reports it with **Extra**; the office changes a stay's party. Only a day pass can be enlarged at the gate, by a guard who takes cash, on its own day, before it is admitted and with no transfer waiting.
- **Readiness is shown, never enforced.**
- **Inspection before ready; ready once.** A unit is marked ready only after an inspection, only once, and not after the next guest has checked in.
- **Issues found need a description.** An inspection saying "Issues found" must say what, because deposit charges are judged against it.
- **The entry code grants nothing.** The staff member's sign-in decides what they can do. A stranger sees a masked summary.

## Likely questions

**Q: The gate card says "Call office". Why?**
A: Something is missing that the gate can't sort out. The sentence under the badge says what: early arrival, a transfer nobody has verified, a booking not confirmed, a pass for another day, a closed booking, or money owed that you don't have permission to take. Call the office. If you can take cash and the missing thing is money, the badge says **To pay** instead, with a **Take BND …** button.

**Q: The guest is at the barrier but has no booking. Can I book them?**
A: No. The guard can't create bookings. Call the office. They can book the guest with payment "At the gate". The booking appears on your list (tap **Refresh**) and you take the deposit and the stay yourself.

**Q: There's no Check in button on the card.**
A: The card only shows buttons you're allowed to use and that will work. Check the badge and sentence: the deposit isn't in, it's an early arrival, the booking isn't confirmed, or it's already checked in. If the badge is **To pay**, take the money first and **Check in** appears.

**Q: The guest paid half the deposit by transfer and has the rest in cash.**
A: If the office verified the transfer as a short deposit, the card shows **To take … Rest of the deposit** with the exact missing amount. Take it with **Take BND …**. The deposit is then whole and you can check in. If the transfer hasn't been verified yet, the gate can't take part of a deposit. Call the office.

**Q: The guest says they already transferred the deposit, but the card wants cash.**
A: The card says "They say the deposit was sent by bank transfer, and nobody has checked it." Only take cash if the transfer didn't go through. If it did, the office checks the bank and verifies it. Don't take the money twice.

**Q: I pressed Take BND 500 and it said "That may not have gone through". Did it record?**
A: Maybe. Tap **Refresh**. If the card still shows the same amount to take, nothing was recorded and you can try again. If the amount is gone or changed, it was recorded. Don't press again without refreshing. If you do, the system refuses with "Already recorded".

**Q: The stay amount is filled in as 1,368.00. Do I need to delete the comma?**
A: No. A comma between thousands is accepted, so you can take the payment with the box exactly as it was filled in. "Enter the amount taken, like 200.00." only appears if the amount was changed into something that isn't a plain figure, such as a comma in the wrong place (1,36.00), letters or "BND".

**Q: The guest wants to pay only part of the stay now.**
A: Type what they handed over in **Amount taken**, and give a reason in the box that appears (e.g. "Guest is paying the rest at the office tomorrow"). The rest stays owed and shows on the card.

**Q: I recorded cash against the wrong booking / the wrong amount. Can I undo it?**
A: Not from the gate. A recorded payment can't be removed in the app. Tell the office straight away, with the reference and amount.

**Q: A guest is leaving and still owes for the stay. Do I stop them?**
A: No. Ask for the stay payment and take it with **Take BND …** **before** checking out, because after check-out no cash can be recorded against the booking. If they leave without paying, check them out anyway and tell the office.

**Q: Do I give the guest their BND 100 deposit back when they return the keys?**
A: No. The gate never refunds deposits. The office handles it after housekeeping inspects the unit, over the following days.

**Q: The guest is leaving two days early. The card has no Check out button.**
A: Correct. The gate only checks out guests on or after their last day. Send them to the office (or call), which checks them out from the booking page.

**Q: I checked in the wrong guest. How do I undo it?**
A: You can't. Check-in can't be undone on any screen. Tell the office immediately.

**Q: The card says "3B-04 is not marked ready yet." Can I still give them the keys?**
A: The system allows it. The line is a warning only. Use your judgement: check with housekeeping or the office whether the unit is clean before handing over the keys.

**Q: A day-pass family came back after lunch. Do I admit them again?**
A: No. Their card stays on today's list as **Admitted**, "They may come and go." There's nothing to press.

**Q: More people turned up than the day pass covers.**
A: Tap **Extra** on the card. If you take cash and the pass is for today, paid or still to pay at the gate, you can add the visitors by age band and take the difference yourself (**Take BND …**). If they won't pay, tap **They won't pay — tell the office**. On an admitted pass, a pass waiting on a bank transfer, or if you don't take cash, **Extra** tells the office instead.

**Q: More people arrived for a stay than the booking is for.**
A: Tap **Extra** beside **Guests**, say how many more, and tap **Tell the office**. The office gets a note and a bell notification and changes the booking; any extra charge then shows on the card as cash to take. Check-in goes ahead as normal.

**Q: Why is this card red?**
A: Its money is not settled: the deposit is not fully in, something is still owed on the stay or pass, or a transfer is waiting to be checked. The sentence under the badge says what to do. Red on its own stops nothing — a guest in residence who still owes for the stay can still come and go.

**Q: Scanning the QR code shows "Palm Villa entry code" with only a first name, not the check-in button.**
A: Your phone isn't signed in (or the session ended). Tap **Sign in** on that page. After signing in you return straight to that booking's gate card.

**Q: The QR code says "This code does not open a booking".**
A: The office may have replaced the code, or it's damaged or not ours. Find the guest by plate or name on the **Gate list**. The guest can ask the office for their current code.

**Q: The list looks old / a booking the office just made isn't there.**
A: Field screens don't update by themselves. Check the "Updated" time and tap **Refresh**. If the booking starts on a later day it won't be on today's list. Use **Search all bookings**.

**Q: As a guard, why do I land on the Gate and not the portal? And why don't I see Departures?**
A: The guard's role is set up for the Gate only, so sign-in takes you straight there. Departures needs "Record inspections", which is housekeeping's. If an Admin gives your role extra office permissions, you'd land on the portal instead.

**Q: (Housekeeping) The unit is empty but "Guest has left" isn't there.**
A: It only appears on or after the guest's check-out day. If they left early, tell the office. If the card says "The gate or the office checks this guest out.", your account doesn't have "Check guests out".

**Q: (Housekeeping) I chose "Clean" but there was damage. Can I change the inspection?**
A: No. The outcome and notes can't be changed once recorded. Tell the office. You can still add photos while the unit is under **Being cleaned**.

**Q: (Housekeeping) Some photos didn't upload.**
A: The inspection is saved anyway. The failed photos stay on the list with a reason. Press **Send photos** again when you have signal, or come back later with **Add photos** on the card, before you mark the unit ready.

**Q: (Housekeeping) The unit disappeared from my list before I marked it ready.**
A: Either someone else marked it ready, or the next guest was already checked in, which ends the old turnover. Tap **Refresh**. The office can see the unit on the Units board.

**Q: (Housekeeping) I marked the wrong unit ready.**
A: It can't be undone. Tell the office. It doesn't affect bookings or check-in; it only changes what the Units board shows.

**Q: Does marking a unit ready let it be sold again if the guest left early?**
A: No. Marking ready never changes what can be booked. Nights a guest paid for stay booked, and a checked-in or completed booking cannot be amended to free them. This is not settled yet — ask Jefferson/Jason.

**Q: What does "That did not go through, so nothing was recorded" mean?**
A: The phone couldn't reach the server. Nothing happened. Move to better signal and press again.

## Terms

- **Field screens**: the phone screens for the gate and housekeeping, at portal.bruneiapartment.com/field.
- **Gate**: the guard's field screen (address ends /field/arrivals): today's arrivals, departures, day passes and guests in residence, with check-in, check-out, admit and cash.
- **Departures**: housekeeping's field screen: units leaving today, to inspect, and being cleaned.
- **Field screens chooser**: the page at /field for somebody with both field jobs.
- **Arriving**: Gate section of stays covering today not yet checked in.
- **Leaving today**: Gate and Departures section of checked-in guests whose check-out day is today or past.
- **Already in**: Gate section of checked-in guests not yet due out.
- **Due out / Overdue**: checked in with check-out day today / already passed.
- **Expected**: Gate badge for a stay ready to check in.
- **To pay**: Gate badge when the missing thing is money the reader can take at the gate.
- **Call office**: Gate badge when the office must sort something out.
- **To take**: the amount and kind of cash the gate may take now (only shown to those who may take cash).
- **Take BND …**: the gate's cash button.
- **Payment not settled**: the words at the top of a red Gate card: the deposit is not held in full, the stay or pass is still owed, or a transfer is waiting to be checked.
- **Guests (gate card)**: how many people the booking is for, with young children or the day-pass age bands; the guard counts the car against it.
- **Extra**: the small button beside Guests for more people than booked; it tells the office, or on a day pass lets a guard who takes cash add the visitors and take the difference.
- **Security deposit / Rest of the deposit / The stay / Day pass**: what cash taken at the gate is for.
- **Admit**: letting a paid day pass in on its date; it closes the pass.
- **Admitted**: a day pass used today; visitors may come and go.
- **At the gate (payment)**: an office booking for a guest at the barrier, starting today, with nothing paid; the guard takes the deposit and the stay.
- **Entry code / entry QR code**: the code sent to a confirmed guest; scanning it opens the booking's Gate card for signed-in gate staff, and a masked summary for anyone else.
- **Replace code**: the office's action that makes an old entry code stop working.
- **Guest has left**: housekeeping's check-out, for a guest who left the keys in the unit.
- **Inspection**: housekeeping's record of how a unit was found after check-out (Clean or Issues found, notes, photos); it can't be changed, and the deposit release waits for it.
- **Mark ready**: housekeeping's final step saying the unit is clean after a stay; can't be undone; information only.
- **Not marked ready yet**: gate warning that an arriving guest's unit hasn't finished turnover; never blocks check-in.
- **Turnover**: the steps between one guest leaving and the unit being ready (check-out, inspection, cleaning, mark ready).
- **Refresh line**: "Updated HH:MM · Refresh" above a field list.
- **"That did not go through…"**: the phone couldn't reach the server; nothing was recorded.
- **"That may not have gone through…"**: cash may or may not have been recorded; refresh before trying again.

---

# 8. Units, the unit registry and property settings

## What this area is for

This area covers three screens in the staff portal (portal.bruneiapartment.com):

- **Units** (sidebar: Property → **Units**) is the live state of the building. It shows every unit, what it is doing today, who is in it and until when. From a unit's own page staff take a unit out of service, record a long-term lease, keep a standing note about the unit, and finish a turnover (record the inspection and mark the unit ready). It replaces asking around, or scrolling the spreadsheet, to find out "what is going on with 3B-04".
- **Unit registry** (sidebar: Admin → **Unit registry**) is where the units are named and counted: what each door is called and how many units of each type the building has.
- **Property settings** (sidebar: Admin → **Property settings**) holds the figures the business runs on: nightly rates, guest limits, car parks, check-in and check-out times, the security deposit, the booking window, the extras a guest can add, day-pass prices, which facilities the day pass admits, how long documents are kept, and the bank accounts customers transfer to. Before this screen existed every one of these figures needed a developer to change it. Now it is typing.

Every change made on these screens is recorded with who made it and when. For unit changes the record is in the unit's own **History**. For settings changes it is in the **Audit log** (see *Staff access and administration → Audit log*).

The sidebar shows these items to everyone. Someone without the permission who opens one sees "You don't have access to this screen" and a sentence naming the permission they would need.

## Screens

### Units board

**Who can open it:** anyone holding **Manage units**. By default that is Admin, Front Office and Housekeeping. Security and Finance cannot open it by default. An Admin can change who holds the permission in **Roles & staff**.

Without the permission the screen says: "You don't have access to this screen. Seeing the state of the units needs the "Manage units" permission. Ask an administrator if this is part of your job."

**Title:** **Units**, with the line "Every unit in the building, and what it is doing right now."

**What is on it, top to bottom:**

1. **Eight status tiles**, one for each unit status: **Available**, **Held**, **Booked**, **Occupied**, **Awaiting inspection**, **Cleaning**, **Leased**, **Out of service**. Each shows how many units are in that status right now. The tiles always count the whole building, even when the list below is filtered, and a tile at zero still shows. Clicking a tile shows only the units in that status. Clicking the same tile again clears that filter. Choosing a tile keeps any type filter or search you already have.
2. **The control line:**
   - A search box, "Unit, occupant or type". It matches the unit's reference, the name of whoever is in it (guest or tenant), the name of the guest whose stay is being turned over, and the unit type's name.
   - **Status**: a filter where you can tick several statuses. Each option has the same coloured dot as its badge.
   - **Type**: a filter where you can tick several unit types.
   - **Clear**: shown when any filter or search is on. It removes them all.
   - On the right, only for people holding **Edit settings, roles & the unit registry** (Admin by default): **Download CSV** (a menu with three tables: *Units*, *Occupancy* and *Inspections*) and **Manage units**, which opens the Unit registry.
3. **The table**, with these columns:
   - **Unit**: the unit's reference (door name). Clicking the row opens the unit's page.
   - **Type**: the unit type, for example 3-bedroom.
   - **Status**: the status badge (see *Unit statuses* below).
   - **Who**: what fills this cell depends on the unit:
     - If the unit is out of service, the reason it is out of service.
     - If the unit is **Awaiting inspection** or **Cleaning**, the name and booking reference of the guest who just left. This is the stay being turned over, not the guest arriving today.
     - If someone is in the unit or booked into it today, their name and booking reference. For a long-term lease it shows the tenant's name and the words "Long-term lease" instead of a reference.
     - Otherwise, a dash ("Nobody is in this unit today" when you hover over it).
   - **Until**: again depends on the unit:
     - Out of service: "Since" and the date it was taken out of service.
     - Mid-turnover: "Next stay" and the date the next booking starts, which can be today. A dash if nothing is booked.
     - Someone in it or booked into it today: the last day of the stay or lease. An open-ended lease shows "No end date".
     - Free: "Next stay" and the date of the next booking, or a dash ("Nothing booked") if there is none.
4. **Page footer**: "1–25 of 48 units" style count, page controls, and a rows-per-page choice of 25 (the default), 50 or 100.

Units are listed in order of their reference. Filters, search and page are part of the web address, so a filtered view can be bookmarked or sent to someone, and the browser's back button undoes a filter.

**When the list is empty:**
- With filters on: "No units match these filters. Try a different status or unit type, or clear the filters to see the whole building." with a **Clear filters** button.
- With no units at all: "No units yet. The building has no units on record. An administrator sets them up on the unit registry screen." Admins also see **Set up the units**.

### Unit statuses

A unit's status is never typed in by anyone. The system works it out each time the page loads, from the bookings, leases and inspections on record. Only two facts are set by hand: that a unit is **out of service** and that it is **leased** long-term. Everything else follows from bookings and housekeeping.

The system checks these rules in this order, and the first one that fits wins:

| Badge | Colour | What it means | How it comes about |
|---|---|---|---|
| **Out of service** | red | Nobody can be booked into the unit. | Set by hand with **Take out of service**. It outranks everything else. |
| **Occupied** | the "active" colour | A guest is checked in. | A booking in the unit is checked in. This holds on the guest's last day and if they stay past it: the unit is Occupied until they are checked out. |
| **Awaiting inspection** | amber | The last guest has checked out and nobody has recorded an inspection yet. | Follows check-out. It shows even when the next guest is arriving today. |
| **Cleaning** | the "active" colour | The unit has been inspected but not yet marked ready. | Follows recording the inspection. |
| **Leased** | grey | A long-term tenant has it for today. | Set by hand with **Mark leased long-term**. |
| **Booked** | green | A confirmed booking covers today, but the guest is not checked in yet (for example, arriving today). | A confirmed booking whose dates include today. |
| **Held** | amber | A booking that is not yet confirmed covers today: held, awaiting payment, or a draft. | Bookings in those states still keep the unit, so nobody else can book it. |
| **Available** | grey | Nothing covers today. | No booking or lease covers today and there is no turnover in progress. |

Things staff often misread:

- **Booked and Held only describe today.** A unit with a confirmed booking starting tomorrow shows **Available**, with "Next stay" and tomorrow's date in the **Until** column.
- **Available is grey on purpose.** Colour is kept for the units that need attention.
- **A turnover only counts for stays that ended on or after the day turnover tracking was switched on** (when the housekeeping screens were released). Stays that ended earlier never show as Awaiting inspection.
- **Ready is shown on screen but nothing enforces it.** A unit that is Awaiting inspection or Cleaning can still be booked and a guest can still be checked into it. The guard's gate card warns him when a unit is not marked ready, but does not stop the check-in (see *Field screens*). Whether "not ready" should block a check-in has not been decided yet. Ask Jefferson/Jason.
- **An early departure.** If a guest checks out before their booked last day, the unit becomes Awaiting inspection, then Cleaning, and once marked ready it shows **Available**. Even so, the nights the guest paid for and did not use still cannot be sold, because checking out never shortens a booking. No screen can free them: a booking that is checked in or completed cannot be amended. This is not settled yet — ask Jefferson/Jason if those nights need reselling (see *The booking's own page → How to check a guest out (from the portal)*).

### A unit's page

**Who can open it:** anyone holding **Manage units** (Admin, Front Office, Housekeeping by default). Others see "You don't have access to this screen. Seeing a unit needs the "Manage units" permission. Ask an administrator if this is part of your job."

Open it by clicking a row on the Units board. The address is the unit's reference, for example `/units/3B-04`. If a unit is renamed, its address changes and the old address shows a "page not found" screen. A reference that does not exist also shows "page not found".

**At the top:** **Back to units**, then the unit's reference as the title with its status badge beside it, and the action buttons (see *How to…* below). Only the buttons you are allowed to use and that make sense for the unit's state appear:
- **Take out of service** (in red text) or **Return to service**: for **Manage units** holders.
- **Mark leased long-term**: for **Manage tenancies** holders, and only when the unit is in service and nobody is in it or booked into it today.
- **End the lease**: for **Manage tenancies** holders, only when a lease covers today.

**Sections, left column:**

1. **About this unit**: the unit's standing note, such as "Shower door sticks — lift slightly to close. Spare key with security." When there is no note it says: "Nothing recorded about this unit. Anything true of the unit itself belongs here — a sticking door, a temperamental aircon, where the spare key lives." There is an **Add a note** / **Edit note** button.
2. **The unit**: **Reference** and **Type**. If the unit is out of service it also shows **Out of service since** and **Reason**.
3. **Today**: who is in the unit or booked into it today:
   - For a booking: **Guest**, **Until** (the last day), and **Booking** (the reference, which opens the booking).
   - For a lease: **Tenant**, **Until** (or "No end date — until it is ended"), and **Arrangement: Long-term lease**.
   - If nobody is in it, one of: "Nobody is in this unit, and nobody can be booked into it until it is returned to service." (out of service); "Nobody is in this unit today. The next stay begins [date]."; or "Nobody is in this unit today, and nothing is booked."
4. **Last stay**: shown only while a turnover is in progress or just finished, meaning the most recent guest has checked out (on or after the day turnover tracking began) and the next guest has not yet checked in. It shows **Guest**, **Booking**, **Inspection** ("Clean", "Issues found", or "Not inspected yet") and **Marked ready** (the time, or "Not yet"). Under it:
   - **Record inspection**, if no inspection is recorded and you hold **Record inspections** (Admin and Housekeeping by default, **not** Front Office).
   - **Mark ready**, once an inspection is recorded and the unit has not been marked ready.

**Right column: History.** Everything recorded against this unit, newest first, 10 per page, with who did it and when. If an entry was made by an account that no longer exists it shows "A former staff member". Entries you will see:
- "Added to the building", "Removed from the building", "Renamed from X to Y"
- "Taken out of service" (with the reason quoted), "Returned to service"
- "Let long-term", "Lease end date changed", "Lease removed"
- "Note added", "Note changed", "Note cleared". The note's text itself is not shown in the history.
- "Marked ready after PV-…"

When there is nothing yet: "Nothing recorded against this unit yet."

### Unit registry

**Who can open it:** anyone holding **Edit settings, roles & the unit registry**, which is Admin only by default. Front Office cannot rename units by default. An Admin can grant the permission, but it also gives access to pricing, roles and the audit log.

Without the permission: "You don't have access to this screen. Naming and adding units needs the "Edit settings & roles" permission. Ask an administrator if this is part of your job." (The permission's real name in **Roles & staff** is **Edit settings, roles & the unit registry**.)

Reached from the sidebar (Admin → **Unit registry**) or the **Manage units** button on the Units board. **Back to units** is at the top.

**Title:** **Unit registry**, "What the units are called, and how many of each type the building has."

At the top is a notice: "Renaming a unit renames it everywhere, including on stays that have already happened — the name is what staff call the door, so past bookings follow it. Every change is recorded against the unit."

Then there is **one card per unit type** (2-bedroom, 3-bedroom, 4-bedroom, Semi-detached). Each card has:
- **Name pattern**: the part before the number, including any dash or space, for example `3B-` or `Villa `.
- **Numbered**: one of **01, 02, 03…**, **1, 2, 3…**, **001, 002, 003…** or **101, 102, 103…**.
- **Ending pattern (optional)**: anything after the number, for example ` East`.
- **How many**: the number of units of this type, from 0 to 200.
- A preview line: the first three names, "…", the last name, and the count, for example "3B-01, 3B-02, 3B-03 … 3B-36 · 36 units". With zero units it says "No units of this type. Set a number above to add some."
- **Each unit's name (N)**: a fold-out list of every unit's name as its own field, so individual units can be named off-pattern (for example two units called "Annex"). It opens by itself when a name has a problem, and shows "N to fix".
- If the count is lowered, a note listing which units will go: "[names] will be removed. They have never been occupied, so nothing is lost." Or, in red: "[names] have hosted bookings and cannot be removed. Take them out of service instead — they stop appearing in availability and their record stays."

At the bottom: a summary of what will happen (for example "2 renamed, 4 added") and **Save changes**. Save stays greyed out until something has changed, and while any name has a problem or any removal is blocked.

The editor opens by reading the pattern from the names that already exist. The fields below always show the real names.

### Property settings

**Who can open it:** anyone holding **Edit settings, roles & the unit registry**, which is Admin only by default.

Without it: "You don't have access to this screen. Changing the property settings needs the "Edit settings, roles & the unit registry" permission. Ask an administrator if this is part of your job."

**Title:** **Property settings**, "What the property charges, what a day pass admits, how long documents are kept, and where customers transfer to. Every change is recorded."

**Five tabs**, in this order: **Rates**, **Extras**, **Day pass**, **Documents**, **Bank accounts**. On the right of the tab row is **Download CSV**, which downloads every rate, price, retention period and account as one spreadsheet.

**Rates, Day pass, Documents and Bank accounts are forms.** Each has its own **Save changes** button at the bottom. The button stays greyed out until you change something. Beside it the screen says "Unsaved changes." or "Everything here is saved." Only the tab you save is saved.

**Extras is different.** It is a list where each change (add, edit, move, remove, put back) is saved on its own, straight away.

A link can open a particular tab directly. The Audit log's links to settings changes do this.

## How to …

### How to see what a unit is doing right now

**Who can do this:** anyone with **Manage units**: Admin, Front Office and Housekeeping by default. An Admin can change this.
**Where:** Property → **Units**.
**Steps:**
1. Open **Units**.
2. Find the unit: type its reference, the guest's or tenant's name, or the type into the search box, or click a status tile.
3. Read the **Status**, **Who** and **Until** columns, or click the row for the full page.

**What happens next:** nothing changes. This only reads.
**Edge cases and limits:** the board shows today only, in Brunei time. There is no date picker on this board. For other dates, use the Calendar (see *Finding and changing bookings → Calendar*).

### How to take a unit out of service

**Who can do this:** anyone with **Manage units**: Admin, Front Office and Housekeeping by default. An Admin can change this.
**Where:** Units → the unit's page → **Take out of service** (red text, at the top).
**Steps:**
1. Open the unit's page.
2. Press **Take out of service**. A box opens: "Take [unit] out of service?" It explains: "It stops appearing in availability, so nobody can be booked into it, and it drops out of the free-unit counts. Its bookings and its history stay exactly as they are. You can return it to service at any time."
3. Under **What is wrong with it?**, type the reason, for example "Aircon compressor failed — parts ordered". This is required and must be 3 to 280 characters. It is shown on the Units board so the next person does not have to ring anyone.
4. Press **Take out of service**. To back out, press **Leave it in service**.

**What happens next:**
- The unit's status becomes **Out of service**, dated today. The reason appears in the **Who** column and on the unit's page.
- The unit stops appearing in any unit picker (New booking, amend, the public site's availability). No booking, amendment or lease can be placed in it.
- It drops out of the free-unit counts (for example on the dashboard).
- The unit's History records "Taken out of service" with the reason, your name and the time.
- A message confirms: "[unit] is out of service. It has left availability."
- If this was the last in-service unit of its type, the public site's front page and FAQ answers stop quoting that type's rate. Because those pages are refreshed at most hourly, this can take up to an hour.

**Edge cases and limits:**
- **You cannot take a unit out of service while anything is still booked into it**: a guest currently in it, a held, awaiting-payment or confirmed booking that has not yet ended, **any future booking**, or a lease. Move or cancel those bookings first (see *Finding and changing bookings → How to edit (amend) a booking*, and *The booking's own page → Cancel*), or end the lease.
- A guest who checked out early still counts until the booked last day has passed, because checking out does not shorten the booking. A completed booking cannot be amended, so wait until that day has passed.
- The out-of-service date is always today. It cannot be backdated or set for a future date.
- **Can it be undone?** Yes. Press **Return to service** (below). The history keeps both entries.

**If you see an error:**
- "This unit still has N booking(s) on it, starting with [reference]. Out of service means nobody can be put in it, so move or cancel those first." The unit still has something booked into it that has not ended, as listed above. The name after "starting with" is a booking reference, or a tenant's name if it is a lease. When there are several, it is not necessarily the earliest one. Find them on the unit's page, the Calendar or All bookings, then move, cancel or end them.
- "This unit is already out of service." Someone else did it first. Reload the page.
- "That unit no longer exists." The unit was removed in the registry. Reload.
- "Say briefly why this unit cannot be used." The reason is missing or shorter than 3 characters.
- "Keep the reason under 280 characters."
- "Check the highlighted fields." Look at the field marked in red.

### How to return a unit to service

**Who can do this:** anyone with **Manage units**: Admin, Front Office and Housekeeping by default. An Admin can change this.
**Where:** Units → the unit's page → **Return to service**.
**Steps:**
1. Open the unit's page (it will show **Out of service**).
2. Press **Return to service**. There is no confirmation box and no reason to type.

**What happens next:**
- The unit is bookable again straight away and reappears in availability and free-unit counts.
- The out-of-service date and reason are cleared from the unit. The old reason stays in the History entry "Returned to service".
- A message confirms: "[unit] is back in service. It can be booked again."
- **Can it be undone?** Yes. Take it out of service again, which needs a new reason.

**If you see an error** (shown in a red pop-up, "That did not work"):
- "This unit is already in service." Someone else already returned it.
- "That unit no longer exists." Reload.
- "That unit could not be identified." Reload the page and try again.

### How to record a long-term lease on a unit

This marks a unit as let to a long-term tenant so that it cannot be booked. It records **no rent, agreement or renewal**. Full tenancy management is a later phase.

**Who can do this:** anyone with **Manage tenancies**: Admin and Front Office by default. Housekeeping cannot. An Admin can change this.
**Where:** Units → the unit's page → **Mark leased long-term**.
**Steps:**
1. Open the unit's page. The button only appears when the unit is **in service** and **nobody is in it or booked into it today**.
2. Press **Mark leased long-term**. The box reads "Mark [unit] leased long-term" and explains: "The unit stops being offered for those dates, by the same rule that stops two guests booking the same night. It becomes available again the day the lease ends."
3. **Let to**: the tenant's name, for example "Tan Family" (2 to 120 characters). This is free text, not linked to a guest record.
4. **Starts**: defaults to today. You can pick another date.
5. **Ends (optional)**: leave it empty for a month-to-month tenancy ("Leave the end date empty for a month-to-month tenancy. The unit stays occupied until somebody ends the lease."). If you pick one, it must be after the start date. The ✕ clears a date picked by mistake.
6. Press **Mark leased**. To back out: **Don't mark it**.

**What happens next:**
- The unit is blocked for every night from the start date to the end date, or indefinitely if there is no end date. No booking can be made over it, by staff or online.
- While the lease covers today, the board shows **Leased**, the tenant's name with "Long-term lease", and the end date or "No end date".
- The day the lease ends, the unit becomes available again automatically. Nobody has to do anything.
- History records "Let long-term" with your name.
- A message confirms: "[unit] is let long-term. It will not be offered for those dates."

**Edge cases and limits:**
- An open-ended lease blocks **every** future night, so it will be refused if the unit has **any** booking in the future. A lease with an end date only has to avoid the bookings inside its own dates.
- **A lease with a future start date** does not show on the unit's page or the board until it starts. The unit shows Available with "Next stay" and the lease's start date, and there is no **End the lease** button until the start date arrives. Check the start date carefully before saving. A future lease cannot be changed or removed from the screen before it begins.
- A leased unit cannot be taken out of service.
- Tenants do not appear in All bookings. A lease is not a booking and has no reference, payments or deposit.

**If you see an error:**
- "Something else already occupies this unit over part of those dates. Check the bookings on it first." A booking, or another lease, overlaps the dates. With no end date, this means any future booking at all.
- "This unit is out of service, so nobody can be put in it. Return it to service first."
- "A lease has to end after it starts."
- "Who is the unit let to?" The name is missing or only 1 character.
- "Keep the name under 120 characters."
- "Pick the day the lease starts." / "Use a real date."
- "That unit no longer exists." Reload.
- "Check the highlighted fields."

### How to end a lease, or change its end date

**Who can do this:** anyone with **Manage tenancies**: Admin and Front Office by default. An Admin can change this.
**Where:** Units → the unit's page → **End the lease**. The button only appears while the lease covers today.
**Steps:**
1. Press **End the lease**. The box reads "End the lease on [unit]?" with who it is let to and since or until when.
2. **Ends on**: pick the day the tenant leaves. The unit is bookable again **from that day**. The earliest date the picker offers is the day after the lease started.
3. Press the button. It reads **Set the end date** for a lease that had no end date, or **Change the end date** for one that had. To back out: **Leave the lease**.

**What happens next:**
- The lease now ends on that date. From that day the unit is free and can be booked.
- History records "Lease end date changed".
- A message: "The lease on [unit] now ends [date]", with the tenant's name.

**Edge cases and limits:**
- The same button moves an end date later (extends a lease) as well as earlier. The system will not let a lease run over a booking that already exists on the unit. It may not explain this with a friendly message: if you see the "This page didn't load" screen after extending a lease, check the unit's upcoming bookings and pick an end date before the next one starts.
- You cannot turn a lease back into an open-ended one with this button. There is no button that clears an end date.
- **You cannot delete a lease outright from the screen.** The dialog is built to "remove the lease altogether" if the end date is on or before the start, but the date picker never offers such a date. The shortest you can make a lease is one night: set the end to the day after it started. If a lease was recorded by mistake, set the earliest end date and tell Jefferson.
- **Can it be undone?** Changing the end date again undoes it, as long as the lease still covers today. Once the end date has passed, the lease no longer shows on the page and cannot be reopened. Record a new lease instead.

**If you see an error:**
- "This unit is out of service. Return it to service before changing its lease."
- "That lease no longer exists." Someone else changed it. Reload.
- "Pick the day the lease ends." / "Use a real date."

### How to add, change or clear a unit's note

**Who can do this:** anyone with **Manage units**: Admin, Front Office and Housekeeping by default. An Admin can change this.
**Where:** Units → the unit's page → **About this unit** → **Add a note** / **Edit note**.
**Steps:**
1. Press **Add a note** (or **Edit note**).
2. Type the standing fact about the unit (up to 2,000 characters). A note is one block that you edit, not a thread of messages. Write what is true now, for example where the spare key lives, or a door that sticks.
3. Press **Save note**. **Cancel** leaves it unchanged.
4. To remove the note, empty the box and save.

**What happens next:** the note shows at the top of the unit's page for everyone who can open it. History records "Note added", "Note changed" or "Note cleared" with your name. The text before and after is kept in the audit record, but the History panel does not display it. A message "Note saved for [unit]" appears, but only if something actually changed.
**Edge cases and limits:** the note belongs to the unit, not to any booking. A note about one guest's stay belongs on the booking instead (see *The booking's own page → Notes*). The note does not appear on the Units board or the Gate. It does appear, read-only, under **About this unit** on housekeeping's Departures card and inspection page while the unit is being turned over (see *Field screens*).
**Can it be undone?** Edit it back. The old text is in the audit record if you need to recover it, so ask an Admin.
**If you see an error:** "Keep the note under 2000 characters."; "That unit no longer exists."

### How to finish a turnover from the portal (record the inspection, mark the unit ready)

Housekeeping normally does this on the phone (see *Field screens → Housekeeping*). The unit's page offers the same two steps for when someone at a desk does it.

**Who can do this:**
- **Record inspection** needs **Record inspections**: Admin and Housekeeping by default, not Front Office.
- **Mark ready** needs **Manage units**: Admin, Front Office and Housekeeping by default.
- An Admin can change both.

**Where:** Units → the unit's page → **Last stay** section.
**Steps:**
1. If **Inspection** says "Not inspected yet", press **Record inspection** and record how the unit was found ("Clean" or "Issues found", notes and photographs). The full inspection form is described in *Deposits, reports and finance → How to record the inspection after check-out*. What is recorded cannot be changed afterwards. When it is saved the message adds "The unit can now be marked ready."
2. Once an inspection is recorded, press **Mark ready**. A box asks "Mark [unit] ready?": "This tells the office [unit] is clean after [reference], under your name. It cannot be undone, and it does not change who can be booked into the unit." Press **Mark ready**, or **Not yet** to back out.

**What happens next:** the unit leaves **Awaiting inspection** / **Cleaning** on the board. **Marked ready** shows the time. History records "Marked ready after [reference]". A message: "[unit] is ready. Marked ready after [reference]."
**Edge cases and limits:**
- The unit status goes Awaiting inspection → (Record inspection) → Cleaning → (Mark ready) → whatever the day's bookings say.
- Mark ready cannot come before an inspection, and it is written once. **It cannot be undone.**
- Once the next guest has checked in, the old stay no longer needs marking ready and the Last stay section disappears.
- Marking ready changes nothing about selling or checking in (see *Unit statuses*).

**If you see an error:**
- "Record the inspection first. A unit is marked ready after somebody has looked at it."
- "This unit has already been marked ready." Someone else did it.
- "The next guest has already checked in, so this stay no longer needs marking ready."
- "The guest has not checked out yet, so the unit cannot be marked ready." Check the guest out first (see *The booking's own page → How to check a guest out (from the portal)*).
- "This booking occupies no unit, so there is nothing to mark ready."
- "That stay no longer exists." / "That stay could not be identified. Refresh and try again."
- "That did not go through, so nothing was recorded. Check the phone has signal and try again." The connection dropped. Try again.

### How to rename units or change how many there are

**Who can do this:** anyone with **Edit settings, roles & the unit registry**, which is Admin only by default. An Admin can grant it to others.
**Where:** Admin → **Unit registry** (or Units → **Manage units**).
**Steps:**
1. Find the card for the unit type.
2. To rename **every** unit of a type, change **Name pattern**, **Numbered** or **Ending pattern**. All names for that type are regenerated from the pattern and replace any hand-typed names for that type.
3. To add units, raise **How many**. New names are added at the end, following the pattern. Existing names are left alone.
4. To remove units, lower **How many**. Units are removed **from the end of the list** (the highest-numbered). Only units that have never had any booking or lease can be removed.
5. To rename **one** unit, open **Each unit's name** and type over its field.
6. Check the summary beside the button (for example "2 renamed, 4 added"). **If it lists changes you did not intend, do not save.** Reload the page instead.
7. Press **Save changes**.

**What happens next:**
- Everything is applied at once, or nothing is. You never get half a rename.
- **A rename is retrospective.** Every past and future booking on that unit now shows the new name, including completed stays. The old name is kept in the unit's History ("Renamed from X to Y").
- The unit's page moves to its new address. Old bookmarks to it stop working.
- New units are in service and bookable straight away, on the public site too. If a type had no units before (for example the 2-bedroom), it starts being sold and advertised: the front page and FAQ answers begin quoting its rate.
- History records "Added to the building" / "Removed from the building" on each unit, and the Audit log records "Unit registry updated — 2 renamed, 4 added".
- A message: "Units updated" with what changed.

**Edge cases and limits (what cannot be done here):**
- **A unit that has ever had a booking or a lease cannot be removed**, even if that booking was cancelled or expired. Take it out of service instead.
- **A unit cannot be moved to a different type**, and the types themselves (their names, adding a new type) cannot be changed on any screen. That needs a developer.
- You cannot pick which unit to remove from the middle of a list. Lowering the count always removes from the end. Units are matched to names by position in number order, so renaming shifts names along; it does not swap the units themselves.
- Names: at most 16 characters. No `/`, `?`, `#`, `%` or `\`. Not `new`, `manage`, `edit` or `settings`. Unique across the **whole building**, ignoring capitals (`3b-01` and `3B-01` count as the same).
- At most 200 units per type.

**Can it be undone?** A rename or an addition can be reversed by editing again. A removed unit cannot be brought back as the same unit. Adding it again creates a new unit with no history, which does no harm because only never-used units can be removed.

**If you see an error:**
- Under a name field: "Give this unit a name." / "Too long for a table cell." (over 16 characters) / "That word is reserved." / "No slashes, hashes or percent signs." / "Another unit already has this name."
- "Some names cannot be used." One or more fields are marked. Fix them.
- "Some units have hosted bookings and cannot be removed. Take them out of service instead — that keeps the record and stops them being booked." followed by the unit names.
- "[unit] has hosted bookings and cannot be removed. Mark it out of service instead — it stops appearing in availability and the record stays."
- "Nothing has changed."
- "Someone else changed the units while you were working on this. Reload and try again." Another Admin saved first. Reload and redo your change.
- "Two units would end up with the same name. Nothing was changed."
- "The units could not be updated. Nothing was changed." / "The form could not be read. Reload and try again."

### How to change nightly rates, guest limits and car parks (Rates tab)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** Admin → **Property settings** → **Rates** → **Nightly rates** table.
**Steps:**
1. For each unit type (listed cheapest first), edit:
   - **Rate per night (BND)**: typed like `200` or `200.50`, with no symbols. Typing without commas always works; a comma between thousands (`1,200.00`) is also accepted.
   - **Maximum guests**: 1 to 99. How this number is used depends on "When a party is over the maximum" (below).
   - **Car parks**: 0 to 99.
2. Press **Save changes**.

**What happens next:**
- **Rates apply to bookings made from now on.** A booking already made keeps the price it was quoted, "unless somebody amends it, which reprices the whole stay at today's rates" (see *Finding and changing bookings → How to edit (amend) a booking*).
- The new rate shows at once on New booking, on the public booking pages, and in the public FAQ answers and front-page "from" prices. Those two pages refresh when you save.
- **Car parks is a limit for customers and a statement for staff.** The booking forms say "The [type] includes N parking spaces." On the **public website**, a customer can enter no more cars than that, and is asked to message the office on WhatsApp at +673 8959798 first to bring another. On **staff forms** (New booking, Edit) more vehicles can be entered; the form warns that "The extra car is still recorded so Security can match it at the gate, but it may not have a bay." and nothing is refused. The number also fills the FAQ figure "Parking spaces per apartment type".
- A message "Rates updated" with "N changes saved and recorded" (or "Nothing had changed, so nothing was recorded."). The Audit log records, for example, "Nightly rate changed — BND 200.00 → BND 220.00".

**Edge cases and limits:** the front page and FAQ only quote rates for types the building has at least one in-service unit of. The 2-bedroom has no units until someone adds them in the Unit registry, so its rate is not advertised.
**Can it be undone?** Type the old figure back and save. Bookings made at the new rate in between keep it.

### How to change the guest, time, deposit and booking-window figures (Rates tab)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Rates**, under the sections below the rates table.

| Field (as on screen) | What it controls | Where it shows up |
|---|---|---|
| **When a party is over the maximum**: **Charge for each extra guest** / **Refuse the booking** | "Charge" means a party above a unit type's **Maximum guests** can book and pays the extra guest charge for each guest over. "Refuse" means such a party cannot book that type at all ("[Type] takes up to N guests; this party is M."). The screen notes: "Charging is what the system does today." | Every stay quote: New booking, amend, public booking, and **Change** on a booking's Party line. **This is not settled yet.** The client's price list says both "max 8 pax" and "7 per extra person". Ask Jefferson/Jason before changing it. |
| **Extra guest, per night** | Charged per extra guest per night when "Charge for each extra guest" is chosen. | Quotes; FAQ figure "Extra guest charge". |
| **Children up to this age are not counted** | Guests this age and under do not count towards the maximum or the extra-guest charge. For example, 3 means aged 3 and under are free. Allowed range is 0 to 129. | Booking forms label the counts "Over N" / "Aged N and under"; FAQ figure "Age up to which a child is not counted". |
| **Check-in time** / **Check-out time** | 24-hour times such as 14:00 and 12:00. | Booking emails ("Check in from 14:00, and check out by 12:00."), booking forms, FAQ figures. |
| **Early check-in, per hour** | Stored, but **no screen charges early check-in today**. The booking forms never offer it, even though the hint says "Priced when the desk grants it". | Nowhere a guest is charged, at present. |
| **Late check-out, per hour** | Charged per hour past check-out when late check-out hours are added on a booking ("Charged for every hour past check-out, not once"). | New booking, amend and public stay booking; FAQ figure "Late check-out charge". |
| **Security deposit** | The refundable deposit each **new** short stay asks for. "Refundable, and never discounted. It is not a cap on what damage can cost." | New bookings, public booking pages, emails, FAQ figure, front-page fine print. Existing bookings keep the deposit they were created with. An **amendment** re-asks at today's figure (unless the deposit was waived). See *Payments* and *Creating bookings → The security deposit*. |
| **How far ahead a booking can be made (days)** | Allowed range is 1 to 3650. A stay or day pass cannot start later than this many days from today. | Staff and public date pickers; refusal "Bookings open up to N days ahead."; front-page fine print and FAQ figure "How far ahead guests can book". Shortening it does not cancel bookings already made further ahead. |

**Steps:** change the fields and press **Save changes**. The Rates tab saves the rates table and all these figures together.
**What happens next:** the same as for rates. Nothing already booked is repriced unless it is amended. The Audit log records each changed figure, for example "Security deposit changed — BND 100.00 → BND 150.00", or "Booking policy updated — 3 fields changed".
**Can it be undone?** Type the old values back and save.

**If you see an error on the Rates tab** (shown under the field after you press Save, with "Some of these figures were refused." above the button):
- "The nightly rate must be an amount in BND, like 250 or 1,250.50 — no symbols." The same wording is used for "The extra person charge", "The early check-in rate", "The late check-out rate" and "The security deposit". A comma between thousands (1,200.00) is accepted; the message appears for a comma anywhere else (12,00.00), a currency symbol, letters or more than two decimals. Typing the figure without commas always works.
- "Maximum guests must be a whole number." / "Maximum guests must be between 1 and 99."
- "Car parks must be a whole number." / "Car parks must be between 0 and 99."
- "The exempt age must be a whole number." / "The exempt age must be between 0 and 129."
- "Check-in time must be a 24-hour time, like 14:00." / "Check-out time must be a 24-hour time, like 12:00."
- "The advance booking window must be a whole number." / "The advance booking window must be between 1 and 3650."
- The shared settings errors are listed below under *Errors any settings tab can show*.

### How to manage the extras a guest can add (Extras tab)

Extras are optional items a short stay can buy, such as the sofa bed. Each is a flat fee for the whole stay, whatever the number of nights. Day passes do not have extras.

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Extras**.

The **Extras** card lists each extra in the order the booking forms show them. Each row shows:
- the name, and a grey **Not on the booking form** badge if it has been taken off sale;
- the description, if there is one;
- "BND X per stay · N available", or "Not counted — bookings are not limited".

Each row has up and down arrows (move it in the list), **Edit** and **Remove**. Extras that have been removed are listed underneath in a **Removed** card ("Off the booking forms. Bookings that already have one keep it."), each with **Put back**.

When the list is empty: "Nothing to add to a stay yet. The booking forms will show no extras section at all."

**To add one:** press **Add extra** and fill in:
- **Name** (up to 60 characters, e.g. "Extra towel");
- **Description** (optional, up to 200 characters; shown under the counter on the booking form);
- **Price per stay** (BND, like 28 or 28.50);
- **How many you have**: leave it **blank** if nobody has counted them, and bookings will not be limited. With a number, "two bookings cannot take the same one on the same night". Blank is not the same as 0: 0 would refuse every booking.
- **Available on booking form**: ticked by default. Untick to keep the extra listed but off the forms.

Press **Add extra**. The new extra goes to the end of the list and, if left on sale, "appears on the booking forms as soon as it is saved".

**To edit one:** press **Edit**, change the fields and press **Save extra**. "The new price applies to bookings made from now on. Bookings already taken keep what they were charged."

**To take one off sale for a while:** **Edit**, untick **Available on booking form**, then **Save extra**. It stays in the list with the badge. Bookings that already have one keep it.

**To reorder:** use the arrows. The order is the order on the booking forms and on receipts.

**To remove one:** press **Remove**. The box asks "Remove [name]?": "It comes off the booking forms, so nobody can add one from now on. Bookings that already have one keep it and are still charged what they were quoted. You can put it back from the removed list." Press **Remove**, or **Keep it** to back out.

**To put one back:** in the **Removed** card press **Put back**. It returns at the end of the list and **off the booking form**: "[name] is back, not on the booking form yet". Check the price and count, then **Edit** and tick **Available on booking form**.

**What happens next:**
- Changes show at once on New booking, amend and the public stay booking form.
- The FAQ figure "Sofa bed charge" follows the extra that started life as the sofa bed, even if it is renamed. If that extra is ever removed, answers using the figure say "the price shown when you book" instead.
- **The count is enforced across bookings.** With a number set, an extra is held for the nights of the stay and released when the booking is cancelled, expires or is marked a no-show. It is **not** released by an early check-out, and a checked-in or completed booking cannot be amended to free it. A booking that would take one too many on any night is refused with "Every [name] is taken for those nights." or "Only N [name] are free for those nights." (see *Creating bookings*).
- The Audit log records "Karaoke set added as an extra", "[name]: Price per stay changed" (or "[name] changed" when several fields changed, or "Renamed to [name]"), "[name] taken off the booking form" / "[name] put on the booking form", "[name] removed", "[name] put back". Reordering is not recorded.

**Edge cases and limits:**
- **You cannot lower the count below what bookings already hold** on their busiest night from today onward: "Bookings already hold N. Take that many or more, or amend the bookings first."
- Removing is never a delete. Bookings keep the extra on their receipt and it keeps counting against the stock.
- Editing a booking that holds an extra which has since been taken off the booking form or removed is refused with "[name] is not available to book." unless that extra's quantity is set to 0 on the edit form. So an extra you stop offering has to be taken off any upcoming booking that holds it before that booking can be edited for anything else.
- A fee above BND 1,000 is refused as a probable typing mistake.

**If you see an error:**
- "Give the extra a name." / "Keep the name to 60 characters or fewer." / "The name needs at least one letter or number." / "Give the extra a name of 60 characters or fewer."
- "Keep the description to 200 characters or fewer."
- "Enter the price in BND, like 28 or 28.50." / "That price looks wrong. Enter it in BND, not cents." (over BND 1,000) / "Enter the price in BND."
- "Enter a whole number, or leave it blank." / "That is more than anybody owns." (over 9,999)
- "Bookings already hold N. Take that many or more, or amend the bookings first." / "Bookings already hold more than that."
- "Somebody else changed this extra while you had it open. Reload and try again."
- "That extra is no longer there. Reload the page."
- "Sign in again — the change was not saved."
- "That form could not be read. Reload the page and try again."
- "That change could not be saved." / "That extra could not be put back." / "That extra could not be removed." / "That move did not make sense. Reload the page."

### How to change day-pass prices (Day pass tab: age bands and family bundles)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Day pass**.

**Price per person by age** is a table of bands with columns **Band**, **From age**, **Up to age**, **Price (BND)**, and an ✕ to remove a row. Use **Add a band** for a new row.
- The bands must run from age **0** with no gaps. Each band's **Up to age** must equal the next band's **From age**. The last band's **Up to age** is left blank ("and above").
- **Up to age** is the first age the *next* band covers: "a child band ending at 12 means a 12-year-old pays the adult price."
- A band priced at 0 (for example "Under 1") is free.

**Family bundles** are a headcount per band plus one price for the lot, with columns **Bundle**, one column per band, **Price (BND)** and ✕. Use **Add a bundle** for a new row.
- A bundle can be used several times on one booking, and anyone left over pays per person. "A party is always charged the cheapest arrangement, so a bundle that costs more than the same guests priced one by one is simply never used."
- With no bundles: "No bundles. Every party is priced per person."

Press **Save changes**. This tab saves bands, bundles **and** facilities together.

**What happens next:** new day-pass bookings on the website use the new prices (staff cannot create day passes in the portal). Day passes already booked keep their price. The front page's "From BND X per person · family bundles from BND Y" line, the FAQ figures "Day-pass prices" and "Family bundles", and the Reports screen are refreshed. The Audit log records each band or bundle added, changed or removed.

**Edge cases and limits:**
- Removing a band also removes it from every bundle on the screen. If that leaves a bundle with nobody in it, the save is refused.
- Renaming a band does not break bundles, because bundles follow the band itself, not its name.
- **Can it be undone?** Type the old figures back and save. A removed band or bundle has to be added again.

**If you see an error** (after Save, with "Some of these figures were refused."):
- "There has to be at least one age band."
- "The first band has to start at 0, so every age has a price."
- "Leave the last band open-ended, so an older guest still has a price."
- "Only the last band can be open-ended."
- "This band ends at X and the next starts at Y — they have to meet."
- "A band has to end after it starts."
- "The band name cannot be empty." / "The band name must be 40 characters or fewer." / "That band name is used twice."
- "The age it starts at must be a whole number." / "… must be between 0 and 130." (the same for "The age it ends at")
- "The price must be an amount in BND, like 250 or 1,250.50 — no symbols." A comma between thousands (1,200.00) is accepted; the message appears for a comma anywhere else, a currency symbol, letters or more than two decimals.
- "The bundle name cannot be empty." / "The bundle name must be 60 characters or fewer." / "That bundle name is used twice."
- "A bundle headcount must be a whole number." / "A bundle headcount must be between 0 and 99."
- **A bundle with every headcount left blank or 0** is refused ("A bundle has to include at least one guest."), but that message is **not shown on screen**. You only see "Some of these figures were refused." with nothing marked. Check that every bundle has at least one guest in it.
- "The age bands have to cover every age from 0 with no gaps, and the last one has to be open-ended."
- "The "X" band is still used by a family bundle. Change the bundle first, or remove it."

### How to choose what the day pass admits (Day pass tab: facilities)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Day pass** → **Facilities** table (columns **Facility**, **In the day pass**, **Day-pass capacity**, ✕). Use **Add a facility** for a new row.
**Steps:**
1. Tick **In the day pass** for each facility a pass admits, and untick the others.
2. **Day-pass capacity** (optional, a whole number from 0 to 100,000): how many day-pass visitors the facility can take on one day. This is "not how many people fit: long-term tenants use these at no charge and are always there". Leave it blank ("no limit") until a number is agreed.
3. Rename a facility by typing over its name.
4. Press **Save changes**.

**What happens next:**
- **The tick is what the site sells.** Ticked facilities are listed on the public day-pass page before a customer books, appear as cards in the front page's day-pass section (in the order of this table), and fill the FAQ figures "Facilities a day pass covers" / "Facilities a day pass does not cover".
- **Capacity:** the smallest capacity among the *ticked* facilities that have one becomes the day's limit for **online** day-pass purchases, counting every day pass already booked for that date. Once it is full, customers see "There are not enough places left for that date." (Day passes are only sold on the public site — staff cannot create one on New booking — so this limit covers every day pass.) The Reports screen's day-pass table shows "No limit set" until a capacity is entered.
- The Audit log records "Facility added", "Facility removed", or the changed field (for example "In the day pass changed — no → yes").

**Edge cases and limits:**
- Whether a facility's **card appears on the front page** is a separate switch, **Show on the front page**, on Website settings → Photos (see *Staff access and administration → Website settings*). Hiding a card there does not stop the pass admitting the facility. Unticking here does.
- The order of facilities cannot be changed with arrows. New ones go to the end.
- Removing a facility deletes it. Adding it back creates a fresh row.
- A facility keeps the web address it was given when created, even after a rename. So if you rename a facility and then add a new one with the old name, the save is refused with "Two rows have the same name. Names have to differ." Give the new one a different name.
- Whether the water park is in the pass, and whether the sauna is, is not settled yet. The sauna ships unticked. Ask Jefferson/Jason.

**If you see an error:** "The facility name cannot be empty." / "The facility name must be 80 characters or fewer." / "That facility name is used twice." / "The capacity must be a whole number." / "The capacity must be between 0 and 100000." / "Two rows have the same name. Names have to differ."

### How to change how long documents are kept (Documents tab)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Documents** → **How long documents are kept**.

There is one row per kind of document, with **Kept for (months)** and **Counted from**:
- **Identity document**: counted from the guest's check-out. "Amending a stay moves it."
- **Transfer slip**: counted from when the slip was uploaded. "An accounting record. Seven years is the usual requirement."
- **Inspection photograph**: counted from when the photograph was taken.
- **Accounting pack**: counted from when the pack was assembled. "An accounting record. Seven years is the usual requirement."

**Steps:** type the number of months (1 to 1,200) and press **Save changes**.
**What happens next:** **the change applies to files already held, not only new ones.** Every file of that kind is re-dated. "Anything that is then already past its date stops being viewable at once and is deleted on the next nightly run. The record that the file existed, who uploaded it and who opened it is kept either way." The Audit log records, for example, "Identity document retention changed — 12 → 6 months, 4 files re-dated".
**Can it be undone?** Lengthening the period again re-dates files that are still held. **A file already deleted by the nightly run cannot be brought back.** Shortening a period is therefore the one settings change that can permanently lose files, so check before saving.
**If you see an error:** "A retention period must be a whole number." / "A retention period must be between 1 and 1200." / "Some of these periods were refused." / "No retention period was given for …" / "The retention period for … has to be at least one month."

### How to change the bank accounts customers transfer to (Bank accounts tab)

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** **Property settings** → **Bank accounts** → **Accounts for customer transfers** (columns **Bank**, **Account number**, ✕). Use **Add an account** for a new row.
**Steps:** edit the bank name (up to 60 characters) and account number (up to 40 characters), add or remove rows, then press **Save changes**.
**What happens next:** the accounts are shown to customers on their booking page (`/booking/…`), in booking emails sent **from now on**, and in the FAQ figure "Bank accounts". Emails already sent keep the old numbers. Only the bank name and number are shown; there is no account holder name. With no accounts the screen warns: "No accounts. Staff will have to read the number off a phone, as they did before." FAQ answers then say "the account shown on your booking page".
**Can it be undone?** Put the old details back and save.
**If you see an error:** "The bank name cannot be empty." / "The bank name must be 60 characters or fewer." / "The account number cannot be empty." / "The account number must be 40 characters or fewer." / "That account number is used twice." / "Some of these accounts were refused."

### Errors any settings tab can show (Rates, Day pass, Documents, Bank accounts)

- "Somebody else changed these settings while this screen was open. Reload to see what they saved, then make your change again." All four form tabs share one "last saved" marker, so this appears if anyone saved **any** of those tabs after you opened the page (including you, in another browser tab). Note your changes, reload, and redo them.
- "That form could not be read. Reload the page and try again."
- "Something on this screen no longer exists — somebody else may have removed it. Reload and try again."
- "One of these values was refused. Check the figures and try again."
- "That property no longer exists." Should never happen. Tell Jefferson.

### How to download the units or settings as a spreadsheet

**Who can do this:** anyone with **Edit settings, roles & the unit registry** (Admin by default).
**Where:** Units → **Download CSV** (choose *Units*, *Occupancy* or *Inspections*), or Property settings → **Download CSV** (one sheet of every setting).
**What you get:**
- *Units*: every unit, its type, out-of-service date and reason, note, and date added.
- *Occupancy*: which unit was occupied when, for both stays and leases.
- *Inspections*: what each unit looked like after a stay.
- The settings sheet: every rate, price, period and account.

## Rules the system enforces

- **Unit status is worked out, not stored.** Only "out of service" (with a date and a reason) and a lease are set by hand. The board and the booking system read the same records, so they cannot disagree about whether a unit is taken.
- **No double booking, including leases.** A lease uses the same rule that stops two guests booking the same night. An open-ended lease blocks every future night.
- **Out of service blocks everything.** No booking, amendment or lease can be placed in an out-of-service unit, and a unit with anything still booked into it cannot be taken out of service. The system refuses rather than warns, so a guest never arrives to a sold, unusable unit.
- **Ready is shown, never enforced.** Awaiting inspection and Cleaning never stop a sale or a check-in. Mark ready needs an inspection first and cannot be undone.
- **Units that have been used are never deleted.** Any unit that has ever had a booking or lease stays in the building's records. Retire it by taking it out of service.
- **Renames are retrospective** and recorded. Registry changes apply all at once or not at all, and a save is refused if someone else changed the units meanwhile.
- **Settings are not retrospective for money.** Rates, extras, the deposit and day-pass prices apply to new bookings; amendment reprices at today's figures. The exception is **document retention**, which re-dates files already held.
- **Every settings save is checked again on the server** and refused as a whole if anything is wrong. Nothing is half-saved. A save that changes nothing records nothing.
- **Day-pass bands must cover every age**, so every guest always has a price.
- **Extra stock is a real limit** once a number is entered, counted night by night across all bookings. A blank count means no limit.

## Likely questions

**Q: The unit says Available but I can't book it for tonight. Why?**
A: Most often the previous guest checked out early. Checking out does not shorten the booking, so the unused nights are still taken even though the board shows Available once the unit is marked ready. A completed booking cannot be amended, so those nights cannot be freed from any screen; this is not settled yet — ask Jefferson/Jason. Otherwise check for a lease starting soon, or a booking that starts before your dates end.

**Q: The unit says Booked but the guest isn't here.**
A: Booked means a confirmed booking covers today but nobody has checked the guest in. They may be arriving later, or the check-in was not recorded. Open the booking from the unit's page.

**Q: Why does a unit show "Awaiting inspection" when a new guest is arriving today?**
A: Because the last guest has left and nobody has recorded the inspection. The board shows the turnover ahead of today's booking on purpose: the next guest is coming either way, and the point is that the unit is not yet checked. The **Until** column shows when the next stay begins.

**Q: Can I check a guest into a unit that isn't marked ready?**
A: Yes. The system does not stop it, and the gate card only warns. Whether it should is not decided yet. Ask Jefferson/Jason.

**Q: I marked the wrong unit ready. How do I undo it?**
A: You can't. Mark ready is written once with no undo. Tell your supervisor. The History shows who marked it and when.

**Q: The "Take out of service" button refuses me, saying the unit still has bookings.**
A: Any guest in the unit, any future booking or any lease blocks it. The message gives the count and one reference or tenant name. Move those bookings to another unit (amend) or cancel them, or end the lease, then try again. A guest who left early still counts until their booked last day, and a completed booking cannot be amended, so wait until that day has passed.

**Q: I'm Housekeeping. Why can't I see "Mark leased long-term"?**
A: Leases need **Manage tenancies**, which Housekeeping doesn't hold by default. Ask the office.

**Q: I'm Front Office. There's no "Record inspection" button on the unit page.**
A: Recording an inspection needs **Record inspections**, which by default belongs to Housekeeping and Admin. Once they record it, you can press **Mark ready**.

**Q: I'm Security (or Finance) and the Units screen says I don't have access.**
A: The Units board needs **Manage units**, which Security and Finance don't hold by default. An Admin can add it in Roles & staff.

**Q: How do I rename a door number? The Manage units button is missing.**
A: Renaming is in the Unit registry and needs **Edit settings, roles & the unit registry**, which is Admin only by default. Ask an Admin.

**Q: If I rename unit 3B-04, what happens to old bookings in it?**
A: They all show the new name, including finished stays. The old name is kept in the unit's History as "Renamed from … to …".

**Q: I lowered the count to remove a unit but it says it can't be removed.**
A: Any unit that has ever had a booking or a lease, even a cancelled one, cannot be removed. Take it out of service instead. Also note that lowering the count removes the last units in number order, not a unit of your choosing.

**Q: The registry says "3 renamed" but I haven't changed anything.**
A: Don't save. Reload the page, and if it still says so, tell Jefferson. Saving would rename units you did not mean to touch.

**Q: We have a new tenant with no end date. What do I put?**
A: Leave **Ends** empty. The unit stays blocked until someone uses **End the lease** to give it a last day.

**Q: I recorded a lease on the wrong unit. How do I remove it?**
A: If it has started, press **End the lease** and pick the earliest date offered (the day after it started). The screen cannot delete a lease completely, so tell Jefferson. If its start date is in the future, the unit page won't show it until then, so ask Jefferson.

**Q: I changed the nightly rate. Do existing bookings change?**
A: No. They keep the price they were quoted. Only new bookings, and bookings that are amended, use the new rate.

**Q: I changed the security deposit. What about bookings already made?**
A: They keep the deposit they were created with. A booking that is amended afterwards is re-asked at the new figure (unless its deposit was waived).

**Q: A customer says the website still shows the old price.**
A: The front page and FAQ page refresh when a rate is saved. The booking pages are always live. If it still looks old, ask the customer to reload. If a whole unit type was just taken out of service or returned, the front page can take up to an hour to catch up.

**Q: I set a sofa bed count and now bookings are being refused.**
A: The count is enforced across every booking, night by night. Either all are taken on those nights, or the count is too low. Raise it on the Extras tab if you have more. You can't set it lower than bookings already hold.

**Q: What's the difference between removing an extra and taking it off the booking form?**
A: Taking it off the form (untick **Available on booking form**) is for "not this month": it stays in the list. **Remove** is for "we don't have these any more": it moves to the Removed list. In both cases bookings that already have one keep it, and you can reverse either.

**Q: I edited the Rates tab, switched to Day pass, and my changes vanished.**
A: Each tab only keeps unsaved edits while you are on it. Switching tabs discards them. Save each tab before moving to the next.

**Q: It says "Somebody else changed these settings while this screen was open."**
A: Someone saved a settings tab after you opened the page, possibly you in another browser tab. Note what you changed, reload, and make the change again.

**Q: If I shorten how long identity documents are kept, what happens?**
A: Every identity document on file is re-dated. Any that are now past their date stop being viewable immediately and are deleted that night. Deleted files cannot be recovered, so be sure first.

**Q: How do I stop the gym being shown on the website without changing the day pass?**
A: If the gym is not in the pass, it is never shown as included. To hide a facility's front-page card while still admitting it on the pass, use Website settings → Photos → **Show on the front page**, not the tick here.

**Q: How many day-pass visitors can we take?**
A: Only as many as the smallest capacity entered among the ticked facilities. Day passes are only sold online, and the website stops selling for that date once it fills up. With every capacity blank there is no limit. No capacity has been agreed yet. Ask Jefferson/Jason.

**Q: Does "Early check-in, per hour" do anything?**
A: Not at the moment. No booking screen offers or charges early check-in, so changing it has no effect on any price today.

## Terms

- **Unit**: one apartment or semi-detached house that can be booked, known by its reference.
- **Reference (unit)**: the unit's name as staff call the door, for example 3B-04. Set in the Unit registry.
- **Unit type**: 2-bedroom, 3-bedroom, 4-bedroom or Semi-detached. It carries the nightly rate, maximum guests and car parks.
- **Units board**: the **Units** screen showing every unit's status today.
- **Available**: nothing covers the unit today and no turnover is in progress.
- **Held**: a booking that is not yet confirmed (held, awaiting payment or draft) covers the unit today.
- **Booked**: a confirmed booking covers the unit today and the guest is not checked in yet.
- **Occupied**: a guest is checked in to the unit.
- **Awaiting inspection**: the last guest has checked out and no inspection has been recorded.
- **Cleaning**: the unit has been inspected but not marked ready.
- **Leased**: a long-term tenant has the unit today.
- **Out of service**: taken out of use by staff with a reason. It cannot be booked.
- **Turnover**: the work between one guest leaving and the unit being ready: inspection, then Mark ready.
- **Mark ready**: the one-time statement that a unit is clean after a stay. It is shown on screen only and cannot be undone.
- **Lease**: a long-term let recorded against a unit (tenant name, start date, optional end date) that blocks bookings. No rent is recorded.
- **Open-ended lease**: a lease with no end date. It blocks the unit until someone ends it.
- **Unit note**: the standing note in **About this unit**, a fact about the unit itself.
- **Unit registry**: the Admin screen for naming units and setting how many of each type exist.
- **Name pattern / Numbered / Ending pattern**: the parts the registry uses to generate unit names.
- **Property settings**: the Admin screen with the Rates, Extras, Day pass, Documents and Bank accounts tabs.
- **Extra**: an optional item a stay can add, charged once per stay (for example Sofa bed).
- **Stock (extra)**: how many of an extra the property has. Blank means not counted and not limited.
- **Age band**: a day-pass price for an age range.
- **Family bundle**: a fixed price for a set headcount per age band on a day pass.
- **Day-pass capacity**: the most day-pass visitors a facility can take in a day. The smallest among included facilities limits online sales.
- **Retention period**: how many months a kind of document is kept before it is deleted.
- **Serviceable unit**: a unit that is not out of service. Only types with at least one are advertised on the public site.

---

# 9. Staff access and administration

## What this area is for

This area covers how staff get into the system and what each person is allowed to do once they are in. It also covers the Admin screens that look after the people and the public website, not the bookings.

- **Signing in and passwords.** Staff sign in at **portal.bruneiapartment.com**. There is a **Forgot password?** link, and an Admin can reset anyone's password at any time.
- **Settings** (sidebar → Others → **Settings**). Every member of staff has this page for their own account: the name they go by, their password, signing out other devices, and a read-only list of what they have access to.
- **Roles & staff** (sidebar → Admin → **Roles & staff**). This is where accounts are created, disabled, deleted and given roles, and where each role's permissions are edited. It replaces "tell Jefferson to add someone".
- **Audit log** (sidebar → Admin → **Audit log**). One list of every recorded change across the business: who did it, when, to which record, and the reason if one was typed. Nobody can edit or delete it.
- **Website settings** (sidebar → Admin → **Website settings**). The public website's photos, its FAQs and its privacy policy. Changes go live without a developer.
- **The light/dark theme switch**, and **how the portal works on a phone**.

Who uses it: every member of staff signs in and has a Settings page. By default only **Admin** can open Roles & staff, the Audit log and Website settings. An Admin can give the three website permissions to other roles.

## Screens

### The sign-in screen

**Where:** portal.bruneiapartment.com/login. If you open any staff page (a bookmark to the Gate, for example) and you are not signed in, you are sent here automatically. After you sign in you are taken back to the page you were trying to open. The public website's footer also has small **Staff: Portal · Field** links that lead here.

**What is on it:** the Palm Villa brand block, a card headed **Sign in** with the line "Staff accounts are created by an administrator.", then two fields:
- **Email**
- **Password**. It has an eye button (**Show password** / **Hide password**) so you can check what you typed.

The **Forgot password?** link sits on the Password label's row. Below them is the **Sign in** button, which reads **Signing in…** while it works. Under the card: "Locked out? Ask an administrator to reset your password."

**Forgot password?** is a working link when the system can send email. The live site has been able to send email since 15 September 2026. If email sending were ever switched off, the words would still show but greyed out, and hovering over them would say "Not available — ask an administrator to reset it".

Nobody can create their own account. There is no "Sign up".

### The password reset screens

There are four screens, all in the same style as the sign-in card:
1. **Reset your password**: you type your email and press **Send reset link** (it reads **Sending…** while working).
2. **Check your email**: the confirmation that a link is on its way.
3. **Set a new password**: where the emailed link lands. You press **Continue** (reads **Checking the link…**).
4. **Choose a new password**: you type the new password twice and press **Save password** (reads **Saving…**). Then comes **Password changed** with a **Continue to the portal** button.

Each task below explains them step by step.

### Settings (your own account)

**Who can open it:** everyone who is signed in. No permission is needed, and nothing on it can change another person's account.

**Where:** sidebar → Others → **Settings**. It is also in the account menu at the foot of the sidebar: click your name, then **Settings**. The address is portal.bruneiapartment.com/account.

**What is on it** (two columns on a wide screen, one column on a phone):
- **Profile**
  - **Name**: the name you go by in the sidebar, on the staff list, and next to everything you have done in the history and audit log. There is a **Save name** button.
  - **Email**: shown but not changeable, with the line "You sign in with this, so it can't be changed here."
- **Password**. The section starts with the line "If an administrator set your password for you, replace it with one only you know. You stay signed in here; every other device is signed out." Below that:
  - **New password**, with the hint "At least 8 characters"
  - **Repeat it**
  - the **Change password** button
- **Signed-in devices**. The section starts with the line "Still signed in on the front desk computer, or on a phone you no longer have? This signs you out of every device except this one." Below that is the **Sign out other devices** button.
- **Your access** (read-only):
  - **Roles**: badges for the roles you hold. If you hold none: "You don't hold a role yet, so there is little in the portal you can open."
  - Your permissions, listed under the same group headings and in the same words that the Roles & staff screen uses: Bookings, Payments & charges, Deposits & inspections, Property, Website, Administration.
  - A closing line. If you are an Admin it reads "Roles are given and changed in Roles & staff" (with a link). Everyone else sees "Roles are given by an administrator. If something you need for your job is missing, ask them."

There are no notification preferences. The system sends staff no emails other than a password reset link.

### Roles & staff

**Who can open it:** by default, Admin only. It needs the permission **Edit settings, roles & the unit registry**. Anyone without it sees "You don't have access to this screen" and the message: "Managing staff and roles needs the "Edit settings & roles" permission. Ask an administrator if this is part of your job." (The message says "Edit settings & roles", but the permission's name in the matrix is **Edit settings, roles & the unit registry**. They are the same permission.)

**Where:** sidebar → Admin → **Roles & staff**.

**What is on it:** the heading reads "Staff accounts and what each role may do. One person can hold several roles." Below it is a row with two tabs, **Staff** and **Roles**. On the right of that row is **Download CSV**, a menu with two choices: **Staff** (name, email, whether disabled, roles) and **Roles** (each role's permissions). While the Staff tab is open there is also a **New staff account** button.

**Staff tab.** A table of every account, in alphabetical order by name, 10 to a page by default (you can choose 10, 25 or 50 under **Rows per page**). The columns:
- **Name**: a coloured initials circle and the name. Your own row says **you** after the name.
- **Email**
- **Roles**: a badge for each role held, or "No roles".
- **Status**: **Active** (green) or **Disabled** (red).
- A **⋯** button at the end of each row, which opens a menu:
  - **Manage roles**
  - **Reset password**
  - **Disable account**, or **Enable account** if the account is already disabled
  - **Delete account**

  On your own row, **Disable account** and **Delete account** are greyed out.

If there are no accounts at all, the tab says "No staff accounts yet — Create the first account and hand over its temporary password."

**Roles tab.** A matrix: permissions down the side, grouped under Bookings, Payments & charges, Deposits & inspections, Property, Website and Administration. The five roles run across the top: Admin, Finance, Front Office, Housekeeping and Security, in alphabetical order. Under each role name is how many people hold it ("1 person", "3 people"). The count includes disabled accounts that still hold the role.

Each cell is a tick box. One cell is a padlock instead: **Admin × Edit settings, roles & the unit registry**. Hovering over it says "Admin always keeps this — without it, nobody could undo a change here."

Above the matrix a line reads "24 permissions across 5 roles." When you have unsaved ticks it changes to "Unsaved changes to Front Office and Finance" (or whichever roles you changed). There is one Save button for the whole matrix. It is greyed out until something changes. If several roles changed it reads **Save 2 roles** (or however many). It reads **Saving…** while working.

You cannot create, rename or delete a role on this screen. The five roles are fixed. You can only change what each one allows.

### Audit log

**Who can open it:** by default, Admin only. It needs **Edit settings, roles & the unit registry**. Anyone without it sees "You don't have access to this screen" and the message: "Reading the audit log needs the "Edit settings, roles & the unit registry" permission. Ask an administrator if this is part of your job." Finance does not have this permission, so Finance cannot read the audit log. This is not settled yet; ask Jefferson/Jason.

**Where:** sidebar → Admin → **Audit log**.

**What is on it:** the heading reads "Every change to bookings, payments, deposits, charges, units, staff and settings — who did it, and when. Nothing here can be edited or deleted."

Along the top is a filter row:
- **Search box** (the placeholder reads "Booking, unit or record")
- **What**: kinds of change
- **Record**: kinds of record
- **Who**
- **When**: a date range
- **Clear**, which appears once any filter is on
- **Download CSV** at the right-hand end

The table is newest first, 25 rows per page by default (50 or 100 available). Its columns are:
- **When**: date and time, for example "12 Sept 2026, 14:32".
- **Who**: the staff member, with their coloured initials. Something nobody did by hand (for example a password reset email going out, or a document deleted when its retention period ended) shows **System** with a grey "PV" circle. If an account can no longer be found on the staff list, the name shows as "A former staff member".
- **What**: a plain sentence, for example "Checked in", "Security deposit collected — BND 100.00, in cash", "Nightly rate changed — BND 100.00 → BND 120.00", "Password reset". See *Reading an audit row* below.
- **Record**: what the change was about (a booking reference, a unit, a role, a facility, a staff member's name and so on), with the kind of record in small grey text under it. The name is a link where there is somewhere to go (the booking, the deposit, the unit, the right settings tab, Roles & staff). It is not a link if the record has since been deleted. The ⓘ next to the heading explains what the search box matches.
- **Reason**: the words someone typed when the action required a reason (cancelling, discounting, waiving or charging a deposit, taking a unit out of service, accepting a payment for the wrong amount). It is shown in quotation marks. A reason longer than a line is cut short with a **Show more** / **Show less** link under it. Most rows show "—", because most actions never ask for a reason. The ⓘ next to the heading explains this.

When the table is empty, it shows one of these:
- "Nothing has been recorded yet." when no filter is on.
- "No events match these filters." when filters are on.
- When a search found nothing: "Nothing recorded against "…". Search matches the Record column — a booking reference, a unit, a role, one of the property's bank accounts — not guest or staff names."

### Website settings

**Who can open it:** anyone holding at least one of **Manage website photos**, **Manage website FAQs** or **Write and publish the privacy policy**. By default that is Admin only. Each tab appears only to people who hold that tab's permission, and the screen opens on the first tab you are allowed to see. Anyone with none of the three sees "You don't have access to this screen" and the message: "Changing the website needs one of the "Manage website photos", "Manage website FAQs" or "Write and publish the privacy policy" permissions. Ask an administrator if this is part of your job."

**Where:** sidebar → Admin → **Website settings**.

**What is on it:** the heading reads "What the public website shows and says: its photographs, its questions and answers, its privacy policy, and what guests are told about food. Every change is recorded." Below it are four tabs: **Photos**, **FAQs**, **Privacy policy** and **Food**. The **Food** tab comes with **Manage website photos** — it has no permission of its own. Each tab has its own buttons on the right of the tab row.

Each tab has a **Download CSV** button, but only people who also hold **Edit settings, roles & the unit registry** (Admin) see it.

**Photos tab.** The line at the top reads "The photographs on the public website, in the order the front page shows them. A change is live as soon as it is saved." The button on the right is **View the website**, which opens the public site in a new tab. There are four sections, in the order the front page shows them:
- **Front page**: one photo, the big one beside the headline at the top of the front page. Landscape (4:3).
- **Day pass**: one photo for each facility card in the front page's day-pass section. There is one card for every facility ticked as included in the day pass in Property settings. Landscape (4:3). Each card also has a **Show on the front page** tick box.
- **Short stays**: one photo for each apartment type in the stays section. Landscape (4:3).
- **Follow along**: **Tile 1** to **Tile 4**, the four square tiles above the Instagram and TikTok links, in order. Square.

Each place shows either:
- **the current photo**, cropped exactly as the website crops it, with its description, "Added [date] by [name]", and **Replace**, **Edit** and **Remove** buttons; or
- **an empty grey panel** reading "No photo yet — the website shows a placeholder" (or just "No photo yet" when the facility card is switched off), with an **Add photo** button.

A facility card switched off with **Show on the front page** appears faded.

These photos appear only on the front page of the public site.

**FAQs tab.** The line at the top reads "The questions and answers on the public website. A change is live as soon as it is saved." The buttons on the right are **View the FAQs page** (opens the public FAQs page in a new tab) and **New FAQ**. Then:
- **On the front page**: a numbered list of the FAQs the front page shows, with "X of 6" on the right. If none are chosen: "None yet, so the front page leaves its FAQs section out. Tick "Front page" on a FAQ below to show it there."
- One section per topic, in this fixed order: **Day passes**, **Staying with us**, **Paying**, **Changing, cancelling and arriving**, **Anything else**. Each FAQ row shows the question in bold and the first two lines of the answer, with the live figures already filled in. Each row has:
  - a **Front page** tick box
  - up (↑) and down (↓) arrows
  - **Edit**
  - **Remove**

  An empty topic says "Nothing under this topic, so the FAQs page leaves it out."

**Privacy policy tab.** The line at the top reads "What the public website tells guests about their personal data. Nothing on the website changes until you publish." Once a policy has been published, a **View the privacy policy page** button appears on the right. Then:
- **On the website**, a status sentence. It is one of:
  - "Not published. The Privacy policy link at the foot of the website does nothing until you publish one."
  - "Published [date and time] by [name]. The website shows the policy below."
  - "Published [date and time] by [name]. Your saved draft below has changes the website does not show yet."
- **The policy**: the editor.
  - A **Start from template** button in the section's corner.
  - A formatting bar: **Heading**, **Bold (Ctrl+B)**, **Bullet list**, **Numbered list**, **Undo (Ctrl+Z)**, **Redo (Ctrl+Y)**.
  - The text area, with the hint "Paste from Word or Google Docs and its headings, lists and bold come with it; other formatting is left behind."
  - A status line: "Unsaved changes", "This is what the website shows", or "Draft saved — not on the website yet".
  - The buttons **Discard changes** (only when there are unsaved changes), **Save draft** and **Publish**.
- **Published versions**: every version the website has shown, newest first, with the date and time and "Published by [name]". The newest one is marked "On the website now". This list does not show each version's wording. The wording is in the Download CSV (Admin only).

**Food tab.** There is no restaurant at Palm Villa; an outside food provider leaves a menu at the poolside tables and delivers. This tab is where you change what guests are told about that — for example when the provider, their number or their delivery terms change. The line at the top reads "What a confirmed guest is told about food, on their booking page, in their confirmation email and on the food page. A change is live as soon as it is saved." While there is a notice, the button on the right is **View the food page**, which opens the public food page in a new tab. Two sections:
- **Notice**:
  - **What guests are told** — the text. Each line becomes its own paragraph. It starts as: "Please note that there is no restaurant at Palm Villa. However, a food menu is available at the poolside tables for your convenience." / "To place an order, contact the food provider directly." / "FREE DELIVERY is available for orders of BND 20 and above." (each in quotes is a line). Up to 600 characters.
  - **Food provider's number** — shown under the text as a number guests can tap to call. It starts as **+673 333 5410**. Digits, spaces, brackets, dashes and a leading + only. Optional.
  - **Save**. The message is "Food notice saved", "Nothing had changed", or — if you emptied the text — "Food notice taken off the website".
  - **To stop telling guests about food** (for example, the provider has stopped), empty **What guests are told** and clear the number, then Save. The Food card, the email's Food section and the food page all disappear at once. A number with no text is refused: "Write the text the number goes with, or clear the number too."
  - If someone else saved the notice while you had the tab open, saving says "Somebody else saved the food notice while you had it open. Copy anything you want to keep, then reload the page to see their version."
- **Menu flyer**: the provider's menu picture, the **Food menu** place. It works exactly like a place on the Photos tab — **Add photo**, then **Replace**, **Edit** (description only) and **Remove** — except it is shown whole, never cropped, and it has no "which part stays in view" choice. Upload the provider's flyer as a photo (JPEG, PNG or WebP). If there is no flyer, guests get the text and the number but no "See the food menu" link.

Every change on this tab is in the audit log: "Food notice changed", "Food provider number changed", "Food notice and number changed", "Food notice put on the website", "Food notice taken off the website", and for the flyer the usual "Photo added / replaced / removed" against **Food menu**.

### The portal on a phone or small screen

When the screen is narrower than a laptop (below about 1024 pixels wide), the sidebar is hidden. A **menu button** (three lines, labelled "Open navigation") appears at the top left of the page header, beside the page's breadcrumb. Tapping it slides the full sidebar in from the left: every group and screen, the Others group with **Settings**, **Public site** and **Field screens**, and your name and account menu at the bottom. Tapping any link closes the drawer and opens that screen. To close it without going anywhere, tap outside it.

The page header keeps its right-hand tools on a phone: search, the notifications bell and the light/dark switch.

## Where each person lands after signing in

The system decides where to send you from your permissions, not from your role names. If you were sent to sign in from a particular page (a bookmark, or a link such as a scanned entry code), you go back to that page. Otherwise:

| You hold (by default) | You land on |
|---|---|
| **Admin**, **Front Office** or **Finance** | the portal **Dashboard** |
| **Security** only | the **Gate** field screen, directly |
| **Housekeeping** only | the **Departures** field screen, directly |
| **Security and Housekeeping** together | the **Field screens** chooser, with a card for **Gate** and one for **Departures** |
| No roles at all | the portal Dashboard, which says "You don't have access to this screen — Seeing today's arrivals and departures needs the "View bookings" permission. Ask an administrator if this is part of your job." |

The exact rule: you go to the field screens when every permission you hold is one the field screens use (View bookings, Check guests in, Check guests out, Admit day passes, Record inspections, Record cash payments, Manage units) **and** at least one field screen is yours:
- the **Gate** belongs to anyone with **Check guests in** or **Admit day passes**
- **Departures** belongs to anyone with **Record inspections**

With one field screen you go straight to it. With two you get the chooser. Holding anything beyond that list (creating bookings, verifying payments, reports, settings) means your work is in the portal, so you land on the Dashboard. The Dashboard sidebar's **Field screens** link, under Others, takes you to the field screens.

Where people land from other routes:
- **Opening the sign-in page while already signed in** sends you to the page in the link, or else to the **Dashboard**.
- **Opening portal.bruneiapartment.com with nothing after it** sends you to the Dashboard.
- **The Continue to the portal button** after a password reset also goes to the Dashboard.

The Dashboard applies the same rule again: somebody whose whole job is in the field (a guard or housekeeper on the default roles) is sent straight on from the Dashboard to their field screen (or to the chooser if they have two). So a guard never stays on the Dashboard. If he does see the Dashboard, his roles include something beyond the field screens; he can tap **Field screens** (sidebar → Others), or open portal.bruneiapartment.com/field. Guards and housekeepers should still bookmark the Gate or Departures screen itself, as it saves a step on a weak signal.

**On the field screens**, the header shows "Palm Villa · Field" and a **Sign out** button. People whose day is in the portal (Admin, Front Office, Finance) also see a **Portal** button. A guard or housekeeper whose only work is in the field is not given a Portal button. See *Field screens* for the screens themselves.

**The sidebar is the same for everyone.** Every staff member sees every sidebar item. Opening a screen you are not allowed to use shows a "You don't have access to this screen" card that names the permission it needs. Nothing on it is shown and nothing can be changed. The portal search only offers screens you can open.

## How to …

### Sign in

**Who can do this:** anyone with a staff account that is not disabled.
**Where:** portal.bruneiapartment.com (or any staff page, which sends you to sign-in).
**Steps:**
1. Type your **Email** and **Password**. Use the eye button to check what you typed.
2. Press **Sign in**.

**What happens next:** you land where your work is (see *Where each person lands after signing in*). You stay signed in on that device and browser until one of these happens:
- you sign out
- you change your password on another device
- an Admin resets your password
- your account is disabled
- someone uses **Sign out other devices** on your account from another device
- the browser's data is cleared

There is no automatic sign-out for being idle and no daily time limit. This is deliberate, so a gate phone stays signed in between shifts. **On a shared computer, always sign out when you finish.**

**Edge cases and limits:**
- The password is case-sensitive.
- There is no lock on your account after several wrong passwords. The sign-in service does limit how many attempts can come from one network in a short time. When that limit trips, the screen still just says "Email or password is incorrect." Wait a few minutes and try again.
- A disabled account gets the same "Email or password is incorrect." message, on purpose. If a password you know is right is refused, ask an Admin to check whether your account is **Disabled** on Roles & staff.
- A password set before the 8-character minimum was introduced still works for signing in. The rule applies the next time it is changed.

**If you see an error:**
- "Enter your email address." means the email box is empty or not an email address. Type it in full.
- "Enter your password." means the password box is empty.
- "Email or password is incorrect." means one of them is wrong, the account is disabled, or too many attempts came from your network. Retype carefully. If it still fails, use **Forgot password?** or ask an Admin to reset your password (and check the account is not disabled). The message never says which of these it is, so nobody can use it to find out which emails have accounts.

**Undo:** not applicable. To leave, use **Sign out**: the account menu at the foot of the sidebar (click your name → **Sign out**), or the **Sign out** button in the field screens' header. Either takes you back to the sign-in screen.

### Reset a forgotten password yourself (by email)

**Who can do this:** anyone with a staff account that is not disabled and an inbox they can open.
**Where:** sign-in screen → **Forgot password?**
**Steps:**
1. On **Reset your password**, type the email you sign in with and press **Send reset link**.
2. The screen changes to **Check your email**: "If [your address] belongs to a staff account, a link to choose a new password is on its way." It adds: "It works once, for an hour, and only the newest link works — asking again cancels this one." and "Nothing after a few minutes? Check your spam folder, or ask an administrator to reset your password."
3. Open the email. It comes from noreply@bruneiapartment.com with the subject "Choose a new password for Palm Villa Operations". It names the staff account it is for. Press **Choose a new password** in the email.
4. The link opens **Set a new password** ("Continue to choose a new password for your staff account. The link works once."). Press **Continue**. Nothing is used up until you press it, so an email scanner opening the link does not spoil it.
5. On **Choose a new password**, check the **Account** line shows *your* email. It says "Not your email address? Stop here and tell an administrator."
6. Type the new password in **New password** and again in **Repeat it**, then press **Save password**.
7. **Password changed** appears: "You're signed in. Use the new password next time — every other device has been signed out." Press **Continue to the portal**.

**What happens next:**
- You are signed in on this device, and every other device signed in to your account is signed out.
- The audit log records "Password reset email sent" (by System) and then "Password changed" (by you), both against your staff account.
- If the email could not be sent, the audit log records "Password reset email could not be sent — [reason]" against your account instead.

**Edge cases and limits:**
- The screen says the same thing whether or not the email belongs to an account. The system never reveals who works here.
- No email is sent when:
  - the address has no account
  - the account is disabled
  - three reset emails have already gone to that address in the last hour

  In every one of these cases the screen still says "Check your email". If nothing arrives, ask an Admin.
- A link works **once**, for **one hour**. Asking for a new link cancels the older one, so always use the newest email.
- Pressing **Continue** signs you in even before you choose the new password. If you stop there, your old password still works. Opening the choose-a-password page when you are not signed in sends you back to **Reset your password**.
- **Continue to the portal** goes to the Dashboard, which sends a guard or housekeeper whose whole job is in the field straight on to their field screen.
- The same device or network can ask for at most five links an hour.

**If you see an error:**
- "Enter the email you sign in with." means the box is empty or not an email address.
- "That is a lot of requests from this device. Wait a while and try again, or ask an administrator to reset your password." means more than five requests came from this device or network in an hour. Wait an hour, or ask an Admin.
- "This link has expired or has already been used. Ask for a new one — only the newest link works." appears when the link:
  - is older than an hour
  - was already used
  - was replaced by a newer link
  - belongs to an account that has since been disabled

  Press **Ask for a new link**.
- **This link is incomplete**, "Open the link from the email again — all of it — or ask for a new one." means the address was cut short (often when copied by hand). Tap the button in the email itself, or ask for a new link.
- "Password reset by email isn't available. Ask an administrator — they can set you a new one straight away." means email sending is switched off on this system. Ask an Admin to reset it.
- On the new password: "Use at least 8 characters.", "The passwords do not match.", or "New password should be different from the old password." Fix the field and press **Save password** again.

**Undo:** you cannot undo a password change. Set another one on **Settings**, or ask an Admin.

### Change your own password (including replacing a temporary one)

**Who can do this:** everyone, for their own account only.
**Where:** **Settings** (sidebar → Others → Settings, or click your name at the foot of the sidebar → **Settings**). Field-screen staff have no Settings link on the field screens, so open portal.bruneiapartment.com/account in the browser.
**Steps:**
1. In **Password**, type the new password in **New password** and again in **Repeat it**.
2. Press **Change password**.

**What happens next:**
- A green note reads "Password changed — Use it next time you sign in. Your other devices have been signed out."
- You stay signed in on this device. Every other device signed in to your account is signed out at once.
- The audit log records "Password changed" against your account, by you. This is how an Admin can see that the temporary password they handed out has been replaced.

**Edge cases and limits:**
- You are **not** asked for your current password. Being signed in is enough.
- The minimum is 8 characters.
- The system does **not** force you to change a temporary password. It is strongly advised: the Admin who created your account says so when they hand it over.

**If you see an error:**
- "Use at least 8 characters." means the new password is too short.
- "The passwords do not match." means the two boxes differ. Retype the second one.
- "New password should be different from the old password." means you typed your current password. Choose a different one.
- Any other sentence here comes straight from the sign-in service. Read it, fix the password, and try again.

**Undo:** not possible. Change it again, or ask an Admin to reset it.

### Change the name you go by

**Who can do this:** everyone, for their own account only. An Admin **cannot** rename someone else. Ask the person to do it on their own Settings.
**Where:** **Settings** → **Profile**.
**Steps:**
1. Edit **Name**.
2. Press **Save name**. It stays greyed out until the name is different.

**What happens next:**
- A green note reads "Name saved — Everything you have done in the portal now shows under it."
- The new name shows at once in the sidebar, on the staff list, and against every past and future entry in the histories and the audit log. Those always show a person's *current* name.
- The audit log records "Name changed from [old] to [new]", so earlier entries can still be matched to the old name.

**Edge cases and limits:**
- Up to 120 characters.
- Saving the same name records nothing.
- If the account was created without a name, it goes by its email until one is saved.
- Your **email** cannot be changed here or anywhere else in the app. See *Likely questions*.

**If you see an error:**
- "Enter your name." means the box is empty.
- "Keep it under 120 characters." means the name is too long.

**Undo:** type the old name back and save. That is recorded as a second change.

### Sign out of every other device

**Who can do this:** everyone, for their own account.
**Where:** **Settings** → **Signed-in devices** → **Sign out other devices**.
**Steps:** press the button. There is no confirmation step.
**What happens next:**
- A green note reads "Signed out everywhere else — This is the only device still signed in to your account."
- Every other phone or computer signed in as you is signed out and must sign in again.
- Nothing is written to the audit log.

**Edge cases and limits:** this does not change your password. If someone knows your password, change it as well. Changing your password also signs out every other device.

**If you see an error:** "Your other devices could not be signed out. Try again in a moment." Press the button again after a moment.

**Undo:** not possible. The other devices must sign in again.

### See what you have access to

**Who can do this:** everyone.
**Where:** **Settings** → **Your access**.
**Steps:** read the list. Your roles are the badges. The permissions below them are everything your roles allow together, grouped as they are on the Roles matrix.
**What happens next:** nothing. The list is read-only. If something you need is missing, ask an Admin.

### Add a new staff member

**Who can do this:** Admin by default (it needs **Edit settings, roles & the unit registry**; an Admin can change who holds that).
**Where:** Roles & staff → **Staff** tab → **New staff account**.
**Steps:**
1. Enter their **Name** (as it should appear to everyone) and their **Email**. The email becomes their sign-in and cannot be changed later.
2. Set a **Temporary password**. Press **Generate** for a random one. It comes as three groups of four lowercase letters and digits, for example "k7mp-2qxa-9hdt", which is easy to read out or type on a phone and has no look-alike characters. You can also type your own of at least 8 characters. The field hides the password. Use its eye button to see it.
3. Tick the **Roles** they should hold. You can tick several, or none for now.
4. Press **Create account** (it reads **Creating…** while working).
5. The dialog changes to "Account created. Send them the temporary password now — it is not shown again after this." The password is hidden. Use the eye button to show it, or press **Copy** (it changes to **Copied**) to paste it straight into WhatsApp.
6. Press **Done**.

**What happens next:**
- The account can sign in straight away. No confirmation email is sent, and no email of any kind goes to the new person.
- The new row shows **Active** with its roles.
- The audit log records "Staff account created", and "Roles changed" if you ticked roles.
- Tell them to change the password on **Settings** after their first sign-in. The system does not force this.

**Edge cases and limits:**
- The temporary password is shown only in this dialog. Once you press **Done** or close it, nobody can see it again, and the audit log never records passwords. If it is lost, use **Reset password**.
- A person can hold several roles. They get everything each role allows, combined.
- An account with no roles can sign in but can open almost nothing: its Dashboard says "You don't have access to this screen".
- The name can be up to 120 characters.

**If you see an error:**
- "Enter their name." means the Name box is empty.
- "Enter a valid email address." means the email is mistyped.
- "Use at least 8 characters." means the temporary password is too short.
- "An account with this email already exists." means someone already has that email. Look for them in the Staff list: they may be **Disabled**, in which case use **Enable account** rather than a new account.
- "This page didn't load — Something went wrong on our side…" (with **Try again**) means something unexpected failed. Check the Staff list before trying again: the account may already have been created.

**Undo:**
- If they have not done anything yet, you can **Delete account**.
- Once they have done anything that gets recorded (even changing their own password or name), you can only **Disable account**.

### Give someone roles, or change their roles

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** Roles & staff → **Staff** tab → **⋯** on their row → **Manage roles**.
**Steps:**
1. The dialog **Roles — [name]** says "Their permissions are everything the ticked roles allow, combined."
2. Tick and untick roles.
3. Press **Save roles**. It stays greyed out until something changes.

**What happens next:**
- A green note reads "Roles updated — [name]" and their badges change.
- The audit log records "Roles changed" against their account. The screen shows only that roles changed, not which. The before and after are in the audit log's Download CSV.
- **The change takes effect on their next page load or button press.** They do not need to sign out. There are two exceptions:
  - Where they land after signing in is decided only when they next sign in.
  - A screen already open on their device keeps showing what it showed until it reloads. If their access was removed, their next attempt to save something on that screen can fail with "This page didn't load". Reloading shows the "You don't have access" card.

**Edge cases and limits:**
- You cannot remove your own admin access. If the roles you tick for **yourself** would leave you without **Edit settings, roles & the unit registry**, the save is refused. Another Admin can change your roles.
- You *can* remove Admin from another Admin. Make sure at least one person keeps it.

**If you see an error:**
- "You can't remove your own admin access — ask another admin to change your roles." means you tried to drop your own Admin. Ask another Admin.
- "Check the selected roles and try again." means the form was not read properly. Close the dialog, reload, and try again.

**Undo:** open **Manage roles** again and put the ticks back. That is recorded as another change.

### Change what a role is allowed to do

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** Roles & staff → **Roles** tab.
**Steps:**
1. Find the permission row (see *Every permission, explained* below) and the role column.
2. Tick or untick the box. You can change several roles at once. The line above the matrix names every role with unsaved changes.
3. Press **Save** (or **Save 2 roles**, and so on).

**What happens next:**
- A green note reads "Permissions saved" (or "2 roles saved") — "Everyone holding [roles] has them from their next action."
- Everyone holding that role gains or loses the permission on their next page load or button press. Nobody needs to sign out.
- Each role saved records its own "Role permissions changed" line in the audit log. Which permissions changed is in the audit log's Download CSV.

**Edge cases and limits:**
- **Admin always keeps Edit settings, roles & the unit registry.** That cell is a padlock and cannot be unticked, so there is always someone who can undo a change here.
- Each role is saved separately. If one fails, the others that already saved stay saved. The ones that failed are listed in a red box, and their ticks stay unsaved so you can try again.
- If you leave the page with unsaved ticks, they are lost without a warning.
- Changing a role changes it for **everyone** who holds it. The small "N people" under the role name tells you how many. To change one person only, change their roles instead.
- There are only five roles. New roles cannot be added from the screen.

**If you see an error:**
- In the red box, "[Role]: The Admin role always keeps "Edit settings & roles" — without it, nobody could undo this." means someone tried to remove it from Admin (normally the padlock prevents this).
- "[Role]: That role no longer exists." Reload the page.
- "[Role]: Check the selected permissions and try again." Reload the page and redo the ticks.

**Undo:** tick or untick back and save again.

### Reset another staff member's password

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** Roles & staff → **Staff** tab → **⋯** on their row → **Reset password**.
**Steps:**
1. The dialog **Reset password — [name]** says "Set a new temporary password and share it out-of-band. Their current password stops working immediately."
2. Press **Generate** (or type one of at least 8 characters) in **Temporary password**.
3. Press **Reset password** (it reads **Resetting…**).
4. "Password reset. Send them the new temporary password now." appears. Use the eye button or **Copy**, then press **Done**.

**What happens next:**
- Their old password stops working at once, and they are signed out on every device.
- The audit log records "Password reset" against their account, by you. The password itself is never recorded.
- When they change it themselves on Settings, a "Password changed" line follows.

**Edge cases and limits:**
- You can reset any account's password, including your own and a disabled one. A disabled account still cannot sign in until it is enabled.
- The new temporary password is shown only in this dialog.
- The system does not force them to change it. Remind them.

**If you see an error:** "Use at least 8 characters." Make the password longer.

**Undo:** not possible. Reset again if needed.

### Disable an account (someone leaves, or a phone is lost)

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** Roles & staff → **Staff** tab → **⋯** → **Disable account**.
**Steps:**
1. The dialog **Disable — [name]** says "They will not be able to sign in until the account is enabled again. Nothing is deleted — their history stays in the audit trail."
2. Press **Disable account** (red; it reads **Disabling…**).

**What happens next:**
- A green note reads "Account disabled — [name]" and the row's status becomes **Disabled**.
- They cannot sign in. They see "Email or password is incorrect.", and no reset email will be sent to them.
- The audit log records "Staff account disabled".
- Their name stays on everything they did.
- Their roles are kept, so enabling the account later restores their access unchanged.

**Edge cases and limits:**
- A person who is already signed in when you disable them is checked again the next time they open a page or save anything, and that check refuses a disabled account. A screen already open on their device keeps showing what it showed until they do something. Changing their password with **Reset password** does not by itself sign out a device that is already signed in, so disabling is the step that cuts someone off.
- You cannot disable your own account. The menu item is greyed out.

**If you see an error:** "You can't disable your own account." Ask another Admin. "Something went wrong. Reload and try again." Reload the page.

**Undo:** **⋯** → **Enable account**. The dialog **Enable — [name]** says "They will be able to sign in again with their existing password." Press **Enable account**. The note reads "Account enabled", and the audit log records "Staff account re-enabled".

### Delete an account (only one that was never used)

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** Roles & staff → **Staff** tab → **⋯** → **Delete account**.
**Steps:**
1. The dialog **Delete — [name]** says "Only an account that has never acted can be deleted — one with history must be disabled instead, so the audit trail stays whole. This cannot be undone."
2. Press **Delete account** (red; it reads **Deleting…**).

**What happens next:**
- A green note reads "Account deleted — [email]" and the row disappears.
- The audit log records "Staff account deleted". The row shows the deleted account's email and is not a link.

**Edge cases and limits:**
- **Why an account that has acted cannot be deleted:** every recorded action names who did it, and the audit trail must always be able to say who that was. So any account with even one entry in the audit log as the person who acted is protected, for ever. This includes changing their own password or name. Deletion is only for mistakes, such as a typo in the email or a duplicate created by accident. For anyone who has worked, use **Disable account**.
- You cannot delete your own account. The menu item is greyed out.
- Deletion is permanent. To give the person access again, create a new account.

**If you see an error:**
- "This account has acted and cannot be deleted — disable it instead." means the account has history. Use **Disable account**.
- "You can't delete your own account." means you tried to delete yourself.
- "Something went wrong. Reload and try again." Reload the page.

**Undo:** not possible. Create the account again with **New staff account**.

### Read the audit log and find something in it

**Who can do this:** Admin by default (**Edit settings, roles & the unit registry**).
**Where:** sidebar → Admin → **Audit log**.
**Steps:**
1. Narrow the list with any mix of these filters. The list updates as you choose.
   - **Search box**: type a booking reference (e.g. PV-4821), a unit (e.g. 3B-04), a role, a facility, a day-pass age band or one of the property's bank accounts. It matches only the **Record** column. It does **not** find guest names or staff names. To look up a guest, use the bookings list. To see what a person did, use **Who**.
   - **What** (kind of change): tick one or more of:
     - Bookings, Payments, Deposits, Charges, Inspections, Documents, Emails, Units, Unit registry
     - Settings — rates, Settings — policy, Settings — day pass, Settings — bundles, Settings — facilities, Settings — retention, Settings — bank accounts, Settings — extras
     - Roles, Staff accounts, Cash banked, Website photos, Website FAQs, Privacy policy
   - **Record** (kind of record): tick one or more of:
     - Booking, Payment, Deposit, Charge, Inspection, Document, Unit, Unit type, Property
     - Retention period, Age band, Family bundle, Facility, Bank account, Role, Staff account
     - Banking, Website photo, Website FAQ, Booking extra, Privacy policy
   - **Who**: choose one staff member, or **The system** for things nobody did by hand. Choosing another person replaces the first.
   - **When**: pick a start and end day (Brunei days, both included), or a preset: Today, Yesterday, Last 7 days, Month to date, Last month, Year to date.
2. Press **Clear** to remove every filter.
3. Click a name in the **Record** column to open that booking, deposit, unit, cash-up day or settings tab.

**What happens next:** nothing changes. The log is read-only. Filters are part of the page address, so a filtered view can be bookmarked or sent to another Admin.

**Edge cases and limits:**
- **Download CSV** downloads the **whole** audit log, oldest first, whatever filters are on. It has these columns: When, Actor id, Action, Record type, Record id, Record, Before, After. The Before and After columns hold the full detail the screen leaves out, such as which permissions a role gained, an FAQ's old answer, or the text of a removed FAQ.
- Opening an **identity document** is recorded ("Identity document opened"), so the log shows who looked at a guest's IC and when.
- Saving a privacy-policy *draft* is not recorded. Only publishing is.
- Signing in and signing out are not recorded.
- Nothing in the log can be edited or deleted, by anyone.

**Undo:** not applicable.

### Reading an audit row

The **What** column is a short sentence. Common ones, by kind:

**Bookings:**
- Created — walk-in, paid on the spot / Created — walk-in, paying by transfer
- Booked online — short stay / Booked online — day pass (these have no staff name, because the customer did it; they show as System)
- Sent for verification, Booking confirmed, Checked in, Checked out, Admitted (a day pass let in at the gate or from the office), Cancelled, Marked no-show, Edited
- "Held" and "Hold expired" exist as wordings but nothing records them today: a new booking shows one of the Created / Booked online lines, and holds never expire.
- Note: "Created — walk-in, paid on the spot" also appears for a desk booking left for the guard to collect ("At the gate"), even though nothing was taken.
- Discount applied / Discount changed / Discount removed
- Party changed — 5 → 7 (how many people the booking is for, before → after)
- Extra guests reported at the gate — 2 more / Extra guests added at the gate — 2 more (the guard's **Extra** button on the Gate)
- Booking link issued — found by reference and phone
- Entry QR code replaced — the old code no longer opens this booking

**Payments:**
- Bank transfer awaited
- Cash recorded
- Payment verified
- Confirmed at an amount other than the total
- Matched to a booking by hand

**Deposits and charges:**
- Security deposit collected — BND 100.00, in cash
- Security deposit transfer awaited — BND 100.00
- Security deposit topped up — BND 50.00, in cash — BND 100.00 held of BND 100.00
- Deposit accepted at an amount other than the BND 100.00 quoted figure
- Security deposit waived
- Release approved — BND 70.00 returned / Release approved — BND 30.00 owed by the guest
- Amount owed settled — BND 30.00, in cash
- Security deposit kept — BND 100.00, booking cancelled (or "guest did not arrive")
- Security deposit returned — BND 100.00, booking cancelled
- Charge added — BND 30.00 / Charge waived — BND 30.00
- Inspection recorded — clean / Inspection recorded — issues found
- Cash banked — BND 450.00, taken on 2026-09-12

**Documents:**
- Identity document attached / opened / removed
- Transfer slip attached, Inspection photograph attached
- … deleted — retention period ended
- Accounting pack replaced by a newer pack

**Units:**
- Taken out of service, Returned to service
- Let long-term, Lease end date changed, Lease removed
- Note added / changed / cleared
- Marked ready after PV-4821
- Renamed from 3B-04 to 3B-05
- Added to the building, Removed from the building
- Unit registry updated — 2 renamed, 1 added

**Settings:**
- One field changed shows as "[field] changed — [old] → [new]", for example "Nightly rate changed — BND 100.00 → BND 120.00", "Check-in time changed — 14:00 → 15:00".
- Several fields changed show as "[thing] updated — N fields changed".
- Age band added/removed, Family bundle added/removed, Facility added/removed
- Card shown on the front page / Card hidden from the front page
- Bank account added/removed
- [Document kind] retention changed — 12 → 24 months
- Extras: "[name] added as an extra", "[name] removed", "[name] put back", "[name] put on / taken off the booking form", "Renamed to [name]"

**Staff:**
- Staff account created / disabled / re-enabled / deleted
- Roles changed, Role permissions changed
- Password reset (by an Admin), Password changed (by its owner)
- Name changed from A to B

**Emails:**
- Booking email sent, Confirmation email sent, Password reset email sent
- "[email] could not be sent — [reason]". The reasons:
  - the mail service could not be reached
  - did not answer in time
  - was rate-limiting us
  - was failing
  - refused it
  - no mail service is configured
  - too many emails to that address today

**Website:**
- Photo added / replaced / removed, Description changed, Keep in view changed — Centre → Top, Photo updated
- FAQ added / removed / edited, Question reworded, Answer changed, Moved to [topic], Moved up / Moved down, Put on the front page / Taken off the front page
- Privacy policy published for the first time / New version of the privacy policy published

### Add or replace a photo on the website

**Who can do this:** Admin by default. It needs **Manage website photos**, and an Admin can give that to any role with one tick.
**Where:** Website settings → **Photos** → the place → **Add photo** (empty place) or **Replace** (place with a photo).
**Steps:**
1. In the dialog (**Add a photo — [place]** or **Replace the [place] photo**), press the **Photo** field and choose a JPEG, PNG or WebP. The hint warns: "It will be public on the website, so don't choose one where a guest can be recognised without their permission."
2. Wait for "Preparing the photo…". Large photos are shrunk on your device before they are sent (to at most 2,400 pixels on the long side). Camera data such as where the photo was taken is removed.
3. A preview appears, cropped the way the website will show it. If the photo is small you see "This photo is quite small, so it may look soft on a large screen." (under 1,200 pixels on its long side).
4. Under **Keep in view**, click one of the nine squares (Top left … Centre … Bottom right) to choose the part of the photo that must stay visible when the site crops it. The preview re-crops as you choose. The default is Centre.
5. Write the **Description** (required, up to 200 characters, with a counter). It is what the photo shows, for someone who cannot see it, for example "The outdoor pool with sun loungers in the afternoon". **Never name a guest.** A replacement always starts with an empty description.
6. Press **Save photo**. It stays greyed out until there is a photo and a description. It reads **Saving…** while working. To back out, press **Cancel** or **Keep current photo**.

**What happens next:**
- A green note reads "Photo added" or "Photo replaced" — "[place] shows the new photo on the website." The public front page shows it at once.
- On a replacement, **the old photo's file is deleted permanently**.
- The card now shows "Added [date] by [you]".
- The audit log records "Photo added" or "Photo replaced".

**Edge cases and limits:**
- The original you choose can be up to 25 MB. After shrinking it must be under 4 MB.
- One photo per place. The places follow Property settings:
  - Adding an apartment type adds a Short stays place.
  - Ticking a facility into the day pass adds a Day pass place.
  - A facility taken out of the day pass drops out of the list.
  - A facility deleted in Property settings takes its photo with it.

  See *Units and property settings → Property settings*.
- A photo that is removed or replaced can still be reached for up to a day by anyone who kept its old web address. It no longer shows on the site.

**If you see an error:**
- "[file name] is larger than 25 MB. A photograph taken on a phone is usually well under it." Choose a smaller file.
- "That photo is still larger than 4 MB after resizing. Try a smaller one."
- "That photo could not be opened in this browser. Save it as a JPEG and choose it again."
- "That is not a JPEG, PNG or WebP photo. Choose a photograph."
- "That file is empty. Choose the photo again."
- "The photo did not arrive in one piece. Try uploading it again." (a poor connection). Try again.
- "That photo still carries camera data, such as where it was taken. Add it through the photo dialog, which removes it." You should not normally see this. Use the dialog as described.
- "Choose a photo."
- "Describe what the photo shows, for someone who cannot see it." or "Describe what the photo shows, in no more than 200 characters." or "Keep the description to 200 characters — one sentence is enough."
- "Choose which part of the photo to keep in view."
- "Someone changed this photo while you had it open. Close this and look again before saving." Another person changed this place at the same time. Close the dialog, look at what is there now, and start again.
- "That photo, or the place it belongs to, is no longer on the site." or "That place is not on the website." The facility or apartment type was removed. Reload.
- "That photo could not be saved." Try again.

**Undo:** there is no undo. The replaced file is gone, so to go back you must upload the old photo again.

### Change a photo's description or framing

**Who can do this:** holders of **Manage website photos** (Admin by default).
**Where:** Website settings → **Photos** → the place → **Edit**.
**Steps:**
1. In **Edit the [place] photo** ("Change how it is described and which part stays in view. The photo itself stays the same."), change **Keep in view** and/or **Description**.
2. Press **Save changes**. It is greyed out until something actually differs.

**What happens next:**
- A green note reads "Photo updated" and the website shows the change at once.
- The audit log records "Description changed", "Keep in view changed — [old] → [new]" or "Photo updated — 2 fields changed".

**Edge cases and limits:** the same description rules apply (required, up to 200 characters, never name a guest). Every description ever saved stays in the audit log. Something typed there cannot be taken back.

**If you see an error:** the description messages above; "That photo has already been taken off the site."; "That photo could not be saved."

**Undo:** edit again and put the old values back.

### Remove a photo from the website

**Who can do this:** holders of **Manage website photos** (Admin by default).
**Where:** Website settings → **Photos** → the place → **Remove**.
**Steps:**
1. The dialog asks "Take the [place] photo off the website?" and says "The website shows a grey placeholder in its place until a new photo is added. The file is deleted and cannot be recovered; the record that it was there stays in the audit log."
2. Press **Remove photo** (red), or **Keep photo** to back out.

**What happens next:**
- A green note reads "Photo removed". The website shows a grey placeholder there at once.
- The audit log records "Photo removed".

**If you see an error:** "That photo has already been taken off the site." (someone else removed it; reload); "That photo could not be removed."

**Undo:** not possible. Add the photo again.

### Show or hide a facility card on the front page

**Who can do this:** holders of **Manage website photos** (Admin by default).
**Where:** Website settings → **Photos** → **Day pass** section → the facility → **Show on the front page** tick box.
**Steps:** tick to show the card, untick to hide it. It saves the moment you click. There is no Save button.
**What happens next:**
- A green note reads "[facility] is on the front page" or "[facility] is off the front page".
- A hidden card appears faded here and disappears from the front page's day-pass section.
- The audit log records "Card shown on the front page" or "Card hidden from the front page".

**Edge cases and limits:**
- This hides only the front-page card. The day-pass booking page still lists every facility the pass includes, and what the pass admits does not change. That is set in Property settings → Day pass.
- Use it for a facility with no photo yet, or one the business would rather not advertise.

**If you see an error:** "That facility is no longer listed." (it was removed in Property settings; reload); "That change could not be saved."

**Undo:** click the tick box again.

### Add a new FAQ

**Who can do this:** Admin by default. It needs **Manage website FAQs**, and an Admin can give that to any role.
**Where:** Website settings → **FAQs** → **New FAQ**.
**Steps:**
1. Choose the **Topic**: Day passes, Staying with us, Paying, Changing, cancelling and arriving, or Anything else.
2. Write the **Question** (up to 200 characters).
3. Write the **Answer** (up to 2,000 characters). Each line becomes its own paragraph on the website.
4. Wherever the answer mentions a figure that lives in Property settings (a time, a price, the deposit, a list of facilities), put the cursor there, press **Insert live figure** and choose it. It is inserted in curly brackets, for example {security deposit}, and the website fills in today's figure. Each menu choice shows its current value ("Now: BND 100.00"). See *Live figures in FAQ answers* below.
5. Check the **As the website shows it** preview. It shows the question and answer exactly as a guest will read them, with the figures filled in.
6. Tick **Show on the front page as well** if it should also appear on the front page (at most 6 can be there).
7. Press **Add FAQ** (it reads **Saving…**).

**What happens next:**
- A green note reads "FAQ added".
- It goes live on the public FAQs page at once, at the bottom of its topic, and on the front page if ticked.
- The audit log records "FAQ added".
- The FAQ gets its own web address (the FAQs page followed by # and the question in lowercase words with dashes, for example …/faq#can-we-bring-our-own-food). That address stays the same even if the question is reworded later.

**Edge cases and limits:**
- If you type an amount like "BND 150" by hand, a note warns: "BND 150 is typed in, so it will not change when Property settings do. If it is one of the live figures, insert it instead." You can still save.
- Curly brackets around anything that is not a live figure are refused.
- Two FAQs with the same question are allowed. The second gets "-2" on the end of its address.

**If you see an error:**
- "Choose a topic."
- "Write the question." / "Keep the question under 200 characters." / "Write the question, in under 200 characters."
- "Write the answer." / "Keep the answer under 2000 characters." / "Write the answer, in under 2000 characters."
- "The website cannot fill in {…}. Choose it from "Insert live figure", or write it out in words." You typed something in curly brackets that is not a live figure, or mistyped one. Use the menu, or remove the brackets.
- "The front page already shows 6 FAQs. Take one off it first."
- "That question could not be given an address on the website." Reword the question to include some ordinary letters or numbers.
- "That form could not be read. Reload the page and try again."
- "That FAQ could not be saved. Try again."

**Undo:** remove the FAQ.

### Edit an FAQ

**Who can do this:** holders of **Manage website FAQs** (Admin by default).
**Where:** Website settings → **FAQs** → the FAQ → **Edit**.
**Steps:** change the topic, question, answer or front-page tick in **Edit FAQ**, then press **Save changes**. It stays greyed out until something differs.
**What happens next:**
- A green note reads "FAQ saved" and the change is live at once.
- Moving it to another topic puts it at the bottom of that topic.
- The audit log records what changed: "Question reworded", "Answer changed", "Moved to [topic]", "Put on the front page", or "FAQ edited — N fields changed".

**Edge cases and limits:** the same rules as adding. The FAQ's web address does not change when the question is reworded.

**If you see an error:** the messages under *Add a new FAQ*, plus:
- "Somebody changed this FAQ while you had it open. Close this, and open it again to see their version."
- "That FAQ is no longer there. Somebody may have removed it."

**Undo:** edit again and put the old wording back. The old wording is in the audit log's Download CSV if you need it.

### Reorder FAQs

**Who can do this:** holders of **Manage website FAQs** (Admin by default).
**Where:** Website settings → **FAQs** → the up (↑) and down (↓) arrows on a row.
**Steps:** press an arrow to swap the FAQ with the one above or below it.
**What happens next:** the FAQs page, and the front page if it is featured, show the new order at once. The audit log records "Moved up" or "Moved down".

**Edge cases and limits:**
- FAQs move only within their own topic. The first row's ↑ and the last row's ↓ are greyed out.
- To move an FAQ to another topic, **Edit** it and change the topic.
- The topics themselves are in a fixed order that cannot be changed.

**If you see an error:** "That FAQ could not be moved." / "That FAQ is no longer there. Somebody may have removed it." Reload.

**Undo:** press the opposite arrow.

### Choose which FAQs show on the front page

**Who can do this:** holders of **Manage website FAQs** (Admin by default).
**Where:** Website settings → **FAQs** → the **Front page** tick box on any FAQ row. The **Show on the front page as well** box in the Edit dialog does the same.
**Steps:** tick to add, untick to remove. The row's box saves at once.
**What happens next:**
- A green note reads "On the front page" or "Taken off the front page".
- The **On the front page** list at the top updates.
- The audit log records "Put on the front page" or "Taken off the front page".

**Edge cases and limits:**
- **At most 6.** When 6 are ticked, the other boxes are greyed out. Hovering over one says "The front page already shows 6."
- The front page lists them in the same order as the FAQs page: by topic, then by position within the topic. To change the order, move them with the arrows.
- With none ticked, the front page leaves its FAQs section out entirely.

**If you see an error:** "The front page already shows 6 FAQs. Take one off it first."

**Undo:** click the box again.

### Remove an FAQ

**Who can do this:** holders of **Manage website FAQs** (Admin by default).
**Where:** Website settings → **FAQs** → the FAQ → **Remove**.
**Steps:**
1. The dialog asks "Take this FAQ off the website?" and says ""[question]" comes off the FAQs page (and the front page), and a link somebody was sent to it opens the top of the FAQs page instead. What it said stays in the audit log."
2. Press **Remove FAQ** (red), or **Keep FAQ** to back out.

**What happens next:** a green note reads "FAQ removed". It is gone from the website at once. The audit log records "FAQ removed", and its full text is in the audit log's Download CSV.

**If you see an error:** "That FAQ is no longer there. Somebody may have removed it." "That FAQ could not be removed."

**Undo:** not possible. Add it again with **New FAQ**, using the text from the audit log's Download CSV if needed. If the question is the same, it gets the same web address back.

### Live figures in FAQ answers

These are the figures **Insert live figure** offers. What is typed between the curly brackets is not case-sensitive. Each one fills itself in from Property settings every time the page is shown, so an answer stays right when a rate changes.

| Menu label | What appears in the answer | Filled in with |
|---|---|---|
| Check-in time | {check-in time} | the check-in time, e.g. 14:00 |
| Check-out time | {check-out time} | the check-out time |
| Security deposit | {security deposit} | e.g. BND 100.00 |
| Extra guest charge, per person per night | {extra guest charge} | e.g. BND 7.00 (the default) |
| Age up to which a child is not counted | {free child age} | a number |
| Sofa bed charge | {sofa bed charge} | the sofa bed extra's price, or "the price shown when you book" if that extra no longer exists |
| Late check-out charge, per hour | {late check-out charge} | e.g. BND 15.00 (the default) |
| How far ahead guests can book | {booking window} | e.g. "180 days" |
| Facilities a day pass covers | {day-pass facilities} | the facility names, separated by · (or "the facilities shown when you book") |
| Facilities a day pass does not cover | {facilities not in the day pass} | names, or "nothing" |
| Day-pass prices | {day-pass prices} | each age band and price, or "shown when you book" |
| Family bundles | {family bundles} | each bundle and price, or "none at the moment" |
| Bank accounts | {bank accounts} | "[bank] [account number] or …", or "the account shown on your booking page" |
| Nightly rates, per apartment type | {nightly rates} | "[type] — from BND … a night" for each type that has units available, or "shown when you pick your dates" |
| Guests per apartment type | {guest limits} | "[type] — up to N" |
| Parking spaces per apartment type | {parking spaces} | "[type] — N spaces" |

The same filled-in answer shows on the FAQs page, on the front page, and in the portal's previews. An apartment type with no units in service is left out of the rate, guest and parking lists.

### Write and publish the privacy policy

**Who can do this:** Admin by default. It needs **Write and publish the privacy policy**, and an Admin can give that to any role.
**Where:** Website settings → **Privacy policy**.
**Steps:**
1. If the editor is empty, a note explains: "Nothing written yet. **Start from template** gives you headings shaped to what the website collects, with a [Fill in: …] gap wherever only you know the answer. The wording is yours to approve before you publish it." Press **Start from template** to fill the editor. If there is already text, it asks "Replace your text with the template?" first ("What is in the editor is replaced. Your saved draft and the website stay as they are until you save or publish, and Discard changes brings the saved draft back."). Choose **Use the template** or **Keep my text**.
2. Write or edit the text. You can type, or paste from Word or Google Docs; headings, bold and lists come across. Use the formatting bar: **Heading**, **Bold (Ctrl+B)**, **Bullet list**, **Numbered list**, **Undo (Ctrl+Z)**, **Redo (Ctrl+Y)**.
3. Replace every **[Fill in: …]** gap. While any remain, a note lists them ("3 gaps to fill before you can publish:" followed by the list, and "…and N more" past six).
4. Press **Save draft** to keep your work without changing the website. It is greyed out until there are unsaved changes. The status line then reads "Draft saved — not on the website yet". **Discard changes** puts the editor back to the last saved draft.
5. When the wording has been approved, press **Publish**. It asks "Publish the privacy policy?" the first time ("It goes on the website straight away, and the Privacy policy link at the foot of every page starts working. Guests sending us their IC are pointed to it too."), or "Publish this version?" after that ("It replaces the version the website shows now, straight away. The earlier version is kept in the list of published versions."). Both say "The website shows exactly what you publish, so check the wording has been approved." Press **Publish** (it reads **Publishing…**), or **Not yet** to back out.

**What happens next:**
- A green note reads "Privacy policy published".
- The public privacy policy page shows exactly the text that was on screen, and the footer's **Privacy policy** link works on every page.
- What you published also becomes the saved draft.
- A new line appears under **Published versions**, marked "On the website now".
- The audit log records "Privacy policy published for the first time" or "New version of the privacy policy published". Saving a draft is not recorded.

**Edge cases and limits:**
- **Publish** is greyed out when:
  - the text is empty
  - it is over 50,000 characters
  - any [Fill in: …] gap is left
  - it is exactly what the website already shows (the status line reads "This is what the website shows")
- If the text runs over 50,000 characters, you see "The policy is longer than 50,000 characters, so it cannot be saved. Shorten it first." Save draft is then greyed out too.
- Nothing you type changes the website until you press Publish. Leaving the page loses unsaved typing.
- **The wording is the business's responsibility.** The template is a starting point. The system does not check that the policy meets Brunei's data protection law. This is not settled yet — ask Jefferson/Jason (who is to approve the wording and who is the named Data Protection Officer).

**If you see an error:**
- "Write the policy before publishing it."
- "Fill in every [Fill in: …] gap before publishing."
- "Keep the policy under 50,000 characters."
- "Somebody else saved the policy while you had it open. Copy anything you want to keep, then reload the page to see their version." Copy your text somewhere safe, reload, and merge.
- "Sign in again, then try that once more."
- "That form could not be read. Reload the page and try again."
- "The privacy policy could not be saved. Try again."
- "The website already shows this" (a note, not an error): what you published was identical to the live version, so nothing changed.

**Undo:**
- A published policy **cannot be unpublished**. Once there is one, the footer link always works.
- To go back to earlier wording, put that wording in the editor and publish it again. The earlier versions' text is in the Privacy policy tab's Download CSV (Admin only). It is not shown on screen.

### Switch between light and dark

**Who can do this:** anyone, on any screen of the portal. The public website has its own switch.
**Where:** the two-button switch at the top right of the portal's page header, next to the notifications bell: a sun (**Light**) and a moon (**Dark**). On the public website it is in the header on wider screens, and at the foot of the page on a phone.
**Steps:** click the sun or the moon.
**What happens next:** the whole screen changes at once.

**Edge cases and limits:**
- The choice is remembered by **this browser on this device only**. It is not part of your account, so it will not follow you to another computer or phone, and another person using the same browser gets your choice.
- Light is the default. The system does **not** follow your phone's own dark-mode setting.
- The field screens have no switch of their own. They use whatever was chosen in the portal on the same device.
- The public website remembers its own choice separately.
- In a private browsing window the choice may not be remembered.

**Undo:** click the other button.

### Use the portal on a phone

**Who can do this:** anyone.
**Where:** any portal screen on a narrow screen.
**Steps:**
1. Tap the **menu button** (three lines) at the top left of the header to open the navigation drawer.
2. Tap a screen. The drawer closes and the screen opens.
3. Your name and account menu (**Settings**, **Sign out**) are at the bottom of the drawer.

**Edge cases and limits:** wide tables can be scrolled sideways inside the page, including the Roles matrix (the permission names stay pinned on the left) and the Audit log. For work at the gate or in the units, the field screens are built for phones. See *Field screens*.

## Every permission, explained

These are the 24 permissions exactly as they are labelled on the **Roles** tab and in **Settings → Your access**, with who holds each by default. An Admin can change any of this on the Roles tab, except that Admin always keeps **Edit settings, roles & the unit registry**.

**Bookings**
- **View bookings** (all five roles). Lets you open:
  - the Dashboard
  - All bookings
  - the Calendar
  - a booking's own page (its history, notes and documents list)
  - the Deposits list and a deposit's page
  - booking results in the portal search

  It also lets you add notes to a booking, and on an entry code's page it shows staff the booking's details. It does not let you open identity documents; that needs **View identity documents**.
- **Create bookings** (Admin, Front Office). The **New booking** screen, including starting a booking from the Calendar.
- **Edit bookings** (Admin, Front Office). **Amend** a booking, **Change** the party (how many people) on a booking's page — including a guest already checked in and a day pass — **Replace code** for its entry QR code, and attach or remove identity documents on a booking. Holders get the bell notification when the guard reports extra guests at the gate.
- **Check guests in** (Admin, Front Office, Security). Check a short-stay guest in, from the booking's page or the Gate, and report more people than booked on a stay's Gate card (**Extra**). It opens the Gate field screen.
- **Check guests out** (Admin, Front Office, Security, Housekeeping). Check a guest out, from the booking's page, the Gate, or the Departures screen when the unit is found empty. On its own it does not open the Gate.
- **Admit day passes** (Admin, Front Office, Security). Let a paid day pass in at the gate or from its booking page, and use **Extra** on a day pass's Gate card (with **Record cash payments** as well, add visitors to the pass and take the difference). It opens the Gate field screen.
- **Cancel bookings** (Admin, Front Office). Cancel a booking, and mark a guest a no-show from the arrival day onwards.
- **Discount bookings** (Admin, Front Office). Give, change or remove a discount when creating or amending a booking.
- **Override booking holds** (Admin, Front Office). Listed on the matrix, but **nothing in the app currently checks it**, so ticking or unticking it changes nothing today.

**Payments & charges**
- **Verify payments** (Admin, Front Office, Finance). The **Verification queue**: confirm a bank transfer has arrived. Recording a transfer as already seen on a booking or deposit needs this *and* Record cash payments. It also covers banking the cash on the **Daily cash-up** (together with View reports to open that screen), attaching transfer slips, rebuilding a booking's accounting pack, and the notification when a customer says they have paid.
- **Record cash payments** (Admin, Front Office, Security). The **Cash payments** screen, recording cash (and the security deposit, and a short deposit's top-up) on a booking or at the gate, and raising a transfer for the office to verify. It does not let anyone say a transfer has arrived.
- **Create charges** (Admin, Front Office). Add a charge against a security deposit, at any time from when the deposit is held until its release is approved (before arrival, during the stay or after check-out).
- **Waive charges** (Admin, Finance). Waive a charge on a deposit.

**Deposits & inspections**
- **Approve deposit release** (Admin, Finance). The final approval that releases a security deposit after check-out.
- **Waive the security deposit** (Admin, Front Office). Decide at booking time that no security deposit is taken.
- **Record inspections** (Admin, Housekeeping). Record an inspection (with photos) on the Departures screen, a deposit's page or a unit's page, and add or remove inspection photos afterwards. It opens the Departures field screen.

**Property**
- **Manage units** (Admin, Front Office, Housekeeping). Open the **Units** board and a unit's page (and see units in the portal search), take a unit out of service and back, edit its notes, and mark it ready after cleaning.
- **Manage tenancies** (Admin, Front Office). Mark a unit as let long-term, change or end the lease.

**Website**
- **Manage website photos** (Admin). The **Photos** tab of Website settings, including the front-page switch for facility cards, and the **Food** tab (the food notice and the menu flyer).
- **Manage website FAQs** (Admin). The **FAQs** tab of Website settings.
- **Write and publish the privacy policy** (Admin). The **Privacy policy** tab of Website settings.

**Administration**
- **Edit settings, roles & the unit registry** (Admin; cannot be removed from Admin). It opens:
  - **Property settings** (every tab)
  - **Unit registry**
  - **Roles & staff**
  - the **Audit log**

  It also shows the **Download CSV** buttons on the bookings, payments, deposits and daily cash-up lists and on each Website settings tab, and the link from Units to the Unit registry.
- **View reports** (Admin, Finance). **Reports**, **Daily cash-up** and the reports' own downloads.
- **View identity documents** (Admin, Front Office). Open a guest's IC or passport on a booking. Everyone who can view the booking can see *that* a document is on file; only this permission opens it, and every opening is recorded in the audit log.

For how each of these moves works, see the relevant section: *New booking*, *The booking's own page*, *Payments*, *Deposits, reports and finance*, *Field screens*, *Units and property settings*.

## Rules the system enforces

- **Only an Admin creates accounts.** No self-registration, no invitation email. The temporary password is handed over in person or on WhatsApp.
- **Passwords are at least 8 characters.** Signing in never reveals whether an email has an account. The same message covers every failure.
- **Permissions, not role names, decide everything.** A person's access is everything their roles allow, combined. It is re-read on every page and every button press, so a change applies at once, without signing out.
- **Every action re-checks permission on the server.** A hidden button is not what protects anything. Even a typed-in address or an old open screen is refused.
- **Nobody can lock the business out of administration.** Admin always keeps **Edit settings, roles & the unit registry**, and you cannot remove it from yourself. You also cannot disable or delete your own account.
- **An account that has acted is never deleted, only disabled**, so every recorded action keeps a name.
- **The audit log is append-only.** Nothing in it can be edited or removed, and passwords are never written into it. Identity-document openings are recorded.
- **Reset links work once, for an hour, and only the newest works.** At most three reset emails per address per hour, and five requests per device per hour.
- **Website changes are live on save.** Photos, FAQs and the facility-card switch change the public site at once. The privacy policy changes only when you **Publish**.
- **Website photos have their location data removed**, must be JPEG, PNG or WebP under 4 MB after shrinking, and need a description.
- **At most 6 FAQs on the front page.** Live figures come from Property settings, so answers keep up with rate changes.
- **The privacy policy cannot be published with a [Fill in: …] gap in it**, and every published version is kept.
- **When two people edit the same photo, FAQ or policy at once**, the second save is refused rather than silently overwriting the first.

## Likely questions

**Q: A new guard starts tomorrow. How do I give him access?**
A: Roles & staff → **New staff account**. Enter his name and email, press **Generate** for a temporary password, tick **Security**, and press **Create account**. Copy the password and send it to him on WhatsApp. It is not shown again. When he signs in he lands straight on the Gate screen. Ask him to change the password on Settings (portal.bruneiapartment.com/account).

**Q: Someone forgot their password. What do I do?**
A: They can press **Forgot password?** on the sign-in screen and follow the email link (it works once, for an hour). If they have no email access, an Admin goes to Roles & staff → ⋯ on their row → **Reset password**, generates a temporary password and sends it to them. The old password stops working at once.

**Q: It says "Email or password is incorrect" but I'm sure my password is right.**
A: Check the email for a typo; the password is case-sensitive. Use the eye button to check the password. The same message also appears if your account has been **disabled**, or after many attempts from the same network (wait a few minutes). Ask an Admin to look at your row on Roles & staff, or use **Forgot password?**.

**Q: I never got the reset email.**
A: Check spam and wait a few minutes. No email is sent if the address has no account or the account is disabled, and no more than three are sent to one address per hour. The screen does not say which applies, on purpose. Always use the newest email, because a new request cancels the older link. If nothing comes, ask an Admin to reset it.

**Q: The reset link says it has expired or has already been used.**
A: Links last an hour, work once, and only the newest works. Press **Ask for a new link** and use the email that arrives next.

**Q: Do I have to change the temporary password?**
A: The system does not force you, but you should. Settings → Password → **Change password**. It also signs out any other device that used the temporary one.

**Q: How do I change my email address?**
A: You can't. The email is the sign-in and nothing in the app changes it. An Admin can create a new account with the new email (same roles), and **disable** the old one. Your history stays under the old account.

**Q: How do I change someone else's name on the staff list?**
A: An Admin can't. Each person sets their own name on **Settings → Profile**. Changing it relabels everything they have done, and the audit log records the old and new names.

**Q: A staff member left. Should I delete them?**
A: No, **disable** them (Roles & staff → ⋯ → **Disable account**). Anyone who has done anything in the system cannot be deleted, so their name stays on their work. **Delete** is only for an account created by mistake and never used. Disabling is what cuts off someone who might still be signed in: their next page or save is refused. **Reset password** alone does not sign out a device that is already signed in.

**Q: It says "This account has acted and cannot be deleted — disable it instead."**
A: That account has at least one entry in the audit log, even if only changing its own password. Use **Disable account**.

**Q: A guard's phone was lost. What now?**
A: The quickest safe step: the guard signs in on another device and uses Settings → **Sign out other devices**, which signs out the lost phone, then changes the password. If the guard can't do that, an Admin can **Disable account** (Roles & staff → ⋯) so the lost phone is refused on its next page, then **Reset password** to give the guard a new temporary password and **Enable account** again. The guard then signs in on the new phone and straight away uses Settings → **Sign out other devices**, so the lost phone stays signed out. **Reset password** on its own does not sign the lost phone out.

**Q: I changed Front Office's permissions. Do they need to sign out?**
A: No. The change applies to everyone holding the role on their next page load or button press. Only the screen they land on after signing in waits until their next sign-in.

**Q: Why can't I untick "Edit settings, roles & the unit registry" for Admin?**
A: It is locked on purpose. Without it nobody could open Roles & staff to undo the change.

**Q: It says "You can't remove your own admin access".**
A: You tried to save roles for yourself that don't include **Edit settings, roles & the unit registry**. Ask another Admin to change your roles.

**Q: The guard signed in and sees the portal Dashboard instead of the Gate.**
A: With only the Security role he cannot stay on the Dashboard: sign-in, and the Dashboard itself, send him straight on to the Gate. If he sees the Dashboard, his roles hold something beyond the field screens (another role, or an extra permission ticked for Security, such as **Create bookings** or **Verify payments**). Check his roles on Roles & staff and the Security column on the Roles tab. Meanwhile he can tap **Field screens** in the sidebar (under Others), or bookmark portal.bruneiapartment.com/field/arrivals. If the Gate itself is missing for him, check his roles: the Gate needs **Check guests in** or **Admit day passes**.

**Q: Can the guard see the office's booking list?**
A: Yes, by default. Security holds **View bookings**, so he can open All bookings, the Calendar and a booking's page if he goes to them (the Dashboard alone sends him back to the Gate). He also holds **Record cash payments**, which opens Cash payments. Unticking **View bookings** for Security does not take the Gate away. This is not settled yet; ask Jefferson/Jason.

**Q: Why can't Finance open the audit log?**
A: The audit log needs **Edit settings, roles & the unit registry**, which only Admin holds. Giving it to Finance would also give them Property settings and Roles & staff. This is not settled yet; ask Jefferson/Jason.

**Q: I'm on a screen and it says "You don't have access to this screen".**
A: The card names the permission it needs. See **Settings → Your access** for what you hold, and ask an Admin if the screen is part of your job. Every screen appears in the sidebar for everyone, so this is normal for screens outside your role.

**Q: Can I see who opened a guest's IC?**
A: Yes. Audit log → **What**: Documents (or search the booking reference). Each opening shows as "Identity document opened" with the person and time.

**Q: How do I see everything one person did yesterday?**
A: Audit log → **Who**: that person → **When**: Yesterday.

**Q: I searched the audit log for a guest's name and got nothing.**
A: The search only matches the **Record** column (booking reference, unit, role, facility, age band, bank account), not guest or staff names. Find the booking reference on All bookings and search for that, or use the **Who** filter for a staff member.

**Q: Can a mistake in the audit log be corrected or deleted?**
A: No. Nothing in the audit log can be edited or deleted by anyone. A correction is a new action, which is recorded in turn.

**Q: I replaced a website photo by mistake. Can I get the old one back?**
A: No. The old file is deleted when you save a replacement or remove a photo. Upload the original again from your phone or computer.

**Q: I can't tick "Front page" on an FAQ.**
A: Six are already on the front page. Untick one first. The counter at the top of the FAQs tab shows "6 of 6".

**Q: The FAQ answer shows {something} in curly brackets, or it won't save.**
A: Only the figures in **Insert live figure** can go in curly brackets. Choose it from that menu (spelling must match), or write it out in words.

**Q: We changed the security deposit. Do we need to fix the FAQs?**
A: Not if the answers use the live figure {security deposit}. It fills in from Property settings automatically. Amounts typed in by hand (the editor warns about them) do not update, so edit those.

**Q: How do I take the privacy policy off the website?**
A: You can't unpublish it. You can publish new wording at any time, and it replaces the live version at once. Earlier versions are kept.

**Q: The Publish button is grey.**
A: Either a [Fill in: …] gap is left (the note lists them), the text is empty or over 50,000 characters, or the text is exactly what the website already shows ("This is what the website shows").

**Q: How do I switch to dark mode, and why did it switch back?**
A: Press the moon at the top right of the portal header. The choice is kept by that browser on that device only, so another computer or a private window starts in light.

**Q: On my phone there is no sidebar.**
A: Tap the three-line menu button at the top left of the screen to open it.

## Terms

- **Account**: a staff member's sign-in (email and password) plus their name and roles. There is one per person.
- **Active / Disabled**: an account's status on Roles & staff. Disabled accounts cannot sign in, but keep their history and roles.
- **Admin**: the role with every permission, the only one that can manage staff, roles, settings and the audit log by default.
- **Audit log**: the permanent, uneditable record of every recorded change: who, when, what, to which record, and why.
- **Download CSV**: the button that downloads a screen's data as a spreadsheet file. Shown only to Admin by default.
- **Field screens**: the phone screens for the gate (Gate) and housekeeping (Departures), at portal.bruneiapartment.com/field.
- **Front page**: the public website's home page at bruneiapartment.com. It shows the Photos tab's photos and up to 6 featured FAQs.
- **Keep in view**: the part of a website photo that must stay visible when the site crops it (one of nine positions).
- **Live figure**: a figure in curly brackets in an FAQ answer, such as {security deposit}, which the website fills in from Property settings.
- **Permission**: one thing a person may do, such as "Verify payments". Roles are bundles of permissions.
- **Portal**: the staff system at portal.bruneiapartment.com: Dashboard, bookings, payments, settings.
- **Published version**: a privacy policy as the website showed it from a given moment. All versions are kept.
- **Reset link**: the one-hour, single-use link in a password reset email.
- **Role**: one of the five fixed bundles of permissions (Admin, Front Office, Security, Housekeeping, Finance). A person can hold several.
- **Settings**: your own account page (name, password, other devices, your access). Not the same as Property settings.
- **System**: shown as "Who" in the audit log for things nobody did by hand, such as automatic emails and document deletion (and things customers did themselves on the website).
- **Temporary password**: the password an Admin sets when creating or resetting an account, to be replaced by the owner.
- **Website settings**: the Admin screen for the public site's Photos, FAQs and Privacy policy.

---

# 10. The customer side: the public website and every email the system sends

## What this area is for

The public website is **bruneiapartment.com**. It is what customers see, and it replaces "message us on WhatsApp to book". On it a customer can:

- read about Palm Villa on the **landing page** (the front page);
- **book a short stay** (a whole apartment or the semi-detached house, by the night);
- **book a facility day pass**;
- open **their own booking page**, which tells them where the booking has got to, how to pay, and (once confirmed) shows their entry QR code;
- **find their booking again** with their reference and phone number;
- read the **FAQs** and the **privacy policy**.

Staff do not use the public site to do their work — the portal (portal.bruneiapartment.com) is where bookings are handled. This section is here so staff understand exactly what a customer saw, was asked, was told and was emailed, so they can answer the customer's questions and know what will land on their own screens.

Staff can reach the public site from the portal sidebar: **Others → Public site**. At the foot of every public page there is a small line **Staff: Portal · Field** that links back to the staff screens.

There are no customer accounts and no customer passwords. A customer's booking is opened by a **private link** (sent in their emails, and shown in their browser right after booking) or by **Find your booking** (reference + phone number).

Customers never pay online. Nothing is charged by card. They pay by **bank transfer** (quoting their booking reference) or in **cash** at the property.

---

## Screens

### The header and footer (on every public page)

**Header** (stays at the top of the screen while scrolling):
- **Palm Villa** (with a small aqua dot) — goes to the front page.
- On tablets and computers only: links **Day pass**, **Stays**, **Long term**, and a light/dark theme switch.
- **Find booking** — opens the Find your booking page. On very narrow phones it shrinks to a magnifying-glass icon.
- **Book** — a menu with two choices: **Day pass** ("Use the facilities for the day") and **Stay** ("An apartment, by the night").

**Footer**:
- **Palm Villa**, and the address **Lot 9163, Spg 84-92-52-33, Jln Setia Diraja, Kpg Mumong A, Mukim Kuala Belait, KA1531** (tapping it opens the property's pin in Google Maps).
- The three phone numbers, each with a **WhatsApp** link beside it: **+673 8959798**, **+673 8837118**, **+673 8986733**. Tapping a number rings it; tapping WhatsApp opens a chat with it.
- Links: **Day pass**, **Short stays**, **Long-term enquiry**, **Find your booking**, **Getting here** (the map section on the front page), **FAQs**, **Privacy policy**, **WhatsApp**, **Instagram @palmvilla.bn**, **TikTok @palmvilla.bn**.
- **Privacy policy** is only a working link once an Admin has published a privacy policy (see *Staff access and administration → Website settings*). Until then it shows greyed out and does nothing.
- On phones, the light/dark theme switch sits in the footer.
- © year · Kuala Belait, Brunei Darussalam, and **Staff: Portal · Field**.

Wherever the site offers a single "Message us on WhatsApp" or "Start an enquiry" button, it opens a chat with the **first** number, +673 8959798. Wherever it shows a list, it shows all three.

### The landing page (front page)

Address: bruneiapartment.com. Anyone can open it. Sections from top to bottom:

1. **Hero** — eyebrow "Palm Villa · Kuala Belait", headline **"Swim today, stay tonight."**, a line "Day passes for the swimming pool, water park and indoor children's playground — and apartment stays from BND ___ a night. One place, in Kuala Belait.", buttons **See day pass prices** (scrolls to the day-pass section) and **Browse stays** (scrolls to stays), and the front-page photograph.
2. **Day pass** section — heading "A full pool day, from BND ___", the line "One pass covers everything below — pay per person, or take a family bundle.", then one card per facility (photograph, name, and a short description for the pool, water park and indoor children's playground). The row of cards scrolls sideways on tablets and computers and stacks on phones. Below it a card **Day pass** with the price line (for example "From BND 5 per person · family bundles from BND 20") and the button **Book a day pass**.
3. **Short stays** section — heading "Whole units, from BND ___ a night", "The whole place to yourselves — apartments and a semi-detached house.", one card per unit type (photograph, name, a short line, and "from BND ___ / night"). Every card links to the stay booking page. Button **Book a short stay**. Fine print: "BND ___ refundable security deposit · bookings open up to __ days ahead."
4. **Long term** — a dark card "Make Palm Villa home": "Longer tenancies are arranged directly with us and priced per tenancy. Tell us what you need and we'll come back with a proposal." Button **Start an enquiry** opens WhatsApp. There is no online booking for long-term tenancies.
5. **How it works — "Booking is simple"** — three steps: "Pick your day or dates", "Pay your way" ("Transfer to BIBD or Baiduri with your booking reference, and upload the slip as you book. No card needed."), "You're confirmed" ("Your confirmation arrives by email, with a link back to your booking. Quote your reference on arrival."). Fine print repeats the deposit and booking-window line and adds "Pay by bank transfer (BIBD / Baiduri) or cash." Then "Already booked? **Find your booking.**"
6. **Follow along** — four square photo tiles and **Instagram** / **TikTok** buttons (@palmvilla.bn).
7. **FAQs** — only if staff have put any FAQs on the front page (at most 6). "The questions guests ask most. Everything else is on the FAQs page." Button **See all FAQs**. Each question opens when tapped.
8. **Getting here** — "Kuala Belait, Brunei", the full address (Lot 9163, Spg 84-92-52-33, Jln Setia Diraja, Kpg Mumong A, Mukim Kuala Belait, KA1531), a button **Open in Google Maps**, and an aerial map with the building marked "We are here!". Tapping the map also opens Google Maps. The footer's **Getting here** link scrolls here.
9. **"Ready when you are"** closing band — **Check availability** (goes to the stay booking page) and **Message us on WhatsApp**.

**Which figures are live, and where they come from.** No price on the front page is typed into the page itself. They all come from **Property settings**:

| What the page says | Where it comes from |
|---|---|
| "from BND ___ a night" (hero, stays heading, search-engine description) | The cheapest nightly rate among unit types that can actually be sold |
| Each unit-type card's "from BND ___ / night" | That type's nightly rate |
| "A full pool day, from BND ___" | The cheapest day-pass age-group price that is not free |
| "From BND ___ per person · family bundles from BND ___" | Cheapest paid age group, and cheapest family bundle (the bundle part disappears if there are no bundles) |
| "BND ___ refundable security deposit · bookings open up to __ days ahead." | The security deposit and the booking window |
| Which facility cards appear | Facilities ticked *Included in day pass* **and** switched on with **Show on the front page** |
| The FAQ answers' figures | Filled in live from settings (see *FAQs page* below) |

**Which unit types appear.** Only unit types that have at least one unit in the building which is not out of service. A unit type with no units (for example the 2-bedroom, until its units are entered in the Unit registry) is not shown on the front page, not offered on the stay booking page, and not quoted in FAQ answers.

**Which facility cards appear.** A facility gets a card only if it is ticked *Included in day pass* in Property settings → Day pass, and its **Show on the front page** switch is on (Website settings → Photos → Day pass). Switching a card off removes it from the front page only — the day-pass booking page still lists that facility as included, because the pass still admits it. Un-ticking *Included in day pass* removes it from both. The front page never lists what the pass does *not* include.

**Photographs.** Each place (front page, each facility, each unit type, the four "Follow along" tiles) shows the photo staff chose in Website settings → Photos, or a grey placeholder if none (see *Staff access and administration → Website settings*).

**How quickly changes show.** The front page is kept ready-made and refreshed at least once an hour. It is refreshed immediately when staff save: a photograph change, an FAQ change, the Rates, Day pass, Bank accounts or Extras tabs of Property settings, or the Unit registry. If the page cannot read its figures (a database problem), it still shows, just without the prices, FAQs or photos — it never shows the wrong price.

### The stay booking page ("Check what is free, and book it")

Address: bruneiapartment.com/stay. Reached from **Book → Stay**, **Book a short stay**, **Check availability**, or any unit-type card. It is always live — prices and availability are read fresh every time the page opens.

Intro: "Prices are per night and include everything but the extras you choose below. Nothing is charged online — you transfer the ___ deposit to secure the unit, and settle the stay when you arrive."

The form, top to bottom:

- **Which unit** — one button per sellable unit type, showing "BND ___ / night · sleeps __". The first type is pre-selected.
- **Your dates** — an availability calendar (two months side by side on a computer, one on a phone). Each night shows the nightly rate for the chosen unit type, or **FULL** (faded, crossed through) when no unit of that type is free that night. Days before today or beyond the booking window are faded and have no price. The customer clicks the arrival day, then the departure day. The departure day is the morning they leave: it is not charged and does not need to be free. The line under the calendar reads "Pick the day you arrive, then the day you leave. Prices are per night.", then "Now pick the day you leave.", then "_ nights · dates".
- **No. of guests** — **Over age __** (starts at 2, at least 1) and **Age __ and under** ("Not charged for."). The age comes from Property settings.
- **Your details** — **Your name**, **Mobile number** (country code picker, Brunei +673 by default), **Email** (required; hint "Your confirmation and entry QR code are sent here. We will not email you anything else."). Then vehicle **Registration** rows or the tick box **Arriving without a vehicle**. Under the plates: "The ___ includes _ parking spaces." **The rows stop at the parking spaces the chosen unit type includes**: **Add another vehicle** is offered only until that many rows are showing, and in its place a notice says "The ___ includes _ parking spaces. Bringing another car? Message us on WhatsApp at +673 8959798 first to confirm it." (the number opens a WhatsApp chat with the office). If the customer typed more plates and then chose a smaller unit type, a warning asks them to remove the extra: "The ___ includes _ parking spaces. Remove the extra car to continue. To bring it, message us on WhatsApp at +673 8959798 first to confirm." (or "the extra 2 cars … them"), and the booking is refused until they do. Staff's own booking forms are not capped (see *Creating bookings*).
- **Extras** — one number box per extra staff have made bookable (for example sofa beds), with "BND __ each", the extra's description, and once dates are chosen "_ free for those nights" or "None free for those nights". Then **Late check-out (hours)** (0 to 12), hint "Check-out is __:__. BND __ an hour after that." Then the line "Arriving before __:__? Ask us when you get here — it depends on whether the unit is ready." Early check-in cannot be booked online.
- **Your booking** panel (right-hand side on a computer, below on a phone): the unit type, the dates and nights, the price lines and total. If a deposit applies: "The total amount above excludes a **BND ___** security deposit, which is refundable subject to the condition of the property upon check-out." Button **Proceed to bank transfer** (greyed until there is a valid price). Under it: "Nothing is charged now. We hold the unit while you transfer the deposit."

**No ID is asked for at booking.** The IC is asked for later on the customer's booking page, after they say they have transferred.

### The day pass booking page ("Spend the day with us")

Address: bruneiapartment.com/day-pass. Reached from **Book → Day pass** or **Book a day pass**. Always live.

Intro: "Book a day pass for your family. We always charge you the cheapest combination of rates and family bundles — you do not have to work it out."

- **Which day** — a date picker from today up to the booking window. Under it: "A day pass gives you access to:" and a bulleted list of every facility ticked *Included in day pass* (this list ignores the front-page show/hide switch).
- **No. of guests** — one number box per age group from Property settings, each with its ages and "BND __ each" or "Free". The adult group starts at 2. Up to 50 per age group.
- **Your details** — name, mobile, email (required; hint "Your confirmation and entry QR code are sent here."), vehicle registrations or **Arriving without a vehicle**. No parking allowance line (a pass has no unit).
- **Your day pass** panel — the date, the number of people, the price lines (bundles applied automatically where cheaper) and total. If a daily capacity is set and the day is too full, it says "That day is fully booked. Please pick another." or "Only _ places are left on that day." and the button is greyed. Button **Book day pass**. Under it: "Nothing is charged now. You transfer the amount above and we confirm your pass."

Daily capacity only applies if staff have entered a **Day-pass capacity** for a facility in Property settings → Day pass; the smallest capacity among the included facilities limits the day. With no capacity entered, day passes are unlimited.

### The customer's booking page ("Your booking")

Address: bruneiapartment.com/booking/ followed by a 22-character private code. The customer lands here straight after booking, and it is the **Open your booking** link in their emails. Anyone who has this link can see the booking; there is no password. It is never shown in search engines.

The page reads the booking fresh every time, so it always reflects what staff have just done. It groups the booking's status into four "stages" the customer sees:

| Booking status staff see | What the customer's page shows |
|---|---|
| Held (and Draft) | **Almost done** — amber chip **Waiting for your transfer** |
| Awaiting payment | **One more thing** (no IC yet) or **Thank you** (IC received) — amber chip **Checking for your transfer** |
| Confirmed, Checked in, Completed | **You are booked** — green chip **Confirmed** |
| Cancelled, No show, Expired | **This booking is closed** — no chip |

Every stage shows "Reference PV-____", a **What you booked** card and a footnote: "Keep this page — it is the link to your booking. Anyone with it can see this booking, so do not post it publicly. If you lose it, you can **find it again** with your reference and the number you booked with."

**What you booked** card: **Unit** (the actual unit reference assigned, for example the door) or **Day pass** (the date); **Dates** (with nights) or **Guests** ("_ people"); **Name**; **Car** (plates, or "Arriving without a car"); the price lines and total; and for a stay with a deposit, "Plus a refundable BND ___ security deposit, which comes back to you after your stay."

**Stage 1 — Waiting for your transfer (status Held).**
- "What happens next": **1 Make the transfer** (current), **2 Send us your IC**.
- A **How to pay** card:
  - For a stay with a deposit, two choices (the first is pre-selected):
    - **Everything now — BND ___** — "The BND ___ deposit and the BND ___ for the stay together, so there is nothing to settle on arrival."
    - **Just the deposit — BND ___** — "Secures your unit. The BND ___ for the stay is paid when you arrive."
  - For a day pass: the amount and "The full price of your day pass."
  - The bank accounts from Property settings → Bank accounts: "Send it to this account:" (one) or "Send it to either of these accounts:" (two or more), each as bank name and account number, separated by "or". If no bank account is set up: "We cannot show the bank details right now. Please call us and we will give them to you."
  - "Send **BND ___** in one transfer with **PV-____** as the transfer reference so we can match it to your booking, then confirm below. Once we verify the transfer, we will email your booking confirmation and QR code for entry."
  - Button **I have made the transfer** (shows "Telling the team…" while working).
- There is **no countdown or deadline** anywhere.

**Stage 2 — Checking for your transfer (status Awaiting payment).**
- "What happens next": **Make the transfer** (ticked), **Send us your IC** (current until an IC is received, then ticked).
- **A. Send us your IC** — "We need a copy of the lead guest's IC to register the stay." Button **Choose a file** (or **Choose a different file** once one is held). "JPEG, PNG, WebP or PDF, up to 4 MB. Held privately, used only internally for verification." plus, once a privacy policy is published, a link "How we handle your personal data". After sending: "Received, thank you." or "Received [date]." and "Sending another replaces the one we have."
- **B. Send us your transfer slip** — "Your bank transfer slip will help us verify your transfer faster." Same file rules.
- If a deposit has been checked and found short: a red box "We have received BND __ of the BND ___ security deposit, so BND __ is still outstanding. Your unit is held, and the booking is confirmed once the rest arrives — send it to the same account, quoting PV-____, or call us if something has gone wrong."
- Otherwise: "We have your booking and are checking for the transfer. Once we verify it, we will email your confirmation and a QR code for entry, which will be on this page too." For a **stay** the sentence also promises the check-in instructions: "…we will email your confirmation, a QR code for entry and your check-in instructions, which will all be on this page too." (A guest who gave no email address is told these "will be on this page" instead.)

**Stage 3 — Confirmed (status Confirmed, Checked in or Completed).**
- Green box: "Your booking is confirmed." For a stay it adds either "The BND ___ for the stay is settled when you arrive." or "Everything is settled — there is nothing to pay on arrival.", then "Show the code below at the gate." For a day pass just "Show the code below at the gate."
- On a **Completed** booking (a stay checked out, or a day pass already admitted) the page still says **You are booked** and "Show the code below at the gate", but no code is shown below it.
- **Your entry code** card (only while the booking is Confirmed or Checked in): the QR code, the reference underneath, "Show this at the gate. Save it to your phone, or send it to whoever is driving." and a **Save the image** button that downloads the picture.
- **Check-in instructions** card — **stays only**, not day passes. Five numbered steps: "Please go to the Security Counter.", "Fill in and sign the Registration Form.", "Show the IC of the person who made the booking.", "Security will hand you the apartment key and tell you where to park your car.", "The Wi-Fi password is on a sticker attached to the TV board in the living room." Then "Have a pleasant stay and enjoy your time with us!"
- **Getting here** card — every confirmed booking, stay or day pass: the address, an **Open in Google Maps** button, and the aerial map.
- **Food** card — every confirmed booking, stay or day pass, while there is a food notice (Website settings → Food): the notice text, a **Call [number]** button that dials the food provider, and **See the food menu**, which opens the food page — only if a menu flyer has been uploaded.
- **A. Send us your IC** stays available (no slip box).

**Stage 4 — Closed (Cancelled, No show, Expired).**
- Red box with the reason and "If that is not what you expected, please call us.":
  - Cancelled: "This booking was cancelled."
  - No show: "This booking was recorded as a no-show."
  - Expired: "This booking was released before payment was confirmed." (Nothing in the app currently expires a booking, so customers should not see this.)
- No payment instructions, no uploads, no QR code.

**If the link is wrong or cut short** (for example WhatsApp broke it), the customer sees **"That link does not open a booking"**: "It may have been cut short on the way to you. You can open your booking with the reference from it and the phone number you booked with." Button **Find your booking**, and "Or call us —" with the three numbers. The page deliberately does not say whether the booking exists.

### The food page

Address: bruneiapartment.com/food. Not in the site's menus and hidden from search engines: guests reach it from **See the food menu** on their confirmed booking page and in their confirmation email. It shows the heading **Food**, the food notice, a **Call [number]** button, and the provider's menu flyer, whole; tapping the flyer opens it full size, with the caption "Tap the menu to open it full size." With no flyer uploaded it shows the text and the button only. While the notice is empty (Website settings → Food), the page does not exist — it shows the "page not found" screen.

### Find your booking

Address: bruneiapartment.com/find-booking. Linked from the header (**Find booking**), the footer, the "Already booked?" line, the FAQs page, the broken-link page and every booking email.

"Enter the reference from your booking and the phone number you booked with, and we will open it for you."
- **Booking reference** (placeholder "PV-XXXX"; hint "Found on your booking confirmation page or in your confirmation email.")
- **Your phone number in the booking** (country code picker)
- Button **Find my booking** ("Looking…")
- "Cannot find it? Call or message us —" and the three numbers.

It **sends nothing** — no email, no text. If the details match, it opens the customer's booking page straight away in their browser.

### FAQs page

Address: bruneiapartment.com/faq. Linked from the footer and **See all FAQs**. Eyebrow "Before you book", heading **FAQs**: "What guests ask most often. If yours is not here, call or message us — the numbers are at the foot of every page."

Questions are grouped under five fixed topics, in this order, and a topic with no questions is left out: **Day passes**, **Staying with us**, **Paying**, **Changing, cancelling and arriving**, **Anything else**. Each question opens when tapped. Staff write the questions and answers in Website settings → FAQs (see *Staff access and administration*).

Figures inside answers are filled in live from Property settings, so they never go stale: check-in time, check-out time, security deposit, extra guest charge, free child age, sofa bed charge, late check-out charge, booking window, facilities a day pass covers / does not cover, day-pass prices, family bundles, bank accounts, nightly rates per apartment type, guests per apartment type, parking spaces per apartment type.

A single question can be linked to directly: the page address followed by # and the question's web address (for example …/faq#how-do-i-pay); opening that link scrolls to the question and opens it.

At the bottom: **"Still not sure?"** — "Message us and a person will answer. Or if you already have a booking, open it again." Buttons **Message us on WhatsApp** and **Find your booking**.

If the page cannot read the questions, it says: "We could not load the questions just now. Message us and a person will answer."

The page is refreshed immediately when an FAQ, pricing, day-pass, bank-account or extras setting, or the Unit registry is saved, and at least hourly otherwise.

### Privacy policy page

Address: bruneiapartment.com/privacy. Eyebrow "Your personal data", heading **Privacy policy**, "Last updated [date]", then the policy exactly as staff published it. Until a policy has been published, this address shows a "not found" page and the footer link is greyed out. A newly published version is what the next visitor reads.

### If a public page fails

The customer sees **"This page didn't load"** — "Something went wrong on our side. Trying again usually works. If it keeps happening, message us on WhatsApp and we'll sort it out." with **Try again** and **Back to the home page**.

---

## How to …

### How a customer books a short stay online (what they go through)

**Who can do this:** any member of the public. No staff permission is involved.
**Where:** bruneiapartment.com → **Book → Stay** (or **Book a short stay**).
**Steps (as the customer does them):**
1. Choose a unit type under **Which unit**.
2. Click the arrival night, then the departure day, on the calendar.
3. Set **Over age __** and **Age __ and under**.
4. Fill in name, mobile number, email, and car registration(s), up to the parking spaces the unit type includes — or tick **Arriving without a vehicle**. For another car they message the office on WhatsApp first.
5. Optionally choose extras and **Late check-out (hours)**.
6. Check the price in **Your booking** and press **Proceed to bank transfer**.
7. They land on their booking page at **Almost done**, with the bank details.
8. They make the transfer in their banking app with the reference, choose **Everything now** or **Just the deposit**, and press **I have made the transfer**.
9. The page moves to **Checking for your transfer** and asks for their IC and (optionally) the transfer slip.

**What happens next:**
- On pressing **Proceed to bank transfer**, the price is worked out again by the system from what they chose (a price sent from the browser is never trusted). The system picks a free unit of that type for them (the lowest-numbered free unit) and the booking is created with status **Held**. The unit is blocked from that moment.
- A booking reference (PV-____) is issued.
- The booking's history shows **"Booked online — short stay"** by **System**.
- Staff with the "view bookings" ability get a bell notification **"New online booking — short stay"**.
- The **Booking email** is sent to the customer within seconds (see the email catalogue below).
- The booking appears in All bookings, the Calendar and the Dashboard straight away.
- When they press **I have made the transfer**: the status becomes **Awaiting payment**; the history shows **"Sent for verification"**; a security deposit transfer to check (BND ___) is put in the **Verification queue**, and if they chose **Everything now**, the stay payment too (two items for one transfer); staff who can verify payments get the bell notification **"Payment to verify"**. No email is sent at this point. See *Payments → How to confirm a bank transfer for the stay*.
- When staff verify the deposit (or, for a booking with no deposit, the payment), the booking becomes **Confirmed**, an entry QR code is issued and the **Confirmation email** is sent.

**Edge cases and limits:**
- Nothing is charged online; there is no card payment.
- **There is no time limit.** A booking that is never paid stays **Held** forever and keeps the unit blocked until a staff member cancels it or takes the money. No reminder is sent. Chasing unpaid online bookings is the desk's job.
- Bookings open from today up to the booking window in Property settings (for example 60 days).
- A booking needs at least one guest over the free age.
- If Property settings treat a unit's maximum as a hard limit, a bigger party is refused ("___ takes up to _ guests; this party is _."). If the maximum is the point where the extra-guest charge starts, the party can book and an extra-guest line is added.
- Early check-in cannot be booked online; the customer is told to ask on arrival.
- The customer never chooses the exact unit; they choose the type. Staff can move them to another unit by amending (see *Finding and changing bookings → How to edit (amend) a booking*).
- One phone number may have at most **3** unpaid online bookings (Held or Awaiting payment) at once. Bookings staff make at the desk do not count towards this.
- Limits on attempts: 10 booking attempts an hour from one device/connection, 5 a day against one phone number, 5 a day against one email address. Attempts count even if the booking is then refused. The daily counters reset at 8:00 am Brunei time; the hourly ones on the hour.
- Vehicles: no more than the parking spaces the chosen unit type includes (Property settings → Rates → **Car parks**), each up to 20 characters. A customer who wants to bring another car is told to message the office on WhatsApp at +673 8959798 first. If the office agrees, staff add the plate with **Edit → Vehicles**, where there is no cap.

**If you see an error** (the customer sees these and may read them to you):
- "Check the highlighted fields." — something on the form is missing or wrong; the field says what: "Choose a unit.", "Choose your dates.", "A booking needs at least one guest.", "Tell us your name.", "We need a number to confirm your booking.", "We send your confirmation and entry QR code here." (email left blank), "Check the email address.", "Enter your car registration, or tick that you are not bringing one.", "The ___ includes _ parking spaces. To bring another car, message us on WhatsApp at +673 8959798 first." (more plates than the unit's parking spaces).
- "Those dates have just been taken. Please pick other dates, or another type of unit." — no single unit of that type is free for every night chosen. Either someone booked it a moment ago, the chosen range crosses a night marked **FULL**, or free nights are spread across different units. Offer other dates or another type, or book it at the desk.
- "There are already several unpaid bookings against this number. Please complete or cancel one first, or call us." — the phone number already has 3 unpaid online bookings. The customer cannot cancel online; staff need to look up their bookings, take payment or cancel the ones they no longer want.
- "That is a lot of bookings in a short time. Please wait a little, or call us and we will book you in." — the hourly device limit. Book them at the desk, or they wait for the next hour.
- "That is a lot of bookings against this number today. Please call us and we will book you in." / "That is a lot of bookings against this email address today. Please call us and we will book you in." — the daily limits. Book them at the desk.
- "Every ___ is taken for those nights." / "Only _ ___ are free for those nights." — an extra (for example sofa beds) ran out while they were booking.
- "___ is not available to book." / "That extra is no longer on the list." / "There are only _ ___ across the property." — an extra was changed in settings or they asked for more than exist.
- "Check-in cannot be in the past." / "Bookings open up to __ days ahead." / "Check-out must be at least one night after check-in."
- "Something went wrong creating your booking. Please try again." — a rare technical clash; trying again works.
- "Something went wrong. Please try again." — shown to automated spam; a real customer should never see it. If one does, book them at the desk.

**Can it be undone?** The customer cannot cancel, change or undo a booking online. Staff cancel or amend it in the portal (see *The booking's own page* and *Finding and changing bookings*).

### How a customer books a day pass online (what they go through)

**Who can do this:** any member of the public.
**Where:** bruneiapartment.com → **Book → Day pass** (or **Book a day pass**).
**Steps (as the customer does them):**
1. Pick the day under **Which day**.
2. Enter how many people in each age group.
3. Fill in name, mobile, email, and car registration(s) or tick **Arriving without a vehicle**.
4. Check the price and press **Book day pass**.
5. On their booking page (**Almost done**) they see the full amount, "The full price of your day pass.", and the bank details. They transfer the full amount with the reference and press **I have made the transfer**.

**What happens next:**
- The price is re-worked by the system; bundles are applied automatically where cheaper.
- The booking is created with status **Held**; it takes places on that date (if a capacity is set). No security deposit applies to a day pass.
- History: **"Booked online — day pass"** by **System**. Bell notification: **"New online booking — day pass"**.
- The **Booking email** is sent.
- **I have made the transfer** puts the full amount in the **Verification queue** as a payment to check (status **Awaiting payment**, "Payment to verify" in the bell). There is no "deposit only" choice.
- Once verified, the booking is **Confirmed**, the entry QR code is issued and the **Confirmation email** is sent. At the gate the guard admits the pass (see *Field screens*).

**Edge cases and limits:**
- The day must be from today up to the booking window.
- At least one guest; up to 50 in each age group.
- The same limits as stays: 3 unpaid online bookings per phone number; 10 attempts an hour per device, 5 a day per phone number, 5 a day per email address.
- Daily capacity only if staff set one; otherwise unlimited.
- No hold expiry and no reminder, exactly as for stays.

**If you see an error:**
- "Pick the day you are coming." / "Pick a day from today onwards." / "Day passes are booked up to __ days ahead." — the date is missing or outside the window (this can happen if the page was left open past midnight).
- "Add at least one guest." / "Enter a number of guests." / "That age group is no longer offered. Refresh the page and try again." (staff changed the age groups) / "For a group this size, please call us — a booking here takes up to 50 guests in each age group."
- "There are not enough places left for that date." — the day filled up while they were booking.
- The contact-details, vehicle and rate-limit messages are the same as for a stay (see *How a customer books a short stay online*).

**Can it be undone?** Not online. Staff cancel or amend in the portal.

### How a customer tells us they have paid ("I have made the transfer")

**Who can do this:** anyone with the booking's private link.
**Where:** their booking page, at **Almost done**, **How to pay** card → **I have made the transfer**.
**Steps:**
1. (Stay with a deposit) choose **Everything now** or **Just the deposit**.
2. Press **I have made the transfer**.

**What happens next:**
- Status moves from **Held** to **Awaiting payment**.
- What lands in the Verification queue depends on the choice:
  - Stay, **Just the deposit**: one item — the security deposit (BND ___).
  - Stay, **Everything now**: two items from one transfer — the deposit and the stay payment. They are checked separately because one is refundable and one is income.
  - Day pass (or a stay quoting no deposit): one item — the full price.
- The booking is **not** confirmed yet and no email is sent. The waiting time in the queue starts from this moment.
- The page now asks for the IC and offers the slip upload.

**Edge cases and limits:**
- The button is only offered while the booking is **Held**. Pressing it twice does nothing extra.
- 30 presses an hour from one device.
- Pressing the button does not prove money arrived; staff must check the bank (see *Payments → How to confirm a bank transfer for the stay*).

**If you see an error:**
- "We have already been told about this transfer." — it was already pressed; nothing to do.
- "This booking has moved on since this page was opened. Refresh to see where." — staff changed the booking (confirmed it, cancelled it) while the page was open.
- "We could not find that booking." — the link no longer matches a booking.
- "That link is not valid. Please open it again from the top." — the link was damaged.
- "Please wait a moment and try again, or call us and we will sort it out." — too many presses from one device.

**Can it be undone?** Not by the customer. If they pressed it by mistake, staff deal with it from the Verification queue (see *Payments*).

### How a customer sends their IC or transfer slip

**Who can do this:** anyone with the booking's private link.
**Where:** their booking page → **A. Send us your IC** / **B. Send us your transfer slip** → **Choose a file**.
**Steps:**
1. Tap **Choose a file** and pick a photo or PDF. It sends as soon as it is picked.

**What happens next:**
- The file is stored privately against the booking. An IC appears in the booking's identity documents; a slip is attached to the deposit and/or payment it evidences (both, if they chose **Everything now**). Staff see them on the booking and in the Verification queue (see *The booking's own page → Identity documents* and *Payments*).
- Sending another file of the same kind replaces the one before.
- No email, no bell notification.

**Edge cases and limits:**
- The IC box appears only once the customer has pressed **I have made the transfer** (stage **Checking for your transfer**) and stays while the booking is Confirmed, Checked in or Completed. It is offered for day passes too.
- The slip box appears only at **Checking for your transfer**. A slip is filed only against a bank-transfer deposit or payment, never against cash.
- JPEG, PNG, WebP or PDF, up to 4 MB. The file's real contents are checked, not just its name.
- 20 files an hour from one device; 10 files a day per booking.
- Neither upload is required. A guest who sends nothing is registered at the desk as usual.

**If you see an error:**
- "Choose a file to send." — nothing was picked.
- "[file name] is __ MB, which is larger than 4 MB. A photograph taken on a phone is usually well under it." / "That file is too large. A photograph taken on a phone is usually well under it."
- "That is not a JPEG, PNG, WebP or PDF. Attach a photograph or a PDF." / "That file is empty. Choose the file again."
- "There is no transfer on this booking yet. Tell us you have made it first, then send the slip."
- "This booking is closed, so there is nothing to add to it."
- "That file could not be saved. Try again, or send it to us on WhatsApp."
- "That is a lot of files in a short time. Please wait a little, or send it to us on WhatsApp."
- "That link is not valid. Please open it again from the top." / "Unknown file."

**Can it be undone?** The customer cannot delete a file; they can only replace it by sending another. Staff handle removals (see *The booking's own page → Identity documents*).

### How a customer finds their booking again (Find your booking)

**Who can do this:** anyone who knows the booking reference and the phone number on the booking.
**Where:** bruneiapartment.com/find-booking (or **Find booking** in the header).
**Steps:**
1. Type the reference. It is forgiving: "PV-0123", "pv 0123", "PV0123" and "0123" all work.
2. Type the phone number the booking was made with. Spaces, dashes and the +673 / 673 prefix do not matter: "+673 8959798", "8959798" and "673-895-9798" all match.
3. Press **Find my booking**.

**What happens next:**
- If both match, their booking page opens immediately. Nothing is emailed or texted.
- Works for **any** booking, including one taken at the desk and one that is cancelled (so they can read why).
- A booking made at the desk has no private link until the first time somebody finds it this way; then one is created, and the booking's history shows **"Booking link issued — found by reference and phone"** by **System**. After that the same link is always returned.

**Edge cases and limits:**
- A desk booking made **"At the gate"** is **Held**, so if the guest finds it this way their page shows **Almost done** with the bank details and **I have made the transfer**, like an unpaid online booking. If they press it, the booking moves to **Awaiting payment** with a deposit transfer (and, if they chose "Everything now", a stay transfer) waiting in the Verification queue. The guard can still take the deposit in cash, but the gate will not take cash for the stay while a stay transfer waits to be checked. Tell "At the gate" guests to pay at the gate, not by transfer.
- Numbers from other countries must be typed with the same country code as on the booking.
- 10 attempts an hour from one device, and 10 attempts a day on one reference (from anywhere). The daily count resets at 8:00 am Brunei time. Correct and wrong attempts both count.
- Staff cannot see or copy a customer's private link in the portal. If a customer cannot get in, the answers are: check the reference and phone number with them, wait for the limit to reset, or send them the entry QR code yourself from the booking's **Download image** (see *The booking's own page → Entry code*).

**If you see an error:**
- "We could not find a booking with those details. Check the reference and the number you booked with, or call us and we will find it for you." — wrong reference, wrong phone number, **or** that reference has already had 10 attempts today. The message is the same on purpose. Look the booking up in the portal and compare the phone number exactly.
- "That is a lot of attempts from this device. Please wait a little, or call us and we will find your booking." — 10 attempts in the hour from that device (also shown if the system cannot check the counter).
- "Something went wrong. Please try again." — spam protection; a real customer should not see it.

**Can it be undone?** Nothing to undo; it only opens a page. A link once issued keeps working.

### How to see which emails a booking has had

**Who can do this:** anyone who can view the booking (all five default roles; an Admin can change who can).
**Where:** Portal → the booking's page → its history. Also the notification bell for failures.
**Steps:**
1. Open the booking and look at its history.
2. Look for **"Booking email sent"**, **"Confirmation email sent"**, or **"… could not be sent — [reason]"**, all by **System**.

**What happens next:** Nothing — this is read-only. A failure also shows in the bell as **"Booking email could not be sent"** or **"Confirmation email could not be sent"** for everyone who can view bookings, for 14 days.

**Edge cases and limits:** Nothing is written to the history when an email is deliberately not sent (the booking had already moved on, or there was no valid address). The history records only the domain of the address (for example gmail.com), never the full address.

**Can it be undone?** No. There is no button to resend an email.

---

## The complete catalogue of emails

The system sends **three** kinds of email and no others:

1. **Booking email** — to the customer, when they book online.
2. **Confirmation email** — to the customer, when their booking becomes confirmed.
3. **Password reset email** — to a member of staff who asks for one.

It sends **no** email for: an amendment, a cancellation, a no-show, check-in or check-out, a payment received after confirmation, a deposit top-up after confirmation, a deposit release or refund, a deposit statement, reminders about unpaid bookings, new staff accounts (the Admin passes on a temporary password in person), or anything to staff about bookings (staff are told through the portal's notification bell). There is no marketing email.

All emails come from a no-reply address on bruneiapartment.com. They carry **no reply address that anyone reads**. The emails tell the customer to call or WhatsApp instead. (Replies were deliberately not set up, because nobody has been given a mailbox to watch. This is not settled yet — see *Things not settled yet*.)

### 1. Booking email ("Almost done")

- **Trigger:** a customer completes the stay or day-pass booking form on the website. It goes out a second or two after the booking is created.
- **Not sent for:** bookings made in the portal at the desk (walk-ins, phone bookings, "At the gate" bookings) — these never get a Booking email.
- **Recipient:** the email address the customer typed.
- **Subject:**
  - Stay: **"Almost done — your Palm Villa booking PV-____"**
  - Day pass: **"Almost done — your Palm Villa day pass PV-____"**
- **Preview line** (shown by mail apps beside the subject): "PV-____ · BND ___ to secure it" (the deposit for a stay, the full price for a day pass).
- **Content, top to bottom:**
  - Property name (small), headline **"Almost done"**, amber chip **"● Waiting for your transfer"**.
  - Stay: "We have your booking. The unit is held for you — send the transfer below and we will confirm it." Day pass: "We have your booking. Send the transfer below and we will confirm your pass."
  - "Reference PV-____".
  - **What you booked**: stay — **Unit** (the unit *type* name, for example 3-Bedroom, never the door), **Dates** ("… · _ nights"), **Guests** ("_ people"); day pass — **Day pass** (the date), **Guests**; then **Name** and **Car** (plates, "Arriving without a car" or "Not recorded").
  - **Price**: each price line and the **Total** "BND ___".
  - Stay with a deposit: "Plus a refundable BND ___ security deposit, which comes back to you after your stay."
  - **How to pay** (amber panel):
    - Stay with a deposit — both options, because they have not chosen yet: **"Just the deposit — BND ___"** ("Secures your unit. The BND ___ for the stay is paid when you arrive.") and **"Everything now — BND ___"** ("The BND ___ deposit and the BND ___ for the stay together, so there is nothing to settle on arrival.").
    - Day pass — one option "BND ___", "The full price of your day pass." (a stay with no deposit: "The full price of your booking.").
    - "Send it to this account:" / "Send it to either of these accounts:" and each bank name and account number from Property settings, with "or" between. If none is set up: "We cannot show the bank details here. Please call us and we will give them to you."
    - "Put PV-____ as the transfer reference so we can match it to your booking. Your unit is held for you in the meantime — once we confirm the transfer, your booking is confirmed and we will let you know."
  - Button **Open your booking**, the full link written out underneath (so it survives being forwarded into WhatsApp), and "Anyone with this link can see this booking, so do not post it publicly."
  - Footer: "Palm Villa · Call or WhatsApp us on +673 8959798 · +673 8837118 · +673 8986733", "Lost this email? Open your booking with your reference and phone number — **Find your booking**" (link to the Find your booking page), and "This is the only email we send about this booking."
- **Links in it:** the customer's private booking page; the Find your booking page.
- **Attachments:** none.
- **Plain-text version:** every figure is also in a plain-text version for mail apps that do not show designed emails.

### 2. Confirmation email ("You are booked")

- **Trigger:** the moment a booking **becomes Confirmed because money was taken or checked**. Specifically, when any of these confirms it:
  - verifying the deposit or the payment in the **Verification queue**;
  - recording cash in **Cash payments**;
  - recording a cash payment on the booking's page;
  - recording the deposit on the booking's page (in cash — a transfer recorded there waits for verification, and the email goes when that is verified);
  - a deposit **top-up** that completes a short deposit;
  - the guard taking cash at the gate for an "At the gate" booking.
  For a stay with a deposit, it is the **deposit** that confirms the booking, so the email goes when the deposit is taken or verified — not when the stay money is.
- **Applies to** online bookings **and** desk bookings paid by transfer or taken "At the gate".
- **Not sent when:**
  - a desk booking is created and paid in cash on the spot (it is confirmed immediately in the New booking screen, and no email is sent at all — see Likely questions);
  - money is taken on a booking that was already confirmed (a top-up, the stay balance, cash on arrival);
  - money is taken but the booking is still not confirmed (for example a short deposit, or stay money before the deposit);
  - the booking is no longer Confirmed by the time the email is prepared a second later (for example cancelled at once).
- **Recipient:** the booking's email address (for a desk booking, the one staff typed).
- **Subject:** **"You are booked — Palm Villa PV-____"**
- **Preview line:** "PV-____ · [dates or day]".
- **Content, top to bottom:**
  - Property name, headline **"You are booked"**, green chip **"✓ Confirmed"**, "Your booking is confirmed."
  - **Your entry code**: the QR code image, the reference in large type, and "Show it at the gate. It is attached to this email too, so you can forward it to whoever is driving." (If for some reason there is no code, the email shows "Reference PV-____" instead and says to show the reference at the gate.)
  - **What you booked** and **Price** — as in the Booking email. No "How to pay" panel.
  - **When you arrive**:
    - "Show the QR code in this email at the gate, or quote reference PV-____."
    - Stay with a deposit: "Your refundable BND ___ security deposit is with us, and comes back to you after your stay."
    - Stay: "BND ___ for the stay is settled when you arrive." or "Everything is settled — there is nothing to pay on arrival." (worked out from what has actually been paid, not the total).
    - Stay: "Check in from __:__, and check out by __:__." (from Property settings).
    - A day pass has only the first sentence.
  - **Check-in instructions** — **stays only**: the same five numbered steps and closing line as the booking page's Check-in instructions card.
  - **Getting here** — every confirmed email: the address and an **Open in Google Maps** link. (No map picture — many email apps block pictures.)
  - **Food** — every confirmed email, stay or day pass, while there is a food notice: the notice text, **Call [number]**, and **See the food menu** (a link to the food page, only if a flyer has been uploaded). The flyer itself is not in the email; the link means a flyer changed later is what the guest sees.
  - **Open your booking** button with the link and the "Anyone with this link…" note — **only if the booking has a private link**. A desk booking that has never been looked up has none, so this part is missing; the Find your booking link in the footer is the way in.
  - Footer: the same as the Booking email, including "This is the only email we send about this booking."
- **Links in it:** the customer's booking page (if it has one); Find your booking.
- **Attachment:** the entry QR code as a picture file named "PV-____-entry-qr.png", shown inside the email and also attached so it can be forwarded.
- **What the QR code does:** it holds a link to the staff portal's entry-code page. A guard signed in to the field screens who scans it gets that booking's gate card. Anyone else who scans it (including the guest) sees only a masked summary — first name and initial, reference, dates and status. See *Field screens → Entry code page (what a scanned QR code opens)*.
- If staff later **Replace code** on the booking, the old code in this email stops working and **no new email is sent**. The customer's booking page shows the new code; or staff can download and WhatsApp it (see *The booking's own page → Entry code*).

### 3. Password reset email (staff)

- **Trigger:** a member of staff enters their email on **Forgot password?** at the staff sign-in page (portal.bruneiapartment.com) and presses **Send reset link**. See *Staff access and administration → Reset a forgotten password yourself (by email)*.
- **Recipient:** the staff account's email address.
- **Subject:** **"Choose a new password for Palm Villa Operations"**
- **Preview line:** "Somebody asked to reset your password. The link works once, for an hour."
- **Content:** "Palm Villa Operations", headline **"Choose a new password"**, "Somebody asked to reset the password for the staff account [address]. If it was you, choose a new one with the link below.", button **Choose a new password** with the link written out, "The link works once, for an hour. Asking for another one cancels this one.", "If it wasn't you, ignore this email. Your password has not changed, and it can't be changed without this link.", and "Sent because a password reset was asked for on the Palm Villa staff sign-in page." Black-and-white design (no teal).
- **Link in it:** the staff reset-password page on portal.bruneiapartment.com. It works once, for one hour; asking again cancels the earlier link.
- **Not sent (silently — the screen still says "Check your email") when:** there is no staff account with that address; the account is disabled; or that address has already had 3 reset emails in the hour. The screen always gives the same answer so it cannot be used to find out who works here.
- **Device limit:** 5 requests an hour from one device, which shows "That is a lot of requests from this device. Wait a while and try again, or ask an administrator to reset your password."
- **If email is switched off** for the site, **Forgot password?** says "Password reset by email isn't available. Ask an administrator — they can set you a new one straight away."
- **Where it is recorded:** in the **Audit log** against the staff account, as **"Password reset email sent"** or **"Password reset email could not be sent — [reason]"**. It does not appear in the notification bell.

### When an email fails, and what happens

- **Timing:** emails are sent a second or two after the action, in the background. The staff member's action (the booking, the verification, the cash) has already succeeded and is **never** undone or refused because an email failed.
- **Retries:** if the mail service cannot be reached, does not answer within 8 seconds, is overloaded, or is failing, the system tries **once more** after about a second. That is all — there is no later retry, no nightly retry and **no resend button**.
- **Never twice:** each booking email kind is sent at most once per booking (the mail service ignores an identical second request within 24 hours).
- **Limit per recipient:** at most **5** booking emails a day to one address (Booking and Confirmation emails together). A sixth is not sent and is recorded as a failure "too many emails to that address today". The booking is still made.
- **Recorded in the booking's history** (by **System**):
  - "Booking email sent" / "Confirmation email sent"
  - "Booking email could not be sent — [reason]" / "Confirmation email could not be sent — [reason]", where the reason is one of: "the mail service could not be reached", "the mail service did not answer in time", "the mail service was rate-limiting us", "the mail service was failing", "the mail service refused it", "the mail service answered in a way we could not read", "no mail service is configured", "too many emails to that address today".
- **Bell notification:** every failure also shows in the bell for staff who can view bookings: **"Booking email could not be sent"** / **"Confirmation email could not be sent"**, with the reference and guest name; tapping it opens the booking.
- **Not recorded at all** (deliberately): an email not sent because the booking had already moved on (confirmed or cancelled within seconds), the address was not a valid email, or email is switched off for the whole site.
- **A "sent" entry means the mail service accepted it**, not that it reached the inbox. A mistyped address or a spam folder will not show as a failure.
- **What to do when a customer did not get their email:** check the booking's history. Then either give them the Find your booking route (reference + phone number opens their page, which has the payment details or the QR code), or open the booking's entry code section, use **Download image** and send the QR on WhatsApp. If the address itself is wrong, correct it by amending the booking (see *Finding and changing bookings*); this does **not** resend anything.

---

## What a customer cannot do online (they must contact staff)

- Cancel a booking, or change dates, unit type, guests, extras, name, phone, email or vehicles.
- Choose a specific unit (door) — only the type.
- Book early check-in (they ask on arrival).
- Book a long-term tenancy (enquiry by WhatsApp only).
- Pay by card or pay online.
- Pay part of the deposit on purpose, or split payments.
- Ask for a refund or deposit release.
- Get a replacement QR code, or have an email re-sent.
- Delete an uploaded IC or slip.
- Book more than 3 unpaid online bookings on one phone number, or book past the daily attempt limits.
- Book a unit type that is not on sale (no units entered) or a date beyond the booking window.
- Book a day pass for more than 50 people in one age group.
- Book more cars on a stay than the parking spaces the unit type includes (they message the office on WhatsApp first; staff add the plate).

---

## Rules the system enforces

- **Prices are always recalculated by the system** from what the customer chose, using the current Property settings. What the browser showed is never trusted.
- **The system assigns the unit** for an online stay: the first free unit of the chosen type. Two customers can never get the same unit for the same night — the database refuses it.
- **Online bookings start as Held** and block their unit (or day-pass places) immediately. **Nothing expires them** and nothing reminds the customer (the owner decided holds last until someone acts; whether the system should ever chase unpaid bookings is not settled yet — for now chasing is the office's job). An abandoned booking stays until staff cancel it.
- **A stay is confirmed by its security deposit**, not by the stay money. A day pass (or a stay quoting no deposit) is confirmed by its full payment.
- **"I have made the transfer" is a claim, not a payment.** Nothing is confirmed until staff check the bank.
- **Email address and phone number are required** on every online booking; a vehicle registration is required unless "Arriving without a vehicle" is ticked.
- **Anti-abuse limits** (fixed; not changeable in settings): 3 unpaid online bookings per phone number; 10 booking attempts an hour per device; 5 a day per phone number; 5 a day per email address; 30 "I have made the transfer" presses an hour per device; 20 uploads an hour per device and 10 a day per booking; 10 lookups an hour per device and 10 a day per reference; 5 booking emails a day per address; 3 password-reset emails an hour per address and 5 requests an hour per device. Daily limits reset at 8:00 am Brunei time.
- **The private link is the key** to a booking page. Anyone with it can see the booking, so customers are told not to post it. A broken or unknown link and a malformed one give the same "That link does not open a booking" page.
- **The entry QR code grants nothing by itself** — only a signed-in guard's scan does anything.
- **Two emails per booking at most**, and only at two moments: made online, and confirmed.

---

## Likely questions

**Q: A customer booked online three days ago and never paid. Will the system cancel it?**
No. Online bookings are held with no time limit and no reminder is sent. The unit stays blocked until a staff member cancels the booking or takes the money. Unpaid online bookings show as **Held** (not yet claimed paid) or **Awaiting payment** (they pressed "I have made the transfer").

**Q: The customer says they paid but the booking is still "Held".**
They have not pressed **I have made the transfer** on their booking page, so nothing is in the Verification queue. Either ask them to press it, or check the bank and record/verify the money from the booking page (see *Payments*).

**Q: The customer says they didn't get any email.**
Open the booking and read its history for "Booking email sent", "Confirmation email sent" or "… could not be sent — …". "Sent" means the mail service accepted it — ask them to check spam and the spelling of their address. There is no resend button. Send them to **Find your booking** (reference + phone number) or send the QR with **Download image** on WhatsApp.

**Q: We booked a guest at the desk and they paid cash. Why didn't they get a confirmation or QR code by email?**
A desk booking paid in cash on the spot is confirmed straight away and no email is sent. Give them the QR code yourself (booking page → entry code → **Download image**, then WhatsApp), or tell them to open their booking at bruneiapartment.com/find-booking with the reference and their phone number — the page shows the QR code.

**Q: We booked a guest at the desk by transfer. Will they get an email?**
Not when you create it. They get the **Confirmation email** (with the QR code) when the transfer is verified. They never get a Booking email with bank details, so give them the bank details and reference yourself.

**Q: The confirmation email says "This is the only email we send about this booking" — but they got two.**
Both emails carry that sentence. A customer who booked online gets the Booking email and later the Confirmation email. That is normal; reassure them.

**Q: The customer's email says "3-Bedroom" but their booking page shows a unit number. Which is right?**
Both. The email names only the unit type. The booking page shows the unit the system assigned at the moment they look, which staff can change by amending. If you moved them, the page shows the new unit.

**Q: A customer says the calendar showed the dates free but they got "Those dates have just been taken".**
Either someone else booked the last unit a moment earlier, or the range they chose crosses a night marked FULL (the calendar lets them pick a departure day across a full night), or different units are free on different nights so no single unit covers the whole stay. Offer other dates or types, or book it at the desk, where you can choose units.

**Q: The customer gets "There are already several unpaid bookings against this number".**
Their phone number already has 3 unpaid online bookings. They cannot cancel online. Find their bookings in the portal, then take payment or cancel the ones they do not want, or make the new booking for them at the desk (desk bookings do not count).

**Q: Can a customer cancel or change their booking themselves?**
No. Everything after booking goes through staff: amend or cancel in the portal. No email goes out when you do; their booking page updates immediately (a cancelled booking shows "This booking was cancelled. If that is not what you expected, please call us.").

**Q: How long does the customer have to pay?**
The app sets no deadline and shows no countdown. Any deadline is a business decision; the site does not state one. This is not settled yet — ask Jefferson/Jason if you need a policy.

**Q: Find your booking says "We could not find a booking with those details" but the customer is sure they're right.**
Look the booking up in the portal and compare the phone number — it must be the number on the booking (the +673 prefix and spaces don't matter; other country codes do). If it matches, that reference may have had 10 lookup attempts today; it resets at 8:00 am. In the meantime send the QR code by WhatsApp.

**Q: The customer lost the email with the link. Can we send them the link?**
Staff cannot see the private link in the portal. Tell them to use **Find booking** at the top of the website with their reference and phone number. It opens the same page.

**Q: Does Find your booking send an email or a text?**
No. It opens the booking page straight away in their browser, and sends nothing.

**Q: The customer wants to send their IC but there's no upload box.**
The IC box only appears after they press **I have made the transfer**. Before that the page is only about paying. It also does not appear on a cancelled or no-show booking.

**Q: The customer sent the wrong photo. Can they fix it?**
Yes — sending another file of the same kind replaces the previous one. They cannot delete it themselves.

**Q: The customer chose "Everything now" but only sent the deposit (or the other way round).**
The queue shows two items (deposit and stay) for "Everything now". Verify what actually arrived; see *Payments* for short or partial amounts.

**Q: The day-pass page lists a facility but the front page doesn't show its card.**
Someone switched off **Show on the front page** for that facility in Website settings → Photos. The pass still includes it. To stop selling it, un-tick *Included in day pass* in Property settings → Day pass.

**Q: I changed a rate in Property settings. When does the website show it?**
The stay and day-pass booking pages use it immediately. The front page and FAQs refresh immediately on save of the Rates, Day pass, Bank accounts or Extras tabs or the Unit registry, and at least hourly otherwise. Bookings already made keep the price they were made at.

**Q: The 2-bedroom isn't on the website.**
A unit type is only offered if the building has at least one unit of that type that is not out of service. Add the units in the Unit registry (see *Units and property settings*).

**Q: Is there a restaurant? Where do guests get food?**
There is no restaurant at Palm Villa. An outside food provider leaves a menu at the poolside tables and delivers; guests order by calling them directly (+673 333 5410, free delivery on orders of BND 20 and above, as the notice first said). Confirmed guests are told this on their booking page and in their confirmation email, with a link to the provider's menu flyer on the food page (bruneiapartment.com/food). To change the wording, the number or the flyer, see *Staff access and administration → Website settings → Food tab*.

**Q: What contact details does the customer see?**
Three phone numbers, all on WhatsApp: +673 8959798, +673 8837118, +673 8986733; Instagram and TikTok @palmvilla.bn; and the address, Lot 9163, Spg 84-92-52-33, Jln Setia Diraja, Kpg Mumong A, Mukim Kuala Belait, KA1531, with a link to the property's Google Maps pin (in the footer of every page, and in the front page's Getting here section with an aerial map). "Message us on WhatsApp" buttons open +673 8959798. The emails carry the three numbers and say "Call or WhatsApp us". There is no customer email address to reply to.

**Q: What if a customer replies to one of our emails?**
The emails come from a no-reply address and nobody reads replies. Ask customers to call or WhatsApp.

**Q: The customer's booking page says "This booking was released before payment was confirmed."**
That is the wording for an Expired booking. Nothing in the app currently expires bookings, so this should not happen; if it does, check the booking's history and tell Jefferson.

**Q: Can a customer book a long stay online?**
No. The Long term section only offers **Start an enquiry**, which opens WhatsApp. Long-term tenancies are arranged by staff (see *Units and property settings → How to record a long-term lease on a unit*).

**Q: The website's "How it works" says to upload the slip as you book.**
In practice the slip upload appears on the booking page after the customer presses **I have made the transfer**, not on the booking form. The slip is optional; the bank is the real check.

**Q: The customer scanned their own QR code and got a page asking staff to sign in / showing only their first name.**
That is expected. The code is for the guard's scanner. Anyone not signed in sees only a short summary. It still works at the gate.

**Q: A staff member didn't get their password reset email.**
Check the Audit log for "Password reset email sent" / "could not be sent" against their account. No email is sent if the address has no account, the account is disabled, or 3 were already sent in the hour. An Admin can set a new password directly in Roles & staff.

---

## Terms

- **Public site** — bruneiapartment.com, the customer-facing website.
- **Private link / booking page** — the customer's own page for one booking (bruneiapartment.com/booking/…); whoever has the link can view it.
- **Booking reference** — "PV-" followed by a number, for example PV-0123; quoted on transfers and at the gate.
- **Find your booking** — the page where a customer opens their booking with reference + phone number.
- **Held** — status of an online booking that has been made but not yet claimed as paid; the unit or places are blocked.
- **Awaiting payment** — status after the customer presses "I have made the transfer" (or a desk transfer booking); waiting for staff to verify.
- **I have made the transfer** — the customer's button that puts their transfer in the Verification queue.
- **Everything now / Just the deposit** — the two ways a stay customer can pay by transfer: deposit plus stay together, or deposit only with the stay paid on arrival.
- **Sellable unit type** — a unit type with at least one unit in service; only these are shown and bookable online.
- **Show on the front page** — the switch that shows or hides a facility's card on the landing page only.
- **Booking email** — the "Almost done" email sent when a customer books online, with the bank details.
- **Confirmation email** — the "You are booked" email sent when a booking becomes confirmed, with the entry QR code attached.
- **Password reset email** — the staff email with a one-hour link to choose a new password.
- **Entry QR code** — the code in the confirmation email and on the customer's page, scanned by the guard at the gate.
- **Honeypot** — a hidden form field that catches spam robots; real customers never see it.
- **Live figures** — prices, times and bank details the website reads from Property settings rather than having typed in.

---

# 11. End-to-end journeys

Each journey below follows one real situation from start to finish, naming who does each step and which screen they use. The details of each step (every button, message and exception) are in the section named in brackets.

## Journey 1: A guest books a stay online and pays by bank transfer

1. **The customer books** on bruneiapartment.com → **Book → Stay**: they choose the unit type, dates, guests, contact details and car registration (no more cars than the unit type's parking spaces; for another car they message the office on WhatsApp first), and press **Proceed to bank transfer**. The system picks a free unit of that type and the booking is created as **Held**. The unit is blocked from that moment. *(The customer side)*
2. **The customer gets the Booking email** ("Almost done") with the price, the bank details and the booking reference (PV-…), plus a link to their private booking page. Staff see a **New online booking** notification on the bell. *(The customer side)*
3. **The customer transfers the money** in their banking app, using the reference, then on their booking page chooses **Just the deposit** or **Everything now** and presses **I have made the transfer**. The booking becomes **Awaiting payment**, and the deposit (and, with Everything now, the stay payment) appears in the **Verification queue**. The customer is asked for their IC and can upload the transfer slip. *(The customer side, Payments)*
4. **The office checks the bank.** Someone with Verify payments (Front Office, Finance or Admin) opens **Payments → Verification queue**, finds the transfer in the bank app, and confirms it. Once the security deposit is confirmed in full, the booking becomes **Confirmed**, the entry QR code is issued, and the customer gets the **Confirmation email** ("You are booked") with the QR code. *(Payments)*
   - If the transfer never arrives, nothing happens on its own: the booking stays blocked until the office cancels it. *(The booking's own page)*
   - If less than the deposit arrives, it is recorded as a short deposit: the booking stays unconfirmed and cannot be checked in until topped up. *(Payments)*
5. **Arrival day.** The guest appears on the **Gate** screen under **Arriving** and on the office **Dashboard**. At the gate the guard finds the card (or scans the QR code), checks the car plate and counts the people against **Guests**, takes any stay payment still owed in cash if the guest is paying now (a red card means money is not settled), taps **Check in** and hands over the keys. The booking becomes **Checked in**, and the unit shows **Occupied**. *(Field screens)*
   - **More people than booked:** the guard taps **Extra** and tells the office (a note on the booking and an "Extra guests at the gate" bell notification). Check-in goes ahead. The office presses **Change** beside **Party** on the booking; any extra-guest charge becomes **Outstanding**, and the guard can take it at the gate. *(Field screens, Finding and changing bookings)*
6. **Departure day.** The guest appears under **Leaving today**. The guard takes any stay money still owed **before** checking out, because no cash can be recorded against a checked-out booking. They take the keys back and tap **Check out**. The booking becomes **Completed**, and the unit becomes **Awaiting inspection**. The deposit is **not** handed back at the gate. *(Field screens)*
7. **Inspection and deposit.** See Journey 7.

## Journey 2: The office takes a booking by phone or WhatsApp

1. Someone with Create bookings (Front Office or Admin) opens **Bookings → New booking**, enters the dates, presses **Check availability**, picks a unit, and fills in the guest's name, phone, email, guests, car registration and any extras, late check-out or discount. *(Creating bookings)*
2. Under **Payment**, they choose how the money comes in:
   - **Cash, now**: the booking is **Confirmed** at once. No email is sent to the guest at all, not even the entry QR code, so give the guest the reference yourself (and the QR code, if wanted, from the booking's page → Entry QR code → download). *(Creating bookings, The booking's own page)*
   - **Bank transfer**: the booking is **Awaiting payment** and the transfer waits in the Verification queue. The system doesn't send the guest the bank details, so give them the account details and the reference yourself. When the deposit transfer is confirmed, the booking becomes **Confirmed** and the guest gets the Confirmation email with the QR code. *(Creating bookings, Payments)*
   - **Deposit only**: the guest pays the BND 100 deposit now (cash or transfer) and the stay on arrival. *(Creating bookings)*
   - **At the gate**: only for a guest arriving today; see Journey 3.
3. From here it is the same as Journey 1 from step 5.

## Journey 3: A guest turns up at the gate without a booking

1. **The guard cannot create a booking.** They call the office. *(Field screens)*
2. The office makes the booking on **New booking** with payment **At the gate — the guard takes it**. It must be a stay starting today, and the deposit cannot be waived. The booking is **Held** with nothing paid. *(Creating bookings)*
3. The guard taps **Refresh** on the Gate. The booking appears under **Arriving** with **To pay** and the deposit to take. The guard counts the cash and taps **Take BND …**. The deposit is now held, the booking becomes **Confirmed**, and the guest is emailed the confirmation with the QR code. *(Field screens)*
4. The guard takes the stay payment (**Take BND …** again), taps **Check in**, and hands over the keys. *(Field screens)*
5. If the guest drives off without paying, the office must cancel the booking; nothing frees the unit on its own. *(Field screens)*

## Journey 4: A day pass

1. **Only online.** The visitor books on bruneiapartment.com → **Book → Day pass**: the day, how many people in each age group, contact details and car. Family bundles are applied automatically. The booking is **Held**, and the Booking email is sent. Staff cannot create a day pass in the portal. *(The customer side)*
2. The visitor transfers the **full price** and presses **I have made the transfer**. The office confirms it in the Verification queue, and the pass becomes **Confirmed** with the Confirmation email and QR code. *(Payments)*
   - A visitor who arrives without having paid can pay the full price in cash at the gate (**Take BND …**), which confirms the pass. *(Field screens)*
3. **On the day**, the pass appears under **Day passes** on the Gate. The guard checks it is paid in full, counts the people against **Guests** (e.g. "3 · Adult × 2, Child × 1") and taps **Admit**. If more visitors came than the pass is for, he taps **Extra** first: a guard who takes cash adds them by age band and takes the difference (**Take BND …**); otherwise, or if they won't pay, the office is told. The office can also change a pass's party from its page (**Change** beside **Party**) until it is admitted. Admitting closes the pass (**Completed**), and visitors may come and go that day. A pass can only be admitted on its own date. *(Field screens)*
4. A day pass has no security deposit, no unit, no check-in or check-out, and no inspection.

## Journey 5: A guest wants to stay longer, leave early, or change the booking

- **Before check-in:** the office edits the booking (booking page → **Edit**): dates, unit, guests, extras, late check-out, vehicles, name, phone, discount. Every edit reprices the booking at today's rates. If the price goes up, the extra is owed; if it goes down and more was already paid, the difference is refunded outside the system. The guest's email address cannot be changed. *(Finding and changing bookings)*
- **A confirmed booking whose check-in date has passed** (for example a guest a day late) cannot be edited at all. *(Finding and changing bookings)*
- **Already checked in, more or fewer people:** the office presses **Change** beside **Party** on the booking page. It works after check-in. Only the extra-guest charge (for every night) and a percentage discount are worked out again; the rest keeps its price. More owed shows as **Outstanding** (the guard sees it as cash to take); less shows as **Overpaid by**, refunded outside the system. *(Finding and changing bookings)*
- **Already checked in and wants to stay longer:** a checked-in booking's dates can't be edited. The office makes a **second booking** on New booking for the extra nights, in the same unit, starting on the original check-out day. They tick **Waive the security deposit** with a reason naming the first booking ("Extends PV-1234 — the deposit is already held on that booking"). The new nights are paid at once. *(Creating bookings)*
- **Leaving early:** the office checks the guest out from the booking page (the gate only checks out guests due out today or overdue). The nights not used stay blocked and can't be resold, because a checked-out booking can't be shortened. *(The booking's own page)*
- **Late check-out:** it can only be added (and charged) when the booking is made or edited before check-in. *(Creating bookings)*

## Journey 6: A cancellation or a no-show

- **Cancel** (Front Office or Admin): booking page → "…" menu → **Cancel booking**, with a reason. Possible while the booking is Held, Awaiting payment or Confirmed, but not once checked in. If a deposit is held, the dialog asks whether to **keep** it (the default) or **give it back**. The unit is released straight away, and no email goes to the guest. Cancelling is final. *(The booking's own page)*
- **No-show** (Front Office or Admin): booking page → "…" → **Mark as no-show**, from the arrival day onwards. The deposit is kept and the unused nights go back on sale. Final: a guest who turns up later needs a new booking. *(The booking's own page)*
- **Unpaid online bookings** are never cancelled automatically. The office has to spot them and cancel them: **Awaiting payment** ones sit in the Verification queue (oldest first); **Held** ones (the customer never pressed "I have made the transfer") are not in the queue, so find them on **All bookings** with the **Held** status ticked. *(Payments)*
- A kept deposit shows as revenue (**Kept deposits**) on the Reports screen. A deposit given back is handed back outside the system. *(Deposits, reports and finance)*

## Journey 7: After check-out: inspecting the unit and returning the deposit

1. **Check-out** (guard, housekeeping or office) makes the booking **Completed**. The unit shows **Awaiting inspection** on the Units board, and the deposit is **Awaiting inspection** on the Deposits screen. *(Field screens, Deposits, reports and finance)*
   - If housekeeping finds the unit empty with the keys left in it, they use **Guest has left** on the Departures screen, which checks the guest out. *(Field screens)*
2. **Housekeeping inspects** on the phone: Departures → **To inspect** → the unit → **Clean** or **Issues found**, with notes and photos. The inspection cannot be changed afterwards. The deposit becomes **Ready to release**, and the unit moves to **Cleaning**. *(Field screens)*
3. **Housekeeping marks the unit ready** when it is clean. The turnover is finished, and the Units board goes back to showing what today's bookings say about the unit (for example **Booked** if the next guest is due, otherwise **Available**). Ready is information only: it never blocks check-in or selling. *(Field screens, Units and property settings)*
4. **Charges.** If anything was damaged or is missing, the office (Front Office or Admin) opens the deposit and uses **Add charge** with the amount and what it is for. Finance or Admin can **Waive** a charge. Charges close when the release is approved. *(Deposits, reports and finance)*
5. **Approval.** Finance or Admin opens the deposit and presses **Approve release**. The system works out what goes back (deposit held minus charges) or what the guest owes if charges are larger. *(Deposits, reports and finance)*
6. **Hand the money back** in cash or by bank transfer, outside the system (nothing records the refund itself). Print or save the **Statement** from the deposit's page and send it to the guest if they want it. The office does this in the few days after check-out; there is no reminder. *(Deposits, reports and finance)*
7. **If the guest owes more than the deposit**, the amount shows under **Owed by guests** until someone records it as settled (**Record as settled**). *(Deposits, reports and finance)*

## Journey 8: The day's money

- **Cash taken** at the desk (booking page, Cash payments) or at the gate is recorded under the name of whoever took it, and shows on **Payments → Cash payments** (stays and day passes) and in the **Daily cash-up**. *(Payments)*
- **The daily cash-up** (Finance → Daily cash-up; Finance and Admin by default) shows each day's cash taken for stays and day passes, with deposits taken in cash on their own line beside the total, and a running balance of cash not yet banked. *(Deposits, reports and finance)*
- **When cash goes to the bank**, Finance or Admin uses **Record banking**, entering **the day the money went to the bank** and the amount. One banking can cover several days. Bankings can't be edited or deleted; if too little was entered, add a second entry for the difference. *(Deposits, reports and finance)*
- **Bank transfers** are confirmed in the Verification queue as they arrive. *(Payments)*
- **Accounting packs** (a PDF per booking for the accountant) are built automatically when payments are verified and rebuilt overnight when something changes. *(The booking's own page, Deposits, reports and finance)*

## Journey 9: A long-term lease

- Leases aren't bookings. Someone with Manage tenancies (Front Office or Admin) opens the unit (Property → **Units** → the unit) and uses **Mark leased long-term** with the tenant's name, the start date and, optionally, an end date. The unit then can't be booked for those dates, and the Units board shows **Leased**. *(Units and property settings)*
- The lease is ended or its end date changed from the same page. Rent isn't tracked in the system. *(Units and property settings)*

## Journey 10: A unit that can't be used

- If a unit is broken or being repaired, someone with Manage units (Front Office, Housekeeping or Admin) opens it on the Units board and takes it **out of service** with a reason. It can't be booked until it is returned to service. The system refuses to take a unit out of service while anything is still booked into it (a guest in it, any booking that has not ended, any future booking, or a lease); those have to be moved, cancelled or ended first. *(Units and property settings)*

## What each role typically looks at

This is where the system puts each job's information, not a rule about how anyone must work.

- **Guard (Security):** the **Gate** screen all day: **Arriving** (check in, take deposit or stay cash), **Leaving today** (take any money owed, then check out), **Day passes** (admit), **Already in**. Red cards are the ones whose money is not settled; **Extra** reports more people than booked. Anything the Gate says to call the office about goes to the office.
- **Housekeeping:** the **Departures** screen: guests leaving today, units **To inspect**, and units being cleaned (**Mark ready**).
- **Front Office:** the **Dashboard** (today's arrivals and departures, what is waiting), the **Verification queue**, the bell, **New booking**, and unpaid bookings to chase or cancel.
- **Finance:** the **Verification queue**, **Deposits** (**Ready to release**), the **Daily cash-up** and **Reports**.
- **Admin:** everything above, plus **Property settings**, **Roles & staff**, **Website settings** and the **Audit log**.

---

# 12. Things not settled yet

Some questions have not yet been answered by the owner (Jason). For each one, the system does something sensible in the meantime, described below. When staff ask about one of these, the honest answer is: **this is what the system does today, and the policy is not settled yet. Ask Jason (for the policy) or Jefferson (for the system).** Nobody should treat what the system does today as the agreed policy.

The reference in brackets after each item (for example *N48*) is its number in Jefferson's list of open questions, so he can find it quickly.

## Money and deposits

### A guest has only part of the security deposit
**What the system does today:** a deposit that arrives short secures nothing. If a bank transfer for less than the deposit is confirmed, the money is recorded, but the booking stays **Awaiting payment** (not confirmed, the unit still held), no confirmation email is sent, and the guest cannot be checked in until the rest is topped up. There is no way to record part of the deposit in **cash** as the first payment. The system only records the full deposit in cash.
**Not settled:** whether a part-paid deposit should hold the unit and confirm the booking, and whether the desk may check someone in on a short deposit at its own discretion. *(N48)*

### A guest wants to pay the stay in instalments
**What the system does today:** the security deposit secures the booking, and the stay is paid either when booking or on arrival. There is no instalment plan for the stay. Jefferson has left this out of the first version unless Jason asks for it. *(N16)*

### A guest cancels: do we keep the BND 100 deposit?
**What the system does today:** whoever cancels (Front Office or Admin by default) chooses in the cancel dialog whether to keep the deposit or give it back, and keeping it is the default. It doesn't matter how far ahead the guest cancels: nothing in the system knows a notice period. Giving it back needs no second approval.
**Not settled:** whether a refund on cancellation should need Jason or Finance to approve it, and whether a guest who cancels well in advance (say a month out) should get the deposit back. *(N49, N45)*

### Is a kept deposit counted as income?
**What the system does today:** a deposit kept on a cancellation or no-show counts as revenue on the day it was kept, in its own **Kept deposits** column of the revenue report. It is not counted in the cash columns, so those still agree with the cash-up. The accountant has not confirmed this treatment. *(N32)*

### A guest owes more than their deposit and never pays
**What the system does today:** the amount stays on the Deposits ledger's "Owed by guests" figure indefinitely. Nothing in the system can write it off, and it can't be recorded as part-paid; it is either recorded as settled or it stays owed. *(N21)*

### Can Finance add a charge against a deposit?
**What the system does today:** no. By default Front Office raises charges, and Finance can only waive them and approve the release. *(N20)*

### Is there a limit on discounts?
**What the system does today:** there is no cap and no second approval. Anyone allowed to give discounts (Front Office and Admin by default) can discount up to the whole price, but must type a reason, and every discount is recorded in the booking's history. *(N17)*

### Confirming a payment of an unexpected amount
**What the system does today:** anyone who can verify payments can confirm an amount that differs from what is owed, as long as they type a reason. Nobody more senior has to approve it. *(N11)*

### Who records that the cash went to the bank, and who can see the cash-up?
**What the system does today:** recording a banking needs the Verify payments permission, and opening the cash-up needs View reports, so by default only Finance and Admin can do both. The office and the guard take cash but cannot open the cash-up. *(N26)*

### Is the security-deposit cash part of the day's cash count?
**What the system does today:** no. The day's total counts cash taken for stays and day passes; deposits taken in cash that day are shown on their own line beside the total, so the person counting the drawer knows why it holds more. *(N27)*

### How often is cash banked?
**What the system does today:** it assumes cash is not banked every day. The cash-up keeps a running balance, and one banking entry can clear several days' takings. *(N28)*

### Who can rebuild an accounting pack?
**What the system does today:** anyone with Verify payments (Front Office, Finance, Admin by default) sees **Rebuild now**. *(N25)*

## Bookings and prices

### A party is bigger than the unit's maximum
**What the system does today:** by default the extra guests are charged BND 7 per person per night rather than refused. (An Admin can switch this to refuse such bookings in Property settings.) For the 2-bedroom, the maximum is treated as six people however they are made up, not "4 adults + 2 children". *(N2, N2b)*

### Are babies and toddlers free?
**What the system does today:** for a day pass, under-1s are free. For a stay, children aged 3 and under are not counted, in every unit type including the semi-detached. Neither has been confirmed by the owner. *(N3, N15)*

### Early check-in
**What the system does today:** early check-in is not offered or charged anywhere, even though Property settings has an hourly rate for it. Whether to allow it, and whether to charge BND 10 an hour, is Jason's decision. *(N31)*

### Changing a booking after the guest has checked in
**What the system does today:** a checked-in booking's dates, unit and extras can't be edited. The number of people can: **Change** beside **Party** on the booking page works after check-in, and charges any extra guests above the unit type's maximum for every night of the booking. A guest who wants to stay longer gets a **second booking** for the extra nights, with the deposit waived because it is already held. A guest who leaves early is checked out, but the nights they didn't use stay blocked. *(N12, N53)*

### If we raise a rate, do existing bookings change?
**What the system does today:** no. A booking keeps the price it was quoted, unless it is edited later: an edit reprices it at the current rates. Changing only the party (**Change** beside **Party**) keeps the nights and extras at their quoted prices, but charges any extra guests at the current extra-guest rate. *(N33)*

### Which unit does an online booking get?
**What the system does today:** the system picks the free unit of the chosen type with the lowest reference. The customer is told the type, not the door, in their emails. (Their booking page does show the unit.) The office can move the booking to another unit by editing it. Guests can't choose a bed setup. *(N36, N9)*

### How many unpaid online bookings can one customer hold?
**What the system does today:** three per phone number at a time, plus limits on how many booking attempts can be made in an hour. Staff bookings are not limited. *(N37)*

### Does anyone chase an online booking that is never paid?
**What the system does today:** no. Nothing reminds the customer, and the unit stays held until the office cancels the booking. Bookings **Awaiting payment** sit in the Verification queue, oldest first; bookings still **Held** (the customer never pressed "I have made the transfer") are not in the queue and are found on **All bookings** with the **Held** status ticked. *(N38)*

### When can someone be marked a no-show?
**What the system does today:** from the day they were due to arrive (never before). The unused nights go straight back on sale and the deposit is kept. It is final: a guest marked a no-show who turns up later needs a new booking. *(N50)*

## The building

### How many 2-bedroom units are there?
**What the system does today:** none are set up, so no 2-bedroom can be booked and the website doesn't offer one. Once the number is known, an Admin types it into the Unit registry. *(N1)*

### What are the units called on the doors?
**What the system does today:** the unit names (such as 3B-01) are placeholders. An Admin can rename them in the Unit registry once the real door labels are known. *(N10)*

### How many sofa beds are there?
**What the system does today:** the stock is blank, which means unlimited. Once someone counts them and types the number in Property settings → Extras, the system stops more being booked than exist. *(N8)*

### What does the day pass admit, and how many visitors a day?
**What the system does today:** the day pass admits whichever facilities are ticked in Property settings → Day pass (as set up: the pool, the water park and the playroom are included; the gym, the billiard room, the BBQ area and the sauna are not). The owner confirmed the pool and playroom in and the gym, billiard room and BBQ out; the water park and the sauna were never confirmed either way. No capacity has been agreed, so no day is limited. *(C1, C2, C8)*

### Can staying guests use the pool and water park?
**Not settled.** The system says nothing about it, and the website FAQ leaves the question out until it is answered. *(N44)*

### House rules (pets, smoking, visitors)
**Not settled.** There are no house rules in the system or on the website yet. *(N46)*

### Parking
**What the system does today:** the booking forms show how many car spaces the unit type comes with. On the public website a customer cannot enter more cars than that; they are asked to message the office on WhatsApp first. Staff's booking forms only warn and still save extra cars. The total number of bays is not known. *(R3)*

## Staff and access

### Should a unit that isn't marked ready stop the next check-in?
**What the system does today:** no. "Ready" is shown on the Units board and the phones, and the gate warns when a unit is not marked ready, but it never blocks check-in or selling. *(N53)*

### Should the guard be able to see the office's booking list?
**What the system does today:** yes. The Security role can see bookings, so a guard can open the booking register (including guests' phone numbers) by going to it directly, and can open the Cash payments screen. *(N52)*

### Who can read the audit log or download all the data?
**What the system does today:** Admin only. Finance can't. Downloading data is not itself recorded anywhere. *(N34, N35)*

### Who can add or remove a guest's IC, as opposed to viewing it?
**What the system does today:** attaching or removing an IC needs the Edit bookings permission (Front Office and Admin by default); opening one needs View identity documents. Anyone who can see a booking can see that an IC is on file. *(N23)*

### How long is a cancelled booking's IC kept?
**What the system does today:** the retention period counts from the check-out date of the stay the guest didn't take. *(N22)*

## Emails and the website

### Where do replies to the system's emails go?
**What the system does today:** nowhere anyone reads. The emails come from a no-reply address and tell the guest to call or WhatsApp. *(N41)*

### What happens if an email bounces?
**What the system does today:** the failure is recorded in the booking's history and raises a notification on the bell. There is no resend button; the office contacts the guest another way (for example WhatsApp). *(N43)*

### How many times can someone try Find your booking?
**What the system does today:** ten tries an hour from one connection, and ten a day for one booking reference. After that, even correct details get the same "could not find" answer until the limit resets. *(N47)*

### Photos of people on the website, and the privacy policy
**Not settled:** whose permission is needed before publishing a photo where someone can be recognised, and whether the privacy policy's wording and Data Protection Officer have been approved. The system lets staff do both but doesn't decide these. *(R4, R5)*

---

# 13. Glossary

Words the system and this guide use, grouped by topic. Where a word means different things in different places (for example **Held**), each meaning is listed separately.

## Bookings and statuses

- **Awaiting payment** (booking status, amber): the unit is reserved while a bank transfer waits to be checked, or while a deposit is still short. It is not confirmed yet.
- **Booking**: one stay in a unit, or one day pass. Every booking has a reference.
- **Booking reference**: "PV-" and a number, for example PV-4823. It never changes and is never reused. The guest quotes it at the gate and in the transfer description, and it is how a transfer is matched to the booking.
- **Cancelled** (booking status, red): called off before arrival. The unit is released straight away. Final.
- **Change the party**: the **Change** button beside **Party** on a booking's page, for staff with Edit bookings. It changes how many people a stay or day pass is for — even after check-in, never on a closed booking — and prices only that change. The history reads "Party changed — 5 → 7".
- **Checked in** (booking status, teal): the guest has the keys and is in the unit.
- **Check in / check out**: the moves that start and end a stay. Neither takes any money. Check-in needs the security deposit held in full.
- **Closed booking**: a booking that is Completed, Cancelled or No show. It can't be edited, reopened or moved.
- **Completed** (booking status, grey): a stay that has checked out, or a day pass that has been admitted. Final.
- **Confirmed** (booking status, green): the booking is secured, by the security deposit held in full (for a stay) or by being paid (for a day pass, or a stay with no deposit). The entry QR code is issued at this moment. A confirmed stay can still owe money for the stay itself.
- **Day pass**: a booking to use the facilities on one day, with no unit, no deposit and no check-in. Sold only on the website. It is **admitted** at the gate, which closes it.
- **Draft** (booking status): a booking not yet held. Nothing leaves a booking in Draft today, so you shouldn't see it.
- **Edit (amend)**: changing a booking's dates, unit, guests, extras, late check-out, name, phone, vehicles or discount before check-in. Every edit reprices the booking at today's rates. On screen the button is always **Edit**. (Only the number of people can be changed after check-in, with **Change the party**.)
- **Expired** (booking status): meant for a hold that ran out. Holds never run out today, so you shouldn't see it.
- **Extra guests (at the gate)**: more people in the car than the booking is for. The guard reports them with **Extra** on the Gate card; the office changes the party.
- **Held** (booking status, grey): the unit or day-pass place is reserved for a guest who has not paid and has not said they transferred. A website booking starts here, and so does a desk booking left for the guard to collect ("At the gate"). It never runs out; the office has to confirm it or cancel it. Held bookings don't appear in the Verification queue: find them on All bookings with the Held filter.
- **Hold**: a unit blocked by a booking that hasn't been paid for (Held or Awaiting payment). Holds never expire.
- **No show** (booking status, red): the guest never arrived. The deposit is kept, and the unused nights go back on sale. Final.
- **Short stay**: a booking for one or more nights in a unit. The only kind of booking staff can create on New booking.
- **Stream / Type**: what was sold: Short stay, Day pass or Tenancy.

## Money

- **At the gate** (payment choice on New booking): a stay starting today, booked by the office with nothing taken, for the guard to collect the deposit and the stay in cash when the guest arrives.
- **Balance / Outstanding**: what a booking still owes for the stay: the total minus the stay payments that have been confirmed. The security deposit is separate and never part of it.
- **Banking**: a record that cash was taken to the bank, entered under the day it went to the bank. It can't be edited or deleted.
- **Cash on hand**: the running balance, on the Daily cash-up, of cash taken for stays and day passes and not yet banked. Deposit cash is not included.
- **Charge**: an amount deducted from a security deposit for damage or something missing, with a reason. It can't be edited or deleted, only waived.
- **Confirm (a transfer)**: saying you have seen the money arrive in the bank. Needs the Verify payments permission, which the guard doesn't have.
- **Daily cash-up**: the Finance screen that reconciles each day's cash taken with what was banked.
- **Discount**: money taken off a stay's price, as an amount or a percentage, with a reason. Never applied to the security deposit.
- **Everything now / Just the deposit**: the two ways a customer can pay online for a stay: the deposit and the stay together, or only the deposit now and the stay on arrival.
- **Kept deposit**: a security deposit forfeited when a booking is cancelled (and the office chose to keep it) or marked a no-show. It counts as revenue on the day it was kept.
- **Overpaid by**: more has been paid than the booking's total. The difference is refunded outside the system.
- **Owed by guest**: how much the charges on a deposit exceed the deposit itself. It stays on the Deposits ledger until recorded as settled.
- **Paid in full**: nothing outstanding on the booking. A day pass must be paid in full before it can be admitted.
- **Record as settled**: recording that a guest paid the whole amount they owed beyond their deposit.
- **Release (approve release)**: the recorded decision of how much of a deposit goes back to the guest, after check-out and inspection. By default Finance or Admin approves it. It can't be undone. The money itself is handed back outside the system.
- **Security deposit**: the refundable amount (BND 100 by default) that secures a stay booking. It is separate from the stay's price, never discounted, and given back after check-out and inspection, less any charges.
- **Short deposit**: a deposit where less arrived than the booking quotes. It secures nothing: the booking isn't confirmed and the guest can't be checked in until it is topped up.
- **Statement**: the printable deposit statement for the guest, available after the release is approved.
- **Top up**: adding the missing part of a short deposit.
- **Transfer slip**: the customer's screenshot of their bank transfer. It's evidence, not proof; the office still checks the bank.
- **Verification queue**: the screen listing bank transfers waiting to be checked against the bank, oldest first.
- **Waive (a charge)**: dropping a charge from a deposit, with a reason. It stays visible, struck through, but no longer counts.
- **Waive (the security deposit)**: making a booking without a deposit, with a reason; normally because the guest's deposit is already held on another booking (an extension). Only possible when the booking is created.

## Deposit stages (the badge on the Deposits screen)

A deposit's stage is worked out by the system and only moves forward.

- **Transfer awaited**: a deposit transfer has been promised but nobody has confirmed it in the bank. Nothing is held yet.
- **Held before arrival**: the deposit money is in, and the guest hasn't arrived. (Not the same as the booking status **Held**, which means nothing has been paid.)
- **Guest in stay**: the guest is checked in.
- **Awaiting inspection**: the guest has checked out, and the unit hasn't been inspected yet.
- **Ready to release**: the unit has been inspected, so the release can be approved.
- **Released**: the release has been approved (or the deposit was given back on a cancellation). The money is handed back outside the system.
- **Kept**: forfeited on a cancellation (when the office chose to keep it) or a no-show. It counts as revenue.
- **Never received**: a promised deposit transfer that was never confirmed before the booking closed.

"Owed" is not a stage: a guest owing more than their deposit shows on the deposit's page and in the **Owed by guests** figure.

## Units and the building

- **Awaiting inspection** (unit status): the last guest has checked out and no inspection has been recorded.
- **Available** (unit status): nothing covers the unit today and no turnover is under way. A unit booked from tomorrow still shows Available today.
- **Booked** (unit status, green): a confirmed booking covers the unit today and the guest hasn't checked in yet.
- **Cleaning** (unit status): the unit has been inspected but not yet marked ready.
- **Held** (unit status, amber): a booking that isn't confirmed yet (Held or Awaiting payment) covers the unit today. The unit is still kept for that booking.
- **Extra**: an optional item a stay can add (for example a sofa bed), charged once per stay, not per night.
- **Inspection**: housekeeping's permanent record of how a unit was found after check-out (Clean or Issues found), with notes and photos. It can't be changed afterwards.
- **Lease / long-term let**: a unit let to a tenant, recorded on the unit's page with the tenant's name, a start date and an optional end date. It blocks the unit from being booked. Rent isn't tracked.
- **Leased** (unit status): a long-term tenant has the unit today.
- **Mark ready**: housekeeping's final step saying the unit is clean after a stay. Information only: it never blocks check-in or selling.
- **Occupied** (unit status): a guest is checked in.
- **Out of service** (unit status): taken out of use by staff, with a reason. It can't be booked until returned to service.
- **Stock**: how many of an extra the property owns. Blank means not counted, and not limited.
- **Turnover**: the work between one guest leaving and the unit being ready: check-out, inspection, cleaning, mark ready.
- **Unit**: one apartment or semi-detached house, known by its reference (for example 3B-04).
- **Unit registry**: the Admin screen for naming units and setting how many of each type exist.
- **Unit type**: 2-bedroom, 3-bedroom, 4-bedroom or Semi-detached. It carries the nightly rate, the guest maximum and the car spaces (the most cars a customer can enter when booking online).

## Screens and tools

- **Audit log**: the permanent record of every recorded change: who, when, what. Admin only by default.
- **Dashboard**: the portal's home screen: today's arrivals and departures, and what is waiting.
- **Departures**: housekeeping's phone screen: guests leaving today, units to inspect, and units being cleaned.
- **Entry QR code (entry code)**: the code in the Confirmation email and on the customer's booking page. A guard who scans it gets the booking's gate card; anyone else sees only a masked summary. **Replace code** makes a new one and stops the old one working.
- **Field screens**: the phone screens for the gate (Gate) and housekeeping (Departures), at portal.bruneiapartment.com/field.
- **Find your booking**: the website page where a customer opens their booking with the reference and phone number.
- **Gate**: the guard's phone screen: today's arrivals, guests already in, guests leaving, day passes, and cash to take. A red card ("Payment not settled") is one whose money is not settled; **Extra** beside **Guests** reports more people than booked.
- **History**: the permanent record, on each booking's page, of everything that happened to it, who did it and when.
- **Accounting pack**: the PDF the system builds for each booking for the accountant, once it has at least one confirmed payment. It is built when money is recorded or verified, and rebuilt overnight when something changes.
- **Identity document (IC)**: the guest's IC or passport copy, stored privately on the booking and deleted automatically after the retention period.
- **Live figure**: a figure in curly brackets in an FAQ answer, such as {security deposit}, which the website fills in from Property settings.
- **Note**: a permanent staff comment on a booking, either Internal (office only) or for Housekeeping (shown on the cleaner's phone).
- **Notifications (the bell)**: the portal's list of events that need attention, such as new online bookings, payments to verify, failed emails and extra guests reported at the gate.
- **Portal**: the staff system at portal.bruneiapartment.com.
- **Private link / the customer's booking page**: the customer's own page for one booking, opened from their email or through Find your booking. Anyone with the link can see it.
- **Property settings**: the Admin screen holding the rates, extras, day-pass prices and facilities, document retention periods and bank accounts.
- **Public site**: bruneiapartment.com, the customer website.
- **Retention period**: how long a kind of document is kept before it is deleted automatically.
- **System** (as the actor in a history or audit line): something no staff member did by hand, such as an automatic email, an automatic deletion, or something a customer did on the website.

## People and access

- **Account**: a staff member's sign-in (email and password), plus their name and roles.
- **Disabled account**: an account that can no longer sign in. Accounts that have done anything can't be deleted, only disabled.
- **Permission**: one thing a person may do, such as "Verify payments". Roles are bundles of permissions.
- **Role**: one of the five bundles of permissions: Admin, Front Office, Security, Housekeeping, Finance. A person can hold several.
- **Temporary password**: the password an Admin sets when creating or resetting an account, which the person then changes in Settings.
