import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, ArrowLeft, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../components/common/ConfirmModal'
import { calendarService } from '../../services'
import type { Event, CreateEventRequest, EventType, EventLocation } from '../../services/calendar.service'
import { useToast } from '../../contexts/ToastContext'
import LoadingButton from '../../components/common/LoadingButton'
import { useConfirmDelete } from '../../hooks'

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const deleteFlow = useConfirmDelete<string>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  // Form state para novo evento
  const [newEvent, setNewEvent] = useState<CreateEventRequest>({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: 'escritorio',
    locationAddress: '',
    type: 'reuniao',
  })

  // Carregar eventos
  useEffect(() => {
    loadEvents()
  }, [currentDate])

  const loadEvents = async () => {
    setLoading(true)
    
    // Calcular início e fim do mês
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    const response = await calendarService.listEvents({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      limit: 100,
    })

    if (response.data) {
      // Garantir que response.data seja um array
      const eventsData = Array.isArray(response.data) ? response.data : []
      setEvents(eventsData)
    } else if (response.error) {
      showToast(response.error, 'error')
    } else {
      // Se não houver dados nem erro, definir array vazio
      setEvents([])
    }

    setLoading(false)
  }

  const handleCreateEvent = async () => {
    if (!newEvent.title.trim()) {
      showToast('Título é obrigatório', 'error')
      return
    }
    if (!newEvent.date) {
      showToast('Data é obrigatória', 'error')
      return
    }
    if (!newEvent.time) {
      showToast('Horário é obrigatório', 'error')
      return
    }

    setSaving(true)
    const response = await calendarService.createEvent(newEvent)

    if (response.data) {
      showToast('Evento criado com sucesso!', 'success')
      setShowModal(false)
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        location: 'escritorio',
        locationAddress: '',
        type: 'reuniao',
      })
      loadEvents()
    } else if (response.error) {
      showToast(response.error, 'error')
    }

    setSaving(false)
  }

  const handleDeleteClick = (eventId: string) => {
    deleteFlow.open(eventId)
  }

  const confirmDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId)
    try {
      const response = await calendarService.deleteEvent(eventId)

      if (response.data) {
        showToast('Evento excluído com sucesso!', 'success')
        loadEvents()
      } else if (response.error) {
        showToast(response.error, 'error')
      }
    } catch {
      showToast('Erro ao excluir evento', 'error')
    } finally {
      setDeletingId(null)
    }
  }


  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0]
      return eventDate === dateStr
    })
  }

  const getTypeColor = (type: EventType) => {
    const colors: Record<EventType, string> = {
      reuniao: 'bg-blue-100 text-blue-700 border-blue-200',
      visita: 'bg-green-100 text-green-700 border-green-200',
      apresentacao: 'bg-amber-100 text-amber-700 border-amber-200',
      consultoria: 'bg-purple-100 text-purple-700 border-purple-200',
      outro: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const getTypeLabel = (type: EventType) => {
    return calendarService.getTypeLabel(type)
  }

  const getLocationLabel = (location: EventLocation) => {
    const labels: Record<EventLocation, string> = {
      escritorio: 'Escritório',
      cliente: 'Cliente',
      obra: 'Obra',
      prefeitura: 'Prefeitura',
      outro: 'Outro',
    }
    return labels[location] || location
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  // Garantir que events seja sempre um array
  const eventsArray = Array.isArray(events) ? events : []
  
  const filteredEvents = selectedDate 
    ? eventsArray.filter(e => {
        const eventDate = new Date(e.date).toISOString().split('T')[0]
        const selectedStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        return eventDate === selectedStr
      })
    : [...eventsArray].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5)

  const openNewEventModal = () => {
    if (selectedDate) {
      setNewEvent(prev => ({
        ...prev,
        date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
      }))
    }
    setShowModal(true)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ConfirmModal
        isOpen={deleteFlow.isOpen}
        title="Excluir evento"
        message="Tem certeza que deseja excluir este evento?"
        confirmText="Excluir"
        cancelText="Cancelar"
        onConfirm={() => void deleteFlow.confirm(confirmDeleteEvent)}
        onClose={deleteFlow.close}
        loading={deleteFlow.loading || !!deletingId}
        variant="danger"
      />
      {/* Header com botão voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/nutritionist/dashboard')}
          className="p-2 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-600 mt-1 text-xs md:text-sm">Gerencie seus compromissos e reuniões</p>
        </div>
        <button 
          onClick={openNewEventModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden md:inline">Novo Evento</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={previousMonth}
                  className="p-2 rounded-lg"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 text-sm text-primary-600 rounded-lg"
                >
                  Hoje
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 rounded-lg"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const dayEvents = getEventsForDate(day)
                const isToday = 
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()
                const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                const isSelected = selectedDate?.toDateString() === dateObj.toDateString()

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`aspect-square p-2 rounded-lg border ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : isToday
                        ? 'border-primary-300 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <span className={`text-sm font-semibold ${
                        isToday ? 'text-primary-600' : 'text-gray-900'
                      }`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getTypeColor(event.type)}`}
                              title={event.title}
                            >
                              {event.time}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Events List */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {selectedDate 
                ? `Eventos - ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`
                : 'Próximos Eventos'
              }
            </h2>
            
            <div className="space-y-3">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border-2 ${getTypeColor(event.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${calendarService.getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-3 w-3" />
                        <span>{getTypeLabel(event.type)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{event.time} ({event.duration}min)</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{event.locationAddress || getLocationLabel(event.location)}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <LoadingButton
                        onClick={() => handleDeleteClick(event.id)}
                        loading={deletingId === event.id}
                        variant="ghost"
                        size="sm"
                        className="text-xs text-red-600 p-1 min-w-0"
                      >
                        Excluir
                      </LoadingButton>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum evento {selectedDate ? 'para esta data' : 'agendado'}</p>
                  <button
                    onClick={openNewEventModal}
                    className="mt-2 text-primary-600 font-medium text-sm"
                  >
                    Criar evento
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novo Evento */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Novo Evento</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Reunião com cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  placeholder="Detalhes do evento..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração (min)
                  </label>
                  <input
                    type="number"
                    value={newEvent.duration}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    min={15}
                    step={15}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as EventType }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="reuniao">Reunião</option>
                    <option value="visita">Visita</option>
                    <option value="apresentacao">Apresentação</option>
                    <option value="consultoria">Consultoria</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <select
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value as EventLocation }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="escritorio">Escritório</option>
                  <option value="cliente">Cliente</option>
                  <option value="obra">Obra</option>
                  <option value="prefeitura">Prefeitura</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço (opcional)
                </label>
                <input
                  type="text"
                  value={newEvent.locationAddress}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, locationAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Ex: Av. Paulista, 1000"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>
              <LoadingButton
                onClick={handleCreateEvent}
                loading={saving}
                variant="primary"
                fullWidth
                className="flex-1"
              >
                Criar Evento
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar


