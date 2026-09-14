'use client'

import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

/**
 * The header's one lagoon fill: Book, opening onto the two things a customer
 * can book online.
 *
 * It replaced "Book a stay" (Jeff, 14 September 2026), which sent a family
 * looking for a day pass to an apartment calendar — and on a phone the header
 * carried no booking action at all, because the buttons were hidden below
 * 640px. A menu of two lets one button stand for both at every width, which is
 * what keeps the header to two actions a phone can fit.
 *
 * Each option carries a line saying what it is, because "Day pass" is this
 * business's word for something a first-time visitor may not know it sells.
 * The lines name no facility and no figure: both are settings, and a header is
 * not where a price that can change should be written.
 */
export function BookMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="group px-md sm:px-lg">
          Book
          <ChevronDown
            aria-hidden
            className="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <BookMenuItem href="/day-pass" title="Day pass" detail="Use the facilities for the day" />
        <BookMenuItem href="/stay" title="Stay" detail="An apartment, by the night" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BookMenuItem({
  href,
  title,
  detail,
}: {
  href: '/day-pass' | '/stay'
  title: string
  detail: string
}) {
  return (
    <DropdownMenuItem asChild className="flex-col items-start gap-xxs py-sm">
      <Link href={href}>
        <span className="text-body-sm-strong text-foreground">{title}</span>
        <span className="text-caption text-muted-foreground">{detail}</span>
      </Link>
    </DropdownMenuItem>
  )
}
