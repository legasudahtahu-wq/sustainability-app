import { getGriDisclosures } from '@/services/disclosureService';
import { MainDashboard } from '@/components/layout/MainDashboard';

export default async function HomePage() {
  // Menarik data dari database di sisi server
  const disclosures = await getGriDisclosures();

  // Memanggil kerangka Dashboard yang memiliki menu navigasi (Sidebar)
  return <MainDashboard disclosures={disclosures} />;
}