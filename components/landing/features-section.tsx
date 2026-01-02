"use client"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent } from "@/components/ui/neu-card"
import { FileEdit, Shield, BarChart3, Clock, QrCode, Shuffle, Users, Lock } from "lucide-react"
import { useTranslation } from 'react-i18next'

export function FeaturesSection() {
  const { t } = useTranslation()

  const features = [
    {
      icon: FileEdit,
      title: t('examBuilder'),
      description: t('examBuilderDesc'),
    },
    {
      icon: Shield,
      title: t('advancedProctoring'),
      description: t('advancedProctoringDesc'),
    },
    {
      icon: BarChart3,
      title: t('realTimeAnalytics'),
      description: t('realTimeAnalyticsDesc'),
    },
    {
      icon: Clock,
      title: t('flexibleTiming'),
      description: t('flexibleTimingDesc'),
    },
    {
      icon: QrCode,
      title: t('easyAccess'),
      description: t('easyAccessDesc'),
    },
    {
      icon: Shuffle,
      title: t('randomization'),
      description: t('randomizationDesc'),
    },
    {
      icon: Users,
      title: t('liveMonitoring'),
      description: t('liveMonitoringDesc'),
    },
    {
      icon: Lock,
      title: t('securePrivate'),
      description: t('securePrivateDesc'),
    },
  ]

  return (
    <section className="py-20 px-4" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold">
            {t('featuresHeading')}
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            {t('featuresDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <NeuCard key={feature.title} className="group hover:scale-[1.02] transition-transform duration-200">
              <NeuCardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <NeuCardTitle className="text-lg">{feature.title}</NeuCardTitle>
              </NeuCardHeader>
              <NeuCardContent>
                <NeuCardDescription className="text-sm">{feature.description}</NeuCardDescription>
              </NeuCardContent>
            </NeuCard>
          ))}
        </div>
      </div>
    </section>
  )
}