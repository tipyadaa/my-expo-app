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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Polyline, Line as SvgLine, Circle, Text as SvgText } from "react-native-svg";
import * as FileSystem from "expo-file-system";

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
const MONTH_WHEEL_HEIGHT = MONTH_WHEEL_VISIBLE * 36;

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

  const onExportXlsx = async () => {
    try {
      const rowsForSheet: (string | number | null)[][] = [
        ["ID", "วันที่", "ยอดเงิน", "สถานะ"],
        ...((tableRows as any[]) ?? []).map((r) => {
          const rawAmount = typeof r?.amount === "number" ? r?.amount : Number(r?.amount);
          const amountCell = Number.isFinite(rawAmount) ? rawAmount : "";
          return [
            r?.id ?? "",
            String(r?.created_date ?? "").slice(0, 10),
            amountCell,
            r?.status ?? "",
          ];
        }),
      ];
      const workbookBytes = createXlsxArchive(rowsForSheet);
      const base64 = toBase64(workbookBytes);
      const targetDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!targetDir) throw new Error("ไม่พบโฟลเดอร์สำหรับบันทึกไฟล์บนอุปกรณ์นี้");
      const fileName = `report-${new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "")}.xlsx`;
      const fileUri = `${targetDir}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

      Alert.alert("บันทึกไฟล์สำเร็จ", `ไฟล์ถูกบันทึกไว้ที่:\n${fileUri}`);
    } catch (e: any) {
      Alert.alert("สร้างไฟล์ไม่สำเร็จ", e?.message || "เกิดข้อผิดพลาดระหว่างสร้างไฟล์");
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
            <PrimaryButton title="ดาวน์โหลดไฟล์ (.xlsx)" onPress={onExportXlsx} />
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

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function createXlsxArchive(rows: (string | number | null)[][]): Uint8Array {
  const safeRows = rows.length ? rows : [[""]];
  const nowIso = new Date().toISOString();
  const entries = [
    { path: "[Content_Types].xml", data: encodeUtf8(buildContentTypesXml()) },
    { path: "_rels/.rels", data: encodeUtf8(buildRootRelsXml()) },
    { path: "docProps/app.xml", data: encodeUtf8(buildAppPropsXml()) },
    { path: "docProps/core.xml", data: encodeUtf8(buildCorePropsXml(nowIso)) },
    { path: "xl/workbook.xml", data: encodeUtf8(buildWorkbookXml()) },
    { path: "xl/_rels/workbook.xml.rels", data: encodeUtf8(buildWorkbookRelsXml()) },
    { path: "xl/styles.xml", data: encodeUtf8(buildStylesXml()) },
    { path: "xl/worksheets/sheet1.xml", data: encodeUtf8(buildSheetXml(safeRows)) },
  ];
  return createZip(entries);
}

function buildContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n` +
    `  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n` +
    `  <Default Extension="xml" ContentType="application/xml"/>\n` +
    `  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n` +
    `  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n` +
    `  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>\n` +
    `  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>\n` +
    `  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>\n` +
    `</Types>`;
}

function buildRootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
    `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n` +
    `  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>\n` +
    `  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>\n` +
    `</Relationships>`;
}

function buildAppPropsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">\n` +
    `  <Application>Sure Sure Mobile</Application>\n` +
    `</Properties>`;
}

function buildCorePropsXml(createdIso: string): string {
  const iso = createdIso.replace(/\.\d+Z$/, "Z");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n` +
    `  <dc:creator>Sure Sure Mobile</dc:creator>\n` +
    `  <cp:lastModifiedBy>Sure Sure Mobile</cp:lastModifiedBy>\n` +
    `  <dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>\n` +
    `  <dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>\n` +
    `</cp:coreProperties>`;
}

function buildWorkbookXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n` +
    `  <sheets>\n` +
    `    <sheet name="Report" sheetId="1" r:id="rId1"/>\n` +
    `  </sheets>\n` +
    `</workbook>`;
}

function buildWorkbookRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n` +
    `  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n` +
    `  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n` +
    `</Relationships>`;
}

function buildStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n` +
    `  <fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>\n` +
    `  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>\n` +
    `  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>\n` +
    `  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>\n` +
    `  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>\n` +
    `</styleSheet>`;
}

function buildSheetXml(rows: (string | number | null)[][]): string {
  const xmlRows = rows.map((row, rowIdx) => {
    const excelRow = rowIdx + 1;
    const cells = row.map((value, colIdx) => {
      const ref = `${columnLetter(colIdx)}${excelRow}`;
      if (value === null || value === undefined || value === "") {
        return `<c r="${ref}"/>`;
      }
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}"><v>${value}</v></c>`;
      }
      const text = escapeXml(String(value));
      return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`;
    }).join("");
    return `<row r="${excelRow}">${cells}</row>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n` +
    `  <sheetData>${xmlRows}</sheetData>\n` +
    `</worksheet>`;
}

function columnLetter(index: number): string {
  let n = index;
  let letters = "";
  while (n >= 0) {
    letters = String.fromCharCode((n % 26) + 65) + letters;
    n = Math.floor(n / 26) - 1;
  }
  return letters;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function encodeUtf8(value: string): Uint8Array {
  const TextEncoderCtor = (globalThis as any).TextEncoder as undefined | { new (): { encode(input: string): Uint8Array } };
  if (TextEncoderCtor) {
    return new TextEncoderCtor().encode(value);
  }
  const out: number[] = [];
  for (let i = 0; i < value.length; i++) {
    let code = value.charCodeAt(i);
    if (code < 0x80) {
      out.push(code);
    } else if (code < 0x800) {
      out.push(0xc0 | (code >> 6));
      out.push(0x80 | (code & 0x3f));
    } else if (code >= 0xd800 && code <= 0xdbff) {
      i++;
      const next = value.charCodeAt(i);
      const cp = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
      out.push(0xf0 | (cp >> 18));
      out.push(0x80 | ((cp >> 12) & 0x3f));
      out.push(0x80 | ((cp >> 6) & 0x3f));
      out.push(0x80 | (cp & 0x3f));
    } else {
      out.push(0xe0 | (code >> 12));
      out.push(0x80 | ((code >> 6) & 0x3f));
      out.push(0x80 | (code & 0x3f));
    }
  }
  return Uint8Array.from(out);
}

function createZip(entries: { path: string; data: Uint8Array }[]): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  entries.forEach(({ path, data }) => {
    const nameBytes = encodeUtf8(path);
    const crc = crc32(data);
    const size = data.length;

    const local = new Uint8Array(30 + nameBytes.length + size);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, size, true);
    localView.setUint32(22, size, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, size, true);
    centralView.setUint32(24, size, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  });

  const centralSize = centralParts.reduce((sum, arr) => sum + arr.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return concatUint8Arrays([...localParts, ...centralParts, end]);
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((arr) => {
    out.set(arr, offset);
    offset += arr.length;
  });
  return out;
}

function toBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += chars[(triplet >> 6) & 63];
    output += chars[triplet & 63];
  }
  if (i < bytes.length) {
    const byte1 = bytes[i];
    const byte2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const triplet = (byte1 << 16) | (byte2 << 8);
    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : "=";
    output += "=";
  }
  return output;
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
