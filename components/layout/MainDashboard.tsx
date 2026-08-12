"use client";

import { useState, useEffect, useMemo } from 'react';
import { GriDisclosure } from '@/types/database';
import { supabase } from '@/lib/supabase/client';
import { AuthScreen } from '@/components/auth/AuthScreen';

import { MaterialitySelector } from '@/components/materiality/MaterialitySelector';
import { MaterialityMatrix } from '@/components/materiality/MaterialityMatrix';
import { PerformanceForm } from '@/components/data-entry/PerformanceForm';
import { ReviewDashboard } from '@/components/review/ReviewDashboard';

interface MainDashboardProps {
  disclosures: GriDisclosure[];
}

const COMPANY_SITES = ['Kantor Pusat (HQ)', 'Fasilitas Operasi / Pabrik A', 'Fasilitas Operasi / Pabrik B'];

const TCFD_DISCLOSURES: GriDisclosure[] = [
  { id: 'tcfd-1', disclosure_code: 'IFRS-S2-1', title_id: 'Tata Kelola & Strategi Risiko Iklim (Uji Stres/CRST)', title_en: 'Climate Risk Strategy', gri_type: 'topic' } as GriDisclosure,
  { id: 'tcfd-2', disclosure_code: 'IFRS-S2-2', title_id: 'Metrik & Target Risiko Iklim (Harga Karbon & Emisi Dibiayai)', title_en: 'Climate Metrics', gri_type: 'topic' } as GriDisclosure
];

export function MainDashboard({ disclosures }: MainDashboardProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'inputter' | 'reviewer'>('inputter');
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgCode, setOrgCode] = useState<string>(''); 
  const [isApproved, setIsApproved] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'profil' | 'taksonomi' | 'matriks' | 'entri' | 'review'>('profil');
  const [companyName, setCompanyName] = useState('');
  const [reportingYear, setReportingYear] = useState('2025');
  const [selectedSector, setSelectedSector] = useState('');
  const [sites, setSites] = useState<string[]>(COMPANY_SITES);
  const [newSiteName, setNewSiteName] = useState('');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [materialTopicIds, setMaterialTopicIds] = useState<string[]>([]);
  const [managementData, setManagementData] = useState<Record<string, { policy: string, actions: string }>>({});
  const [perfData, setPerfData] = useState<Record<string, Record<number, any>>>({});
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false); // 🛠️ PERBAIKAN: UX Loading button

  const allDisclosures = useMemo(() => {
    const existingIds = new Set(disclosures.map(d => d.id));
    const newTcfd = TCFD_DISCLOSURES.filter(t => !existingIds.has(t.id));
    return [...disclosures, ...newTcfd];
  }, [disclosures]);

  useEffect(() => {
    const checkUserAndLoadOrgData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          setIsApproved(profile.is_approved === true);

          if (profile.role) {
            setUserRole(profile.role);
            if (profile.role === 'reviewer') setActiveTab('review');
          }
          if (profile.company_name) setCompanyName(profile.company_name);
          if (profile.reporting_year) setReportingYear(profile.reporting_year.toString());
          if (profile.sector) setSelectedSector(profile.sector);
          if (profile.sites && Array.isArray(profile.sites)) setSites(profile.sites);
          if (profile.organization_id) {
            setOrgId(profile.organization_id);

            const { data: orgData } = await supabase
              .from('organizations')
              .select('code, name')
              .eq('id', profile.organization_id)
              .single();

            if (orgData) {
              if (orgData.code) setOrgCode(orgData.code);
              // 🛠️ PERBAIKAN: Hanya pakai nama dari organizations jika di profile masih kosong
              if (orgData.name && !profile.company_name) setCompanyName(orgData.name);
            }

            const { data: report } = await supabase
              .from('esg_reports')
              .select('*')
              .eq('organization_id', profile.organization_id)
              .maybeSingle();

            if (report) {
              if (report.selected_topic_ids) setSelectedTopicIds(report.selected_topic_ids);
              if (report.material_topic_ids) setMaterialTopicIds(report.material_topic_ids);
              if (report.management_data) setManagementData(report.management_data);
              if (report.perf_data) setPerfData(report.perf_data);
            }
          }
        }
      }
      setIsLoaded(true);
    };

    checkUserAndLoadOrgData();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        checkUserAndLoadOrgData();
      } else {
        setCurrentUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoaded && currentUser && orgId && userRole === 'inputter' && isApproved) {
      const saveData = async () => {
        await supabase
          .from('profiles')
          .update({
            company_name: companyName,
            reporting_year: parseInt(reportingYear, 10) || 2025,
            sector: selectedSector,
            sites: sites,
            updated_at: new Date()
          })
          .eq('id', currentUser.id);

        // 🛠️ PERBAIKAN: Sinkronkan juga perubahan nama ke tabel organizations saat autosave
        await supabase
          .from('organizations')
          .update({ name: companyName })
          .eq('id', orgId);

        await supabase
          .from('esg_reports')
          .update({
            selected_topic_ids: selectedTopicIds,
            material_topic_ids: materialTopicIds,
            management_data: managementData,
            perf_data: perfData,
            updated_at: new Date()
          })
          .eq('organization_id', orgId);
      };

      const timer = setTimeout(() => saveData(), 1500); // 🛠️ PERBAIKAN: Diperpanjang jadi 1.5 detik agar tidak memberatkan DB
      return () => clearTimeout(timer);
    }
  }, [perfData, managementData, materialTopicIds, selectedTopicIds, sites, companyName, reportingYear, selectedSector, isLoaded, currentUser, orgId, userRole, isApproved]);

  const handleAddSite = () => {
    if (userRole === 'reviewer') return;
    if (!newSiteName.trim() || sites.includes(newSiteName.trim())) return;
    setSites(prev => [...prev, newSiteName.trim()]);
    setNewSiteName('');
  };
  const handleRemoveSite = (site: string) => {
    if (userRole === 'reviewer') return;
    if (sites.length > 1) setSites(prev => prev.filter(s => s !== site));
  };

  // 🛠️ PERBAIKAN: Mengubah jadi async dan melakukan push eksplisit ke Supabase
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'reviewer') {
      setActiveTab('review');
      return;
    }

    setIsSavingManual(true);

    try {
      if (currentUser && orgId) {
        await supabase.from('profiles').update({
          company_name: companyName,
          reporting_year: parseInt(reportingYear, 10) || 2025,
          sector: selectedSector,
          sites: sites,
          updated_at: new Date()
        }).eq('id', currentUser.id);

        await supabase.from('organizations').update({
          name: companyName
        }).eq('id', orgId);
      }

      let preselected: string[] = [...selectedTopicIds];

      if (selectedSector === 'GRI 11: Oil and Gas (Migas)') {
        const migasCodes = ['305', '302', '303', '304', '306', '403']; 
        const migasIds = allDisclosures.filter(d => migasCodes.some(code => d.disclosure_code.startsWith(code))).map(d => d.id);
        preselected = Array.from(new Set([...preselected, ...migasIds, 'tcfd-1', 'tcfd-2']));
      } 
      else if (selectedSector === 'GRI 12: Coal (Batu Bara)') {
        const coalCodes = ['305', '302', '303', '304', '306', '403', '413', '201'];
        const coalIds = allDisclosures.filter(d => coalCodes.some(code => d.disclosure_code.startsWith(code))).map(d => d.id);
        preselected = Array.from(new Set([...preselected, ...coalIds, 'tcfd-1', 'tcfd-2']));
      }
      else if (selectedSector === 'GRI 13: Agriculture, Aquaculture and Fishing') {
        const agriCodes = ['304', '303', '301', '414', '403'];
        const agriIds = allDisclosures.filter(d => agriCodes.some(code => d.disclosure_code.startsWith(code))).map(d => d.id);
        preselected = Array.from(new Set([...preselected, ...agriIds, 'tcfd-1'])); 
      }

      setSelectedTopicIds(preselected);
      setActiveTab('taksonomi');
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const activeYearNum = parseInt(reportingYear, 10) || 2025;

  if (!isLoaded) return <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-emerald-400 font-bold">Menghubungkan ke Supabase Cloud...</div>;
  if (!currentUser) return <AuthScreen />;

  if (!isApproved) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 font-sans px-6 text-center">
        <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200">
          <div className="text-5xl mb-6 animate-pulse">⏳</div>
          <h1 className="text-2xl font-black text-slate-800 mb-3">Menunggu Persetujuan Akses</h1>
          <p className="text-sm text-slate-500 mb-8 leading-relaxed">
            Akun Anda (<strong>{currentUser.email}</strong>) telah terhubung ke <strong>{companyName}</strong>, 
            namun <span className="font-bold text-slate-700">belum diverifikasi</span> oleh Administrator.
            <br/><br/>
            Silakan hubungi Developer/Admin untuk mengaktifkan status *Approval* akun Anda.
          </p>
          <button 
            onClick={handleLogout} 
            className="w-full bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold py-3 rounded-xl transition border border-slate-300 hover:border-red-300 text-xs"
          >
            Keluar dari Akun Ini
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:block print:h-auto print:bg-white print:overflow-visible">
      <aside className="w-72 bg-slate-900 text-white flex flex-col shadow-2xl z-20 print:hidden">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-sm font-bold flex items-center gap-2 leading-snug"><span>🌱</span> Sustainability Report Platform</h1>
          <p className="text-xs text-slate-400 mt-1">GRI & IFRS S2 Standards</p>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 mt-2">Fase 0: Setup</p>
          <button 
            onClick={() => userRole === 'inputter' && setActiveTab('profil')} 
            disabled={userRole === 'reviewer'}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === 'profil' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'} ${userRole === 'reviewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            0. Profil & Sektor {userRole === 'reviewer' && '🔒'}
          </button>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 mt-6">Fase 1 & 2: Persiapan</p>
          <button 
            onClick={() => userRole === 'inputter' && setActiveTab('taksonomi')} 
            disabled={userRole === 'reviewer'}
            className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === 'taksonomi' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'} ${userRole === 'reviewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>1. Taksonomi Awal {userRole === 'reviewer' && '🔒'}</span>
            {selectedTopicIds.length > 0 && <span className="bg-emerald-800 text-white text-[10px] px-2 py-0.5 rounded-full">{selectedTopicIds.length}</span>}
          </button>
          <button 
            onClick={() => userRole === 'inputter' && setActiveTab('matriks')} 
            disabled={userRole === 'reviewer'}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === 'matriks' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'} ${userRole === 'reviewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            2. Matriks Materialitas {userRole === 'reviewer' && '🔒'}
          </button>

          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-2 mt-6">Fase 3 & 4: Pelaksanaan</p>
          <button 
            onClick={() => userRole === 'inputter' && setActiveTab('entri')} 
            disabled={userRole === 'reviewer'}
            className={`w-full flex justify-between items-center px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === 'entri' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'} ${userRole === 'reviewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>3. Entri Data Kinerja {userRole === 'reviewer' && '🔒'}</span>
            {materialTopicIds.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{materialTopicIds.length} Material</span>}
          </button>
          <button onClick={() => setActiveTab('review')} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold transition-all ${activeTab === 'review' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'}`}>4. Review & Validasi</button>
        </nav>

        {orgCode && (
          <div className="mx-4 mb-3 p-3 bg-slate-800 rounded-xl border border-slate-700">
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kode Tim Perusahaan:</span>
            <div className="flex justify-between items-center bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 font-mono text-xs font-black text-emerald-400">
              <span>{orgCode}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(orgCode); alert("Kode Perusahaan disalin!"); }}
                className="text-[10px] text-slate-400 hover:text-white"
                title="Salin Kode"
              >
                📋
              </button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="block text-[11px] font-bold text-white truncate">{currentUser.email}</span>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${userRole === 'inputter' ? 'bg-emerald-900 text-emerald-300' : 'bg-blue-900 text-blue-300'}`}>
                Role: {userRole}
              </span>
            </div>
            <button onClick={handleLogout} className="text-xs bg-slate-800 hover:bg-red-600 text-white px-2.5 py-1.5 rounded-lg transition" title="Keluar">
              🚪
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative print:block print:overflow-visible">
        <header className="bg-white px-8 py-5 shadow-sm z-10 border-b border-slate-200 print:hidden flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'profil' && 'Konfigurasi Profil & Sektor Industri'}
            {activeTab === 'taksonomi' && 'Identifikasi Standar Wajib & Topik Pilihan'}
            {activeTab === 'matriks' && 'Penilaian Matriks Materialitas'}
            {activeTab === 'entri' && 'Pelaporan Pendekatan Manajemen & Data Kinerja'}
            {activeTab === 'review' && 'Pusat Kompilasi & Validasi Data'}
          </h2>
          {companyName && (
            <div className="text-right">
              <span className="block text-xs font-bold text-slate-800">{companyName}</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Tahun Laporan Active: {activeYearNum}</span>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative print:block print:overflow-visible print:p-0">
          <div className="max-w-7xl mx-auto print:max-w-none print:w-full">
            {activeTab === 'profil' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-3xl print:border-none print:shadow-none">
                <div className="mb-8 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-800">Data Dasar Entitas Pelapor</h3>
                  <p className="text-xs text-slate-500 mt-1">Lengkapi informasi ini untuk menyesuaikan rekomendasi topik, siklus tahun pelaporan, dan struktur tabel di fase berikutnya.</p>
                </div>
                <form className="space-y-8" onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Nama Perusahaan / Entitas</label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Contoh: PT ESG Nusantara" className="p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Tahun Utama Pelaporan</label>
                      <input type="number" value={reportingYear} onChange={(e) => setReportingYear(e.target.value)} placeholder="2025" className="p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-700 bg-blue-50/50" required />
                      <span className="text-[10px] text-slate-400 mt-1">Sistem akan menyusun tren data 4 tahun: {activeYearNum-3} s/d {activeYearNum}</span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Klasifikasi Sektor Industri (GRI Sector Standards)</label>
                    <p className="text-[10px] text-slate-500 mb-3">Sistem akan merekomendasikan topik keberlanjutan spesifik secara otomatis di Fase 1 berdasarkan sektor yang Anda pilih di bawah ini.</p>
                    <select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} className="p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium" required>
                      <option value="">-- Pilih Sektor Utama Organisasi --</option>
                      <option value="GRI 11: Oil and Gas (Migas)">GRI 11: Oil and Gas (Minyak & Gas Bumi)</option>
                      <option value="GRI 12: Coal (Batu Bara)">GRI 12: Coal (Pertambangan Batu Bara)</option>
                      <option value="GRI 13: Agriculture, Aquaculture and Fishing">GRI 13: Agriculture, Aquaculture, and Fishing</option>
                      <option value="GRI 14: Mining (Tambang Umum)">GRI 14: Mining (Pertambangan Umum / Mineral)</option>
                      <option value="Lainnya">Sektor Lainnya / Umum (GRI Universal)</option>
                    </select>
                  </div>

                  <div className="flex flex-col border-t border-slate-100 pt-6">
                    <label className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">Lokasi Operasional / Anak Perusahaan</label>
                    <p className="text-[10px] text-slate-500 mb-3">Daftarkan semua pabrik, kantor cabang, atau anak perusahaan yang masuk dalam cakupan laporan. Data ini akan otomatis menjadi template kolom di Fase 3 dan 4.</p>
                    <div className="flex gap-2 mb-4">
                      <input type="text" value={newSiteName} onChange={(e) => setNewSiteName(e.target.value)} placeholder="Ketik nama lokasi..." className="flex-1 p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                      <button type="button" onClick={handleAddSite} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow whitespace-nowrap">+ Tambah</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sites.map(site => (
                        <div key={site} className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
                          {site}
                          {sites.length > 1 && <button type="button" onClick={() => handleRemoveSite(site)} className="text-emerald-600 hover:text-red-500 font-bold transition">✕</button>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    {/* 🛠️ PERBAIKAN: Tombol menampilkan state loading (Menyimpan...) */}
                    <button type="submit" disabled={isSavingManual} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-sm font-bold py-3 px-8 rounded-xl transition shadow flex items-center gap-2 print:hidden">
                      {isSavingManual ? 'Menyimpan...' : 'Simpan & Lanjut ke Taksonomi'} {!isSavingManual && <span className="text-lg">→</span>}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'taksonomi' && <MaterialitySelector disclosures={allDisclosures} selectedTopicIds={selectedTopicIds} setSelectedTopicIds={setSelectedTopicIds} onNext={() => setActiveTab('matriks')} />}
            {activeTab === 'matriks' && <MaterialityMatrix disclosures={allDisclosures} selectedTopicIds={selectedTopicIds} setMaterialTopicIds={setMaterialTopicIds} onNext={() => setActiveTab('entri')} />}
            {activeTab === 'entri' && <PerformanceForm disclosures={allDisclosures} materialTopicIds={materialTopicIds} managementData={managementData} setManagementData={setManagementData} perfData={perfData} setPerfData={setPerfData} sites={sites} setSites={setSites} reportingYear={activeYearNum} />}
            {activeTab === 'review' && <ReviewDashboard disclosures={allDisclosures} perfData={perfData} managementData={managementData} materialTopicIds={materialTopicIds} sites={sites} reportingYear={activeYearNum} />}
          </div>
        </div>
      </main>
    </div>
  );
}