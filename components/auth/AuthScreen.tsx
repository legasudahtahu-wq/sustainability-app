"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [regMode, setRoleMode] = useState<'new_org' | 'join_org'>('new_org'); // Pilihan: Buat Perusahaan Baru ATAU Gabung
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [orgCodeInput, setOrgCodeInput] = useState('');
  const [role, setRole] = useState<'inputter' | 'reviewer'>('inputter');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fungsi pembuat Kode Organisasi Unik
  const generateOrgCode = (name: string) => {
    const prefix = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'ESG';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanEmail = email.trim();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
      } else {
        // 1. Buat Akun Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: cleanEmail, password });
        if (authError) throw authError;
        if (!authData.user) throw new Error("Gagal mendaftarkan pengguna.");

        let targetOrgId = '';
        let targetCompName = '';

        if (regMode === 'new_org') {
          // MODUS A: BUAT PERUSAHAAN BARU (PENDAFTAR PERTAMA)
          if (!companyName.trim()) throw new Error("Nama Perusahaan wajib diisi.");
          
          targetCompName = companyName.trim();
          const newCode = generateOrgCode(targetCompName);

          const { data: newOrg, error: orgErr } = await supabase
            .from('organizations')
            .insert({ name: targetCompName, code: newCode })
            .select('id, name, code')
            .single();

          if (orgErr) throw orgErr;
          targetOrgId = newOrg.id;

          alert(`Pendaftaran Berhasil!\n\nKode Perusahaan Anda adalah: ${newCode}\nBerikan kode ini kepada rekan tim Anda untuk bergabung.`);

        } else {
          // MODUS B: GABUNG PERUSAHAAN LAMA (USER BERIKUTNYA)
          if (!orgCodeInput.trim()) throw new Error("Kode Perusahaan wajib diisi.");

          const searchCode = orgCodeInput.trim().toUpperCase();

          const { data: existingOrg, error: findErr } = await supabase
            .from('organizations')
            .select('id, name, code')
            .eq('code', searchCode)
            .maybeSingle();

          if (findErr || !existingOrg) {
            throw new Error(`Kode Perusahaan "${searchCode}" tidak ditemukan. Silakan periksa kembali kode dari pendaftar pertama.`);
          }

          targetOrgId = existingOrg.id;
          targetCompName = existingOrg.name;
        }

        // 2. Simpan Profil Pengguna
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: cleanEmail,
            company_name: targetCompName,
            organization_id: targetOrgId,
            role: role,
            updated_at: new Date()
          });

        // 3. Pastikan Wadah Laporan Perusahaan Sudah Ada
        const { data: existingReport } = await supabase
          .from('esg_reports')
          .select('id')
          .eq('organization_id', targetOrgId)
          .maybeSingle();

        if (!existingReport) {
          await supabase
            .from('esg_reports')
            .insert({
              user_id: authData.user.id,
              organization_id: targetOrgId,
              updated_at: new Date()
            });
        }

        if (regMode === 'join_org') {
          alert(`Pendaftaran Berhasil!\n\nAnda telah terhubung dengan ${targetCompName}. Silakan login.`);
        }
        setIsLogin(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal melakukan otentikasi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-slate-900 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
        <div className="text-center mb-6">
          <span className="text-3xl">🌱</span>
          <h1 className="text-lg font-bold text-slate-800 mt-2 leading-tight">Sustainability Report Platform</h1>
          <p className="text-xs text-slate-500 mt-1">Sistem Pelaporan Keberlanjutan & Iklim Terpadu</p>
        </div>

        {/* TAB NAVIGASI UTAMA */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-lg transition ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            1. Masuk (Login)
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`flex-1 py-2.5 rounded-lg transition ${!isLogin ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            2. Daftar Akun
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Metode Pendaftaran:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setRoleMode('new_org')}
                  className={`p-2.5 rounded-lg border text-center transition ${regMode === 'new_org' ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  🏢 Pendaftar Pertama<br/><span className="text-[9px] font-normal opacity-75">(Buat Perusahaan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRoleMode('join_org')}
                  className={`p-2.5 rounded-lg border text-center transition ${regMode === 'join_org' ? 'bg-blue-50 border-blue-500 text-blue-800 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}
                >
                  🔑 User Berikutnya<br/><span className="text-[9px] font-normal opacity-75">(Gabung Pakai Kode)</span>
                </button>
              </div>

              {regMode === 'new_org' ? (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Perusahaan / Organisasi</label>
                  <input 
                    type="text" 
                    required 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="Contoh: PT Persada Nusantara" 
                    className="w-full p-2.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800" 
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Sistem akan membuatkan Kode Perusahaan otomatis untuk tim Anda.</span>
                </div>
              ) : (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-blue-900 mb-1">Masukkan Kode Perusahaan</label>
                  <input 
                    type="text" 
                    required 
                    value={orgCodeInput} 
                    onChange={(e) => setOrgCodeInput(e.target.value)} 
                    placeholder="Contoh: PERSAD-8921" 
                    className="w-full p-2.5 text-xs border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-blue-900 uppercase" 
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Minta kode ini dari pendaftar pertama perusahaan Anda.</span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="nama@perusahaan.com" 
              className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="w-full p-3 pr-10 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm focus:outline-none"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peran Akses (*Role*)</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              >
                <option value="inputter">Inputter (Pengisi Data & Pengelola Sektor)</option>
                <option value="reviewer">Reviewer (Peninjau Laporan & Cetak PDF)</option>
              </select>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full font-bold py-3 text-xs rounded-xl transition shadow text-white ${isLogin ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            {loading ? "Memproses..." : (isLogin ? "Masuk ke Aplikasi" : "Daftar & Hubungkan Akun")}
          </button>
        </form>

        {/* 🌟 LABEL POWERED BY DI SINI */}
        <div className="mt-8 text-center text-xs text-slate-400">
          Powered by <span className="font-bold text-slate-700">Shared Value Indonesia</span>
        </div>

      </div>
    </div>
  );
}