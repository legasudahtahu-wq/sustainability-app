"use client";

import React, { useState } from 'react';
import { GriDisclosure } from '@/types/database';

interface ReviewDashboardProps {
  disclosures: GriDisclosure[];
  perfData: Record<string, Record<number, any>>;
  managementData: Record<string, { policy: string, actions: string }>;
  materialTopicIds: string[]; 
  sites: string[]; 
  reportingYear: number; // Menerima Tahun Pelaporan Aktif
}

export function ReviewDashboard({ disclosures, perfData, managementData, materialTopicIds, sites, reportingYear }: ReviewDashboardProps) {
  
  // DILAKUKAN DINAMISASI JENDELA 4 TAHUN DARI PROPS FASE 0
  const years = [reportingYear - 3, reportingYear - 2, reportingYear - 1, reportingYear];
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNIVERSAL' | 'TOPIC' | 'TCFD'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  const getGriDetails = (code: string) => {
    if (code === 'IFRS-S2-1') return { unit: 'Persentase (%)', type: 'tcfd_strategy' };
    if (code === 'IFRS-S2-2') return { unit: 'Nilai', type: 'tcfd_metrics' };
    if (code === '302-3') return { unit: 'GJ / Unit', type: 'intensity' };
    if (code === '305-4') return { unit: 'tCO2e / Unit', type: 'intensity' };
    if (code === '2-7') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
    if (code === '204-1') return { unit: 'IDR', type: 'breakdown', aggType: 'sum' };
    if (code === '302-1') return { unit: 'GJ', type: 'breakdown', aggType: 'sum' };
    if (code === '303-3') return { unit: 'ML', type: 'breakdown', aggType: 'sum' };
    if (code === '405-1') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
    if (code === '401-1') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
    if (code === '202-2') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
    if (code.startsWith('306')) return { unit: 'Ton', type: 'breakdown', aggType: 'sum' };
    if (code.startsWith('2-')) return { unit: 'Naratif', type: 'narrative' };
    if (code.startsWith('201') || code.startsWith('203') || code.startsWith('207')) return { unit: 'IDR', type: 'absolute', aggType: 'sum' };
    if (code.startsWith('202') || code.startsWith('308') || code.startsWith('414')) return { unit: '%', type: 'absolute', aggType: 'average' };
    if (code.startsWith('205') || code.startsWith('206') || code.startsWith('403') || code.startsWith('418')) return { unit: 'Kasus', type: 'absolute', aggType: 'sum' };
    if (code.startsWith('301')) return { unit: 'Ton', type: 'absolute', aggType: 'sum' };
    if (code.startsWith('304')) return { unit: 'ha', type: 'absolute', aggType: 'sum' };
    if (code.startsWith('305')) return { unit: 'tCO2e', type: 'absolute', aggType: 'sum' };
    if (code.startsWith('402')) return { unit: 'Minggu', type: 'absolute', aggType: 'average' };
    if (code.startsWith('404')) return { unit: 'Jam', type: 'absolute', aggType: 'average' };
    return { unit: 'Nilai', type: 'absolute', aggType: 'sum' };
  };

  const getLinkedNumerator = (code: string, year: number) => {
    const getSum = (targetCode: string) => {
      const id = disclosures.find(d => d.disclosure_code === targetCode)?.id;
      if (!id) return 0;
      const dataSites = perfData[id]?.[year]?.sites || {};
      let sum = 0;
      sites.forEach(site => {
        const v = dataSites[site];
        if (typeof v === 'object' && v !== null) {
          Object.values(v).forEach((subV: any) => { if (subV !== null && subV !== '' && !isNaN(Number(subV))) sum += Number(subV); });
        } else if (v !== null && v !== '' && v !== undefined && !isNaN(Number(v))) {
          sum += Number(v);
        }
      });
      return sum;
    };
    if (code === '305-4') return getSum('305-1') + getSum('305-2');
    if (code === '302-3') return getSum('302-1');
    return 0;
  };

  const calculateTotal = (code: string, topicId: string, year: number) => {
    const details = getGriDetails(code);
    const currentPerf = perfData[topicId]?.[year];
    
    if (!currentPerf && details.type !== 'intensity') return { abs: '-', int: '' }; 

    if (details.type === 'tcfd_strategy') {
      return { abs: currentPerf?.tcfdData?.carImpact ? `CAR -${currentPerf.tcfdData.carImpact}%` : 'Selesai', int: '' };
    }
    if (details.type === 'tcfd_metrics') {
      return { abs: currentPerf?.tcfdData?.icp ? `Rp ${Number(currentPerf.tcfdData.icp).toLocaleString('id-ID')}` : 'Selesai', int: '' };
    }
    
    if (details.type === 'narrative') return { abs: currentPerf?.narrativeValue ? 'Diungkapkan' : '-', int: '' };

    let absNum = 0;
    let hasData = false;

    if (details.type === 'intensity') {
      absNum = getLinkedNumerator(code, year);
      hasData = true;
    } else {
      const dataSites = currentPerf?.sites || {};
      let sum = 0; let count = 0;
      sites.forEach(site => {
        const v = dataSites[site];
        if (typeof v === 'object' && v !== null) {
          Object.values(v).forEach((subV: any) => {
            if (subV !== null && subV !== '' && !isNaN(Number(subV))) { sum += Number(subV); count++; hasData = true; }
          });
        } else if (v !== null && v !== '' && v !== undefined && !isNaN(Number(v))) {
          sum += Number(v); count++; hasData = true;
        }
      });
      absNum = details.aggType === 'average' && count > 0 ? (sum / count) : sum;
    }

    if (!hasData) return { abs: '-', int: '' };

    const absFormatted = absNum.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    let intFormatted = '';
    if (details.type === 'intensity' && currentPerf && parseFloat(currentPerf.intensityData?.denominator) > 0) {
       const denom = parseFloat(currentPerf.intensityData.denominator);
       const intNum = absNum / denom;
       const shortUnit = currentPerf.intensityData.intensityUnit ? currentPerf.intensityData.intensityUnit.split(' ')[0] : 'Unit';
       intFormatted = `${intNum.toLocaleString('id-ID', { maximumFractionDigits: 4 })} / ${shortUnit}`;
    }
    return { abs: absFormatted, int: intFormatted };
  };

  const reportDisclosures = disclosures.filter(d => d.gri_type === 'universal' || materialTopicIds.includes(d.id));
  const filteredDisclosures = reportDisclosures.filter(d => {
    if (activeFilter === 'UNIVERSAL') return d.gri_type === 'universal';
    if (activeFilter === 'TOPIC') return materialTopicIds.includes(d.id) && !d.disclosure_code.startsWith('IFRS'); 
    if (activeFilter === 'TCFD') return d.disclosure_code.startsWith('IFRS'); 
    return true; 
  });

  return (
    <div className="space-y-8 pb-20 print:pb-0 print:space-y-0">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center print:shadow-none print:border-none print:p-0 print:mb-8">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase print:border print:border-emerald-800 print:bg-transparent">GRI & IFRS S2 Standards</span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Laporan Kompilasi Keberlanjutan ({reportingYear})</h1>
          <p className="text-xs text-slate-500 mt-1">Tren kinerja 4-tahun <strong>({years[0]}–{years[3]})</strong> disusun berdasarkan <strong>{materialTopicIds.length} Topik Material</strong>.</p>
        </div>
        
        <div className="flex gap-3 print:hidden">
          <button onClick={() => setExpandAll(!expandAll)} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition">
            {expandAll ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm hover:bg-slate-800 transition">
            🖨️ Cetak Full PDF
          </button>
        </div>
      </div>

      <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-bold gap-1 w-max print:hidden">
        {[{ id: 'ALL', label: 'Semua Laporan' }, { id: 'UNIVERSAL', label: 'GRI 2 (Wajib)' }, { id: 'TOPIC', label: `GRI Topik Material` }, { id: 'TCFD', label: 'IFRS S2 / TCFD' }].map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id as any)} className={`px-4 py-2 rounded-lg ${activeFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>{f.label}</button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:overflow-visible">
        <table className="w-full text-left border-collapse print:table-fixed">
          <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider font-bold print:bg-slate-200 print:text-black print:border-b-2 print:border-black">
            <tr>
              <th className="p-4 w-28 print:w-[15%]">Kode Standar</th>
              <th className="p-4 w-1/4 print:w-[35%]">Judul Pengungkapan</th>
              <th className="p-4 print:w-[50%]">Kinerja Historis ({years[0]}–{years[3]})</th>
              <th className="p-4 w-24 text-center print:hidden">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs text-slate-700 print:divide-black">
            {filteredDisclosures.map((d) => {
              const type = getGriDetails(d.disclosure_code).type;
              const isIntensity = type === 'intensity';
              const isTcfd = type === 'tcfd_strategy' || type === 'tcfd_metrics';
              
              const isExpanded = expandAll || expandedId === d.id;

              return (
                <React.Fragment key={d.id}>
                  <tr className={`hover:bg-slate-50 transition cursor-pointer print:break-inside-avoid ${isExpanded ? (isTcfd ? 'bg-blue-50/50 print:bg-transparent' : 'bg-emerald-50/30 print:bg-transparent') : ''}`} onClick={() => setExpandedId(isExpanded ? null : d.id)}>
                    <td className="p-4 font-mono font-bold text-slate-900 align-top border-l-4 border-transparent print:border-none">{d.disclosure_code}</td>
                    <td className="p-4 font-bold text-slate-800 align-top">{d.title_id || d.title_en}</td>
                    <td className="p-4 align-top">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5 print:bg-transparent print:border-slate-300">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-200 pb-1">
                          <span>{isTcfd ? 'Indikator Utama:' : isIntensity ? 'Data Gabungan:' : 'Data Absolut:'} <strong className="text-slate-800">{getGriDetails(d.disclosure_code).unit}</strong></span>
                        </div>
                        
                        {/* REKAP TREN 4-TAHUN BERJALAN SECARA DINAMIS */}
                        <div className="grid grid-cols-4 gap-2 text-center font-mono text-[11px] pt-0.5">
                          {years.map(yr => {
                            const isCurrentYear = yr === reportingYear;
                            const yData = calculateTotal(d.disclosure_code, d.id, yr);
                            return (
                              <div key={yr} className={isCurrentYear ? (isTcfd ? "bg-blue-100 rounded py-1 print:bg-slate-200" : "bg-emerald-100 rounded py-1 print:bg-slate-200") : "py-1"}>
                                <span className={`block text-[9px] font-sans ${isCurrentYear ? (isTcfd ? 'text-blue-800' : 'text-emerald-800') + ' font-bold print:text-black' : 'text-slate-400 print:text-slate-600'}`}>{yr}</span>
                                <span className={`font-semibold block leading-tight ${isCurrentYear ? (isTcfd ? 'text-blue-900' : 'text-emerald-900') + ' print:text-black' : 'text-slate-700 print:text-black'}`}>{yData.abs}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center align-top print:hidden">
                      <button className={`text-[10px] font-bold ${isTcfd ? 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'} px-3 py-1.5 rounded-lg border transition`}>
                        {isExpanded ? 'Tutup' : 'Cek Detail'}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && !isTcfd && (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={4} className="p-0 border-b-2 border-slate-200 print:border-black">
                        <div className="bg-white p-6 shadow-inner border-t border-slate-200 flex flex-col md:flex-row gap-6 print:shadow-none print:border-slate-400 print:pt-4">
                          <div className="w-full md:w-1/2 space-y-4">
                            <div>
                              <h4 className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-1 print:text-black">Pendekatan Manajemen (GRI 3-3)</h4>
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap print:bg-transparent print:border-slate-300">
                                {managementData[d.id]?.policy || <span className="text-slate-400 italic">Belum ada data.</span>}
                              </div>
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 print:text-black">Target Perusahaan</h4>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs text-slate-700 font-semibold print:bg-transparent print:border-slate-300">
                                  {perfData[d.id]?.[reportingYear]?.target || '-'}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 print:text-black">Tautan Bukti (Evidence)</h4>
                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs text-blue-600 truncate print:bg-transparent print:border-slate-300 print:text-black">
                                  {perfData[d.id]?.[reportingYear]?.evidence ? <a href={perfData[d.id][reportingYear].evidence} target="_blank" rel="noreferrer" className="hover:underline">{perfData[d.id][reportingYear].evidence}</a> : '-'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="w-full md:w-1/2 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 space-y-3 print:border-slate-400">
                            <h4 className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider mb-2 print:text-black">Detail Input Data Fase 3 ({reportingYear})</h4>
                            {type === 'narrative' ? (
                               <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-xs text-slate-700 whitespace-pre-wrap print:bg-transparent print:border-slate-300">
                                 {perfData[d.id]?.[reportingYear]?.narrativeValue || <span className="text-slate-400 italic">Belum ada narasi.</span>}
                               </div>
                            ) : type === 'intensity' ? (
                               <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-xs space-y-2 print:bg-transparent print:border-slate-300">
                                 <div className="flex justify-between"><span className="text-slate-600 print:text-black">Penyebut:</span> <span className="font-mono font-bold text-purple-800 print:text-black">{perfData[d.id]?.[reportingYear]?.intensityData?.denominator || '-'}</span></div>
                                 <div className="flex justify-between"><span className="text-slate-600 print:text-black">Satuan:</span> <span className="font-mono font-bold text-purple-800 print:text-black">{perfData[d.id]?.[reportingYear]?.intensityData?.intensityUnit || '-'}</span></div>
                               </div>
                            ) : (
                              <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden print:bg-transparent print:border-slate-300">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-slate-200/50 text-slate-600 border-b border-slate-200 print:bg-slate-100 print:text-black">
                                    <tr><th className="p-2 font-bold">Lokasi / Detail Data Mentah</th><th className="p-2 font-bold text-right">Nilai Input ({reportingYear})</th></tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 print:divide-slate-300">
                                    {sites.map(site => {
                                      const val = perfData[d.id]?.[reportingYear]?.sites?.[site];
                                      if (typeof val === 'object' && val !== null) {
                                        return (
                                          <React.Fragment key={site}>
                                            <tr className="bg-slate-100 print:bg-transparent"><td colSpan={2} className="p-2 font-bold text-slate-700">{site}</td></tr>
                                            {Object.entries(val).map(([subId, subVal]) => (
                                              <tr key={subId}>
                                                <td className="p-2 pl-6 text-slate-600 border-l-2 border-slate-300 print:text-black">↳ {perfData[d.id]?.[0]?.breakdownItems?.find((i:any)=>i.id === subId)?.name || subId}</td>
                                                <td className="p-2 text-right font-mono font-bold text-slate-800 print:text-black">{Number(subVal).toLocaleString('id-ID')}</td>
                                              </tr>
                                            ))}
                                          </React.Fragment>
                                        );
                                      } else {
                                        const displayVal = val !== undefined && val !== null && val !== '' ? Number(val).toLocaleString('id-ID') : '-';
                                        return (
                                          <tr key={site}>
                                            <td className="p-2 font-medium text-slate-700 print:text-black">{site}</td>
                                            <td className="p-2 text-right font-mono font-bold text-slate-800 print:text-black">{displayVal}</td>
                                          </tr>
                                        );
                                      }
                                    })}
                                    {sites.every(s => !perfData[d.id]?.[reportingYear]?.sites?.[s]) && <tr><td colSpan={2} className="p-3 text-center italic text-slate-400">Data belum diinput di Fase 3.</td></tr>}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {isExpanded && isTcfd && (
                    <tr className="print:break-inside-avoid">
                      <td colSpan={4} className="p-0 border-b-2 border-slate-200 print:border-black">
                        <div className="bg-blue-50/30 p-6 shadow-inner border-t border-slate-200 flex flex-col md:flex-row gap-6 print:bg-white print:shadow-none print:border-slate-400 print:pt-4">
                          
                          {type === 'tcfd_strategy' && (
                            <div className="w-full grid grid-cols-2 gap-6">
                              <div className="space-y-4 pr-6 border-r border-blue-200 print:border-slate-300">
                                <h4 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-2 print:text-black">Parameter Skenario Iklim</h4>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Skenario Transisi Utama (NGFS)</span>
                                  <span className="font-bold text-slate-800">{perfData[d.id]?.[reportingYear]?.tcfdData?.transitionScenario || '-'}</span>
                                </div>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Skenario Fisik Utama (IPCC)</span>
                                  <span className="font-bold text-slate-800">{perfData[d.id]?.[reportingYear]?.tcfdData?.physicalScenario || '-'}</span>
                                </div>
                              </div>
                              <div className="space-y-4">
                                <h4 className="text-[10px] uppercase font-bold text-red-600 tracking-wider mb-2 print:text-black">Hasil Uji Stres (Stress Test Output)</h4>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Proyeksi Kenaikan Probability of Default (PD)</span>
                                  <span className="text-xl font-black text-red-700 font-mono">{perfData[d.id]?.[reportingYear]?.tcfdData?.pdImpact || '0.00'} %</span>
                                </div>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Proyeksi Penurunan Capital Adequacy Ratio (CAR)</span>
                                  <span className="text-xl font-black text-orange-600 font-mono">{perfData[d.id]?.[reportingYear]?.tcfdData?.carImpact || '0.00'} %</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {type === 'tcfd_metrics' && (
                            <div className="w-full grid grid-cols-2 gap-6">
                              <div className="space-y-4 pr-6 border-r border-blue-200 print:border-slate-300">
                                <h4 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider mb-2 print:text-black">Target Dekarbonisasi Berbasis Sains</h4>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Metodologi SBTi (Science Based Targets)</span>
                                  <span className="font-bold text-slate-800">{perfData[d.id]?.[reportingYear]?.tcfdData?.methodology || '-'}</span>
                                </div>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black">Target Penurunan Financed Emissions</span>
                                  <span className="font-bold text-emerald-700 text-lg">{perfData[d.id]?.[reportingYear]?.tcfdData?.feTarget || '0'} %</span>
                                  <span className="text-xs text-slate-500 ml-2">(dicapai pada tahun {perfData[d.id]?.[reportingYear]?.tcfdData?.targetYear || '-'})</span>
                                </div>
                              </div>
                              <div className="space-y-4 flex flex-col justify-center">
                                <h4 className="text-[10px] uppercase font-bold text-purple-600 tracking-wider mb-2 print:text-black">Evaluasi Keuangan Proyek (Shadow Pricing)</h4>
                                <div>
                                  <span className="block text-xs text-slate-500 print:text-black mb-1">Harga Karbon Internal (Internal Carbon Pricing)</span>
                                  <span className="text-2xl font-black text-purple-800 font-mono">Rp {Number(perfData[d.id]?.[reportingYear]?.tcfdData?.icp || 0).toLocaleString('id-ID')}</span>
                                  <span className="text-xs text-purple-600 font-bold ml-1">/ tCO2e</span>
                                </div>
                              </div>
                            </div>
                          )}

                        </div>
                      </td>
                    </tr>
                  )}

                </React.Fragment>
              );
            })}
            {filteredDisclosures.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Pilih "Topik Material" atau lengkapi Fase 2 terlebih dahulu.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}