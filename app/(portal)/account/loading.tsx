import { FormScreenSkeleton } from '@/components/portal/page-skeletons'

export default function Loading() {
  return <FormScreenSkeleton title="Settings" label="your account" fields={4} />
}
