// app/(tabs)/stores/[id].tsx
import * as React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import GradientHeader from "../../../Modal/components/ui/GradientHeader";

import { useStores } from "../../../lib/service/storeService";
import { useLocalAuthQuery } from "../../../lib/authService";

export default function DetailStore() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Header: ชื่อผู้ใช้จริง
  const { data: auth } = useLocalAuthQuery();
  const displayName =
    auth?.user?.name_th || auth?.user?.username || auth?.user?.email || "ผู้ใช้งาน";

  // โหลดรายการทั้งหมดแล้วหา item ที่ id ตรงกับพาธ
  const { data, isLoading, isError, refetch, isFetching } = useStores();
  const item = React.useMemo(
    () => (data ?? []).find((x) => x.id === String(id)),
    [data, id]
  );

  const storeName = item?.name ?? "-";
  const statusText = item?.status ?? "ยังไม่ได้เชื่อมต่อ";
  const code = item?.code ?? "-";
  const storeNo = `#${String(item?.id ?? "").padStart(5, "0")}`;

  const copyCode = async () => {
    if (!code || code === "-") {
      Alert.alert("คัดลอกไม่สำเร็จ", "ยังไม่มีโค้ดสำหรับสาขานี้");
      return;
    }
    await Clipboard.setStringAsync(code);
    Alert.alert("คัดลอกสำเร็จ", "คัดลอก Code เรียบร้อย");
  };

  const onEdit = () => {
    // ไปหน้าแก้ไข (รองรับเส้นทางแบบ editStore?id=...)
    router.push({ pathname: "/(tabs)/stores/editStore", params: { id: String(id) } });
  };

  if (isLoading || isFetching) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#64748B" }}>กำลังโหลดข้อมูล...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#DC2626", fontWeight: "700" }}>โหลดข้อมูลไม่สำเร็จ</Text>
        <TouchableOpacity
          onPress={() => refetch()}
          style={{
            marginTop: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: "#E2E8F0",
            borderRadius: 8,
          }}
        >
          <Text>ลองอีกครั้ง</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Text style={{ color: "#64748B" }}>ไม่พบสาขานี้</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 10,
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: "#E2E8F0",
            borderRadius: 8,
          }}
        >
          <Text>กลับ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header gradient + ปุ่มไปโปรไฟล์ */}
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

      {/* แผงขาวโค้ง + ปุ่มปิดมุมขวา */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
        }
      >
        {/* ปุ่มปิด */}
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={18} color="#0F172A" />
        </TouchableOpacity>

        {/* การ์ดหัว */}
        <View style={styles.headerCard}>
          <View style={styles.storeIconWrap}>
            <MaterialCommunityIcons name="storefront-outline" size={32} color="#10B981" />
          </View>

          <View style={{ marginTop: 6, alignItems: "center" }}>
            <Text style={styles.storeTopLabel}>ร้าน บนแพลตฟอร์ม</Text>
            <Text style={styles.storeTitle}>{storeName}</Text>
          </View>

          <View style={styles.rowGap}>
            {/* สถานะ */}
            <View
              style={[
                styles.badge,
                statusText === "เชื่อมต่อเรียบร้อย" ? styles.badgeGreen : styles.badgeRed,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: statusText === "เชื่อมต่อเรียบร้อย" ? "#065F46" : "#B91C1C" },
                ]}
              >
                {statusText}
              </Text>
            </View>

            {/* รหัสร้าน */}
            <View style={[styles.badge, styles.badgeGray]}>
              <Text style={[styles.badgeText, { color: "#0F172A" }]}>{storeNo}</Text>
            </View>
          </View>

          {/* แจ้งเตือนชมพู เมื่อยังไม่เชื่อมต่อ */}
          {statusText !== "เชื่อมต่อเรียบร้อย" && (
            <View style={styles.alertBox}>
              <Text style={styles.alertText}>
                กรุณาสร้าง/เชื่อมเข้า LINE Group โดยใช้ Code {"\n"}
                และบัญชี SureSure ที่ลงทะเบียนไว้
              </Text>
            </View>
          )}
        </View>

        {/* วิธีเชื่อมต่อ Line */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={styles.cardTitle}>วิธีเชื่อมต่อ Line</Text>
            <TouchableOpacity
              onPress={onEdit}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: "#2563EB",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>แก้ไขสาขา</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 4, marginTop: 6 }}>
            <Text style={styles.stepText}>1. เปิดเมนู Code</Text>
            <Text style={styles.stepText}>
              2. กดเข้าร่วม LINE Group, ภายใน LINE OA: SureSure
            </Text>
            <Text style={styles.stepText}>3. วาง Code ด้านล่างใน Group ที่ต้องการเพิ่มด้วย</Text>
            <Text style={styles.stepText}>
              4. หลังเชื่อมต่อสำเร็จ ระบบจะแสดงสถิติรายงานสลิปอัตโนมัติ
            </Text>
          </View>

          {/* กล่อง Code + ปุ่มคัดลอก */}
          <View style={styles.codeBoxWrap}>
            <Text style={styles.codeLabel}>Code สำหรับเชื่อมต่อ Line Group</Text>
            <View style={styles.codeRow}>
              <View style={styles.codeField}>
                <Text style={styles.codeFieldText} numberOfLines={1}>
                  {code}
                </Text>
              </View>
              <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
                <Text style={styles.copyBtnText}>คัดลอก</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.codeHint}>* โค้ดจะใช้ได้ภายในระยะเวลาจำกัด</Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => Alert.alert("สร้าง LINE Group", "เดโม่")}
          >
            <Text style={styles.primaryBtnText}>สร้าง LINE Group</Text>
          </TouchableOpacity>
        </View>

        {/* บัญชีรับเงินที่เชื่อมต่อ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>บัญชีรับเงินที่เชื่อมต่อ</Text>
          <View style={{ height: 10 }} />
          <Text style={{ color: "#64748B" }}>
            ยังไม่มีข้อมูลบัญชีที่เชื่อมต่อสำหรับสาขานี้
          </Text>
          {/* TODO: เมื่อมี endpoint บัญชีของสาขา ค่อย map รายการตรงนี้ */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 16,
    paddingHorizontal: 14,
  },
  closeBtn: {
    position: "absolute",
    right: 14,
    top: 14,
    zIndex: 5,
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    alignItems: "center",
  },
  storeIconWrap: {
    height: 56,
    width: 56,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  storeTopLabel: { color: "#6B7280", fontSize: 11 },
  storeTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  rowGap: { flexDirection: "row", gap: 8, marginTop: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeRed: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  badgeGreen: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  badgeGray: { backgroundColor: "#F3F4F6", borderColor: "#E5E7EB" },
  badgeText: { fontSize: 11, fontWeight: "800" },

  alertBox: {
    marginTop: 10,
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignSelf: "stretch",
  },
  alertText: { color: "#991B1B", fontSize: 12, lineHeight: 18, textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginTop: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: "800", color: "#0F172A" },
  stepText: { color: "#475569", fontSize: 12 },

  codeBoxWrap: { marginTop: 10 },
  codeLabel: { color: "#334155", fontSize: 12, marginBottom: 6, fontWeight: "700" },
  codeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  codeField: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#E8F0FE",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  codeFieldText: { color: "#0F172A", fontWeight: "700" },
  copyBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  copyBtnText: { color: "#fff", fontWeight: "700" },
  codeHint: { color: "#94A3B8", fontSize: 11, marginTop: 4 },

  primaryBtn: {
    marginTop: 10,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#0A57FF",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
});
