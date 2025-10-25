// Modal/components/ui/deleteAlert.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DeleteAlertProps = {
  visible: boolean;
  onCancel: () => void;
  /** ฟังก์ชันที่ทำการลบจริง ๆ (รองรับ async) */
  onConfirm: () => Promise<void> | void;

  /** ข้อความต่าง ๆ ปรับได้ */
  title?: string;        // default: "ลบเลขบัญชีนี้"
  subtitle?: string;     // default: "ยืนยันการลบเลขบัญชีนี้"
  confirmLabel?: string; // default: "ยืนยัน"
  cancelLabel?: string;  // default: "ยกเลิก"

  /** หลังขึ้น "ลบสำเร็จ" และปิด modal เรียก callback นี้ */
  onDone?: () => void;

  /** เวลาแสดงการ์ด "ลบสำเร็จ" (ms) ก่อนปิดอัตโนมัติ */
  autoCloseMs?: number; // default: 1400
};

export default function DeleteAlert({
  visible,
  onCancel,
  onConfirm,
  title = "ลบเลขบัญชีนี้",
  subtitle = "ยืนยันการลบเลขบัญชีนี้",
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onDone,
  autoCloseMs = 1400,
}: DeleteAlertProps) {
  const [phase, setPhase] = React.useState<"confirm" | "success">("confirm");
  const [loading, setLoading] = React.useState(false);

  // รีเซ็ต phase เมื่อเปิดใหม่ทุกครั้ง
  React.useEffect(() => {
    if (visible) {
      setPhase("confirm");
      setLoading(false);
    }
  }, [visible]);

  async function handleConfirm() {
    try {
      setLoading(true);
      await Promise.resolve(onConfirm());
      setLoading(false);
      setPhase("success");

      // auto close success card
      const timer = setTimeout(() => {
        onDone?.();
        // ปิดด้วย onCancel เพื่อให้ parent ปิด visible
        onCancel();
      }, autoCloseMs);
      return () => clearTimeout(timer);
    } catch (e) {
      // ถ้าล้มเหลว ก็กลับไปหน้า confirm (หรือจะโชว์ error modal ก็ได้)
      setLoading(false);
      setPhase("confirm");
    }
  }

  // ปิดทั้งหมดเมื่อกดพื้นหลังในหน้า "ยืนยัน"
  const canCloseByBackdrop = phase === "confirm" && !loading;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {phase === "confirm" ? (
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={canCloseByBackdrop ? onCancel : undefined}
          >
            <View style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name="trash-bin" size={28} color="#EF4444" />
                <Text style={styles.exMark}>!</Text>
              </View>

              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>

              <View style={styles.row}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnDanger]}
                  disabled={loading}
                  onPress={handleConfirm}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnDangerText}>{confirmLabel}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnPrimary]}
                  disabled={loading}
                  onPress={onCancel}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>{cancelLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          // success phase (แบบภาพที่ 2)
          <View style={styles.successContainer}>
            <View style={styles.successPill}>
              <View style={styles.successIconWrap}>
                <Ionicons name="trash-bin" size={20} color="#EF4444" />
                <Text style={styles.exDot}>.</Text>
              </View>
              <Text style={styles.successText}>ลบสำเร็จ</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.40)", // slate-900/40
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdropTouchable: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0", // slate-200
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FEE2E2", // red-100
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  exMark: {
    position: "absolute",
    right: 6,
    top: -2,
    color: "#111827",
    fontWeight: "900",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignSelf: "stretch",
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  btnDanger: {
    backgroundColor: "#EF4444", // red-500
  },
  btnDangerText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  btnPrimary: {
    backgroundColor: "#2563EB", // blue-600
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },

  // success (รูปที่ 2)
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  successPill: {
    minWidth: 220,
    maxWidth: 360,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: "#FCECEC", // โทนชมพูอ่อน
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8DADA",
  },
  successIconWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: 4,
  },
  exDot: {
    color: "#111827",
    fontWeight: "900",
    lineHeight: 10,
    marginBottom: 2,
  },
  successText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
});
