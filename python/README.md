# VidyutPraman — Battery SOH & RUL Random Forest Model

This directory contains the AI/ML analytics pipeline for estimating State of Health (SOH) and Remaining Useful Life (RUL) of electric vehicle battery packs from controlled pulse tests and BMS telemetry.

## Model Inputs

1. `internal_resistance` ($R_{int}$ in $\Omega$): Calculated from pulse test ($\Delta V / \Delta I$).
2. `voltage_sag` ($\Delta V$ in Volts): Transient voltage drop under current load.
3. `cycle_count` (cycles): Cumulative charge/discharge cycles.
4. `temperature_rise` ($\Delta T$ in °C): Thermal response under load ($T_{final} - T_{initial}$).
5. `chemistry`: Battery cell chemistry (`Li-ion (NMC)`, `LiFePO4 (LFP)`, `LTO (Lithium Titanate)`, `Solid State`).
6. `rated_capacity` (kWh): Original nameplate capacity.
7. `current_capacity` (kWh): Estimated current accessible capacity.
8. `bms_soh` (%): SOH reported by on-board Battery Management System.

## Model Outputs

1. `estimated_soh`: State of Health percentage (0-100%).
2. `estimated_rul`: Remaining Useful Life in equivalent full cycles before retirement threshold (70%).
3. `confidence`: Confidence metric (0-100%) based on feature consistency, sensor noise, and thermal variance.

## Scripts

- **`prepare_dataset.py`**: Synthesizes a realistic degradation dataset (`dataset.csv`) using electrochemical degradation models.
  ```bash
  python3 python/prepare_dataset.py
  ```
- **`train.py`**: Trains the Random Forest ensemble and serializes the weights to `model.json`.
  ```bash
  python3 python/train.py
  ```
- **`evaluate.py`**: Evaluates the model against test splits and outputs the benchmark report.
  ```bash
  python3 python/evaluate.py
  ```
- **`predict.py`**: Standalone CLI prediction bridge accepting JSON payloads via argument or stdin.
  ```bash
  python3 python/predict.py '{"chemistry": "Li-ion (NMC)", "rated_capacity": 40.0, "current_capacity": 32.8, "cycle_count": 850, "internal_resistance": 0.286, "voltage_sag": 14.3, "temperature_rise": 6.0, "bms_soh": 85.0}'
  ```

## Important Disclaimer

The included dataset and model are synthetic prototypes calibrated for demonstration and architectural evaluation. They must NOT be presented as certified laboratory degradation curves. A 10-second pulse test serves as a rapid screening assessment, not a certified full electrochemical cell teardown.
