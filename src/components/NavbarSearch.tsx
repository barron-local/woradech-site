import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { SiteConfig } from '../types';
import type { PageRoute } from './PublicSite';
import {
  Search,
  X,
  FileText,
  BookOpen,
  Tag,
  GraduationCap,
  Layers,
  Home,
  CornerDownLeft,
  Sparkles
} from 'lucide-react';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: { bg: string; text: string; border: string };
  categoryType: 'page' | 'unit' | 'work' | 'tag' | 'education' | 'section';
  targetPage: PageRoute;
  targetId?: string;
  keywords: string[];
  pdfUrl?: string;
  imageUrl?: string;
}

interface NavbarSearchProps {
  config: SiteConfig;
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
  config,
  currentPage,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Build indexed search items from config
  const searchIndex = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Pages & Major Sections
    items.push({
      id: 'page-home',
      title: 'หน้าแรก (Home)',
      subtitle: 'แบนเนอร์หลักและหน้าเริ่มต้น',
      badge: 'หน้า',
      badgeColor: { bg: '#f4f4f5', text: '#3f3f46', border: '#e4e4e7' },
      categoryType: 'page',
      targetPage: 'home',
      targetId: 'home-hero',
      keywords: ['home', 'หน้าแรก', 'หน้าหลัก', 'banner', 'แบนเนอร์', 'เริ่มต้น']
    });

    items.push({
      id: 'page-carousel',
      title: config.carousel.title || 'ผลงานและกิจกรรมเด่น',
      subtitle: 'สไลด์โชว์ไฮไลท์กิจกรรมและผลงาน',
      badge: 'ไฮไลท์',
      badgeColor: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
      categoryType: 'section',
      targetPage: 'home',
      targetId: 'home-carousel',
      keywords: ['carousel', 'กิจกรรม', 'ไฮไลท์', 'สไลด์', 'ภาพกิจกรรม', 'highlights', 'รูปภาพ']
    });

    items.push({
      id: 'page-about',
      title: 'เกี่ยวกับฉัน (About Me)',
      subtitle: 'ข้อมูลส่วนตัว ประวัติการศึกษา',
      badge: 'หน้า',
      badgeColor: { bg: '#f4f4f5', text: '#3f3f46', border: '#e4e4e7' },
      categoryType: 'page',
      targetPage: 'about',
      targetId: 'about-profile',
      keywords: ['about', 'เกี่ยวกับ', 'ประวัติ', 'ประวัติส่วนตัว', 'ข้อมูลส่วนตัว', 'วรเดช', 'ทาม']
    });

    items.push({
      id: 'section-parents',
      title: 'ข้อมูลผู้ปกครอง (บิดา & มารดา)',
      subtitle: 'ข้อมูลครอบครัวและการติดต่อผู้ปกครอง',
      badge: 'ครอบครัว',
      badgeColor: { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' },
      categoryType: 'section',
      targetPage: 'about',
      targetId: 'about-parents',
      keywords: ['parents', 'บิดา', 'มารดา', 'พ่อ', 'แม่', 'ผู้ปกครอง', 'ครอบครัว', 'อภินันท์', 'สุรางคนา']
    });

    items.push({
      id: 'section-education',
      title: 'ประวัติการศึกษา (Education Timeline)',
      subtitle: 'ข้อมูลสถาบันการศึกษาตั้งแต่ ม.ต้น จนถึง ปวส.',
      badge: 'การศึกษา',
      badgeColor: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
      categoryType: 'education',
      targetPage: 'about',
      targetId: 'about-education',
      keywords: ['education', 'การศึกษา', 'ประวัติการศึกษา', 'วุฒิ', 'เรียน', 'โรงเรียน', 'วิทยาลัย']
    });

    // Education items
    if (config.about.education && config.about.education.length > 0) {
      config.about.education.forEach((edu, idx) => {
        items.push({
          id: `edu-${edu.id || idx}`,
          title: edu.institution,
          subtitle: `${edu.degree}${edu.major ? ` • ${edu.major}` : ''} (${edu.period})`,
          badge: 'การศึกษา',
          badgeColor: { bg: '#fff7ed', text: '#c2410c', border: '#ffedd5' },
          categoryType: 'education',
          targetPage: 'about',
          targetId: `edu-${edu.id || idx}`,
          keywords: [
            edu.institution,
            edu.institutionEn || '',
            edu.degree,
            edu.major || '',
            'สวนกุหลาบ',
            'เทคนิค',
            'สถาบัน',
            'ปวช',
            'ปวส',
            'มัธยม'
          ]
        });
      });
    }

    items.push({
      id: 'page-portfolio',
      title: 'ผลงานทั้งหมด (My Work)',
      subtitle: 'คลังรวบรวมชิ้นงาน ใบงาน และเอกสารทั้งหมด',
      badge: 'หน้า',
      badgeColor: { bg: '#f4f4f5', text: '#3f3f46', border: '#e4e4e7' },
      categoryType: 'page',
      targetPage: 'portfolio',
      targetId: 'portfolio-root',
      keywords: ['portfolio', 'my work', 'ผลงาน', 'งาน', 'ใบงาน', 'เอกสาร', 'ชิ้นงาน', 'โปรเจกต์']
    });

    // 2. Units / Sections & Portfolio Works
    let currentUnitName = 'ผลงานทั่วไป';
    const tagMap = new Map<string, { count: number; firstItemId: string }>();

    if (config.portfolio && config.portfolio.items) {
      config.portfolio.items.forEach((item) => {
        if (item.itemType === 'section') {
          currentUnitName = item.title;
          items.push({
            id: `sec-${item.id}`,
            title: item.title,
            subtitle: 'หน่วยการเรียนรู้ / หมวดหมู่ผลงาน',
            badge: 'หน่วย',
            badgeColor: { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' },
            categoryType: 'unit',
            targetPage: 'portfolio',
            targetId: `section-${item.id}`,
            keywords: [item.title, 'หน่วย', 'บทที่', 'หมวดหมู่', 'unit', 'section']
          });
        } else {
          // Regular Portfolio Item
          const isGenericType = !item.category || /^(pdf|image|pdf document|image document|document)$/i.test(item.category.trim());
          const cleanBadge = isGenericType ? 'ผลงาน' : item.category;

          items.push({
            id: `work-${item.id}`,
            title: item.title,
            subtitle: currentUnitName,
            badge: cleanBadge,
            badgeColor: { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe' },
            categoryType: 'work',
            targetPage: 'portfolio',
            targetId: `portfolio-item-${item.id}`,
            keywords: [
              item.title,
              item.description || '',
              item.category || '',
              currentUnitName,
              ...(item.tags || []),
              item.fileName || '',
              'งาน',
              'ใบงาน',
              'ชิ้นงาน',
              'pdf'
            ],
            pdfUrl: item.pdfUrl || item.link,
            imageUrl: item.imageUrl
          });

          // Index Tags
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((t) => {
              const cleanTag = t.trim();
              if (cleanTag) {
                const existing = tagMap.get(cleanTag);
                if (existing) {
                  existing.count += 1;
                } else {
                  tagMap.set(cleanTag, { count: 1, firstItemId: item.id });
                }
              }
            });
          }
        }
      });
    }

    // 3. Add Indexed Tags
    tagMap.forEach((meta, tagText) => {
      items.push({
        id: `tag-${tagText}`,
        title: `#${tagText}`,
        subtitle: `ป้ายกำกับ (${meta.count} ชิ้นงาน)`,
        badge: 'ป้ายกำกับ',
        badgeColor: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
        categoryType: 'tag',
        targetPage: 'portfolio',
        targetId: `portfolio-item-${meta.firstItemId}`,
        keywords: [tagText, 'tag', 'ป้ายกำกับ', 'แท็ก', 'หมวดหมู่']
      });
    });

    return items;
  }, [config]);

  // Filtered Results based on query
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // Default preview when query is empty:
      // Show main pages and limit units to maximum 2 units only
      const pages = searchIndex.filter((item) => item.categoryType === 'page');
      const units = searchIndex.filter((item) => item.categoryType === 'unit').slice(0, 2);
      return [...pages, ...units];
    }

    const matches: { item: SearchResultItem; score: number }[] = [];

    searchIndex.forEach((item) => {
      const lowerTitle = item.title.toLowerCase();
      const lowerSubtitle = item.subtitle.toLowerCase();

      let score = 0;

      // Exact title match
      if (lowerTitle === trimmed) {
        score = 100;
      }
      // Title starts with query
      else if (lowerTitle.startsWith(trimmed)) {
        score = 80;
      }
      // Title contains query
      else if (lowerTitle.includes(trimmed)) {
        score = 60;
      }
      // Subtitle or Unit contains query
      else if (lowerSubtitle.includes(trimmed)) {
        score = 40;
      }
      // Keywords or tags match
      else if (item.keywords.some((kw) => kw.toLowerCase().includes(trimmed))) {
        score = 25;
      }

      if (score > 0) {
        matches.push({ item, score });
      }
    });

    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 9).map((m) => m.item);
  }, [query, searchIndex]);

  // Handle Global Keyboard Shortcut (Ctrl+K, Cmd+K, '/')
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle Click Outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Keep selected index in bound
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Precise Scroll Handler ("พอดีเป๊ะ")
  const handleSelectResult = (item: SearchResultItem) => {
    setIsOpen(false);
    setQuery('');

    const executeScroll = () => {
      if (!item.targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const targetEl = document.getElementById(item.targetId);
      if (targetEl) {
        // Sticky Header is 52px high. With 18px margin, offset = -70px
        const headerOffset = 70;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    // If item is on another page, navigate first then scroll
    if (currentPage !== item.targetPage) {
      onNavigate(item.targetPage);
      setTimeout(executeScroll, 120);
    } else {
      executeScroll();
    }
  };

  // Keyboard navigation within suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelectResult(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Helper to render type icons
  const renderItemIcon = (type: SearchResultItem['categoryType']) => {
    switch (type) {
      case 'page':
        return <Home size={15} style={{ color: '#71717a' }} />;
      case 'unit':
        return <Layers size={15} style={{ color: '#7e22ce' }} />;
      case 'work':
        return <FileText size={15} style={{ color: '#2563eb' }} />;
      case 'tag':
        return <Tag size={15} style={{ color: '#059669' }} />;
      case 'education':
        return <GraduationCap size={15} style={{ color: '#ea580c' }} />;
      case 'section':
        return <Sparkles size={15} style={{ color: '#d97706' }} />;
      default:
        return <BookOpen size={15} style={{ color: '#71717a' }} />;
    }
  };

  // Highlight matching text in title
  const highlightMatch = (text: string, q: string) => {
    const cleanQ = q.trim();
    if (!cleanQ) return text;

    const regex = new RegExp(`(${cleanQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            backgroundColor: '#fef08a',
            color: '#854d0e',
            padding: '1px 3px',
            borderRadius: '3px',
            fontWeight: 700
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* 1. Desktop Search Trigger / Input Box (Capsule with Smooth Expand) */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isOpen ? 'var(--notion-bg)' : 'rgba(0, 0, 0, 0.035)',
          border: isOpen ? '1px solid #2563eb' : '1px solid var(--notion-border)',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.15), 0 2px 8px rgba(37, 99, 235, 0.06)' : 'none',
          borderRadius: '9999px',
          padding: '5px 12px',
          width: isOpen ? '230px' : '170px',
          maxWidth: '100%',
          transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: 'text'
        }}
        className="navbar-search-bar"
      >
        <Search size={14} style={{ color: isOpen ? '#2563eb' : 'var(--notion-text-muted)', flexShrink: 0, transition: 'color 0.15s ease' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="ค้นหา..."
          style={{
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '0.82rem',
            color: 'var(--notion-text)',
            width: '100%',
            padding: 0
          }}
        />
        {query && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              inputRef.current?.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: '#a1a1aa',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* 2. Mobile Compact Search Button (shown on mobile instead of wide bar) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 60);
        }}
        className="navbar-search-mobile-btn"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          backgroundColor: 'rgba(0, 0, 0, 0.035)',
          color: 'var(--notion-text)',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        aria-label="ค้นหา"
        title="ค้นหา"
      >
        <Search size={16} />
      </button>

      {/* 3. Suggestions Popover / Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: '390px',
            maxWidth: '92vw',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            zIndex: 1000,
            animation: 'fadeIn 0.14s ease'
          }}
          className="search-suggestions-dropdown"
        >
          {/* List of Suggestions */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px' }}>
            {searchResults.length > 0 ? (
              searchResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #2563eb' : '3px solid transparent',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      {/* Icon */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--notion-sidebar)',
                          border: '1px solid var(--notion-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {renderItemIcon(item.categoryType)}
                      </div>

                      {/* Title & Subtitle */}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.86rem',
                            fontWeight: 600,
                            color: 'var(--notion-text)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.3
                          }}
                        >
                          {highlightMatch(item.title, query)}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: '#71717a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginTop: '2px'
                          }}
                        >
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {/* Right Badge & Enter indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {item.categoryType !== 'unit' && item.categoryType !== 'page' && item.badge && (
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: item.badgeColor.bg,
                            color: item.badgeColor.text,
                            border: `1px solid ${item.badgeColor.border}`
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CornerDownLeft size={13} style={{ color: '#2563eb', opacity: 0.8 }} />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  padding: '28px 20px',
                  textAlign: 'center',
                  color: '#71717a',
                  fontSize: '0.85rem'
                }}
              >
                <div>ไม่พบข้อมูลที่ตรงกับ "{query}"</div>
                <div style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '4px' }}>
                  ลองพิมพ์ชื่องาน, ชื่อหน่วย (เช่น "หน่วยที่ 1"), หรือป้ายกำกับ
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
