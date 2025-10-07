// app/(tabs)/stores/index.tsx
import * as React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Link, useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import SectionCard from "../../../Modal/components/ui/SectionCard";

type Branch = {
  id: string;
  name: string;
  status: "ยังไม่ได้เชื่อมต่อ" | "เชื่อมต่อเรียบร้อย";
  code: string;
};

const MOCK: Branch[] = [
  { id: "1", name: "สาขาเชียงใหม่", status: "ยังไม่ได้เชื่อมต่อ", code: "CM-9A3K2" },
  { id: "2", name: "สาขาลำพูน", status: "เชื่อมต่อเรียบร้อย", code: "LP-77QW1" },
  { id: "3", name: "สาขาเชียงใหม่สันทราย", status: "ยังไม่ได้เชื่อมต่อ", code: "SS-1B9Z0" },
];

export default function StoresScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<Branch[]>(MOCK);

  // ลบสาขา
  const confirmDelete = (id: string) => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบสาขานี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => setItems((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  };

  // คัดลอกโค้ด
  const copyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอก Code สำเร็จ", code);
  };

  // สร้างไลน์กรุ๊ป (เดโม่)
  const createLineGroup = (branch: Branch) => {
    Alert.alert("สร้าง LINE Group", `สาขา: ${branch.name}\n(เดโม่)`);
  };

  const renderItem = ({ item }: { item: Branch }) => (
    <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
      {/* คลิกทั้งการ์ด -> ไปหน้า detailStore */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/stores/detailStore",
            params: { id: item.id },
          })
        }
      >
        <SectionCard>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {/* avatar */}
            <View style={styles.avatar} />

            {/* ชื่อ + สถานะ */}
            <View style={{ flex: 1 }}>
              <Text style={styles.branchName}>{item.name}</Text>

              <View
                style={[
                  styles.pill,
                  item.status === "เชื่อมต่อเรียบร้อย"
                    ? styles.pillGreen
                    : styles.pillGray,
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

            {/* ปุ่มแก้ไข/ลบ */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPressOut={(e) => e.stopPropagation?.()}
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
                style={styles.iconBtn}
                onPressOut={(e) => e.stopPropagation?.()}
                onPress={() => confirmDelete(item.id)}
                accessibilityLabel="ลบสาขา"
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ปุ่มล่าง */}
          <View style={{ height: 10 }} />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPressOut={(e) => e.stopPropagation?.()}
              onPress={() => copyCode(item.code)}
            >
              <Text style={styles.ghostBtnText}>คัดลอก code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPressOut={(e) => e.stopPropagation?.()}
              onPress={() => createLineGroup(item)}
            >
              <Text style={styles.ghostBtnText}>สร้าง line group</Text>
            </TouchableOpacity>
          </View>
        </SectionCard>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: "#F6F8FB" }}
      contentContainerStyle={{ paddingBottom: 96 }}
      data={items}
      keyExtractor={(b) => b.id}
      ListHeaderComponent={
        <>
          <GradientHeader
            right={
              <Link href="/(tabs)/profile" asChild>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
                >
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={18}
                    color="#EAF4FF"
                  />
                  <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
                </TouchableOpacity>
              </Link>
            }
          />

          {/* หัวข้อ + ปุ่ม + */}
          <View style={styles.panel}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingBottom: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>สาขาร้านค้า</Text>
                <Text style={styles.subtitle}>
                  เชื่อมต่อสาขากับ LINE Group เพื่อตรวจสอบสลิป
                </Text>
              </View>

              <Link href="/(tabs)/stores/addStore" asChild>
                <TouchableOpacity style={styles.fabSmall} accessibilityLabel="เพิ่มสาขา">
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </>
      }
      renderItem={renderItem}
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
