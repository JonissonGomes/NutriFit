import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { profileService } from '../services/profile.service'
import { recipeService } from '../services/recipe.service'
import type { Recipe } from '../services/recipe.service'

const PublicProfileRecipes = () => {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Recipe[]>([])
  const [name, setName] = useState('')
  const shouldScrollMobile = items.length > 3

  useEffect(() => {
    const load = async () => {
      if (!username) return
      setLoading(true)
      const p = await profileService.getPublicProfile(username)
      if (!p.data) {
        setItems([])
        setLoading(false)
        return
      }
      setName(p.data.displayName || '')
      const res = await recipeService.listPublicByNutritionist(p.data.userId)
      setItems((res.data as any)?.data || [])
      setLoading(false)
    }
    void load()
  }, [username])

  return (
    <div className="app-page app-section py-8">
      <div>
        <h1 className="app-title">Receitas de {name || 'profissional'}</h1>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="app-card text-sm text-gray-600">Nenhuma receita publicada.</div>
      ) : (
        <div className={`${shouldScrollMobile ? 'overflow-x-auto md:overflow-visible' : 'overflow-hidden md:overflow-visible'}`}>
          <div className={shouldScrollMobile ? 'flex gap-3 min-w-max pb-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:min-w-0 md:pb-0' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'}>
          {items.map((r) => (
            <div
              key={r.id}
              className={`${shouldScrollMobile ? 'w-[46vw] min-w-[46vw] max-w-[46vw] md:w-full md:min-w-0 md:max-w-none' : 'w-full'} bg-white border border-gray-200 rounded-xl p-4`}
            >
              {r.imageUrls?.[0] ? <img src={r.imageUrls[0]} alt={r.title} className="w-full h-36 object-cover rounded-lg mb-3" /> : null}
              <div className="font-semibold text-gray-900">{r.title}</div>
              {r.description ? <div className="text-sm text-gray-600 mt-1">{r.description}</div> : null}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfileRecipes

