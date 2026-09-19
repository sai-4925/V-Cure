"use client";

import { useState } from "react";
import { Watch, Plus, Check, X, Info, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeviceOption {
  id: string;
  name: string;
  brand: string;
  category: string;
  iconBg: string;
}

const WEARABLE_DEVICES: DeviceOption[] = [
  { id: "apple-watch", name: "Apple Watch (Series / Ultra)", brand: "Apple", category: "Smartwatch", iconBg: "bg-slate-900 text-white" },
  { id: "fitbit", name: "Fitbit (Sense / Charge / Versa)", brand: "Fitbit", category: "Fitness Band", iconBg: "bg-teal-600 text-white" },
  { id: "garmin", name: "Garmin (Forerunner / Venu / Fenix)", brand: "Garmin", category: "Sports Watch", iconBg: "bg-blue-600 text-white" },
  { id: "samsung-galaxy-watch", name: "Samsung Galaxy Watch (6 / 7)", brand: "Samsung", category: "Smartwatch", iconBg: "bg-indigo-600 text-white" },
  { id: "google-pixel-watch", name: "Google Pixel Watch (2 / 3)", brand: "Google", category: "Smartwatch", iconBg: "bg-emerald-600 text-white" },
  { id: "xiaomi-amazfit", name: "Xiaomi Mi Band / Amazfit", brand: "Xiaomi", category: "Smart Band", iconBg: "bg-orange-600 text-white" }
];

export function FitnessDevicesSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectedDemoDevices, setConnectedDemoDevices] = useState<DeviceOption[]>([
    WEARABLE_DEVICES[0]! // Default demo device showcase
  ]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAddDevice = (device: DeviceOption) => {
    if (!connectedDemoDevices.some((d) => d.id === device.id)) {
      setConnectedDemoDevices((prev) => [...prev, device]);
    }
    setToastMessage(
      `${device.name} selected in Demo mode. Real-time wearable synchronization is Coming Soon in V-Cure v2.0.`
    );
    setIsModalOpen(false);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleRemoveDevice = (deviceId: string) => {
    setConnectedDemoDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-md space-y-4">
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Watch className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">Fitness Devices</h2>
            <p className="text-[11px] font-medium text-gray-400">
              Connect your fitness wearable to bring activity &amp; wellness data into V-Cure.
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Device
        </Button>
      </div>

      {/* Demo Status Banner */}
      {toastMessage ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-900 animate-in fade-in duration-200">
          <Info className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      {/* Connected Devices List (Demo Mode) */}
      <div className="space-y-3 pt-1">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
          PAIRED DEMO WEARABLES ({connectedDemoDevices.length})
        </span>

        {connectedDemoDevices.length > 0 ? (
          <div className="space-y-2">
            {connectedDemoDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/70 p-3.5 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold text-xs ${device.iconBg}`}
                  >
                    <Watch className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-gray-900">{device.name}</h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-800 uppercase tracking-wider">
                        Demo / Coming Soon
                      </span>
                    </div>
                    <p className="text-[10px] font-medium text-gray-400">
                      Wearable integration showcase • No live data spoofed
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveDevice(device.id)}
                  className="text-xs font-bold text-gray-400 hover:text-red-600 p-1"
                  aria-label="Remove demo device"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-400">
              No demo wearables paired yet. Click &quot;Add Device&quot; to preview integrations.
            </p>
          </div>
        )}
      </div>

      {/* Add Device Modal */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-extrabold text-gray-900">Select Fitness Wearable</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs font-medium text-gray-500">
              Select your fitness wearable brand. Wearable hardware API sync is currently in Showcase Demo mode for V-Cure v2.0.
            </p>

            <div className="space-y-2">
              {WEARABLE_DEVICES.map((device) => {
                const isSelected = connectedDemoDevices.some((d) => d.id === device.id);
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => handleAddDevice(device)}
                    className="w-full flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50/80 p-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${device.iconBg}`}
                      >
                        <Watch className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">{device.name}</span>
                        <span className="text-[10px] font-medium text-gray-400">{device.category}</span>
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-extrabold text-amber-800 uppercase shrink-0">
                      {isSelected ? "Paired (Demo)" : "Coming Soon"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
