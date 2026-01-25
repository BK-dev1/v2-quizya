'use client'

import * as React from 'react'
import { useNotifications } from '@/lib/hooks/use-notifications'
import { useAuth } from '@/lib/hooks/use-auth'
import { Notification } from '@/lib/types'
import { useTranslation } from 'react-i18next'
import { formatDistanceToNow } from 'date-fns'
import { 
  Bell, 
  X, 
  Trash2, 
  Check, 
  CheckCheck, 
  UserPlus, 
  AlertTriangle, 
  FileCheck, 
  Play, 
  Square,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationCenterProps {
  className?: string
}

const notificationIcons: Record<string, React.ReactNode> = {
  exam_join: <UserPlus className="w-4 h-4 text-blue-500" />,
  proctoring_infraction: <AlertTriangle className="w-4 h-4 text-red-500" />,
  exam_submission: <FileCheck className="w-4 h-4 text-green-500" />,
  exam_started: <Play className="w-4 h-4 text-purple-500" />,
  exam_ended: <Square className="w-4 h-4 text-orange-500" />
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}) {
  const { t } = useTranslation()
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        "flex items-start gap-3 p-3 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        {notificationIcons[notification.type] || <Bell className="w-4 h-4 text-muted-foreground" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.read && "font-semibold")}>
          {notification.title}
        </p>
        {notification.message && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {timeAgo}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkAsRead(notification.id)
            }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title={t('markAsRead') || 'Mark as read'}
          >
            <Check className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(notification.id)
          }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          title={t('delete') || 'Delete'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotifications(user?.id)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-muted relative transition-colors"
        aria-label={t('notifications') || 'Notifications'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 rtl:right-auto rtl:left-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] flex flex-col bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <h3 className="font-semibold text-sm">
                {t('notifications') || 'Notifications'}
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({unreadCount} {t('unread') || 'unread'})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    title={t('markAllAsRead') || 'Mark all as read'}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={deleteAllNotifications}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title={t('clearAllNotifications') || 'Clear all notifications'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {t('noNotifications') || 'No notifications yet'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t('notificationsWillAppearHere') || 'Notifications will appear here when you receive them'}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
