#!/usr/bin/env python3
"""
VidyutPraman - Battery Aadhaar: Random Forest Training Script
Trains an SOH & RUL model using the generated dataset.
Supports both scikit-learn (if installed) and a built-in pure-Python ensemble regressor fallback,
saving learned ensemble weights into 'model.json'.
"""

import csv
import json
import math
import os
import random

def load_data(filepath):
    samples = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            samples.append({
                'chemistry': row['chemistry'],
                'rated_capacity': float(row['rated_capacity']),
                'current_capacity': float(row['current_capacity']),
                'cycle_count': float(row['cycle_count']),
                'internal_resistance': float(row['internal_resistance']),
                'voltage_sag': float(row['voltage_sag']),
                'temperature_rise': float(row['temperature_rise']),
                'bms_soh': float(row['bms_soh']),
                'true_soh': float(row['true_soh']),
                'estimated_rul': float(row['estimated_rul'])
            })
    return samples

def encode_chemistry(chem):
    mapping = {
        'Li-ion (NMC)': 0,
        'LiFePO4 (LFP)': 1,
        'LTO (Lithium Titanate)': 2,
        'Solid State': 3
    }
    return mapping.get(chem, 0)

def extract_features(sample):
    return [
        encode_chemistry(sample['chemistry']),
        sample['rated_capacity'],
        sample['current_capacity'],
        sample['cycle_count'],
        sample['internal_resistance'],
        sample['voltage_sag'],
        sample['temperature_rise'],
        sample['bms_soh']
    ]

def train_ensemble_fallback(X, y_soh, y_rul, n_estimators=10):
    """
    Lightweight, deterministic decision stump/tree ensemble for environments
    without scikit-learn. Fits decision trees across bootstrapped feature splits.
    """
    trees_soh = []
    trees_rul = []
    
    n_samples = len(X)
    feature_names = [
        'chem_code', 'rated_cap', 'current_cap', 'cycle_count',
        'rint', 'v_sag', 'temp_rise', 'bms_soh'
    ]
    
    # Train simple ensemble partitions
    for tree_idx in range(n_estimators):
        # Bootstrap sample
        indices = [random.randint(0, n_samples - 1) for _ in range(n_samples)]
        sub_X = [X[i] for i in indices]
        sub_y_soh = [y_soh[i] for i in indices]
        sub_y_rul = [y_rul[i] for i in indices]
        
        # Select best split feature for SOH (primary feature: capacity ratio, Rint, cycles)
        feat_idx = random.choice([2, 3, 4, 5, 7])
        split_val = sorted([row[feat_idx] for row in sub_X])[len(sub_X) // 2]
        
        left_soh = [sub_y_soh[i] for i in range(len(sub_X)) if sub_X[i][feat_idx] <= split_val]
        right_soh = [sub_y_soh[i] for i in range(len(sub_X)) if sub_X[i][feat_idx] > split_val]
        
        left_rul = [sub_y_rul[i] for i in range(len(sub_X)) if sub_X[i][feat_idx] <= split_val]
        right_rul = [sub_y_rul[i] for i in range(len(sub_X)) if sub_X[i][feat_idx] > split_val]
        
        trees_soh.append({
            'feature_idx': feat_idx,
            'split_value': split_val,
            'left_pred': sum(left_soh) / max(1, len(left_soh)),
            'right_pred': sum(right_soh) / max(1, len(right_soh))
        })
        
        trees_rul.append({
            'feature_idx': feat_idx,
            'split_value': split_val,
            'left_pred': sum(left_rul) / max(1, len(left_rul)),
            'right_pred': sum(right_rul) / max(1, len(right_rul))
        })
        
    return trees_soh, trees_rul

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'dataset.csv')
    
    if not os.path.exists(dataset_path):
        print("Dataset not found. Running prepare_dataset.py first...")
        from prepare_dataset import main as prep_main
        prep_main()
        
    print(f"Loading dataset from: {dataset_path}")
    data = load_data(dataset_path)
    
    # 80/20 train/test split
    random.seed(42)
    random.shuffle(data)
    split_idx = int(0.8 * len(data))
    train_data = data[:split_idx]
    test_data = data[split_idx:]
    
    X_train = [extract_features(d) for d in train_data]
    y_soh_train = [d['true_soh'] for d in train_data]
    y_rul_train = [d['estimated_rul'] for d in train_data]
    
    X_test = [extract_features(d) for d in test_data]
    y_soh_test = [d['true_soh'] for d in test_data]
    y_rul_test = [d['estimated_rul'] for d in test_data]
    
    use_sklearn = False
    try:
        from sklearn.ensemble import RandomForestRegressor
        use_sklearn = True
        print("Found scikit-learn. Training RandomForestRegressor models...")
        soh_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        soh_model.fit(X_train, y_soh_train)
        
        rul_model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
        rul_model.fit(X_train, y_rul_train)
        
        # Test evaluation
        soh_preds = soh_model.predict(X_test)
        rul_preds = rul_model.predict(X_test)
        
        # Calculate test MAE
        soh_mae = sum(abs(p - t) for p, t in zip(soh_preds, y_soh_test)) / len(y_soh_test)
        rul_mae = sum(abs(p - t) for p, t in zip(rul_preds, y_rul_test)) / len(y_rul_test)
        
        print(f"Test MAE (Synthetic Benchmark): SOH = {soh_mae:.2f}%, RUL = {rul_mae:.0f} cycles")
    except ImportError:
        print("scikit-learn is not installed in the container.")
        print("Training native Python Random Forest ensemble trees...")
        
    trees_soh, trees_rul = train_ensemble_fallback(X_train, y_soh_train, y_rul_train, n_estimators=25)
    
    # Compute baseline metrics on test partition
    baseline_predictions = []
    for row in X_test:
        preds = []
        for t in trees_soh:
            val = row[t['feature_idx']]
            preds.append(t['left_pred'] if val <= t['split_value'] else t['right_pred'])
        baseline_predictions.append(sum(preds) / len(preds))
        
    mae = sum(abs(p - t) for p, t in zip(baseline_predictions, y_soh_test)) / len(y_soh_test)
    print(f"Prototype Benchmark Ensemble Evaluation: Mean Absolute Error = {mae:.2f}% (Synthetic illustrative test)")

    # Save model artifact
    model_artifact = {
        'model_type': 'VidyutPraman-RandomForest-Ensemble-Prototype',
        'status': 'Trained on synthetic battery degradation benchmark',
        'feature_indices': {
            'chem_code': 0,
            'rated_cap': 1,
            'current_cap': 2,
            'cycle_count': 3,
            'rint': 4,
            'v_sag': 5,
            'temp_rise': 6,
            'bms_soh': 7
        },
        'trees_soh': trees_soh,
        'trees_rul': trees_rul,
        'benchmark_mae_soh': round(mae, 2),
        'disclaimer': 'Model trained on synthetic illustrative dataset. Not calibrated against physical cell laboratory degradation tests.'
    }
    
    model_file = os.path.join(script_dir, 'model.json')
    with open(model_file, 'w', encoding='utf-8') as f:
        json.dump(model_artifact, f, indent=2)
        
    print(f"Model saved to: {model_file}")

if __name__ == '__main__':
    main()
