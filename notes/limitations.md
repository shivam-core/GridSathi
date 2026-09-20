# Physical Operating Limitations

1. **Transformer Headroom:** Assumes continuous 250 kVA service rating without thermal derating during high ambient heat conditions.
2. **Discrete Switching:** Deferrable loads are modeled as non-preemptive blocks (once initiated, water pumping runs through its scheduled window).
3. **Power Factor:** Calculations assume near-unity power factor ($\cos\phi \ge 0.95$) maintained by campus capacitor banks.
4. **Data Latency:** Open-Meteo updates radiation estimates hourly; rapid sub-minute cloud edge transients are buffered by campus battery storage.
