"use client";

import React, { useState, useMemo } from 'react';
import { GriDisclosure } from '@/types/database';
// 🌟 IMPORT PUSTAKA GRAFIK
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ReviewDashboardProps {
  disclosures: GriDisclosure[];
  perfData: Record<string, Record<number, any>>;
  managementData: Record<string, { policy: string, actions: string }>;
  materialTopicIds: string[]; 
  sites: string[]; 
  reportingYear: number;
}

export function ReviewDashboard({ disclosures, perfData, managementData, materialTopicIds, sites, reportingYear }: ReviewDashboardProps) {
  
  const years = [reportingYear - 3, reportingYear - 2, reportingYear - 1, reportingYear];
  
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNIVERSAL' | 'TOPIC' | 'TCFD'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);
  
  const [viewMode, setViewMode] = useState<'ikhtisar' | 'kinerja' | 'referensi'>('ikhtisar');

  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  const getGriDetails = (code: string): any => {
    if (code === 'IFRS-S2-1') return { unit: 'Persentase (%)', type: 'tcfd_strategy' };
    if (code === 'IFRS-S2-2') return { unit: 'Nilai', type: 'tcfd_metrics' };
    if (code === '302-3') return { unit: 'GJ / Unit', type: 'intensity' };
    if (code === '305-4') return { unit: 'tCO2e / Unit', type: 'intensity' };
    
    // Kamus bawaan ditambahkan di sini agar PDF membaca label, bukan ID mentah
    if (code === '2-7') return { unit: 'Orang', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'emp_p', name: 'Karyawan Tetap' }, { id: 'emp_t', name: 'Karyawan Kontrak' }, { id: 'emp_ft', name: 'Penuh Waktu' }, { id: 'emp_pt', name: 'Paruh Waktu' }] };
    if (code === '204-1') return { unit: 'IDR', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'sup_loc', name: 'Pemasok Lokal' }, { id: 'sup_nat', name: 'Pemasok Non-Lokal' }] };
    if (code === '302-1') return { unit: 'GJ', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'en_nr_1', name: 'Solar / Diesel' }, { id: 'en_nr_2', name: 'Batu Bara / Gas Alam' }, { id: 'en_gr_1', name: 'Listrik PLN' }, { id: 'en_re_1', name: 'Solar Panel' }] };
    if (code === '303-3') return { unit: 'ML', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'wat_1', name: 'Sumur Bor' }, { id: 'wat_2', name: 'Sungai / Danau' }, { id: 'wat_3', name: 'Suplai PDAM' }] };
    if (code === '405-1') return { unit: 'Orang', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'div_g_1', name: 'Laki-laki' }, { id: 'div_g_2', name: 'Perempuan' }, { id: 'div_a_1', name: 'Di bawah 30 tahun' }, { id: 'div_a_2', name: '30 - 50 tahun' }, { id: 'div_a_3', name: 'Di atas 50 tahun' }] };
    if (code.startsWith('306')) return { unit: 'Ton', type: 'breakdown', aggType: 'sum', defaultItems: [{ id: 'b3_1', name: 'Oli Bekas' }, { id: 'b3_2', name: 'Limbah Medis' }, { id: 'nb3_1', name: 'Kertas & Kemasan' }, { id: 'nb3_2', name: 'Sisa Organik' }] };
    
    if (code === '401-1') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
    if (code === '202-2') return { unit: 'Orang', type: 'breakdown', aggType: 'sum' };
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

  const getCrossReferenceMap = (code: string = '') => {
    let sdg = '-', pojk = '-', ungc = '-';
    if (code.startsWith('201')) { sdg = 'SDG 8, 9'; pojk = 'POJK 51: 6.a'; ungc = '-'; }
    else if (code.startsWith('205')) { sdg = 'SDG 16'; pojk = '-'; ungc = 'UNGC 10'; }
    else if (code.startsWith('302')) { sdg = 'SDG 7, 12, 13'; pojk = 'POJK 51: 6.b'; ungc = 'UNGC 7, 8, 9'; }
    else if (code.startsWith('303')) { sdg = 'SDG 6'; pojk = 'POJK 51: 6.b'; ungc = 'UNGC 7, 8, 9'; }
    else if (code.startsWith('304')) { sdg = 'SDG 14, 15'; pojk = 'POJK 51: 6.b'; ungc = 'UNGC 7, 8, 9'; }
    else if (code.startsWith('305')) { sdg = 'SDG 13'; pojk = 'POJK 51: 6.b'; ungc = 'UNGC 7, 8, 9'; }
    else if (code.startsWith('306')) { sdg = 'SDG 3, 6, 12'; pojk = 'POJK 51: 6.b'; ungc = 'UNGC 7, 8, 9'; }
    else if (code.startsWith('401')) { sdg = 'SDG 8'; pojk = 'POJK 51: 6.c'; ungc = 'UNGC 6'; }
    else if (code.startsWith('403')) { sdg = 'SDG 3, 8'; pojk = 'POJK 51: 6.c'; ungc = '-'; }
    else if (code.startsWith('404')) { sdg = 'SDG 4, 8'; pojk = 'POJK 51: 6.c'; ungc = '-'; }
    else if (code.startsWith('405')) { sdg = 'SDG 5, 10'; pojk = 'POJK 51: 6.c'; ungc = 'UNGC 6'; }
    else if (code.startsWith('413')) { sdg = 'SDG 1, 2, 11'; pojk = 'POJK 51: 6.d'; ungc = '-'; }
    else if (code.startsWith('2-')) { sdg = 'SDG 16'; pojk = 'POJK 51: 4'; ungc = 'UNGC 1-10'; }
    else if (code.startsWith('IFRS')) { sdg = 'SDG 13'; pojk = 'POJK 51: 6.b'; ungc = 'TCFD'; }
    return { sdg, pojk, ungc };
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

  // 🌟 MESIN AGREGASI DATA UNTUK GRAFIK
  const getRawNumberTotal = (codeMatch: string, year: number, subIdMatch?: string) => {
    const d = disclosures.find(d => d.disclosure_code.startsWith(codeMatch));
    if (!d) return 0;
    const dataSites = perfData[d.id]?.[year]?.sites || {};
    let sum = 0;
    sites.forEach(site => {
      const v = dataSites[site];
      if (typeof v === 'object' && v !== null) {
        if (subIdMatch && v[subIdMatch] !== undefined) {
           sum += Number(v[subIdMatch]) || 0;
        } else if (!subIdMatch) {
           Object.values(v).forEach((subV: any) => { sum += Number(subV) || 0; });
        }
      } else if (!subIdMatch && v !== null && v !== undefined) {
        sum += Number(v) || 0;
      }
    });
    return sum;
  };

  const chartDataEmissions = useMemo(() => {
    return years.map(yr => ({
      year: yr.toString(),
      'Cakupan 1': getRawNumberTotal('305-1', yr),
      'Cakupan 2': getRawNumberTotal('305-2', yr),
    }));
  }, [years, perfData, disclosures]);

  const chartDataEnergy = useMemo(() => {
    return years.map(yr => ({
      year: yr.toString(),
      'Total Energi (GJ)': getRawNumberTotal('302-1', yr),
    }));
  }, [years, perfData, disclosures]);

  const chartDataGender = useMemo(() => {
    const male = getRawNumberTotal('405-1', reportingYear, 'div_g_1');
    const female = getRawNumberTotal('405-1', reportingYear, 'div_g_2');
    if (male === 0 && female === 0) return [];
    return [
      { name: 'Laki-laki', value: male },
      { name: 'Perempuan', value: female }
    ];
  }, [reportingYear, perfData, disclosures]);

  const reportDisclosures = disclosures.filter(d => d.gri_type === 'universal' || materialTopicIds.includes(d.id));
  
  const incompleteTopics = useMemo(() => {
    const incomplete: { code: string, title: string, reason: string }[] = [];

    reportDisclosures.forEach(d => {
      const details = getGriDetails(d.disclosure_code);
      const pData = perfData[d.id]?.[reportingYear];
      const isIfrs = d.disclosure_code.startsWith('IFRS');
      const isUniversal = d.gri_type === 'universal';

      if (!isUniversal && !isIfrs) {
        const policy = managementData[d.id]?.policy;
        if (!policy || policy.trim() === '') {
          incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Pendekatan Manajemen (GRI 3-3) belum diisi' });
          return; 
        }
      }

      if (!pData) {
        incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Data kinerja belum diinput sama sekali' });
        return;
      }

      if (details.type === 'narrative') {
        if (!pData.narrativeValue || pData.narrativeValue.trim() === '') {
          incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Uraian kualitatif / narasi masih kosong' });
        }
      } else if (details.type === 'tcfd_strategy') {
        if (!pData.tcfdData?.pdImpact || !pData.tcfdData?.carImpact) {
          incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Hasil Uji Stres Risiko Iklim (PD/CAR) belum lengkap' });
        }
      } else if (details.type === 'tcfd_metrics') {
        if (!pData.tcfdData?.feTarget || !pData.tcfdData?.icp) {
          incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Metrik Harga Karbon & Emisi belum lengkap' });
        }
      } else if (details.type === 'intensity') {
        if (!pData.intensityData?.denominator || !pData.intensityData?.intensityUnit) {
          incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Faktor & Satuan rasio intensitas belum diisi' });
        }
      } else {
        const total = calculateTotal(d.disclosure_code, d.id, reportingYear);
        if (total.abs === '-') {
           incomplete.push({ code: d.disclosure_code, title: d.title_id || d.title_en, reason: 'Data kuantitatif (angka absolut/rincian) belum diisi' });
        }
      }
    });

    return incomplete;
  }, [reportDisclosures, perfData, managementData, reportingYear]);

  const isReadyToPrint = incompleteTopics.length === 0;

  const filteredDisclosures = reportDisclosures.filter(d => {
    if (activeFilter === 'UNIVERSAL') return d.gri_type === 'universal';
    if (activeFilter === 'TOPIC') return materialTopicIds.includes(d.id) && !d.disclosure_code.startsWith('IFRS'); 
    if (activeFilter === 'TCFD') return d.disclosure_code.startsWith('IFRS'); 
    return true; 
  });

  const ikhtisarData = useMemo(() => {
    const economic: GriDisclosure[] = [];
    const environment: GriDisclosure[] = [];
    const social: GriDisclosure[] = [];

    filteredDisclosures.forEach(d => {
      const details = getGriDetails(d.disclosure_code);
      if (details.type === 'narrative') return;

      if (d.disclosure_code.startsWith('20')) economic.push(d);
      else if (d.disclosure_code.startsWith('30') || d.disclosure_code.startsWith('IFRS')) environment.push(d);
      else if (d.disclosure_code.startsWith('40') || d.disclosure_code.startsWith('41')) social.push(d);
    });

    return { economic, environment, social };
  }, [filteredDisclosures]);

  const renderIkhtisarRow = (d: GriDisclosure) => {
    const details = getGriDetails(d.disclosure_code);
    return (
      <tr key={d.id} className="hover:bg-slate-50 border-b border-slate-100 transition print:break-inside-avoid">
        <td className="p-4 align-top">
          <span className="font-bold text-slate-800 block">{d.title_id || d.title_en}</span>
          <span className="text-[10px] font-mono text-slate-400">{d.disclosure_code}</span>
        </td>
        <td className="p-4 align-top text-center text-[10px] font-semibold text-slate-500">
          {details.unit}
        </td>
        {years.map(yr => {
          const yData = calculateTotal(d.disclosure_code, d.id, yr);
          const val = details.type === 'intensity' ? (yData.int || '-') : yData.abs;
          const isCurrentYear = yr === reportingYear;
          return (
            <td key={yr} className={`p-4 align-top text-center font-mono ${isCurrentYear ? 'font-black text-slate-900 bg-emerald-50/30 print:bg-slate-100' : 'font-medium text-slate-600'}`}>
              {val}
            </td>
          );
        })}
      </tr>
    );
  };

  return (
    <div className="space-y-8 pb-20 print:pb-0 print:space-y-0 print:bg-white">
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center print:shadow-none print:border-none print:p-0 print:mb-8">
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase print:border print:border-emerald-800 print:bg-transparent">GRI & IFRS S2 Standards</span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Laporan Kompilasi Keberlanjutan ({reportingYear})</h1>
          <p className="text-xs text-slate-500 mt-1">Tren kinerja 4-tahun <strong>({years[0]}–{years[3]})</strong> disusun berdasarkan <strong>{materialTopicIds.length} Topik Material</strong>.</p>
        </div>
        
        <div className="flex gap-3 print:hidden">
          {viewMode === 'kinerja' && (
            <button onClick={() => setExpandAll(!expandAll)} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs font-bold px-5 py-2.5 rounded-xl shadow-sm transition">
              {expandAll ? 'Tutup Semua Rincian' : 'Buka Semua Rincian'}
            </button>
          )}
          
          <button 
            onClick={() => isReadyToPrint && window.print()} 
            disabled={!isReadyToPrint}
            className={`${isReadyToPrint ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm' : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'} text-xs font-bold px-5 py-2.5 rounded-xl transition`}
          >
            🖨️ Cetak Full PDF {isReadyToPrint ? '' : '🔒'}
          </button>
        </div>
      </div>

      {!isReadyToPrint && viewMode !== 'referensi' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm print:hidden">
          <div className="text-red-500 text-3xl">⚠️</div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wider mb-2">Pencetakan Laporan Terkunci</h3>
            <p className="text-xs text-red-700 mb-4 leading-relaxed">
              Anda tidak dapat mencetak draf PDF sebelum seluruh indikator laporan terisi 100%. Terdapat <strong>{incompleteTopics.length} pengungkapan</strong> yang harus Anda lengkapi kembali di <span className="font-bold">Fase 3</span>:
            </p>
            <div className="bg-white border border-red-100 rounded-xl max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-100/50 text-red-800 border-b border-red-100 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold w-24">Kode</th>
                    <th className="p-3 font-bold">Judul Pengungkapan</th>
                    <th className="p-3 font-bold">Keterangan Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-50 text-slate-700">
                  {incompleteTopics.map((item, idx) => (
                    <tr key={idx} className="hover:bg-red-50/30">
                      <td className="p-3 font-mono font-bold text-red-600">{item.code}</td>
                      <td className="p-3 font-medium">{item.title}</td>
                      <td className="p-3 font-semibold text-red-500 flex items-center gap-2"><span>×</span> {item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-bold gap-1 w-max">
          {[{ id: 'ALL', label: 'Semua Laporan' }, { id: 'UNIVERSAL', label: 'GRI 2 (Wajib)' }, { id: 'TOPIC', label: `GRI Topik Material` }, { id: 'TCFD', label: 'IFRS S2 / TCFD' }].map(f => (
            <button key={f.id} onClick={() => setActiveFilter(f.id as any)} className={`px-4 py-2 rounded-lg ${activeFilter === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>{f.label}</button>
          ))}
        </div>
        
        <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-bold gap-1 w-max">
          <button onClick={() => setViewMode('ikhtisar')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'ikhtisar' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>📑 Ikhtisar Kinerja</button>
          <button onClick={() => setViewMode('kinerja')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'kinerja' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>📈 Tren Kinerja</button>
          <button onClick={() => setViewMode('referensi')} className={`px-4 py-2 rounded-lg transition ${viewMode === 'referensi' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>🔗 Indeks Referensi (Content Index)</button>
        </div>
      </div>

      {/* 🌟 MODE TAMPILAN 1: IKHTISAR KINERJA DENGAN GRAFIK VISUAL */}
      {viewMode === 'ikhtisar' && (
        <div className="space-y-6 print:space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:break-inside-avoid">
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:border-slate-300">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Tren Emisi GRK (tCO2e)</h3>
              <div className="h-48 w-full">
                {chartDataEmissions.some(d => d['Cakupan 1'] > 0 || d['Cakupan 2'] > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataEmissions} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="Cakupan 1" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Cakupan 2" stackId="a" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada data emisi</div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:border-slate-300">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">Tren Konsumsi Energi (GJ)</h3>
              <div className="h-48 w-full">
                {chartDataEnergy.some(d => d['Total Energi (GJ)'] > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDataEnergy} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="Total Energi (GJ)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada data energi</div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 print:border-slate-300">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Demografi Karyawan ({reportingYear})</h3>
              <p className="text-[9px] text-slate-400 mb-2">Berdasarkan Gender (GRI 405-1)</p>
              <div className="h-40 w-full relative">
                {chartDataGender.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartDataGender} innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none">
                        {chartDataGender.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-4">Belum ada data pekerja</div>
                )}
              </div>
            </div>

          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:overflow-visible">
            <div className="p-6 border-b border-slate-200 bg-slate-50 print:bg-white print:border-slate-800 print:border-b-2">
              <h2 className="text-lg font-bold text-slate-800">Tabel Ringkasan Metrik</h2>
            </div>
            <table className="w-full text-left border-collapse print:table-fixed">
              <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-bold print:bg-slate-100 print:text-black">
                <tr>
                  <th className="p-4 border-b border-slate-200 w-1/3">Indikator Kinerja</th>
                  <th className="p-4 border-b border-slate-200 w-24 text-center">Satuan</th>
                  {years.map(yr => <th key={yr} className="p-4 border-b border-slate-200 text-center">{yr}</th>)}
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 print:divide-slate-300">
                {ikhtisarData.economic.length > 0 && (
                  <>
                    <tr className="bg-slate-50 print:bg-slate-100"><td colSpan={6} className="p-3 font-bold text-emerald-800 print:text-black uppercase text-[10px] tracking-widest border-y border-slate-200 print:border-black">Pilar Kinerja Ekonomi & Bisnis</td></tr>
                    {ikhtisarData.economic.map(d => renderIkhtisarRow(d))}
                  </>
                )}
                {ikhtisarData.environment.length > 0 && (
                  <>
                    <tr className="bg-slate-50 print:bg-slate-100"><td colSpan={6} className="p-3 font-bold text-emerald-800 print:text-black uppercase text-[10px] tracking-widest border-y border-slate-200 print:border-black">Pilar Kinerja Lingkungan & Iklim</td></tr>
                    {ikhtisarData.environment.map(d => renderIkhtisarRow(d))}
                  </>
                )}
                {ikhtisarData.social.length > 0 && (
                  <>
                    <tr className="bg-slate-50 print:bg-slate-100"><td colSpan={6} className="p-3 font-bold text-emerald-800 print:text-black uppercase text-[10px] tracking-widest border-y border-slate-200 print:border-black">Pilar Kinerja Sosial & Ketenagakerjaan</td></tr>
                    {ikhtisarData.social.map(d => renderIkhtisarRow(d))}
                  </>
                )}
                {ikhtisarData.economic.length === 0 && ikhtisarData.environment.length === 0 && ikhtisarData.social.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tidak ada metrik kuantitatif yang dapat ditampilkan.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'kinerja' && (
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
                                                  <td className="p-2 pl-6 text-slate-600 border-l-2 border-slate-300 print:text-black">↳ {(perfData[d.id]?.[0]?.breakdownItems || getGriDetails(d.disclosure_code).defaultItems || []).find((i:any)=>i.id === subId)?.name || subId}</td>
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
      )}

      {viewMode === 'referensi' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 print:border-none print:shadow-none print:overflow-visible">
          <div className="p-6 border-b border-slate-200 bg-slate-50 print:bg-white print:border-slate-800 print:border-b-2">
            <h2 className="text-lg font-bold text-slate-800">Indeks Konten GRI & Referensi Silang Regulasi</h2>
            <p className="text-xs text-slate-500 mt-1">Tabel ini memetakan pengungkapan laporan terhadap Sustainable Development Goals (SDGs), POJK 51/2017, dan UN Global Compact.</p>
          </div>
          <table className="w-full text-left border-collapse print:table-fixed">
            <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider font-bold print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-4 w-28 border-b border-slate-200 print:border-black">Kode GRI</th>
                <th className="p-4 border-b border-slate-200 print:border-black">Judul Pengungkapan Standar</th>
                <th className="p-4 w-32 border-b border-slate-200 print:border-black text-center">Tautan SDG</th>
                <th className="p-4 w-32 border-b border-slate-200 print:border-black text-center">POJK 51/2017</th>
                <th className="p-4 w-32 border-b border-slate-200 print:border-black text-center">UNGC / TCFD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 print:divide-slate-300">
              {filteredDisclosures.map((d) => {
                const refs = getCrossReferenceMap(d.disclosure_code);
                const isTcfd = d.disclosure_code.startsWith('IFRS');
                return (
                  <tr key={d.id} className="hover:bg-slate-50 transition print:break-inside-avoid">
                    <td className="p-4 font-mono font-bold align-top">
                      <span className={`px-2 py-0.5 rounded ${isTcfd ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {d.disclosure_code}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 align-top">{d.title_id || d.title_en}</td>
                    <td className="p-4 align-top text-center">
                      <span className={`font-bold ${refs.sdg !== '-' ? 'text-blue-600' : 'text-slate-300'}`}>{refs.sdg}</span>
                    </td>
                    <td className="p-4 align-top text-center">
                      <span className={`font-bold ${refs.pojk !== '-' ? 'text-purple-600' : 'text-slate-300'}`}>{refs.pojk}</span>
                    </td>
                    <td className="p-4 align-top text-center">
                      <span className={`font-bold ${refs.ungc !== '-' ? 'text-orange-600' : 'text-slate-300'}`}>{refs.ungc}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredDisclosures.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada pengungkapan yang dipilih.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}