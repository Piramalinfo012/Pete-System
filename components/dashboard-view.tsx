"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Filter,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  LayoutDashboard,
  PieChart as PieChartIcon,
  Loader2,
  FileSpreadsheet,
  Download,
  Calendar,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// --- INTERFACES ---
interface Transaction {
  id: string;
  personName: string;
  userId: string;
  date: string;
  incoming: number;
  outgoing: number;
  mode: string;
  groupHead: string;
  reason: string;
}

interface AppUser {
  id: string;
  name: string;
  role: "user" | "admin";
  pages: string[];
}

interface Filters {
  dateFrom: string;
  dateTo: string;
  personName: string;
  groupHead: string;
  reason: string;
  mode: string;
}

interface DropdownOptions {
  personNames: string[];
  reasons: string[];
  groupHeads: string[];
  modes: string[];
}

// --- GOOGLE SHEET CONSTANTS ---
const SHEET_ID = "1FQwLNqZMJHttaOQnI6Xna5nghHOgQXyWOUfGLAfsfko";
const DATA_SHEET_NAME = "Data";
const MASTER_SHEET_NAME = "Master";

// --- HELPER FUNCTIONS ---
const formatXAxisDate = (tickItem: string): string => {
  if (!tickItem) return "";
  try {
    const date = new Date(tickItem);
    if (isNaN(date.getTime())) return tickItem;
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  } catch (e) {
    return tickItem;
  }
};

const parseSheetDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;
  const match =
    typeof dateValue === "string" && dateValue.match(/Date\((\d+),(\d+),(\d+)/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    return new Date(year, month, day);
  }
  const d = new Date(dateValue);
  if (!isNaN(d.getTime())) return d;
  return null;
};

const formatMonthLabel = (ym: string): string => {
  if (!ym || ym === "all") return "All Months";
  try {
    const [year, month] = ym.split("-");
    const dateObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return dateObj.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  } catch {
    return ym;
  }
};

// --- UI COMPONENTS ---
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);
const CardHeader = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-5 py-4 border-b border-slate-100 ${className}`}>
    {children}
  </div>
);
const CardTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3
    className={`text-base font-bold text-slate-800 flex items-center gap-2.5 ${className}`}
  >
    {children}
  </h3>
);
const CardContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-5 ${className}`}>{children}</div>;
const Button = ({
  children,
  onClick,
  variant = "default",
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: string;
  className?: string;
  disabled?: boolean;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  const variantClasses =
    variant === "outline"
      ? "border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 shadow-sm"
      : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-sm shadow-purple-500/20";
  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm text-slate-800 placeholder-slate-400 ${
      props.className || ""
    }`}
  />
);
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={`block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 ${
      props.className || ""
    }`}
  />
);
const Select = ({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
}) => (
  <select
    {...props}
    className={`w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all text-sm cursor-pointer text-slate-800 ${
      props.className || ""
    }`}
  >
    {children}
  </select>
);
const SelectItem = (props: React.OptionHTMLAttributes<HTMLOptionElement>) => (
  <option {...props}>{props.children}</option>
);
const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: string;
  className?: string;
}) => {
  const base = "px-2.5 py-0.5 text-xs font-semibold rounded-lg inline-flex items-center gap-1";
  const variants: { [key: string]: string } = {
    default: "bg-purple-100 text-purple-700 border border-purple-200/60",
    secondary: "bg-slate-100 text-slate-700 border border-slate-200/60",
    success: "bg-emerald-100 text-emerald-700 border border-emerald-200/60",
    danger: "bg-rose-100 text-rose-700 border border-rose-200/60",
    info: "bg-sky-100 text-sky-700 border border-sky-200/60",
  };
  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

// --- DASHBOARD VIEW COMPONENT ---
function DashboardView({ currentUser }: { currentUser: AppUser }) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<Filters>({
    dateFrom: "",
    dateTo: "",
    personName: "all",
    groupHead: "all",
    reason: "all",
    mode: "all",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState("all");
  const [exportGroupHead, setExportGroupHead] = useState("all");

  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    personNames: [],
    reasons: [],
    groupHeads: [],
    modes: [],
  });


  useEffect(() => {
    const fetchSheetData = async () => {
      setIsLoading(true);
      setError(null);

      const appScriptUrl =
        "https://script.google.com/macros/s/AKfycbwJn_U3Js50o2YdBN9DFaErLYXKWEDluUf1JjQJGet7d_TN7-O8ZaRWU3bxnf_nc7jAGw/exec";

      try {
        const [dataRes, masterRes] = await Promise.all([
          fetch(`${appScriptUrl}?sheet=${DATA_SHEET_NAME}&action=fetch`),
          fetch(`${appScriptUrl}?sheet=${MASTER_SHEET_NAME}&action=fetch`),
        ]);


        if (!dataRes.ok) throw new Error("Failed to fetch transaction data.");
        const dataJson = await dataRes.json();
        if (!dataJson.success || !dataJson.data)
          throw new Error("Invalid transaction data format.");

        const transactions: Transaction[] = dataJson.data
          .slice(1)
          .map((row: any, index: number) => ({
            id: `${row[0]}-${index}`,
            date: parseSheetDate(row[2])?.toISOString().split("T")[0] || null,
            personName: row[1] || "",
            userId: row[1] || "",
            incoming: parseFloat(row[3]) || 0,
            outgoing: parseFloat(row[4]) || 0,
            mode: row[5] || "",
            groupHead: row[6] || "",
            reason: row[7] || "",
          }))
          .filter((t: any): t is Transaction => t.date);

        transactions.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAllTransactions(transactions);


        if (!masterRes.ok) throw new Error("Failed to fetch Master data.");
        const masterJson = await masterRes.json();
        if (!masterJson.success || !masterJson.data)
          throw new Error("Invalid Master data format.");

        const masterRows = masterJson.data.slice(1);
        const personNames = new Set<string>();
        const reasons = new Set<string>();
        const groupHeads = new Set<string>();
        const modes = new Set<string>();

        masterRows.forEach((row: any) => {
          if (row[0]) personNames.add(row[0]);
          if (row[1]) modes.add(row[1]);
          if (row[2]) groupHeads.add(row[2]);
          if (row[6]) reasons.add(row[6]);
        });

        setDropdownOptions({
          personNames: Array.from(personNames),
          reasons: Array.from(reasons),
          groupHeads: Array.from(groupHeads),
          modes: Array.from(modes),
        });
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching sheet data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSheetData();
  }, []);

  const filteredTransactions = useMemo(() => {
    let userVisibleTransactions = 
    currentUser.role === "admin"
      ? allTransactions
      : allTransactions.filter((t) => t.personName === currentUser.name);

    return userVisibleTransactions.filter((t) => {
      if (filters.dateFrom && t.date < filters.dateFrom) return false;
      if (filters.dateTo && t.date > filters.dateTo) return false;
      if (filters.personName !== "all" && t.personName !== filters.personName)
        return false;
      if (filters.groupHead !== "all" && t.groupHead !== filters.groupHead)
        return false;
      if (filters.mode !== "all" && t.mode !== filters.mode) return false;
      if (filters.reason !== "all" && t.reason !== filters.reason) return false;
      return true;
    });
  }, [allTransactions, filters, currentUser]);

  const totalIncoming = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.incoming, 0),
    [filteredTransactions]
  );
  // const totalOutgoing = useMemo(
  //   () => filteredTransactions.reduce((sum, t) => sum + t.outgoing, 0),
  //   [filteredTransactions]
  // );

  const totalOutgoing = useMemo(
     () => filteredTransactions.reduce((sum, t) => sum + t.outgoing, 0),
     [filteredTransactions]
   );

  // console.log("totalOutgoing",totalOutgoing);

  const balance = totalIncoming - totalOutgoing;

  const timeSeriesData = useMemo(() => {
    const dailyData = new Map<
      string,
      { date: string; income: number; expense: number }
    >();
    const sorted = [...filteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let cumulativeBalance = 0;
    sorted.forEach((t) => {
      const dateKey = t.date;
      if (!dailyData.has(dateKey))
        dailyData.set(dateKey, { date: dateKey, income: 0, expense: 0 });
      const entry = dailyData.get(dateKey)!;
      entry.income += t.incoming;
      entry.expense += t.outgoing;
    });
    return Array.from(dailyData.values()).map((d) => {
      cumulativeBalance += d.income - d.expense;
      return { ...d, balance: cumulativeBalance };
    });
  }, [filteredTransactions]);

  const expenseByGroupHeadData = useMemo(() => {
    const groupMap = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      if (t.outgoing > 0 && t.groupHead) {
        groupMap.set(
          t.groupHead,
          (groupMap.get(t.groupHead) || 0) + t.outgoing
        );
      }
    });
    return Array.from(groupMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredTransactions]);

  const recentTransactions = useMemo(
    () => filteredTransactions.slice(0, 5),
    [filteredTransactions]
  );
  const handleFilterChange = (name: keyof Filters, value: string) =>
    setFilters((prev) => ({ ...prev, [name]: value }));
  const clearFilters = () =>
    setFilters({
      dateFrom: "",
      dateTo: "",
      personName: "all",
      groupHead: "all",
      reason: "all",
      mode: "all",
    });

  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, string>();
    allTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        const ym = t.date.substring(0, 7);
        if (!monthsMap.has(ym)) {
          monthsMap.set(ym, formatMonthLabel(ym));
        }
      }
    });
    return Array.from(monthsMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allTransactions]);

  const exportPreviewData = useMemo(() => {
    let userTransactions =
      currentUser.role === "admin"
        ? allTransactions
        : allTransactions.filter((t) => t.personName === currentUser.name);

    if (exportMonth !== "all") {
      userTransactions = userTransactions.filter((t) => t.date.startsWith(exportMonth));
    }
    if (exportGroupHead !== "all") {
      userTransactions = userTransactions.filter((t) => t.groupHead === exportGroupHead);
    }

    const groupMap = new Map<string, { total: number; count: number }>();
    let totalExpense = 0;

    userTransactions.forEach((t) => {
      if (t.outgoing > 0) {
        const g = t.groupHead || "Uncategorized";
        const curr = groupMap.get(g) || { total: 0, count: 0 };
        curr.total += t.outgoing;
        curr.count += 1;
        groupMap.set(g, curr);
        totalExpense += t.outgoing;
      }
    });

    const list = Array.from(groupMap.entries())
      .map(([groupHead, { total, count }]) => ({
        groupHead,
        total,
        count,
        share: totalExpense > 0 ? (total / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    return { list, totalExpense };
  }, [allTransactions, exportMonth, exportGroupHead, currentUser]);

  const handleDownloadExcel = () => {
    let userTransactions =
      currentUser.role === "admin"
        ? allTransactions
        : allTransactions.filter((t) => t.personName === currentUser.name);

    if (exportMonth !== "all") {
      userTransactions = userTransactions.filter((t) => t.date.startsWith(exportMonth));
    }
    if (exportGroupHead !== "all") {
      userTransactions = userTransactions.filter((t) => t.groupHead === exportGroupHead);
    }

    // 1. Group Head Expense Summary
    const groupHeadMap = new Map<string, { total: number; count: number }>();
    let totalExpense = 0;

    userTransactions.forEach((t) => {
      if (t.outgoing > 0) {
        const g = t.groupHead || "Uncategorized";
        const curr = groupHeadMap.get(g) || { total: 0, count: 0 };
        curr.total += t.outgoing;
        curr.count += 1;
        groupHeadMap.set(g, curr);
        totalExpense += t.outgoing;
      }
    });

    const summaryRows = Array.from(groupHeadMap.entries())
      .map(([groupHead, info]) => ({
        "S.No": 0,
        "Month": exportMonth === "all" ? "All Months" : formatMonthLabel(exportMonth),
        "Category / Group Head": groupHead,
        "Total Expense (INR)": info.total,
        "% Share": totalExpense > 0 ? `${((info.total / totalExpense) * 100).toFixed(2)}%` : "0.00%",
        "No. of Transactions": info.count,
        "Avg Expense per Txn (INR)": info.count > 0 ? Math.round(info.total / info.count) : 0,
      }))
      .sort((a, b) => b["Total Expense (INR)"] - a["Total Expense (INR)"]);

    summaryRows.forEach((r, idx) => {
      r["S.No"] = idx + 1;
    });

    const finalSummaryRows: any[] = [...summaryRows];
    finalSummaryRows.push({
      "S.No": "",
      "Month": exportMonth === "all" ? "All Months" : formatMonthLabel(exportMonth),
      "Category / Group Head": "TOTAL EXPENSE",
      "Total Expense (INR)": totalExpense,
      "% Share": "100.00%",
      "No. of Transactions": summaryRows.reduce((acc, r) => acc + r["No. of Transactions"], 0),
      "Avg Expense per Txn (INR)": "",
    });

    // 2. Monthly Pivot Matrix
    const monthsSet = new Set<string>();
    allTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        monthsSet.add(t.date.substring(0, 7));
      }
    });
    const sortedMonths = Array.from(monthsSet).sort();

    const allGroupHeads = Array.from(
      new Set(allTransactions.map((t) => t.groupHead || "Uncategorized"))
    ).filter(Boolean);

    const monthlyMatrixRows = allGroupHeads
      .map((gh) => {
        const row: Record<string, any> = { "Category / Group Head": gh };
        let rowTotal = 0;
        sortedMonths.forEach((m) => {
          const mLabel = formatMonthLabel(m);
          const mExpense = allTransactions
            .filter(
              (t) =>
                (currentUser.role === "admin" || t.personName === currentUser.name) &&
                (t.groupHead || "Uncategorized") === gh &&
                t.date.startsWith(m)
            )
            .reduce((sum, t) => sum + t.outgoing, 0);
          row[mLabel] = mExpense;
          rowTotal += mExpense;
        });
        row["Total Expense (INR)"] = rowTotal;
        return row;
      })
      .sort((a, b) => b["Total Expense (INR)"] - a["Total Expense (INR)"]);

    const matrixTotalRow: Record<string, any> = { "Category / Group Head": "TOTAL EXPENSE" };
    let grandMatrixTotal = 0;
    sortedMonths.forEach((m) => {
      const mLabel = formatMonthLabel(m);
      const mTotal = allTransactions
        .filter(
          (t) =>
            (currentUser.role === "admin" || t.personName === currentUser.name) &&
            t.date.startsWith(m)
        )
        .reduce((sum, t) => sum + t.outgoing, 0);
      matrixTotalRow[mLabel] = mTotal;
      grandMatrixTotal += mTotal;
    });
    matrixTotalRow["Total Expense (INR)"] = grandMatrixTotal;
    monthlyMatrixRows.push(matrixTotalRow);

    // 3. Transactions Detail
    const detailRows = userTransactions.map((t) => ({
      "Date": t.date,
      "Person Name": t.personName,
      "Category / Group Head": t.groupHead || "-",
      "Reason / Description": t.reason || "-",
      "Payment Mode": t.mode || "-",
      "Income (INR)": t.incoming,
      "Expense (INR)": t.outgoing,
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(finalSummaryRows);
    wsSummary["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 28 },
      { wch: 20 },
      { wch: 14 },
      { wch: 22 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Category Summary");

    const wsMatrix = XLSX.utils.json_to_sheet(monthlyMatrixRows);
    wsMatrix["!cols"] = [
      { wch: 28 },
      ...sortedMonths.map(() => ({ wch: 16 })),
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsMatrix, "Monthly Matrix");

    const wsDetails = XLSX.utils.json_to_sheet(detailRows);
    wsDetails["!cols"] = [
      { wch: 14 },
      { wch: 20 },
      { wch: 24 },
      { wch: 30 },
      { wch: 16 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetails, "Detailed Transactions");

    const selectedMonthLabel =
      exportMonth === "all" ? "All_Months" : exportMonth.replace("-", "_");
    const fileName = `Category_Expense_Report_${selectedMonthLabel}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const PIE_COLORS = [
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#3b82f6",
    "#f43f5e",
    "#6366f1",
    "#14b8a6",
    "#e11d48",
  ];
  const getPieColor = (index: number) => PIE_COLORS[index % PIE_COLORS.length];

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50/50">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />{" "}
        <span className="ml-4 text-lg font-medium text-slate-600">
          Loading Dashboard...
        </span>
      </div>
    );
  if (error)
    return (
      <div className="p-5 text-center text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl m-6">
        <strong>Error:</strong> {error}
      </div>
    );

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/60 min-h-screen space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Income Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Total Income</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tracking-tight">
                ₹{totalIncoming.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <TrendingUp className="h-6 w-6 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-emerald-600">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Total verified incoming funds
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-500/10 via-rose-50/40 to-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Total Expense</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 tracking-tight">
                ₹{totalOutgoing.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25">
              <TrendingDown className="h-6 w-6 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-rose-600">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
            Total recorded outgoing expense
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="relative overflow-hidden rounded-2xl border border-purple-200/90 bg-gradient-to-br from-purple-500/10 via-indigo-50/40 to-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Net Balance</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 tracking-tight">
                ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25">
              <LayoutDashboard className="h-6 w-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-purple-600">
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1.5" />
            Remaining available balance
          </div>
        </div>

        {/* Total Transactions Card */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-500/10 via-sky-50/40 to-white p-5 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Total Transactions</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-700 tracking-tight">
                {allTransactions.length}
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-600 text-white shadow-md shadow-blue-500/25">
              <FileText className="h-6 w-6 stroke-[2]" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs font-medium text-blue-600">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
            Active recorded entries
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white border-b border-purple-100 flex flex-row items-center justify-between">
          <CardTitle className="text-purple-900 font-bold">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/30">
              <Filter className="w-4 h-4" />
            </div>
            <span>Smart Filters</span>
          </CardTitle>
          <Button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white flex items-center gap-2 text-xs sm:text-sm py-2 px-3.5 h-auto shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" /> Download Excel Report
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
            <div>
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              />
            </div>

            {currentUser.role === "admin" && (
              <div>
                <Label>Person Name</Label>
                <Select
                  value={filters.personName}
                  onChange={(e) =>
                    handleFilterChange("personName", e.target.value)
                  }
                >
                  <SelectItem value="all">All Persons</SelectItem>
                  {dropdownOptions.personNames.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label>Group Head</Label>
              <Select
                value={filters.groupHead}
                onChange={(e) =>
                  handleFilterChange("groupHead", e.target.value)
                }
              >
                <SelectItem value="all">All Groups</SelectItem>
                {dropdownOptions.groupHeads.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select
                value={filters.mode}
                onChange={(e) => handleFilterChange("mode", e.target.value)}
              >
                <SelectItem value="all">All Modes</SelectItem>
                {dropdownOptions.modes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Select
                value={filters.reason}
                onChange={(e) => handleFilterChange("reason", e.target.value)}
              >
                <SelectItem value="all">All Reasons</SelectItem>
                {dropdownOptions.reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-start pt-3 border-t border-slate-100">
            <Button onClick={clearFilters} variant="outline" className="rounded-xl px-4 py-2 text-xs sm:text-sm">
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-indigo-50/20 to-white">
            <CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span>Income, Expense & Balance Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatXAxisDate} stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value: number) =>
                    `₹${value.toLocaleString("en-IN")}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Income"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  name="Expense"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Balance"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="bg-gradient-to-r from-slate-50 via-pink-50/20 to-white">
            <CardTitle>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-600 text-white shadow-sm shadow-pink-500/30">
                <PieChartIcon className="w-4 h-4" />
              </div>
              <span>Expense by Group Head</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {expenseByGroupHeadData.length > 0 ? (
                  <Pie
                    data={expenseByGroupHeadData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {expenseByGroupHeadData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={getPieColor(i)} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                ) : (
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#94a3b8"
                  >
                    No expense data
                  </text>
                )}
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.96)",
                    borderRadius: "12px",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                    border: "1px solid #e2e8f0",
                  }}
                  formatter={(value: number) =>
                    `₹${value.toLocaleString("en-IN")}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-white">
          <CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm shadow-purple-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/90 border-b border-slate-200/80 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <tr>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Date
                  </th>
                  {currentUser.role === "admin" && (
                    <th className="p-3.5 text-left font-semibold text-slate-600">
                      Person
                    </th>
                  )}
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Group Head
                  </th>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Reason
                  </th>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Mode
                  </th>
                  <th className="p-3.5 text-right font-semibold text-slate-600">
                    Income
                  </th>
                  <th className="p-3.5 text-right font-semibold text-slate-600">
                    Expense
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-purple-50/40 transition-colors"
                  >
                    <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    {currentUser.role === "admin" && (
                      <td className="p-3.5 font-semibold text-slate-800">{t.personName}</td>
                    )}
                    <td className="p-3.5">
                      <Badge variant="default">{t.groupHead}</Badge>
                    </td>
                    <td className="p-3.5 text-slate-700">{t.reason}</td>
                    <td className="p-3.5">
                      <Badge variant="info">{t.mode}</Badge>
                    </td>
                    <td className="p-3.5 text-right text-emerald-600 font-bold whitespace-nowrap">
                      {t.incoming > 0
                        ? `₹${t.incoming.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td className="p-3.5 text-right text-rose-600 font-bold whitespace-nowrap">
                      {t.outgoing > 0
                        ? `₹${t.outgoing.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* All Transactions Table */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 via-purple-50/30 to-white">
          <CardTitle>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <span>All Transactions ({filteredTransactions.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[440px]">
            <table className="w-full text-sm">
              <thead className="bg-slate-100/95 backdrop-blur border-b border-slate-200 sticky top-0 text-xs uppercase tracking-wider text-slate-600 font-semibold z-10">
                <tr>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Date
                  </th>
                  {currentUser.role === "admin" && (
                    <th className="p-3.5 text-left font-semibold text-slate-600">
                      Person
                    </th>
                  )}
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Group Head
                  </th>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Reason
                  </th>
                  <th className="p-3.5 text-left font-semibold text-slate-600">
                    Mode
                  </th>
                  <th className="p-3.5 text-right font-semibold text-slate-600">
                    Income
                  </th>
                  <th className="p-3.5 text-right font-semibold text-slate-600">
                    Expense
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-purple-50/40 transition-colors"
                  >
                    <td className="p-3.5 text-slate-600 font-medium whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    {currentUser.role === "admin" && (
                      <td className="p-3.5 font-semibold text-slate-800">{t.personName}</td>
                    )}
                    <td className="p-3.5">
                      <Badge variant="default">{t.groupHead}</Badge>
                    </td>
                    <td className="p-3.5 text-slate-700">{t.reason}</td>
                    <td className="p-3.5">
                      <Badge variant="info">{t.mode}</Badge>
                    </td>
                    <td className="p-3.5 text-right text-emerald-600 font-bold whitespace-nowrap">
                      {t.incoming > 0
                        ? `₹${t.incoming.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                    <td className="p-3.5 text-right text-rose-600 font-bold whitespace-nowrap">
                      {t.outgoing > 0
                        ? `₹${t.outgoing.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Excel Download Dialog Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" /> Download Category Expense Report (Excel)
            </DialogTitle>
            <DialogDescription>
              Select the month and category to download the detailed expense breakdown in Microsoft Excel (.xlsx) format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Filter controls inside Modal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <Label className="text-slate-700 font-medium">Select Month</Label>
                <Select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(e.target.value)}
                  className="bg-white"
                >
                  <SelectItem value="all">All Months (Consolidated)</SelectItem>
                  {availableMonths.map(([ym, label]) => (
                    <SelectItem key={ym} value={ym}>
                      {label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div>
                <Label className="text-slate-700 font-medium">Select Group Head / Category</Label>
                <Select
                  value={exportGroupHead}
                  onChange={(e) => setExportGroupHead(e.target.value)}
                  className="bg-white"
                >
                  <SelectItem value="all">All Group Heads</SelectItem>
                  {dropdownOptions.groupHeads.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Live Summary Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Expense Preview ({formatMonthLabel(exportMonth)})
                </span>
                <span className="text-sm font-bold text-red-600">
                  Total: ₹{exportPreviewData.totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="p-2.5">Category / Group Head</th>
                      <th className="p-2.5 text-center">Txns</th>
                      <th className="p-2.5 text-right">Expense (₹)</th>
                      <th className="p-2.5 text-right">% Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exportPreviewData.list.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          No expense recorded for this selection.
                        </td>
                      </tr>
                    ) : (
                      exportPreviewData.list.map((item, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/40">
                          <td className="p-2.5 font-medium text-slate-800">{item.groupHead}</td>
                          <td className="p-2.5 text-center text-slate-500">{item.count}</td>
                          <td className="p-2.5 text-right font-semibold text-red-600">
                            ₹{item.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right text-slate-500">
                            {item.share.toFixed(1)}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* What's included note */}
            <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-md border border-emerald-200 space-y-1">
              <p className="font-semibold">📊 Excel Workbook Includes 3 Sheets:</p>
              <ul className="list-disc pl-5 space-y-0.5 text-emerald-700">
                <li><strong>Category Summary:</strong> Total expenses, percentage share, and transaction counts.</li>
                <li><strong>Monthly Matrix:</strong> Month-by-month comparative analysis for every group head.</li>
                <li><strong>Detailed Transactions:</strong> Full list of transactions with date, reason, person, and payment mode.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleDownloadExcel();
                setIsExportModalOpen(false);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download .XLSX Excel File
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DashboardView;
