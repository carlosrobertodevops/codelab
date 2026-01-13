
import { getNewUsersStats, getPurchasedCoursesStats } from "@/actions/stats";
import { StatsCharts } from "@/components/pages/admin/stats-charts";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const newUsersStats = await getNewUsersStats();
  const purchasedCoursesStats = await getPurchasedCoursesStats();

  return (
    <>
      <StatsCharts
        newUsersStats={newUsersStats}
        purchasedCoursesStats={purchasedCoursesStats}
      />
    </>
  );
}
