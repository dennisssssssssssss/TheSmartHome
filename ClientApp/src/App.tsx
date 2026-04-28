import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { SearchProvider } from '@/context/SearchContext'
import { AppLayout } from '@/components/layouts/AppLayout'
import { RouteLoader } from '@/components/layouts/RouteLoader'
import { Toaster } from 'sonner'

const Landing = lazy(() =>
  import('@/pages/public/Landing').then((module) => ({ default: module.Landing }))
)
const Dashboard = lazy(() =>
  import('@/pages/app/Dashboard').then((module) => ({ default: module.Dashboard }))
)
const Rooms = lazy(() =>
  import('@/pages/app/Rooms').then((module) => ({ default: module.Rooms }))
)
const Automations = lazy(() =>
  import('@/pages/app/Automations').then((module) => ({ default: module.Automations }))
)
const Energy = lazy(() =>
  import('@/pages/app/Energy').then((module) => ({ default: module.Energy }))
)
const Integrations = lazy(() =>
  import('@/pages/app/Integrations').then((module) => ({ default: module.Integrations }))
)
const Security = lazy(() =>
  import('@/pages/app/Security').then((module) => ({ default: module.Security }))
)
const Notifications = lazy(() =>
  import('@/pages/app/Notifications').then((module) => ({ default: module.Notifications }))
)
const Settings = lazy(() =>
  import('@/pages/app/Settings').then((module) => ({ default: module.Settings }))
)

type LazyPage = LazyExoticComponent<ComponentType>

function renderLazyPage(Page: LazyPage, fullscreen = false) {
  return (
    <Suspense fallback={<RouteLoader fullscreen={fullscreen} />}>
      <Page />
    </Suspense>
  )
}

export function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={renderLazyPage(Landing, true)} />
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={renderLazyPage(Dashboard)} />
              <Route path="rooms" element={renderLazyPage(Rooms)} />
              <Route path="automations" element={renderLazyPage(Automations)} />
              <Route path="energy" element={renderLazyPage(Energy)} />
              <Route path="integrations" element={renderLazyPage(Integrations)} />
              <Route path="security" element={renderLazyPage(Security)} />
              <Route path="notifications" element={renderLazyPage(Notifications)} />
              <Route path="settings" element={renderLazyPage(Settings)} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SearchProvider>
      <Toaster position="bottom-right" theme="dark" />
    </AuthProvider>
  )
}

export default App
