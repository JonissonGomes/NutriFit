import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { notificationService } from '../services'
import type { Notification as NotificationType } from '../services/notification.service'

// Usar o tipo do serviço
export type { Notification as Notification } from '../services/notification.service'

interface NotificationContextType {
  notifications: NotificationType[]
  unreadCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await notificationService.listNotifications({ limit: 50 })
      if (response.data) {
        setNotifications(response.data.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar contagem de não lidas
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount()
      if (response.data) {
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar contagem de não lidas:', error)
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    loadNotifications()
    loadUnreadCount()
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [loadNotifications, loadUnreadCount])

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationService.markAsRead(id)
      if (!response.error) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === id ? { ...notif, read: true, readAt: new Date().toISOString() } : notif
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead()
      if (!response.error) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, read: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error)
    }
  }, [])

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await notificationService.deleteNotification(id)
      if (!response.error) {
        const notification = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(notif => notif.id !== id))
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }, [notifications])

  const refreshNotifications = useCallback(async () => {
    await loadNotifications()
    await loadUnreadCount()
  }, [loadNotifications, loadUnreadCount])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

