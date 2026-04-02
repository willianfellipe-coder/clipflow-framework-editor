import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { Editor } from './pages/Editor';
import { Templates } from './pages/Templates';
import { BatchJobs } from './pages/BatchJobs';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { ClipGen } from './pages/ClipGen';

export function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<ErrorBoundary fallbackLabel="Dashboard"><Dashboard /></ErrorBoundary>} />
        <Route path="/editor/:projectId?" element={<ErrorBoundary fallbackLabel="Editor"><Editor /></ErrorBoundary>} />
        <Route path="/clipgen/:projectId?" element={<ErrorBoundary fallbackLabel="ClipGen"><ClipGen /></ErrorBoundary>} />
        <Route path="/templates" element={<ErrorBoundary fallbackLabel="Templates"><Templates /></ErrorBoundary>} />
        <Route path="/batch" element={<ErrorBoundary fallbackLabel="Batch Jobs"><BatchJobs /></ErrorBoundary>} />
        <Route path="/settings" element={<ErrorBoundary fallbackLabel="Settings"><Settings /></ErrorBoundary>} />
        <Route path="/history" element={<ErrorBoundary fallbackLabel="History"><History /></ErrorBoundary>} />
      </Routes>
    </MainLayout>
  );
}
