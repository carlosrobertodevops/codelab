'use client'

import 'react-credit-cards-2/dist/es/styles-compiled.css'

import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { ArrowRight, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import PixIcon from '@/assets/pix.svg'
import { CreditCardForm } from './credit-card'
import { PixForm } from './pix'

type CheckoutDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  course: Course
}

type PaymentMethod =
  | {
      label: string
      value: 'PIX'
      iconType: 'image'
      icon: any // SVG import (vira URL/obj dependendo do bundler)
    }
  | {
      label: string
      value: 'CREDIT_CARD'
      iconType: 'component'
      icon: React.ComponentType<{ className?: string }>
    }

const paymentMethods: PaymentMethod[] = [
  {
    label: 'Pix',
    value: 'PIX',
    iconType: 'image',
    icon: PixIcon,
  },
  {
    label: 'Cartão de crédito',
    value: 'CREDIT_CARD',
    iconType: 'component',
    icon: CreditCard,
  },
]

export const CheckoutDialog = ({
  open,
  setOpen,
  course,
}: CheckoutDialogProps) => {
  const { user } = useUser()

  const pathname = usePathname()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>(
    'PIX'
  )

  const handleContinue = () => {
    if (!user) {
      toast.info('Faça login ou crie uma conta para prosseguir com a compra')
      router.push(`/auth/sign-in?redirect_url=${pathname}?checkout=true`)
      return
    }

    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      setOpen={setOpen}
      height="95vh"
      title="Concluir compra"
      preventOutsideClick
      content={
        <div className="pt-4">
          {step === 1 && (
            <div className="flex flex-col">
              <h2 className="mb-3">Métodos de pagamento</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.value}
                    variant="outline"
                    onClick={() => setPaymentMethod(method.value)}
                    className={cn(
                      'h-auto w-full flex items-center p-4 justify-center gap-3 rounded-xl text-lg font-semibold disabled:opacity-50',
                      paymentMethod === method.value &&
                        '!bg-primary/10 text-primary !border-primary hover:text-primary'
                    )}
                  >
                    {method.iconType === 'component' ? (
                      (() => {
                        const Icon = method.icon
                        return <Icon className="w-6 min-w-6 h-6 min-h-6" />
                      })()
                    ) : (
                      <Image
                        // Em Next, import de SVG sem SVGR geralmente vira URL/objeto.
                        // next/image aceita string; se vier objeto, pegamos .src.
                        src={(method.icon?.src ?? method.icon) as string}
                        alt={method.label}
                        width={24}
                        height={24}
                        className="w-6 min-w-6 h-6 min-h-6"
                      />
                    )}

                    {method.label}
                  </Button>
                ))}
              </div>

              <Button className="ml-auto mt-6" onClick={handleContinue}>
                Continuar
                <ArrowRight />
              </Button>
            </div>
          )}

          {step === 2 && paymentMethod === 'CREDIT_CARD' && (
            <CreditCardForm
              onBack={handleBack}
              course={course}
              onClose={handleClose}
            />
          )}

          {step === 2 && paymentMethod === 'PIX' && (
            <PixForm
              onBack={handleBack}
              course={course}
              onClose={handleClose}
            />
          )}
        </div>
      }
    />
  )
}
