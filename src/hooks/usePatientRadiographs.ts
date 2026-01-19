import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { compressImage, formatBytes } from '@/lib/imageCompression';

export interface PatientRadiograph {
  id: string;
  patient_id: string;
  file_path: string;
  file_name: string;
  file_size: number | null;
  original_file_size: number | null;
  description: string | null;
  radiograph_type: string | null;
  tooth_numbers: number[] | null;
  taken_at: string | null;
  uploaded_at: string;
  uploaded_by: string | null;
  url?: string;
}

export interface StorageStats {
  totalSize: number;
  originalSize: number;
  savedSize: number;
  compressionRatio: number;
  count: number;
}

export type RadiographType = 'panoramic' | 'periapical' | 'bitewing' | 'cbct' | 'other';

export const RADIOGRAPH_TYPE_LABELS: Record<RadiographType, string> = {
  panoramic: 'Panoramică (OPG)',
  periapical: 'Periapicală',
  bitewing: 'Bitewing',
  cbct: 'CBCT 3D',
  other: 'Altele',
};

export function usePatientRadiographs(patientId?: string) {
  const [radiographs, setRadiographs] = useState<PatientRadiograph[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({ 
    totalSize: 0, 
    originalSize: 0, 
    savedSize: 0, 
    compressionRatio: 1, 
    count: 0 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchRadiographs = useCallback(async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_radiographs')
        .select('*')
        .eq('patient_id', patientId)
        .order('taken_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      // Get signed URLs for each radiograph
      const radiographsWithUrls = await Promise.all(
        (data || []).map(async (rad) => {
          const { data: urlData } = await supabase.storage
            .from('patient-radiographs')
            .createSignedUrl(rad.file_path, 3600); // 1 hour validity

          return {
            ...rad,
            url: urlData?.signedUrl,
          };
        })
      );

      setRadiographs(radiographsWithUrls);

      // Calculate storage statistics
      const stats = (data || []).reduce(
        (acc, rad) => {
          const fileSize = rad.file_size || 0;
          const originalSize = rad.original_file_size || fileSize;
          return {
            totalSize: acc.totalSize + fileSize,
            originalSize: acc.originalSize + originalSize,
            count: acc.count + 1,
          };
        },
        { totalSize: 0, originalSize: 0, count: 0 }
      );
      
      const savedSize = stats.originalSize - stats.totalSize;
      const compressionRatio = stats.originalSize > 0 ? stats.originalSize / stats.totalSize : 1;
      
      setStorageStats({
        totalSize: stats.totalSize,
        originalSize: stats.originalSize,
        savedSize,
        compressionRatio,
        count: stats.count,
      });
    } catch (error) {
      console.error('Error fetching radiographs:', error);
      toast.error('Eroare la încărcarea radiografiilor');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const uploadRadiograph = useCallback(async (
    file: File,
    metadata: {
      description?: string;
      radiograph_type?: RadiographType;
      tooth_numbers?: number[];
      taken_at?: string;
      compressionQuality?: 'high' | 'medium' | 'economic';
    }
  ) => {
    if (!patientId) return null;

    setUploading(true);
    
    // Compression settings based on quality level
    const qualitySettings = {
      high: { maxWidth: 3000, maxHeight: 3000, quality: 0.92 },
      medium: { maxWidth: 2048, maxHeight: 2048, quality: 0.85 },
      economic: { maxWidth: 1600, maxHeight: 1600, quality: 0.75 },
    };
    const compressionOpts = qualitySettings[metadata.compressionQuality || 'medium'];
    try {
      // Compress the image before upload
      const { 
        compressedFile, 
        originalSize, 
        compressedSize, 
        compressionRatio 
      } = await compressImage(file, compressionOpts);

      // Show compression info if significant compression occurred
      if (compressionRatio > 1.1) {
        console.log(`Image compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (${compressionRatio.toFixed(1)}x)`);
      }

      // Generate unique file path (always use .jpg for compressed images)
      const fileExt = compressionRatio > 1 ? 'jpg' : file.name.split('.').pop();
      const fileName = `${patientId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Upload compressed file to storage
      const { error: uploadError } = await supabase.storage
        .from('patient-radiographs')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save metadata to database (store both compressed and original size)
      const { data, error: dbError } = await supabase
        .from('patient_radiographs')
        .insert({
          patient_id: patientId,
          file_path: fileName,
          file_name: file.name,
          file_size: compressedSize,
          original_file_size: originalSize,
          description: metadata.description || null,
          radiograph_type: metadata.radiograph_type || null,
          tooth_numbers: metadata.tooth_numbers || null,
          taken_at: metadata.taken_at || null,
          uploaded_by: user?.id || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Show success message with compression info
      if (compressionRatio > 1.1) {
        toast.success(`Radiografia a fost încărcată (comprimată ${formatBytes(originalSize)} → ${formatBytes(compressedSize)})`);
      } else {
        toast.success('Radiografia a fost încărcată cu succes');
      }
      
      await fetchRadiographs();
      return data;
    } catch (error) {
      console.error('Error uploading radiograph:', error);
      toast.error('Eroare la încărcarea radiografiei');
      return null;
    } finally {
      setUploading(false);
    }
  }, [patientId, fetchRadiographs]);

  const deleteRadiograph = useCallback(async (radiograph: PatientRadiograph) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('patient-radiographs')
        .remove([radiograph.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_radiographs')
        .delete()
        .eq('id', radiograph.id);

      if (dbError) throw dbError;

      setRadiographs((prev) => prev.filter((r) => r.id !== radiograph.id));
      toast.success('Radiografia a fost ștearsă');
      return true;
    } catch (error) {
      console.error('Error deleting radiograph:', error);
      toast.error('Eroare la ștergerea radiografiei');
      return false;
    }
  }, []);

  const downloadRadiograph = useCallback(async (radiograph: PatientRadiograph) => {
    try {
      const { data, error } = await supabase.storage
        .from('patient-radiographs')
        .download(radiograph.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = radiograph.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Descărcare începută');
    } catch (error) {
      console.error('Error downloading radiograph:', error);
      toast.error('Eroare la descărcarea radiografiei');
    }
  }, []);

  return {
    radiographs,
    storageStats,
    loading,
    uploading,
    fetchRadiographs,
    uploadRadiograph,
    deleteRadiograph,
    downloadRadiograph,
  };
}
