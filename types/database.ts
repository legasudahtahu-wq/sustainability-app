export type UserRole = 'super_admin' | 'company_admin' | 'data_inputter' | 'reviewer' | 'auditor';
export type DataStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';
export type GriType = 'universal' | 'sector' | 'topic';

export interface GriDisclosure {
  id: string;
  standard_code: string;
  disclosure_code: string;
  title_en: string;
  title_id: string | null;
  gri_type: GriType;
  unit_default: string | null;
  is_mandatory: boolean;
  sdg_mapping?: string | null;
  ojk_mapping?: string | null;
  sasb_mapping?: string | null; // <-- Kolom baru untuk SASB
  created_at?: string;
}

export interface Company {
  id: string;
  parent_id: string | null;
  name: string;
  sector_code: string | null;
  country: string;
  created_at?: string;
}

export interface CompanyMaterialTopic {
  id: string;
  company_id: string;
  disclosure_id: string;
  is_material: boolean;
  impact_description: string | null;
  created_at?: string;
}

export interface PerformanceEntry {
  id: string;
  company_id: string;
  disclosure_id: string;
  period_year: number;
  period_month: number | null;
  numeric_value: number | null;
  text_value: string | null;
  unit_used: string | null;
  status: DataStatus;
  evidence_url?: string | null;
  inputted_by: string | null;
  approved_by: string | null;
  created_at?: string;
  updated_at?: string;
}