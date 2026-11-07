import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/pages/LoginPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { ApplicationsListPage } from '@/pages/applications/ApplicationsListPage'
import { ApplicationsBoardPage } from '@/pages/applications/ApplicationsBoardPage'
import { ApplicationDetailPage } from '@/pages/applications/ApplicationDetailPage'
import { ApplicationFormPage } from '@/pages/applications/ApplicationFormPage'
import { ResumesListPage } from '@/pages/resumes/ResumesListPage'
import { ResumeDetailPage } from '@/pages/resumes/ResumeDetailPage'
import { ResumeFormPage } from '@/pages/resumes/ResumeFormPage'
import { InterviewsListPage } from '@/pages/interviews/InterviewsListPage'
import { InterviewDetailPage } from '@/pages/interviews/InterviewDetailPage'
import { InterviewFormPage } from '@/pages/interviews/InterviewFormPage'
import { InterviewDebriefPage } from '@/pages/interviews/InterviewDebriefPage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { RecommendationsPage } from '@/pages/recommendations/RecommendationsPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { PrepPage } from '@/pages/prep/PrepPage'
import { QuestionBankPage } from '@/pages/prep/QuestionBankPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsListPage />} />
          <Route path="/applications/new" element={<ApplicationFormPage />} />
          <Route path="/applications/board" element={<ApplicationsBoardPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
          <Route path="/resumes" element={<ResumesListPage />} />
          <Route path="/resumes/new" element={<ResumeFormPage />} />
          <Route path="/resumes/:id" element={<ResumeDetailPage />} />
          <Route path="/resumes/:id/edit" element={<ResumeFormPage />} />
          <Route path="/interviews" element={<InterviewsListPage />} />
          <Route path="/interviews/new" element={<InterviewFormPage />} />
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
          <Route path="/interviews/:id/edit" element={<InterviewFormPage />} />
          <Route path="/interviews/:id/debrief" element={<InterviewDebriefPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/prep" element={<PrepPage />} />
          <Route path="/prep/questions" element={<QuestionBankPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
