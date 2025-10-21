// components/DateRangePicker.tsx
import * as React from "react";
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import Wheel from "../Wheel";
import { MONTHS_EN } from "../ui/date";

type Props = {
  open: boolean;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  /** ไม่เรียกระหว่างเลื่อนอีกต่อไป (คงไว้เพื่อ BC ถ้าจำเป็น) */
  onChangeStart?: (iso: string) => void;
  onChangeEnd?: (iso: string) => void;
  /** ยืนยันช่วง: ส่งค่า (startISO, endISO) กลับครั้งเดียว */
  onApply: (startISO: string, endISO: string) => void;
  onClose: () => void;
  visibleCount?: 3 | 5 | 7; // จำนวนแถวในล้อ (default 3)
};

export default function DateRangePicker({
  open,
  start,
  end,
  onApply,
  onClose,
  visibleCount = 3,
}: Props) {
  const parse = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    return m
      ? { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
      : { y: new Date().getFullYear(), m: new Date().getMonth() + 1, d: new Date().getDate() };
  };
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const pad4 = (n: number) => String(n).padStart(4, "0");
  const dim = (y: number, m: number) => new Date(y, m, 0).getDate();

  const [sY, setSY] = React.useState(new Date().getFullYear());
  const [sM, setSM] = React.useState(new Date().getMonth() + 1);
  const [sD, setSD] = React.useState(new Date().getDate());
  const [eY, setEY] = React.useState(new Date().getFullYear());
  const [eM, setEM] = React.useState(new Date().getMonth() + 1);
  const [eD, setED] = React.useState(new Date().getDate());

  // init states เฉพาะตอนเปิด
  React.useEffect(() => {
    if (!open) return;
    const s = parse(start);
    const e = parse(end);
    setSY(s.y); setSM(s.m); setSD(Math.min(s.d, dim(s.y, s.m)));
    setEY(e.y); setEM(e.m); setED(Math.min(e.d, dim(e.y, e.m)));
  }, [open]);

  React.useEffect(() => { const max = dim(sY, sM); if (sD > max) setSD(max); }, [sY, sM]);
  React.useEffect(() => { const max = dim(eY, eM); if (eD > max) setED(max); }, [eY, eM]);

  // เก็บค่าเฉพาะภายใน (ไม่ยิงขึ้นพาเรนต์ระหว่างเลื่อน)

  const years = (() => {
    const curr = new Date().getFullYear();
    const out: number[] = [];
    for (let y = curr - 5; y <= curr + 1; y++) out.push(y);
    return out;
  })();
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysStart = Array.from({ length: dim(sY, sM) }, (_, i) => i + 1);
  const daysEnd = Array.from({ length: dim(eY, eM) }, (_, i) => i + 1);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        {/* Backdrop แยกออกจาก panel เพื่อไม่บังการลาก */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.panel}>
          <Text style={styles.title}>เลือกช่วงเวลา</Text>

          <Text style={styles.caption}>จาก (วัน/เดือน/ปี)</Text>
          <View style={styles.row}>
            <Wheel data={daysStart} value={sD} onSelect={(v)=> setSD(v as number)} renderLabel={(n)=>pad2(n as number)} visibleCount={visibleCount} />
            <Wheel data={months} value={sM} onSelect={(v)=>{ const vm=v as number; setSM(vm); setSD((d)=>Math.min(d, dim(sY, vm))); }} renderLabel={(n)=>MONTHS_EN[(n as number)-1]} visibleCount={visibleCount} />
            <Wheel data={years} value={sY} onSelect={(v)=>{ const vy=v as number; setSY(vy); setSD((d)=>Math.min(d, dim(vy, sM))); }} renderLabel={(n)=>String(n)} visibleCount={visibleCount} />
          </View>

          <Text style={[styles.caption, { marginTop: 10 }]}>ถึง (วัน/เดือน/ปี)</Text>
          <View style={styles.row}>
            <Wheel data={daysEnd} value={eD} onSelect={(v)=> setED(v as number)} renderLabel={(n)=>pad2(n as number)} visibleCount={visibleCount} />
            <Wheel data={months} value={eM} onSelect={(v)=>{ const vm=v as number; setEM(vm); setED((d)=>Math.min(d, dim(eY, vm))); }} renderLabel={(n)=>MONTHS_EN[(n as number)-1]} visibleCount={visibleCount} />
            <Wheel data={years} value={eY} onSelect={(v)=>{ const vy=v as number; setEY(vy); setED((d)=>Math.min(d, dim(vy, eM))); }} renderLabel={(n)=>String(n)} visibleCount={visibleCount} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: "#E5E7EB" }]}>
              <Text style={{ fontWeight: "700", color: "#111827" }}>ยกเลิก</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                let a = `${pad4(sY)}-${pad2(sM)}-${pad2(sD)}`;
                let b = `${pad4(eY)}-${pad2(eM)}-${pad2(eD)}`;
                if (b < a) { const t = a; a = b; b = t; }
                onApply(a, b);
              }}
              style={[styles.btn, { backgroundColor: "#2563EB" }]}
            >
              <Text style={{ fontWeight: "700", color: "#fff" }}>ยืนยัน</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)" },
  panel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  title: { fontWeight: "800", fontSize: 16, marginBottom: 8 },
  caption: { fontWeight: "700", color: "#0F172A", marginTop: 4 },
  row: { flexDirection: "row", gap: 8, marginTop: 6 },
  actions: { marginTop: 12, flexDirection: "row", gap: 10, justifyContent: "flex-end" },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
});
