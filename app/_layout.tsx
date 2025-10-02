import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modals/pricing" options={{ presentation: "modal" }} />
      <Stack.Screen name="modals/scanpay" options={{ presentation: "modal" }} />
    </Stack>
  );
}
