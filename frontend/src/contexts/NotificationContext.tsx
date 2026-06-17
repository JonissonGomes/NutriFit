import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { notificationService, tokenManager } from '../services'
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
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const isAuthenticated = () => Boolean(tokenManager.getAccessToken())

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated()) {
      setNotifications([])
      setIsLoading(false)
      return
    }
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
    if (!isAuthenticated()) {
      setUnreadCount(0)
      return
    }
    try {
      const response = await notificationService.getUnreadCount()
      if (response.data) {
        setUnreadCount(response.data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Erro ao carregar contagem de não lidas:', error)
    }
  }, [])

  // Carregar dados iniciais (somente autenticado)
  useEffect(() => {
    if (!isAuthenticated()) {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      return
    }

    void loadNotifications()
    void loadUnreadCount()

    const interval = window.setInterval(() => {
      if (isAuthenticated()) {
        void loadUnreadCount()
      }
    }, 30000)

    const onLogout = () => {
      setNotifications([])
      setUnreadCount(0)
    }
    window.addEventListener('auth:logout', onLogout)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('auth:logout', onLogout)
    }
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
        setNotifications(prev => {
          const notification = prev.find(n => n.id === id)
          if (notification && !notification.read) {
            setUnreadCount(c => Math.max(0, c - 1))
          }
          return prev.filter(notif => notif.id !== id)
        })
      }
    } catch (error) {
      console.error('Erro ao deletar notificação:', error)
    }
  }, [])

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
