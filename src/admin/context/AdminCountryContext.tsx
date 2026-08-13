import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Country { id: string; name: string; code: string; isActive: boolean }

interface AdminCountryCtx {
  country: Country | null
  countries: Country[]
  setCountry: (c: Country) => void
  loading: boolean
}

const Ctx = createContext<AdminCountryCtx>({ country: null, countries: [], setCountry: () => {}, loading: true })

const LS_KEY = 'admin_country'

export function AdminCountryProvider({ children }: { children: React.ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([])
  const [country, setCountryState] = useState<Country | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<{ data: Country[] }>('/countries?pageSize=200').then(res => {
      const list = res.data.filter(c => c.isActive)
      setCountries(list)

      const saved = localStorage.getItem(LS_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Country
        const match = list.find(c => c.id === parsed.id)
        if (match) { setCountryState(match); setLoading(false); return }
      }
      if (list[0]) setCountryState(list[0])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const setCountry = (c: Country) => {
    setCountryState(c)
    localStorage.setItem(LS_KEY, JSON.stringify(c))
  }

  return <Ctx.Provider value={{ country, countries, setCountry, loading }}>{children}</Ctx.Provider>
}

export const useAdminCountry = () => useContext(Ctx)
