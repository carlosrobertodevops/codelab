export const dynamic = 'force-dynamic'
export const revalidate = 0

import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return <SignIn signUpUrl="/auth/sign-up" />
}
