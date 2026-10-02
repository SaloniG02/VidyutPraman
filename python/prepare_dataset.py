#!/usr/bin/env python3
"""
VidyutPraman - Battery Aadhaar: Synthetic Training Dataset Generator
Generates an illustrative dataset for battery state-of-health (SOH) and 
remaining useful life (RUL) estimation using electrochemical degradation curves.

NOTE: This dataset is synthetic and intended for prototype training and evaluation.
Do NOT present this as real-world laboratory or field measurements.
"""

import csv
import math
import random
import os

CHEMISTRY_PROFILES = {
    'Li-ion (NMC)': {
        'max_cycles': 2000,
        'base_rint': 0.18, # Ohms
        'rint_growth_factor': 0.00015,
        'temp_sensitivity': 1.15
    },
    'LiFePO4 (LFP)': {
        'max_cycles': 3500,
        'base_rint': 0.12,
        'rint_growth_factor': 0.00008,
        'temp_sensitivity': 1.05
    },
    'LTO (Lithium Titanate)': {
        'max_cycles': 10000,
        'base_rint': 0.08,
        'rint_growth_factor': 0.00003,
        'temp_sensitivity': 0.95
    },
    'Solid State': {
        'max_cycles': 4000,
        'base_rint': 0.10,
        'rint_growth_factor': 0.00006,
        'temp_sensitivity': 1.0
    }
}

def generate_sample(sample_id):
    chemistry = random.choice(list(CHEMISTRY_PROFILES.keys()))
    profile = CHEMISTRY_PROFILES[chemistry]
    
    rated_capacity = random.choice([30.0, 40.0, 45.0, 50.0, 60.0, 75.0])
    
    # Generate age cycle count
    fraction_life = random.betavariate(1.8, 1.8) # spread across 0 to 1
    cycle_count = int(fraction_life * (profile['max_cycles'] * 1.1))
    
    # Base true SOH degradation model
    # SOH = 100 - (cycles / max_cycles)^0.8 * 30 + noise
    degradation = (cycle_count / profile['max_cycles']) ** 0.85 * 30.0
    true_soh = max(40.0, min(100.0, 100.0 - degradation + random.gauss(0, 1.5)))
    
    current_capacity = round((true_soh / 100.0) * rated_capacity * random.uniform(0.98, 1.02), 2)
    
    # Internal resistance increases as SOH decreases
    rint_increase = (100.0 - true_soh) * 0.006 * profile['rint_growth_factor'] * 1000
    internal_resistance = round(profile['base_rint'] + rint_increase + random.gauss(0, 0.015), 4)
    internal_resistance = max(0.05, internal_resistance)
    
    # Pulse test current: 50A test
    test_current = 50.0
    voltage_sag = round(test_current * internal_resistance + random.gauss(0, 0.5), 2)
    voltage_sag = max(1.0, voltage_sag)
    
    # Temperature rise during pulse test: proportional to I^2 * R * profile sensitivity
    base_temp_rise = (test_current ** 2 * internal_resistance * 0.005) * profile['temp_sensitivity']
    temperature_rise = round(base_temp_rise + random.uniform(1.0, 4.0), 2)
    
    # BMS SOH: often has drift or slight error
    bms_drift = random.gauss(0, 2.5)
    # Occasionally simulate BMS sensor lag or failure in 5% of cases
    if random.random() < 0.05:
        bms_drift += random.choice([-18.0, 20.0])
    bms_soh = round(max(30.0, min(100.0, true_soh + bms_drift)), 1)
    
    # Remaining useful life (cycles until SOH reaches 70% retirement)
    target_soh = 70.0
    if true_soh <= target_soh:
        rul = 0
    else:
        # Approximate remaining cycles
        remaining_soh_drop = true_soh - target_soh
        rate_per_cycle = 30.0 / profile['max_cycles']
        rul = int(remaining_soh_drop / rate_per_cycle * random.uniform(0.9, 1.1))
        rul = max(0, rul)
        
    return {
        'sample_id': f'SYN-{sample_id:04d}',
        'chemistry': chemistry,
        'rated_capacity': rated_capacity,
        'current_capacity': current_capacity,
        'cycle_count': cycle_count,
        'internal_resistance': internal_resistance,
        'voltage_sag': voltage_sag,
        'temperature_rise': temperature_rise,
        'bms_soh': bms_soh,
        'true_soh': round(true_soh, 2),
        'estimated_rul': rul
    }

def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.join(output_dir, 'dataset.csv')
    
    num_samples = 1200
    print(f"Generating {num_samples} illustrative synthetic battery samples...")
    
    fieldnames = [
        'sample_id', 'chemistry', 'rated_capacity', 'current_capacity',
        'cycle_count', 'internal_resistance', 'voltage_sag',
        'temperature_rise', 'bms_soh', 'true_soh', 'estimated_rul'
    ]
    
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for i in range(1, num_samples + 1):
            writer.writerow(generate_sample(i))
            
    print(f"Dataset successfully created at: {output_file}")

if __name__ == '__main__':
    main()
