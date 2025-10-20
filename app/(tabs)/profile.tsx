// app/(tabs)/profile.tsx
import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";
import PrimaryButton from "../../Modal/components/ui/PrimaryButton";

import { useMyProfile } from "../../lib/hooks/useProfile";
import { clearStoredAuth } from "../../lib/authService";
import { fetchPlans, type Plan } from "../../lib/service/packageService";
import CardProfile from "../../Modal/components/ui/CardProfile";

// ✅ ใช้ service จริง
import { updateMyStoreInfo } from "../../lib/service/profileService";
import { getFirstRoom } from "../../lib/service/roomService";

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading, isError, refetch } = useMyProfile();
  const { data: firstRoom } = useQuery({
    enabled: !!me?.uid,
    queryKey: ["rooms", "first", me?.uid],
    queryFn: getFirstRoom,
  });

  const qrToken = firstRoom?.qr_token ?? "";
  const fallbackToken = me?.token || me?.access_token || "";
  const tokenToCopy = qrToken || fallbackToken;
  const tokenForDisplay = tokenToCopy || "-";

  // ---------- ชื่อผู้ใช้ ----------
  const displayName =
    me?.name_th || me?.name_en || me?.store_name || me?.username || "User";

  // ---------- โหลดรายการแพ็กเกจ แล้วจับคู่กับ package_id ปัจจุบัน ----------
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [planMeta, setPlanMeta] = React.useState<{
    name: string;
    days: number;
    quota: number;
  } | null>(null);

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
    if (!me || plans.length === 0) return;
    const currentPid = Number(me.package_id ?? 0);
    const matched = plans.find((p) => (p.id_num ?? Number(p.id)) === currentPid);
    setPlanMeta({
      name: matched?.name || me.package_name || "free trial",
      days: matched?.days ?? 30,
      quota: matched?.quota ?? (me.quota_all || 0),
    });
  }, [me, plans]);

  // ---------- วันหมดอายุ (package_change_date + days) ----------
  const expireText = React.useMemo(() => {
    if (!me) return "-";
    const startISO = me.package_change_date || me.bill_date || me.created_date || "";
    if (!startISO || !planMeta?.days) return "-";
    const endISO = addDaysISO(startISO, planMeta.days);
    return formatThaiDate(endISO);
  }, [me, planMeta?.days]);

  // ---------- รีเซ็ตการใช้งานเป็น 0 ช่วงแรกหลังเปลี่ยนแพ็กเกจ ----------
  const minutesSinceChange = React.useMemo(() => {
    if (!me?.package_change_date) return Infinity;
    const t = new Date(me.package_change_date).getTime();
    const now = Date.now();
    return (now - t) / 60000;
  }, [me?.package_change_date]);

  const quotaUsed = minutesSinceChange <= 5 ? 0 : (me?.quota_usage ?? 0);
  const quotaMax = planMeta?.quota ?? (me?.quota_all ?? 0);
  const packageName = planMeta?.name || me?.package_name || "free trial";

  const handleLogout = () => {
    Alert.alert("ออกจากระบบ", "คุณต้องการออกจากระบบใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ออกจากระบบ",
        style: "destructive",
        onPress: async () => {
          try {
            if (typeof clearStoredAuth === "function") await clearStoredAuth();
          } finally {
            router.replace("/appLogin");
          }
        },
      },
    ]);
  };

  const handleCopy = async () => {
    const apiKey = tokenToCopy;
    if (!tokenToCopy) return Alert.alert("ไม่พบ API Key");
    await Clipboard.setStringAsync(tokenToCopy);
    Alert.alert("คัดลอกสำเร็จ", "API Key ถูกคัดลอกแล้ว");
  };

  if (isLoading)
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>กำลังโหลดโปรไฟล์...</Text>
      </View>
    );

  if (isError)
    return (
      <View style={styles.loadingWrap}>
        <Text>โหลดข้อมูลโปรไฟล์ไม่สำเร็จ</Text>
        <TouchableOpacity onPress={refetch}>
          <Text style={{ color: "#0A57FF", marginTop: 6 }}>ลองใหม่</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
            <Text style={{ color: "#EAF4FF" }}>Hi, {displayName}</Text>
          </View>
        }
      />

      <View style={styles.panel}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.h1}>โปรไฟล์ผู้ใช้งาน</Text>

          {/* รูปโปรไฟล์จริง */}
          <View style={styles.avatarWrap}>
            {me?.picture ? (
              <Image
                source={{ uri: me.picture }}
                style={styles.avatarImage}
                resizeMode="cover"
                onError={(e) => console.warn("⚠️ โหลดรูปไม่สำเร็จ:", e.nativeEvent.error)}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-circle-outline" size={80} color="#CBD5E1" />
              </View>
            )}
          </View>

          {/* Username / Password */}
          <SectionCard>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <View style={[styles.inputMock, { justifyContent: "center", paddingHorizontal: 10 }]}>
              <Text style={{ color: "#0F172A" }}>{me?.username || "-"}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>รหัสผู้ใช้</Text>
            <View style={[styles.inputMock, { justifyContent: "center", paddingHorizontal: 10 }]}>
              <Text style={{ color: "#0F172A" }}>{"•".repeat(10)}</Text>
            </View>
          </SectionCard>

          {/* Usage */}
          <SectionCard>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>แพ็กเกจที่ใช้งาน</Text>
              <Text style={{ color: "#0A57FF", fontWeight: "700" }}>
                {quotaUsed} / {quotaMax}
              </Text>
            </View>

            <View style={styles.row}>
              <View style={styles.dot} />
              <Text style={styles.packageLabel}>การใช้งาน</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <ProgressBar value={quotaUsed} max={quotaMax || 1} />
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ color: "#475569" }}>
                แพ็กเกจ : <Text style={{ fontWeight: "700" }}>{packageName}</Text>
              </Text>
              <Text style={{ color: "#475569" }}>วันหมดอายุ : {expireText}</Text>
            </View>

            <View style={{ marginTop: 12 }}>
              <PrimaryButton title="อัปแพ็กเกจ" onPress={() => router.push("/(tabs)/packageUp")} />
            </View>
          </SectionCard>

          {/* Store Info — ใช้ CardProfile (มี modal + banner ในตัว) */}
          <CardProfile
            storeName={me?.store_name}
            storePhone={me?.store_phone || me?.phone}
            storeEmail={me?.store_email || me?.email}
            // ยิง API จริง
            onSaveRequest={updateMyStoreInfo}
            // หลังบันทึก: invalidate cache + refetch ให้แน่ใจว่า UI อัปเดต
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: ["myProfile"] }); // ให้ key ตรงกับ useMyProfile()
              refetch();
            }}
          />

          {/* API Key */}
          <SectionCard>
            <Text style={styles.sectionTitle}>API Key</Text>
            <Text style={styles.apiText}>{tokenForDisplay}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>คัดลอก</Text>
            </TouchableOpacity>
          </SectionCard>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

/** ───────────── helper ───────────── */
function formatThaiDate(iso?: string) {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

/** ───────────── styles ───────────── */
const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6F8FB",
  },
  panel: {
    marginTop: -16,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 16,
    flex: 1,
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 16,
    zIndex: 5,
  },
  h1: { fontSize: 20, fontWeight: "800", marginBottom: 10, marginTop: 20 },
  avatarWrap: { alignItems: "center", marginBottom: 16 },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontWeight: "700", color: "#1E293B", fontSize: 14 },
  inputMock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    height: 36,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionTitle: { fontWeight: "800", fontSize: 16, color: "#0F172A" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0A57FF" },
  packageLabel: { color: "#0A57FF", fontWeight: "700" },
  infoLabel: { color: "#64748B", fontSize: 13 },
  infoValue: { fontWeight: "700", color: "#0F172A" },
  apiText: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 10,
    fontSize: 12,
    marginTop: 8,
    color: "#0F172A",
  },
  copyBtn: {
    marginTop: 10,
    backgroundColor: "#0A57FF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  logoutBtn: {
    marginTop: 20,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
