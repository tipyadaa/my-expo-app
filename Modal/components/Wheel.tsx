// components/Wheel.tsx
import * as React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";

type WheelProps<T extends number | string> = {
  data: T[];
  value: T;
  onSelect: (v: T) => void;
  renderLabel?: (v: T) => string;
  visibleCount?: 3 | 5 | 7; // default 3
};

function Wheel<T extends number | string>({
  data,
  value,
  onSelect,
  renderLabel,
  visibleCount = 3,
}: WheelProps<T>) {
  const ITEM_HEIGHT = 36;
  const VISIBLE = Math.max(3, visibleCount % 2 === 1 ? visibleCount : visibleCount + 1);
  const HALF = Math.floor(VISIBLE / 2);
  const pad = HALF * ITEM_HEIGHT;
  const ref = React.useRef<FlatList<T>>(null);

  const idxOf = React.useCallback(
    (val: T) => Math.max(0, data.findIndex((d) => String(d) === String(val))),
    [data]
  );

  React.useEffect(() => {
    const i = idxOf(value);
    if (ref.current && i >= 0) {
      requestAnimationFrame(() => {
        ref.current?.scrollToOffset({ offset: i * ITEM_HEIGHT, animated: false });
      });
    }
  }, [value, idxOf]);

  const snapToNearest = React.useCallback(
    (offsetY: number) => {
      const i = Math.round(offsetY / ITEM_HEIGHT);
      const bounded = Math.min(Math.max(i, 0), data.length - 1);
      // ใช้ animated:false ลดอาการ "เด้ง" เมื่อหยุดเลื่อน
      ref.current?.scrollToOffset({ offset: bounded * ITEM_HEIGHT, animated: false });
      onSelect(data[bounded]);
    },
    [ITEM_HEIGHT, data, onSelect]
  );

  const onScrollEndDrag = (e: any) => snapToNearest(e.nativeEvent.contentOffset.y);
  const onMomentumEnd = (e: any) => snapToNearest(e.nativeEvent.contentOffset.y);

  const renderItem = ({ item }: { item: T }) => {
    const selected = String(item) === String(value);
    const label = renderLabel ? renderLabel(item) : String(item);
    return (
      <View style={{ height: ITEM_HEIGHT, alignItems: "center", justifyContent: "center" }}>
        <Text style={[styles.itemText, selected && styles.itemTextSel]}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.box, { height: ITEM_HEIGHT * VISIBLE }]}>
      <View pointerEvents="none" style={[styles.highlight, { top: pad, height: ITEM_HEIGHT }]} />
      <View pointerEvents="none" style={[styles.fadeTop, { height: pad }]} />
      <View pointerEvents="none" style={[styles.fadeBottom, { height: pad, top: pad + ITEM_HEIGHT }]} />

      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(it) => String(it)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollEndDrag={onScrollEndDrag}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        contentContainerStyle={{ paddingTop: pad, paddingBottom: pad }}
      />
    </View>
  );
}

export default Wheel;

const styles = StyleSheet.create({
  box: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#BFDBFE",
  },
  fadeTop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  fadeBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  itemText: { fontSize: 16, color: "#0F172A" },
  itemTextSel: { fontWeight: "800", color: "#2563EB" },
});
