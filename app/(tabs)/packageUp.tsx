// app/(tabs)/package.tsx
import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import GradientHeader from "../../Modal/components/ui/GradientHeader";

type Plan = {
  id: string;
  name: "basic" | "pro";
  price: number;
  quota: number;
  perSlip: number;
  days: number;
  cta?: "ซื้อเลย" | "ต่ออายุ";
};

const PLANS: Plan[] = [
  { id: "b1", name: "basic", price: 225, quota: 500,  perSlip: 0.45, days: 30, cta: "ซื้อเลย" },
  { id: "p1", name: "pro",   price: 2200, quota: 5000, perSlip: 0.45, days: 30, cta: "ซื้อเลย" },
  { id: "b2", name: "basic", price: 225, quota: 500,  perSlip: 0.45, days: 30, cta: "ซื้อเลย" },
  { id: "b3", name: "basic", price: 225, quota: 500,  perSlip: 0.45, days: 30, cta: "ซื้อเลย" },
];

export default function PackageScreen() {
  const router = useRouter();
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<Plan | null>(null);

  const openConfirm = (plan: Plan) => {
    setSelectedPlan(plan);
    setConfirmVisible(true);
  };

  const confirmAndGo = () => {
    setConfirmVisible(false);
    router.push("/modals/ScanPay");
  };

  const renderItem = ({ item }: { item: Plan }) => (
    <View style={styles.card}>
      {/* ซ้าย: ราคา */}
      <View style={styles.leftCol}>
        <View
          style={[
            styles.tierBadge,
            item.name === "pro" ? styles.tierPro : styles.tierBasic,
          ]}
        >
          <Text
            style={[
              styles.tierText,
              item.name === "pro" ? { color: "#fff" } : { color: "#2563EB" },
            ]}
          >
            {item.name === "pro" ? "Pro" : "basic"}
          </Text>
        </View>

        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.perMonth}>บาท / เดือน</Text>
      </View>

      {/* ขวา: กล่องรายละเอียดพื้นฟ้าอ่อน */}
      <View style={styles.rightCol}>
        <View style={styles.detailBox}>
          <Feature text={`${item.quota} สลิป`} />
          <Feature text={`ราคาเฉลี่ย ${item.perSlip.toFixed(2)} บาท / สลิป`} />
          <Feature text={`ระยะเวลา ${item.days} วัน`} />

          <LinearGradient
            colors={["#1E62FF", "#12C2B1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buyBtn}
          >
            <TouchableOpacity style={styles.buyBtnHit} onPress={() => openConfirm(item)}>
              <Text style={styles.buyBtnText}>{item.cta ?? "ซื้อเลย"}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* Header ไล่เฉด */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="storefront-outline" size={18} color="#EAF4FF" />
            <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
          </View>
        }
      />

      {/* แผงโค้ง + หัวเรื่องกึ่งกลาง + ปุ่มปิดด้านขวา */}
      <View style={styles.panel}>
        <View style={styles.titleBar}>
          <View style={{ width: 24 }} />
          <Text style={styles.title}>ราคาแพ็กเกจ</Text>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          เพิ่มความสะดวกสบายและประหยัดเวลาด้วยบริการตรวจสอบ{'\n'}
          สลิปการชำระเงินของเรา เลือกแพ็กเกจที่เหมาะกับคุณ
        </Text>

        <FlatList
          data={PLANS}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Modal ยืนยันก่อนเปลี่ยนแพ็กเกจ */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={54} color="#DC2626" />
            <Text style={styles.modalTitle}>ยืนยันข้อมูล</Text>
            <Text style={styles.modalText}>
              คุณมีแพ็กเกจที่ใช้งานอยู่{'\n'}
              คุณยืนยันที่จะเปลี่ยนแพ็กเกจใหม่หรือไม่
            </Text>
            <Text style={styles.modalNote}>
              **จำนวนตรวจสอบสลิปที่คุณเหลืออยู่จะโดนรีเซ็ตใหม่
            </Text>

            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.cancelText}>ไม่เปลี่ยนแพ็กเกจ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndGo}>
                <Text style={styles.confirmText}>เปลี่ยนแพ็กเกจ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ─── Components ย่อย ─── */
function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons name="check-circle-outline" size={18} color="#0A57FF" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 14,
    paddingHorizontal: 12,
  },

  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0F172A", textAlign: "center" },
  subtitle: {
    color: "#8AA0B4",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 18,
    fontSize: 12,
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
  leftCol: { width: 86, alignItems: "flex-start" },
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

  price: { fontSize: 32, fontWeight: "900", color: "#0F172A", lineHeight: 32 },
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

  buyBtn: {
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  buyBtnHit: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  buyBtnText: { color: "#fff", fontWeight: "900" },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "900", marginTop: 8 },
  modalText: { color: "#1E293B", textAlign: "center", lineHeight: 20, marginTop: 6 },
  modalNote: { color: "#DC2626", fontSize: 12, textAlign: "center", marginTop: 6, marginBottom: 16 },
  modalRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: { color: "#111827", fontWeight: "700" },
  confirmBtn: {
    flex: 1,
    backgroundColor: "#0A57FF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "800" },
});
