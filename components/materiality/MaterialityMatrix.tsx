"use client";

import { useMemo } from 'react';
import { GriDisclosure } from '@/types/database';

interface MaterialityMatrixProps {
  disclosures: GriDisclosure[];
  selectedTopicIds: string[];
  setMaterialTopicIds: (ids: string[]) => void;
  matrixScores: Record<string, { impact: number, financial: number, justification?: string }>;
  setMatrixScores: React.Dispatch<React.SetStateAction<Record<string, { impact: number, financial: number, justification?: string }>>>;
  onNext: () => void;
}

// 🛡️ KAMUS PEMETAAN ISU PAYUNG (TOPIK STRATEGIS GRI & IFRS)
const TOPIC_GROUPS: Record<string, string> = {
  '201': 'Kinerja Ekonomi',
  '202': 'Kehadiran Pasar',
  '203': 'Dampak Ekonomi Tidak Langsung',
  '204': 'Praktik Pengadaan',
  '205': 'Anti-Korupsi',
  '206': 'Perilaku Anti-Persaingan',
  '207': 'Pajak',
  '301': 'Material',
  '302': 'Energi',
  '303': 'Air dan Efluen',
  '304': 'Keanekaragaman Hayati',
  '305': 'Emisi',
  '306': 'Limbah',
  '308': 'Penilaian Lingkungan Pemasok',
  '401': 'Kepegawaian',
  '402': 'Hubungan Tenaga Kerja/Manajemen',
  '403': 'Kesehatan dan Keselamatan Kerja (K3)',
  '404': 'Pelatihan dan Pendidikan',
  '405': 'Keanekaragaman dan Kesempatan Setara',
  '406': 'Non-Diskriminasi',
  '407': 'Kebebasan Berserikat',
  '408': 'Pekerja Anak',
  '409': 'Kerja Paksa',
  '410': 'Praktik Keamanan',
  '411': 'Hak Masyarakat Adat',
  '413': 'Masyarakat Lokal',
  '414': 'Penilaian Sosial Pemasok',
  '415': 'Kebijakan Publik',
  '416': 'Kesehatan dan Keselamatan Pelanggan',
  '417': 'Pemasaran dan Pelabelan',
  '418': 'Privasi Pelanggan',
  'IFRS-S2': 'Manajemen Risiko Iklim (TCFD)'
};

export function MaterialityMatrix({ disclosures, selectedTopicIds, setMaterialTopicIds, matrixScores, setMatrixScores, onNext }: MaterialityMatrixProps) {
  
  // 🛡️ LOGIKA PENGELOMPOKAN (GROUPING) INDIKATOR MENJADI ISU PAYUNG
  const groupedTopics = useMemo(() => {
    const groups: Record<string, { code: string, name: string, disclosures: GriDisclosure[] }> = {};
    
    disclosures.forEach(d => {
      if (!selectedTopicIds.includes(d.id)) return;
      
      // GRI 2 (Universal) dikecualikan dari Matriks karena merupakan pengungkapan wajib
      if (d.gri_type === 'universal' || d.disclosure_code.startsWith('2-')) return; 
      
      // Mendapatkan prefix (contoh: '302' dari '302-1')
      const prefixMatch = d.disclosure_code.match(/^(IFRS-S2|\d{3})/);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        if (!groups[prefix]) {
          groups[prefix] = {
            code: prefix,
            name: TOPIC_GROUPS[prefix] || `Topik ${prefix}`,
            disclosures: []
          };
        }
        groups[prefix].disclosures.push(d);
      }
    });
    
    return Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
  }, [disclosures, selectedTopicIds]);

  const threshold = 6.0;

  const handleScoreChange = (groupCode: string, axis: 'impact' | 'financial', value: number) => {
    setMatrixScores((prev) => {
      const currentScore = prev[groupCode] || { impact: 5.0, financial: 5.0, justification: '' };
      return { ...prev, [groupCode]: { ...currentScore, [axis]: value } };
    });
  };

  const handleJustificationChange = (groupCode: string, justification: string) => {
    setMatrixScores((prev) => {
      const currentScore = prev[groupCode] || { impact: 5.0, financial: 5.0, justification: '' };
      return { ...prev, [groupCode]: { ...currentScore, justification } };
    });
  };

  // 🛡️ PEWARISAN MATERIALITAS: Jika Isu Payung Material, seluruh indikator anaknya ikut Material
  const handleApprove = () => {
    const materialIds: string[] = [];
    
    groupedTopics.forEach(group => {
      const score = matrixScores[group.code];
      const impactScore = score?.impact ?? 5.0;
      const financialScore = score?.financial ?? 5.0;
      
      if (impactScore >= threshold || financialScore >= threshold) {
        // Mendorong seluruh sub-indikator (contoh: 302-1, 302-2) ke Fase 3
        group.disclosures.forEach(d => materialIds.push(d.id));
      }
    });

    setMaterialTopicIds(materialIds);
    onNext();
  };

  const materialGroupsCount = groupedTopics.filter(g => {
    const s = matrixScores[g.code];
    return (s?.impact ?? 5.0) >= threshold || (s?.financial ?? 5.0) >= threshold;
  }).length;

  const handleExportExcel = () => {
    let csvContent = "Kode Topik,Isu Payung (Topik Strategis),Dampak bagi Bisnis (X),Penting bagi Stakeholders (Y),Status Materialitas,Alasan / Justifikasi\n";
    
    groupedTopics.forEach((g) => {
      const s = matrixScores[g.code] || { impact: 5.0, financial: 5.0, justification: '' };
      const impactScore = s.impact ?? 5.0;
      const financialScore = s.financial ?? 5.0;
      const justificationText = (s.justification || '').replace(/"/g, '""');
      const isMaterial = (impactScore >= threshold || financialScore >= threshold) ? "MATERIAL" : "TIDAK MATERIAL";
      
      csvContent += `"${g.code}","${g.name}",${impactScore.toFixed(1)},${financialScore.toFixed(1)},"${isMaterial}","${justificationText}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Matriks_Materialitas_Fase2.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center print:border-none print:shadow-none print:p-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">2. Penilaian Matriks Materialitas</h2>
          <p className="text-xs text-slate-500 mt-1">Pengelompokan Isu Payung Topik Standar (Skala Signifikansi 1.0 - 10.0).</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={handleExportExcel} className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">📊 Ekspor Excel</button>
          <button onClick={() => window.print()} className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm transition">🖨️ Cetak PDF</button>
        </div>
      </div>

      <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl shadow-sm print:hidden">
        <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>💡</span> Petunjuk Penilaian & Pertimbangan Materialitas
        </h3>
        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          Berikan skor 1.0 - 10.0 untuk mengevaluasi Isu Payung (Topik Strategis) dengan mempertimbangkan 4 aspek berikut:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold text-blue-800 block mb-1">1. Keparahan Dampak (ESG)</span>
            <p className="text-[11px] text-slate-500 leading-snug">Seberapa besar, luas, dan fatal dampak operasional terhadap lingkungan atau masyarakat.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold text-blue-800 block mb-1">2. Ekspektasi Stakeholders</span>
            <p className="text-[11px] text-slate-500 leading-snug">Tingkat sorotan atau tuntutan dari masyarakat, pemerintah, konsumen, atau investor.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold text-blue-800 block mb-1">3. Relevansi Bisnis</span>
            <p className="text-[11px] text-slate-500 leading-snug">Keterkaitan erat dengan strategi inti, operasional, serta kelangsungan bisnis perusahaan.</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
            <span className="font-bold text-blue-800 block mb-1">4. Dampak Keuangan & Risiko</span>
            <p className="text-[11px] text-slate-500 leading-snug">Potensi biaya, denda, kehilangan pendapatan, atau pengaruh terhadap penilaian investor.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 print:border-none">
        
        <div className="w-full md:w-1/2 relative bg-slate-50 border border-slate-300 rounded-xl overflow-hidden aspect-square shadow-inner print:shadow-none">
          <div className="absolute left-4 top-4 text-[10px] font-bold text-slate-500 -rotate-90 origin-top-left transform translate-y-40 uppercase tracking-widest z-0">
            Penting bagi Stakeholders (Y)
          </div>
          <div className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest z-0">
            Dampak bagi Bisnis (X)
          </div>

          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-slate-200 bg-yellow-50/50"></div>
            <div className="border-b border-slate-200 bg-red-50/50"></div>
            <div className="border-r border-slate-200 bg-green-50/50"></div>
            <div className="bg-yellow-50/50"></div>
          </div>
          
          <div className="absolute left-[60%] top-0 bottom-0 border-l-2 border-dashed border-red-400 opacity-60 z-0 print:opacity-100 print:border-red-500"></div>
          <div className="absolute bottom-[60%] left-0 right-0 border-b-2 border-dashed border-red-400 opacity-60 z-0 print:opacity-100 print:border-red-500"></div>
          
          {groupedTopics.map((group, index) => {
            const score = matrixScores[group.code] || { impact: 5.0, financial: 5.0 };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div 
                key={group.code}
                className={`absolute w-7 h-7 -ml-3.5 -mb-3.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg transition-all duration-300 cursor-pointer ${isMaterial ? 'bg-red-500 z-10 scale-110 hover:scale-125' : 'bg-slate-400 opacity-80'}`}
                style={{ left: `${(impactScore / 10) * 100}%`, bottom: `${(financialScore / 10) * 100}%` }}
                title={`${group.code} - ${group.name}\nBisnis (X): ${impactScore.toFixed(1)}\nStakeholders (Y): ${financialScore.toFixed(1)}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center print:block">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Legenda Isu Payung</h3>
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 print:max-h-full print:overflow-visible">
            {groupedTopics.map((group, index) => {
              const score = matrixScores[group.code] || { impact: 5.0, financial: 5.0 };
              const impactScore = score.impact ?? 5.0;
              const financialScore = score.financial ?? 5.0;
              const isMaterial = impactScore >= threshold || financialScore >= threshold;
              return (
                <div key={group.code} className="flex items-center gap-3 text-xs print:break-inside-avoid border-b border-slate-50 pb-2">
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMaterial ? 'bg-red-500' : 'bg-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 text-slate-700 font-medium print:whitespace-normal">
                    <span className={`font-mono font-bold mr-2 ${group.code.startsWith('IFRS') ? 'text-blue-600' : 'text-slate-900'}`}>{group.code}</span> 
                    {group.name}
                    <div className="text-[9px] text-slate-400 mt-0.5 leading-tight line-clamp-1">
                      Mencakup: {group.disclosures.map(d => d.disclosure_code).join(', ')}
                    </div>
                  </div>
                  <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isMaterial ? 'bg-red-100 text-red-700' : 'text-slate-500'}`}>
                    ({impactScore.toFixed(1)}, {financialScore.toFixed(1)})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Penyesuaian Skor Manual & Alasan Penilaian</h2>
        <div className="space-y-4">
          {groupedTopics.map((group, index) => {
            const score = matrixScores[group.code] || { impact: 5.0, financial: 5.0, justification: '' };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div key={group.code} className={`p-5 border rounded-2xl flex flex-col gap-4 transition-all ${isMaterial ? 'bg-red-50/30 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="w-full md:w-1/3 flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMaterial ? 'bg-red-500' : 'bg-slate-400'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className={`font-mono text-xs font-bold block ${group.code.startsWith('IFRS') ? 'text-blue-600' : 'text-emerald-600'}`}>{group.code}</span>
                      <span className="text-sm font-semibold text-slate-800">{group.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Dampak bagi Bisnis (X)</label>
                        <span className="font-mono text-sm font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{impactScore.toFixed(1)}</span>
                      </div>
                      <input type="range" min="1" max="10" step="0.1" value={impactScore} onChange={(e) => handleScoreChange(group.code, 'impact', parseFloat(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Penting bagi Stakeholders (Y)</label>
                        <span className="font-mono text-sm font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{financialScore.toFixed(1)}</span>
                      </div>
                      <input type="range" min="1" max="10" step="0.1" value={financialScore} onChange={(e) => handleScoreChange(group.code, 'financial', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Alasan / Justifikasi Penilaian Skor
                  </label>
                  <textarea
                    rows={2}
                    value={score.justification || ''}
                    onChange={(e) => handleJustificationChange(group.code, e.target.value)}
                    placeholder="Tuliskan alasan pemberian skor untuk topik ini (misal pertimbangan dampak bisnis, regulasi, atau ekspektasi stakeholder)..."
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center sticky bottom-4 z-20 print:hidden">
        <div><h3 className="font-bold text-slate-800 text-sm">Kesimpulan Fase 2</h3><p className="text-xs text-slate-500">Terdapat <strong className="text-red-600 text-sm">{materialGroupsCount} Isu Payung Material</strong> yang lolos ke tahap pelaporan (Fase 3).</p></div>
        <button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 px-8 rounded-xl transition shadow-lg flex items-center gap-2">Sahkan & Lanjut <span className="text-lg">→</span></button>
      </div>
    </div>
  );
}