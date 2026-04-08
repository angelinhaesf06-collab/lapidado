'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }

    startTransition(() => {
      router.replace(`/?${params.toString()}`)
    })
  }

  return (
    <div className="relative flex-1 group">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isPending ? 'text-[#c99090] animate-pulse' : 'text-rose-300 group-focus-within:text-[#c99090]'}`} size={18} />
      <input 
        type="text" 
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
        placeholder="Buscar por nome ou material..." 
        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-rose-100 shadow-sm focus:ring-2 focus:ring-[#c99090] focus:border-transparent outline-none transition-all text-[#4a322e] font-light italic"
      />
    </div>
  )
}
