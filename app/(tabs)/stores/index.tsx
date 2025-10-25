// app/(tabs)/stores/index.tsx
import * as React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Link, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";
import {
  useDeleteStore,
  useStores,
  type StoreBranch,
} from "../../../lib/service/storeService";
import { useLocalAuthQuery } from "../../../lib/authService";

// ✅ นำเข้า DeleteAlert
import DeleteAlert from "../../../Modal/components/ui/deleteAlert";

export default function StoresScreen() {
  const router = useRouter();
  const { data: items, isLoading, isError, refetch, isFetching } = useStores();
  const { data: auth } = useLocalAuthQuery();

  const displayName =
    auth?.user?.name_th ||
    auth?.user?.username ||
    auth?.user?.email ||
    "ผู้ใช้งาน";

  const delMut = useDeleteStore();

  // pull-to-refresh
  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // ✅ state สำหรับ DeleteAlert
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);
  const openDelete = (branch: { id: string; name: string }) =>
    setDeleteTarget({ id: branch.id, name: branch.name });
  const closeDelete = () => setDeleteTarget(null);

  // คัดลอก code
  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอก Code สำเร็จ", code);
  };

  // เดโม่สร้าง LINE group
  const createLineGroup = (branch: { name: string }) => {
    Alert.alert("สร้าง LINE Group", `สาขา: ${branch.name}\n(เดโม่)`);
  };

  const renderItem = ({ item }: { item: StoreBranch }) => {
    // แสดง loading ที่แถวที่กำลังลบอยู่เท่านั้น
    const deleting = delMut.isPending && deleteTarget?.id === item.id;
    const isConnected = item.status === "เชื่อมต่อเรียบร้อย";

    return (
      <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable
              style={{ flex: 1, flexDirection: "row", alignItems: "center", paddingRight: 8 }}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/stores/detailStore",
                  params: { id: item.id },
                })
              }
              disabled={deleting}
            >
              {/* storefront icon */}
              <View style={styles.storeIconBox}>
                <MaterialCommunityIcons name="storefront-outline" size={22} color="#10B981" />
              </View>

              {/* ชื่อ + สถานะ */}
              <View style={{ flex: 1 }}>
                <Text style={styles.branchName}>{item.name}</Text>

                <View
                  style={[
                    styles.pill,
                    isConnected ? styles.pillGreen : styles.pillRed,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      isConnected ? { color: "#065F46" } : { color: "#B91C1C" },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* ปุ่มแก้ไข/ลบ */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.iconBtn, deleting && { opacity: 0.6 }]}
                disabled={deleting}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/stores/editStore",
                    params: { id: item.id },
                  })
                }
              >
                <Ionicons name="pencil" size={16} color="#2563EB" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, deleting && { opacity: 0.6 }]}
                disabled={deleting}
                // ✅ เปิด DeleteAlert แทน Alert.confirm เดิม
                onPress={() => openDelete(item)}
              >
                {deleting ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ปุ่มล่าง */}
          <View style={{ height: 10 }} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            {/* 🔵 ปุ่มคัดลอก code (สีน้ำเงิน #014BFF) */}
            <TouchableOpacity
              style={[styles.copyBtnBlue]}
              onPress={() => copyCode(item.code)}
              disabled={delMut.isPending}
            >
              <Text style={styles.copyBtnBlueText}>คัดลอก code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => createLineGroup(item)}
              disabled={delMut.isPending}
            >
              <Text style={styles.ghostBtnText}>สร้าง line group</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      </View>
    );
  };

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: "#F6F8FB" }}
        contentContainerStyle={{ paddingBottom: 96 }}
        data={items ?? []}
        keyExtractor={(b) => b.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing || isFetching} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <>
            <GradientHeader
              right={
                <Link href="/(tabs)/profile" asChild>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
                    <Text style={{ color: "#EAF4FF" }}>Hi, {displayName}</Text>
                  </TouchableOpacity>
                </Link>
              }
            />

            <View style={styles.panel}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>สาขาร้านค้า</Text>
                  <Text style={styles.subtitle}>เชื่อมต่อสาขากับ LINE Group เพื่อตรวจสอบสลิป</Text>
                </View>

                <Link href="/(tabs)/stores/addStore" asChild>
                  <TouchableOpacity style={styles.fabSmall}>
                    <Ionicons name="add" size={22} color="#fff" />
                  </TouchableOpacity>
                </Link>
              </View>

              {/* Loading / Error */}
              {isLoading && (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <ActivityIndicator />
                  <Text style={{ marginTop: 8, color: "#64748B" }}>กำลังโหลด...</Text>
                </View>
              )}
              {isError && !isLoading && (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ color: "#DC2626", fontWeight: "700" }}>โหลดไม่สำเร็จ</Text>
                  <TouchableOpacity
                    onPress={() => refetch()}
                    style={[styles.ghostBtn, { marginTop: 8, paddingHorizontal: 16 }]}
                  >
                    <Text style={styles.ghostBtnText}>ลองอีกครั้ง</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!isLoading && !isError && (items?.length ?? 0) === 0 && (
                <View style={{ paddingVertical: 12, alignItems: "center" }}>
                  <Text style={{ color: "#64748B" }}>ยังไม่มีสาขา</Text>
                </View>
              )}
            </View>
          </>
        }
        ListFooterComponent={<View style={{ height: 16 }} />}
      />

      {/* ✅ DeleteAlert เชื่อมต่อการลบสาขา */}
      <DeleteAlert
        visible={!!deleteTarget}
        title="ลบสาขานี้"
        subtitle={`ยืนยันการลบสาขา: ${deleteTarget?.name ?? ""}`}
        confirmLabel="ยืนยัน"
        cancelLabel="ยกเลิก"
        onCancel={closeDelete}
        onConfirm={async () => {
          if (!deleteTarget) return;
          // เรียก mutation แบบ async ให้ modal แสดง loading + success ได้เอง
          await delMut.mutateAsync(deleteTarget.id);
        }}
        onDone={async () => {
          // ปิดแล้วรีเฟรชรายการ
          await refetch();
        }}
        // autoCloseMs (ปรับเวลาแสดง "ลบสำเร็จ" ได้ ถ้าอยาก)
        // autoCloseMs={1200}
      />
    </>
  );
}

/* ─── Styles ─────────────────────────────────────── */
const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  title: { fontSize: 24, fontWeight: "800" },
  subtitle: { color: "#64748B", marginTop: 2 },
  fabSmall: {
    height: 38,
    width: 38,
    borderRadius: 19,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  // storefront icon
  storeIconBox: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },

  branchName: { fontWeight: "800", fontSize: 14 },

  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 6,
    borderWidth: 1,
  },
  pillGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  pillRed: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },

  pillText: { fontSize: 11, fontWeight: "700" },

  iconBtn: {
    height: 28,
    width: 28,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // 🔵 ปุ่มคัดลอก code
  copyBtnBlue: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#014BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnBlueText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  ghostBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  ghostBtnText: { color: "#0F172A", fontWeight: "700" },
});
