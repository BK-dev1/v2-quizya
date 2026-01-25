import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { 
  getUserNotifications, 
  getUnreadNotificationCount, 
  markAllNotificationsAsRead,
  deleteAllNotifications 
} from '@/lib/services/notifications'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const includeRead = searchParams.get('includeRead') !== 'false'
    const countOnly = searchParams.get('countOnly') === 'true'

    if (countOnly) {
      const count = await getUnreadNotificationCount(user.id)
      return NextResponse.json({ unread_count: count })
    }

    const notifications = await getUserNotifications(user.id, limit, includeRead)
    const unreadCount = await getUnreadNotificationCount(user.id)

    return NextResponse.json({
      notifications,
      unread_count: unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications')
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'mark_all_read') {
      const success = await markAllNotificationsAsRead(user.id)
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating notifications')
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await deleteAllNotifications(user.id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete all notifications' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting all notifications')
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 })
  }
}
