import { useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import LabPage from './pages/LabPage';

// Take manual control so the browser doesn't fight React's async rendering
window.history.scrollRestoration = 'manual';

function ScrollManager() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  // Save scroll position before the page unloads (refresh / tab close)
  useEffect(() => {
    const save = () => {
      sessionStorage.setItem(`scroll:${pathname}`, String(window.scrollY));
    };
    window.addEventListener('beforeunload', save);
    return () => window.removeEventListener('beforeunload', save);
  }, [pathname]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // On refresh: restore saved position after React has painted
      const saved = sessionStorage.getItem(`scroll:${pathname}`);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
        });
      }
      return;
    }
    // On route navigation: scroll to top and clear any saved position
    sessionStorage.removeItem(`scroll:${pathname}`);
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
    <ScrollManager />
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/lab" element={<LabPage />} />
      </Route>
    </Routes>
    </>
  );
}

export default App;
