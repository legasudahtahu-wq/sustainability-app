import { supabase } from '@/lib/supabase/client';
import { PerformanceEntry } from '@/types/database';

// 1. Fungsi Unggah File Bukti ke Supabase Storage
export async function uploadEvidenceFile(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  // Membuat nama file acak agar tidak bentrok (timestamp + angka acak)
  const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
  const filePath = `uploads/${fileName}`;

  const { error } = await supabase.storage
    .from('evidence_files')
    .upload(filePath, file);

  if (error) {
    console.error('Error uploading file:', error.message);
    throw new Error('Gagal mengunggah file bukti ke server.');
  }

  // Mengambil URL publik dari file yang baru diunggah
  const { data } = supabase.storage.from('evidence_files').getPublicUrl(filePath);
  return data.publicUrl;
}

// 2. Fungsi Menyimpan Data Baru (Fase 3)
export async function insertPerformanceData(entryData: Partial<PerformanceEntry>) {
  const { data, error } = await supabase
    .from('performance_entries')
    .insert([entryData])
    .select();

  if (error) {
    console.error('Error inserting data:', error.message);
    throw new Error(error.message);
  }

  return data;
}

// 3. Fungsi Mengambil Semua Data Kinerja (Fase 4)
export async function getPerformanceEntries(): Promise<PerformanceEntry[]> {
  const { data, error } = await supabase
    .from('performance_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching data:', error.message);
    throw new Error(error.message);
  }

  return data || [];
}

// 4. Fungsi Mengubah Status Data / Approval (Fase 4)
export async function updatePerformanceStatus(id: string, status: 'approved' | 'rejected') {
  const { data, error } = await supabase
    .from('performance_entries')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating status:', error.message);
    throw new Error(error.message);
  }

  return data;
}