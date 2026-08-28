import { SpecialRequestsTable } from "@/components/admin/SpecialRequestsTable";
import { getSpecialRequests } from "@/services/specialRequests";

export const metadata = {
  title: "Sol·licituds especials · Administració",
};

export default async function SolLicitudsPage() {
  const requests = await getSpecialRequests();

  return <SpecialRequestsTable initialRequests={requests} />;
}
