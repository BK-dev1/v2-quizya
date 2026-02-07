'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuModal } from '@/components/ui/neu-modal'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  QrCode,
  Clock,
  Loader2,
  Trash2,
  Download,
  MapPin,
  BarChart3
} from 'lucide-react'
import { AttendanceSession } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function AttendanceList() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newSession, setNewSession] = useState({
    module_name: '',
    section_group: '',
    week: null as number | null,
    section_num: null as number | null,
    auto_close_duration_minutes: 0,
    useLocation: false,
    location_lat: null as number | null,
    location_lng: null as number | null,
    max_distance_meters: 100,
    qr_refresh_interval: 60
  })
  const { t } = useTranslation()

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/sessions', {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      } else {
        toast.error('Failed to load attendance sessions')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      toast.error('Error loading attendance sessions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadSessions()
    }
  }, [user, profile, loadSessions])

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    toast.info('Getting your location...')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setNewSession(prev => ({
          ...prev,
          useLocation: true,
          location_lat: position.coords.latitude,
          location_lng: position.coords.longitude
        }))
        toast.success('Location captured successfully')
      },
      (error) => {
        console.error('Error getting location:', error)
        toast.error('Failed to get location. Please enable location services.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }, [])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newSession.module_name.trim()) {
      toast.error('Please enter a module/course name')
      return
    }

    setIsCreating(true)

    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: newSession.module_name,
          section_group: newSession.section_group || null,
          week: newSession.week,
          section_num: newSession.section_num,
          auto_close_duration_minutes: newSession.auto_close_duration_minutes,
          location_lat: newSession.useLocation ? newSession.location_lat : null,
          location_lng: newSession.useLocation ? newSession.location_lng : null,
          max_distance_meters: newSession.max_distance_meters,
          qr_refresh_interval: newSession.qr_refresh_interval
        })
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Attendance session created!')
        setShowCreateModal(false)
        router.push(`/dashboard/attendance/${data.session.id}`)
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Error creating attendance session')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = async (sessionId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Session deleted')
        loadSessions()
      } else {
        toast.error('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Error deleting session')
    }
  }

  const handleExport = async (sessionId: string, title: string) => {
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}/export`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.xlsx`
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
    }
  }

  const filteredSessions = useMemo(() =>
    sessions.filter(session =>
      session.module_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.section_group?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sessions, searchTerm]
  )

  // Group sessions by module
  const sessionsByModule = useMemo(() => {
    const grouped = new Map<string, typeof sessions>()
    filteredSessions.forEach(session => {
      const moduleName = session.module_name
      if (!grouped.has(moduleName)) {
        grouped.set(moduleName, [])
      }
      grouped.get(moduleName)!.push(session)
    })
    return grouped
  }, [filteredSessions])

  // Memoize active session count
  const activeSessionCount = useMemo(
    () => sessions.filter(s => s.is_active).length,
    [sessions]
  )

  // Note: attendance_records is not included in the base session list query
  // This count would need to be added via a separate aggregate query or join if needed

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Manage attendance sessions with QR codes
          </p>
        </div>

        <NeuButton onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Session
        </NeuButton>
      </div>

      <NeuModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Attendance Session"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <Label htmlFor="module">Module/Course Name *</Label>
            <NeuInput
              id="module"
              value={newSession.module_name}
              onChange={(e) => setNewSession(prev => ({ ...prev, module_name: e.target.value }))}
              placeholder="e.g., Computer Science 101"
              required
            />
          </div>

          <div>
            <Label htmlFor="section">Section/Group</Label>
            <NeuInput
              id="section"
              value={newSession.section_group}
              onChange={(e) => setNewSession(prev => ({ ...prev, section_group: e.target.value }))}
              placeholder="e.g., Group A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="week">Week Number</Label>
              <NeuInput
                id="week"
                type="number"
                min="1"
                max="52"
                value={newSession.week || ''}
                onChange={(e) => setNewSession(prev => ({
                  ...prev,
                  week: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <Label htmlFor="section_num">Section Number</Label>
              <NeuInput
                id="section_num"
                type="number"
                min="1"
                value={newSession.section_num || ''}
                onChange={(e) => setNewSession(prev => ({
                  ...prev,
                  section_num: e.target.value ? parseInt(e.target.value) : null
                }))}
                placeholder="e.g., 1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="autoClose">Auto-Close Duration (minutes)</Label>
            <NeuInput
              id="autoClose"
              type="number"
              min="0"
              value={newSession.auto_close_duration_minutes}
              onChange={(e) => setNewSession(prev => ({
                ...prev,
                auto_close_duration_minutes: parseInt(e.target.value) || 0
              }))}
              placeholder="0 = no auto-close, 60 = close after 60 mins"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Session will automatically close after specified minutes (0 = disabled)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location Verification</Label>
              <NeuButton
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={newSession.useLocation}
              >
                <MapPin className="mr-2 h-4 w-4" />
                {newSession.useLocation ? 'Location Set' : 'Get My Location'}
              </NeuButton>
            </div>
            {newSession.useLocation && (
              <p className="text-sm text-muted-foreground">
                📍 Students must be within {newSession.max_distance_meters}m to check in.
                <br />
                <span className="text-xs">Tip: Set location while in the classroom to avoid issues.</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <NeuButton
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </NeuButton>
            <NeuButton type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Session'
              )}
            </NeuButton>
          </div>
        </form>
      </NeuModal>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <NeuInput
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {sessionsByModule.size === 0 ? (
        <NeuCard className="p-16 text-center flex flex-col items-center justify-center border-dashed border-2">
          <div className="bg-primary/5 p-6 rounded-full mb-6">
            <QrCode className="h-12 w-12 text-primary/50" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No attendance sessions yet</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Create your first attendance session to start tracking student attendance in real-time.
          </p>
          <NeuButton onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First Session
          </NeuButton>
        </NeuCard>
      ) : (
        <div className="space-y-12">
          {Array.from(sessionsByModule.entries()).map(([moduleName, moduleSessions]) => (
            <div key={moduleName} className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-1 bg-primary rounded-full" />
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">{moduleName}</h2>
                    <p className="text-sm text-muted-foreground">
                      {moduleSessions.length} session{moduleSessions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Link href={`/dashboard/attendance/modules/${encodeURIComponent(moduleName)}`}>
                  <NeuButton variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground hover:text-primary">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Statistics
                  </NeuButton>
                </Link>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {moduleSessions.map((session) => (
                  <NeuCard key={session.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/20 flex flex-col h-full">
                    {session.is_active && (
                      <div className="absolute top-0 right-0 p-4">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex-1 space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-start pr-6">
                          <h3 className="font-semibold text-lg line-clamp-1" title={session.module_name}>
                            {session.module_name}
                          </h3>
                        </div>
                        {session.section_group ? (
                          <p className="text-sm font-medium text-primary">{session.section_group}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">All Sections</p>
                        )}
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 shrink-0" />
                          <span>{new Date(session.started_at).toLocaleDateString()}</span>
                        </div>

                        {(session.week || session.section_num) && (
                          <div className="flex gap-3 text-xs font-medium text-muted-foreground">
                            {session.week && (
                              <span className="bg-muted/50 px-2 py-1 rounded">Week {session.week}</span>
                            )}
                            {session.section_num && (
                              <span className="bg-muted/50 px-2 py-1 rounded">Sec {session.section_num}</span>
                            )}
                          </div>
                        )}

                        {session.location_lat && (
                          <div className="flex items-center gap-2 text-sm text-green-600/80">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="text-xs">Location Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-muted/5 border-t flex items-center gap-2">
                      <Link href={`/dashboard/attendance/${session.id}`} className="flex-1">
                        <NeuButton
                          variant={session.is_active ? 'primary' : 'outline'}
                          className={`w-full justify-center ${session.is_active ? 'shadow-md' : 'bg-background'}`}
                        >
                          {session.is_active ? (
                            <>
                              <QrCode className="mr-2 h-4 w-4" />
                              Monitor Live
                            </>
                          ) : (
                            'View Report'
                          )}
                        </NeuButton>
                      </Link>

                      <div className="flex gap-1">
                        <NeuButton
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => handleExport(session.id, session.module_name)}
                          title="Export CSV"
                        >
                          <Download className="h-4 w-4" />
                        </NeuButton>
                        <NeuButton
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSession(session.id, session.module_name)}
                          title="Delete Session"
                        >
                          <Trash2 className="h-4 w-4" />
                        </NeuButton>
                      </div>
                    </div>
                  </NeuCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
