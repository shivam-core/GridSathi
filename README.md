# GridSathi: Loadshift ⚡️

**Uncertainty-Aware Campus Microgrid Twin & Edge Energy Dispatcher**

Live Demo: [GridSathi Loadshift on Vercel](https://acmsdggrisathiloadshift.vercel.app/)

GridSathi is an interactive, real-time digital twin and dispatch optimizer for a campus microgrid. It uses **Conformal Prediction** to forecast solar irradiance uncertainty and a **Constraint-Satisfaction Heuristic Engine** to dynamically reschedule deferrable heavy loads (EV banks, HVAC systems, water pumps) to prevent transformer overloads and maximize renewable energy utilization.

---

## 🎯 Key Features

1. **Interactive "What-If" Simulator**: A live React-based dashboard where you can manually spike campus demand or simulate volatile weather conditions (Overcast, Variable, Clear) to watch the AI engine instantly recalculate safety margins and shift load schedules in real-time.
2. **Conformal Prediction Engine**: Moves beyond point-forecasts by computing robust confidence bounds ($P_{05}, P_{50}, P_{95}$) for solar generation, ensuring edge systems never over-commit power based on faulty weather predictions.
3. **Dynamic Load Dispatcher**: Automatically calculates optimal time windows for campus loads, strictly adhering to the 250 kW physical transformer limit. If a load threatens to blow the grid, it is dynamically locked out.
4. **Bi-Directional Edge Simulator**: Includes a Python client (`edge_simulator.py`) that acts as a local hardware gateway (e.g., Raspberry Pi or ESP32), reading physical grid status and fetching switching commands from the cloud.

---

## 🏗 Technical Architecture

The system is built with a modular, decoupled architecture optimized for rapid edge-execution and real-time visualization.

### 1. Frontend: The Digital Twin Dashboard (Client-Side)
- **Framework:** Next.js 14 (App Router) & React 18
- **Styling:** Tailwind CSS for a premium, responsive, dark-mode aesthetic.
- **Visualization:** `Recharts` for performant SVG-based data plotting.
- **Logic:** Entirely Client-Side Rendered (CSR) via `'use client'` components. The simulation engine runs in the browser, allowing for sub-millisecond recalculations when a user drags the demand slider.

### 2. Core Engine: Mathematics & Optimization (`lib/`)
- **`conformal.ts`**: The forecasting module. It synthesizes a baseline diurnal solar curve and campus demand curve. Based on the selected weather volatility, it calculates residual magnitudes and applies a 1.645 multiplier (approximating a 90-95% confidence interval) to generate the lower ($P_{05}$) and upper ($P_{95}$) bounds.
- **`optimizer.ts`**: The constraint-satisfaction solver. It iterates through available deferrable campus loads (sorted by priority and capacity) and attempts to slot them into contiguous time windows where the `Net Grid Draw` (Base Demand + New Load - Solar $P_{05}$) remains strictly beneath the 250 kW physical transformer ceiling.

### 3. Backend: Serverless API (`app/api/`)
Designed to run on Vercel's Edge/Serverless infrastructure with < 50ms response times.
- **`GET /api/dispatch`**: An endpoint for edge hardware to poll for its daily/hourly relay schedule.
- **`POST /api/telemetry`**: An endpoint for edge hardware to ingest physical meter readings back into the cloud twin.

### 4. Edge Hardware Simulator (`edge_simulator.py`)
A standalone Python client using the `requests` library. It simulates a local SCADA/IoT gateway running on-campus. It authenticates with the cloud, fetches the dispatch schedule via REST API, and simulates the physical switching of relays (armed vs. locked).

---

## ⚙️ How It Works (The Logic)

1. **Uncertainty Quantification**: The system doesn't trust the median forecast ($P_{50}$). Instead, it looks at the $P_{05}$ (the worst-case solar scenario). 
2. **Safe Floor Calculation**: It calculates the available "safe" capacity for any given hour.
3. **Heuristic Packing**: Heavy loads (like a 45kW Water Pump requiring 3 hours of runtime) are tested against contiguous blocks of time. 
4. **Interlock Mechanism**: If moving a load into a time block causes the total grid draw to exceed 250 kW, the load is rejected for that hour. If demand spikes globally, loads are relegated to `UNABLE TO SCHEDULE (HOLD)` to prevent grid collapse.

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python 3.9+ (for the edge simulator)

### 1. Run the Web Application
```bash
git clone https://github.com/shivam-core/GridSathi.git
cd GridSathi
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the interactive dashboard.

### 2. Run the Edge Hardware Simulator
In a separate terminal window:
```bash
python3 edge_simulator.py
```
You will see console output simulating the physical gateway fetching schedules and switching relays.

---

## 📝 Disclaimer
*Created for PS-19: AI Energy Forecasting and Smart Demand Scheduling.*
All demonstration data, tariffs, solar profiles, and impact figures are synthetic or illustrative. No equipment control or field-validated savings are claimed.
