#!/usr/bin/env python3
"""
VidyutPraman - Battery Aadhaar: Prediction Script
Accepts battery pulse & telemetry features and outputs SOH, RUL, and confidence scores.
Input can be passed via JSON string as the first argument, or via stdin.
"""

import json
import os
import sys

def encode_chemistry(chem):
    mapping = {
        'Li-ion (NMC)': 0,
        'LiFePO4 (LFP)': 1,
        'LTO (Lithium Titanate)': 2,
        'Solid State': 3
    }
    return mapping.get(chem, 0)

def predict_from_trees(trees, features):
    if not trees:
        return None
    preds = []
    for t in trees:
        val = features[t['feature_idx']]
        preds.append(t['left_pred'] if val <= t['split_value'] else t['right_pred'])
    return sum(preds) / len(preds)

def main():
    # Read input payload
    payload = None
    if len(sys.argv) > 1 and sys.argv[1].strip():
        try:
            payload = json.loads(sys.argv[1])
        except Exception:
            pass
            
    if payload is None:
        try:
            raw_input = sys.stdin.read().strip()
            if raw_input:
                payload = json.loads(raw_input)
        except Exception:
            pass
            
    if not payload:
        # Default test sample if no input provided
        payload = {
            'chemistry': 'Li-ion (NMC)',
            'rated_capacity': 40.0,
            'current_capacity': 32.8,
            'cycle_count': 850,
            'internal_resistance': 0.286,
            'voltage_sag': 14.3,
            'temperature_rise': 6.0,
            'bms_soh': 85.0
        }

    script_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(script_dir, 'model.json')

    chemistry = payload.get('chemistry', 'Li-ion (NMC)')
    rated_capacity = float(payload.get('rated_capacity', 40.0))
    current_capacity = float(payload.get('current_capacity', rated_capacity * 0.85))
    cycle_count = float(payload.get('cycle_count', 500))
    internal_resistance = float(payload.get('internal_resistance', 0.25))
    voltage_sag = float(payload.get('voltage_sag', 12.0))
    temperature_rise = float(payload.get('temperature_rise', 5.0))
    bms_soh = float(payload.get('bms_soh', 85.0))

    features = [
        encode_chemistry(chemistry),
        rated_capacity,
        current_capacity,
        cycle_count,
        internal_resistance,
        voltage_sag,
        temperature_rise,
        bms_soh
    ]

    method = "python_random_forest"
    estimated_soh = None
    estimated_rul = None

    if os.path.exists(model_path):
        try:
            with open(model_path, 'r', encoding='utf-8') as f:
                model = json.load(f)
            trees_soh = model.get('trees_soh', [])
            trees_rul = model.get('trees_rul', [])
            estimated_soh = predict_from_trees(trees_soh, features)
            estimated_rul = predict_from_trees(trees_rul, features)
        except Exception:
            estimated_soh = None

    # Fallback to electrochemical empirical baseline if model missing or invalid
    if estimated_soh is None:
        method = "prototype_fallback_estimator"
        # Empirical baseline:
        # Cap retention:
        cap_soh = (current_capacity / max(0.1, rated_capacity)) * 100.0
        # Resistance penalty:
        base_rint = 0.15 if 'NMC' in chemistry else 0.10
        rint_penalty = max(0.0, (internal_resistance - base_rint) * 45.0)
        # Cycle degradation:
        max_cyc = 2000.0 if 'NMC' in chemistry else 3500.0
        cycle_factor = (cycle_count / max_cyc) * 15.0
        
        estimated_soh = max(20.0, min(100.0, cap_soh * 0.6 + (100.0 - rint_penalty - cycle_factor) * 0.4))
        
        remaining_soh = max(0.0, estimated_soh - 70.0)
        estimated_rul = int(remaining_soh * (max_cyc / 30.0))

    estimated_soh = round(max(10.0, min(100.0, estimated_soh)), 1)
    estimated_rul = max(0, int(round(estimated_rul)))

    # Compute confidence score
    # Higher confidence when pulse readings are consistent and BMS SOH doesn't diverge wildly
    bms_diff = abs(estimated_soh - bms_soh) if bms_soh else 0
    confidence = 90
    if bms_diff > 10:
        confidence -= int(min(30, (bms_diff - 10) * 2))
    if internal_resistance > 0.4:
        confidence -= 15
    if temperature_rise > 12:
        confidence -= 10
    confidence = max(40, min(96, confidence))

    result = {
        'status': 'success',
        'estimation_method': method,
        'estimated_soh': estimated_soh,
        'estimated_rul': estimated_rul,
        'confidence': confidence,
        'features_used': {
            'chemistry': chemistry,
            'internal_resistance': internal_resistance,
            'voltage_sag': voltage_sag,
            'temperature_rise': temperature_rise,
            'cycle_count': cycle_count,
            'bms_soh': bms_soh
        },
        'disclaimer': 'SOH estimation is an AI/empirical screening indicator and does not replace certified laboratory teardown testing.'
    }

    print(json.dumps(result))

if __name__ == '__main__':
    main()
