import { SERVER_URL } from "../config/constants";

export async function sendLocation(location) {
  try {
    const body = {
      taskId: 1,
      providerId: 1,
      lat: location.latitude,
      lng: location.longitude,
      timestamp: new Date().toISOString()
    };

    const res = await fetch(`${SERVER_URL}/api/tracking/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Server response:", data);

  } catch (err) {
    console.log("API error:", err);
  }
}