import { GriDisclosure } from '@/types/database';

interface DisclosureTableProps {
  disclosures: GriDisclosure[];
}

export function DisclosureTable({ disclosures }: DisclosureTableProps) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-slate-100 text-slate-700">
            <th className="p-3 border-b border-slate-200 font-semibold">Kode Standar</th>
            <th className="p-3 border-b border-slate-200 font-semibold">Kode Indikator</th>
            <th className="p-3 border-b border-slate-200 font-semibold">Pengungkapan (ID)</th>
            <th className="p-3 border-b border-slate-200 font-semibold">Tipe</th>
            <th className="p-3 border-b border-slate-200 font-semibold">Satuan Default</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {disclosures.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50 transition">
              <td className="p-3 text-slate-600 font-medium">{item.standard_code}</td>
              <td className="p-3 font-mono font-bold text-emerald-600">{item.disclosure_code}</td>
              <td className="p-3 text-slate-800">{item.title_id || item.title_en}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                  item.gri_type === 'universal' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                }`}>
                  {item.gri_type}
                </span>
              </td>
              <td className="p-3 text-slate-500">{item.unit_default || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}