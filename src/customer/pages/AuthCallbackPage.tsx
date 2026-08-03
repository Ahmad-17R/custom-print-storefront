import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      navigate(data.session ? '/' : '/login', { replace: true })
    })
  }, [navigate])

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#F8FAFC', fontFamily: 'system-ui, sans-serif', color: '#64748B',
    }}>
      Signing you in…
    </div>
  )
}
