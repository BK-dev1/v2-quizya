"use client"

import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { useTranslation } from "react-i18next"
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card"
import { Users, Target, ShieldCheck, Zap } from "lucide-react"

export default function AboutPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <section className="py-20 px-4 bg-muted/30">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
                            {t('aboutQuizya')}
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            {t('aboutDescription')}
                        </p>
                    </div>
                </section>

                <section className="py-20 px-4">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-bold">{t('ourMission')}</h2>
                            <p className="text-lg text-muted-foreground">
                                {t('missionText')}
                            </p>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <div className="text-2xl font-bold text-primary">20+</div>
                                    <div className="text-sm text-muted-foreground">{t('examsCreated')}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <div className="text-2xl font-bold text-primary">10+</div>
                                    <div className="text-sm text-muted-foreground">{t('students')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <NeuCard className="bg-background">
                                <NeuCardHeader>
                                    <Users className="w-8 h-8 text-primary mb-2" />
                                    <NeuCardTitle>{t('integrityFirst')}</NeuCardTitle>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {t('integrityFirstText')}
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                            <NeuCard className="bg-background">
                                <NeuCardHeader>
                                    <Zap className="w-8 h-8 text-primary mb-2" />
                                    <NeuCardTitle>{t('userCentric')}</NeuCardTitle>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {t('userCentricText')}
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                            <NeuCard className="bg-background">
                                <NeuCardHeader>
                                    <ShieldCheck className="w-8 h-8 text-primary mb-2" />
                                    <NeuCardTitle>{t('secureScale')}</NeuCardTitle>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {t('secureScaleText')}
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                            <NeuCard className="bg-background">
                                <NeuCardHeader>
                                    <Target className="w-8 h-8 text-primary mb-2" />
                                    <NeuCardTitle>{t('innovation')}</NeuCardTitle>
                                </NeuCardHeader>
                                <NeuCardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {t('innovationText')}
                                    </p>
                                </NeuCardContent>
                            </NeuCard>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    )
}
