# Smart Lighting Safety IoT Dashboard

This project provides a frontend monitoring dashboard for the **Smart Lighting Safety** IoT project. 
The core focus of this project is **safety through intelligent lighting** (improving visibility in dark areas when motion is detected), rather than energy savings.

## Core Behavior
The system operates on a simple premise:
**Low ambient light + motion detected → increase lighting → improve visibility.**

## Dashboard Features
The dashboard is designed with an extremely simple and clean UI, free of unnecessary decorative elements, to prioritize critical monitoring data.

- **Overall Safety Status:** A prominent banner indicating whether the area is secure or if a safety response is currently active.
- **Device Online Status:** Real-time indication of the ESP32 connection state.
- **Sensor Telemetry (Cards):**
  - **Ambient Light (LDR):** Displays the current Light Dependent Resistor ADC value.
  - **Motion Sensor:** Shows the real-time state of the RCWL-0516 motion sensor.
  - **Lighting Output (PWM):** Displays the current Pulse Width Modulation value (0-255) sent to the lighting system.
  - **Safety Events:** A counter tracking how many times the system responded to motion in low-light conditions.
- **Telemetry History Graph:** A time-series chart plotting both the ambient light and the lighting output, visually demonstrating the system's responsiveness to environmental changes.
- **Recent Event Log:** A live feed detailing the timestamps and descriptions of recent safety responses.

## Mock Sensor Service
Currently, the dashboard uses a **Mock Sensor Service** (`src/lib/mockSensorService.ts`) to simulate ESP32 hardware telemetry. 
This decoupled service generates realistic data transitions (e.g., ramping up PWM when it gets dark and motion is detected). 
In the future, this service will be replaced by a real cloud API or WebSocket connection without requiring any rewrites to the UI components.

## Tech Stack
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Recharts (for telemetry visualization)
- Lucide React (for lightweight iconography)

## Getting Started (Step-by-Step Guide for Beginners)

If you're setting this up on a new computer, follow these simple steps:

### 1. Download and Install Node.js
Node.js is required to run the project code.
1. Download **Node.js (LTS version)** from [nodejs.org](https://nodejs.org/).
2. Run the installer and click **Next** on all steps with default settings.
3. Verify installation by opening your Terminal / Command Prompt and running:
   ```bash
   node -v
   npm -v
   ```

---

### 2. Download / Clone the Repository
- If using Git:
  ```bash
  git clone <repository-url>
  cd smart-lighting-iot
  ```
- Or download the project ZIP from GitHub, extract it, and open Command Prompt / Terminal inside the project folder (`smart-lighting-iot`).

---

### 3. Install Project Dependencies
Run this command in the project folder to download all required packages:
```bash
npm install
```

---

### 4. Run the Application
Start the local development server:
```bash
npm run dev
```

---

### 5. Open in Browser
Open your browser (Chrome, Edge, Firefox) and go to:
👉 **[http://localhost:3000](http://localhost:3000)**

You should now see the live Smart Lighting Safety dashboard and interactive road simulation!

