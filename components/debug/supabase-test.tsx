'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function SupabaseConnectionTest() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()
        
        // Test basic connection
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          
        if (error) {
          console.error('Supabase connection error:', error)
          setError(error.message)
          setConnectionStatus('error')
        } else {
          console.log('Supabase connected successfully')
          setConnectionStatus('connected')
        }
      } catch (err) {
        console.error('Connection test failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setConnectionStatus('error')
      }
    }

    testConnection()
  }, [])

  if (connectionStatus === 'testing') {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
        Testing Supabase connection...
      </div>
    )
  }

  if (connectionStatus === 'error') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-3 py-2 rounded-lg text-sm max-w-xs">
        Supabase Error: {error}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm">
      ✓ Supabase Connected
    </div>
  )
}