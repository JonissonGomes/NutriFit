import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { profileService } from '../services/profile.service'
import { recipeService } from '../services/recipe.service'
import type { Recipe } from '../services/recipe.service'

const PublicProfileRecipes = () => {
  const { username } = useParams<{ username: string }>()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Recipe[]>([])
  const [name, setName] = useState('')

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to={`/profile/${username}`} className="inline-flex items-center gap-2 text-sm font-semibold text-primary-700">
        <ArrowBackIcon sx={{ fontSize: 18 }} />
        Voltar ao perfil
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receitas de {name || 'profissional'}</h1>
      </div>
      {loading ? (
        <div className="text-sm text-gray-600">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-600">Nenhuma receita publicada.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((r) => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
              {r.imageUrls?.[0] ? <img src={r.imageUrls[0]} alt={r.title} className="w-full h-36 object-cover rounded-lg mb-3" /> : null}
              <div className="font-semibold text-gray-900">{r.title}</div>
              {r.description ? <div className="text-sm text-gray-600 mt-1">{r.description}</div> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PublicProfileRecipes

