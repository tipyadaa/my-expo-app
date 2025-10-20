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
} from "react-native";
import { Link } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Svg, Polyline, Line as SvgLine, Circle, Text as SvgText } from "react-native-svg";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import StatCard from "../../Modal/components/ui/StatCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

import { useReportData } from "../../lib/hooks/useReport";
import { getStoredAuth } from "../../lib/authService";
import { fetchPlans, type Plan } from "../../lib/service/packageService";

/** ───────────────────── Utilities ───────────────────── */
const MONTHS_EN = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
] as const;
type MonthKey = typeof MONTHS_EN[number];

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

/** 🔎 Normalizer + Classifier ของสถานะให้รองรับหลากหลายรูปแบบ */
function normalizeStatus(s?: string) {
  if (!s) return "";
  return s.replace(/\s+/g, "_").toUpperCase().trim();
}

// สถานะที่ถือว่า "สำเร็จ"
const SUCCESS_SET = new Set<string>([
  "TRANSACTION_SUCCESSFUL",
  "SUCCESS",
  "APPROVED",
  "OK",
]);

// สถานะที่ถือว่า "ไม่สำเร็จ/ผิดพลาด"
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

function isSuccess(status?: string) {
  return SUCCESS_SET.has(normalizeStatus(status));
}
function isFail(status?: string) {
  const n = normalizeStatus(status);
  if (SUCCESS_SET.has(n)) return false;
  return FAIL_SET.has(n) || (!!n && !SUCCESS_SET.has(n)); // อันไหนไม่รู้จักให้เป็น fail ไว้ก่อน
}

/** ───────────────────── Screen ───────────────────── */
export default function Report() {
  // แสดงชื่อจริงมุมขวา
  const [username, setUsername] = React.useState("User");
  React.useEffect(() => {
    (async () => {
      const auth = await getStoredAuth();
      if (auth?.user?.name_th) setUsername(auth.user.name_th);
      else if (auth?.user?.name_en) setUsername(auth.user.name_en);
      else if (auth?.user?.username) setUsername(auth.user.username);
    })();
  }, []);

  // ตัวกรองช่วงวัน + เดือนของกราฟ
  const [month, setMonth] = React.useState<MonthKey>("May");
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // monthYYYYMM สำหรับคำนวณกราฟรายวัน
  const currentY = new Date().getFullYear();
  const monthIndex = MONTHS_EN.indexOf(month); // 0..11
  const monthYYYYMM = `${currentY}-${String(monthIndex + 1).padStart(2, "0")}`;

  // ใช้ data จริงจาก backend (ดึงรายการธุรกรรมมาที่ tableRows)
  const {
    isLoading,
    isError,
    refetchAll,
    profile,
    tableRows, // <<— ใช้รายการดิบมาคำนวณเอง เพื่อแยก success/fail ให้ชัวร์
  } = useReportData({
    startDate: undefined,
    endDate: undefined,
    monthYYYYMM,
  });

  /** ───────── แพ็กเกจล่าสุด + วันหมดอายุ + รีเซ็ตยอดใช้งาน (แสดงผล) ───────── */
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [planMeta, setPlanMeta] = React.useState<{name: string; days: number; quota: number} | null>(null);
  const [expireText, setExpireText] = React.useState<string>("-");

  React.useEffect(() => {
    (async () => {
      try {
        const data = await fetchPlans();
        setPlans(data);
      } catch {
        setPlans([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!profile || plans.length === 0) return;

    // หาแผนจาก package_id ปัจจุบัน
    const match = plans.find(p => {
      const pid = Number(profile.package_id ?? 0);
      return (p.id_num ?? Number(p.id)) === pid;
    });

    const name = profile.package_name || match?.name || "free trial";
    const days = match?.days ?? 30;      // default 30 วัน
    const quota = match?.quota ?? (profile.quota_all || 0);

    setPlanMeta({ name, days, quota });

    // วันที่เริ่มใช้งาน (วันเปลี่ยนแพ็กเกจ)
    const startISO = profile.package_change_date || profile.bill_date || profile.created_date;
    if (startISO) {
      const endISO = addDaysISO(startISO, days);
      setExpireText(`หมดอายุ ${toThDate(endISO)}`);
    } else {
      setExpireText("-");
    }
  }, [profile, plans]);

  // รีเซ็ตแสดงผลยอดใช้งาน 0 ภายใน 5 นาทีแรกหลังกดเปลี่ยนแพ็กเกจ (เพื่อ UX)
  const minutesSinceChange = React.useMemo(() => {
    if (!profile?.package_change_date) return Infinity;
    const t = new Date(profile.package_change_date).getTime();
    const now = Date.now();
    return (now - t) / 60000;
  }, [profile?.package_change_date]);

  const quotaUsed =
    minutesSinceChange <= 5 ? 0 : Number(profile?.quota_usage ?? 0);
  const quotaAll =
    planMeta?.quota ?? Number(profile?.quota_all ?? 0);
  const packageName =
    planMeta?.name ?? profile?.package_name ?? "free trial";

  /** ───────── แยกจำนวน success/fail + เปอร์เซ็นต์ จาก tableRows โดยตรง ───────── */
  type Tx = { status?: string; created_date?: string };
  const rows = (tableRows ?? []) as Tx[];

  const totalAll = rows.length;
  const totalValid = rows.filter(r => isSuccess(r.status)).length;
  const totalInvalid = rows.filter(r => isFail(r.status)).length;

  const successPct = totalAll ? (totalValid / totalAll) * 100 : 0;
  const failPct    = totalAll ? (totalInvalid / totalAll) * 100 : 0;

  /** ───────── คำนวณกราฟรายวันในเดือนจาก tableRows ───────── */
  const labels = React.useMemo(() => {
    const d = new Date(`${monthYYYYMM}-01T00:00:00`);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [monthYYYYMM]);

  const { okData, failData } = React.useMemo(() => {
    const ok: number[] = Array(labels.length).fill(0);
    const fl: number[] = Array(labels.length).fill(0);

    rows.forEach((r) => {
      const dateStr = (r as any)?.created_date?.split("T")[0] ?? ""; // 2025-01-15
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
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
    >
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

            <View style={styles.dateStub}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={16} color="#475569" />
                <Text style={{ color: "#64748B", fontSize: 12 }}>เลือกช่วงเวลา</Text>
              </View>
            </View>

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
            <PrimaryButton title="ดาวน์โหลดไฟล์" onPress={() => { /* TODO */ }} />
          </View>
        </SectionCard>

        <View style={{ flexDirection:"row", gap:10 }}>
          <View style={{ flex:1 }}>
            <StatCard
              label="สลิปที่ถูกต้อง"
              value={String(totalValid)}
              icon={<Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
            />
            <Text style={styles.subPct}>
              {successPct.toFixed(1)} % ของสลิปทั้งหมด
            </Text>
          </View>
          <View style={{ flex:1 }}>
            <StatCard
              label="สลิปที่ไม่ถูกต้อง"
              value={String(totalInvalid)}
              icon={<Ionicons name="close-circle" size={18} color="#DC2626" />}
            />
            <Text style={styles.subPct}>
              {failPct.toFixed(1)} % ของสลิปทั้งหมด
            </Text>
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
            <Text style={{ color: "#0F172A", fontWeight: "700" }}>{month}</Text>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBlue} onPress={() => setPickerOpen(true)}>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <SectionCard>
          <Chart
            ok={okData}
            fail={failData}
            labels={labels}
            height={180}
            padding={16}
          />
          <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
            <LegendDot color="#2563EB" label="ถูกต้อง" />
            <LegendDot color="#EF4444" label="ผิดพลาด" />
          </View>
        </SectionCard>
      </View>

      {/* Month Picker */}
      <MonthPicker
        open={pickerOpen}
        value={month}
        onClose={() => setPickerOpen(false)}
        onSelect={(m) => {
          setMonth(m);
          setPickerOpen(false);
        }}
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
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {MONTHS_EN.map((m) => (
            <Pressable
              key={m}
              onPress={() => onSelect(m)}
              style={[
                styles.monthItem,
                value === m && { backgroundColor: "#EFF6FF", borderColor: "#93C5FD" },
              ]}
            >
              <Text style={{ fontWeight: "700", color: "#0F172A" }}>{m}</Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

/** กราฟเส้น (รายวันในเดือน) */
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

        <Polyline points={toPoints(ok)} fill="none" stroke="#2563EB" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {ok.map((v, i) => <Circle key={`ok-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#2563EB" />)}

        <Polyline points={toPoints(fail)} fill="none" stroke="#EF4444" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        {fail.map((v, i) => <Circle key={`f-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#EF4444" />)}

        {labels.map((lab, i) =>
          i % 2 === 0 ? (
            <SvgText key={`lab-${i}`} x={xScale(i)} y={H - 4} fontSize="10" fill="#94A3B8" textAnchor="middle">
              {lab}
            </SvgText>
          ) : null
        )}
      </Svg>
    </View>
  );
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
  backdrop: { flex:1, backgroundColor:"rgba(0,0,0,0.25)", justifyContent:"flex-end" },
  sheet: { backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, paddingVertical:8, paddingHorizontal:12 },
  monthItem: { paddingVertical:12, paddingHorizontal:10, borderRadius:10, borderWidth:1, borderColor:"#E5E7EB", marginBottom:8 },
});
