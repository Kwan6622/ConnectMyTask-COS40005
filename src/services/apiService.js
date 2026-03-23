import { SERVER_URL, USER_ID } from "../config/constants";

//Send the final processed GPS location to the backend server.
export async function sendLocation(location) {

    // Prepare request body
    try {
        const body = {
            userId: USER_ID,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: location.timestamp
        };

        // Send POST request to backend
        const res = await fetch(SERVER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        // Convert response to JSON
        const data = await res.json();
        console.log("Server response:", data);
        
    } catch (err) { // Handle errors
        console.log("API error:", err);
    }

}