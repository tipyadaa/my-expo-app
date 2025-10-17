// src/lib/hooks/useReport.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchTransactionsMine,
  fetchProfileMe,
  fetchPackages,
  filterByDateRange,
  buildDailySeriesInMonth,
  buildOverview,
  SureSureTransaction,
} from "../service/reportService";

const keys = {
  base: ["report"] as const,
  txMine: () => [...keys.base, "txMine"] as const,
  profile: () => [...keys.base, "profile"] as const,
  packages: () => [...keys.base, "packages"] as const,
};

export function useReportData(opts: {
  startDate?: string;   // "YYYY-MM-DD"
  endDate?: string;     // "YYYY-MM-DD"
  monthYYYYMM: string;  // "YYYY-MM"
  statusFilter?: string; // optional filter (เช่น TRANSACTION_SUCCESSFUL)
}) {
  const { startDate, endDate, monthYYYYMM, statusFilter } = opts;

  const txQ = useQuery({
    queryKey: keys.txMine(),
    queryFn: fetchTransactionsMine,
  });

  // profile + packages (ถ้าอยากใช้ quota/package name ในอนาคต)
  const profileQ = useQuery({ queryKey: keys.profile(), queryFn: fetchProfileMe });
  const pkgQ = useQuery({ queryKey: keys.packages(), queryFn: fetchPackages });

  // คำนวณข้อมูลที่ต้องใช้ในหน้า
  const filtered = useMemo(() => {
    const all = (txQ.data ?? []) as SureSureTransaction[];
    const byDate = filterByDateRange(all, startDate, endDate);
    const byStatus = statusFilter ? byDate.filter((r) => r.status === statusFilter) : byDate;
    // หน้า table ไม่เอา ERROR
    return byStatus.filter((r) => !r || !r.status || r.status !== "ERROR");
  }, [txQ.data, startDate, endDate, statusFilter]);

  const overview = useMemo(() => buildOverview(filtered), [filtered]);
  const chartDailyInMonth = useMemo(
    () => buildDailySeriesInMonth(txQ.data ?? [], monthYYYYMM),
    [txQ.data, monthYYYYMM]
  );

  return {
    isLoading: txQ.isLoading,
    isError: txQ.isError,
    transactions: txQ.data ?? [],
    profile: profileQ.data,
    packages: pkgQ.data ?? [],
    tableRows: filtered,
    overview,
    chartDailyInMonth,
    refetchAll: () => Promise.all([txQ.refetch(), profileQ.refetch(), pkgQ.refetch()]),
  };
}
