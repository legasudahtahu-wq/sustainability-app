"use client";

import { useState, useEffect, useMemo } from 'react';
import { GriDisclosure } from '@/types/database';

interface MaterialityMatrixProps {
  disclosures: GriDisclosure[];
  selectedTopicIds: string[];
  setMaterialTopicIds: (ids: string[]) => void;
  onNext: () => void;
}

export function MaterialityMatrix({ disclosures, selectedTopicIds, setMaterialTopicIds, onNext }: MaterialityMatrixProps) {
  const selectedTopics = disclosures.filter((d) => selectedTopicIds.includes(d.id));
  const [scores, setScores] = useState<Record<string, { impact: number; financial: number }>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const threshold = 6.0;

  useEffect(() => {
    const savedScores = localStorage.getItem('esg_matrixScores_v2');
    let parsedScores: Record<string, { impact: number; financial: number }> = {};
    
    if (savedScores) {
      try {
        parsedScores = JSON.parse(savedScores);
      } catch (e) {}
    }

    // PERBAIKAN: Memastikan semua topik (termasuk topik TCFD baru) memiliki skor default
    // Ini mencegah error "undefined reading toFixed"
    const initialScores: Record<string, { impact: number; financial: number }> = { ...parsedScores };
    selectedTopics.forEach((t) => {
      if (!initialScores[t.id] || typeof initialScores[t.id].impact !== 'number' || typeof initialScores[t.id].financial !== 'number') {
        initialScores[t.id] = { impact: 5.0, financial: 5.0 };
      }
    });

    setScores(initialScores);
    setIsLoaded(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTopicIds]);

  useEffect(() => {
    if (isLoaded && Object.keys(scores).length > 0) {
      localStorage.setItem('esg_matrixScores_v2', JSON.stringify(scores));
    }
  }, [scores, isLoaded]);

  const handleScoreChange = (id: string, axis: 'impact' | 'financial', value: number) => {
    setScores((prev) => {
      // PERBAIKAN: Fallback ke nilai 5.0 jika prev[id] belum terbentuk sempurna
      const currentScore = prev[id] || { impact: 5.0, financial: 5.0 };
      return { ...prev, [id]: { ...currentScore, [axis]: value } };
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

  // LOGIKA EKSPOR CSV/EXCEL
  const handleExportExcel = () => {
    let csvContent = "Kode Standar,Judul Pengungkapan,Skor Dampak ESG (X),Skor Dampak Finansial (Y),Status Materialitas\n";
    
    selectedTopics.forEach((t) => {
      const s = scores[t.id] || { impact: 5.0, financial: 5.0 };
      const impactScore = s.impact ?? 5.0;
      const financialScore = s.financial ?? 5.0;
      const isMaterial = (impactScore >= threshold || financialScore >= threshold) ? "MATERIAL" : "TIDAK MATERIAL";
      
      csvContent += `"${t.disclosure_code}","${t.title_id || t.title_en}",${impactScore.toFixed(1)},${financialScore.toFixed(1)},"${isMaterial}"\n`;
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
    <div className="space-y-6">
      
      {/* HEADER DENGAN TOMBOL EKSPOR */}
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

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-8 print:border-slate-300">
        
        <div className="w-full md:w-1/2 relative bg-slate-50 border border-slate-300 rounded-xl overflow-hidden aspect-square shadow-inner print:shadow-none">
          <div className="absolute left-4 top-4 text-[10px] font-bold text-slate-400 -rotate-90 origin-top-left transform translate-y-24 uppercase tracking-widest z-0">Dampak Finansial (Y)</div>
          <div className="absolute right-4 bottom-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest z-0">Dampak ESG (X)</div>

          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-r border-b border-slate-200 bg-yellow-50/50 print:bg-white print:border-slate-400"></div>
            <div className="border-b border-slate-200 bg-red-50/50 print:bg-slate-100 print:border-slate-400"></div>
            <div className="border-r border-slate-200 bg-green-50/50 print:bg-white print:border-slate-400"></div>
            <div className="bg-yellow-50/50 print:bg-white print:border-slate-400"></div>
          </div>
          
          <div className="absolute left-[60%] top-0 bottom-0 border-l-2 border-dashed border-red-400 opacity-60 z-0 print:border-black"></div>
          <div className="absolute bottom-[60%] left-0 right-0 border-b-2 border-dashed border-red-400 opacity-60 z-0 print:border-black"></div>
          
          {selectedTopics.map((topic, index) => {
            const score = scores[topic.id] || { impact: 5.0, financial: 5.0 };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div 
                key={topic.id}
                className={`absolute w-7 h-7 -ml-3.5 -mb-3.5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg print:shadow-none print:border print:border-slate-800 transition-all duration-300 cursor-pointer ${isMaterial ? 'bg-red-500 z-10 scale-110 hover:scale-125' : 'bg-slate-400 opacity-80'}`}
                style={{ left: `${(impactScore / 10) * 100}%`, bottom: `${(financialScore / 10) * 100}%` }}
                title={`${topic.disclosure_code}\nESG: ${impactScore.toFixed(1)}\nFinansial: ${financialScore.toFixed(1)}`}
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
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm print:border print:border-slate-800 print:text-black ${isMaterial ? 'bg-red-500 print:bg-slate-200' : 'bg-slate-400 print:bg-white'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 text-slate-700 font-medium truncate print:whitespace-normal">
                    <span className={`font-mono font-bold mr-2 ${topic.disclosure_code.startsWith('IFRS') ? 'text-blue-600' : 'text-slate-900'}`}>{topic.disclosure_code}</span> 
                    {topic.title_id || topic.title_en}
                  </div>
                  <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isMaterial ? 'bg-red-100 text-red-700 print:border print:border-black' : 'text-slate-500'}`}>
                    ({impactScore.toFixed(1)}, {financialScore.toFixed(1)})
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Penyesuaian Skor Manual</h2>
        <div className="space-y-4">
          {selectedTopics.map((topic, index) => {
            const score = scores[topic.id] || { impact: 5.0, financial: 5.0 };
            const impactScore = score.impact ?? 5.0;
            const financialScore = score.financial ?? 5.0;
            const isMaterial = impactScore >= threshold || financialScore >= threshold;
            return (
              <div key={topic.id} className={`p-4 border rounded-xl flex flex-col md:flex-row gap-6 items-center justify-between transition-all ${isMaterial ? 'bg-red-50/30 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="w-full md:w-1/3 flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${isMaterial ? 'bg-red-500' : 'bg-slate-400'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <span className={`font-mono text-xs font-bold block ${topic.disclosure_code.startsWith('IFRS') ? 'text-blue-600' : 'text-emerald-600'}`}>{topic.disclosure_code}</span>
                    <span className="text-sm font-semibold text-slate-700">{topic.title_id || topic.title_en}</span>
                  </div>
                </div>
                
                <div className="flex-1 w-full flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dampak ESG</label>
                      <span className="font-mono text-sm font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{impactScore.toFixed(1)}</span>
                    </div>
                    <input type="range" min="1" max="10" step="0.1" value={impactScore} onChange={(e) => handleScoreChange(topic.id, 'impact', parseFloat(e.target.value))} className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dampak Finansial</label>
                      <span className="font-mono text-sm font-black text-blue-600 bg-blue-100 px-2 py-0.5 rounded">{financialScore.toFixed(1)}</span>
                    </div>
                    <input type="range" min="1" max="10" step="0.1" value={financialScore} onChange={(e) => handleScoreChange(topic.id, 'financial', parseFloat(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                  </div>
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