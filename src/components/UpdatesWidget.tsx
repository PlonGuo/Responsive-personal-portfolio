import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BellDot, X, ExternalLink, RefreshCw, GitCommit } from 'lucide-react';

interface Commit {
  sha: string;
  message: string;
  date: string;
  author: string;
  url: string;
}

export default function UpdatesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCommits = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/github-commits');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setCommits(data.commits || []);
    } catch (err) {
      setError('Unable to load updates');
      console.error('Error fetching commits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && commits.length === 0) {
      fetchCommits();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Toggle Button - Middle Right */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 -translate-y-1/2 right-6 z-50 w-12 h-12 rounded-full
          bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600
          text-slate-300 hover:text-white
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-200
          border border-slate-700 dark:border-slate-600
          ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="View recent updates"
      >
        <BellDot className="w-5 h-5" />
      </motion.button>

      {/* Updates Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 -translate-y-1/2 right-6 z-50 w-80 max-h-[70vh]
              bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl
              rounded-2xl border border-slate-200 dark:border-slate-700
              shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/50
              overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white text-sm">
                  Recent Updates
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={fetchCommits}
                  disabled={loading}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Refresh"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {error ? (
                <p className="text-sm text-slate-500 text-center py-4">{error}</p>
              ) : loading && commits.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : commits.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No commits found
                </p>
              ) : (
                <ul className="space-y-2">
                  {commits.map((commit) => (
                    <li key={commit.sha}>
                      <a
                        href={commit.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <code className="text-xs bg-primary/10 text-primary px-2 py-1 rounded font-mono flex-shrink-0">
                            {commit.sha}
                          </code>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                              {commit.message}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDate(commit.date)}
                            </p>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <a
                href="https://github.com/PlonGuo/Responsive-personal-portfolio/commits/main"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:text-primary-dark transition-colors flex items-center gap-1"
              >
                View all commits
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
