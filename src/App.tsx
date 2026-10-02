import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { DashboardView } from './components/DashboardView.js';
import { BatteryRegistryView } from './components/BatteryRegistryView.js';
import { AddBatteryView } from './components/AddBatteryView.js';
import { BatteryDetailsView } from './components/BatteryDetailsView.js';
import { HealthAssessmentView } from './components/HealthAssessmentView.js';
import { DigitalPassportView } from './components/DigitalPassportView.js';
import { LifecycleHistoryView } from './components/LifecycleHistoryView.js';
import { CircularRoutingView } from './components/CircularRoutingView.js';
import { SettingsView } from './components/SettingsView.js';
import { Battery, LifecycleEvent, ChainVerificationResult, SystemSettings, PulseTestInput, PulseTestResult } from './types/index.js';
import { Language } from './utils/translations.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('BAT-2026-001');
  const [showingDetails, setShowingDetails] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [searchQuery, setSearchQuery] = useState('');

  // Server state
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<any>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeEvents, setActiveEvents] = useState<LifecycleEvent[]>([]);
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all batteries
  const fetchBatteries = useCallback(async () => {
    try {
      const res = await fetch('/api/batteries');
      if (res.ok) {
        const data = await res.json();
        const list: Battery[] = Array.isArray(data)
          ? data
          : (Array.isArray(data?.batteries) ? data.batteries : []);
        setBatteries(list);
        if (list.length > 0 && !selectedBatteryId) {
          setSelectedBatteryId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching batteries:', err);
    }
  }, [selectedBatteryId]);

  // Fetch dashboard summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setDashboardSummary(data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data);
        if (data.language) setLanguage(data.language);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  // Fetch events for active battery
  const fetchEvents = useCallback(async (batteryId: string) => {
    try {
      const res = await fetch(`/api/events/${batteryId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveEvents(data.events || []);
        setVerificationResult(data.verification || null);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchBatteries(), fetchSummary(), fetchSettings()]);
      setIsLoading(false);
    };
    init();
  }, [fetchBatteries, fetchSummary, fetchSettings]);

  // Whenever selectedBatteryId changes, load its event chain
  useEffect(() => {
    if (selectedBatteryId) {
      fetchEvents(selectedBatteryId);
    }
  }, [selectedBatteryId, fetchEvents]);

  // Navigation handlers
  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setShowingDetails(false);
  };

  const handleNavigateWithBattery = (tab: NavTab, batteryId?: string) => {
    if (batteryId) {
      setSelectedBatteryId(batteryId);
    }
    setCurrentTab(tab);
    setShowingDetails(false);
  };

  const handleRegistryAction = (batteryId: string, action: 'details' | 'assessment' | 'passport' | 'lifecycle') => {
    setSelectedBatteryId(batteryId);
    if (action === 'details') {
      setShowingDetails(true);
    } else {
      setShowingDetails(false);
      setCurrentTab(action);
    }
  };

  // Assessment Runner
  const handleRunAssessment = async (input: PulseTestInput, targetBatteryId?: string): Promise<PulseTestResult> => {
    const batteryId = targetBatteryId || selectedBatteryId;
    const res = await fetch('/api/assessment/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batteryId, input })
    });
    if (!res.ok) {
      throw new Error('Assessment failed');
    }
    const data = await res.json();
    // Refresh batteries and summary to show newly updated health
    fetchBatteries();
    fetchSummary();
    if (batteryId) fetchEvents(batteryId);
    return data;
  };

  // Commit Pulse Event
  const handleCommitEvent = async (batteryId: string, testResult: PulseTestResult) => {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batteryId,
        eventType: 'PULSE_HEALTH_TEST',
        actor: 'Diagnostics Hub Station 4',
        payload: {
          aiEstimatedSoh: testResult.aiEstimatedSoh,
          internalResistance: testResult.internalResistance,
          deltaV: testResult.deltaV,
          temperatureRise: testResult.temperatureRise,
          lifecycleStatus: testResult.lifecycleStatus,
          bmsComparison: testResult.bmsComparisonResult || 'Consistent'
        }
      })
    });
    fetchEvents(batteryId);
    fetchBatteries();
    fetchSummary();
  };

  // Add Battery
  const handleAddBattery = async (batteryData: any, importData?: any): Promise<boolean> => {
    const payload = {
      id: batteryData.id,
      manufacturer: batteryData.manufacturer,
      model: batteryData.model,
      chemistry: batteryData.chemistry,
      nominalVoltage: parseFloat(batteryData.nominalVoltage) || 400,
      ratedCapacity: parseFloat(batteryData.ratedCapacity) || 40,
      currentCapacity: parseFloat(batteryData.currentCapacity) || 38,
      cycleCount: parseInt(batteryData.cycleCount, 10) || 50,
      manufacturingDate: batteryData.manufacturingDate,
      currentOwner: batteryData.currentOwner || 'Fleet Operator',
      bmsSoh: parseFloat(batteryData.bmsSoh) || 95,
      bmsVoltage: parseFloat(batteryData.bmsVoltage) || 400,
      bmsCurrent: parseFloat(batteryData.bmsCurrent) || 0,
      bmsTemperature: parseFloat(batteryData.bmsTemperature) || 28,
      notes: batteryData.notes
    };

    const res = await fetch('/api/batteries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add battery');
    }

    // If telemetry file import is attached, upload it
    if (importData && importData.content) {
      await fetch('/api/import/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batteryId: payload.id,
          format: importData.format,
          data: importData.content
        })
      });
    }

    await fetchBatteries();
    await fetchSummary();
    setSelectedBatteryId(payload.id);
    return true;
  };

  // Delete Battery
  const handleDeleteBattery = async (batteryId: string) => {
    const res = await fetch(`/api/batteries/${batteryId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBatteries();
      await fetchSummary();
    }
  };

  // Verify Chain
  const handleVerifyChain = async (batteryId: string) => {
    const res = await fetch(`/api/events/${batteryId}/verify`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setVerificationResult(data);
    }
  };

  // Tamper Demo
  const handleTamperDemo = async (batteryId: string) => {
    const res = await fetch(`/api/events/${batteryId}/tamper-demo`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setActiveEvents(data.events || []);
      setVerificationResult(data.verification || null);
    }
  };

  // Restore Chain Demo
  const handleRestoreDemo = async (batteryId: string) => {
    await fetchEvents(batteryId);
  };

  // Add Custody Transfer
  const handleAddTransfer = async (batteryId: string, toOwner: string) => {
    const safeList = Array.isArray(batteries) ? batteries : [];
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batteryId,
        eventType: 'OWNERSHIP_TRANSFER',
        actor: 'Logistics Operations',
        payload: {
          previousOwner: safeList.find((b) => b.id === batteryId)?.currentOwner || 'Previous Owner',
          newOwner: toOwner,
          timestamp: new Date().toISOString()
        }
      })
    });
    fetchEvents(batteryId);
    fetchBatteries();
  };

  // Save Settings
  const handleSaveSettings = async (settings: SystemSettings) => {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      const updated = await res.json();
      setSystemSettings(updated);
    }
  };

  const safeBatteries = Array.isArray(batteries) ? batteries : [];
  const selectedBattery = safeBatteries.find((b) => b.id === selectedBatteryId) || safeBatteries[0];

  return (
    <div className="flex h-screen w-screen bg-[#071715] text-slate-100 overflow-hidden font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        language={language}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          language={language}
          onToggleLanguage={(l) => setLanguage(l)}
          settings={systemSettings}
        />

        {/* Dynamic Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {showingDetails && selectedBattery ? (
            <BatteryDetailsView
              battery={selectedBattery}
              events={activeEvents}
              verification={verificationResult || undefined}
              onBack={() => setShowingDetails(false)}
              onNavigateTab={(tab, id) => {
                setShowingDetails(false);
                if (id) setSelectedBatteryId(id);
                setCurrentTab(tab);
              }}
              language={language}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  summary={dashboardSummary}
                  batteries={safeBatteries}
                  onNavigate={handleNavigateWithBattery}
                  language={language}
                />
              )}

              {currentTab === 'registry' && (
                <BatteryRegistryView
                  batteries={safeBatteries}
                  onSelectBattery={handleRegistryAction}
                  onDeleteBattery={handleDeleteBattery}
                  onNavigateAdd={() => setCurrentTab('add-battery')}
                  language={language}
                />
              )}

              {currentTab === 'add-battery' && (
                <AddBatteryView
                  onSubmitBattery={handleAddBattery}
                  language={language}
                />
              )}

              {currentTab === 'assessment' && (
                <HealthAssessmentView
                  batteries={safeBatteries}
                  selectedBatteryId={selectedBatteryId}
                  onRunAssessment={handleRunAssessment}
                  onCommitEvent={handleCommitEvent}
                  language={language}
                />
              )}

              {currentTab === 'passport' && (
                <DigitalPassportView
                  batteries={safeBatteries}
                  selectedBatteryId={selectedBatteryId}
                  events={activeEvents}
                  verificationResult={verificationResult}
                  onVerifyChain={handleVerifyChain}
                  language={language}
                />
              )}

              {currentTab === 'lifecycle' && (
                <LifecycleHistoryView
                  batteries={safeBatteries}
                  selectedBatteryId={selectedBatteryId}
                  events={activeEvents}
                  verificationResult={verificationResult}
                  onVerifyChain={handleVerifyChain}
                  onTamperDemo={handleTamperDemo}
                  onRestoreDemo={handleRestoreDemo}
                  onAddTransfer={handleAddTransfer}
                  language={language}
                />
              )}

              {currentTab === 'routing' && (
                <CircularRoutingView language={language} />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  settings={systemSettings}
                  onSaveSettings={handleSaveSettings}
                  language={language}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
