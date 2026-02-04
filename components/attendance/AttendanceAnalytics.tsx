'use client'

import { useState, useEffect } from 'react'
import {
    Users,
    Search,
    Download,
    CheckCircle2,
    XCircle,
    BarChart2,
    TrendingUp,
    Mail
} from 'lucide-react'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface StudentAnalytics {
    studentId: string
    name: string
    email: string
    totalAttended: number
    attendanceRate: number
    sessionHistory: Array<{
        sessionId: string
        sessionName: string
        date: string
        attended: boolean
    }>
}

export default function AttendanceAnalytics() {
    const [data, setData] = useState<StudentAnalytics[]>([])
    const [totalSessions, setTotalSessions] = useState(0)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchAnalytics()
    }, [])

    const fetchAnalytics = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/attendance/analytics')
            if (res.ok) {
                const result = await res.json()
                setData(result.analytics || [])
                setTotalSessions(result.totalSessions || 0)
            }
        } catch (error) {
            toast.error('Failed to load analytics')
        } finally {
            setLoading(false)
        }
    }

    const filteredData = data.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const exportAnalytics = () => {
        const headers = ['Student Name', 'Email', 'Attended', 'Total Sessions', 'Rate (%)']
        const rows = filteredData.map(s => [
            s.name,
            s.email || 'N/A',
            s.totalAttended.toString(),
            totalSessions.toString(),
            s.attendanceRate.toFixed(1)
        ])

        const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `attendance_analytics_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Analysing semester attendance...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <NeuCard className="p-6 bg-primary/5 border-primary/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/20 rounded-xl text-primary">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Average Attendance</p>
                            <h3 className="text-2xl font-black">
                                {data.length > 0
                                    ? (data.reduce((acc, curr) => acc + curr.attendanceRate, 0) / data.length).toFixed(1)
                                    : 0}%
                            </h3>
                        </div>
                    </div>
                </NeuCard>

                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Students</p>
                            <h3 className="text-2xl font-black">{data.length}</h3>
                        </div>
                    </div>
                </NeuCard>

                <NeuCard className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-xl text-muted-foreground">
                            <BarChart2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Sessions</p>
                            <h3 className="text-2xl font-black">{totalSessions}</h3>
                        </div>
                    </div>
                </NeuCard>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <NeuInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search students..."
                        className="pl-10 h-11"
                    />
                </div>
                <NeuButton onClick={exportAnalytics} variant="secondary" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Global Report
                </NeuButton>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Student</th>
                            <th className="px-6 py-4">Sessions</th>
                            <th className="px-6 py-4">Rate</th>
                            <th className="px-6 py-4">Recent History</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    No student data matching your search.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((student) => (
                                <tr key={student.studentId} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{student.name}</div>
                                        <div className="text-xs text-muted-foreground">{student.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-semibold text-primary">{student.totalAttended}</span>
                                        <span className="text-muted-foreground"> / {totalSessions}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-muted rounded-full h-1.5 mb-1 max-w-[100px]">
                                            <div
                                                className={`h-1.5 rounded-full ${student.attendanceRate > 75 ? 'bg-green-500' : student.attendanceRate > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                style={{ width: `${student.attendanceRate}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-bold">{student.attendanceRate.toFixed(1)}%</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {student.sessionHistory.slice(0, 10).map((h, i) => (
                                                <div
                                                    key={i}
                                                    title={`${h.sessionName} (${format(new Date(h.date), 'MMM dd')})`}
                                                    className={`w-3 h-3 rounded-sm ${h.attended ? 'bg-green-500' : 'bg-red-200 dark:bg-red-900/30'}`}
                                                ></div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <NeuButton variant="secondary" className="h-8 w-8 p-0" title="Contact Student">
                                            <Mail className="h-4 w-4" />
                                        </NeuButton>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
