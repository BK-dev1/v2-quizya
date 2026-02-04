'use client'

import { useState } from 'react'
import { CheckCircle, MapPin, Clock, Search, Download } from 'lucide-react'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { format } from 'date-fns'

interface Attendee {
    id: string
    studentId: string
    studentName: string
    studentEmail?: string
    latitude: number
    longitude: number
    distanceMeters: number
    markedAt: string
}

interface AttendanceTableProps {
    attendees: Attendee[]
    sessionName: string
}

export default function AttendanceTable({ attendees, sessionName }: AttendanceTableProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredAttendees = attendees.filter(
        (a) =>
            a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const exportToCSV = () => {
        const headers = ['Student Name', 'Email', 'Time', 'Distance (m)']
        const rows = filteredAttendees.map((a) => [
            a.studentName,
            a.studentEmail || 'N/A',
            format(new Date(a.markedAt), 'HH:mm:ss'),
            a.distanceMeters ? Math.round(a.distanceMeters).toString() : 'N/A'
        ])

        const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `attendance_${sessionName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    < NeuInput
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search students..."
                        className="pl-10"
                    />
                </div>
                <NeuButton onClick={exportToCSV} variant="secondary" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Spreadsheet
                </NeuButton>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold">
                        <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Time Marked</th>
                            <th className="px-4 py-3">Distance</th>
                            <th className="px-4 py-3">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredAttendees.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                    No students found
                                </td>
                            </tr>
                        ) : (
                            filteredAttendees.map((attendee) => (
                                <tr key={attendee.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-4">
                                        <div className="font-medium">{attendee.studentName}</div>
                                        <div className="text-xs text-muted-foreground">{attendee.studentEmail}</div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                            {format(new Date(attendee.markedAt), 'HH:mm:ss')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-3.5 w-3.5" />
                                            {attendee.distanceMeters ? `${Math.round(attendee.distanceMeters)}m` : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full w-fit">
                                            <CheckCircle className="h-3.5 w-3.5" />
                                            Present
                                        </span>
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
