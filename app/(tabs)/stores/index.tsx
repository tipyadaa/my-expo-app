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
import { useLocalAuthQuery } from "../../../lib/authService"; // ✅ ใช้ชื่อผู้ใช้จริง

export default function StoresScreen() {
  const router = useRouter();

  // โหลดรายการสาขาจาก backend
  const { data: items, isLoading, isError, refetch, isFetching } = useStores();

  // ข้อมูลผู้ใช้ (สำหรับ hi, …)
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th ||
    auth?.user?.username ||
    auth?.user?.email ||
    "ผู้ใช้งาน";

  // ลบสาขา
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

  // ลบสาขา (เรียก backend)
  const confirmDelete = (id: string) => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบสาขานี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () =>
          delMut.mutate(id, {
            onError: (e: any) => {
              Alert.alert("ลบไม่สำเร็จ", e?.message ?? "เกิดข้อผิดพลาด");
            },
          }),
      },
    ]);
  };

  // คัดลอกโค้ด
  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอก Code สำเร็จ", code);
  };

  // สร้างไลน์กรุ๊ป (เดโม่)
  const createLineGroup = (branch: { name: string }) => {
    Alert.alert("สร้าง LINE Group", `สาขา: ${branch.name}\n(เดโม่)`);
  };

  const renderItem = ({ item }: { item: StoreBranch }) => {
    const deleting = delMut.isPending;

    return (
      <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* โซนซ้าย = กดแล้วไป detail เฉพาะโซนนี้ */}
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
              {/* avatar */}
              <View style={styles.avatar} />
              {/* ชื่อ + สถานะ */}
              <View style={{ flex: 1 }}>
                <Text style={styles.branchName}>{item.name}</Text>

                <View
                  style={[
                    styles.pill,
                    item.status === "เชื่อมต่อเรียบร้อย" ? styles.pillGreen : styles.pillGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      item.status === "เชื่อมต่อเรียบร้อย"
                        ? { color: "#047857" }
                        : { color: "#6B7280" },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* โซนปุ่มขวา = กดแล้วไม่ไป detail */}
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
                accessibilityLabel="แก้ไขสาขา"
              >
                <Ionicons name="pencil" size={16} color="#2563EB" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, deleting && { opacity: 0.6 }]}
                disabled={deleting}
                onPress={() => confirmDelete(item.id)}
                accessibilityLabel="ลบสาขา"
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
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => copyCode(item.code)}
              disabled={deleting}
            >
              <Text style={styles.ghostBtnText}>คัดลอก code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => createLineGroup(item)}
              disabled={deleting}
            >
              <Text style={styles.ghostBtnText}>สร้าง line group</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      </View>
    );
  };

  return (
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

          {/* หัวข้อ + ปุ่ม + */}
          <View style={styles.panel}>
            <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>สาขาร้านค้า</Text>
                <Text style={styles.subtitle}>เชื่อมต่อสาขากับ LINE Group เพื่อตรวจสอบสลิป</Text>
              </View>

              <Link href="/(tabs)/stores/addStore" asChild>
                <TouchableOpacity style={styles.fabSmall} accessibilityLabel="เพิ่มสาขา">
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </Link>
            </View>

            {/* Loading / Error helpers */}
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

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#22D3EE",
    marginRight: 12,
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
  pillGray: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  pillText: { fontSize: 11, fontWeight: "700" },

  iconBtn: {
    height: 28,
    width: 28,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
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
