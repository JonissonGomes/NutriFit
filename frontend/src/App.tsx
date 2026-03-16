import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import ToastContainer from './components/common/ToastContainer'
import ScrollToTop from './components/common/ScrollToTop'
import ErrorBoundary from './components/common/ErrorBoundary'
import OnboardingTour from './components/common/OnboardingTour'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import DashboardLayout from './components/layout/DashboardLayout'
import ClientLayout from './components/layout/ClientLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Páginas públicas
import Home from './pages/Home'
import Explore from './pages/Explore'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Pricing from './pages/Pricing'
import ProjectView from './pages/ProjectView'
import PublicProfile from './pages/PublicProfile'
import Model3DView from './pages/Model3DView'
import NotFound from './pages/NotFound'

// Páginas do arquiteto
import Dashboard from './pages/dashboard/Dashboard'
import Galleries from './pages/dashboard/Galleries'
import PublicProfileEdit from './pages/dashboard/PublicProfile'
import Chat from './pages/dashboard/Chat'
import Services from './pages/dashboard/Services'
import Settings from './pages/dashboard/Settings'
import Calendar from './pages/dashboard/Calendar'
import Models3D from './pages/dashboard/Models3D'
import Analytics from './pages/dashboard/Analytics'

// Páginas do cliente
import ClientDashboard from './pages/client/ClientDashboard'
import ClientProjects from './pages/client/ClientProjects'
import ClientFavorites from './pages/client/ClientFavorites'
import ClientMessages from './pages/client/ClientMessages'
import ClientBookings from './pages/client/ClientBookings'

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <ScrollToTop />
                <OnboardingTour />
                <Routes>
                  {/* Public Routes with Header/Footer */}
                  <Route
                    path="/*"
                    element={
                      <div className="min-h-screen flex flex-col">
                        <Header />
                        <main className="flex-grow pt-14">
                          <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/project/:id" element={<ProjectView />} />
                            <Route path="/portfolio/:username" element={<PublicProfile />} />
                            <Route path="/models3d/:id" element={<Model3DView />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <Footer />
                      </div>
                    }
                  />

                  {/* Dashboard Routes - Architect */}
                  <Route
                    path="/architect/*"
                    element={
                      <ProtectedRoute allowedRoles={['arquiteto']}>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/projects" element={<Galleries />} />
                            <Route path="/profile" element={<PublicProfileEdit />} />
                            <Route path="/messages" element={<Chat />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/models" element={<Models3D />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard Routes - Client */}
                  <Route
                    path="/client/*"
                    element={
                      <ProtectedRoute allowedRoles={['cliente']}>
                        <ClientLayout>
                          <Routes>
                            <Route path="/dashboard" element={<ClientDashboard />} />
                            <Route path="/projects" element={<ClientProjects />} />
                            <Route path="/favorites" element={<ClientFavorites />} />
                            <Route path="/messages" element={<ClientMessages />} />
                            <Route path="/bookings" element={<ClientBookings />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </ClientLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
                <ToastContainer />
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
