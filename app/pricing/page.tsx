"use client"

import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { useTranslation } from "react-i18next"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle, NeuCardDescription } from "@/components/ui/neu-card"
import { Check } from "lucide-react"

export default function PricingPage() {
    const { t } = useTranslation()

    const tiers = [
        {
            name: t('free'),
            price: "$0",
            description: t('freeDesc'),
            features: [
                t('basicProctoring'),
                t('realTimeResults'),
                t('communitySupport'),
                t('unlimitedExams'),
                t('advancedProctoring', { defaultValue: 'Advanced proctoring' }),
            ],
            buttonText: t('getStarted'),
            variant: "primary" as const,
            isMVP: true,
        },
        {
            name: t('pro'),
            price: "$19",
            description: t('proDesc'),
            features: [
                t('unlimitedExams'),
                t('advancedProctoring'),
                t('customBranding'),
                t('prioritySupport'),
                t('detailedAnalytics'),
            ],
            buttonText: t('comingSoon'),
            variant: "outline" as const,
            disabled: true,
        },
        {
            name: t('enterprise'),
            price: "Custom",
            description: t('enterpriseDesc'),
            features: [
                t('everythingInPro'),
                t('ssoIntegration'),
                t('dedicatedManager'),
                t('customSLA'),
                t('onPremiseOption'),
            ],
            buttonText: t('contactSales', { defaultValue: 'Contact Sales' }),
            variant: "outline" as const,
            disabled: true,
        },
    ]

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                                {t('simplePricing')}
                            </h1>
                            <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
                                {t('pricingSubheading')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {tiers.map((tier) => (
                                <NeuCard
                                    key={tier.name}
                                    className={`relative flex flex-col h-full ${tier.isMVP ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''} ${tier.disabled ? 'opacity-60 grayscale-[0.5]' : ''}`}
                                >
                                    {tier.isMVP && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                                            {t('mvpBadge')}
                                        </div>
                                    )}
                                    <NeuCardHeader>
                                        <NeuCardTitle className="text-2xl">{tier.name}</NeuCardTitle>
                                        <div className="flex items-baseline gap-1 pt-2">
                                            <span className="text-4xl font-bold">{tier.price}</span>
                                            {tier.price !== "Custom" && tier.price !== t('custom', { defaultValue: 'Custom' }) && (
                                                <span className="text-muted-foreground">/mo</span>
                                            )}
                                        </div>
                                        <NeuCardDescription className="pt-2">{tier.description}</NeuCardDescription>
                                    </NeuCardHeader>
                                    <NeuCardContent className="flex-1 flex flex-col space-y-6">
                                        <ul className="space-y-3 flex-1">
                                            {tier.features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-3 text-sm">
                                                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        <NeuButton
                                            variant={tier.variant}
                                            className="w-full h-12 text-base font-bold"
                                            disabled={tier.disabled}
                                        >
                                            {tier.buttonText}
                                        </NeuButton>
                                    </NeuCardContent>
                                </NeuCard>
                            ))}
                        </div>

                        {/* <div className="mt-20 p-8 rounded-2xl bg-muted/50 border border-border text-center space-y-4">
                            <h2 className="text-2xl font-bold">{t('needMore', { defaultValue: 'Need a custom solution?' })}</h2>
                            <p className="max-w-xl mx-auto text-muted-foreground">
                                {t('customContact', { defaultValue: "We offer special discounts for non-profits and educational institutions. Contact our team to discuss your specific requirements." })}
                            </p>
                            <NeuButton variant="secondary" className="text-primary font-bold">
                                {t('contactUs', { defaultValue: 'Contact Us' })}
                            </NeuButton>
                        </div> */}
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
