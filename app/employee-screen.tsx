import * as Location from "expo-location";
import { useEffect } from "react";
import { Alert, Button, View } from "react-native";
import { getDistance, startHighAccuracyGPS } from "../src/services/locationService";

// Simulated guest location from server
const guestLocation = {
  latitude: 10.7993,
  longitude: 106.69968,
};

export default function EmployeeScreen() {

  // Request location permission when screen loads
  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
  }, []);

  // Get current GPS position
  async function getLocation() {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  }

  // Check distance between employee and guest
  async function handleCheck() {

    // Get accurate GPS location
    const employeeLocation = await startHighAccuracyGPS(getLocation);
    if (!employeeLocation) return;

    // Debug logs
    console.log("Employee:", employeeLocation);
    console.log("Guest:", guestLocation);

    // Calculate distance
    const distance = getDistance(employeeLocation, guestLocation);
    console.log("Distance:", distance);

    // Show result
    if (distance <= 50) {
      Alert.alert("Guest location reached!");
    } else {
      Alert.alert("Remaining: " + Math.round(distance) + "m");
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Button title="Check GPS" onPress={handleCheck} />
    </View>
  );
}