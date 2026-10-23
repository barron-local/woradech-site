import React, { useState } from 'react';
import type { PortfolioItem } from '../types';
import { UploadCloud, FileText, CheckCircle2, Edit2, Trash2, ExternalLink, X, Save, AlertCircle, Image as ImageIcon, GripVertical, ChevronUp, ChevronDown, Bookmark, Palette, Link as LinkIcon, Presentation, FolderOpen, Loader2 } from 'lucide-react';
import { uploadProjectToSupabase, updateProjectInSupabase, deleteProjectFromSupabase, createSectionInSupabase, createLinkProjectInSupabase, uploadAssetToSupabase } from '../supabase';
import { renderPdfFirstPageToImage } from '../utils/pdfThumbnail';
import { isCanvaUrl, toCanvaEmbedUrl } from '../utils/embedHelper';
import { PdfCardThumbnail } from './PdfCardThumbnail';

interface UploadPageProps {
  projects: PortfolioItem[];
  onAddProject: (item: PortfolioItem) => void;
  onUpdateProject: (item: PortfolioItem) => void;
  onDeleteProject: (id: string) => void;
  onReorderProjects?: (items: PortfolioItem[]) => void;
  onNavigateToPortfolio?: () => void;
}

// Preset color options for sections (Notion inspired colors)
const SECTION_COLOR_PRESETS = [
  { name: 'เทา (Default)', bg: '#f3f4f6', text: '#1f2937', border: '#e5e7eb' },
  { name: 'น้ำเงิน (Blue)', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  { name: 'เขียว (Green)', bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
  { name: 'ม่วง (Purple)', bg: '#faf5ff', text: '#6b21a8', border: '#e9d5ff' },
  { name: 'ส้ม (Orange)', bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
  { name: 'เหลือง (Yellow)', bg: '#fefce8', text: '#854d0e', border: '#fef08a' },
  { name: 'ชมพู (Rose)', bg: '#fff1f2', text: '#9f1239', border: '#fecdd3' },
  { name: 'ดำคลาสสิก (Dark)', bg: '#1f2937', text: '#ffffff', border: '#374151' }
];

// Helper to accurately determine if a portfolio item is a Canva/web link vs an uploaded file
export const checkIsLinkItem = (item?: PortfolioItem | null): boolean => {
  if (!item) return false;
  if (item.category === 'Canva Presentation' || item.category === 'Web Link' || item.category === 'External Link' || item.category === 'Link') return true;
  if (item.fileName === 'Canva Presentation' || item.fileName === 'Web Link' || item.fileName === 'External Link') return true;
  const url = item.link || item.pdfUrl || '';
  if (url.startsWith('data:')) return false;
  if (isCanvaUrl(url)) return true;
  if (item.fileName && item.fileName.trim().length > 0) return false;
  if (/\.(pdf|jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return false;
  return url.startsWith('http://') || url.startsWith('https://');
};

export const UploadPage: React.FC<UploadPageProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onReorderProjects,
  onNavigateToPortfolio
}) => {
  // Mode toggle: 'project' (อัปโหลดไฟล์) vs 'link' (เพิ่มลิงก์ Canva/เว็บ) vs 'section' (เพิ่มป้ายกำกับหน่วย)
  const [activeTab, setActiveTab] = useState<'project' | 'link' | 'section'>('project');

  // Local state for instantaneous UI updates when reordering
  const [localItems, setLocalItems] = useState<PortfolioItem[]>(projects);

  // Sync localItems whenever projects prop updates
  React.useEffect(() => {
    setLocalItems(projects);
  }, [projects]);

  // Drag and Drop & Reordering State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form State for Link Project (Canva / Presentation / Web Link)
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkDescription, setLinkDescription] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Form State for New Upload (Project)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{ name: string; size: string; isImage: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State for New Section (ป้ายกำกับหน่วย)
  const [sectionTitle, setSectionTitle] = useState('');
  const [sectionBg, setSectionBg] = useState('#eff6ff');
  const [sectionColor, setSectionColor] = useState('#1e40af');
  const [sectionBorder, setSectionBorder] = useState('#bfdbfe');
  const [sectionShowBar, setSectionShowBar] = useState(true);
  const [sectionFontSize, setSectionFontSize] = useState('20px');
  const [sectionAlign, setSectionAlign] = useState<'left' | 'center' | 'right'>('left');
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [sectionSuccess, setSectionSuccess] = useState(false);
  const [sectionError, setSectionError] = useState('');

  // Edit Link State
  const [editLinkUrl, setEditLinkUrl] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSectionBg, setEditSectionBg] = useState('#f3f4f6');
  const [editSectionColor, setEditSectionColor] = useState('#1f2937');
  const [editSectionBorder, setEditSectionBorder] = useState('#e5e7eb');
  const [editSectionShowBar, setEditSectionShowBar] = useState(true);
  const [editSectionFontSize, setEditSectionFontSize] = useState('20px');
  const [editSectionAlign, setEditSectionAlign] = useState<'left' | 'center' | 'right'>('left');
  const [editNewFile, setEditNewFile] = useState<File | null>(null);
  const [editFileInfo, setEditFileInfo] = useState<{ name: string; size: string; isImage: boolean } | null>(null);
  const [editSubItems, setEditSubItems] = useState<Array<{ id?: string; title: string; url: string; imageUrl?: string; description?: string }>>([]);
  const [uploadingSubIndex, setUploadingSubIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<PortfolioItem | null>(null);

  const isAcceptedFile = (file: File) => {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
    return file.type === 'application/pdf' || file.type.startsWith('image/') || validExts.includes(ext);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAcceptedFile(file)) {
      setErrorMessage('กรุณาเลือกไฟล์เอกสาร PDF หรือรูปภาพ (JPG, PNG, WebP) เท่านั้น');
      return;
    }

    setErrorMessage('');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setRawFile(file);
    setSelectedFileInfo({
      name: file.name,
      size: `${sizeInMb} MB`,
      isImage
    });

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('กรุณาระบุชื่องาน');
      return;
    }
    if (!rawFile) {
      setErrorMessage('กรุณาเลือกไฟล์ PDF หรือรูปภาพ');
      return;
    }

    setIsUploading(true);
    setErrorMessage('');

    const ext = (rawFile.name.split('.').pop() || '').toLowerCase();
    const isImage = rawFile.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

    try {
      const res = await uploadProjectToSupabase({
        title: title.trim(),
        category: isImage ? 'Image' : 'PDF Document',
        description: description.trim(),
        file: rawFile
      });

      if (res.success && res.item) {
        onAddProject(res.item);
        setIsSuccess(true);
        setTitle('');
        setDescription('');
        setRawFile(null);
        setSelectedFileInfo(null);
      } else {
        // Fallback to local
        const reader = new FileReader();
        reader.onload = async () => {
          const fileUrl = reader.result as string;
          let generatedCover = isImage ? fileUrl : '';
          if (!isImage) {
            try {
              const thumb = await renderPdfFirstPageToImage(rawFile);
              if (thumb) generatedCover = thumb;
            } catch {}
          }
          const fallbackItem: PortfolioItem = {
            id: (isImage ? 'img-' : 'pdf-') + Date.now(),
            title: title.trim(),
            category: isImage ? 'Image' : 'PDF Document',
            description: description.trim() || `ไฟล์ ${rawFile.name}`,
            imageUrl: generatedCover || (isImage ? fileUrl : (fileUrl ? '' : '/banner.png')),
            pdfUrl: fileUrl,
            fileName: rawFile.name,
            link: fileUrl,
            tags: [isImage ? 'Image' : 'PDF']
          };
          onAddProject(fallbackItem);
          setIsSuccess(true);
          setTitle('');
          setDescription('');
          setRawFile(null);
          setSelectedFileInfo(null);
        };
        reader.readAsDataURL(rawFile);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for adding a link project (Canva / Presentation / Web Link)
  const handleCreateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) {
      setLinkError('กรุณากรอกลิงก์ผลงาน เช่น https://canva.link/... หรือ https://www.canva.com/design/...');
      return;
    }
    if (!linkTitle.trim()) {
      setLinkError('กรุณาระบุชื่องาน / หัวข้อผลงาน');
      return;
    }

    setIsAddingLink(true);
    setLinkError('');

    const raw = linkUrl.trim();
    const isCanva = isCanvaUrl(raw);
    const categoryName = isCanva ? 'Canva Presentation' : 'Web Link';
    const embedUrl = isCanva ? toCanvaEmbedUrl(raw) : raw;

    try {
      const res = await createLinkProjectInSupabase({
        title: linkTitle.trim(),
        linkUrl: embedUrl,
        category: categoryName,
        description: linkDescription.trim(),
        imageUrl: isCanva ? 'https://static.canva.com/web/images/12468613e04e432a2612.png' : ''
      });

      if (res.success && res.item) {
        onAddProject(res.item);
        setIsSuccess(true);
        setLinkUrl('');
        setLinkTitle('');
        setLinkDescription('');
      } else {
        setLinkError(res.error || 'เกิดข้อผิดพลาดในการบันทึกลิงก์');
      }
    } catch (err: any) {
      setLinkError(err.message || 'เกิดข้อผิดพลาดในการบันทึกลิงก์');
    } finally {
      setIsAddingLink(false);
    }
  };

  // Handler for adding a new section banner
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionTitle.trim()) {
      setSectionError('กรุณาระบุชื่อป้ายกำกับหน่วย เช่น หน่วยที่ 1');
      return;
    }

    setIsAddingSection(true);
    setSectionError('');

    try {
      const res = await createSectionInSupabase({
        title: sectionTitle.trim(),
        sectionBg,
        sectionColor,
        sectionBorder,
        sectionShowBar,
        sectionFontSize,
        sectionAlign
      });

      if (res.success && res.item) {
        onAddProject(res.item);
        setSectionSuccess(true);
        setSectionTitle('');
      } else {
        setSectionError(res.error || 'เกิดข้อผิดพลาดในการสร้างป้ายกำกับหน่วย');
      }
    } catch (err: any) {
      setSectionError(err.message || 'เกิดข้อผิดพลาดในการสร้างป้ายกำกับหน่วย');
    } finally {
      setIsAddingSection(false);
    }
  };

  const startEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    const isLink = checkIsLinkItem(item);
    setEditLinkUrl(isLink ? (item.link || item.pdfUrl || '') : '');
    setEditSectionBg(item.sectionBg || '#f3f4f6');
    setEditSectionColor(item.sectionColor || '#1f2937');
    setEditSectionBorder(item.sectionBorder || '#e5e7eb');
    setEditSectionShowBar(item.sectionShowBar !== false);
    setEditSectionFontSize(item.sectionFontSize || '1.28rem');
    setEditSectionAlign(item.sectionAlign || 'left');
    setEditNewFile(null);
    setEditFileInfo(null);
    setEditSubItems(item.subItems ? JSON.parse(JSON.stringify(item.subItems)) : []);
    setEditError('');
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAcceptedFile(file)) {
      setEditError('กรุณาเลือกไฟล์เอกสาร PDF หรือรูปภาพ (JPG, PNG, WebP) เท่านั้น');
      return;
    }

    setEditError('');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setEditNewFile(file);
    setEditFileInfo({
      name: file.name,
      size: `${sizeInMb} MB`,
      isImage
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    if (!editTitle.trim()) {
      setEditError('กรุณาระบุชื่อ');
      return;
    }

    setIsUpdating(true);
    setEditError('');

    try {
      // If editing a section
      if (editingItem.itemType === 'section') {
        const showBarStr = editSectionShowBar ? '1' : '0';
        const encodedCategory = `SECTION:::${editSectionBg}:::${editSectionColor}:::${editSectionBorder}:::${showBarStr}:::${editSectionFontSize}:::${editSectionAlign}:::Section`;
        await updateProjectInSupabase({
          id: editingItem.id,
          title: editTitle.trim(),
          category: encodedCategory
        });

        const updatedItem: PortfolioItem = {
          ...editingItem,
          title: editTitle.trim(),
          category: 'Section',
          itemType: 'section',
          sectionBg: editSectionBg,
          sectionColor: editSectionColor,
          sectionBorder: editSectionBorder,
          sectionShowBar: editSectionShowBar,
          sectionFontSize: editSectionFontSize,
          sectionAlign: editSectionAlign,
          tags: ['Section']
        };
        onUpdateProject(updatedItem);
        setEditingItem(null);
        return;
      }

      // Normal project or link item
      const isLinkItem = checkIsLinkItem(editingItem);
      const finalLinkUrl = isLinkItem && editLinkUrl.trim() && !editLinkUrl.startsWith('data:') ? (isCanvaUrl(editLinkUrl.trim()) ? toCanvaEmbedUrl(editLinkUrl.trim()) : editLinkUrl.trim()) : undefined;

      const validSubItems = editSubItems
        .filter(s => s.url.trim() || s.title.trim())
        .map(s => ({
          title: s.title.trim() || 'ชิ้นงานย่อย',
          url: s.url.trim(),
          imageUrl: s.imageUrl?.trim() || (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(s.url.trim()) ? s.url.trim() : undefined),
          description: s.description?.trim() || ''
        }));

      const res = await updateProjectInSupabase({
        id: editingItem.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        linkUrl: finalLinkUrl,
        newFile: editNewFile,
        subItems: validSubItems
      });

      let updatedPdfUrl = finalLinkUrl || editingItem.pdfUrl;
      let updatedFileName = editingItem.fileName;

      if (editNewFile) {
        const ext = (editNewFile.name.split('.').pop() || '').toLowerCase();
        const isImage = editNewFile.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
        
        let fileDataUrl = '';
        try {
          fileDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(editNewFile);
          });
        } catch {}

        let pdfThumb = '';
        if (!isImage) {
          try {
            pdfThumb = (await renderPdfFirstPageToImage(editNewFile)) || '';
          } catch {}
        }

        const finalUrl = res.item?.pdfUrl || fileDataUrl || updatedPdfUrl;
        const finalImage = isImage
          ? (res.item?.imageUrl || fileDataUrl || editingItem.imageUrl)
          : (res.item?.imageUrl || pdfThumb || editingItem.imageUrl || '');

        const updatedItem: PortfolioItem = {
          ...editingItem,
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: isImage ? 'Image' : 'PDF Document',
          imageUrl: finalImage,
          pdfUrl: finalUrl,
          fileName: editNewFile.name,
          link: finalUrl,
          tags: [isImage ? 'Image' : 'PDF'],
          subItems: validSubItems.length > 0 ? validSubItems : undefined
        };
        onUpdateProject(updatedItem);
      } else {
        const updatedItem: PortfolioItem = {
          ...editingItem,
          title: editTitle.trim(),
          description: editDescription.trim(),
          pdfUrl: res.item?.pdfUrl || updatedPdfUrl,
          fileName: res.item?.fileName || updatedFileName,
          link: res.item?.link || editingItem.link,
          subItems: validSubItems.length > 0 ? validSubItems : undefined
        };
        onUpdateProject(updatedItem);
      }

      setEditingItem(null);
    } catch (err: any) {
      setEditError(err.message || 'เกิดข้อผิดพลาดในการบันทึกการแก้ไข');
    } finally {
      setIsUpdating(false);
    }
  };

  const promptDelete = (item: PortfolioItem) => {
    setDeletingItem(item);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const itemToDelete = deletingItem;
    setDeletingId(itemToDelete.id);

    try {
      await deleteProjectFromSupabase(itemToDelete.id);
      onDeleteProject(itemToDelete.id);
    } catch (err: any) {
      console.warn('Error deleting project:', err);
      onDeleteProject(itemToDelete.id);
    } finally {
      setDeletingId(null);
      setDeletingItem(null);
    }
  };

  // Reordering handlers
  const handleMoveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= localItems.length || fromIndex === toIndex) return;
    const reordered = [...localItems];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);
    
    // Immediate local update for zero delay
    setLocalItems(reordered);

    if (onReorderProjects) {
      onReorderProjects(reordered);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = draggedIndex !== null ? draggedIndex : parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      handleMoveItem(sourceIndex, targetIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 24px 80px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
          จัดการผลงาน Portfolio (PDF & รูปภาพ Upload & Manage)
        </h1>
      </div>

      {isSuccess && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #bbf7d0',
          backgroundColor: '#f0fdf4',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#166534' }}>
              บันทึกผลงานสำเร็จแล้ว! รายการจะแสดงผลที่หน้า Portfolio ทันที
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsSuccess(false)}
            className="notion-btn notion-btn-subtle"
            style={{ fontSize: '0.8rem', padding: '2px 8px', color: '#166534' }}
          >
            ✕ ปิด
          </button>
        </div>
      )}

      {/* Mode Switch Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '24px',
        backgroundColor: '#f3f4f6',
        padding: '5px',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('project')}
          style={{
            flex: '1 0 auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            backgroundColor: activeTab === 'project' ? '#ffffff' : 'transparent',
            color: activeTab === 'project' ? 'var(--notion-text)' : 'var(--notion-text-muted)',
            boxShadow: activeTab === 'project' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <UploadCloud size={16} />
          <span>อัปโหลดไฟล์ (PDF / รูปภาพ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('link')}
          style={{
            flex: '1 0 auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            backgroundColor: activeTab === 'link' ? '#ffffff' : 'transparent',
            color: activeTab === 'link' ? '#7c3aed' : 'var(--notion-text-muted)',
            boxShadow: activeTab === 'link' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Presentation size={16} color="#7c3aed" />
          <span>เพิ่มลิงก์งาน (Canva / สไลด์)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('section')}
          style={{
            flex: '1 0 auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '9px 16px',
            borderRadius: '7px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            backgroundColor: activeTab === 'section' ? '#ffffff' : 'transparent',
            color: activeTab === 'section' ? '#2563eb' : 'var(--notion-text-muted)',
            boxShadow: activeTab === 'section' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Bookmark size={16} />
          <span>เพิ่มป้ายกำกับหน่วย (Section)</span>
        </button>
      </div>

      {sectionSuccess && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid #bbf7d0',
          backgroundColor: '#f0fdf4',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#166534' }}>
              สร้างป้ายกำกับหน่วยเรียบร้อยแล้ว! สามารถลากจัดตำแหน่งได้ในรายการด้านล่าง
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSectionSuccess(false)}
            className="notion-btn notion-btn-subtle"
            style={{ fontSize: '0.8rem', padding: '2px 8px', color: '#166534' }}
          >
            ✕ ปิด
          </button>
        </div>
      )}

      {/* 1A. TAB: LINK PROJECT FORM (Canva / Presentation / Web Link) */}
      {activeTab === 'link' && (
        <form onSubmit={handleCreateLink} style={{
          background: '#ffffff',
          border: '1.5px solid #ddd6fe',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Presentation size={20} color="#7c3aed" />
            <h2 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
              เพิ่มงานผ่านลิงก์ (Canva Presentation / สไลด์ / ลิงก์เว็บ)
            </h2>
          </div>

          {linkError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {linkError}
            </div>
          )}

          {/* Link URL Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              URL ลิงก์งาน (Canva / สไลด์ / เว็บไซต์): <span style={{ color: '#e03e3e' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  if (linkError) setLinkError('');
                }}
                placeholder="วางลิงก์ เช่น https://canva.link/... หรือ https://www.canva.com/design/..."
                className="notion-input"
                style={{ fontSize: '0.92rem', padding: '10px 12px 10px 38px' }}
                required
              />
              <LinkIcon size={16} color="#7c3aed" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            {isCanvaUrl(linkUrl) && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--notion-hover, #f7f6f3)',
                border: '1px solid var(--notion-border, #e9e9e7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--notion-text, #37352f)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    backgroundColor: '#7c3aed',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    C
                  </span>
                  <span style={{ fontWeight: 500 }}>Canva Presentation</span>
                  <span style={{ color: 'var(--notion-text-muted, #787774)', fontSize: '0.78rem' }}>
                    · รองรับสไลด์แบบโต้ตอบ (Interactive Embed)
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#f3e8ff',
                  color: '#6b21a8',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#9333ea' }} />
                  Embed Ready
                </span>
              </div>
            )}
          </div>

          {/* Link Project Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ชื่องาน / หัวข้อผลงาน: <span style={{ color: '#e03e3e' }}>*</span>
            </label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="เช่น สไลด์นำเสนอโครงงาน AI, รายงานนำเสนอ Canva ฯลฯ"
              className="notion-input"
              style={{ fontSize: '0.92rem', padding: '10px 12px' }}
              required
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              คำอธิบายโดยย่อ:
            </label>
            <textarea
              rows={3}
              value={linkDescription}
              onChange={(e) => setLinkDescription(e.target.value)}
              placeholder="รายละเอียดของงานนำเสนอ เพื่อให้ผู้เข้าชมเข้าใจเนื้อหาเบื้องต้น..."
              className="notion-textarea"
            />
          </div>

          {/* Submit Link */}
          <button
            type="submit"
            disabled={isAddingLink}
            className="notion-btn notion-btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.92rem', fontWeight: 600, backgroundColor: '#7c3aed', borderColor: '#7c3aed', opacity: isAddingLink ? 0.7 : 1 }}
          >
            {isAddingLink ? 'กำลังบันทึกลิงก์...' : '+ บันทึกและแสดงงาน Canva / ลิงก์บน Portfolio'}
          </button>
        </form>
      )}

      {/* 1B. TAB: SECTION BANNER FORM */}
      {activeTab === 'section' && (
        <form onSubmit={handleCreateSection} style={{
          background: '#ffffff',
          border: '1.5px solid #bfdbfe',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <Bookmark size={20} color="#2563eb" />
            <h2 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
              เพิ่มป้ายกำกับแบ่งหน่วย (Section Header)
            </h2>
          </div>

          {sectionError && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {sectionError}
            </div>
          )}

          {/* Section Title */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ชื่อป้ายกำกับ / ชื่อหน่วย: <span style={{ color: '#e03e3e' }}>*</span>
            </label>
            <input
              type="text"
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              placeholder="เช่น หน่วยที่ 1"
              className="notion-input"
              style={{ fontSize: '0.94rem', padding: '10px 12px' }}
            />
          </div>

          {/* Quick Color Presets */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Palette size={15} color="#2563eb" />
              <span>เลือกโทนสีสำเร็จรูป (Color Presets):</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SECTION_COLOR_PRESETS.map((preset) => {
                const isSelected = sectionBg === preset.bg && sectionColor === preset.text;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSectionBg(preset.bg);
                      setSectionColor(preset.text);
                      setSectionBorder(preset.border);
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: `1.5px solid ${isSelected ? '#2563eb' : preset.border}`,
                      backgroundColor: preset.bg,
                      color: preset.text,
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 0 0 2px #93c5fd' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{preset.name}</span>
                    {isSelected && <CheckCircle2 size={13} color={preset.text} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '22px',
            padding: '14px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid var(--notion-border)'
          }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                สีพื้นหลัง (Background):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={sectionBg}
                  onChange={(e) => setSectionBg(e.target.value)}
                  style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '2px' }}
                />
                <input
                  type="text"
                  value={sectionBg}
                  onChange={(e) => setSectionBg(e.target.value)}
                  className="notion-input"
                  style={{ fontSize: '0.85rem', padding: '6px 10px', width: '110px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                สีข้อความ (Text Color):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={sectionColor}
                  onChange={(e) => setSectionColor(e.target.value)}
                  style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '2px' }}
                />
                <input
                  type="text"
                  value={sectionColor}
                  onChange={(e) => setSectionColor(e.target.value)}
                  className="notion-input"
                  style={{ fontSize: '0.85rem', padding: '6px 10px', width: '110px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                สีเส้นขอบ (Border Color):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={sectionBorder.startsWith('#') ? sectionBorder : '#bfdbfe'}
                  onChange={(e) => setSectionBorder(e.target.value)}
                  style={{ width: '40px', height: '36px', borderRadius: '6px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '2px' }}
                />
                <input
                  type="text"
                  value={sectionBorder}
                  onChange={(e) => setSectionBorder(e.target.value)}
                  className="notion-input"
                  style={{ fontSize: '0.85rem', padding: '6px 10px', width: '110px' }}
                />
              </div>
            </div>
          </div>

          {/* Bar Toggle, Font Size, and Alignment Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px',
            marginBottom: '22px',
            padding: '14px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid var(--notion-border)'
          }}>
            {/* Toggle Bar */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '8px' }}>
                แถบขีดสีด้านหน้า (Color Bar):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setSectionShowBar(true)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1.5px solid ${sectionShowBar ? '#2563eb' : 'var(--notion-border)'}`,
                    backgroundColor: sectionShowBar ? '#eff6ff' : '#ffffff',
                    color: sectionShowBar ? '#1e40af' : 'var(--notion-text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  เปิดแถบ
                </button>
                <button
                  type="button"
                  onClick={() => setSectionShowBar(false)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: `1.5px solid ${!sectionShowBar ? '#2563eb' : 'var(--notion-border)'}`,
                    backgroundColor: !sectionShowBar ? '#eff6ff' : '#ffffff',
                    color: !sectionShowBar ? '#1e40af' : 'var(--notion-text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ซ่อนแถบ
                </button>
              </div>
            </div>

            {/* Font Size (px) */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '8px' }}>
                ขนาดข้อความ (px):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min={12}
                  max={60}
                  step={1}
                  value={parseInt(sectionFontSize.replace('px', '').replace('rem', ''), 10) || 20}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSectionFontSize(val ? `${val}px` : '20px');
                  }}
                  className="notion-input"
                  style={{ fontSize: '0.88rem', padding: '6px 10px', width: '90px', fontWeight: 600 }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--notion-text-muted)' }}>px</span>
                <input
                  type="range"
                  min={14}
                  max={40}
                  step={1}
                  value={parseInt(sectionFontSize.replace('px', '').replace('rem', ''), 10) || 20}
                  onChange={(e) => setSectionFontSize(`${e.target.value}px`)}
                  style={{ flex: 1, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Align */}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '8px' }}>
                จัดตำแหน่ง (Align):
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {(['left', 'center', 'right'] as const).map((a) => {
                  const isSelected = sectionAlign === a;
                  const label = a === 'left' ? 'ซ้าย' : a === 'center' ? 'กึ่งกลาง' : 'ขวา';
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setSectionAlign(a)}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: `1.5px solid ${isSelected ? '#2563eb' : 'var(--notion-border)'}`,
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        color: isSelected ? '#1e40af' : 'var(--notion-text)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--notion-text-muted)', display: 'block', marginBottom: '6px' }}>
              ตัวอย่างการแสดงผล (Preview):
            </span>
            <div style={{
              backgroundColor: sectionBg,
              color: sectionColor,
              border: `1.5px solid ${sectionBorder}`,
              borderRadius: '10px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sectionAlign === 'center' ? 'center' : sectionAlign === 'right' ? 'flex-end' : 'flex-start',
              textAlign: sectionAlign,
              gap: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}>
              {sectionShowBar && (
                <div style={{ width: '6px', height: '22px', borderRadius: '3px', backgroundColor: sectionColor, opacity: 0.8, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: sectionFontSize, fontWeight: 700 }}>
                {sectionTitle.trim() || 'ตัวอย่างชื่อหน่วย (เช่น หน่วยที่ 1)'}
              </span>
            </div>
          </div>

          {/* Submit Section */}
          <button
            type="submit"
            disabled={isAddingSection}
            className="notion-btn notion-btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.92rem', fontWeight: 600, opacity: isAddingSection ? 0.7 : 1 }}
          >
            {isAddingSection ? 'กำลังบันทึกป้ายกำกับ...' : '+ บันทึกป้ายกำกับหน่วย'}
          </button>
        </form>
      )}

      {/* 1B. TAB: UPLOAD PROJECT FORM */}
      {activeTab === 'project' && (
      <form onSubmit={handleSubmit} style={{
          background: '#ffffff',
          border: '1px solid var(--notion-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(15, 15, 15, 0.04)'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '18px' }}>
            อัปโหลดผลงานใหม่ (PDF หรือ รูปภาพ)
          </h2>

          {errorMessage && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.85rem',
              marginBottom: '16px'
            }}>
              {errorMessage}
            </div>
          )}

          {/* File Dropzone */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
              ไฟล์เอกสาร PDF หรือรูปภาพ: <span style={{ color: '#e03e3e' }}>*</span>
            </label>

            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '2px dashed var(--notion-border-dark)',
              backgroundColor: 'var(--notion-sidebar)',
              cursor: 'pointer',
              textAlign: 'center'
            }}>
              <UploadCloud size={28} color="var(--notion-text-muted)" style={{ marginBottom: '8px' }} />
              {selectedFileInfo ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 600, color: 'var(--notion-text)', fontSize: '0.92rem' }}>
                    {selectedFileInfo.isImage ? (
                      <ImageIcon size={16} color="#2563eb" />
                    ) : (
                      <FileText size={16} color="#dc2626" />
                    )}
                    <span>{selectedFileInfo.name}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)' }}>ขนาด: {selectedFileInfo.size} (คลิกเพื่อเปลี่ยนไฟล์)</span>
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--notion-text)' }}>
                    คลิกเพื่อเลือกไฟล์ PDF หรือ รูปภาพ จากเครื่อง
                  </span>
                  <p style={{ fontSize: '0.78rem', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                    รองรับไฟล์ .pdf, .jpg, .png, .webp
                  </p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {/* Project Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              ชื่องาน / หัวข้อผลงาน: <span style={{ color: '#e03e3e' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น รายงานผลงานวิจัย, โครงการประจำวิชา ฯลฯ"
              className="notion-input"
              style={{ fontSize: '0.92rem', padding: '10px 12px' }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              คำอธิบายโดยย่อ:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดของเอกสารเพื่อให้ครูและผู้ตรวจเข้าใจง่ายขึ้น..."
              className="notion-textarea"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            className="notion-btn notion-btn-primary"
            style={{ width: '100%', padding: '11px', fontSize: '0.92rem', fontWeight: 600, opacity: isUploading ? 0.7 : 1 }}
          >
            {isUploading ? 'กำลังอัปโหลด...' : 'บันทึกและส่งผลงานเข้า Portfolio'}
          </button>
      </form>
      )}

      {/* 2. MANAGE EXISTING PROJECTS LIST */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
              รายการผลงานทั้งหมด ({localItems.length})
            </h2>
          </div>
          {onNavigateToPortfolio && (
            <button
              onClick={onNavigateToPortfolio}
              className="notion-btn"
              style={{
                fontSize: '0.86rem',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--notion-border)',
                backgroundColor: '#ffffff',
                color: 'var(--notion-text)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--notion-hover)';
                e.currentTarget.style.borderColor = 'var(--notion-border-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = 'var(--notion-border)';
              }}
            >
              <span>ดูหน้า Portfolio</span>
              <span>→</span>
            </button>
          )}
        </div>

        {localItems.length === 0 ? (
          <div style={{
            padding: '36px',
            textAlign: 'center',
            backgroundColor: 'var(--notion-sidebar)',
            border: '1px dashed var(--notion-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--notion-text-muted)'
          }}>
            ยังไม่มีรายการผลงานที่บันทึกไว้ สามารถอัปโหลดงานแรกได้จากแบบฟอร์มด้านบน
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {localItems.map((item, idx) => {
              const isBeingDragged = draggedIndex === idx;
              const isDraggedOver = dragOverIndex === idx && draggedIndex !== idx;

              return (
                <div
                  key={item.id || idx}
                  className="upload-item-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  style={{
                    backgroundColor: isDraggedOver ? '#eff6ff' : '#ffffff',
                    border: isDraggedOver
                      ? '2px dashed #3b82f6'
                      : '1px solid var(--notion-border)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    boxShadow: isBeingDragged
                      ? '0 10px 25px rgba(0, 0, 0, 0.15)'
                      : '0 2px 6px rgba(0, 0, 0, 0.03)',
                    opacity: isBeingDragged ? 0.45 : 1,
                    transform: isBeingDragged ? 'scale(0.98)' : 'none',
                    transition: 'border 0.15s, background-color 0.15s, box-shadow 0.15s, opacity 0.15s, transform 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!isBeingDragged && !isDraggedOver) {
                      e.currentTarget.style.borderColor = 'var(--notion-border-dark)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isBeingDragged && !isDraggedOver) {
                      e.currentTarget.style.borderColor = 'var(--notion-border)';
                      e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.03)';
                    }
                  }}
                >
                  {/* Drag Handle & Order Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--notion-text-muted)',
                    userSelect: 'none',
                    flexShrink: 0
                  }}>
                    {/* Visual Drag Grip Handle */}
                    <div
                      title="คลิกค้างเพื่อลากสลับลำดับ"
                      style={{
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px 4px',
                        borderRadius: '4px',
                        transition: 'background-color 0.15s, color 0.15s',
                        color: '#9ca3af'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--notion-sidebar)';
                        e.currentTarget.style.color = 'var(--notion-text)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#9ca3af';
                      }}
                    >
                      <GripVertical size={18} />
                    </div>

                    {/* Quick Move Up/Down Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveItem(idx, idx - 1);
                        }}
                        disabled={idx === 0}
                        title="เลื่อนขึ้นด้านบน"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px',
                          cursor: idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: idx === 0 ? 0.25 : 0.7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--notion-text)',
                          borderRadius: '2px'
                        }}
                        onMouseEnter={(e) => {
                          if (idx > 0) e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (idx > 0) e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveItem(idx, idx + 1);
                        }}
                        disabled={idx === localItems.length - 1}
                        title="เลื่อนลงด้านล่าง"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '1px',
                          cursor: idx === localItems.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: idx === localItems.length - 1 ? 0.25 : 0.7,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--notion-text)',
                          borderRadius: '2px'
                        }}
                        onMouseEnter={(e) => {
                          if (idx < projects.length - 1) e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          if (idx < projects.length - 1) e.currentTarget.style.opacity = '0.7';
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Left: Thumbnail & Main Info (Distinct for Section Header vs Regular Project) */}
                  {item.itemType === 'section' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: '56px',
                        height: '46px',
                        borderRadius: '8px',
                        backgroundColor: item.sectionBg || '#eff6ff',
                        border: `1.5px solid ${item.sectionBorder || '#bfdbfe'}`,
                        color: item.sectionColor || '#1e40af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <Bookmark size={22} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: '1.08rem',
                          fontWeight: 700,
                          color: 'var(--notion-text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block'
                        }}>
                          {item.title}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                      {/* Thumbnail Preview */}
                      <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid var(--notion-border)',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <PdfCardThumbnail
                          imageUrl={item.imageUrl}
                          pdfUrl={item.pdfUrl || item.link}
                          title={item.title}
                        />
                      </div>

                      {/* Text Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '1.02rem',
                            fontWeight: 650,
                            color: 'var(--notion-text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {item.title}
                          </span>
                        </div>

                        {item.description && (
                          <p style={{
                            fontSize: '0.86rem',
                            color: 'var(--notion-text-muted)',
                            margin: '0 0 6px 0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.4
                          }}>
                            {item.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem', color: 'var(--notion-text-muted)' }}>
                          {item.pdfUrl && (
                            <a
                              href={item.pdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#2563eb',
                                fontWeight: 500,
                                textDecoration: 'none'
                              }}
                            >
                              <ExternalLink size={12} />
                              เปิดดูไฟล์
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Right: Actions */}
                  <div className="upload-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <button
                      onClick={() => startEdit(item)}
                      className="notion-btn"
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--notion-border)',
                        color: 'var(--notion-text)',
                        cursor: 'pointer'
                      }}
                      title="แก้ไขชื่องาน / รายละเอียด"
                    >
                      <Edit2 size={13} />
                      <span>แก้ไข</span>
                    </button>

                    <button
                      onClick={() => promptDelete(item)}
                      disabled={deletingId === item.id}
                      className="notion-btn"
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '6px',
                        color: '#dc2626',
                        borderColor: '#fca5a5',
                        backgroundColor: '#fef2f2',
                        cursor: 'pointer'
                      }}
                      title="ลบผลงานนี้"
                    >
                      <Trash2 size={13} />
                      <span>{deletingId === item.id ? 'กำลังลบ...' : 'ลบ'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. EDIT MODAL */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 15, 15, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div
            className="responsive-modal"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              maxWidth: '560px',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: '1px solid var(--notion-border)',
              backgroundColor: '#fbfbfa'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={16} color="var(--notion-text)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--notion-text)', margin: 0 }}>
                  แก้ไขผลงาน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--notion-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px' }}>
              {editError && (
                <div style={{
                  padding: '8px 12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              {/* If editing a Section */}
              {editingItem.itemType === 'section' ? (
                <div>
                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      ชื่อป้ายกำกับ / ชื่อหน่วย:
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="notion-input"
                      style={{ fontSize: '0.94rem', padding: '10px 12px' }}
                    />
                  </div>

                  {/* Preset Colors */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.84rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <Palette size={14} color="#2563eb" />
                      <span>เลือกโทนสีสำเร็จรูป:</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {SECTION_COLOR_PRESETS.map((preset) => {
                        const isSelected = editSectionBg === preset.bg && editSectionColor === preset.text;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              setEditSectionBg(preset.bg);
                              setEditSectionColor(preset.text);
                              setEditSectionBorder(preset.border);
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: `1.5px solid ${isSelected ? '#2563eb' : preset.border}`,
                              backgroundColor: preset.bg,
                              color: preset.text,
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {preset.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Pickers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '18px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)'
                  }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        สีพื้นหลัง (Background):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={editSectionBg}
                          onChange={(e) => setEditSectionBg(e.target.value)}
                          style={{ width: '36px', height: '32px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '1px' }}
                        />
                        <input
                          type="text"
                          value={editSectionBg}
                          onChange={(e) => setEditSectionBg(e.target.value)}
                          className="notion-input"
                          style={{ fontSize: '0.82rem', padding: '4px 8px', width: '100px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        สีข้อความ (Text Color):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={editSectionColor}
                          onChange={(e) => setEditSectionColor(e.target.value)}
                          style={{ width: '36px', height: '32px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '1px' }}
                        />
                        <input
                          type="text"
                          value={editSectionColor}
                          onChange={(e) => setEditSectionColor(e.target.value)}
                          className="notion-input"
                          style={{ fontSize: '0.82rem', padding: '4px 8px', width: '100px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        สีเส้นขอบ (Border Color):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={editSectionBorder.startsWith('#') ? editSectionBorder : '#bfdbfe'}
                          onChange={(e) => setEditSectionBorder(e.target.value)}
                          style={{ width: '36px', height: '32px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: 'pointer', padding: '1px' }}
                        />
                        <input
                          type="text"
                          value={editSectionBorder}
                          onChange={(e) => setEditSectionBorder(e.target.value)}
                          className="notion-input"
                          style={{ fontSize: '0.82rem', padding: '4px 8px', width: '100px' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bar Toggle, Font Size, and Alignment Options in Edit Modal */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '12px',
                    marginBottom: '18px',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid var(--notion-border)'
                  }}>
                    {/* Toggle Bar */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                        แถบขีดสีด้านหน้า:
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => setEditSectionShowBar(true)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '4px',
                            border: `1.5px solid ${editSectionShowBar ? '#2563eb' : 'var(--notion-border)'}`,
                            backgroundColor: editSectionShowBar ? '#eff6ff' : '#ffffff',
                            color: editSectionShowBar ? '#1e40af' : 'var(--notion-text)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          มีแถบ
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditSectionShowBar(false)}
                          style={{
                            flex: 1,
                            padding: '5px 8px',
                            borderRadius: '4px',
                            border: `1.5px solid ${!editSectionShowBar ? '#2563eb' : 'var(--notion-border)'}`,
                            backgroundColor: !editSectionShowBar ? '#eff6ff' : '#ffffff',
                            color: !editSectionShowBar ? '#1e40af' : 'var(--notion-text)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          ไม่มี
                        </button>
                      </div>
                    </div>

                    {/* Font Size (px) */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                        ขนาดข้อความ (px):
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="number"
                          min={12}
                          max={60}
                          step={1}
                          value={parseInt(editSectionFontSize.replace('px', '').replace('rem', ''), 10) || 20}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditSectionFontSize(val ? `${val}px` : '20px');
                          }}
                          className="notion-input"
                          style={{ fontSize: '0.82rem', padding: '5px 8px', width: '70px', fontWeight: 600 }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--notion-text-muted)' }}>px</span>
                        <input
                          type="range"
                          min={14}
                          max={40}
                          step={1}
                          value={parseInt(editSectionFontSize.replace('px', '').replace('rem', ''), 10) || 20}
                          onChange={(e) => setEditSectionFontSize(`${e.target.value}px`)}
                          style={{ flex: 1, cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Align */}
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--notion-text)', display: 'block', marginBottom: '6px' }}>
                        จัดตำแหน่ง:
                      </label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {(['left', 'center', 'right'] as const).map((a) => {
                          const isSelected = editSectionAlign === a;
                          const label = a === 'left' ? 'ซ้าย' : a === 'center' ? 'กลาง' : 'ขวา';
                          return (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setEditSectionAlign(a)}
                              style={{
                                flex: 1,
                                padding: '5px 6px',
                                borderRadius: '4px',
                                border: `1.5px solid ${isSelected ? '#2563eb' : 'var(--notion-border)'}`,
                                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                                color: isSelected ? '#1e40af' : 'var(--notion-text)',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{
                      backgroundColor: editSectionBg,
                      color: editSectionColor,
                      border: `1.5px solid ${editSectionBorder}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: editSectionAlign === 'center' ? 'center' : editSectionAlign === 'right' ? 'flex-end' : 'flex-start',
                      textAlign: editSectionAlign,
                      gap: '8px'
                    }}>
                      {editSectionShowBar && (
                        <div style={{ width: '6px', height: '18px', borderRadius: '3px', backgroundColor: editSectionColor, opacity: 0.8, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: editSectionFontSize, fontWeight: 700 }}>{editTitle || 'ชื่อหน่วย'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* If editing a regular Project */
                <div>
                  {/* Title */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      ชื่องาน / หัวข้อผลงาน:
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="notion-input"
                      style={{ fontSize: '0.92rem', padding: '10px 12px' }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                      คำอธิบาย:
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="notion-textarea"
                    />
                  </div>

                  {/* If item is a Link / Canva Presentation, show Link URL field */}
                  {checkIsLinkItem(editingItem) && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        URL ลิงก์งาน (Canva / สไลด์ / เว็บ):
                      </label>
                      <input
                        type="url"
                        value={editLinkUrl}
                        onChange={(e) => setEditLinkUrl(e.target.value)}
                        placeholder="https://canva.link/... หรือ https://www.canva.com/..."
                        className="notion-input"
                        style={{ fontSize: '0.9rem', padding: '9px 12px' }}
                      />
                    </div>
                  )}

                  {/* Replace PDF or Image (Optional) - only for file-based items */}
                  {!checkIsLinkItem(editingItem) && (
                    <div style={{ marginBottom: '22px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                        เปลี่ยนไฟล์แนบ (PDF หรือ รูปภาพ หากต้องการ):
                      </label>

                      {/* Current Active File Badge */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        backgroundColor: '#f9fafb',
                        border: '1px solid var(--notion-border)',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        fontSize: '0.83rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ color: 'var(--notion-text-muted)', fontSize: '0.78rem', flexShrink: 0 }}>ไฟล์เดิม:</span>
                          <FileText size={15} color="#dc2626" style={{ flexShrink: 0 }} />
                          <strong style={{ color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {editingItem.fileName || 'เอกสารแนบ'}
                          </strong>
                        </div>
                      {editingItem.pdfUrl && (
                        <a
                          href={editingItem.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            if (editingItem.pdfUrl?.startsWith('data:')) {
                              e.preventDefault();
                              const w = window.open('');
                              if (w) {
                                if (editingItem.pdfUrl.startsWith('data:image/')) {
                                  w.document.write(`<img src="${editingItem.pdfUrl}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                                } else {
                                  w.document.write(`<iframe src="${editingItem.pdfUrl}" style="border:none;width:100vw;height:100vh;"></iframe>`);
                                }
                              }
                            }
                          }}
                          style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.78rem', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          <ExternalLink size={11} /> ดูไฟล์เดิม
                        </a>
                      )}
                    </div>

                    {/* Upload New File Area */}
                    <label style={{
                      display: 'block',
                      border: editFileInfo ? '1.5px solid #86efac' : '1.5px dashed var(--notion-border-dark)',
                      borderRadius: '8px',
                      padding: '16px',
                      textAlign: 'center',
                      backgroundColor: editFileInfo ? '#f0fdf4' : '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}>
                      {editFileInfo ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <CheckCircle2 size={18} color="#16a34a" />
                          <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#166534' }}>
                            {editFileInfo.name} ({editFileInfo.size})
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#15803d', marginLeft: '6px' }}>(คลิกเพื่อเปลี่ยน)</span>
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: 'var(--notion-text-muted)', marginBottom: '6px' }}>
                            <UploadCloud size={18} />
                          </div>
                          <div style={{ fontSize: '0.86rem', fontWeight: 500, color: 'var(--notion-text)' }}>
                            คลิกเพื่ออัปโหลดไฟล์ใหม่แทนที่ไฟล์เดิม
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--notion-text-muted)', marginTop: '2px' }}>
                            รองรับทั้ง PDF หรือ รูปภาพ (.pdf, .jpg, .png, .webp)
                          </div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf,image/*"
                        onChange={handleEditFileChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                  )}

                  {/* 3D Folder / Multiple Sub-items Management */}
                  <div style={{
                    marginBottom: '22px',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #bfdbfe',
                    backgroundColor: '#eff6ff'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FolderOpen size={16} color="#2563eb" />
                        <label style={{ fontSize: '0.88rem', fontWeight: 650, color: '#1e3a8a', margin: 0 }}>
                          ชิ้นงานย่อยในแฟ้มนี้ (3D Folder Items):
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditSubItems(prev => [
                            ...prev,
                            { title: `ชิ้นงานที่ ${prev.length + 1}`, url: '', imageUrl: '' }
                          ]);
                        }}
                        className="notion-btn"
                        style={{
                          fontSize: '0.78rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        + เพิ่มชิ้นงานย่อย
                      </button>
                    </div>

                    <p style={{ fontSize: '0.76rem', color: '#3b82f6', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      เมื่อมีผลงานย่อยตั้งแต่ 1 ชิ้นขึ้นไป ชิ้นงานนี้จะเปิดด้วยโฟลเดอร์ 3D แบบแอนิเมชันเปิดอ้าให้ผู้เข้าชมเลือกหยิบได้ทันที
                    </p>

                    {editSubItems.length === 0 ? (
                      <div style={{
                        padding: '14px',
                        textAlign: 'center',
                        fontSize: '0.82rem',
                        color: 'var(--notion-text-muted)',
                        backgroundColor: '#ffffff',
                        borderRadius: '8px',
                        border: '1px dashed #cbd5e1'
                      }}>
                        ยังไม่มีชิ้นงานย่อย (คลิก <strong>"+ เพิ่มชิ้นงานย่อย"</strong> ด้านบนเพื่อใส่รูป/ลิงก์ผลงานย่อย)
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
                        {editSubItems.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb' }}>
                                ชิ้นที่ #{sIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditSubItems(prev => prev.filter((_, i) => i !== sIdx));
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px'
                                }}
                                title="ลบชิ้นงานนี้"
                              >
                                ลบชิ้นนี้
                              </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <input
                                type="text"
                                value={sub.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditSubItems(prev => prev.map((s, i) => i === sIdx ? { ...s, title: val } : s));
                                }}
                                placeholder="ชื่อชิ้นงาน (เช่น ชิ้นที่ 1, สไลด์ 1)"
                                className="notion-input"
                                style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                              />

                              {/* Direct File Attachment Button & URL Input */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <label
                                  className="notion-btn"
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    color: '#1e293b',
                                    fontSize: '0.78rem',
                                    fontWeight: 500,
                                    cursor: uploadingSubIndex === sIdx ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="คลิกเพื่อเลือกไฟล์แนบจากเครื่อง (PDF หรือ รูปภาพ)"
                                >
                                  {uploadingSubIndex === sIdx ? (
                                    <>
                                      <Loader2 size={13} className="animate-spin" />
                                      <span>อัปโหลด...</span>
                                    </>
                                  ) : (
                                    <>
                                      <UploadCloud size={13} color="#2563eb" />
                                      <span>แนบไฟล์</span>
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept=".pdf,application/pdf,image/*"
                                    disabled={uploadingSubIndex === sIdx}
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingSubIndex(sIdx);
                                      try {
                                        const ext = (file.name.split('.').pop() || '').toLowerCase();
                                        const isImg = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);

                                        // Try uploading to Supabase Storage
                                        let uploadedUrl = await uploadAssetToSupabase(file, 'portfolio-subitems');

                                        // Fallback to data URL if cloud storage isn't available
                                        if (!uploadedUrl) {
                                          uploadedUrl = await new Promise<string>((resolve) => {
                                            const reader = new FileReader();
                                            reader.onload = () => resolve(reader.result as string);
                                            reader.onerror = () => resolve('');
                                            reader.readAsDataURL(file);
                                          });
                                        }

                                        let thumbUrl = isImg ? uploadedUrl : '';
                                        if (!isImg && file.type === 'application/pdf') {
                                          try {
                                            const thumb = await renderPdfFirstPageToImage(file);
                                            if (thumb) thumbUrl = thumb;
                                          } catch {}
                                        }

                                        const autoTitle = sub.title && !sub.title.startsWith('ชิ้นงานที่')
                                          ? sub.title
                                          : file.name.replace(/\.[^/.]+$/, '');

                                        setEditSubItems(prev => prev.map((s, i) => i === sIdx ? {
                                          ...s,
                                          title: autoTitle,
                                          url: uploadedUrl || '',
                                          imageUrl: thumbUrl || s.imageUrl
                                        } : s));
                                      } catch (err: any) {
                                        console.warn('Subitem upload error:', err);
                                      } finally {
                                        setUploadingSubIndex(null);
                                      }
                                    }}
                                  />
                                </label>

                                <input
                                  type="text"
                                  value={sub.url}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setEditSubItems(prev => prev.map((s, i) => i === sIdx ? { ...s, url: val } : s));
                                  }}
                                  placeholder="หรือวางลิงก์ไฟล์ / PDF / รูปภาพ"
                                  className="notion-input"
                                  style={{ fontSize: '0.82rem', padding: '6px 8px', flex: 1, minWidth: 0 }}
                                />
                              </div>
                            </div>

                            {/* Preview Badge if file attached */}
                            {sub.url && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.74rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                  <CheckCircle2 size={13} color="#16a34a" />
                                  <span style={{ color: '#15803d', fontWeight: 600, flexShrink: 0 }}>แนบแล้ว:</span>
                                  <span style={{ color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {sub.url.startsWith('data:') ? 'ไฟล์ที่แนบไว้ในเครื่อง' : sub.url}
                                  </span>
                                </div>
                                <a
                                  href={sub.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}
                                >
                                  <ExternalLink size={10} /> เปิดทดสอบ
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--notion-border)' }}>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isUpdating}
                  className="notion-btn notion-btn-subtle"
                  style={{ fontSize: '0.88rem' }}
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isUpdating}
                  className="notion-btn notion-btn-primary"
                  style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Save size={14} />
                  <span>{isUpdating ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE CONFIRMATION MODAL */}
      {deletingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 15, 15, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          <div
            className="responsive-modal"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              width: '100%',
              maxWidth: '440px',
              border: '1px solid var(--notion-border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #fee2e2',
              backgroundColor: '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626'
                }}>
                  <Trash2 size={18} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#991b1b', margin: 0 }}>
                  ยืนยันการลบผลงาน
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={Boolean(deletingId)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 20px' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--notion-text)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้?
              </p>
              <div style={{
                padding: '12px 14px',
                backgroundColor: '#f9fafb',
                border: '1px solid var(--notion-border)',
                borderRadius: 'var(--radius-xs)',
                marginBottom: '14px'
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', wordBreak: 'break-word' }}>
                  "{deletingItem.title}"
                </div>
                {deletingItem.fileName && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--notion-text-muted)', marginTop: '4px' }}>
                    ไฟล์: {deletingItem.fileName}
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.82rem', color: '#ef4444', margin: 0 }}>
                * การลบนี้จะไม่สามารถย้อนกลับได้ และไฟล์จะถูกนำออกจากระบบถาวร
              </p>
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '14px 20px',
              borderTop: '1px solid var(--notion-border)',
              backgroundColor: '#fbfbfa'
            }}>
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                disabled={Boolean(deletingId)}
                className="notion-btn notion-btn-subtle"
                style={{ fontSize: '0.88rem', padding: '8px 16px' }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={Boolean(deletingId)}
                className="notion-btn"
                style={{
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: '1px solid #b91c1c',
                  fontWeight: 600
                }}
              >
                <Trash2 size={14} />
                <span>{deletingId ? 'กำลังลบผลงาน...' : 'ยืนยันลบ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
