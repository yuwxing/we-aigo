import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

import { ErrorBoundary } from './components/ErrorBoundary';
import { UserProvider } from './contexts/UserContext';
import HomePage from './pages/HomePage';
import AgentsPage from './pages/AgentsPage';
import AgentDetailPage from './pages/AgentDetailPage';
import TasksPage from './pages/TasksPage';
import TaskDetailPage from './pages/TaskDetailPage';
import CreateTaskPage from './pages/CreateTaskPage';
import CreateAgentPage from './pages/CreateAgentPage';
import RegisterPage from './pages/RegisterPage';
import CreateWorkshop from './pages/CreateWorkshop';
import VideoSearchPage from './pages/VideoSearchPage';
import TransactionsPage from './pages/TransactionsPage';
import SubmitResultPage from './pages/SubmitResultPage';
import ApplyPage from './pages/ApplyPage';
import JoinPage from './pages/JoinPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import DeliveryDetailPage from './pages/DeliveryDetailPage';
import AgentWorkspacePage from './pages/AgentWorkspacePage';
import MyAgentsPage from './pages/MyAgentsPage';
import JobClassroomPage from './pages/JobClassroomPage';
import WordCardPage from './pages/WordCardPage';
import JobSquarePage from './pages/JobSquarePage';
import BalancePage from './pages/BalancePage';
import RulesPage from './pages/RulesPage';
import AdminFeedbackPage from './pages/AdminFeedbackPage';
import AdoptPage from './pages/AdoptPage';
import PetChatPage from './pages/PetChatPage';
import FeedbackPage from './pages/FeedbackPage';
import BenefitsPage from './pages/BenefitsPage';
import JobAnnouncementsPage from './pages/JobAnnouncementsPage';
import AdminCompensatePage from './pages/AdminCompensatePage';
import AIGCTemplatesPage from './pages/AIGCTemplatesPage';
import InspectionPage from './pages/InspectionPage';
import EnglishDailyPage from './pages/EnglishDailyPage';
import ListeningSpeakingPage from './pages/ListeningSpeakingPage';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#fff',
              borderRadius: '12px',
            },
          }}
        />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/agents" element={<AgentsPage />} />
              <Route path="/agents/:id" element={<AgentDetailPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/workspace/:taskId" element={<AgentWorkspacePage />} />
              <Route path="/my-agents" element={<MyAgentsPage />} />
              <Route path="/create-task" element={<CreateTaskPage />} />
              <Route path="/create-agent" element={<CreateAgentPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/create" element={<CreateWorkshop />} />
              <Route path="/video-search" element={<VideoSearchPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/submit-result/:taskId" element={<SubmitResultPage />} />
              <Route path="/apply/:agentId?" element={<ApplyPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/delivery/:id" element={<DeliveryDetailPage />} />
              <Route path="/classroom" element={<JobClassroomPage />} />
              <Route path="/word-cards" element={<WordCardPage />} />
              <Route path="/job-square" element={<JobSquarePage />} />
              <Route path="/balance" element={<BalancePage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
              <Route path="/adopt" element={<AdoptPage />} />
              <Route path="/pet-chat/:petId" element={<PetChatPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/benefits" element={<BenefitsPage />} />
              <Route path="/english-daily" element={<EnglishDailyPage />} />
              <Route path="/listening-speaking" element={<ListeningSpeakingPage />} />
              <Route path="/announcements" element={<JobAnnouncementsPage />} />
              <Route path="/admin/compensate" element={<AdminCompensatePage />} />
              <Route path="/admin/inspections" element={<InspectionPage />} />

              <Route path="/aigc-templates" element={<AIGCTemplatesPage />} />
            </Routes>
          </Layout>
          {/* 独立页面 - 不使用 Layout */}
          <Routes>

          </Routes>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
