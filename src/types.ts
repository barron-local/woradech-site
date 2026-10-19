export interface CarouselSlide {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  link?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  imageUrl: string;
  link?: string;
  tags: string[];
  status?: string;
  pdfUrl?: string;
  fileName?: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  institutionEn?: string;
  degree: string;
  major?: string;
  period: string;
  description?: string;
  logoUrl: string;
  current?: boolean;
}

export interface SiteConfig {
  siteTitle: string;
  logoText: string;
  
  // Navigation (เฉพาะ Home, About, Portfolio/Projects - ไม่มี Contact)
  navLinks: {
    home: string;
    about: string;
    portfolio: string;
  };

  // Home Page: Hero Section (เป็นรูปภาพเพียวๆ เต็มตา ไม่มีข้อความทับ)
  heroImage: {
    imageUrl: string;
    height: string; // e.g. "500px", "600px", "100vh"
    altText: string;
  };

  // Home Page: Carousel Section ต่อจาก Hero
  carousel: {
    title: string;
    subtitle: string;
    autoplay: boolean;
    interval: number; // ms
    slides: CarouselSlide[];
  };

  // About Page (แยกหน้า)
  about: {
    title: string;
    subtitle: string;
    bioParagraph1: string;
    bioParagraph2: string;
    avatarUrl: string;
    skills: string[];
    education?: EducationItem[];
    experienceYears: string;
    completedProjects: string;
    happyClients: string;
  };

  // Portfolio / Projects Page (แยกหน้า)
  portfolio: {
    title: string;
    subtitle: string;
    items: PortfolioItem[];
  };

  // Footer
  footer: {
    tagline: string;
    email: string;
    phone: string;
    location: string;
    copyrightText: string;
  };
}

export const defaultSiteConfig: SiteConfig = {
  siteTitle: "Woradech / Portfolio & Works",
  logoText: "WORADECH",
  navLinks: {
    home: "Home",
    about: "About",
    portfolio: "Portfolio"
  },
  heroImage: {
    imageUrl: "/banner.png",
    height: "520px",
    altText: "Hero Banner"
  },
  carousel: {
    title: "Featured Highlights",
    subtitle: "A showcase of selected creative works and featured snapshots",
    autoplay: true,
    interval: 4000,
    slides: [
      {
        id: "slide-1",
        title: "",
        caption: "",
        imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80",
        link: "#portfolio"
      },
      {
        id: "slide-2",
        title: "",
        caption: "",
        imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
        link: "#portfolio"
      },
      {
        id: "slide-3",
        title: "",
        caption: "",
        imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
        link: "#portfolio"
      }
    ]
  },
  about: {
    title: "About Me",
    subtitle: "Frontend Architect, Designer & Digital Craftsman",
    bioParagraph1: "Welcome to my digital space. I specialize in designing and engineering high-caliber web applications, modular tools, and minimalist interfaces with an uncompromising focus on clarity and speed.",
    bioParagraph2: "Every detail is thoughtfully assembled to offer intuitive user experiences and maintainable clean code architecture.",
    avatarUrl: "/me.jpeg",
    skills: ["TypeScript", "React", "Next.js", "Design Systems", "Tailwind CSS", "Architecture"],
    education: [
      {
        id: "edu-1",
        institution: "โรงเรียนสวนกุหลาบวิทยาลัย นครศรีธรรมราช",
        institutionEn: "Suankularb Wittayalai Nakhon Si Thammarat School (ส.ก.นศ.)",
        degree: "มัธยมศึกษาตอนต้น (ม.1 - ม.3)",
        major: "",
        period: "2019 - 2022",
        description: "",
        logoUrl: "/logo-skns.png",
        current: false
      },
      {
        id: "edu-2",
        institution: "วิทยาลัยเทคนิคนครศรีธรรมราช",
        institutionEn: "Nakhonsithammarat Technical College (วท.นศ.)",
        degree: "ประกาศนียบัตรวิชาชีพ (ปวช. 1 - ปวช. 3)",
        major: "สาขา เทคโนโลยีสารสนเทศ",
        period: "2022 - 2025",
        description: "",
        logoUrl: "/logo-tnk.jpg",
        current: false
      },
      {
        id: "edu-3",
        institution: "วิทยาลัยเทคนิคนครศรีธรรมราช",
        institutionEn: "Nakhonsithammarat Technical College (วท.นศ.)",
        degree: "ประกาศนียบัตรวิชาชีพชั้นสูง (ปวส. 1)",
        major: "สาขา เทคโนโลยีสารสนเทศ",
        period: "2025 - ปัจจุบัน",
        description: "",
        logoUrl: "/logo-tnk.jpg",
        current: true
      }
    ],
    experienceYears: "5+",
    completedProjects: "45+",
    happyClients: "30+"
  },
  portfolio: {
    title: "Portfolio & Projects",
    subtitle: "",
    items: []
  },
  footer: {
    tagline: "Built with Notion simplicity and modern web standards.",
    email: "contact@woradech.dev",
    phone: "+66 81 234 5678",
    location: "Bangkok, Thailand",
    copyrightText: "© 2026 Woradech. All rights reserved."
  }
};

const STORAGE_KEY = "woradech_notion_site_config_v14";
const PORTFOLIO_CACHE_KEY = "woradech_portfolio_items_cache";

export function loadSiteConfig(): SiteConfig {
  try {
    // 1. Try to load cached portfolio items first to prevent empty state flash on refresh
    let cachedPortfolioItems: PortfolioItem[] = [];
    try {
      const savedPortfolio = localStorage.getItem(PORTFOLIO_CACHE_KEY);
      if (savedPortfolio) {
        cachedPortfolioItems = JSON.parse(savedPortfolio);
      }
    } catch {}

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { 
        ...defaultSiteConfig, 
        ...parsed,
        heroImage: {
          ...defaultSiteConfig.heroImage,
          imageUrl: (parsed.heroImage?.imageUrl && !parsed.heroImage.imageUrl.includes('unsplash.com'))
            ? parsed.heroImage.imageUrl
            : defaultSiteConfig.heroImage.imageUrl
        },
        portfolio: {
          ...defaultSiteConfig.portfolio,
          ...(parsed.portfolio || {}),
          items: (parsed.portfolio?.items && parsed.portfolio.items.length > 0)
            ? parsed.portfolio.items
            : (cachedPortfolioItems.length > 0 ? cachedPortfolioItems : defaultSiteConfig.portfolio.items)
        },
        about: {
          ...defaultSiteConfig.about,
          ...(parsed.about || {}),
          title: "About Me",
          avatarUrl: (parsed.about?.avatarUrl && !parsed.about.avatarUrl.includes('unsplash.com'))
            ? parsed.about.avatarUrl
            : defaultSiteConfig.about.avatarUrl,
          education: defaultSiteConfig.about.education
        }
      };
    } else if (cachedPortfolioItems.length > 0) {
      return {
        ...defaultSiteConfig,
        portfolio: {
          ...defaultSiteConfig.portfolio,
          items: cachedPortfolioItems
        }
      };
    }
  } catch (e) {
    console.error("Error loading site config:", e);
  }
  return defaultSiteConfig;
}

// Helper to purge old versions or heavy localStorage entries
function cleanupOldLocalStorageKeys(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("woradech_notion_site_config_") && k !== STORAGE_KEY) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

export function saveSiteConfig(config: SiteConfig): void {
  try {
    // 1. Sanitize portfolio items so base64 data URLs don't blow up 5MB localStorage quota
    const sanitizedPortfolioItems = (config.portfolio?.items || []).map(item => {
      const isDataUrl = item.pdfUrl?.startsWith('data:');
      return {
        ...item,
        pdfUrl: isDataUrl ? '' : item.pdfUrl,
        link: item.link?.startsWith('data:') ? '' : item.link
      };
    });

    const sanitizedConfig = {
      ...config,
      portfolio: {
        ...config.portfolio,
        items: sanitizedPortfolioItems
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedConfig));
    localStorage.setItem(PORTFOLIO_CACHE_KEY, JSON.stringify(sanitizedPortfolioItems));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.message?.includes('quota')) {
      try {
        cleanupOldLocalStorageKeys();
        // Try saving minimal version
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...config,
          portfolio: { ...config.portfolio, items: [] }
        }));
      } catch (inner) {
        console.warn("Storage quota full, continuing in-memory mode.");
      }
    } else {
      console.error("Error saving site config:", e);
    }
  }
}

export function resetSiteConfig(): SiteConfig {
  localStorage.removeItem(STORAGE_KEY);
  return defaultSiteConfig;
}
