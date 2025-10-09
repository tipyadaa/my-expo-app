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
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Polyline, Line as SvgLine, Circle, Text as SvgText } from "react-native-svg";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import StatCard from "../../Modal/components/ui/StatCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

/** ───────────────────── Mock data ───────────────────── */
const MONTHS_EN = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
] as const;
type MonthKey = typeof MONTHS_EN[number];

type Series = { ok: number[]; fail: number[] };
const SERIES_BY_END_MONTH: Record<MonthKey, Series> = {
  Jan: { ok: [10,22,35,40,20,28,42,38,26,30,28,36], fail: [4,12,8,6,18,22,20,10,12,16,14,18] },
  Feb: { ok: [14,26,30,42,18,24,40,36,30,34,28,44], fail: [6,14,10,8,20,18,22,12,14,12,16,20] },
  Mar: { ok: [18,22,36,48,26,30,44,40,28,38,36,46], fail: [8,12,12,10,18,16,20,14,12,10,12,14] },
  Apr: { ok: [16,28,40,46,22,26,38,34,24,36,34,42], fail: [7,10,11,9,16,18,17,12,10,8,10,12] },
  May: { ok: [12,24,44,52,20,22,36,30,22,34,38,48], fail: [6,8,10,12,16,14,18,12,10,8,9,10] },
  Jun: { ok: [10,22,30,46,24,28,42,38,26,30,32,44], fail: [5,9,12,10,14,18,16,12,10,8,9,11] },
  Jul: { ok: [12,26,34,40,26,32,46,42,30,34,36,48], fail: [5,8,10,9,12,16,14,10,8,9,10,12] },
  Aug: { ok: [14,28,36,42,30,38,50,44,34,38,40,52], fail: [6,10,12,10,12,14,16,10,9,8,10,12] },
  Sep: { ok: [16,30,38,46,28,36,48,40,32,36,42,54], fail: [6,9,10,9,12,13,15,10,9,8,9,11] },
  Oct: { ok: [18,32,40,48,30,38,50,42,34,38,44,56], fail: [6,8,9,9,11,12,14,10,8,8,9,10] },
  Nov: { ok: [20,34,42,50,32,40,52,44,36,40,46,58], fail: [6,8,9,8,10,12,14,10,8,8,8,10] },
  Dec: { ok: [22,36,44,52,34,42,54,46,38,42,48,60], fail: [6,8,8,8,10,11,12,10,8,8,8,9] },
};

export default function Report() {
  // mock summary
  const totalAll = 10;
  const totalValid = 10;
  const totalInvalid = 10;

  const quotaMax = 100;
  const quotaUsed = 50;
  const expireText = "หมดอายุ 3 ก.ย. 2025";

  /** ────────────── month picker state ────────────── */
  const [month, setMonth] = React.useState<MonthKey>("May");
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const series = SERIES_BY_END_MONTH[month]; // 12 จุด (Jan..Dec)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
    >
      {/* Header */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="search" size={18} color="#EAF4FF" />
            <Link href="/(tabs)/profile" asChild>
              <TouchableOpacity>
                <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
              </TouchableOpacity>
            </Link>
          </View>
        }
      />

      {/* Panel หัวข้อรายงาน */}
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
        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: "#EEF2F7",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 22, fontWeight: "800", flex: 1 }}>รายงาน</Text>

            <View
              style={{
                height: 36,
                width: 130,
                borderRadius: 10,
                backgroundColor: "#F1F5F9",
                marginRight: 8,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                justifyContent: "center",
                paddingHorizontal: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={16} color="#475569" />
                <Text style={{ color: "#64748B", fontSize: 12 }}>เลือกช่วงเวลา</Text>
              </View>
            </View>

            <Link href="/(tabs)/history" asChild>
              <TouchableOpacity
                style={{
                  height: 36,
                  width: 40,
                  borderRadius: 10,
                  backgroundColor: "#0A57FF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>

      {/* การ์ดสรุป + ใช้งาน */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 12 }}>
        <SectionCard>
          <Text
            style={{
              color: "#0A57FF",
              fontWeight: "800",
              textAlign: "center",
              marginBottom: 6,
            }}
          >
            สลิปที่ตรวจสอบทั้งหมด
          </Text>
          <Text style={{ fontSize: 36, fontWeight: "800", textAlign: "center" }}>
            {totalAll}
          </Text>
          <View style={{ marginTop: 10 }}>
            <PrimaryButton title="ดาวน์โหลดไฟล์" onPress={() => {}} />
          </View>
        </SectionCard>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <StatCard
              label="สลิปที่ถูกต้อง"
              value={String(totalValid)}
              icon={<Ionicons name="checkmark-circle" size={18} color="#16A34A" />}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              10.0 % ของสลิปทั้งหมด
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <StatCard
              label="สลิปที่ไม่ถูกต้อง"
              value={String(totalInvalid)}
              icon={<Ionicons name="close-circle" size={18} color="#DC2626" />}
            />
            <Text
              style={{
                fontSize: 12,
                color: "#94A3B8",
                textAlign: "center",
                marginTop: 6,
              }}
            >
              10.0 % ของสลิปทั้งหมด
            </Text>
          </View>
        </View>

        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontWeight: "700" }}>การใช้งาน</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
              {quotaUsed} / {quotaMax}
            </Text>
          </View>
          <ProgressBar value={quotaUsed} max={quotaMax} />
          <Text style={{ marginTop: 8, color: "#64748B", fontSize: 12 }}>
            แพ็กเกจ : <Text style={{ fontWeight: "700" }}>free trail</Text>
          </Text>
          <Text style={{ color: "#64748B", fontSize: 12 }}>วันหมดอายุ : {expireText}</Text>
        </SectionCard>

        {/* ─────────────── กราฟ + ค้นหาเดือน ─────────────── */}
        <Text style={{ fontSize: 18, fontWeight: "900" }}>กราฟแสดงข้อมูลในช่วงเดือน</Text>

        {/* แถวตัวกรองเดือนเหมือนตัวอย่าง */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.monthBox}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={{ color: "#0F172A", fontWeight: "700" }}>{month}</Text>
            <Ionicons name="calendar-outline" size={16} color="#0F172A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchBlue} onPress={() => setPickerOpen(true)}>
            <Ionicons name="search" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* การ์ดกราฟ */}
        <SectionCard>
          <Chart
            ok={series.ok}
            fail={series.fail}
            labels={MONTHS_EN}
            height={180}
            padding={16}
          />
          {/* legend */}
          <View style={{ flexDirection: "row", gap: 16, marginTop: 8 }}>
            <LegendDot color="#2563EB" label="ถูกต้อง" />
            <LegendDot color="#EF4444" label="ผิดพลาด" />
          </View>
        </SectionCard>
      </View>

      {/* Modal เลือกเดือน */}
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

/** ───────────────────── Components ───────────────────── */
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

/** กราฟเส้นง่าย ๆ ด้วย react-native-svg (Expo มีให้พร้อม) */
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
  const width = 320; // กว้างการ์ดโดยประมาณ (พอดีมือถือทั่วไป)
  const W = width;
  const H = height;

  const all = [...ok, ...fail];
  const min = Math.min(...all, 0);
  const max = Math.max(...all, 60);
  const yScale = (v: number) => {
    // กลับแกน y (บนคือ max)
    const innerH = H - padding * 2;
    return padding + innerH - (v - min) / (max - min || 1) * innerH;
  };
  const xScale = (i: number) => {
    const innerW = W - padding * 2;
    return padding + (i / (labels.length - 1)) * innerW;
  };

  const toPoints = (arr: number[]) => arr.map((v, i) => `${xScale(i)},${yScale(v)}`).join(" ");

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={W} height={H}>
        {/* เส้นแกน y (กริดบาง ๆ) */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, idx) => {
          const y = padding + (H - padding * 2) * t;
          return (
            <SvgLine key={idx} x1={padding} x2={W - padding} y1={y} y2={y} stroke="#E2E8F0" strokeWidth={1} />
          );
        })}

        {/* เส้น ok (น้ำเงิน) */}
        <Polyline
          points={toPoints(ok)}
          fill="none"
          stroke="#2563EB"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* จุด ok */}
        {ok.map((v, i) => (
          <Circle key={`ok-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#2563EB" />
        ))}

        {/* เส้น fail (แดง) */}
        <Polyline
          points={toPoints(fail)}
          fill="none"
          stroke="#EF4444"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {fail.map((v, i) => (
          <Circle key={`f-${i}`} cx={xScale(i)} cy={yScale(v)} r={3} fill="#EF4444" />
        ))}

        {/* label แกน x เฉพาะบางจุดให้ดูโล่ง */}
        {labels.map((lab, i) =>
          i % 2 === 0 ? (
            <SvgText
              key={`lab-${i}`}
              x={xScale(i)}
              y={H - 4}
              fontSize="10"
              fill="#94A3B8"
              textAnchor="middle"
            >
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
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  searchBlue: {
    height: 40,
    width: 44,
    borderRadius: 10,
    backgroundColor: "#0A57FF",
    alignItems: "center",
    justifyContent: "center",
  },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  monthItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 8,
  },
});
