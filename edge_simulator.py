"""
GridSathi: Loadshift - Edge Gateway Hardware Simulator
Simulates a campus substation controller querying Vercel for dispatch instructions.
"""
import time
import requests
import json
import random

# Replace with your production Vercel domain once deployed
TARGET_ENDPOINT = "http://localhost:3000" 

def query_telemetry():
    url = f"{TARGET_ENDPOINT}/api/telemetry"
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            metrics = data.get("metrics", {})
            print(f"\n[EDGE GATEWAY] Telemetry Ingestion Successful")
            print(f"  ├─ Peak Grid Demand   : {metrics.get('peakGridDemandKw')} kW")
            print(f"  ├─ Shaved Peak Power  : {metrics.get('peakShavedKw')} kW")
            print(f"  └─ Solar Absorption   : {metrics.get('solarSelfConsumptionRate')}")
            return data.get("actuatedRelays", [])
        else:
            print(f"[EDGE ERROR] Telemetry responded with HTTP {response.status_code}")
            return []
    except Exception as exc:
        print(f"[EDGE ERROR] Unable to reach cloud endpoint: {exc}")
        return []

def trigger_relay_actuation(relay):
    url = f"{TARGET_ENDPOINT}/api/dispatch"
    payload = {
        "relayId": relay.get("id"),
        "action": "ENABLE" if relay.get("status") == "SCHEDULED" else "HOLD",
        "targetKw": relay.get("capacityKw", 0)
    }
    try:
        response = requests.post(url, json=payload, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"[RELAY ACTUATOR] {relay.get('name')}")
            print(f"  ├─ State      : {result.get('state')}")
            print(f"  ├─ Load       : {result.get('dispatchedKw')} kW")
            print(f"  └─ Compliance : {result.get('gridSafetyStandard')}")
        else:
            print(f"[RELAY ERROR] Failed to actuate {relay.get('id')}")
    except Exception as exc:
        print(f"[RELAY ERROR] Network timeout: {exc}")

def main():
    print("=" * 65)
    print("  GridSathi: Loadshift - Edge Microgrid Client Simulator")
    print(f"  Connecting to: {TARGET_ENDPOINT}")
    print("=" * 65)
    
    cycle = 1
    while True:
        print(f"\n--- [Cycle #{cycle} - {time.strftime('%H:%M:%S')}] ---")
        relays = query_telemetry()
        for relay in relays:
            trigger_relay_actuation(relay)
            time.sleep(0.5)
            
        print("\nSleeping 15 seconds until next telemetry cycle...")
        time.sleep(15)
        cycle += 1

if __name__ == "__main__":
    main()
