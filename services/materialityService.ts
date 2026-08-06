import { supabase } from '@/lib/supabase/client';
import { CompanyMaterialTopic } from '@/types/database';

export async function saveMaterialTopics(topics: Partial<CompanyMaterialTopic>[]) {
  const { data, error } = await supabase
    .from('company_material_topics')
    // upsert digunakan agar jika data sudah ada, akan di-update, jika belum, akan di-insert
    .upsert(topics, { onConflict: 'company_id,disclosure_id' })
    .select();

  if (error) {
    console.error('Error saving material topics:', error.message);
    throw new Error('Gagal menyimpan topik material ke database.');
  }

  return data;
}