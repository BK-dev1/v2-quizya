'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Download,
    Calendar,
    Users,
    TrendingUp,
    AlertCircle,
    Loader2,
    Search
} from 'lucide-react'
import { toast } from 'sonner'

type StudentStats = {
    name: string
    email: string
    sessionsAttended: number
    totalSessions: number
    attendancePercentage: number
    lastAttended: string
}

type ModuleStats = {
    module: string
    totalSessions: number
    totalStudents: number
    averageAttendance: number
    studentsAbove75Percent: number
    studentsBelow50Percent: number
    students: StudentStats[]
    sessionDetails: {
        id: string
        startedAt: string
        endedAt: string | null
        isActive: boolean
        sectionGroup: string | null
        week: number | null
        sectionNum: number | null
        attendanceCount: number
    }[]
}

export default function ModuleStatsPage() {
    const params = useParams()
    const router = useRouter()
    const moduleName = decodeURIComponent(params.module as string)

    const [stats, setStats] = useState<ModuleStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [minAttendance, setMinAttendance] = useState<number>(0)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [exporting, setExporting] = useState(false)

    const loadStats = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)

            const res = await fetch(`/api/attendance/modules/${encodeURIComponent(moduleName)}/stats?${params}`)

            if (res.ok) {
                const data = await res.json()
                setStats(data)
            } else {
                toast.error('Failed to load statistics')
            }
        } catch (error) {
            console.error('Error loading stats:', error)
            toast.error('Error loading statistics')
        } finally {
            setLoading(false)
        }
    }, [moduleName, startDate, endDate])

    useEffect(() => {
        loadStats()
    }, [loadStats])

    const handleExport = async () => {
        setExporting(true)
        try {
            const params = new URLSearchParams()
            if (startDate) params.append('startDate', startDate)
            if (endDate) params.append('endDate', endDate)

            const res = await fetch(`/api/attendance/modules/${encodeURIComponent(moduleName)}/export?${params}`)

            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `attendance_${moduleName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Attendance exported successfully')
            } else {
                toast.error('Failed to export attendance')
            }
        } catch (error) {
            console.error('Error exporting:', error)
            toast.error('Error exporting attendance')
        } finally {
            setExporting(false)
        }
    }

    // Filtered students based on search and attendance threshold
    const filteredStudents = useMemo(() => {
        if (!stats) return []

        return stats.students.filter(student => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.email.toLowerCase().includes(searchTerm.toLowerCase())

            const matchesAttendance = student.attendancePercentage >= minAttendance

            return matchesSearch && matchesAttendance
        })
    }, [stats, searchTerm, minAttendance])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!stats) {
        return (
            <div className="container mx-auto p-6">
                <NeuCard className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No data found</h3>
                    <p className="text-muted-foreground mb-4">
                        No attendance sessions found for this module
                    </p>
                    <NeuButton onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </NeuButton>
                </NeuCard>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <NeuButton
                    variant="outline"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4" />
                </NeuButton>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{moduleName}</h1>
                    <p className="text-muted-foreground mt-1">Attendance Statistics</p>
                </div>
                <NeuButton onClick={handleExport} disabled={exporting}>
                    {exporting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Exporting...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Export to CSV
                        </>
                    )}
                </NeuButton>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-blue-100">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Sessions</p>
                            <p className="text-2xl font-bold">{stats.totalSessions}</p>
                        </div>
                    </div>
                </NeuCard>

                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-green-100">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                            <p className="text-2xl font-bold">{stats.totalStudents}</p>
                        </div>
                    </div>
                </NeuCard>

                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-purple-100">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Average Attendance</p>
                            <p className="text-2xl font-bold">{stats.averageAttendance}%</p>
                        </div>
                    </div>
                </NeuCard>

                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-amber-100">
                            <AlertCircle className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Below 50%</p>
                            <p className="text-2xl font-bold">{stats.studentsBelow50Percent}</p>
                        </div>
                    </div>
                </NeuCard>
            </div>

            {/* Filters */}
            <NeuCard className="p-6">
                <div className="grid gap-4 md:grid-cols-4">
                    <div>
                        <Label>Search Students</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <NeuInput
                                placeholder="Name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    <div>
                        <Label>Min Attendance %</Label>
                        <NeuInput
                            type="number"
                            min="0"
                            max="100"
                            value={minAttendance}
                            onChange={(e) => setMinAttendance(parseInt(e.target.value) || 0)}
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <Label>Start Date</Label>
                        <NeuInput
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <Label>End Date</Label>
                        <NeuInput
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                {(startDate || endDate) && (
                    <div className="mt-4">
                        <NeuButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setStartDate('')
                                setEndDate('')
                            }}
                        >
                            Clear Filters
                        </NeuButton>
                    </div>
                )}
            </NeuCard>

            {/* Students Table */}
            <NeuCard className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    Student Attendance ({filteredStudents.length} students)
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-3 font-semibold">Student Name</th>
                                <th className="text-left p-3 font-semibold">Email</th>
                                <th className="text-center p-3 font-semibold">Sessions Attended</th>
                                <th className="text-center p-3 font-semibold">Total Sessions</th>
                                <th className="text-center p-3 font-semibold">Attendance %</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student, index) => (
                                <tr key={student.email} className="border-b hover:bg-muted/50">
                                    <td className="p-3">{student.name}</td>
                                    <td className="p-3 text-muted-foreground">{student.email}</td>
                                    <td className="p-3 text-center">{student.sessionsAttended}</td>
                                    <td className="p-3 text-center">{student.totalSessions}</td>
                                    <td className="p-3 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${student.attendancePercentage >= 75
                                                ? 'bg-green-100 text-green-700'
                                                : student.attendancePercentage >= 50
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                            {student.attendancePercentage}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No students match the current filters
                        </div>
                    )}
                </div>
            </NeuCard>
        </div>
    )
}
