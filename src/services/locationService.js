import { GPS_SAMPLE_COUNT } from "../config/constants";
import { smoothLocations } from "../utils/smoothing";

// Collect multiple GPS samples and apply a smoothing algorithm to increase accuracy
let isCapturing = false;
const SAMPLE_INTERVAL = 500; // 0.5s

// Calculate distance between 2 locations (Haversine)
export function getDistance(loc1, loc2) {
    const R = 6371e3;
    const φ1 = loc1.latitude * Math.PI / 180;
    const φ2 = loc2.latitude * Math.PI / 180;
    const Δφ = (loc2.latitude - loc1.latitude) * Math.PI / 180;
    const Δλ = (loc2.longitude - loc1.longitude) * Math.PI / 180;

    const a =
        Math.sin(Δφ / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // meters
}
// Collect multiple GPS samples and return a smoothed final location
export async function startHighAccuracyGPS(getLocation) {

    if (isCapturing) return null;
    console.log("Starting high accuracy GPS capture");
    isCapturing = true;
    let gpsBuffer = [];
    let finished = false;

    return new Promise((resolve) => {

        const interval = setInterval(async () => {
            if (finished) return;
            try {
                const loc = await getLocation();

                if (finished) return;
                gpsBuffer.push({
                    latitude: loc.latitude,
                    longitude: loc.longitude
                });

                if (gpsBuffer.length >= GPS_SAMPLE_COUNT) {
                    finished = true;
                    clearInterval(interval);

                    // Apply smoothing algorithm
                    const finalLocation = smoothLocations(gpsBuffer);
                    console.log("Final Location:", finalLocation);
                    isCapturing = false;
                    
                    //return the final smoothed location
                    resolve(finalLocation);
                }

            } catch (err) {
                // Log GPS error if process not finished
                if (!finished) {
                    console.log("GPS error:", err);
                }
            }
        }, SAMPLE_INTERVAL);
    });
}