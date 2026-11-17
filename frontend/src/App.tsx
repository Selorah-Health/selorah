import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorFallback from './components/ErrorFallback';
import RoleGuard from './components/RoleGuard';
import ScrollToTop from './components/ScrollToTop';
import InstallPrompt from './components/InstallPrompt';
import PrivacyPrompt from './components/PrivacyPrompt';
import AppearanceSync from './components/AppearanceSync';
import { ConfirmDialogHost } from './lib/dialogs';
import { ToastProvider } from './contexts/ToastContext';
import { SyncProvider } from './contexts/SyncContext';
import { SiteContentProvider } from './contexts/SiteContentContext';
import ToastViewport from './components/ToastViewport';
import NetworkStatus from './components/NetworkStatus';

// Lazy load all pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LandingPageStripe = lazy(() => import('./pages/LandingPageStripe'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Signup = lazy(() => import('./pages/Signup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const SharedRecord = lazy(() => import('./pages/SharedRecord'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Careers = lazy(() => import('./pages/Careers'));
const CareersRole = lazy(() => import('./pages/CareersRole'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const DataProcessing = lazy(() => import('./pages/DataProcessing'));
const HospitalDashboard = lazy(() => import('./pages/hospital/HospitalDashboard'));
const ResearcherDashboard = lazy(() => import('./pages/researcher/ResearcherDashboard'));
const InsurerDashboard = lazy(() => import('./pages/insurer/InsurerDashboard'));
const QaDashboard = lazy(() => import('./pages/qa/QaDashboard'));
const BlogIndex = lazy(() => import('./pages/BlogIndex'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const BlogCms = lazy(() => import('./pages/cms/BlogCms'));
const SiteCms = lazy(() => import('./pages/cms/SiteCms'));
const NotFound = lazy(() => import('./pages/NotFound'));
const WaitlistCount = lazy(() => import('./pages/WaitlistCount'));

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <SyncProvider>
          <ScrollToTop />
          <AppearanceSync />
          <PrivacyPrompt />
          <ConfirmDialogHost />
          <ToastViewport />
          <NetworkStatus />
          <InstallPrompt />
          <SiteContentProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                  </div>
                </div>
              }
            >
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/stripe" element={<LandingPageStripe />} />
              <Route path="/dashboard/*" element={<RoleGuard><Dashboard /></RoleGuard>} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/shared/:token" element={<SharedRecord />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/careers/:slug" element={<CareersRole />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/dpa" element={<DataProcessing />} />
              <Route path="/hospital/*" element={<RoleGuard><HospitalDashboard /></RoleGuard>} />
              <Route path="/researcher/*" element={<RoleGuard><ResearcherDashboard /></RoleGuard>} />
              <Route path="/insurer/*" element={<RoleGuard><InsurerDashboard /></RoleGuard>} />
              <Route path="/qa/*" element={<RoleGuard><QaDashboard /></RoleGuard>} />
              <Route path="/blog" element={<BlogIndex />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/adb/*" element={<RoleGuard><SiteCms /></RoleGuard>} />
              <Route path="/admin" element={<Navigate to="/adb" replace />} />
              <Route path="/cms/*" element={<RoleGuard><BlogCms /></RoleGuard>} />
              {import.meta.env.DEV && (
                <Route path="/cms-preview" element={<BlogCms previewMode />} />
              )}
              <Route path="/wc" element={<WaitlistCount />} />
              <Route path="/error" element={<ErrorFallback />} />
              <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SiteContentProvider>
        </SyncProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}