// app/modals/ScanPay.tsx
import * as React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import GradientHeader from "../../Modal/components/ui/GradientHeader";

function mmss(totalSec: number) {
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ScanPay() {
  const router = useRouter();

  // 10 นาที = 600 วินาที
  const [left, setLeft] = React.useState(600);

  // แจ้งเตือนต่าง ๆ
  const [saveOk, setSaveOk] = React.useState(false);          // Toast เขียว “บันทึกคิวอาร์โค้ดสำเร็จ”
  const [failOpen, setFailOpen] = React.useState(false);      // Modal ล้มเหลว
  const [successOpen, setSuccessOpen] = React.useState(false); // Modal สำเร็จ
  const [successBack, setSuccessBack] = React.useState(5);    // นับถอยหลัง 5 วิ ในปุ่มกลับ

  // นับถอยหลัง 10 นาที
  React.useEffect(() => {
    if (left <= 0) {
      // หมดเวลา -> ขึ้นแจ้งเตือนล้มเหลว แล้วกลับหน้าราคาแพ็กเกจ
      setFailOpen(true);
      const t = setTimeout(() => {
        setFailOpen(false);
        router.replace("/(tabs)/packageUp");
      }, 1800);
      return () => clearTimeout(t);
    }
    const id = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(id);
  }, [left, router]);

  // ถ้ากด “ชำระเสร็จแล้ว” (ลิงก์ด้านล่าง) -> โชว์ modal สำเร็จ + นับ 5 วิ
  React.useEffect(() => {
    if (!successOpen) return;
    setSuccessBack(5);
    const id = setInterval(() => {
      setSuccessBack((n) => {
        if (n <= 1) {
          clearInterval(id);
          router.replace("/(tabs)/packageUp");
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [successOpen, router]);

  const onSaveQr = () => {
    // ตรงนี้จำลองเป็น Toast เขียวตามรูป
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 1400);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F6F8FB" }}>
      {/* header gradient */}
      <GradientHeader
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="storefront-outline"
              size={18}
              color="#EAF4FF"
            />
            <Text style={{ color: "#EAF4FF" }}>Hi, Yada</Text>
          </View>
        }
      />

      {/* แผงโค้ง + การ์ดหลัก */}
      <View style={styles.panel}>
        <View style={styles.card}>
          <Text style={styles.title}>สแกนเพื่อชำระเงิน</Text>

          {/* กล่อง QR (ใช้ไอคอนแทนรูป) */}
          <View style={styles.qrWrap}>
            <View style={styles.qrHead}>
              <Text style={styles.qrHeadText}>THAI QR{` `}PAYMENT</Text>
            </View>
            <View style={styles.qrBody}>
              <MaterialCommunityIcons name="qrcode" size={170} color="#111827" />
            </View>
          </View>

          {/* รายละเอียดแพ็กเกจ/ราคา (mock) */}
          <Text style={styles.meta}>แพ็กเกจ : <Text style={{ fontWeight: "700" }}>Basic</Text></Text>
          <Text style={styles.meta}>จำนวนเงิน : <Text style={{ fontWeight: "700" }}>225  ฿</Text></Text>

          {/* แถบหมดอายุแดง + คำชี้แจง */}
          <View style={styles.expireBox}>
            <Text style={styles.expireText}>
              หมดอายุใน <Text style={{ fontWeight: "900" }}>{mmss(left)}</Text> นาที
            </Text>
            <Text style={styles.expireNote}>
              **ชำระเสร็จแล้ว โปรดตรวจสอบหน้าจอหลักว่า{`\n`}มีข้อความชำระสำเร็จแล้ว
              ไม่สามารถยกเลิกชำระได้
            </Text>
          </View>

          {/* ปุ่มบันทึกคิวอาร์โค้ด (gradient) */}
          <LinearGradient
            colors={["#1E62FF", "#11C3AF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryBtn}
          >
            <TouchableOpacity style={styles.primaryHit} onPress={onSaveQr}>
              <Text style={styles.primaryText}>บันทึกคิวอาร์โค้ด</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* ลิงก์จำลอง “ชำระเสร็จแล้ว” เพื่อโชว์ modal success */}
          <TouchableOpacity onPress={() => setSuccessOpen(true)} style={{ marginTop: 10 }}>
            <Text style={{ color: "#0A57FF", fontWeight: "700" }}>ชำระเสร็จแล้ว</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Toast เขียว — บันทึกคิวอาร์โค้ดสำเร็จ */}
      {saveOk && (
        <View pointerEvents="none" style={styles.toastWrap}>
          <View style={styles.toast}>
            <MaterialCommunityIcons name="check" size={18} color="#16A34A" />
            <Text style={styles.toastText}>บันทึกคิวอาร์โค้ดสำเร็จ</Text>
          </View>
        </View>
      )}

      {/* Modal: ชำระเงินไม่สำเร็จ (หมดเวลา) */}
      <Modal transparent visible={failOpen} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.failBox}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={56}
              color="#DC2626"
            />
            <Text style={styles.failTitle}>ชำระเงินไม่สำเร็จ</Text>
            <Text style={styles.failNote}>โปรดลองอีกครั้ง</Text>
          </View>
        </View>
      </Modal>

      {/* Modal: ชำระเงินสำเร็จ */}
      <Modal transparent visible={successOpen} animationType="fade" onRequestClose={() => setSuccessOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.successBox}>
            <View style={styles.successBadge}>
              <MaterialCommunityIcons name="check" size={24} color="#16A34A" />
            </View>

            <Text style={styles.successTitle}>ชำระเงินสำเร็จ</Text>

            <View style={{ gap: 6, marginTop: 8 }}>
              <Row label="แพ็กเกจ:" value="Basic" boldValue />
              <Row label="ค่าบริการ:" value="฿ 225" />
              <Row label="จำนวนตรวจสอบ:" value="500 สลิป" boldValue />
              <Row label="วันหมดอายุ:" value="31/01/2025" boldValue />
            </View>

            <TouchableOpacity
              style={styles.successBtn}
              onPress={() => router.replace("/(tabs)/packageUp")}
            >
              <Text style={styles.successBtnText}>
                กลับหน้าแพ็กเกจ ({successBack} วิ)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ---------- Components ย่อย ---------- */
function Row({
  label,
  value,
  boldValue,
}: {
  label: string;
  value: string;
  boldValue?: boolean;
}) {
  return (
    <Text style={{ color: "#0F172A" }}>
      {label} <Text style={{ fontWeight: boldValue ? "800" : "400" }}>{value}</Text>
    </Text>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E7EEF6",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginTop: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 10,
  },

  qrWrap: {
    alignSelf: "center",
    width: 210,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  qrHead: {
    height: 32,
    backgroundColor: "#123B8E",
    alignItems: "center",
    justifyContent: "center",
  },
  qrHeadText: { color: "#EAF2FF", fontWeight: "800", letterSpacing: 0.5, fontSize: 12 },
  qrBody: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },

  meta: {
    textAlign: "center",
    marginTop: 8,
    color: "#0F172A",
  },

  expireBox: {
    backgroundColor: "#FFE4E4",
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  expireText: { color: "#DC2626", fontWeight: "800", textAlign: "center" },
  expireNote: {
    color: "#DC2626",
    textAlign: "center",
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },

  primaryBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 12,
  },
  primaryHit: { paddingVertical: 12, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  // toast
  toastWrap: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  toast: {
    backgroundColor: "#D1FAE5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  toastText: { color: "#15803D", fontWeight: "800" },

  // modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  // fail
  failBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    alignItems: "center",
    paddingVertical: 26,
    gap: 6,
  },
  failTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  failNote: { color: "#6B7280" },

  // success
  successBox: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  successBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#E6FBEF",
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: { fontSize: 18, fontWeight: "900", marginTop: 10, color: "#0F172A" },
  successBtn: {
    marginTop: 18,
    backgroundColor: "#1E3A8A",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: "100%",
    alignItems: "center",
  },
  successBtnText: { color: "#fff", fontWeight: "800" },
});
