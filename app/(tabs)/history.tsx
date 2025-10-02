// app/(tabs)/history.tsx
import * as React from "react";
import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GradientHeader from "../../Modal/components/ui/GradientHeader";
import { Link } from "expo-router";


// ─── ชุดข้อมูลตัวอย่าง ──────────────────────────────────────────────────────
type Row = {
  id: string;
  dateISO: string; // YYYY-MM-DD
  transferId: string;
  status: "สำเร็จ" | "ไม่สำเร็จ";
};

const MOCK: Row[] = [
  { id: "1", dateISO: "2021-04-23", transferId: "TXN2948239489\n230", status: "สำเร็จ" },
  { id: "2", dateISO: "2021-04-23", transferId: "TXN2948239489\n230", status: "ไม่สำเร็จ" },
  { id: "3", dateISO: "2021-04-18", transferId: "TXN2948239489\n230", status: "ไม่สำเร็จ" },
  { id: "4", dateISO: "2021-04-15", transferId: "TXN2948239489\n230", status: "สำเร็จ" },
  { id: "5", dateISO: "2021-04-11", transferId: "TXN2948239489\n230", status: "สำเร็จ" },
];

// ─── Dropdown อย่างง่ายในไฟล์นี้ ───────────────────────────────────────────
const FILTERS = ["แสดงรายการทั้งหมด", "สำเร็จ", "ไม่สำเร็จ"] as const;
type FilterType = typeof FILTERS[number];

function Dropdown({
  value,
  onChange,
}: {
  value: FilterType;
  onChange: (v: FilterType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={styles.dropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#475569" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalSheet}>
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                style={styles.option}
                onPress={() => {
                  onChange(f);
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{f}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

// ─── หน้าหลัก ────────────────────────────────────────────────────────────────
export default function HistoryScreen() {
  const [filter, setFilter] = useState<FilterType>("แสดงรายการทั้งหมด");

  const data = useMemo(() => {
    if (filter === "แสดงรายการทั้งหมด") return MOCK;
    return MOCK.filter((r) => r.status === filter);
  }, [filter]);

  const renderItem = ({ item }: { item: Row }) => (
    <View style={styles.itemRow}>
      <View style={styles.colDate}>
        <Text style={styles.cellText}>{formatDate(item.dateISO)}</Text>
      </View>
      <View style={styles.colId}>
        <Text style={styles.cellText}>{item.transferId}</Text>
      </View>
      <View style={styles.colStatus}>
        <Text
          style={[
            styles.cellText,
            { textAlign: "right", color: item.status === "สำเร็จ" ? "#16A34A" : "#DC2626" },
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
      data={data}
      keyExtractor={(it) => it.id}
      ListHeaderComponent={
        <>
          {/* หัว gradient + ขวาเป็นไอคอนกับชื่อ */}
<GradientHeader
  right={
    <Link href="/(tabs)/profile" asChild>
      <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons name="storefront-outline" size={18} color="#EAF4FF" />
        <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
      </TouchableOpacity>
    </Link>
  }
/>


          {/* แผงพื้นหลังโค้ง */}
          <View style={styles.panel}>
            {/* หัวเรื่อง */}
            <Text style={styles.title}>รายการย้อนหลัง</Text>

            {/* แถว filter + search ปุ่มฟ้า */}
            <View style={styles.controlsRow}>
              <Dropdown value={filter} onChange={setFilter} />
              <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
                <Ionicons name="search" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* กรอบ “ตาราง” */}
            <View style={styles.table}>
              {/* header ของตาราง */}
              <View style={styles.headerRow}>
                <Text style={[styles.headerText, styles.colDate]}>วัน/เวลาทำรายการ</Text>
                <Text style={[styles.headerText, styles.colId]}>Transfer ID</Text>
                <Text style={[styles.headerText, styles.colStatus, { textAlign: "right" }]}>
                  สถานะ
                </Text>
              </View>
            </View>
          </View>
        </>
      }
      renderItem={renderItem}
      ListFooterComponent={<View style={{ height: 24 }} />}
      // ให้แถวอยู่ต่อจากหัวตาราง: ใช้ ListHeaderComponent สำหรับส่วนหัว แล้วแถวจะตามมาเอง
    />
  );
}

// ─── Utils ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  controlsRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dropdown: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#EEF2F6",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownText: { color: "#0F172A", flex: 1 },
  searchBtn: {
    height: 40,
    width: 44,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "#0A57FF",
    alignItems: "center",
    justifyContent: "center",
  },

  table: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDF2F7",
    padding: 8,
  },
  headerRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  headerText: { color: "#64748B", fontSize: 12, fontWeight: "700" },

  itemRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: "#F6F7FA",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  colDate: { width: 92 },
  colId: { flex: 1, paddingHorizontal: 10 },
  colStatus: { width: 62 },

  cellText: { color: "#0F172A", fontSize: 12 },
  
  // modal dropdown
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  optionText: { fontSize: 16 },
});
