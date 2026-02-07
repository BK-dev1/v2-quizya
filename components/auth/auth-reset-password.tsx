'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function AuthResetPassword() {
    const router = useRouter()
    const { resetPassword } = useAuth()
    const { t } = useTranslation()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!password || !confirmPassword) {
            toast.error(t('pleaseFillAllFields'))
            return
        }

        if (password.length < 6) {
            toast.error(t('passwordLength'))
            return
        }

        if (password !== confirmPassword) {
            toast.error(t('passwordsDontMatch'))
            return
        }

        setIsLoading(true)
        try {
            const { error } = await resetPassword(password)
            if (error) {
                toast.error(error)
            } else {
                toast.success(t('passwordUpdated'))
                router.push('/auth/login?verified=true&message=' + encodeURIComponent(t('passwordUpdated')))
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
                    <h1 className="text-2xl font-bold mb-2">{t('resetPassword')}</h1>
                    <p className="text-muted-foreground">{t('newPassword')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('newPassword')}
                        </label>
                        <div className="relative">
                            <NeuInput
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('enterPassword')}
                                className="pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('confirmNewPassword')}
                        </label>
                        <NeuInput
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('confirmYourPassword')}
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
                                {t('updatingPassword')}
                            </>
                        ) : (
                            t('resetPassword')
                        )}
                    </NeuButton>
                </form>
            </NeuCard>
        </div>
    )
}
