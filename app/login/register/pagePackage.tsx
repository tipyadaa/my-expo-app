import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

import GradientHeader from "../../../Modal/components/ui/GradientHeader";
import { fetchPlans, type Plan } from "../../../lib/service/packageService";

export default function PagePackage() {
  const router = useRouter();

  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchPlans();
        setPlans(data);
      } catch (e) {
        console.error(e);
        setError("ไม่สามารถโหลดข้อมูลแพ็กเกจได้");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openConfirm = (plan: Plan) => {
    setSelectedPlan(plan);
    setConfirmVisible(true);
  };

  const confirmAndGo = () => {
    if (!selectedPlan) return;
    setConfirmVisible(false);
    router.push({
      pathname: "/modals/scanpay",
      params: {
        planId: String(selectedPlan.id ?? ""),
        name: selectedPlan.name,
        price: selectedPlan.price.toString(),
        quota: selectedPlan.quota.toString(),
        days: selectedPlan.days.toString(),
        redirect: "/(tabs)/report",
      },
    });
  };

  const renderItem = ({ item }: { item: Plan }) => {
    const isPro = item.name?.toLowerCase?.().includes("pro");
    return (
      <View style={styles.card}>
        <View style={styles.leftCol}>
          <View style={[styles.tierBadge, isPro ? styles.tierPro : styles.tierBasic]}>
            <Text style={[styles.tierText, isPro ? { color: "#fff" } : { color: "#2563EB" }]}>
              {item.name}
            </Text>
          </View>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.perMonth}>บาท / เดือน</Text>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.detailBox}>
            <Feature text={`${item.quota} สลิป/เดือน`} />
            <Feature text={`ค่าธรรมเนียมสลิปละ ${item.perSlip.toFixed(2)} บาท`} />
            <Feature text={`อายุแพ็กเกจ ${item.days} วัน`} />
            <LinearGradient
              colors={["#1E62FF", "#12C2B1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buyBtn}
            >
              <TouchableOpacity style={styles.buyBtnHit} onPress={() => openConfirm(item)}>
                <Text style={styles.buyBtnText}>{item.cta ?? "เลือกแพ็กเกจนี้"}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      <GradientHeader right={null} />

      <View style={styles.panel}>
        <View style={styles.titleBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.title}>เลือกแพ็กเกจเริ่มต้น</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.subtitle}>
          เลือกแพ็กเกจที่เหมาะกับธุรกิจของคุณเพื่อเริ่มต้นใช้งานระบบ SureSure หากมีการชำระเงิน
          ระบบจะเปิดใช้งานแพ็กเกจให้อัตโนมัติ
        </Text>

        {loading ? (
          <View style={{ alignItems: "center", marginTop: 20 }}>
            <ActivityIndicator size="large" color="#0A57FF" />
            <Text style={{ color: "#6B7280", marginTop: 8 }}>กำลังโหลดแพ็กเกจ...</Text>
          </View>
        ) : error ? (
          <Text style={{ textAlign: "center", color: "#DC2626", marginTop: 20 }}>{error}</Text>
        ) : (
          <FlatList
            data={plans}
            keyExtractor={(it) => (it.id ?? it.id_num ?? Math.random().toString()).toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => router.replace("/(tabs)/report")}>
          <Text style={styles.footerBtnText}>ถัดไป</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#DC2626" />
            <Text style={styles.modalTitle}>ยืนยันการเปลี่ยนแพ็กเกจ</Text>
            <Text style={styles.modalText}>
              ระบบจะพาไปยังหน้าชำระเงินเพื่อยืนยันการใช้งานแพ็กเกจ{"\n"}เมื่อชำระเรียบร้อยแล้วจึงจะเปิดใช้งานแพ็กเกจใหม่
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndGo}>
                <Text style={styles.confirmText}>ไปหน้าชำระเงิน</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name="check-circle-outline" size={18} color="#0A57FF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A" },
  subtitle: {
    color: "#64748B",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 18,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E6EBF2",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  leftCol: { width: 96, alignItems: "flex-start" },
  rightCol: { flex: 1, paddingLeft: 10, justifyContent: "center" },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 6,
  },
  tierBasic: { backgroundColor: "#EAF2FF", borderWidth: 1, borderColor: "#BFDBFE" },
  tierPro: { backgroundColor: "#2563EB" },
  tierText: { fontWeight: "800", fontSize: 12 },
  price: { fontSize: 30, fontWeight: "900", color: "#0F172A", lineHeight: 30 },
  perMonth: { color: "#6B7280", fontSize: 12, marginTop: 2 },
  detailBox: {
    backgroundColor: "#F1F7FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DCE7FF",
  },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  featureText: { color: "#0F172A", fontSize: 13 },
  buyBtn: { marginTop: 6, borderRadius: 10, overflow: "hidden" },
  buyBtnHit: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  buyBtnText: { color: "#fff", fontWeight: "900" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: "rgba(246,248,251,0.95)",
  },
  footerBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#0A57FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: "center",
    width: "100%",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", marginTop: 8, color: "#0F172A" },
  modalText: {
    color: "#1E293B",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  modalRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelText: { color: "#111827", fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#0A57FF",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "800" },
});
