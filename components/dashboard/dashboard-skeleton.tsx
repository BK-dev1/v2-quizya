import { Skeleton } from "@/components/ui/skeleton"
import { NeuCard } from "@/components/ui/neu-card"

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="mb-8 space-y-3">
                    <Skeleton className="h-10 w-[300px]" />
                    <Skeleton className="h-5 w-[400px]" />
                </div>

                {/* Stats Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <NeuCard key={i} className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                            </div>
                        </NeuCard>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>

                {/* List Skeleton */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <NeuCard key={i} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 w-full max-w-2xl">
                                    <Skeleton className="h-6 w-1/3" />
                                    <Skeleton className="h-4 w-2/3" />
                                    <div className="flex gap-4">
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-20" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 w-20" />
                                    <Skeleton className="h-9 w-20" />
                                </div>
                            </div>
                        </NeuCard>
                    ))}
                </div>
            </div>
        </div>
    )
}
