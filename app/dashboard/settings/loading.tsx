import { NeuCard } from "@/components/ui/neu-card"

export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <div className="h-8 w-32 rounded-lg neu-flat animate-pulse" />
        <div className="h-4 w-48 rounded-lg neu-flat animate-pulse mt-2" />
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <NeuCard className="lg:w-64 p-2 shrink-0">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl neu-flat animate-pulse" />
            ))}
          </div>
        </NeuCard>

        <NeuCard className="flex-1 p-6">
          <div className="h-6 w-40 rounded-lg neu-flat animate-pulse mb-6" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-xl neu-flat animate-pulse" />
            ))}
          </div>
        </NeuCard>
      </div>
    </div>
  )
}
