import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Notification, NotificationInsert, NotificationUpdate, NotificationType, NotificationData } from '@/lib/types'

// Sanitize user input to prevent XSS and injection
function sanitizeString(input: string, maxLength: number = 255): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>\"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[char] || char
    })
}

// Verify that a notification belongs to a specific user
export async function verifyNotificationOwnership(notificationId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('id')
    .eq('id', notificationId)
    .eq('user_id', userId)
    .single()
  
  return !error && !!data
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  data?: NotificationData,
  examId?: string
): Promise<Notification | null> {
  const supabase = createAdminClient()

  // Sanitize input data
  const sanitizedData = data ? {
    ...data,
    student_name: data.student_name ? sanitizeString(data.student_name, 100) : undefined,
    student_email: data.student_email ? sanitizeString(data.student_email, 255) : undefined,
    exam_title: data.exam_title ? sanitizeString(data.exam_title, 255) : undefined
  } : {}

  const insertData = {
    user_id: userId,
    type,
    title: sanitizeString(title, 255),
    message: message ? sanitizeString(message, 1000) : null,
    data: sanitizedData,
    exam_id: examId || null,
    read: false
  }

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating notification')
    return null
  }

  return notification
}


export async function getUserNotifications(
  userId: string,
  limit: number = 50,
  includeRead: boolean = true
): Promise<Notification[]> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!includeRead) {
    query = query.eq('read', false)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching notifications')
    return []
  }

  return data || []
}


export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error counting unread notifications')
    return 0
  }

  return count || 0
}


export async function markNotificationAsRead(notificationId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  
  // Add user_id filter for additional security if provided
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { error } = await query

  if (error) {
    console.error('Error marking notification as read')
    return false
  }

  return true
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  if (error) {
    console.error('Error marking all notifications as read')
    return false
  }

  return true
}


export async function deleteNotification(notificationId: string, userId?: string): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
  
  // Add user_id filter for additional security if provided
  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { error } = await query

  if (error) {
    console.error('Error deleting notification')
    return false
  }

  return true
}

export async function deleteAllNotifications(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting all notifications')
    return false
  }

  return true
}


export async function getUserNotificationSettings(userId: string): Promise<{
  push_exam_start: boolean
  push_infractions: boolean
  push_submissions: boolean
} | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_settings')
    .select('push_exam_start, push_infractions, push_submissions')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user notification settings')
    return null
  }

  return {
    push_exam_start: data?.push_exam_start ?? true,
    push_infractions: data?.push_infractions ?? true,
    push_submissions: data?.push_submissions ?? true
  }
}


export async function createNotificationIfEnabled(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  data?: NotificationData,
  examId?: string
): Promise<Notification | null> {
  const settings = await getUserNotificationSettings(userId)

  if (!settings) {
    return createNotification(userId, type, title, message, data, examId)
  }

  let isEnabled = true

  switch (type) {
    case 'exam_join':
    case 'exam_started':
      isEnabled = settings.push_exam_start
      break
    case 'proctoring_infraction':
      isEnabled = settings.push_infractions
      break
    case 'exam_submission':
      isEnabled = settings.push_submissions
      break
    default:
      isEnabled = true
  }

  if (!isEnabled) {
    return null
  }

  return createNotification(userId, type, title, message, data, examId)
}
