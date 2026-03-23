# IoT GPS Tracker

A simple GPS tracking prototype built with Expo and React Native.

The application collects multiple GPS samples and applies a smoothing algorithm to improve location accuracy.

## Features
* High accuracy GPS sampling
* Multiple GPS readings
* Outlier detection
* Median filtering
* Average smoothing
* Distance calculation between employee and guest
* Optional API upload

## How It Works
1. Guest captures and adjusts location on the map.
2. The app collects multiple GPS samples and smooths the result.
3. Guest location is saved (simulated or from server).
4. Employee captures their current GPS location.
5. The system calculates distance between employee and guest.
6. If distance ≤ 50m → success, otherwise show remaining distance.

## Screens
1. GuestScreen
Capture GPS location
Display location on map
Allow long press or drag marker to adjust position
Automatically convert coordinates to address

2. EmployeeScreen
Capture current GPS location
Compare with guest location
Calculate distance
Show alert if reached or remaining distance

## Project Structure
app/index.tsx
Main entry of the app.

app/GuestScreen.tsx
UI for guest to select and adjust location.

app/EmployeeScreen.tsx
UI for employee to check distance to guest.

src/config/constants.js
Global configuration (sample count, delay, etc.).

src/services/locationService.js
Handles GPS sampling, smoothing, and distance calculation.

src/services/apiService.js
Handles sending data to backend (optional).

src/utils/smoothing.js
Implements filtering and averaging algorithm.

## Installation
Install dependencies:

npm install

Run the project:

npx expo start

## How to Use
Open the app
Allow location permission
Go to Guest screen → set location
Go to Employee screen → press Check GPS
View result

## Example Output
[PRESS BUTTON]
Starting high accuracy GPS capture
Collecting samples...
Filtering noise...
Final Location: { latitude: ..., longitude: ... }

Distance: 32m
→ Guest location reached

## Technologies
* React Native
* Expo
* JavaScript
* Haversine distance formula
* GPS/Location API

# Permissions
The app requires location permission to work properly.
If permission is denied, GPS cannot be accessed.

## License
MIT
