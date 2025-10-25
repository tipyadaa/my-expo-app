import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SuccessModalProps = {
  visible: boolean;
  title?: string;              // เรียงตามภาพ: ✓ + "สร้างรายการสำเร็จ"
  lines?: string[];            // รายการรายละเอียด เช่น ธนาคาร/เลขบัญชี
  buttonLabel?: string;        // ปุ่มปิด
  onClose: (e?: GestureResponderEvent) => void;
};

export default function SuccessModal({
  visible,
  title = "สร้างรายการสำเร็จ",
  lines = [],
  buttonLabel = "ตกลง",
  onClose,
}: SuccessModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => onClose()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Ionicons name="checkmark" size={42} color="#16A34A" style={{ marginBottom: 6 }} />
          <Text style={styles.title}>{title}</Text>

          {lines.length > 0 && (
            <View style={{ marginTop: 10, gap: 4 }}>
              {lines.map((t, idx) => (
                <Text key={idx} style={styles.detail}>{t}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#ECFDF5", // เขียวอ่อน
    borderColor: "#BBF7D0",
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  title: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  detail: {
    color: "#166534",
    fontSize: 14,
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
