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

  // Realtime synchronization: Supabase Realtime channel + local storage/broadcast sync + polling fallback
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    async function pollProjects() {
      if (isFetching) return;
      isFetching = true;
      try {
        const cloudItems = await fetchProjectsFromSupabase();
        if (cloudItems && isMounted) {
          setConfig((prev) => {
            // Find any local items (e.g. newly added sections with id 'section-xxx' or 'file-xxx' not yet in cloud)
            const localOnlyItems = prev.portfolio.items.filter(
              item => item.id.startsWith('section-') || item.id.startsWith('file-') || item.id.startsWith('img-') || item.id.startsWith('pdf-')
            );

            // Reconstruct merged list preserving user order
            let mergedItems: PortfolioItem[] = [];
            if (localOnlyItems.length === 0) {
              mergedItems = cloudItems;
            } else {
              // Map cloud items by ID, preserving local imageUrl and pdfUrl if cloud doesn't have them
              const cloudMap = new Map(cloudItems.map(item => [item.id, item]));
              mergedItems = prev.portfolio.items.map(localItem => {
                const cloudItem = cloudMap.get(localItem.id);
                if (!cloudItem) return localItem;
                return {
                  ...cloudItem,
                  // Keep local image / pdf if cloud returned default or empty
                  imageUrl: (cloudItem.imageUrl && !cloudItem.imageUrl.includes('unsplash.com'))
                    ? cloudItem.imageUrl
                    : (localItem.imageUrl || cloudItem.imageUrl),
                  pdfUrl: cloudItem.pdfUrl || localItem.pdfUrl,
                  link: cloudItem.link || localItem.link
                };
              });
              // Append any cloud items that were added from another device
              cloudItems.forEach(ci => {
                if (!prev.portfolio.items.some(pi => pi.id === ci.id)) {
                  mergedItems.push(ci);
                }
              });
            }

            const currentStr = JSON.stringify(prev.portfolio.items);
            const mergedStr = JSON.stringify(mergedItems);

            if (currentStr !== mergedStr && mergedItems.length > 0) {
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
        isFetching = false;
        if (isMounted) {
          setIsInitialLoading(false);
        }
      }
    }

    // 1. Initial fetch
    pollProjects();

    // 2. Cross-tab synchronization (updates immediately across tabs when items/order change)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'woradech_portfolio_items_cache' || e.key?.startsWith('woradech_notion_site_config_')) {
        const refreshedConfig = loadSiteConfig();
        setConfig(refreshedConfig);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 3. Polling heartbeat every 3000ms (avoids connection exhaustion and ERR_QUIC_PROTOCOL_ERROR)
    const interval = setInterval(pollProjects, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
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
