'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function AuthForgotPassword() {
    const { forgotPassword } = useAuth()
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            toast.error(t('emailRequired'))
            return
        }

        setIsLoading(true)
        try {
            const { error } = await forgotPassword(email)
            if (error) {
                toast.error(error)
            } else {
                setIsSent(true)
                toast.success(t('resetLinkSent'))
            }
        } catch (err) {
            toast.error(t('errorOccurred'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4">
            <NeuCard className="w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold mb-2">{t('forgotPasswordTitle')}</h1>
                    <p className="text-muted-foreground">{t('forgotPasswordDesc')}</p>
                </div>

                {isSent ? (
                    <div className="text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Mail className="h-8 w-8" />
                            </div>
                        </div>
                        <p className="font-medium text-green-600">{t('resetLinkSent')}</p>
                        <NeuButton asChild className="w-full">
                            <Link href="/auth/login">{t('returnToSignIn')}</Link>
                        </NeuButton>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('emailAddress')}
                            </label>
                            <NeuInput
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('enterEmail')}
                                required
                            />
                        </div>

                        <NeuButton
                            type="submit"
                            disabled={isLoading}
                            className="w-full"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {t('sendingResetLink')}
                                </>
                            ) : (
                                t('sendResetLink')
                            )}
                        </NeuButton>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                            >
                                {t('backToHome')}
                            </Link>
                        </div>
                    </form>
                )}
            </NeuCard>
        </div>
    )
}
