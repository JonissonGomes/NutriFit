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
import PublicProfile from './pages/PublicProfile'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminNutritionists from './pages/admin/Nutritionists'

// Páginas do nutricionista
import Dashboard from './pages/dashboard/Dashboard'
import NutritionistMealPlans from './pages/dashboard/MealPlans'
import PublicProfileEdit from './pages/dashboard/PublicProfile'
import Chat from './pages/dashboard/Chat'
import Services from './pages/dashboard/Services'
import Settings from './pages/dashboard/Settings'
import Calendar from './pages/dashboard/Calendar'
import Analytics from './pages/dashboard/Analytics'
import Patients from './pages/dashboard/Patients'
import LabExams from './pages/dashboard/LabExams'
import FoodDiaryPatients from './pages/dashboard/FoodDiaryPatients'

// Páginas do paciente
import ClientDashboard from './pages/client/ClientDashboard'
import ClientFavorites from './pages/client/ClientFavorites'
import ClientMessages from './pages/client/ClientMessages'
import ClientBookings from './pages/client/ClientBookings'
import PatientMealPlans from './pages/patient/MealPlans'
import PatientMealPlan from './pages/patient/MealPlan'
import PatientFoodDiary from './pages/patient/FoodDiary'
import PatientGoals from './pages/patient/Goals'
import PatientProgress from './pages/patient/Progress'
import PatientShoppingList from './pages/patient/ShoppingList'
import PatientAIAssistant from './pages/patient/AIAssistant'

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
                            <Route path="/portfolio/:username" element={<PublicProfile />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <Footer />
                      </div>
                    }
                  />

                  {/* Dashboard Routes - Nutricionista */}
                  <Route
                    path="/nutritionist/*"
                    element={
                      <ProtectedRoute allowedRoles={['nutricionista']}>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/meal-plans" element={<NutritionistMealPlans />} />
                            <Route path="/patients" element={<Patients />} />
                            <Route path="/food-diary" element={<FoodDiaryPatients />} />
                            <Route path="/lab-exams" element={<LabExams />} />
                            <Route path="/profile" element={<PublicProfileEdit />} />
                            <Route path="/messages" element={<Chat />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </DashboardLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard Routes - Paciente */}
                  <Route
                    path="/patient/*"
                    element={
                      <ProtectedRoute allowedRoles={['paciente']}>
                        <ClientLayout>
                          <Routes>
                            <Route path="/dashboard" element={<ClientDashboard />} />
                            <Route path="/meal-plans" element={<PatientMealPlans />} />
                            <Route path="/meal-plans/:id" element={<PatientMealPlan />} />
                            <Route path="/food-diary" element={<PatientFoodDiary />} />
                            <Route path="/goals" element={<PatientGoals />} />
                            <Route path="/progress" element={<PatientProgress />} />
                            <Route path="/shopping-list" element={<PatientShoppingList />} />
                            <Route path="/assistant" element={<PatientAIAssistant />} />
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

                  {/* Admin Routes */}
                  <Route
                    path="/admin/*"
                    element={
                      <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                        <DashboardLayout>
                          <Routes>
                            <Route path="/dashboard" element={<AdminDashboard />} />
                            <Route path="/nutritionists" element={<AdminNutritionists />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </DashboardLayout>
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
