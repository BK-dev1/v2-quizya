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
  Users,
  Clock,
  Loader2,
  Trash2,
  Download,
  MapPin,
  CheckCircle2,
  XCircle
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
    title: '',
    description: '',
    module_name: '',
    section_group: '',
    useLocation: false,
    location_lat: null as number | null,
    location_lng: null as number | null,
    max_distance_meters: 50,
    qr_refresh_interval: 60
  })
  const { t } = useTranslation()

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/attendance/sessions')
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

    if (!newSession.title.trim()) {
      toast.error('Please enter a session title')
      return
    }

    setIsCreating(true)

    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newSession.title,
          description: newSession.description || null,
          module_name: newSession.module_name || null,
          section_group: newSession.section_group || null,
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

  const handleDeleteSession = async (sessionId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
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

  // Memoize filtered sessions to avoid recalculation on every render
  const filteredSessions = useMemo(() =>
    sessions.filter(session =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.module_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.section_group?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [sessions, searchTerm]
  )

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
            <Label htmlFor="title">Session Title *</Label>
            <NeuInput
              id="title"
              value={newSession.title}
              onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Morning Lecture - Week 1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <NeuInput
              id="description"
              value={newSession.description}
              onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional session description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="module">Module/Course</Label>
              <NeuInput
                id="module"
                value={newSession.module_name}
                onChange={(e) => setNewSession(prev => ({ ...prev, module_name: e.target.value }))}
                placeholder="e.g., Computer Science"
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
                Students must be within {newSession.max_distance_meters}m to check in
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

      {filteredSessions.length === 0 ? (
        <NeuCard className="p-12 text-center">
          <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No attendance sessions yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first attendance session to start tracking student attendance
          </p>
        </NeuCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSessions.map((session) => (
            <NeuCard key={session.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{session.title}</h3>
                    {session.description && (
                      <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {session.is_active ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Ended
                      </>
                    )}
                  </div>
                </div>

                {(session.module_name || session.section_group) && (
                  <div className="text-sm space-y-1">
                    {session.module_name && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Module:</span>
                        <span className="font-medium">{session.module_name}</span>
                      </div>
                    )}
                    {session.section_group && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Section:</span>
                        <span className="font-medium">{session.section_group}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                  {session.location_lat && session.location_lng && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Location
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Link href={`/dashboard/attendance/${session.id}`} className="flex-1">
                    <NeuButton variant="outline" className="w-full cursor-pointer">
                      <QrCode className="mr-2 h-4 w-4" />
                      View QR
                    </NeuButton>
                  </Link>
                  <NeuButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(session.id, session.title)}
                  >
                    <Download className="h-4 w-4" />
                  </NeuButton>
                  <NeuButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id, session.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </NeuButton>
                </div>
              </div>
            </NeuCard>
          ))}
        </div>
      )}
    </div>
  )
}
