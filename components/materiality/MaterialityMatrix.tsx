"use client";

import { useState, useEffect, useMemo } from 'react';
import { GriDisclosure } from '@/types/database';

interface MaterialityMatrixProps {
  disclosures: GriDisclosure[];
  selectedTopicIds: string[];
  setMaterialTopicIds: (ids: string[]) => void;
  onNext: () => void;
}

interface ScoreData {
  impact: number;      // Dampak bagi Bisnis (X)
  financial: number;   // Penting bagi Stakeholders (Y)
  justification?: string; // Alasan / Justifikasi
}

export function MaterialityMatrix({ disclosures, selectedTopicIds, setMaterialTopicIds, onNext }: MaterialityMatrixProps) {
  const selectedTopics = useMemo(() => {
    return disclosures.filter((d) => selectedTopicIds.includes(d.id));
  }, [disclosures, selectedTopicIds]);

  const [scores, setScores] = useState<Record<string, ScoreData>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const threshold = 6.0;

  useEffect(() => {
    const savedScores = localStorage.getItem('esg_matrixScores_v2');
    let parsedScores: Record<string, ScoreData> = {};
    
    if (savedScores) {
      try {
        parsedScores = JSON.parse(savedScores);
      } catch (e) {
        console.error("Gagal membaca skor dari localStorage", e);
      }
    }

    const newScores: Record<string, ScoreData> = {};
    
    selectedTopicIds.forEach((id) => {
      if (parsedScores[id] && typeof parsedScores[id].impact === 'number' && typeof parsedScores[id].financial === 'number') {
        newScores[id] = parsedScores[id];
      } else {
        newScores[id] = { impact: 5.0, financial: 5.0, justification: '' };
      }
    });

    setScores(newScores);
    setIsLoaded(true);
  }, [selectedTopicIds]); 

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('esg_matrixScores_v2', JSON.stringify(scores));
    }
  }, [scores, isLoaded]);

  const handleScoreChange = (id: string, axis: 'impact' | 'financial', value: number) => {
    setScores((prev) => {
      const currentScore = prev[id] || { impact: 5.0, financial: 5.0, justification: '' };
      return { ...prev, [id]: { ...currentScore, [axis]: value } };
    });
  };

  const handleJustificationChange = (id: string, justification: string) => {
    setScores((prev) => {
      const currentScore = prev[id] || { impact: 5.0, financial: 5.0, justification: '' };
      return { ...prev, [id]: { ...currentScore, justification } };
    });
  };

  const materialTopics = useMemo(() => {
    return Object.entries(scores)
      .filter(([_, score]) => (score?.impact ?? 0) >= threshold || (score?.financial ?? 0) >= threshold)
      .map(([id]) => id);
  }, [scores]);

  const handleApprove = () => {
    setMaterialTopicIds(materialTopics);
    onNext();
  };

  const handleExportExcel = () => {
    let csvContent = "Kode Standar,Judul Pengungkapan,Dampak bagi Bisnis (X),Penting bagi Stakeholders (Y),Status Materialitas,Alasan / Justifikasi\n";
    
    selectedTopics.forEach((t) => {
      const s = scores[t.id] || { impact: 5.0, financial: 5.0, justification: '' };
      const impactScore = s.impact ?? 5.0;
      const financialScore = s.financial ?? 5.0;
      const justificationText = (s.justification || '').replace(/"/g, '""');
      const isMaterial = (impactScore >= threshold || financialScore >= threshold) ? "MATERIAL" : "TIDAK MATERIAL";
      
      csvContent += `"${t.disclosure_code}","${t.title_id || t.title_en}",${impactScore.toFixed(1)},${financialScore.toFixed(1)},"${isMaterial}","${justificationText}"\n`;
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

  if (!isLoaded) return <div className="p-8 text-center text-emerald-600 font-bold">Memuat Matriks Visual...</div>;

  return (
    // 🛠️ PERBAIKAN PENTING: style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} 
    // Ini memaksa browser mencetak semua warna background dan elemen persis seperti di layar
    <div className="space-y-6" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center print:border-none print:shadow-none print:p-0">
        <div>
          <h2 className="text-lg font-bold text-slate-800">2. Penilaian Matriks Materialitas</h2>
          <p className="text-xs text-slate-500 mt-1">Pemetaan kuadran berdasarkan skala signifikansi 1.0 - 10.0.</p>
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
          Berikan skor 1.0 - 10.0 dengan mengevaluasi tingkat kepentingan bagi <strong>Stakeholders (Y)</strong> dan dampaknya bagi <strong>Bisnis (X)</strong> berdasar 4 pertimbangan berikut:
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

          {/* 🛠️ PERBAIKAN: Menghapus print:bg-white agar warna kuadran tetap di-print */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-slate-200 bg-yellow-50/50"></div>
            <div className="border-b border-slate-200 bg-red-50/50"></div>
            <div className="border-r border-slate-200 bg-green-50/50"></div>
            <div className="bg-yellow-50/50"></div>
          </div>
          
          {/* 🛠️ PERBAIKAN: Memastikan opacity menjadi solid (100) dan border tetap merah saat di-print */}
          <div className="absolute left-[60%] top-0 bottom-0 border-l-2 border-dashed border-red-400 opacity-60 z-0 print:opacity-100 print:border-red-500"></div>
          <div className="absolute bottom-[60%] left-0 right-0 border-b-2 border-dashed border-red-400 opacity-60 z-0 print:opacity-100 print:border-red-500"></div>
          
          {selectedTopics.map((topic, index) => {
            const score = scores[topic.id] || { impact: 5.0, financial: 5.0 };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div 
                key={topic.id}
                // 🛠️ PERBAIKAN: Menghapus print:border-black dan print:shadow-none agar titik tetap merah persis seperti di layar
                className={`absolute w-7 h-7 -ml-3.5 -mb-3.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg transition-all duration-300 cursor-pointer ${isMaterial ? 'bg-red-500 z-10 scale-110 hover:scale-125' : 'bg-slate-400 opacity-80'}`}
                style={{ left: `${(impactScore / 10) * 100}%`, bottom: `${(financialScore / 10) * 100}%` }}
                title={`${topic.disclosure_code}\nBisnis (X): ${impactScore.toFixed(1)}\nStakeholders (Y): ${financialScore.toFixed(1)}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center print:block">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Legenda Titik Koordinat</h3>
          <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 print:max-h-full print:overflow-visible">
            {selectedTopics.map((topic, index) => {
              const score = scores[topic.id] || { impact: 5.0, financial: 5.0 };
              const impactScore = score.impact ?? 5.0;
              const financialScore = score.financial ?? 5.0;
              const isMaterial = impactScore >= threshold || financialScore >= threshold;
              return (
                <div key={topic.id} className="flex items-center gap-3 text-xs print:break-inside-avoid">
                  {/* 🛠️ PERBAIKAN: Menghapus override warna putih/hitam di print legend */}
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMaterial ? 'bg-red-500' : 'bg-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 text-slate-700 font-medium truncate print:whitespace-normal">
                    <span className={`font-mono font-bold mr-2 ${topic.disclosure_code.startsWith('IFRS') ? 'text-blue-600' : 'text-slate-900'}`}>{topic.disclosure_code}</span> 
                    {topic.title_id || topic.title_en}
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
          {selectedTopics.map((topic, index) => {
            const score = scores[topic.id] || { impact: 5.0, financial: 5.0, justification: '' };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div key={topic.id} className={`p-5 border rounded-2xl flex flex-col gap-4 transition-all ${isMaterial ? 'bg-red-50/30 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                  <div className="w-full md:w-1/3 flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMaterial ? 'bg-red-500' : 'bg-slate-400'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className={`font-mono text-xs font-bold block ${topic.disclosure_code.startsWith('IFRS') ? 'text-blue-600' : 'text-emerald-600'}`}>{topic.disclosure_code}</span>
                      <span className="text-sm font-semibold text-slate-800">{topic.title_id || topic.title_en}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Dampak bagi Bisnis (X)</label>
                        <span className="font-mono text-sm font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{impactScore.toFixed(1)}</span>
                      </div>
                      <input type="range" min="1" max="10" step="0.1" value={impactScore} onChange={(e) => handleScoreChange(topic.id, 'impact', parseFloat(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-end mb-2">
                        <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Penting bagi Stakeholders (Y)</label>
                        <span className="font-mono text-sm font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{financialScore.toFixed(1)}</span>
                      </div>
                      <input type="range" min="1" max="10" step="0.1" value={financialScore} onChange={(e) => handleScoreChange(topic.id, 'financial', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
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
                    onChange={(e) => handleJustificationChange(topic.id, e.target.value)}
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
        <div><h3 className="font-bold text-slate-800 text-sm">Kesimpulan Fase 2</h3><p className="text-xs text-slate-500">Terdapat <strong className="text-red-600 text-sm">{materialTopics.length} Topik Material</strong>.</p></div>
        <button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 px-8 rounded-xl transition shadow-lg flex items-center gap-2">Sahkan & Lanjut <span className="text-lg">→</span></button>
      </div>
    </div>
  );
}