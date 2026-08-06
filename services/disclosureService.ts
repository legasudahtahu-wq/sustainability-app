import { supabase } from '@/lib/supabase/client';
import { GriDisclosure } from '@/types/database';

export async function getGriDisclosures(): Promise<GriDisclosure[]> {
  const { data, error } = await supabase
    .from('gri_disclosures')
    .select('*')
    .order('disclosure_code', { ascending: true });

  if (error) {
    console.error('Error fetching GRI disclosures:', error.message);
    throw new Error('Gagal mengambil data Taksonomi GRI dari database');
  }

  return data || [];
}