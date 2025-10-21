// app/(tabs)/report.tsx
import * as React from "react";
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polyline, Line as SvgLine, Circle, Text as SvgText } from "react-native-svg";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import StatCard from "../../Modal/components/ui/StatCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";
import DateRangePicker from "../../Modal/components/ui/DateRangePicker";
import Wheel from "../../Modal/components/Wheel";

import { useReportData } from "../../lib/hooks/useReport";
import { getStoredAuth } from "../../lib/authService";
import { fetchPlans, type Plan } from "../../lib/service/packageService";

// ✅ ใช้คอมโพเนนต์และคอนสแตนต์ที่แยกไฟล์ไว้
import { MONTHS_EN, type MonthKey, MONTH_LABELS } from "../../Modal/components/ui/date";
const MONTH_WHEEL_VISIBLE = 5;
const MONTH_WHEEL_ITEM_HEIGHT = 36;
const MONTH_WHEEL_HEIGHT = MONTH_WHEEL_VISIBLE * MONTH_WHEEL_ITEM_HEIGHT;

/** ───────────────────── Utilities ───────────────────── */
function toThDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "-";
  }
}
function addDaysISO(iso: string, days: number): string {
  try {
    const base = new Date(iso);
    if (Number.isNaN(base.getTime())) return iso;
    const out = new Date(base);
    out.setDate(out.getDate() + (days || 0));
    return out.toISOString();
  } catch {
    return iso;
  }
}
function normalizeStatus(s?: string) {
  if (!s) return "";
  return s.replace(/\s+/g, "_").toUpperCase().trim();
}
const SUCCESS_SET = new Set<string>([
  "TRANSACTION_SUCCESSFUL",
  "SUCCESS",
  "APPROVED",
  "OK",
]);
const FAIL_SET = new Set<string>([
  "TRANSACTION_UNSUCCESSFUL",
  "TRANSACTION_COUNTERFEIT",
  "RECEIVER_NOT_MATCH",
  "FAILED",
  "FAIL",
  "ERROR",
  "CANCEL",
  "CANCELLED",
  "REJECTED",
]);
function isSuccess(status?: string) { return SUCCESS_SET.has(normalizeStatus(status)); }
function isFail(status?: string) {
  const n = normalizeStatus(status);
  if (SUCCESS_SET.has(n)) return false;
  return FAIL_SET.has(n) || (!!n && !SUCCESS_SET.has(n));
}

/** ───────────────────── Screen ───────────────────── */
export default function Report() {
  const router = useRouter();

  const [username, setUsername] = React.useState("User");
  React.useEffect(() => {
    (async () => {
      const auth = await getStoredAuth();
      if (auth?.user?.name_th) setUsername(auth.user.name_th);
      else if (auth?.user?.name_en) setUsername(auth.user.name_en);
      else if (auth?.user?.username) setUsername(auth.user.username);
    })();
  }, []);

  // เดือนของกราฟ
  const initialMonth = MONTHS_EN[new Date().getMonth()] as MonthKey;
  const [month, setMonth] = React.useState<MonthKey>(initialMonth);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const monthLabel = MONTH_LABELS[month] ?? month;

  // ช่วงวันจากพารามิเตอร์
  const params = useLocalSearchParams<{ startDate?: string; endDate?: string }>();
  const toISO = (d: Date) => d.toISOString().slice(0, 10);
  const todayISO = toISO(new Date());
  const firstOfMonthISO = toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const validISO = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);
  let startDateISO = validISO(params.startDate) ?? firstOfMonthISO;
  let endDateISO = validISO(params.endDate) ?? todayISO;
  if (endDateISO < startDateISO) { const t = startDateISO; startDateISO = endDateISO; endDateISO = t; }

  // Bottom sheet เลือกช่วงวัน
  const [rangeOpen, setRangeOpen] = React.useState(false);
  const [draftStart, setDraftStart] = React.useState(startDateISO);
  const [draftEnd, setDraftEnd] = React.useState(endDateISO);
  const openRange = () => { setDraftStart(startDateISO); setDraftEnd(endDateISO); setRangeOpen(true); };
  const applyRange = (a: string, b: string) => {
    let s = a, e = b;
    if (e < s) { const t = s; s = e; e = t; }
    router.setParams({ startDate: s, endDate: e });
    setRangeOpen(false);
  };

  const currentY = new Date().getFullYear();
  const monthIndex = MONTHS_EN.indexOf(month); // 0..11
  const monthYYYYMM = `${currentY}-${String(monthIndex + 1).padStart(2, "0")}`;

  const {
    isLoading,
    isError,
    refetchAll,
    profile,
    tableRows,
  } = useReportData({ startDate: startDateISO, endDate: endDateISO, monthYYYYMM });

  /** แพ็กเกจ + วันหมดอายุ **/
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [planMeta, setPlanMeta] = React.useState<{name: string; days: number; quota: number} | null>(null);
  const [expireText, setExpireText] = React.useState<string>("-");
  React.useEffect(() => { (async () => { try { setPlans(await fetchPlans()); } catch { setPlans([]); } })(); }, []);
  React.useEffect(() => {
    if (!profile || plans.length === 0) return;
    const match = plans.find(p => (p.id_num ?? Number(p.id)) === Number(profile.package_id ?? 0));
    const name = profile.package_name || match?.name || "free trial";
    const days = match?.days ?? 30;
    const quota = match?.quota ?? (profile.quota_all || 0);
    setPlanMeta({ name, days, quota });
    const startISO = profile.package_change_date || profile.bill_date || profile.created_date;
    setExpireText(startISO ? `หมดอายุ ${toThDate(addDaysISO(startISO, days))}` : "-");
  }, [profile, plans]);

  const minutesSinceChange = React.useMemo(() => {
    if (!profile?.package_change_date) return Infinity;
    return (Date.now() - new Date(profile.package_change_date).getTime()) / 60000;
  }, [profile?.package_change_date]);

  const quotaUsed = minutesSinceChange <= 5 ? 0 : Number(profile?.quota_usage ?? 0);
  const quotaAll = planMeta?.quota ?? Number(profile?.quota_all ?? 0);
  const packageName = planMeta?.name ?? profile?.package_name ?? "free trial";

  /** นับ success/fail **/
  type Tx = { status?: string; created_date?: string };
  const rows = (tableRows ?? []) as Tx[];

  const totalAll = rows.length;
  const totalValid = rows.filter(r => isSuccess(r.status)).length;
  const totalInvalid = rows.filter(r => isFail(r.status)).length;

  const successPct = totalAll ? (totalValid / totalAll) * 100 : 0;
  const failPct    = totalAll ? (totalInvalid / totalAll) * 100 : 0;

  const onExportCsv = async () => {
    try {
      const cols = ['id','created_date','amount','status'];
      const header = cols.join(',');
      const dataLines = (tableRows as any[]).map((r) => [
        r?.id ?? '',
        String(r?.created_date || '').slice(0,10),
        r?.amount ?? '',
        r?.status ?? '',
      ].join(','));
      await Clipboard.setStringAsync([header, ...dataLines].join('\n'));
      Alert.alert('ส่งออกสำเร็จ', 'คัดลอก CSV ไปที่คลิปบอร์ดแล้ว');
    } catch (e: any) {
      Alert.alert('ส่งออกไม่สำเร็จ', e?.message || 'ไม่สามารถสร้างไฟล์ได้');
    }
  };

  /** กราฟรายวันในเดือน **/
  const labels = React.useMemo(() => {
    const d = new Date(`${monthYYYYMM}-01T00:00:00`);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [monthYYYYMM]);

  const { okData, failData } = React.useMemo(() => {
    const ok: number[] = Array(labels.length).fill(0);
    const fl: number[] = Array(labels.length).fill(0);
    rows.forEach((r) => {
      const dateStr = (r as any)?.created_date?.split("T")[0] ?? "";
      if (!dateStr.startsWith(monthYYYYMM)) return;
      const day = Number(dateStr.split("-")[2] || "0");
      if (!day || day > labels.length) return;
      if (isSuccess(r.status)) ok[day - 1] += 1;
      else if (isFail(r.status)) fl[day - 1] += 1;
    });
    return { okData: ok, failData: fl };
  }, [rows, labels, monthYYYYMM]);

  if (isLoading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8 }}>กำลังโหลดรายงาน...</Text>
      </View>
    );
  }
  if (isError) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <Text>โหลดข้อมูลไม่สำเร็จ</Text>
        <TouchableOpacity onPress={() => refetchAll()}>
          <Text style={{ color:"#2563EB", marginTop:8 }}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F6F8FB" }} contentContainerStyle={{ paddingBottom: 96 }}>
      {/* Header */}
      <GradientHeader
        right={
          <Link href="/(tabs)/profile" asChild>
            <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
              <Text style={{ color: "#EAF4FF" }}>Hi, {username}</Text>
            </TouchableOpacity>
          </Link>
        }
      />

      {/* Panel หัวเรื่อง */}
      <View
        style={{
          backgroundColor: "#F6F8FB",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          marginTop: -16,
          paddingTop: 24,
          paddingHorizontal: 16,
        }}
      >
        <View style={{ backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#EEF2F7" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", flex: 1 }}>รายงาน</Text>

            <TouchableOpacity style={styles.dateStub} onPress={() => setRangeOpen(true)} activeOpacity={0.7}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={16} color="#475569" />
                <Text style={{ color: "#64748B", fontSize: 12 }}>{shortRange(startDateISO, endDateISO)}</Text>
              </View>
            </TouchableOpacity>

            <Link href="/(tabs)/history" asChild>
              <TouchableOpacity style={styles.searchBlue}>
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>

      {/* การ์ดสรุป + ใช้งาน */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        <SectionCard>
          <Text style={{ color:"#0A57FF", fontWeight:"800", textAlign:"center", marginBottom:6 }}>
            สลิปที่ตรวจสอบทั้งหมด
          </Text>
          <Text style={{ fontSize:36, fontWeight:"800", textAlign:"center" }}>{totalAll}</Text>
          <View style={{ marginTop: 10 }}>
            <PrimaryButton title="ดาวน์โหลดไฟล์" onPress={onExportCsv} />
          </View>
        </SectionCard>

        <View style={{ flexDirection:"row", gap:10 }}>
          <View style={{ flex:1 }}>
            <StatCard
              label="สลิปที่ถูกต้อง"
              value={String(totalValid)}
              icon={<Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
            />
            <Text style={styles.subPct}>{successPct.toFixed(1)} % ของสลิปทั้งหมด</Text>
          </View>
          <View style={{ flex:1 }}>
            <StatCard
              label="สลิปที่ไม่ถูกต้อง"
              value={String(totalInvalid)}
              icon={<Ionicons name="close-circle" size={18} color="#DC2626" />}
            />
            <Text style={styles.subPct}>{failPct.toFixed(1)} % ของสลิปทั้งหมด</Text>
          </View>
        </View>

        {/* การใช้งาน */}
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontWeight: "700" }}>การใช้งาน</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
              {quotaUsed} / {quotaAll}
            </Text>
          </View>
          <ProgressBar value={quotaUsed} max={quotaAll || 1} />
          <Text style={{ marginTop: 8, color: "#64748B", fontSize: 12 }}>
            แพ็กเกจ : <Text style={{ fontWeight: "700" }}>{packageName}</Text>
          </Text>
          <Text style={{ color: "#64748B", fontSize: 12 }}>{expireText}</Text>
        </SectionCard>

        {/* ─────────────── กราฟ + ค้นหาเดือน ─────────────── */}
        <Text style={{ fontSize: 18, fontWeight: "900" }}>กราฟแสดงข้อมูลในช่วงเดือน</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity style={styles.monthBox} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <Text style={{ color: "#0F172A", fontWeight: "700" }}>{monthLabel}</Text>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBlue} onPress={() => setPickerOpen(true)}>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <SectionCard>
          <Chart ok={okData} fail={failData} labels={labels} height={180} padding={16} />
          <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
            <LegendDot color="#16A34A" label="ถูกต้อง" />
            <LegendDot color="#EF4444" label="ผิดพลาด" />
          </View>
        </SectionCard>
      </View>

      {/* Month Picker (แก้ให้เต็มขอบ + ปุ่มกลาง) */}
      <MonthPicker
        open={pickerOpen}
        value={month}
        onClose={() => setPickerOpen(false)}
        onSelect={(m) => { setMonth(m); setPickerOpen(false); }}
      />

      {/* Date Range Picker (ล้อ 3 แถว / iOS-like) */}
      <DateRangePicker
        open={rangeOpen}
        start={draftStart}
        end={draftEnd}
        onApply={(a, b) => applyRange(a, b)}
        onClose={() => setRangeOpen(false)}
        visibleCount={3}
      />
    </ScrollView>
  );
}

/** ───────────────────── Sub Components ───────────────────── */
function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ color: "#475569" }}>{label}</Text>
    </View>
  );
}

function MonthPicker({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: MonthKey;
  onClose: () => void;
  onSelect: (m: MonthKey) => void;
}) {
  const [draftMonth, setDraftMonth] = React.useState<MonthKey>(value);

  React.useEffect(() => {
    if (open) setDraftMonth(value);
  }, [open, value]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        {/* sheet ไม่มี padding ซ้าย/ขวา เพื่อให้ล้อกางเต็มขอบ */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetInner}>
            <Text style={styles.sheetTitle}>เลือกเดือนของกราฟ</Text>
          </View>

          {/* ล้อแบบเต็มขอบ */}
          <View style={styles.monthWheelWrap}>
            <View style={styles.monthWheelBox}>
              <Wheel
                data={MONTHS_EN}
                value={draftMonth}
                onSelect={(m) => setDraftMonth(m as MonthKey)}
                renderLabel={(m) => MONTH_LABELS[m as MonthKey] ?? String(m)}
                visibleCount={MONTH_WHEEL_VISIBLE}
              />
            </View>
          </View>

          {/* ปุ่มอยู่กลาง */}
          <View style={styles.sheetInner}>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.sheetBtn} onPress={onClose}>
                <Text style={styles.sheetBtnText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetBtnPrimary]}
                onPress={() => onSelect(draftMonth)}
              >
                <Text style={[styles.sheetBtnText, styles.sheetBtnPrimaryText]}>เลือก</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Chart({
  ok,
  fail,
  labels,
  height = 160,
  padding = 12,
}: {
  ok: number[];
  fail: number[];
  labels: string[];
  height?: number;
  padding?: number;
}) {
  const width = 320;
  const W = width;
  const H = height;

  const all = [...ok, ...fail];
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 1);

  const yScale = (v: number) => {
    const innerH = H - padding * 2;
    return padding + innerH - ((v - min) / (max - min || 1)) * innerH;
  };
  const xScale = (i: number) => {
    const innerW = W - padding * 2;
    if (labels.length <= 1) return padding;
    return padding + (i / (labels.length - 1)) * innerW;
  };
  const toPoints = (arr: number[]) => arr.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={W} height={H}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = padding + (H - padding * 2) * t;
          return <SvgLine key={idx} x1={padding} x2={W - padding} y1={y} y2={y} stroke="#E2E8F0" strokeWidth={1} />;
        })}

        <Polyline points={toPoints(ok)} fill="none" stroke="#16A34A" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {ok.map((v, i) => <Circle key={`ok-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#16A34A" />)}

        <Polyline points={toPoints(fail)} fill="none" stroke="#EF4444" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {fail.map((v, i) => <Circle key={`f-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#EF4444" />)}

        {labels.map((lab, i) =>
          i % 2 === 0 ? (
            <SvgText key={`lab-${i}`} x={xScale(i)} y={H - 4} fontSize={10} fill="#94A3B8" textAnchor="middle">
              {lab}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
}

function shortRange(aISO: string, bISO: string) {
  const fmt = (iso: string) => {
    try { const d = new Date(iso); return d.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }); }
    catch { return iso; }
  };
  return `${fmt(aISO)} - ${fmt(bISO)}`;
}

/** ───────────────────── Styles ───────────────────── */
const styles = StyleSheet.create({
  monthBox: {
    flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0",
    backgroundColor: "#fff", paddingHorizontal: 12, alignItems: "center",
    justifyContent: "space-between", flexDirection: "row",
  },
  searchBlue: {
    height: 40, width: 44, borderRadius: 10, backgroundColor: "#0A57FF",
    alignItems: "center", justifyContent: "center",
  },
  subPct: { fontSize: 12, color: "#94A3B8", textAlign: "center", marginTop: 6 },
  dateStub: {
    height: 36, width: 130, borderRadius: 10, backgroundColor: "#F1F5F9",
    marginRight: 8, borderWidth: 1, borderColor: "#E5E7EB",
    justifyContent: "center", paddingHorizontal: 10,
  },

  // ── Bottom Sheet & Month Wheel (แก้เพื่อให้เต็มขอบ + ปุ่มกลาง) ──
  backdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.25)", justifyContent:"flex-end" },

  // sheet ไม่มี padding ซ้ายขวา
  sheet: {
    backgroundColor:"#fff",
    borderTopLeftRadius:16,
    borderTopRightRadius:16,
    paddingTop:16,
    paddingBottom:16,
  },
  // ส่วนที่ต้องการ padding ปกติ
  sheetInner: { paddingHorizontal:16 },

  sheetHandle: { alignSelf:"center", width:40, height:4, borderRadius:2, backgroundColor:"#CBD5F5", marginBottom:12 },
  sheetTitle: { fontWeight:"800", fontSize:14, color:"#0F172A", textAlign:"center", marginBottom:12 },

  // ล้อเต็มขอบ
  monthWheelWrap: { paddingHorizontal:0, paddingVertical:8, alignItems:"stretch" },
  monthWheelBox: { width:"100%", height:MONTH_WHEEL_HEIGHT }, // เอา maxWidth ออก

  // ปุ่มอยู่กลาง
  sheetActions: {
    marginTop:16,
    flexDirection:"row",
    justifyContent:"center",
    alignItems:"center",
    gap:12,
  },
  sheetBtn: {
    paddingVertical:12,
    paddingHorizontal:22,
    borderRadius:12,
    backgroundColor:"#E2E8F0",
    minWidth:120,
    alignItems:"center",
  },
  sheetBtnText: { fontWeight:"700", color:"#0F172A" },
  sheetBtnPrimary: { backgroundColor:"#2563EB" },
  sheetBtnPrimaryText: { color:"#fff" },
});
