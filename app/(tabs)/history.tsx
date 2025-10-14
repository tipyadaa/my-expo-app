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
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import {
  useMyTransactions,
  formatTxnDateTime,
  getHistoryPill,
  SureSureTransaction,
} from "../../lib/service/historyService";
import { useLocalAuthQuery } from "../../lib/authService";

/* ─── Dropdown ─────────────────────────────────────────────── */
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
      <TouchableOpacity onPress={() => setOpen(true)} style={styles.dropdown} activeOpacity={0.7}>
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

/* ─── Screen ───────────────────────────────────────────────── */
export default function HistoryScreen() {
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th || auth?.user?.username || auth?.user?.email || "ผู้ใช้งาน";

  const { data = [], error, refetch, isFetching, isLoading } = useMyTransactions();

  const [filter, setFilter] = useState<FilterType>("แสดงรายการทั้งหมด");
  const [q, setQ] = useState("");

  // ─── กรอง/ค้นหา/เรียง ─────────────────────────────────────
  const rows = useMemo(() => {
    const source = (data as SureSureTransaction[]) || [];
    let filtered = source;

    if (filter !== "แสดงรายการทั้งหมด") {
      filtered = filtered.filter((x) => getHistoryPill(x.status).label === filter);
    }

    const keyword = q.trim().toLowerCase();
    if (keyword.length) {
      filtered = filtered.filter((x) => {
        const pack = [x.txid, x.refNo, x.senderName, x.receiveName, x.message]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return pack.includes(keyword);
      });
    }

    // เรียงล่าสุดก่อน — พยายามใช้ updated > created > transDate+Time
    filtered.sort((a, b) => {
      const aKey =
        new Date(
          a.updatedDate || a.createdDate || `${a.transDate}T${a.transTime || "00:00:00"}`
        ).getTime() || 0;
      const bKey =
        new Date(
          b.updatedDate || b.createdDate || `${b.transDate}T${b.transTime || "00:00:00"}`
        ).getTime() || 0;
      return bKey - aKey;
    });

    return filtered.map((x) => ({
      id: String(x.id ?? ""),
      when: formatTxnDateTime(x),
      transferId: x.txid || x.refNo || "-",
      amount: x.amount ?? 0,
      who: x.receiveName || x.senderName || "",
      pill: getHistoryPill(x.status || ""),
    }));
  }, [data, filter, q]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemRow}>
      {/* ซ้าย: ชื่อ/เวลา/ID */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.cellText, { fontWeight: "600" }]}>{item.who}</Text>
        <Text style={[styles.cellText, { marginTop: 2, color: "#475569" }]}>{item.when}</Text>
        <Text style={[styles.cellText, { marginTop: 2, color: "#64748B" }]}>
          ID: {item.transferId}
        </Text>
      </View>

      {/* กลาง: จำนวนเงิน */}
      <View style={{ width: 100, alignItems: "flex-end", justifyContent: "center" }}>
        <Text style={[styles.cellText, { fontWeight: "700" }]}>
          {item.amount ? `฿ ${item.amount.toFixed(2)}` : ""}
        </Text>
      </View>

      {/* ขวา: สถานะ */}
      <View style={{ width: 80, alignItems: "flex-end", justifyContent: "center" }}>
        <View
          style={[
            styles.pill,
            item.pill.tone === "danger"
              ? { backgroundColor: "#FFE5E5" }
              : item.pill.tone === "success"
              ? { backgroundColor: "#E6F9EF" }
              : { backgroundColor: "#ECEFF3" },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              item.pill.tone === "danger" ? { color: "#C40000" } : { color: "#057A3B" },
            ]}
          >
            {item.pill.label}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#64748B" }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
      data={rows}
      keyExtractor={(it) => it.id}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />}
      ListHeaderComponent={
        <>
          {/* Gradient header */}
          <GradientHeader
            right={
              <Link href="/(tabs)/profile" asChild>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="storefront-outline" size={18} color="#EAF4FF" />
                  <Text style={{ color: "#EAF4FF" }}>Hi, {displayName}</Text>
                </TouchableOpacity>
              </Link>
            }
          />

          {/* White panel */}
          <View style={styles.panel}>
            {/* หัวเรื่อง + refresh */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={styles.title}>รายการย้อนหลัง</Text>
              <TouchableOpacity onPress={() => refetch()} disabled={isFetching}>
                <Ionicons name="refresh" size={20} color="#0A57FF" />
              </TouchableOpacity>
            </View>

            {/* filter + search */}
            <View style={styles.controlsRow}>
              <Dropdown value={filter} onChange={setFilter} />

              <View style={styles.searchBox}>
                <Ionicons name="search" size={18} color="#64748B" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ค้นหา ref/txid/ชื่อ"
                  placeholderTextColor="#94A3B8"
                  value={q}
                  onChangeText={setQ}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* table header */}
            <View style={styles.table}>
              <View style={styles.headerRow}>
                <Text style={[styles.headerText, { flex: 1 }]}>วัน/เวลา · ผู้เกี่ยวข้อง · ID</Text>
                <Text style={[styles.headerText, { width: 100, textAlign: "right" }]}>
                  จำนวนเงิน
                </Text>
                <Text style={[styles.headerText, { width: 80, textAlign: "right" }]}>สถานะ</Text>
              </View>
            </View>
          </View>

          {error && (
            <View style={{ padding: 16, gap: 6 }}>
              <Text style={{ color: "#DC2626" }}>ไม่สามารถดึงข้อมูลได้ กรุณาลองใหม่</Text>
              <Text style={{ color: "#475569", fontSize: 12 }}>
                {(error as Error).message || String(error)}
              </Text>
            </View>
          )}
        </>
      }
      renderItem={renderItem}
      ListEmptyComponent={<Text style={{ padding: 16, color: "#64748B" }}>ยังไม่มีประวัติรายการ</Text>}
      ListFooterComponent={<View style={{ height: 24 }} />}
    />
  );
}

/* ─── Styles ───────────────────────────────────────────────── */
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
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
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

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    flex: 1,
    backgroundColor: "#EEF2F6",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 10,
    gap: 6,
  },
  searchInput: { flex: 1, color: "#0F172A", paddingVertical: 0 },

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
    alignItems: "center",
    gap: 8,
  },

  cellText: { color: "#0F172A", fontSize: 12 },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-end",
  },
  pillText: { fontSize: 12, fontWeight: "600" },

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
