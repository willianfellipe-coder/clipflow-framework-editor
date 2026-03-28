import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { Templates } from './pages/Templates';
import { BatchJobs } from './pages/BatchJobs';
import { Settings } from './pages/Settings';
import { History } from './pages/History';

export function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/editor/:projectId?" element={<Editor />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/batch" element={<BatchJobs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </MainLayout>
  );
}
