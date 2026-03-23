import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { startHighAccuracyGPS } from "../src/services/locationService";

// Main screen for guest to select and adjust location
export default function GuestScreen() {

  // Define location type
  type LocationType = {
    latitude: number;
    longitude: number;
  };

  // State: store location and address
  const [guestLocation, setGuestLocation] = useState<LocationType | null>(null);
  const [address, setAddress] = useState<string>("");

  // Ask permission when screen loads
  useEffect(() => {
    requestPermission();
  }, []);

  // Request location permission
  async function requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission denied");
    }
  }

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

  // Capture accurate GPS location
  async function handleCapture() {
    const finalLocation = await startHighAccuracyGPS(getLocation);
    if (!finalLocation) return;

    const newLoc = {
      latitude: finalLocation.latitude,
      longitude: finalLocation.longitude,
    };

    setGuestLocation(newLoc);

    // Auto fill address from coordinates
    fillAddress(newLoc);
  }

  // Convert coordinates to address
  async function fillAddress(location: LocationType) {
    try {
      const result = await Location.reverseGeocodeAsync(location);

      if (result.length > 0) {
        const place = result[0];

        const fullAddress =
          `${place.name || ""} ${place.street || ""}, ` +
          `${place.city || ""}, ${place.region || ""}`;

        setAddress(fullAddress);
      }
    } catch (err) {
      console.log("Reverse geocode error:", err);
    }
  }

  // Update address manually (no API call)
  async function handleSearchAddress(text: string) {
    setAddress(text);
  }

  return (
    <View style={{ flex: 1, paddingTop: 50, alignItems: "center" }}>

      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Guest Location
      </Text>

      <Button title="Capture Location" onPress={handleCapture} />

      {/* Show map when location is available */}
      {guestLocation && (
        <MapView
          style={{ width: 350, height: 300, marginTop: 20 }}
          region={{
            latitude: guestLocation.latitude,
            longitude: guestLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}

          // Long press to choose a new location
          onLongPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;

            const newLoc = { latitude, longitude };
            setGuestLocation(newLoc);

            fillAddress(newLoc);
          }}
        >
          {/* Draggable marker */}
          <Marker
            coordinate={guestLocation}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;

              const newLoc = { latitude, longitude };
              setGuestLocation(newLoc);

              fillAddress(newLoc);
            }}
          />
        </MapView>
      )}

      {/* Address input */}
      {guestLocation && (
        <TextInput
          placeholder="Enter address (optional)..."
          value={address}
          onChangeText={handleSearchAddress}
          style={{
            borderWidth: 1,
            width: 300,
            marginTop: 20,
            padding: 10,
          }}
        />
      )}

    </View>
  );
}