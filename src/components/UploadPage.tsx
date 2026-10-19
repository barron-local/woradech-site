import React, { useState } from 'react';
import type { PortfolioItem } from '../types';
import { UploadCloud, FileText, CheckCircle2, Edit2, Trash2, ExternalLink, X, Save, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { uploadProjectToSupabase, updateProjectInSupabase, deleteProjectFromSupabase } from '../supabase';

interface UploadPageProps {
  projects: PortfolioItem[];
  onAddProject: (item: PortfolioItem) => void;
  onUpdateProject: (item: PortfolioItem) => void;
  onDeleteProject: (id: string) => void;
  onNavigateToPortfolio?: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onNavigateToPortfolio
}) => {
  // Form State for New Upload
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<{ name: string; size: string; isImage: boolean } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editNewFile, setEditNewFile] = useState<File | null>(null);
  const [editFileInfo, setEditFileInfo] = useState<{ name: string; size: string; isImage: boolean } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        reader.onload = () => {
          const fileUrl = reader.result as string;
          const fallbackItem: PortfolioItem = {
            id: (isImage ? 'img-' : 'pdf-') + Date.now(),
            title: title.trim(),
            category: isImage ? 'Image' : 'PDF Document',
            description: description.trim() || `ไฟล์ ${rawFile.name}`,
            imageUrl: isImage ? fileUrl : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
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

  const startEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setEditNewFile(null);
    setEditFileInfo(null);
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
      setEditError('กรุณาระบุชื่องาน');
      return;
    }

    setIsUpdating(true);
    setEditError('');

    try {
      const res = await updateProjectInSupabase({
        id: editingItem.id,
        title: editTitle.trim(),
        description: editDescription.trim(),
        newFile: editNewFile
      });

      let updatedPdfUrl = editingItem.pdfUrl;
      let updatedFileName = editingItem.fileName;

      if (editNewFile) {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            const finalPdfUrl = (reader.result as string) || updatedPdfUrl;
            const updatedItem: PortfolioItem = {
              ...editingItem,
              title: editTitle.trim(),
              description: editDescription.trim(),
              pdfUrl: res.item?.pdfUrl || finalPdfUrl,
              fileName: editNewFile.name,
              link: res.item?.link || finalPdfUrl
            };
            onUpdateProject(updatedItem);
          };
          reader.readAsDataURL(editNewFile);
        } catch {}
      } else {
        const updatedItem: PortfolioItem = {
          ...editingItem,
          title: editTitle.trim(),
          description: editDescription.trim(),
          pdfUrl: res.item?.pdfUrl || updatedPdfUrl,
          fileName: res.item?.fileName || updatedFileName,
          link: res.item?.link || editingItem.link
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

  const handleDelete = async (item: PortfolioItem) => {
    const confirmDelete = window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผลงาน "${item.title}"?`);
    if (!confirmDelete) return;

    setDeletingId(item.id);
    try {
      await deleteProjectFromSupabase(item.id);
      onDeleteProject(item.id);
    } catch (err: any) {
      console.warn('Error deleting project:', err);
      onDeleteProject(item.id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 24px 80px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--notion-text)', marginBottom: '8px' }}>
          จัดการผลงาน Portfolio (PDF & รูปภาพ Upload & Manage)
        </h1>
        <p style={{ fontSize: '0.92rem', color: 'var(--notion-text-muted)' }}>
          อัปโหลดไฟล์ PDF หรืองานรูปภาพใหม่ หรือแก้ไข/ลบรายการผลงานที่มีอยู่ โดยข้อมูลจะอัปเดตไปแสดงที่หน้า Portfolio ทันที
        </p>
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

      {/* 1. UPLOAD FORM */}
      <form onSubmit={handleSubmit} style={{
          background: '#ffffff',
          border: '1px solid var(--notion-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '24px',
          marginBottom: '40px',
          boxShadow: '0 2px 8px rgba(15, 15, 15, 0.04)'
        }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--notion-text)', marginBottom: '18px' }}>
            + อัปโหลดผลงานใหม่ (PDF หรือ รูปภาพ)
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

      {/* 2. MANAGE EXISTING PROJECTS LIST */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--notion-text)', margin: 0 }}>
            รายการผลงานทั้งหมด ({projects.length})
          </h2>
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

        {projects.length === 0 ? (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--notion-border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Left: Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    {item.category === 'Image' || (item.fileName && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(item.fileName)) ? (
                      <ImageIcon size={18} color="#2563eb" />
                    ) : (
                      <FileText size={18} color="#dc2626" />
                    )}
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--notion-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </span>
                  </div>

                  {item.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--notion-text-muted)', margin: '0 0 6px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--notion-text-muted)' }}>
                    {item.fileName && (
                      <span>ไฟล์: {item.fileName}</span>
                    )}
                    {item.pdfUrl && (
                      <a
                        href={item.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#2563eb', textDecoration: 'none' }}
                      >
                        <ExternalLink size={12} />
                        เปิดดูไฟล์
                      </a>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={() => startEdit(item)}
                    className="notion-btn notion-btn-subtle"
                    style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px' }}
                    title="แก้ไขชื่องาน / รายละเอียด"
                  >
                    <Edit2 size={14} />
                    <span>แก้ไข</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item)}
                    disabled={deletingId === item.id}
                    className="notion-btn"
                    style={{
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      color: '#dc2626',
                      borderColor: '#fca5a5',
                      backgroundColor: '#fef2f2'
                    }}
                    title="ลบผลงานนี้"
                  >
                    <Trash2 size={14} />
                    <span>{deletingId === item.id ? 'กำลังลบ...' : 'ลบ'}</span>
                  </button>
                </div>
              </div>
            ))}
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
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            width: '100%',
            maxWidth: '560px',
            border: '1px solid var(--notion-border)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
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

              {/* Replace PDF or Image (Optional) */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                  เปลี่ยนไฟล์แนบ (PDF หรือ รูปภาพ หากต้องการ):
                </label>
                <div style={{ fontSize: '0.82rem', color: 'var(--notion-text-muted)', marginBottom: '8px' }}>
                  ไฟล์ปัจจุบัน: <strong>{editingItem.fileName || 'เอกสารแนบ'}</strong>
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  onChange={handleEditFileChange}
                  style={{ fontSize: '0.85rem' }}
                />
                {editFileInfo && (
                  <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#16a34a' }}>
                    ✓ เลือกไฟล์ใหม่: {editFileInfo.name} ({editFileInfo.size})
                  </div>
                )}
              </div>

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

    </div>
  );
};
