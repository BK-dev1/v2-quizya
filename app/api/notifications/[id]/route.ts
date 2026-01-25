import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { markNotificationAsRead, deleteNotification, verifyNotificationOwnership } from '@/lib/services/notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this notification before allowing update
    const isOwner = await verifyNotificationOwnership(id, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const body = await request.json()
    const { read } = body

    if (read === true) {
      const success = await markNotificationAsRead(id, user.id)
      if (!success) {
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating notification')
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this notification before allowing delete
    const isOwner = await verifyNotificationOwnership(id, user.id)
    if (!isOwner) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    const success = await deleteNotification(id, user.id)
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting notification')
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
