export const dynamic = 'force-dynamic'
export const revalidate = 0

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return <SignUp signInUrl="/auth/sign-in" />
}
