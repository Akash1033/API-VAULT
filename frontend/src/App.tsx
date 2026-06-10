// Path: src/App.tsx
// Purpose: Application routing with nested Admin layout and analytics page tracking
// Dependencies: react, react-router-dom, usePageTracker

import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SectionSkeleton } from './components/shared/SectionSkeleton';
import { Toast } from './components/admin/Toast';
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { usePageTracker } from './hooks/usePageTracker';

// Lazy load route pages
const PortfolioPage = React.lazy(() => import('./pages/PortfolioPage').then(m => ({ default: m.PortfolioPage })));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ArticlesPage = React.lazy(() => import('./pages/ArticlesPage').then(m => ({ default: m.ArticlesPage })));
const ProjectDetailPage = React.lazy(() => import('./pages/ProjectDetailPage').then(m => ({ default: m.ProjectDetailPage })));
const ArticleDetailPage = React.lazy(() => import('./pages/ArticleDetailPage').then(m => ({ default: m.ArticleDetailPage })));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin').then(m => ({ default: m.AdminLogin })));
const NotFound = React.lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const AdminProjects = React.lazy(() => import('./pages/admin/AdminProjects').then(m => ({ default: m.AdminProjects })));
const AdminSkills = React.lazy(() => import('./pages/admin/AdminSkills').then(m => ({ default: m.AdminSkills })));
const AdminExperience = React.lazy(() => import('./pages/admin/AdminExperience').then(m => ({ default: m.AdminExperience })));
const AdminArticles = React.lazy(() => import('./pages/admin/AdminArticles').then(m => ({ default: m.AdminArticles })));
const AdminCertifications = React.lazy(() => import('./pages/admin/AdminCertifications').then(m => ({ default: m.AdminCertifications })));
const AdminMessages = React.lazy(() => import('./pages/admin/AdminMessages').then(m => ({ default: m.AdminMessages })));
const AdminAnalytics = React.lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminPayments = React.lazy(() => import('./pages/admin/AdminPayments'));

/**
 * Inner wrapper component that has Router context.
 * Calls usePageTracker to automatically track every public route change.
 */
const AppInner: React.FC = () => {
  usePageTracker();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <PortfolioPage />
          </Suspense>
        }
      />
      <Route
        path="/projects"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <ProjectsPage />
          </Suspense>
        }
      />
      <Route
        path="/projects/:slug"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <ProjectDetailPage />
          </Suspense>
        }
      />
      <Route
        path="/articles"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <ArticlesPage />
          </Suspense>
        }
      />
      <Route
        path="/articles/:slug"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <ArticleDetailPage />
          </Suspense>
        }
      />

      <Route
        path="/admin/login"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <AdminLogin />
          </Suspense>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminDashboard />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/projects"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminProjects />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/skills"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminSkills />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/experience"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminExperience />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/articles"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminArticles />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/certifications"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminCertifications />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/messages"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminMessages />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/analytics"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminAnalytics />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/payments"
        element={
          <AdminRoute>
            <AdminLayout>
              <Suspense fallback={<SectionSkeleton />}>
                <AdminPayments />
              </Suspense>
            </AdminLayout>
          </AdminRoute>
        }
      />

      <Route
        path="*"
        element={
          <Suspense fallback={<SectionSkeleton />}>
            <NotFound />
          </Suspense>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <>
      <Toast />
      <AppInner />
    </>
  );
};
