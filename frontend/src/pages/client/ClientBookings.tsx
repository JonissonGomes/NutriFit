import React, { useState, useEffect } from 'react'
import { useToast } from '../../contexts/ToastContext'
import { calendarService } from '../../services'
import type { Event } from '../../services/calendar.service'
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingButton from '../../components/common/LoadingButton'
import ConfirmModal from '../../components/common/ConfirmModal'

const ClientBookings: React.FC = () => {
  const { showToast } = useToast()
  const [bookings, setBookings] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [filter])

  const loadBookings = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const startDate = filter === 'past' 
        ? new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
        : now.toISOString().split('T')[0]
      
      const endDate = filter === 'past'
        ? now.toISOString().split('T')[0]
        : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]

      const response = await calendarService.listEvents({
        startDate: filter === 'all' ? undefined : startDate,
        endDate: filter === 'all' ? undefined : endDate,
        limit: 50,
      })

      if (response.data) {
        let events = response.data
        
        // Filtrar por data se necessário
        if (filter === 'upcoming') {
          events = events.filter(e => new Date(e.date) >= now)
        } else if (filter === 'past') {
          events = events.filter(e => new Date(e.date) < now)
        }
        
        // Ordenar por data
        events.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return filter === 'past' ? dateB - dateA : dateA - dateB
        })
        
        setBookings(events)
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } catch {
      showToast('Erro ao carregar agendamentos', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = (eventId: string) => {
    setBookingToCancel(eventId)
    setShowCancelConfirm(true)
  }

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return

    setCancellingId(bookingToCancel)
    try {
      const response = await calendarService.updateEventStatus(bookingToCancel, 'cancelado')
      if (response.data) {
        showToast('Agendamento cancelado com sucesso', 'success')
        loadBookings()
        setShowCancelConfirm(false)
        setBookingToCancel(null)
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-yellow-100 text-yellow-700'
      case 'confirmado': return 'bg-green-100 text-green-700'
      case 'concluido': return 'bg-blue-100 text-blue-700'
      case 'cancelado': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente': return 'Aguardando confirmação'
      case 'confirmado': return 'Confirmado'
      case 'concluido': return 'Concluído'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    return calendarService.getTypeLabel(type as 'reuniao' | 'visita' | 'apresentacao' | 'consultoria' | 'outro')
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Meus Agendamentos</h1>
        <p className="text-gray-600">Gerencie suas consultas e reuniões com nutricionistas</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'upcoming', label: 'Próximos' },
          { key: 'past', label: 'Anteriores' },
          { key: 'all', label: 'Todos' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum agendamento
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {filter === 'upcoming' 
              ? 'Você não tem agendamentos futuros. Explore nutricionistas e agende uma consulta.'
              : filter === 'past'
              ? 'Você não tem agendamentos anteriores.'
              : 'Você ainda não tem agendamentos.'}
          </p>
          <Link
            to="/explore"
            className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Descobrir Arquitetos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                    <p className="text-gray-600 text-sm">{getTypeLabel(booking.type)}</p>
                    {booking.description && (
                      <p className="text-gray-500 text-sm mt-1">{booking.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{formatDate(booking.date.toString())}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{booking.time} ({booking.duration}min)</span>
                  </div>
                  {booking.locationAddress && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{booking.locationAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4 pt-4 border-t border-gray-100 gap-4">
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>

                <div className="flex gap-2">
                  {booking.status === 'pendente' && (
                    <button 
                      onClick={() => handleCancelClick(booking.id)}
                      className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                    >
                      Cancelar
                    </button>
                  )}
                  {booking.status === 'confirmado' && (
                    <>
                      <LoadingButton
                        onClick={() => handleCancelClick(booking.id)}
                        loading={cancellingId === booking.id}
                        variant="outline"
                        size="sm"
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        Cancelar
                      </LoadingButton>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false)
          setBookingToCancel(null)
        }}
        onConfirm={handleCancelBooking}
        title="Cancelar Agendamento"
        message="Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita."
        confirmText="Cancelar Agendamento"
        cancelText="Manter"
        variant="warning"
        loading={cancellingId !== null}
      />
    </div>
  )
}

export default ClientBookings
