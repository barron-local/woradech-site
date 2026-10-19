import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { PortfolioItem } from './types';

// Read all credentials directly from environment variables (.env)
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://srpytprcobmufxqrkzio.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClientInstance: SupabaseClient<any> | null = null;

export const getSupabaseClient = (): SupabaseClient<any> | null => {
  if (!SUPABASE_ANON_KEY) return null;
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient<any>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });
  }
  return supabaseClientInstance;
};

export interface SupabaseProjectRow {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  file_name?: string;
  pdf_url?: string;
  image_url?: string;
  created_at?: string;
}

// Fetch all uploaded projects from Supabase
export async function fetchProjectsFromSupabase(): Promise<PortfolioItem[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Supabase fetch error:', error);
      return null;
    }

    if (data) {
      return data.map((row: SupabaseProjectRow) => ({
        id: row.id || `p-${Date.now()}`,
        title: row.title,
        category: row.category || 'PDF Document',
        description: row.description || '',
        imageUrl: row.image_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        pdfUrl: row.pdf_url,
        fileName: row.file_name,
        link: row.pdf_url,
        tags: ['PDF', row.category || 'Document'],
        createdAt: row.created_at
      }));
    }
  } catch (err) {
    console.error('Error fetching from Supabase:', err);
  }
  return null;
}

// Upload file to Supabase Storage and insert row into database
export async function uploadProjectToSupabase(params: {
  title: string;
  category: string;
  description: string;
  file: File;
}): Promise<{ success: boolean; item?: PortfolioItem; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'ยังไม่ได้ระบุ VITE_SUPABASE_ANON_KEY ในไฟล์ .env' };
  }

  try {
    const fileExt = (params.file.name.split('.').pop() || '').toLowerCase();
    const isImage = params.file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt);
    const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `documents/${cleanFileName}`;
    const contentType = isImage ? (params.file.type || 'image/jpeg') : 'application/pdf';

    let publicFileUrl = '';
    const { error: uploadError } = await supabase.storage
      .from('portfolio-docs')
      .upload(filePath, params.file, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn('Storage upload note:', uploadError.message);
      publicFileUrl = await fileToDataUrl(params.file);
    } else {
      const { data: urlData } = supabase.storage
        .from('portfolio-docs')
        .getPublicUrl(filePath);
      publicFileUrl = urlData.publicUrl;
    }

    const defaultCover = isImage
      ? publicFileUrl
      : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";

    const itemCategory = params.category || (isImage ? 'Image' : 'PDF Document');

    const { data: inserted, error: insertError } = await supabase
      .from('projects')
      .insert([
        {
          title: params.title,
          category: itemCategory,
          description: params.description || '',
          file_name: params.file.name,
          pdf_url: publicFileUrl,
          image_url: defaultCover
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.warn('Database insert note:', insertError.message);
      const fallbackItem: PortfolioItem = {
        id: `file-${Date.now()}`,
        title: params.title,
        category: itemCategory,
        description: params.description,
        imageUrl: defaultCover,
        pdfUrl: publicFileUrl,
        fileName: params.file.name,
        link: publicFileUrl,
        tags: [isImage ? 'Image' : 'PDF', itemCategory]
      };
      return { success: true, item: fallbackItem };
    }

    const newItem: PortfolioItem = {
      id: inserted.id,
      title: inserted.title,
      category: inserted.category || itemCategory,
      description: inserted.description,
      imageUrl: inserted.image_url || defaultCover,
      pdfUrl: inserted.pdf_url,
      fileName: inserted.file_name,
      link: inserted.pdf_url,
      tags: ['PDF', inserted.category || 'Document'],
      createdAt: inserted.created_at || new Date().toISOString()
    };

    return { success: true, item: newItem };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Supabase' };
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Update an existing project in Supabase
export async function updateProjectInSupabase(params: {
  id: string;
  title: string;
  description?: string;
  category?: string;
  newFile?: File | null;
}): Promise<{ success: boolean; item?: PortfolioItem; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const updatePayload: Record<string, any> = {
      title: params.title.trim(),
      description: params.description?.trim() || '',
      category: params.category || 'PDF Document'
    };

    if (params.newFile) {
      const fileExt = (params.newFile.name.split('.').pop() || '').toLowerCase();
      const isImage = params.newFile.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt);
      const cleanFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `documents/${cleanFileName}`;
      const contentType = isImage ? (params.newFile.type || 'image/jpeg') : 'application/pdf';

      const { error: uploadError } = await supabase.storage
        .from('portfolio-docs')
        .upload(filePath, params.newFile, {
          contentType,
          upsert: true
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('portfolio-docs')
          .getPublicUrl(filePath);
        updatePayload.pdf_url = urlData.publicUrl;
        updatePayload.file_name = params.newFile.name;
        if (isImage) {
          updatePayload.image_url = urlData.publicUrl;
          updatePayload.category = 'Image';
        }
      } else {
        const dataUrl = await fileToDataUrl(params.newFile);
        updatePayload.pdf_url = dataUrl;
        updatePayload.file_name = params.newFile.name;
        if (isImage) {
          updatePayload.image_url = dataUrl;
          updatePayload.category = 'Image';
        }
      }
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updatePayload)
      .eq('id', params.id)
      .select();

    if (error) {
      console.warn('Supabase update note:', error.message);
      return { success: false, error: error.message };
    }

    const row = data && data.length > 0 ? data[0] : null;

    const updatedItem: PortfolioItem = {
      id: params.id,
      title: updatePayload.title,
      category: updatePayload.category || 'PDF Document',
      description: updatePayload.description || '',
      imageUrl: (row && row.image_url) ? row.image_url : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
      pdfUrl: updatePayload.pdf_url || (row ? row.pdf_url : ''),
      fileName: updatePayload.file_name || (row ? row.file_name : ''),
      link: updatePayload.pdf_url || (row ? row.pdf_url : ''),
      tags: ['PDF', updatePayload.category || 'Document'],
      createdAt: row?.created_at
    };

    return { success: true, item: updatedItem };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการอัปเดต' };
  }
}

// Delete a project from Supabase
export async function deleteProjectFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client not initialized' };
  }

  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'เกิดข้อผิดพลาดในการลบ' };
  }
}

// Sync new project order to Supabase by adjusting created_at timestamps
export async function syncProjectOrderToSupabase(reorderedProjects: PortfolioItem[]): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !reorderedProjects || reorderedProjects.length === 0) return;

  try {
    // Generate timestamps with 10-second intervals so order is preserved
    const baseTime = Date.now() - (reorderedProjects.length * 60 * 1000);
    const updates = reorderedProjects.map((project, index) => {
      const newTimestamp = new Date(baseTime + (index * 10 * 1000)).toISOString();
      return supabase
        .from('projects')
        .update({ created_at: newTimestamp })
        .eq('id', project.id);
    });

    await Promise.allSettled(updates);
  } catch (err) {
    console.warn('Failed to sync project order to Supabase:', err);
  }
}
