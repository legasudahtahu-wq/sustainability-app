"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GriDisclosure } from '@/types/database';

interface PerformanceFormProps {
  disclosures: GriDisclosure[];
  materialTopicIds: string[];
  managementData: Record<string, { policy: string, actions: string }>;
  setManagementData: React.Dispatch<React.SetStateAction<Record<string, { policy: string, actions: string }>>>;
  perfData: Record<string, Record<number, any>>;
  setPerfData: React.Dispatch<React.SetStateAction<Record<string, Record<number, any>>>>;
  sites: string[]; 
  setSites: React.Dispatch<React.SetStateAction<string[]>>; 
  reportingYear: number;
}

const INTENSITY_UNITS = ['Ton Produk', 'Juta Rupiah (Pendapatan)', 'MWh (Output)', 'Orang (FTE)', 'Meter Persegi', 'Lainnya'];

const SafeNumericInput = React.memo(({ value, onChange, placeholder = "0", className }: any) => {
  const [localVal, setLocalVal] = useState<string | number>(value ?? '');
  const [error, setError] = useState('');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localVal === '' || localVal === null) {
        setError('');
        onChangeRef.current(null);
      } else {
        const parsed = parseFloat(localVal as string);
        if (isNaN(parsed)) {
          setError('Harus angka!');
        } else if (parsed < 0) {
          setError('Tidak boleh minus!');
        } else {
          setError('');
          onChangeRef.current(parsed);
        }
      }
    }, 600); 
    return () => clearTimeout(timer);
  }, [localVal]);

  return (
    <div className="relative w-full">
      <input
        type="number"
        step="any"
        placeholder={placeholder}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        className={`${className} ${error ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : ''}`}
      />
      {error && <span className="absolute -bottom-4 left-0 text-[9px] text-red-600 font-bold bg-white px-1 rounded shadow-sm z-10">{error}</span>}
    </div>
  );
});
SafeNumericInput.displayName = "SafeNumericInput";

const SafeTextArea = React.memo(({ value, onChange, placeholder, className, rows = 3 }: any) => {
  const [localVal, setLocalVal] = useState(value ?? '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current((localVal as string).trim());
    }, 800);
    return () => clearTimeout(timer);
  }, [localVal]);

  return (
    <textarea rows={rows} placeholder={placeholder} value={localVal} onChange={(e) => setLocalVal(e.target.value)} className={className} />
  );
});
SafeTextArea.displayName = "SafeTextArea";

const SafeTextInput = React.memo(({ value, onChange, placeholder, className }: any) => {
  const [localVal, setLocalVal] = useState(value ?? '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChangeRef.current((localVal as string).trim());
    }, 600);
    return () => clearTimeout(timer);
  }, [localVal]);

  return (
    <input type="text" placeholder={placeholder} value={localVal} onChange={(e) => setLocalVal(e.target.value)} className={className} />
  );
});
SafeTextInput.displayName = "SafeTextInput";

const sanitizeCSV = (str: any) => {
  if (str === null || str === undefined || str === '') return '"-"';
  const cleanStr = String(str).replace(/"/g, '""');
  if (/^[=\-+\@]/.test(cleanStr)) return `"\t${cleanStr}"`; 
  return `"${cleanStr}"`;
};

const getCrossReference = (code: string = '') => {
  if (code.startsWith('201')) return ['SDG 8', 'SDG 9', 'POJK 51: 6.a'];
  if (code.startsWith('205')) return ['SDG 16', 'UNGC 10'];
  if (code.startsWith('302')) return ['SDG 7', 'SDG 12', 'SDG 13', 'POJK 51: 6.b'];
  if (code.startsWith('303')) return ['SDG 6', 'POJK 51: 6.b'];
  if (code.startsWith('304')) return ['SDG 14', 'SDG 15', 'POJK 51: 6.b'];
  if (code.startsWith('305')) return ['SDG 13', 'TCFD Metrics', 'POJK 51: 6.b'];
  if (code.startsWith('306')) return ['SDG 3', 'SDG 6', 'SDG 12', 'POJK 51: 6.b'];
  if (code.startsWith('401')) return ['SDG 8', 'POJK 51: 6.c'];
  if (code.startsWith('403')) return ['SDG 3', 'SDG 8', 'POJK 51: 6.c'];
  if (code.startsWith('404')) return ['SDG 4', 'SDG 8', 'POJK 51: 6.c'];
  if (code.startsWith('405')) return ['SDG 5', 'SDG 10', 'POJK 51: 6.c'];
  if (code.startsWith('413')) return ['SDG 1', 'SDG 2', 'SDG 11', 'POJK 51: 6.d'];
  if (code.startsWith('2-')) return ['UNGC 1-10', 'POJK 51: 4', 'SDG 16'];
  if (code.startsWith('IFRS')) return ['TCFD Framework', 'SASB General', 'SDG 13'];
  return ['GRI Standards'];
};

const getBestPracticePlaceholder = (code: string = '') => {
  if (code.startsWith('2-')) return "Contoh: Mengimplementasikan sistem rekrutmen dewan pengawas berbasis matriks kompetensi ESG dan keberagaman gender...";
  if (code.startsWith('20')) return "Contoh: Membentuk kemitraan dengan 100 UMKM lokal untuk memperkuat rantai pasok domestik...";
  if (code.startsWith('302') || code.startsWith('305') || code.startsWith('IFRS')) return "Contoh: Meluncurkan program efisiensi energi dan pemasangan panel surya yang berhasil memangkas emisi karbon 15%...";
  if (code.startsWith('303') || code.startsWith('306')) return "Contoh: Penerapan teknologi sirkular ekonomi yang berhasil mendaur ulang 85% limbah operasional menjadi bahan baku alternatif...";
  if (code.startsWith('403')) return "Contoh: Kampanye 'Safety First' yang berhasil mencapai 2 juta jam kerja tanpa kecelakaan kehilangan waktu (Zero LTI)...";
  if (code.startsWith('413')) return "Contoh: Inisiatif 'Desa Mandiri' yang memberdayakan 50 kepala keluarga lokal melalui pelatihan kewirausahaan...";
  return "Ceritakan kisah sukses, inovasi, atau inisiatif unggulan yang telah dijalankan perusahaan terkait topik ini...";
};

const getPolicyPlaceholder = (code: string = '') => {
  if (code.startsWith('2-')) return "Contoh: Pedoman Tata Kelola Perusahaan (GCG), Kode Etik Perilaku...";
  if (code.startsWith('20')) return "Contoh: Kebijakan Pengadaan Barang & Jasa (SOP-LOG-01), Pedoman Anti Penyuapan...";
  if (code.startsWith('302') || code.startsWith('305') || code.startsWith('IFRS')) return "Contoh: Kebijakan Transisi Energi, Komitmen Net Zero Emission...";
  if (code.startsWith('303') || code.startsWith('306')) return "Contoh: SOP Pengelolaan Limbah B3, Kebijakan Konservasi Air (SK Dir No. 12/2023)...";
  if (code.startsWith('403')) return "Contoh: Kebijakan Sistem Manajemen Keselamatan dan Kesehatan Kerja (SMK3) Terintegrasi...";
  if (code.startsWith('4')) return "Contoh: Perjanjian Kerja Bersama (PKB), Kebijakan Kesetaraan Kesempatan Kerja...";
  return "Tuliskan nama kebijakan, SOP, atau pedoman internal yang mengatur pengelolaan topik ini...";
};

const getTargetPlaceholder = (code: string = '') => {
  if (code.startsWith('20')) return "Contoh: Melibatkan minimal 70% pemasok lokal pada tahun 2026...";
  if (code.startsWith('302') || code.startsWith('305')) return "Contoh: Penurunan intensitas emisi 10% dan efisiensi energi 5% di 2030...";
  if (code.startsWith('306')) return "Contoh: Zero Waste to Landfill pada tahun 2028...";
  if (code.startsWith('403')) return "Contoh: Zero Fatality, Pengurangan LTIR sebesar 5% tahun ini...";
  if (code.startsWith('405')) return "Contoh: Mencapai kuota 30% perempuan dalam posisi manajerial...";
  return "Contoh: Mencapai kepatuhan 100%, peningkatan efisiensi 5%...";
};

const getNarrativePlaceholder = (code: string = '') => {
  if (code.match(/^2-[1-6]/)) return "Contoh: PT ESG Nusantara beroperasi di sektor manufaktur dengan kantor pusat di Jakarta. Kami melayani pasar domestik dan ekspor ke 5 negara...";
  if (code.match(/^2-[9|10|11|12|13|14|15|16|17|18|19|20]/)) return "Contoh: Susunan dewan direksi terdiri dari 5 anggota. Pemilihan dilakukan melalui RUPS dengan mempertimbangkan independensi dan rekam jejak...";
  if (code === '2-30') return "Contoh: Saat ini, 85% karyawan kami tercakup dalam Perjanjian Perundingan Kolektif (PKB) yang diperbarui setiap 2 tahun...";
  return "Uraikan penjelasan kualitatif, konteks data, prosedur, atau rincian tambahan yang relevan dengan indikator ini...";
};

export function PerformanceForm({ disclosures, materialTopicIds, managementData, setManagementData, perfData, setPerfData, sites, setSites, reportingYear }: PerformanceFormProps) {
  
  const activeDisclosures = useMemo(() => {
    return disclosures.filter((d) => d.gri_type === 'universal' || materialTopicIds.includes(d.id));
  }, [disclosures, materialTopicIds]);
  
  const years = [reportingYear - 3, reportingYear - 2, reportingYear - 1, reportingYear];
  
  const [selectedYear, setSelectedYear] = useState<number>(reportingYear);
  const [activeTopicId, setActiveTopicId] = useState<string>(activeDisclosures[0]?.id || '');
  const [isSaved, setIsSaved] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'UNIVERSAL' | 'TOPIC'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');

  // 🌟 FITUR BARU: STATE AUDIT TRAIL
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [mockAuditLogs, setMockAuditLogs] = useState<Record<string, any[]>>({});

  useEffect(() => {
    setSelectedYear(reportingYear);
  }, [reportingYear]);

  const getGriDetails = (code: string) => {
    if (code === 'IFRS-S2-1') return { description: 'Pengungkapan hasil Uji Stres Risiko Iklim (CRST) tingkat korporat mencakup skenario yang digunakan, proyeksi peningkatan Probability of Default (PD), Loss Given Default (LGD), dan dampaknya terhadap Capital Adequacy Ratio (CAR).', unit: 'Persentase (%)', isNumeric: false, type: 'tcfd_strategy' };
    if (code === 'IFRS-S2-2') return { description: 'Pengungkapan target penurunan emisi yang dibiayai (Financed Emissions) serta penerapan Internal Carbon Pricing (ICP) dalam operasional dan pengambilan keputusan investasi.', unit: 'Nilai', isNumeric: false, type: 'tcfd_metrics' };

    if (code === '302-3') return { description: 'Rasio energi yang digunakan untuk setiap unit aktivitas/produksi.', unit: 'GJ / Unit', isNumeric: true, type: 'intensity' };
    if (code === '305-4') return { description: 'Rasio emisi Gas Rumah Kaca terhadap metrik spesifik organisasi.', unit: 'tCO2e / Unit', isNumeric: true, type: 'intensity' };
    if (code === '2-7') return { description: 'Total jumlah karyawan yang bekerja untuk organisasi.', unit: 'Orang', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Berdasarkan Status Kontrak', 'Berdasarkan Tipe Pekerjaan'], defaultItems: [{ id: 'emp_p', name: 'Karyawan Tetap', category: 'Berdasarkan Status Kontrak' }, { id: 'emp_t', name: 'Karyawan Kontrak', category: 'Berdasarkan Status Kontrak' }, { id: 'emp_ft', name: 'Penuh Waktu', category: 'Berdasarkan Tipe Pekerjaan' }, { id: 'emp_pt', name: 'Paruh Waktu', category: 'Berdasarkan Tipe Pekerjaan' }] };
    if (code === '405-1') return { description: 'Komposisi karyawan dan badan tata kelola perusahaan.', unit: 'Orang', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Berdasarkan Gender', 'Berdasarkan Kelompok Usia'], defaultItems: [{ id: 'div_g_1', name: 'Laki-laki', category: 'Berdasarkan Gender' }, { id: 'div_g_2', name: 'Perempuan', category: 'Berdasarkan Gender' }, { id: 'div_a_1', name: 'Di bawah 30 tahun', category: 'Berdasarkan Kelompok Usia' }, { id: 'div_a_2', name: '30 - 50 tahun', category: 'Berdasarkan Kelompok Usia' }, { id: 'div_a_3', name: 'Di atas 50 tahun', category: 'Berdasarkan Kelompok Usia' }] };
    if (code === '204-1') return { description: 'Persentase pengadaan untuk pemasok lokal.', unit: 'Rupiah (IDR)', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Proporsi Pengeluaran Pemasok'], defaultItems: [{ id: 'sup_loc', name: 'Pemasok Lokal', category: 'Proporsi Pengeluaran Pemasok' }, { id: 'sup_nat', name: 'Pemasok Non-Lokal', category: 'Proporsi Pengeluaran Pemasok' }] };
    if (code === '302-1') return { description: 'Total konsumsi energi di dalam organisasi.', unit: 'Gigajoule (GJ)', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Bahan Bakar Fosil (Non-Renewable)', 'Listrik & Utilitas (Grid)', 'Energi Terbarukan (Renewable)'], defaultItems: [{ id: 'en_nr_1', name: 'Solar / Diesel', category: 'Bahan Bakar Fosil (Non-Renewable)' }, { id: 'en_nr_2', name: 'Batu Bara / Gas Alam', category: 'Bahan Bakar Fosil (Non-Renewable)' }, { id: 'en_gr_1', name: 'Listrik PLN', category: 'Listrik & Utilitas (Grid)' }, { id: 'en_re_1', name: 'Solar Panel', category: 'Energi Terbarukan (Renewable)' }] };
    if (code === '303-3') return { description: 'Total volume air yang ditarik.', unit: 'Megaliter (ML)', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Air Tanah', 'Air Permukaan', 'Air Pihak Ketiga (PDAM)'], defaultItems: [{ id: 'wat_1', name: 'Sumur Bor', category: 'Air Tanah' }, { id: 'wat_2', name: 'Sungai / Danau', category: 'Air Permukaan' }, { id: 'wat_3', name: 'Suplai PDAM', category: 'Air Pihak Ketiga (PDAM)' }] };
    if (code.startsWith('306')) return { description: 'Total berat limbah yang dihasilkan.', unit: 'Metrik Ton (t)', isNumeric: true, type: 'breakdown', aggType: 'sum', categories: ['Limbah B3 (Berbahaya)', 'Limbah Non-B3 (Aman)'], defaultItems: [{ id: 'b3_1', name: 'Oli Bekas', category: 'Limbah B3 (Berbahaya)' }, { id: 'b3_2', name: 'Limbah Medis', category: 'Limbah B3 (Berbahaya)' }, { id: 'nb3_1', name: 'Kertas & Kemasan', category: 'Limbah Non-B3 (Aman)' }, { id: 'nb3_2', name: 'Sisa Organik', category: 'Limbah Non-B3 (Aman)' }] };
    
    if (code === '2-1') return { description: 'Melaporkan nama entitas hukum, sifat kepemilikan/bentuk hukum, lokasi kantor pusat, dan negara tempat entitas beroperasi.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-2') return { description: 'Menjelaskan entitas (anak perusahaan, cabang, joint venture) yang dicakup dalam pelaporan keberlanjutan ini.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-3') return { description: 'Menyebutkan periode pelaporan (misal: 1 Jan - 31 Des), frekuensi penerbitan, dan kontak penanggung jawab.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-4') return { description: 'Menjelaskan penyajikan kembali informasi jika ada revisi atau koreksi dari data yang dilaporkan pada tahun-tahun sebelumnya.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-5') return { description: 'Menjelaskan kebijakan dan praktik jaminan eksternal (external assurance) yang memvalidasi laporan ini.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-6') return { description: 'Menjabarkan sektor operasi operasional, produk/jasa utama, pasar yang dilayani, serta struktur rantai pasokan perusahaan.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-9') return { description: 'Menjelaskan struktur tata kelola perusahaan, termasuk komposisi dan komite-komite di bawah dewan direksi/komisaris.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-10') return { description: 'Menguraikan proses serta kriteria (seperti keahlian, keanekaragaman, independensi) dalam mencalonkan dan memilih anggota tata kelola.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-11') return { description: 'Menjelaskan apakah Ketua Badan Tata Kelola (Presiden Komisaris/Ketua Dewan) merangkap jabatan eksekutif lainnya beserta alasannya.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-12') return { description: 'Menguraikan bagaimana peran dewan dalam mengawasi pengelolaan dampak ekonomi, lingkungan, dan sosial organisasi.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-13') return { description: 'Menjelaskan bagaimana wewenang pengelolaan dampak keberlanjutan didelegasikan dari dewan kepada pimpinan eksekutif senior.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-14') return { description: 'Menjelaskan proses badan tata kelola tertinggi dalam meninjau dan secara resmi menyetujui laporan keberlanjutan ini.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-15') return { description: 'Menguraikan mekanisme tata kelola dalam perusahaan untuk mengidentifikasi, mencegah, dan mengelola konflik/benturan kepentingan.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code === '2-16') return { description: 'Menjelaskan mekanisme bagaimana keluhan atau masalah kritis dikomunikasikan secara langsung ke dewan pengawas.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    if (code.startsWith('2-')) return { description: 'Pengungkapan naratif mengenai praktik tata kelola, strategi, atau kebijakan organisasi sesuai pedoman GRI 2.', unit: 'Naratif', isNumeric: false, type: 'narrative' };
    
    if (code === '201-1') return { description: 'Nilai ekonomi langsung yang dihasilkan.', unit: 'Rupiah (IDR)', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('305-1')) return { description: 'Emisi GRK Langsung (Cakupan 1).', unit: 'Metrik Ton CO2e', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('305-2')) return { description: 'Emisi GRK Energi Tidak Langsung (Cakupan 2).', unit: 'Metrik Ton CO2e', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('201') || code.startsWith('203') || code.startsWith('207')) return { description: 'Dampak ekonomi historis langsung.', unit: 'Rupiah (IDR)', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('202') || code.startsWith('308') || code.startsWith('414')) return { description: 'Persentase pemenuhan kriteria keberlanjutan.', unit: 'Persentase (%)', isNumeric: true, type: 'absolute', aggType: 'average' };
    if (code.startsWith('205') || code.startsWith('206') || code.startsWith('403') || code.startsWith('418')) return { description: 'Jumlah total insiden tercatat.', unit: 'Kasus', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('301')) return { description: 'Jumlah material yang digunakan.', unit: 'Metrik Ton (t)', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('305')) return { description: 'Inventarisasi Gas Rumah Kaca (GRK).', unit: 'Metrik Ton CO2e', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('304')) return { description: 'Cakupan luasan area operasional.', unit: 'Hektar (ha)', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('401')) return { description: 'Total jumlah individu terkait ketenagakerjaan.', unit: 'Orang', isNumeric: true, type: 'absolute', aggType: 'sum' };
    if (code.startsWith('402')) return { description: 'Rata-rata waktu pemberitahuan standar.', unit: 'Minggu', isNumeric: true, type: 'absolute', aggType: 'average' };
    if (code.startsWith('404')) return { description: 'Rata-rata jam pelatihan per karyawan.', unit: 'Jam', isNumeric: true, type: 'absolute', aggType: 'average' };
    if (code.startsWith('413')) return { description: 'Persentase operasi komunitas lokal.', unit: 'Persentase (%)', isNumeric: true, type: 'absolute', aggType: 'average' };
    return { description: 'Silakan laporkan data kinerja.', unit: 'Nilai', isNumeric: true, type: 'absolute', aggType: 'sum' };
  };

  const handleAddSite = () => { if (!newSiteName.trim() || sites.includes(newSiteName.trim())) return; setSites(prev => [...prev, newSiteName.trim()]); setNewSiteName(''); setShowAddSiteModal(false); };
  const handleRemoveSite = (site: string) => { if (sites.length > 1) setSites(prev => prev.filter(s => s !== site)); };

  const filteredDisclosures = useMemo(() => {
    return activeDisclosures.filter(d => {
      const matchesCategory = categoryFilter === 'ALL' ? true : categoryFilter === 'UNIVERSAL' ? d.gri_type === 'universal' : categoryFilter === 'TOPIC' ? d.gri_type === 'topic' : true;
      const matchesSearch = d.disclosure_code.toLowerCase().includes(searchQuery.toLowerCase()) || (d.title_id || d.title_en || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeDisclosures, categoryFilter, searchQuery]);

  useEffect(() => {
    if (filteredDisclosures.length > 0) {
      const isCurrentInFiltered = filteredDisclosures.some(d => d.id === activeTopicId);
      if (!isCurrentInFiltered) {
        setActiveTopicId(filteredDisclosures[0].id);
      }
    } else {
      setActiveTopicId('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDisclosures]);

  const handleTabChange = (catId: 'ALL' | 'UNIVERSAL' | 'TOPIC') => {
    setCategoryFilter(catId);
  };

  const handleManagementChange = (field: 'policy' | 'actions', value: string) => { setIsSaved(false); setManagementData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || { policy: '', actions: '' }), [field]: value } })); };
  const handleNarrativePerfChange = (value: string) => { setIsSaved(false); setPerfData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), [selectedYear]: { ...(prev[activeTopicId]?.[selectedYear] || {}), narrativeValue: value } } })); };
  const handleIntensityDataChange = (field: 'denominator' | 'intensityUnit', value: any) => { setIsSaved(false); setPerfData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), [selectedYear]: { ...(prev[activeTopicId]?.[selectedYear] || {}), intensityData: { ...(prev[activeTopicId]?.[selectedYear]?.intensityData || {}), [field]: value } } } })); };
  const handleMetaChange = (field: 'target' | 'evidence' | 'bestPractice', value: any) => { setIsSaved(false); setPerfData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), [selectedYear]: { ...(prev[activeTopicId]?.[selectedYear] || {}), [field]: value } } })); };
  
  // 🌟 MODIFIKASI: MESIN SIMPAN DAN LOG AUDIT
  const handleSaveTopic = () => { 
    setIsSaved(true); 
    setTimeout(() => setIsSaved(false), 3000); 

    // Mencatat Log Audit secara lokal (MOCKUP)
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' }),
      actor: 'Admin ESG (Anda)',
      action: 'UPDATE',
      details: `Menyimpan pembaruan data untuk tahun ${selectedYear}.`
    };

    setMockAuditLogs(prev => {
      const currentLogs = prev[activeTopicId] || [];
      return {
        ...prev,
        [activeTopicId]: [newLog, ...currentLogs]
      };
    });

    // -------------------------------------------------------------
    // TEMPAT IMPLEMENTASI DB SUPABASE ASLI:
    // await supabase.from('audit_logs').insert({
    //    topic_id: activeTopicId,
    //    reporting_year: selectedYear,
    //    action_type: 'UPDATE',
    //    modified_by: user.id
    // });
    // -------------------------------------------------------------
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file terlalu besar! Maksimal 5 MB.');
      e.target.value = '';
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert('Format file tidak didukung! Harap unggah dokumen PDF, JPG, atau PNG.');
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const localMockUrl = URL.createObjectURL(file);
      handleMetaChange('evidence', localMockUrl);
    } catch (err) {
      alert('Gagal mengunggah file. Periksa koneksi Anda.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; 
    }
  };

  const handleRemoveEvidence = () => {
    if (confirm('Hapus tautan bukti ini?')) {
      handleMetaChange('evidence', '');
    }
  };

  const handleSiteDataChange = (site: string, value: number | null, subField?: string) => { 
    setIsSaved(false); 
    setPerfData(prev => {
      const currentSites = prev[activeTopicId]?.[selectedYear]?.sites || {};
      let newSiteData;
      if (subField) { newSiteData = { ...(currentSites[site] || {}), [subField]: value }; } else { newSiteData = value; }
      return { ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), [selectedYear]: { ...(prev[activeTopicId]?.[selectedYear] || {}), sites: { ...currentSites, [site]: newSiteData } } } };
    }); 
  };

  const handleTcfdChange = (field: string, value: any) => {
    setIsSaved(false);
    setPerfData(prev => ({
      ...prev,
      [activeTopicId]: {
        ...(prev[activeTopicId] || {}),
        [selectedYear]: {
          ...(prev[activeTopicId]?.[selectedYear] || {}),
          tcfdData: {
            ...(prev[activeTopicId]?.[selectedYear]?.tcfdData || {}),
            [field]: value
          }
        }
      }
    }));
  };

  const currentTopic = activeDisclosures.find((d) => d.id === activeTopicId) || activeDisclosures[0];
  const details = getGriDetails(currentTopic?.disclosure_code || '');
  const currentMgmt = managementData[activeTopicId] || { policy: '', actions: '' };
  const currentPerf = perfData[activeTopicId]?.[selectedYear] || { sites: {}, narrativeValue: '', target: '', evidence: '', bestPractice: '', intensityData: { denominator: '', intensityUnit: '' }, tcfdData: {} };

  const breakdownItems = perfData[activeTopicId]?.[0]?.breakdownItems || details.defaultItems || [];

  const handleAddBreakdownItem = () => {
    if (!newItemName.trim()) return;
    const newItem = { id: 'item_' + Date.now(), name: newItemName.trim(), category: newItemCategory };
    setPerfData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), 0: { ...(prev[activeTopicId]?.[0] || {}), breakdownItems: [...breakdownItems, newItem] } } }));
    setNewItemName(''); setShowAddItemModal(false);
  };
  const handleRemoveBreakdownItem = (itemId: string) => {
    if (!confirm('Hapus rincian ini? Data yang sudah diinput akan hilang.')) return;
    setPerfData(prev => ({ ...prev, [activeTopicId]: { ...(prev[activeTopicId] || {}), 0: { ...(prev[activeTopicId]?.[0] || {}), breakdownItems: breakdownItems.filter((i: any) => i.id !== itemId) } } }));
  };

  const getTotalForTopicCode = (code: string, year: number) => {
    const topicId = disclosures.find(d => d.disclosure_code === code)?.id;
    if (!topicId) return 0;
    const perf = perfData[topicId]?.[year];
    if (!perf || !perf.sites) return 0;
    let sum = 0;
    sites.forEach(site => {
      const v = perf.sites[site];
      if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach((subV: any) => { if (subV !== null && subV !== '' && !isNaN(Number(subV))) sum += Number(subV); });
      } else if (v !== null && v !== '' && v !== undefined && !isNaN(Number(v))) {
        sum += Number(v);
      }
    });
    return sum;
  };

  let autoNumerator = 0; let linkedSourceLabel = '';
  if (currentTopic?.disclosure_code === '305-4') { autoNumerator = getTotalForTopicCode('305-1', selectedYear) + getTotalForTopicCode('305-2', selectedYear); linkedSourceLabel = '🔗 Ditarik dari Total GRI 305-1 (Cak 1) + 305-2 (Cak 2)'; } else if (currentTopic?.disclosure_code === '302-3') { autoNumerator = getTotalForTopicCode('302-1', selectedYear); linkedSourceLabel = '🔗 Ditarik dari Total Konsumsi Energi (GRI 302-1)'; }

  const getNumericTotal = () => {
    if (!details.isNumeric) return 0;
    let sum = 0; let count = 0;
    sites.forEach(site => {
      const v = currentPerf.sites?.[site];
      if (typeof v === 'object' && v !== null) {
        Object.values(v).forEach((subV: any) => { if (subV !== null && subV !== '' && !isNaN(Number(subV))) { sum += Number(subV); count++; } });
      } else if (v !== null && v !== '' && v !== undefined && !isNaN(Number(v))) {
        sum += Number(v); count++;
      }
    });
    return details.aggType === 'average' && count > 0 ? (sum / count) : sum;
  };

  const numericTotal = getNumericTotal();
  const getConsolidatedFormattedTotal = () => {
    if (numericTotal === 0 && sites.every(s => !currentPerf.sites?.[s])) return '0.00';
    return numericTotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  let calculatedIntensity = 0;
  if (details.type === 'intensity' && parseFloat(currentPerf.intensityData?.denominator) > 0 && autoNumerator > 0) { calculatedIntensity = autoNumerator / parseFloat(currentPerf.intensityData.denominator); }

  const handleExportCSV = (mode: 'single' | 'all') => {
    setShowExportMenu(false);
    const topicsToExport = mode === 'all' ? activeDisclosures : [currentTopic].filter(Boolean) as GriDisclosure[];
    if (topicsToExport.length === 0) return;

    let csv = `Laporan Kinerja Keberlanjutan - ${mode === 'all' ? 'Seluruh Topik Fase 3' : currentTopic?.disclosure_code}\n`;
    csv += `Tahun Pelaporan,${selectedYear}\n\n`;
    
    topicsToExport.forEach(topic => {
      const tDetails = getGriDetails(topic.disclosure_code);
      const tMgmt = managementData[topic.id] || { policy: '', actions: '' };
      const tPerf = perfData[topic.id]?.[selectedYear] || {};

      let tNumerator = 0;
      if (topic.disclosure_code === '305-4') tNumerator = getTotalForTopicCode('305-1', selectedYear) + getTotalForTopicCode('305-2', selectedYear);
      else if (topic.disclosure_code === '302-3') tNumerator = getTotalForTopicCode('302-1', selectedYear);

      let tSum = 0; let tCount = 0;
      sites.forEach(site => {
        const v = tPerf.sites?.[site];
        if (typeof v === 'object' && v !== null) {
          Object.values(v).forEach((subV: any) => { if (subV !== null && subV !== '' && !isNaN(Number(subV))) { tSum += Number(subV); tCount++; } });
        } else if (v !== null && v !== '' && v !== undefined && !isNaN(Number(v))) { tSum += Number(v); tCount++; }
      });
      const tTotalNum = tDetails.aggType === 'average' && tCount > 0 ? (tSum / tCount) : tSum;

      csv += `--------------------------------------------------\n`;
      csv += `KODE STANDAR,${topic.disclosure_code}\n`;
      csv += `JUDUL PENGUNGKAPAN,${sanitizeCSV(topic.title_id || topic.title_en)}\n`;
      csv += `--------------------------------------------------\n`;
      csv += `Pendekatan Manajemen,${sanitizeCSV(tMgmt.policy || '-')}\n`;
      csv += `Target Internal,${sanitizeCSV(tPerf.target || '-')}\n`;
      csv += `Tautan Bukti,${sanitizeCSV(tPerf.evidence || '-')}\n`;
      csv += `Sorotan Program / Best Practice,${sanitizeCSV(tPerf.bestPractice || '-')}\n\n`;

      if (tDetails.type === 'narrative') {
        csv += `Uraian Kualitatif,${sanitizeCSV(tPerf.narrativeValue || '-')}\n\n`;
      } 
      else if (tDetails.type === 'tcfd_strategy') {
        csv += `HASIL UJI STRES RISIKO IKLIM (CRST)\n`;
        csv += `Skenario Transisi Utama,${sanitizeCSV(tPerf.tcfdData?.transitionScenario || '-')}\n`;
        csv += `Skenario Fisik Utama,${sanitizeCSV(tPerf.tcfdData?.physicalScenario || '-')}\n`;
        csv += `Estimasi Kenaikan Maks. PD (%),${sanitizeCSV(tPerf.tcfdData?.pdImpact || '-')}\n`;
        csv += `Estimasi Penurunan CAR (%),${sanitizeCSV(tPerf.tcfdData?.carImpact || '-')}\n\n`;
      }
      else if (tDetails.type === 'tcfd_metrics') {
        csv += `METRIK DAN TARGET RISIKO IKLIM\n`;
        csv += `Target Penurunan Financed Emissions (%),${sanitizeCSV(tPerf.tcfdData?.feTarget || '-')}\n`;
        csv += `Tahun Pencapaian Target,${sanitizeCSV(tPerf.tcfdData?.targetYear || '-')}\n`;
        csv += `Metodologi Penetapan Target,${sanitizeCSV(tPerf.tcfdData?.methodology || '-')}\n`;
        csv += `Harga Karbon Internal (Rp/tCO2e),${sanitizeCSV(tPerf.tcfdData?.icp || '-')}\n\n`;
      }
      else if (tDetails.type === 'intensity') {
        let tInt = 0;
        if (parseFloat(tPerf.intensityData?.denominator) > 0 && tNumerator > 0) tInt = tNumerator / parseFloat(tPerf.intensityData.denominator);
        csv += `Total Absolut (Pembilang),${tNumerator}\n`;
        csv += `Faktor Normalisasi (Penyebut),${sanitizeCSV(tPerf.intensityData?.denominator || 0)}\n`;
        csv += `Satuan Normalisasi,${sanitizeCSV(tPerf.intensityData?.intensityUnit || '-')}\n`;
        csv += `Hasil Rasio Intensitas,${tInt}\n\n`;
      } 
      else if (tDetails.type === 'breakdown') {
        csv += `Kategori,Lokasi / Site,Rincian / Sumber,Nilai (${tDetails.unit})\n`;
        const bItems = perfData[topic.id]?.[0]?.breakdownItems || tDetails.defaultItems || [];
        tDetails.categories?.forEach(cat => {
          const items = bItems.filter((i: any) => i.category === cat);
          items.forEach((item: any) => {
            sites.forEach(site => {
              const val = tPerf.sites?.[site]?.[item.id] || 0;
              csv += `"${cat}","${site}","${item.name}",${val}\n`;
            });
          });
        });
        csv += `Total Akumulasi Keseluruhan,,,${tTotalNum}\n\n`;
      } 
      else if (tDetails.type === 'absolute') {
        csv += `Lokasi / Site,Nilai (${tDetails.unit})\n`;
        sites.forEach(site => {
          const val = tPerf.sites?.[site] || 0;
          csv += `"${site}",${val}\n`;
        });
        csv += `Total Keseluruhan,${tTotalNum}\n\n`;
      }
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Fase3_${mode === 'all' ? 'Semua' : currentTopic?.disclosure_code}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = (mode: 'single' | 'all') => {
    setShowExportMenu(false);
    if (mode === 'single') window.print();
    else alert("Informasi:\n\nUntuk mencetak laporan PDF yang memuat SELURUH topik sekaligus dengan rapi, silakan gunakan tombol 'Cetak Full PDF' di menu Fase 4 (Review & Validasi).");
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 flex overflow-hidden h-[calc(100vh-160px)] min-h-[600px] relative print:border-none print:shadow-none print:h-auto">
      
      {showAddSiteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">Tambah Lokasi Site Baru</h3>
            <input type="text" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} placeholder="Contoh: Kantor Cabang Bali" className="w-full p-3 text-xs border border-slate-300 rounded-xl mb-5 outline-none focus:border-emerald-500" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddSiteModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Batal</button>
              <button onClick={handleAddSite} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg">Simpan Site</button>
            </div>
          </div>
        </div>
      )}

      {showAddItemModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-slate-800 mb-1">Tambah Kategori {newItemCategory}</h3>
            <p className="text-[10px] text-slate-500 mb-4">Tambahkan rincian baru.</p>
            <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ketik di sini..." className="w-full p-3 text-xs border border-slate-300 rounded-xl mb-5" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddItemModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg">Batal</button>
              <button onClick={handleAddBreakdownItem} className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL AUDIT TRAIL (JEJAK RIWAYAT) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Jejak Rekam Audit (Audit Trail)</h3>
                <p className="text-[10px] text-slate-500">Riwayat perubahan data untuk {currentTopic?.disclosure_code}</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-red-500 text-lg">✕</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {mockAuditLogs[activeTopicId] && mockAuditLogs[activeTopicId].length > 0 ? (
                mockAuditLogs[activeTopicId].map((log) => (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-4 relative">
                    <div className="bg-emerald-100 text-emerald-600 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-emerald-200">
                      <span className="text-xs">💾</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 font-medium">{log.details}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Oleh: <strong className="text-slate-700">{log.actor}</strong></p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-400 text-xs italic bg-white rounded-xl border border-dashed border-slate-300">
                  Belum ada rekaman jejak audit untuk indikator ini.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col print:hidden">
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-3">
          <h3 className="font-bold text-slate-800 text-sm">Daftar Indikator</h3>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari kode atau nama..." className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-slate-50 outline-none" />
          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px] font-bold mt-2">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'UNIVERSAL', label: 'GRI 2' },
              { id: 'TOPIC', label: 'Topik Material' }
            ].map(cat => (
              <button 
                key={cat.id} 
                onClick={() => handleTabChange(cat.id as any)} 
                className={`px-2 py-1.5 rounded-md transition whitespace-nowrap ${categoryFilter === cat.id ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-1.5">
          {filteredDisclosures.map((d) => {
            const isTcfd = d.disclosure_code.startsWith('IFRS');
            return (
              <button key={d.id} onClick={() => setActiveTopicId(d.id)} className={`w-full text-left p-3 rounded-xl text-xs flex flex-col justify-between transition ${activeTopicId === d.id ? (isTcfd ? 'bg-blue-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md') : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50'}`}>
                <div className="flex justify-between items-center w-full mb-1"><span className="font-mono font-bold">{d.disclosure_code}</span></div>
                <p className="text-[11px] line-clamp-1 opacity-90">{d.title_id || d.title_en}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="w-2/3 flex flex-col relative bg-slate-50/50 print:w-full print:bg-white">
        
        <div className="p-6 border-b border-slate-200 bg-slate-900 text-white shadow-md print:bg-white print:text-black print:border-b-2 print:border-slate-800 print:shadow-none">
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider print:border print:px-2 print:py-0.5 ${currentTopic?.disclosure_code.startsWith('IFRS') ? 'text-blue-400 print:text-blue-700 print:border-blue-700' : 'text-emerald-400 print:text-emerald-700 print:border-emerald-700'}`}>{currentTopic?.disclosure_code}</span>
              <h2 className="text-xl font-bold mt-1 mb-2 leading-tight">{currentTopic?.title_id || currentTopic?.title_en}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2 print:hidden">
                {getCrossReference(currentTopic?.disclosure_code).map(ref => (
                  <span key={ref} className="bg-slate-800 text-emerald-300 text-[9px] font-bold px-2 py-0.5 rounded border border-slate-700">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="relative print:hidden">
              <button onClick={() => setShowExportMenu(!showExportMenu)} className={`${currentTopic?.disclosure_code.startsWith('IFRS') ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 transition`}>
                Unduh / Cetak ▾
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden divide-y divide-slate-100">
                  <div className="p-2 bg-slate-50"><span className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-2">Ekspor Excel (CSV)</span></div>
                  <button onClick={() => handleExportCSV('single')} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 transition">📊 Ekspor Topik Ini Saja</button>
                  <button onClick={() => handleExportCSV('all')} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-emerald-50 transition">📑 Ekspor SEMUA Topik (Fase 3)</button>
                  <div className="p-2 bg-slate-50"><span className="text-[10px] font-black text-slate-500 uppercase tracking-wider pl-2">Cetak PDF</span></div>
                  <button onClick={() => handlePrintPDF('single')} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-blue-50 transition">🖨️ Cetak Layar Saat Ini</button>
                  <button onClick={() => handlePrintPDF('all')} className="w-full text-left px-4 py-3 text-xs font-medium text-slate-700 hover:bg-blue-50 transition">📄 Cetak SEMUA Topik Laporan</button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-800/50 p-3 rounded-lg border border-slate-700 mt-3 print:bg-transparent print:border-none print:text-slate-700 print:p-0">{details.description}</p>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 print:p-0 print:mt-6 print:overflow-visible">

          <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden print:shadow-none ${currentTopic?.disclosure_code.startsWith('IFRS') ? 'hidden' : 'block'}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 print:hidden"></div>
            <h3 className="text-xs font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Pendekatan Manajemen (GRI 3-3)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dasar Kebijakan</label>
                <SafeTextArea 
                  rows={2} 
                  value={currentMgmt.policy} 
                  onChange={(val: string) => handleManagementChange('policy', val)} 
                  placeholder={getPolicyPlaceholder(currentTopic?.disclosure_code)} 
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent print:resize-none" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden print:shadow-none">
            <div className={`absolute top-0 left-0 w-1 h-full print:hidden ${currentTopic?.disclosure_code.startsWith('IFRS') ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
            
            <div className="border-b border-slate-100 pb-3 mb-4 flex flex-col md:flex-row justify-between md:items-end gap-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800">
                  {details.type === 'tcfd_strategy' ? 'Hasil Uji Stres Risiko Iklim (CRST)' : details.type === 'tcfd_metrics' ? 'Metrik dan Target Risiko Iklim' : details.type === 'intensity' ? 'Kalkulasi Data Intensitas' : details.type === 'breakdown' ? 'Rincian Kategori Data' : 'Data Kinerja Absolut'}
                </h3>
                {details.type !== 'intensity' && !currentTopic?.disclosure_code.startsWith('IFRS') && <span className="text-[10px] text-slate-500">Satuan: <strong className="text-emerald-700">{details.unit}</strong></span>}
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                {details.type !== 'intensity' && !currentTopic?.disclosure_code.startsWith('IFRS') && (
                  <button onClick={() => setShowAddSiteModal(true)} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition shadow-sm">+ Tambah Lokasi (Site)</button>
                )}
                
                <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                  {years.map((year) => {
                    const isSelected = selectedYear === year;
                    const isMainReportingYear = year === reportingYear;
                    return (
                      <button key={year} onClick={() => setSelectedYear(year)} className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 ${isSelected ? (currentTopic?.disclosure_code.startsWith('IFRS') ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-500'}`}>
                        {year}
                        {isMainReportingYear && <span className="text-[9px] text-emerald-600 font-extrabold ml-0.5" title="Tahun Utama Laporan">★</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className={`hidden print:block text-sm font-bold ${currentTopic?.disclosure_code.startsWith('IFRS') ? 'text-blue-700' : 'text-emerald-700'}`}>Tahun Pelaporan: {selectedYear}</div>
            </div>

            {details.type === 'tcfd_strategy' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Skenario Transisi Utama</label>
                    <select value={currentPerf.tcfdData?.transitionScenario || ''} onChange={(e) => handleTcfdChange('transitionScenario', e.target.value)} className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent print:appearance-none">
                      <option value="">-- Pilih Skenario Transisi (NGFS) --</option>
                      <option value="NGFS Current Policies">NGFS Current Policies (Kebijakan Saat Ini)</option>
                      <option value="NGFS Delayed Transition">NGFS Delayed Transition (Transisi Tertunda)</option>
                      <option value="NGFS Net Zero 2050">NGFS Net Zero 2050 (Transisi Ambisius)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Skenario Fisik Utama</label>
                    <select value={currentPerf.tcfdData?.physicalScenario || ''} onChange={(e) => handleTcfdChange('physicalScenario', e.target.value)} className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent print:appearance-none">
                      <option value="">-- Pilih Skenario Fisik (IPCC) --</option>
                      <option value="IPCC RCP 2.6 (Ambisius)">IPCC RCP 2.6 (Mitigasi Tinggi)</option>
                      <option value="IPCC RCP 4.5 (Moderat)">IPCC RCP 4.5 (Pengaharapan Menengah)</option>
                      <option value="IPCC RCP 8.5 (Ekstrem)">IPCC RCP 8.5 (Risiko Cuaca Ekstrem Terburuk)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 print:border-slate-300">
                  <div className="bg-red-50 p-4 rounded-xl border border-red-100 print:bg-white print:border-slate-300">
                    <label className="block text-[10px] font-bold text-red-800 uppercase tracking-wider mb-2">Estimasi Peningkatan Gagal Bayar (PD)</label>
                    <div className="flex items-center gap-2">
                      <SafeNumericInput placeholder="Contoh: 2.13" value={currentPerf.tcfdData?.pdImpact} onChange={(val: any) => handleTcfdChange('pdImpact', val)} className="w-full p-3 text-2xl font-black font-mono text-red-900 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 print:border-none print:bg-transparent" />
                      <span className="text-lg font-bold text-red-700">%</span>
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 print:bg-white print:border-slate-300">
                    <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-2">Estimasi Penurunan Ketahanan Modal (CAR)</label>
                    <div className="flex items-center gap-2">
                      <SafeNumericInput placeholder="Contoh: 1.29" value={currentPerf.tcfdData?.carImpact} onChange={(val: any) => handleTcfdChange('carImpact', val)} className="w-full p-3 text-2xl font-black font-mono text-orange-900 border border-orange-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 print:border-none print:bg-transparent" />
                      <span className="text-lg font-bold text-orange-700">%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {details.type === 'tcfd_metrics' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Target Penurunan Financed Emissions</label>
                    <div className="flex items-center gap-2">
                      <SafeNumericInput placeholder="Cth: 42" value={currentPerf.tcfdData?.feTarget} onChange={(val: any) => handleTcfdChange('feTarget', val)} className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent" />
                      <span className="text-xs font-bold text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Tahun Pencapaian Target</label>
                      <SafeNumericInput placeholder="Cth: 2030" value={currentPerf.tcfdData?.targetYear} onChange={(val: any) => handleTcfdChange('targetYear', val)} className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-2">Metodologi (SBTi)</label>
                      <select value={currentPerf.tcfdData?.methodology || ''} onChange={(e) => handleTcfdChange('methodology', e.target.value)} className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent print:appearance-none">
                        <option value="">-- Pilih --</option>
                        <option value="SDA">SDA (Sectoral Decarbonization)</option>
                        <option value="TRA">TRA (Temperature Rating)</option>
                        <option value="SDA & TRA">Kombinasi Keduanya</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 print:border-slate-300">
                  <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 flex flex-col md:flex-row items-center gap-6 print:bg-white print:border-slate-300">
                    <div className="w-full md:w-1/2">
                      <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Penetapan Harga Karbon Internal (Internal Carbon Pricing)</label>
                      <p className="text-[10px] text-blue-600 mb-2 print:text-slate-600">Digunakan sebagai bayangan harga (shadow price) untuk evaluasi investasi.</p>
                    </div>
                    <div className="w-full md:w-1/2 flex items-center gap-3">
                      <span className="text-lg font-bold text-blue-800">Rp</span>
                      <SafeNumericInput placeholder="Contoh: 1406023" value={currentPerf.tcfdData?.icp} onChange={(val: any) => handleTcfdChange('icp', val)} className="w-full p-3 text-2xl font-black font-mono text-blue-900 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 print:border-none print:bg-transparent" />
                      <span className="text-xs font-bold text-blue-700">/ tCO2e</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {details.type === 'intensity' && (
              <div className="border-2 border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 overflow-hidden shadow-sm print:border-slate-300 print:bg-white print:shadow-none">
                <div className="bg-purple-800 p-3 print:bg-slate-100 print:text-black print:border-b"><h4 className="text-xs font-bold text-white print:text-slate-800 flex items-center gap-2"><span>⚡</span> Kalkulator Intensitas ({selectedYear})</h4></div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-purple-900 mb-1 print:text-black">1. Total Nilai Absolut (Pembilang)</label>
                    <p className="text-[10px] text-purple-600 font-semibold mb-2 print:text-slate-500">{linkedSourceLabel}</p>
                    <div className="flex items-center gap-2">
                      <input type="text" readOnly value={autoNumerator.toLocaleString('id-ID', { maximumFractionDigits: 2 })} className="w-full p-2.5 text-xs font-mono border border-purple-200 bg-purple-100 text-purple-900 font-bold rounded-xl cursor-not-allowed outline-none print:border-none print:bg-transparent" />
                      <span className="text-xs font-bold text-purple-800 print:text-black">{currentTopic?.disclosure_code === '305-4' ? 'tCO2e' : 'GJ'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-purple-200 print:border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1.5 print:text-black">2. Faktor Normalisasi (Penyebut)</label>
                      <SafeNumericInput value={currentPerf.intensityData?.denominator} onChange={(val: any) => handleIntensityDataChange('denominator', val)} className="w-full p-2.5 text-xs border border-purple-300 rounded-xl outline-none print:border-none print:bg-transparent" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-purple-900 mb-1.5 print:text-black">3. Satuan Normalisasi</label>
                      <select value={currentPerf.intensityData?.intensityUnit || ''} onChange={(e) => handleIntensityDataChange('intensityUnit', e.target.value)} className="w-full p-2.5 text-xs border border-purple-300 rounded-xl bg-white outline-none print:border-none print:appearance-none print:bg-transparent">
                        <option value="">-- Pilih Satuan --</option>
                        {INTENSITY_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-white border-2 border-purple-200 p-4 rounded-xl flex items-center justify-between shadow-sm mt-4 print:border-slate-300 print:shadow-none">
                    <div><span className="block text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 print:text-slate-600">Hasil Rasio Intensitas</span></div>
                    <span className="font-mono text-lg font-black text-purple-800 print:text-black">
                      {calculatedIntensity > 0 ? calculatedIntensity.toLocaleString('id-ID', { maximumFractionDigits: 4 }) : '0.0000'}
                      <span className="text-xs font-sans text-purple-500 ml-1.5 block md:inline-block print:text-slate-500">{currentTopic?.disclosure_code === '305-4' ? 'tCO2e' : 'GJ'} / {currentPerf.intensityData?.intensityUnit?.split(' ')[0] || 'Unit'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {details.type === 'breakdown' && details.categories && (
              <div className="space-y-6">
                {details.categories.map(cat => {
                  const itemsInCat = breakdownItems.filter((i: any) => i.category === cat);
                  const catSiteTotals: Record<string, number> = {};
                  sites.forEach(site => { catSiteTotals[site] = itemsInCat.reduce((sum: number, item: any) => sum + Number(currentPerf.sites?.[site]?.[item.id] || 0), 0); });
                  const catGrandTotal = Object.values(catSiteTotals).reduce((sum, val) => sum + val, 0);

                  return (
                    <div key={cat} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm print:break-inside-avoid print:shadow-none">
                      <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center print:bg-white">
                        <h4 className="font-bold text-slate-800 text-xs uppercase">{cat}</h4>
                        <button onClick={() => { setNewItemCategory(cat); setShowAddItemModal(true); }} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition shadow-sm print:hidden">+ Tambah Rincian</button>
                      </div>
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/50 text-slate-600 border-b border-slate-200 print:bg-slate-50">
                            <tr>
                              <th className="p-2.5 font-bold min-w-[150px] align-middle">Rincian Data</th>
                              {sites.map(site => (
                                <th key={site} className="p-2.5 font-bold text-center border-l border-slate-200 align-middle min-w-[120px]">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span>{site}</span>
                                    {sites.length > 1 && <button onClick={() => handleRemoveSite(site)} className="text-[10px] text-slate-400 hover:text-red-500 transition print:hidden" title="Hapus Lokasi Ini">✕</button>}
                                  </div>
                                </th>
                              ))}
                              <th className="p-2.5 font-bold text-center border-l border-slate-200 bg-slate-50 align-middle print:bg-transparent">Sub-Total</th>
                              <th className="p-2.5 font-bold text-center border-l border-slate-200 w-10 align-middle print:hidden">🗑️</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {itemsInCat.map((item: any) => {
                              const itemTotal = sites.reduce((sum, site) => sum + Number(currentPerf.sites?.[site]?.[item.id] || 0), 0);
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 font-medium text-slate-700">{item.name}</td>
                                  {sites.map(site => (
                                    <td key={site} className="p-2 border-l border-slate-100 relative">
                                      <SafeNumericInput value={currentPerf.sites?.[site]?.[item.id]} onChange={(val: any) => handleSiteDataChange(site, val, item.id)} className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg text-center outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent" />
                                    </td>
                                  ))}
                                  <td className="p-2 border-l border-slate-100 bg-slate-50 text-center font-mono font-bold text-emerald-800 print:bg-transparent print:text-black">{itemTotal > 0 ? itemTotal.toLocaleString('id-ID') : '-'}</td>
                                  <td className="p-2 border-l border-slate-100 text-center print:hidden"><button onClick={() => handleRemoveBreakdownItem(item.id)} className="text-slate-400 hover:text-red-500">✕</button></td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-slate-50 border-t-2 border-slate-200 print:bg-white print:border-black">
                              <td className="p-2.5 font-bold text-slate-800 text-right">Total Kategori Ini:</td>
                              {sites.map(site => <td key={site} className="p-2.5 text-center font-mono font-bold text-slate-800 border-l border-slate-200">{catSiteTotals[site] > 0 ? catSiteTotals[site].toLocaleString('id-ID') : '-'}</td>)}
                              <td className="p-2.5 text-center font-mono font-bold text-emerald-700 border-l border-slate-200 bg-emerald-100/50 print:bg-transparent print:text-black">{catGrandTotal > 0 ? catGrandTotal.toLocaleString('id-ID') : '-'}</td>
                              <td className="border-l border-slate-200 bg-slate-50 print:hidden"></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )
                })}
                <div className="bg-emerald-600 text-white rounded-xl p-4 flex justify-between items-center shadow-md print:bg-slate-100 print:text-black print:border print:border-black print:shadow-none">
                  <div><span className="block text-[10px] uppercase font-bold text-emerald-200 print:text-slate-600">Total Akumulasi Keseluruhan</span><span className="text-sm font-medium">({selectedYear})</span></div>
                  <div className="text-right flex items-baseline gap-2"><span className="text-2xl font-mono font-black">{getConsolidatedFormattedTotal()}</span><span className="text-xs font-sans text-emerald-200 print:text-slate-600">{details.unit}</span></div>
                </div>
              </div>
            )}

            {details.type === 'absolute' && (
              <div className="space-y-6">
                <div className="border border-slate-200 rounded-xl overflow-hidden print:shadow-none">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 print:bg-white print:border-black">
                      <tr>
                        <th className="p-2.5 font-bold w-1/3">Lokasi / Site</th>
                        <th className="p-2.5 font-bold">Nilai Absolut ({selectedYear})</th>
                        <th className="p-2.5 font-bold text-center w-16 print:hidden">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sites.map(site => (
                        <tr key={site} className="hover:bg-slate-50/50">
                          <td className="p-2.5 text-xs font-medium text-slate-700">{site}</td>
                          <td className="p-2 relative"><SafeNumericInput value={currentPerf.sites?.[site]} onChange={(val: any) => handleSiteDataChange(site, val)} className="w-full p-2 text-xs font-mono border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent" /></td>
                          <td className="p-2 text-center print:hidden">{sites.length > 1 && <button onClick={() => handleRemoveSite(site)} className="text-slate-400 hover:text-red-500 text-xs" title="Hapus Lokasi Ini">✕</button>}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="bg-emerald-50/50 border-t-2 border-emerald-100 text-xs print:bg-slate-100 print:border-black"><td className="p-2.5 font-bold text-emerald-900 text-right print:text-black">Total Keseluruhan:</td><td colSpan={2} className="p-2.5 font-bold font-mono text-emerald-700 text-sm print:text-black">{getConsolidatedFormattedTotal()}</td></tr></tfoot>
                  </table>
                </div>
              </div>
            )}

            {details.type === 'narrative' && (
              <SafeTextArea 
                rows={4} 
                value={currentPerf.narrativeValue} 
                onChange={handleNarrativePerfChange} 
                placeholder={getNarrativePlaceholder(currentTopic?.disclosure_code)} 
                className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent print:resize-none" 
              />
            )}
            
            {!currentTopic?.disclosure_code.startsWith('IFRS') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100 mt-6 print:border-black">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Internal ({selectedYear})</label>
                  <SafeTextInput 
                    value={currentPerf.target} 
                    onChange={(val: string) => handleMetaChange('target', val)} 
                    placeholder={getTargetPlaceholder(currentTopic?.disclosure_code)}
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 print:border-none print:bg-transparent" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tautan / File Bukti (Evidence)</label>
                  <div className="flex items-center gap-2">
                    <label className={`cursor-pointer border px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${isUploading ? 'bg-slate-200 text-slate-400 border-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 print:hidden'}`}>
                      {isUploading ? '⏳ Uploading...' : '📁 Unggah File'}
                      <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} disabled={isUploading} />
                    </label>
                    <SafeTextInput 
                      value={currentPerf.evidence} 
                      onChange={(val: string) => handleMetaChange('evidence', val)} 
                      placeholder="Atau paste URL..."
                      className="flex-1 p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 print:border-none print:bg-transparent" 
                    />
                  </div>
                  {currentPerf.evidence && (
                     <div className="mt-2 text-[10px] text-emerald-700 flex items-center justify-between bg-emerald-50 p-1.5 px-3 rounded-lg border border-emerald-200 print:border-none print:bg-transparent">
                        <div className="flex items-center gap-2">
                          <span>✅</span>
                          <a href={currentPerf.evidence} target="_blank" rel="noreferrer" className="hover:underline font-bold truncate max-w-[150px] md:max-w-[250px]">Bukti Terlampir</a>
                        </div>
                        <button onClick={handleRemoveEvidence} className="text-red-500 hover:text-red-700 font-bold px-2 print:hidden" title="Hapus File/Link">✕</button>
                     </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-slate-100 mt-6 print:border-black">
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                <span>🌟</span> Sorotan Program & Best Practice ({selectedYear}) <span className="text-[9px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-2 print:border print:border-slate-300">Opsional</span>
              </label>
              <p className="text-[10px] text-slate-500 mb-2">Ceritakan kisah sukses, inovasi, atau inisiatif unggulan yang telah dijalankan perusahaan terkait topik ini.</p>
              <SafeTextArea 
                rows={3} 
                value={currentPerf.bestPractice} 
                onChange={(val: string) => handleMetaChange('bestPractice', val)} 
                placeholder={getBestPracticePlaceholder(currentTopic?.disclosure_code || '')}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent print:resize-none" 
              />
            </div>

          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center px-6 print:hidden">
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTopicId(activeDisclosures[Math.max(0, activeDisclosures.findIndex(d => d.id === activeTopicId) - 1)].id)} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">← Prev</button>
            <button onClick={() => setActiveTopicId(activeDisclosures[Math.min(activeDisclosures.length - 1, activeDisclosures.findIndex(d => d.id === activeTopicId) + 1)].id)} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition">Next →</button>
          </div>
          
          <div className="flex items-center gap-3">
            {isSaved && <span className="text-xs text-emerald-600 font-bold animate-pulse">✓ Tersimpan ke Memori!</span>}
            
            {/* 🌟 TOMBOL HISTORI AUDIT TRAIL */}
            <button 
              onClick={() => setShowAuditModal(true)} 
              className="text-slate-500 hover:text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition flex items-center gap-1.5"
            >
              <span>🕒</span> Riwayat
            </button>

            <button 
              onClick={handleSaveTopic} 
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl shadow transition flex items-center gap-1.5"
            >
              <span>💾</span> Simpan Data ({selectedYear})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}