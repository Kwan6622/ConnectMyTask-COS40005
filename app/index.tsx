import { useRouter } from "expo-router";
import { Button, View } from "react-native";

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      
      <Button
        title="Go to Guest Screen"
        onPress={() => router.push("/guest-screen")}
      />

      <Button
        title="Go to Employee Screen"
        onPress={() => router.push("/employee-screen")}
      />

    </View>
  );
}