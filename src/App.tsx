import { useState, useEffect } from 'react';
import type { SiteConfig, PortfolioItem } from './types';
import { loadSiteConfig, saveSiteConfig } from './types';
import { PublicSite, type PageRoute } from './components/PublicSite';
import { SiteEditor } from './components/SiteEditor';
import { AdminPinModal } from './components/AdminPinModal';
import { fetchProjectsFromSupabase, syncProjectOrderToSupabase } from './supabase';

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(() => loadSiteConfig());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    // If cached portfolio items already exist, don't show loading
    return config.portfolio.items.length === 0;
  });
  
  // Page routing: 'home' | 'about' | 'portfolio' | '404'
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const hash = window.location.hash.replace('#', '');
    if (!path && !hash) return 'home';
    if (path === 'home' || hash === 'home') return 'home';
    if (path === 'about' || hash === 'about') return 'about';
    if (path === 'portfolio' || hash === 'portfolio') return 'portfolio';
    if (path === 'admin' || hash === 'admin' || path === 'editor' || hash === 'editor') return 'home';
    return '404';
  });

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(() => {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') === 'editor' || path === 'editor' || path === 'admin' || hash === 'editor' || hash === 'admin';
  });

  // Realtime polling every 1 sec from Supabase and sync with localStorage
  useEffect(() => {
    let isMounted = true;

    async function pollProjects() {
      try {
        const cloudItems = await fetchProjectsFromSupabase();
        if (cloudItems && isMounted) {
          setConfig((prev) => {
            const currentItems = prev.portfolio.items;
            const currentIds = currentItems.map(i => i.id);
            const cloudIds = cloudItems.map(i => i.id);

            // Check if there are new items added or items deleted in the cloud
            const hasNewOrDeleted = cloudIds.some(id => !currentIds.includes(id)) || currentIds.some(id => !cloudIds.includes(id));
            
            // Check if content of existing items has changed
            const cloudMap = new Map(cloudItems.map(i => [i.id, i]));
            const hasContentChanged = currentItems.some(item => {
              const cloud = cloudMap.get(item.id);
              if (!cloud) return false;
              return item.title !== cloud.title || 
                     item.description !== cloud.description || 
                     item.pdfUrl !== cloud.pdfUrl || 
                     item.imageUrl !== cloud.imageUrl;
            });

            if (hasNewOrDeleted || hasContentChanged) {
              // Maintain current user-arranged order for existing items, append any newly discovered cloud items to the top
              const updatedExisting = currentItems
                .filter(item => cloudMap.has(item.id))
                .map(item => ({ ...item, ...cloudMap.get(item.id) }));
              
              const newlyAdded = cloudItems.filter(item => !currentIds.includes(item.id));
              const mergedItems = [...newlyAdded, ...updatedExisting];

              const updated = {
                ...prev,
                portfolio: {
                  ...prev.portfolio,
                  items: mergedItems
                }
              };
              saveSiteConfig(updated);
              return updated;
            }
            return prev;
          });
        }
      } catch (e) {
        // quiet error to prevent spamming console
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    // Initial fetch
    pollProjects();

    // Poll every 1000ms (1 sec)
    const interval = setInterval(pollProjects, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Listen to popstate (back/forward navigation)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(window.location.search);
      const isEditor = params.get('mode') === 'editor' || path === 'editor' || path === 'admin' || hash === 'editor' || hash === 'admin';
      setIsEditorOpen(isEditor);

      if (!path && !hash) {
        setCurrentPage('home');
      } else if (path === 'home' || hash === 'home') {
        setCurrentPage('home');
      } else if (path === 'about' || hash === 'about') {
        setCurrentPage('about');
      } else if (path === 'portfolio' || hash === 'portfolio') {
        setCurrentPage('portfolio');
      } else if (path === 'admin' || hash === 'admin' || path === 'editor' || hash === 'editor') {
        setCurrentPage('home');
      } else {
        setCurrentPage('404');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  useEffect(() => {
    document.title = config.siteTitle || "Woradech / Portfolio";
  }, [config]);

  // Clean navigation without any # (e.g. /home, /about, /portfolio)
  const handleNavigate = (page: PageRoute) => {
    setCurrentPage(page);
    const targetPath = page === 'home' ? '/' : `/${page}`;
    window.history.pushState(null, '', targetPath);
  };

  const handleUpdateConfig = (newConfig: SiteConfig) => {
    setConfig(newConfig);
    saveSiteConfig(newConfig);
  };

  const openEditor = () => {
    setIsEditorOpen(true);
    setIsAdminAuthenticated(false); // Always prompt for PIN every time!
    window.history.pushState(null, '', '/admin');
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setIsAdminAuthenticated(false);
    const targetPath = currentPage === 'home' ? '/' : `/${currentPage}`;
    window.history.pushState(null, '', targetPath);
  };

  const handleAddProject = (newProject: PortfolioItem) => {
    const updated = {
      ...config,
      portfolio: {
        ...config.portfolio,
        items: [...config.portfolio.items, newProject]
      }
    };
    setConfig(updated);
    saveSiteConfig(updated);
  };

  const handleUpdateProject = (updatedProject: PortfolioItem) => {
    const updated = {
      ...config,
      portfolio: {
        ...config.portfolio,
        items: config.portfolio.items.map(item => item.id === updatedProject.id ? updatedProject : item)
      }
    };
    setConfig(updated);
    saveSiteConfig(updated);
  };

  const handleDeleteProject = (deletedId: string) => {
    const updated = {
      ...config,
      portfolio: {
        ...config.portfolio,
        items: config.portfolio.items.filter(item => item.id !== deletedId)
      }
    };
    setConfig(updated);
    saveSiteConfig(updated);
  };

  const handleReorderProjects = (reorderedProjects: PortfolioItem[]) => {
    const updated = {
      ...config,
      portfolio: {
        ...config.portfolio,
        items: reorderedProjects
      }
    };
    setConfig(updated);
    saveSiteConfig(updated);
    // Persist new order to Supabase cloud
    syncProjectOrderToSupabase(reorderedProjects);
  };

  return (
    <>
      {isEditorOpen ? (
        !isAdminAuthenticated ? (
          <AdminPinModal
            onSuccess={() => setIsAdminAuthenticated(true)}
            onCancel={closeEditor}
          />
        ) : (
          <SiteEditor
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onCloseEditor={closeEditor}
            projects={config.portfolio.items}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onReorderProjects={handleReorderProjects}
          />
        )
      ) : (
        <PublicSite
          config={config}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenEditor={openEditor}
          isInitialLoading={isInitialLoading}
        />
      )}
    </>
  );
}
