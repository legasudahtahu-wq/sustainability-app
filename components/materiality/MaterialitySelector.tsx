"use client";

import { useState } from 'react';
import { GriDisclosure } from '@/types/database';

interface MaterialitySelectorProps {
  disclosures: GriDisclosure[];
  selectedTopicIds: string[];
  setSelectedTopicIds: (ids: string[]) => void;
  onNext: () => void;
}

export function MaterialitySelector({ disclosures, selectedTopicIds, setSelectedTopicIds, onNext }: MaterialitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'UNIVERSAL' | '200' | '300' | '400' | 'TCFD'>('UNIVERSAL');

  const toggleTopic = (id: string) => {
    if (selectedTopicIds.includes(id)) {
      setSelectedTopicIds(selectedTopicIds.filter(tId => tId !== id));
    } else {
      setSelectedTopicIds([...selectedTopicIds, id]);
    }
  };

  const getDisclosureDescription = (code: string) => {
    // SUNTIKAN DESKRIPSI TCFD
    if (code === 'IFRS-S2-1') return 'Pengungkapan hasil Uji Stres Risiko Iklim (CRST) tingkat korporat, mencakup skenario yang digunakan, serta proyeksi dampaknya terhadap Probability of Default (PD) dan Ketahanan Modal (CAR).';
    if (code === 'IFRS-S2-2') return 'Pengungkapan target penurunan emisi yang dibiayai (Financed Emissions) serta penetapan Harga Karbon Internal (Internal Carbon Pricing) perusahaan.';
    
    if (code === '302-3') return 'Rasio energi yang digunakan untuk setiap unit aktivitas/produksi. Menunjukkan efisiensi penggunaan energi oleh organisasi.';
    if (code === '305-4') return 'Rasio emisi Gas Rumah Kaca (Cakupan 1 & 2) terhadap metrik spesifik organisasi (misal: per ton produk atau per pendapatan).';
    if (code === '2-7') return 'Total jumlah karyawan yang bekerja untuk organisasi, dirinci berdasarkan jenis kontrak (tetap/sementara) dan jam kerja (penuh/paruh waktu).';
    if (code === '405-1') return 'Komposisi karyawan dan badan tata kelola perusahaan yang dirinci berdasarkan kategori keberagaman seperti jenis kelamin dan kelompok usia.';
    if (code === '204-1') return 'Persentase atau nilai anggaran pengadaan yang dibelanjakan untuk pemasok lokal di area operasi signifikan organisasi.';
    if (code === '302-1') return 'Total konsumsi energi di dalam organisasi dari berbagai sumber bahan bakar, baik yang tidak terbarukan (fosil) maupun terbarukan.';
    if (code === '303-3') return 'Total volume air yang ditarik/diambil oleh organisasi, dirinci berdasarkan sumbernya (air tanah, permukaan, atau suplai pihak ketiga).';
    if (code.startsWith('306')) return 'Total berat limbah yang dihasilkan dalam operasi perusahaan, wajib dipisahkan berdasarkan kategori Limbah Berbahaya (B3) dan Tidak Berbahaya (Non-B3).';
    if (code === '2-1') return 'Melaporkan nama entitas hukum, sifat kepemilikan/bentuk hukum, lokasi kantor pusat, dan negara tempat entitas beroperasi.';
    if (code === '2-2') return 'Menjelaskan entitas (anak perusahaan, cabang, joint venture) yang dicakup dalam pelaporan keberlanjutan ini.';
    if (code === '2-3') return 'Menyebutkan periode pelaporan (misal: 1 Jan - 31 Des), frekuensi penerbitan, dan kontak penanggung jawab.';
    if (code === '2-4') return 'Menjelaskan penyajikan kembali informasi jika ada revisi atau koreksi dari data yang dilaporkan pada tahun-tahun sebelumnya.';
    if (code === '2-5') return 'Menjelaskan kebijakan dan praktik jaminan eksternal (external assurance) yang memvalidasi laporan ini.';
    if (code === '2-6') return 'Menjabarkan sektor operasi operasional, produk/jasa utama, pasar yang dilayani, serta struktur rantai pasokan perusahaan.';
    if (code === '2-9') return 'Menjelaskan struktur tata kelola perusahaan, termasuk komposisi dan komite-komite di bawah dewan direksi/komisaris.';
    if (code === '2-10') return 'Menguraikan proses serta kriteria (seperti keahlian, keanekaragaman, independensi) dalam mencalonkan dan memilih anggota tata kelola.';
    if (code === '2-11') return 'Menjelaskan apakah Ketua Badan Tata Kelola (Presiden Komisaris/Ketua Dewan) merangkap jabatan eksekutif lainnya beserta alasannya.';
    if (code === '2-12') return 'Menguraikan bagaimana peran dewan dalam mengawasi pengelolaan dampak ekonomi, lingkungan, dan sosial organisasi.';
    if (code === '2-13') return 'Menjelaskan bagaimana wewenang pengelolaan dampak keberlanjutan didelegasikan dari dewan kepada pimpinan eksekutif senior.';
    if (code === '2-14') return 'Menjelaskan proses badan tata kelola tertinggi dalam meninjau dan secara resmi menyetujui laporan keberlanjutan ini.';
    if (code === '2-15') return 'Menguraikan mekanisme tata kelola dalam perusahaan untuk mengidentifikasi, mencegah, dan mengelola konflik/benturan kepentingan.';
    if (code === '2-16') return 'Menjelaskan mekanisme bagaimana keluhan atau masalah kritis dikomunikasikan secara langsung ke dewan pengawas.';
    if (code.startsWith('2-')) return 'Pengungkapan naratif mengenai praktik tata kelola, strategi, atau kebijakan organisasi sesuai pedoman GRI 2.';
    if (code === '201-1') return 'Nilai ekonomi langsung yang dihasilkan (Pendapatan) dan didistribusikan (Biaya Operasional, Gaji, Pajak, dll).';
    if (code.startsWith('305-1')) return 'Emisi GRK Langsung (Cakupan 1) dari sumber yang dimiliki/dikendalikan organisasi (misal: pembakaran bahan bakar di pabrik atau kendaraan).';
    if (code.startsWith('305-2')) return 'Emisi GRK Energi Tidak Langsung (Cakupan 2) dari pembangkitan listrik, pemanasan, atau pendinginan yang dibeli dan dikonsumsi.';
    if (code.startsWith('201') || code.startsWith('203') || code.startsWith('207')) return 'Dampak ekonomi historis, nilai yang didistribusikan, atau kontribusi keuangan organisasi secara langsung.';
    if (code.startsWith('202') || code.startsWith('308') || code.startsWith('414')) return 'Rasio, perbandingan standar, atau persentase pemenuhan kriteria keberlanjutan rantai pasok dan masyarakat.';
    if (code.startsWith('205') || code.startsWith('206') || code.startsWith('403') || code.startsWith('418')) return 'Jumlah total insiden, kasus pelanggaran, atau kejadian yang tercatat selama periode pelaporan.';
    if (code.startsWith('301')) return 'Jumlah material (bahan baku) yang digunakan dalam proses operasi atau produksi.';
    if (code.startsWith('305')) return 'Inventarisasi Gas Rumah Kaca (GRK) organisasi sesuai standar emisi karbon global.';
    if (code.startsWith('304')) return 'Cakupan luasan area operasional yang memiliki dampak langsung terhadap wilayah keanekaragaman hayati.';
    if (code.startsWith('401')) return 'Total jumlah individu terkait indikator ketenagakerjaan atau perputaran tenaga kerja.';
    if (code.startsWith('402')) return 'Rata-rata waktu pemberitahuan standar terkait perubahan operasional yang krusial.';
    if (code.startsWith('404')) return 'Rata-rata jam pelatihan yang diselesaikan oleh karyawan dalam satu tahun berjalan.';
    if (code.startsWith('413')) return 'Persentase operasi atau area yang memiliki program pelibatan masyarakat lokal secara aktif.';
    return 'Deskripsi pengungkapan topik spesifik keberlanjutan.';
  };

  const filteredDisclosures = disclosures.filter(d => {
    const matchSearch = d.disclosure_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (d.title_id || d.title_en || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchTab = activeTab === 'UNIVERSAL' ? d.gri_type === 'universal' :
                     activeTab === '200' ? d.disclosure_code.startsWith('2') && d.gri_type === 'topic' :
                     activeTab === '300' ? d.disclosure_code.startsWith('3') :
                     activeTab === '400' ? d.disclosure_code.startsWith('4') : 
                     activeTab === 'TCFD' ? d.disclosure_code.startsWith('IFRS') : true;

    return matchSearch && matchTab;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[850px] print:h-auto print:border-none print:shadow-none">
      
      {/* HEADER */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10 print:bg-white print:border-b-2 print:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800">1. Pemilihan Topik Keberlanjutan</h2>
          <p className="text-xs text-slate-500 mt-1">Daftar standar spesifik yang dipertimbangkan untuk dilaporkan.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto print:hidden">
          <input type="text" placeholder="Cari kode atau judul..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-64 p-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
          <button onClick={() => window.print()} className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow whitespace-nowrap">🖨️ Cetak PDF</button>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex flex-wrap bg-slate-900 text-white text-[11px] font-bold font-mono print:hidden">
        <button onClick={() => setActiveTab('UNIVERSAL')} className={`flex-1 py-3 px-2 transition ${activeTab === 'UNIVERSAL' ? 'bg-emerald-600' : 'hover:bg-slate-800'}`}>GRI 2 (UMUM)</button>
        <button onClick={() => setActiveTab('200')} className={`flex-1 py-3 px-2 transition ${activeTab === '200' ? 'bg-emerald-600' : 'hover:bg-slate-800'}`}>GRI 200 (EKONOMI)</button>
        <button onClick={() => setActiveTab('300')} className={`flex-1 py-3 px-2 transition ${activeTab === '300' ? 'bg-emerald-600' : 'hover:bg-slate-800'}`}>GRI 300 (LINGKUNGAN)</button>
        <button onClick={() => setActiveTab('400')} className={`flex-1 py-3 px-2 transition ${activeTab === '400' ? 'bg-emerald-600' : 'hover:bg-slate-800'}`}>GRI 400 (SOSIAL)</button>
        <button onClick={() => setActiveTab('TCFD')} className={`flex-1 py-3 px-2 transition border-l border-slate-700 ${activeTab === 'TCFD' ? 'bg-blue-600' : 'bg-slate-800 hover:bg-slate-700 text-blue-300'}`}>IFRS S2 / TCFD</button>
      </div>

      {/* CONTAINER UTAMA (PETUNJUK + DAFTAR TOPIK) */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 print:bg-white print:overflow-visible print:p-0 print:mt-6">
        
        {/* KOTAK PETUNJUK SELEKSI TOPIK (4 PERTIMBANGAN) */}
        <div className="mb-6 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl shadow-sm print:hidden">
          <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-2">
            <span>💡</span>
            <span>Panduan Memilih Topik (Centang jika memenuhi <u>MINIMAL SALAH SATU</u> dari 4 kriteria berikut):</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px] text-slate-700">
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
              <strong className="text-emerald-800 block mb-0.5">1. Relevansi Sektor</strong>
              Isu umum atau rekomendasi untuk sektor bisnis Anda.
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
              <strong className="text-emerald-800 block mb-0.5">2. Keterkaitan Operasi</strong>
              Bersinggungan langsung dengan operasi / rantai pasok.
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
              <strong className="text-emerald-800 block mb-0.5">3. Kepatuhan Regulasi</strong>
              Diwajibkan oleh undang-undang, pemerintah, atau bursa.
            </div>
            <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
              <strong className="text-emerald-800 block mb-0.5">4. Sorotan Stakeholder</strong>
              Dituntut oleh investor, masyarakat, atau konsumen.
            </div>
          </div>
        </div>

        {/* DAFTAR TOPIK */}
        <div className="space-y-3">
          {filteredDisclosures.map(d => {
            const isUniversal = d.gri_type === 'universal';
            const isChecked = isUniversal || selectedTopicIds.includes(d.id);
            const isTcfd = d.disclosure_code.startsWith('IFRS');
            
            return (
              <label key={d.id} className={`flex gap-4 p-4 rounded-xl border transition cursor-pointer shadow-sm print:break-inside-avoid print:shadow-none print:border-b ${isChecked ? (isTcfd ? 'bg-blue-50/50 border-blue-300 print:border-slate-300' : 'bg-white border-emerald-300 print:border-slate-300') : 'bg-white border-slate-200 hover:border-emerald-200 print:hidden'}`}>
                <div className="pt-1 print:hidden">
                  <input type="checkbox" checked={isChecked} onChange={() => !isUniversal && toggleTopic(d.id)} disabled={isUniversal} className={`w-5 h-5 rounded cursor-pointer disabled:opacity-60 ${isTcfd ? 'accent-blue-600' : 'accent-emerald-600'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded inline-block w-max print:bg-transparent print:border print:text-[10px] ${isTcfd ? 'text-blue-700 bg-blue-100 print:border-blue-600' : 'text-emerald-700 bg-emerald-100 print:border-emerald-600'}`}>{d.disclosure_code}</span>
                    <span className="text-sm font-bold text-slate-800">{d.title_id || d.title_en}</span>
                    {isUniversal && <span className="text-[9px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded uppercase w-max print:border print:bg-transparent">Wajib</span>}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed print:text-black">{getDisclosureDescription(d.disclosure_code)}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-5 border-t border-slate-200 bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 print:hidden">
        <div>
          <span className="text-xs font-bold text-slate-600">Total Topik Terpilih: </span>
          <span className="font-mono font-bold text-emerald-600 text-lg">{selectedTopicIds.length}</span>
        </div>
        <button onClick={onNext} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-8 rounded-xl transition shadow flex items-center gap-2">
          Lanjut ke Matriks <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  );
}