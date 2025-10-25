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
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";

import GradientHeader from "../../Modal/components/ui/GradientHeader";
import SectionCard from "../../Modal/components/ui/SectionCard";
import ProgressBar from "../../Modal/components/ui/ProgressBar";

import { useMyProfile } from "../../lib/hooks/useProfile";
import { logout } from "../../lib/authService";
import { fetchPlans, type Plan } from "../../lib/service/packageService";
import CardProfile from "../../Modal/components/ui/CardProfile";

import { updateMyStoreInfo } from "../../lib/service/profileService";

const monoFontFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export default function ProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: me, isLoading, isError, refetch } = useMyProfile();

  const tokenRaw = me?.access_token ?? "";
  const tokenToCopy =
    typeof tokenRaw === "string" ? tokenRaw : tokenRaw != null ? String(tokenRaw) : "";
  const tokenForDisplay = tokenToCopy || "-";
  const tokenDisplayLines =
    tokenForDisplay !== "-" && typeof tokenForDisplay === "string"
      ? tokenForDisplay.match(/.{1,32}/g)?.join("\n") ?? tokenForDisplay
      : tokenForDisplay;

  const displayName =
    me?.name_th || me?.name_en || me?.store_name || me?.username || "User";

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

  const expireText = React.useMemo(() => {
    if (!me) return "-";
    const startISO = me.package_change_date || me.bill_date || me.created_date || "";
    if (!startISO || !planMeta?.days) return "-";
    const endISO = addDaysISO(startISO, planMeta.days);
    return formatThaiDate(endISO);
  }, [me, planMeta?.days]);

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
            await logout();
            queryClient.clear();
          } finally {
            router.replace("/appLogin");
          }
        },
      },
    ]);
  };

  const handleCopy = async () => {
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
          <Ionicons name="close" size={20} color="#111827" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <Text style={styles.h1}>โปรไฟล์ผู้ใช้งาน</Text>

          {/* รูปโปรไฟล์ */}
          <View style={styles.avatarWrap}>
            {me?.picture ? (
              <Image
                source={{ uri: me.picture }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={42} color="#94A3B8" />
              </View>
            )}
          </View>

          {/* Username / Password */}
          <View style={[styles.card, styles.shadowSm]}>
            <Text style={styles.label}>ชื่อผู้ใช้</Text>
            <View style={[styles.inputMock, styles.inputPad]}>
              <Text style={styles.inputText}>{me?.username || "-"}</Text>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>รหัสผู้ใช้</Text>
            <View style={[styles.inputMock, styles.inputPad]}>
              <Text style={styles.inputText}>{"•".repeat(10)}</Text>
            </View>
          </View>

          {/* Usage */}
          <View style={[styles.card, styles.shadowSm]}>
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

            <View style={{ marginTop: 10, gap: 2 }}>
              <Text style={{ color: "#475569" }}>
                แพ็กเกจ : <Text style={{ fontWeight: "700" }}>{packageName}</Text>
              </Text>
              <Text style={{ color: "#475569" }}>วันหมดอายุ : {expireText}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              style={{ marginTop: 12, borderRadius: 10, overflow: "hidden" }}
              onPress={() => router.push("/(tabs)/packageUp")}
            >
              <LinearGradient
                colors={["#014BFF", "#01C3AF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>อัปแพ็กเกจ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* ข้อมูลร้านค้า */}
          <CardProfile
            storeName={me?.store_name}
            storePhone={me?.store_phone || me?.phone}
            storeEmail={me?.store_email || ""}
            storeWebsite={me?.website || me?.email || ""}
            // รองรับทั้ง store_address และ address จาก backend เดิม
            storeAddress={me?.store_address || me?.address || ""}
            // รองรับทั้ง store_type และ store_category_type จาก backend เดิม
            storeType={me?.store_type || (me as any)?.store_category_type || ""}
            onSaveRequest={updateMyStoreInfo}
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
              refetch();
            }}
          />

          {/* API Key */}
          <View style={[styles.card, styles.shadowSm, styles.apiCard]}>
            <Text style={styles.apiTitle}>API Key</Text>
            <Text selectable style={styles.apiValue}>
              {tokenDisplayLines}
            </Text>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleCopy}
              disabled={!tokenToCopy}
              style={[styles.apiButtonWrap, !tokenToCopy && { opacity: 0.5 }]}
            >
              <LinearGradient
                colors={["#0A57FF", "#01C3AF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.apiButton}
              >
                <Text style={styles.apiButtonText}>คัดลอก</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

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
    height: 30,
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  h1: { fontSize: 18, fontWeight: "800", marginBottom: 10, marginTop: 20 },
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
    marginBottom: 12,
  },
  shadowSm: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  label: { fontWeight: "700", color: "#1E293B", fontSize: 14 },
  inputMock: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    height: 38,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputPad: { justifyContent: "center", paddingHorizontal: 10 },
  inputText: { color: "#0F172A" },
  sectionTitle: { fontWeight: "800", fontSize: 15, color: "#0F172A" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  row: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#0A57FF" },
  packageLabel: { color: "#0A57FF", fontWeight: "700" },
  apiCard: { alignItems: "center", gap: 12 },
  apiTitle: { color: "#1D4ED8", fontWeight: "800", fontSize: 16 },
  apiValue: {
    color: "#475569",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    fontFamily: monoFontFamily,
    lineHeight: 18,
  },
  apiButtonWrap: { alignSelf: "center", borderRadius: 999, overflow: "hidden", marginTop: 4 },
  apiButton: { paddingHorizontal: 42, paddingVertical: 10, borderRadius: 999, alignItems: "center" },
  apiButtonText: { color: "#FFFFFF", fontWeight: "800" },
  primaryBtn: {
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800" },
  logoutBtn: {
    marginTop: 8,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
