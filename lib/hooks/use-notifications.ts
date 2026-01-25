'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
}

export function useNotifications(userId?: string): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Use a stable supabase client reference
  const supabase = useMemo(() => createClient(), [])

  // Silent fetch for polling - doesn't show loading indicator
  const fetchNotificationsSilent = useCallback(async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/notifications?limit=50&includeRead=true')
      
      if (!res.ok) return

      const data = await res.json()
      const newNotifications = data.notifications || []
      const newUnreadCount = data.unread_count || 0
      
      // Only update if there are changes (compare by checking if any new notification IDs exist)
      setNotifications(prev => {
        const prevIds = new Set(prev.map(n => n.id))
        const hasNewNotifications = newNotifications.some((n: Notification) => !prevIds.has(n.id))
        
        if (hasNewNotifications || newNotifications.length !== prev.length) {
          return newNotifications
        }
        return prev
      })
      setUnreadCount(newUnreadCount)
    } catch (err) {
      // Silent fail for background polling
    }
  }, [userId])

  // Initial fetch with loading indicator
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/notifications?limit=50&includeRead=true')
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch notifications')
      }

      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unread_count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      })

      if (!res.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Error marking notification as read')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      })

      if (!res.ok) {
        throw new Error('Failed to mark all as read')
      }

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read')
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const notification = notifications.find(n => n.id === notificationId)
      
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete notification')
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error deleting notification')
    }
  }, [notifications])

  const deleteAllNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete all notifications')
      }

      // Update local state
      setNotifications([])
      setUnreadCount(0)
    } catch (err) {
      console.error('Error deleting all notifications')
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchNotifications()
    }
  }, [userId, fetchNotifications])

  // Polling fallback - fetch silently every 3 seconds as backup for realtime
  useEffect(() => {
    if (!userId) return

    const pollInterval = setInterval(() => {
      fetchNotificationsSilent()
    }, 3000) // Poll every 3 seconds silently

    return () => clearInterval(pollInterval)
  }, [userId, fetchNotificationsSilent])

  // Real-time subscription
  useEffect(() => {
    if (!userId) return

    let channel: RealtimeChannel | null = null

    const setupRealtimeSubscription = () => {
      // Subscribe with server-side filter for security - only receives notifications for this user
      channel = supabase
        .channel(`user-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const updatedNotification = payload.new as Notification
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            // Recalculate unread count
            setNotifications(prev => {
              const newUnreadCount = prev.filter(n => !n.read).length
              setUnreadCount(newUnreadCount)
              return prev
            })
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const deletedNotification = payload.old as Notification
            setNotifications(prev => {
              const updated = prev.filter(n => n.id !== deletedNotification.id)
              const newUnreadCount = updated.filter(n => !n.read).length
              setUnreadCount(newUnreadCount)
              return updated
            })
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId, supabase])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  }
}
