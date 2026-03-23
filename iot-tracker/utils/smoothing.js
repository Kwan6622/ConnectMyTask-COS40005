import { MAX_DISTANCE } from "../config/constants";

// Process raw GPS samples and compute a cleaner location
export function smoothLocations(locations) {

// If no locations, return null
    if (!locations || locations.length === 0)
        return null;

    // step 1: Remove outliers based on distance
    const filtered = removeOutliers(locations);
    // step 2: Compute median and weighted average
    const median = medianLocation(filtered);
    const weighted = weightedAverage(filtered);
    // step 3: Combine median and weighted average for final location
    const finalLat = (median.latitude + weighted.latitude) / 2;
    const finalLng = (median.longitude + weighted.longitude) / 2;

    return {
        latitude: finalLat,
        longitude: finalLng,
        timestamp: Date.now()
    };
}

// Remove points that are too far from the majority
function removeOutliers(points) {
    let valid = [];
    for (let i = 0; i < points.length; i++) {
        let neighbors = 0;
        for (let j = 0; j < points.length; j++) {
            const d = calculateDistance(points[i], points[j]);
            if (d < MAX_DISTANCE) neighbors++;
        }
        if (neighbors >= points.length / 2) {
            valid.push(points[i]);
        }
    }
    return valid.length > 0 ? valid : points;
}

// Compute median latitude and longitude
function medianLocation(points) {

    const lats = points.map(p => p.latitude).sort((a,b)=>a-b);
    const lngs = points.map(p => p.longitude).sort((a,b)=>a-b);
    const mid = Math.floor(points.length / 2);
    return {
        latitude: lats[mid],
        longitude: lngs[mid]
    };
}

// Compute weighted average of latitude and longitude
function weightedAverage(points) {
    let lat = 0;
    let lng = 0;
    let weightSum = 0;

    points.forEach(p => {
        const weight = 1;
        lat += p.latitude * weight;
        lng += p.longitude * weight;
        weightSum += weight;
    });
    return {
        latitude: lat / weightSum,
        longitude: lng / weightSum
    };
}

// Haversine formula to calculate distance between two GPS points in meters
function calculateDistance(loc1, loc2) {
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
    return R * c;
}