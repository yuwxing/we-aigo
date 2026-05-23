import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import HomePage from '../pages/HomePage';
import { MarsBase } from '../main';
import AgentsPage from '../pages/AgentsPage';
import AgentDetailPage from '../pages/AgentDetailPage';
import CreateTaskPage from '../pages/CreateTaskPage';
import CreateAgentPage from '../pages/CreateAgentPage';
import JobSquarePage from '../pages/JobSquarePage';
import JobClassroomPage from '../pages/JobClassroomPage';
import JobAnnouncementsPage from '../pages/JobAnnouncementsPage';
import BenefitsPage from '../pages/BenefitsPage';
import BalancePage from '../pages/BalancePage';
import FeedbackPage from '../pages/FeedbackPage';
import RegisterPage from '../pages/RegisterPage';
import AdoptPage from '../pages/AdoptPage';
import JinghuaHomePage from '../pages/JinghuaHomePage';
import JinghuaMentorsPage from '../pages/JinghuaMentorsPage';
import JinghuaLabsPage from '../pages/JinghuaLabsPage';
import JinghuaLibraryPage from '../pages/JinghuaLibraryPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/tasks" element={<MarsBase />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/:id" element={<AgentDetailPage />} />
        <Route path="/create-task" element={<CreateTaskPage />} />
        <Route path="/create-agent" element={<CreateAgentPage />} />
        <Route path="/job-square" element={<JobSquarePage />} />
        <Route path="/classroom" element={<JobClassroomPage />} />
        <Route path="/announcements" element={<JobAnnouncementsPage />} />
        <Route path="/benefits" element={<BenefitsPage />} />
        <Route path="/balance" element={<BalancePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/adopt" element={<AdoptPage />} />
        <Route path="/jinghua" element={<JinghuaHomePage />} />
        <Route path="/jinghua/mentors" element={<JinghuaMentorsPage />} />
        <Route path="/jinghua/labs" element={<JinghuaLabsPage />} />
        <Route path="/jinghua/library" element={<JinghuaLibraryPage />} />
      </Route>
    </Routes>
  );
}