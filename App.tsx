// App.tsx
import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Slot จะ render ไฟล์ที่อยู่ใน app/ ตามเส้นทาง */}
      <Slot />
    </SafeAreaProvider>
  );
}
