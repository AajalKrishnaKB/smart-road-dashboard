"use client";
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Firebase Configuration
const firebaseConfig = {
  databaseURL: "https://smartroad-b5bf1-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export default function Dashboard() {
  const [sensorData, setSensorData] = useState({
    Voltage: 0.00,
    Current: 0.00,
    Solar: 0.00,
    Piezo: 0.00,
    LightState: 0,
  });

  const [stepCount, setStepCount] = useState(0);

  // Live Data Listener
  useEffect(() => {
    const roadRef = ref(database, "SmartRoad");
    const unsubscribe = onValue(roadRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSensorData(prevState => ({ ...prevState, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Kinetic Step Counter Logic (Increments when piezo spikes above 0.2V)
  useEffect(() => {
    if (sensorData.Piezo > 0.20) {
      setStepCount(prev => prev + 1);
    }
  }, [sensorData.Piezo]);

  // Derived Analytics Calculations
  const power_mW = Math.abs(sensorData.Voltage * sensorData.Current).toFixed(1);
  const batteryPercentage = Math.min(100, Math.max(0, ((sensorData.Voltage - 3.2) / (4.2 - 3.2)) * 100)).toFixed(0);
  const isCharging = sensorData.Current > 0;

  // Streetlight Logic Processor
  let lightStatusText = "Loading...";
  let lightColor = "text-gray-400";
  let lightBg = "bg-gray-900";
  let powerSaved = "0%";

  if (sensorData.LightState === 0) {
    lightStatusText = "Daytime (Off)";
    lightColor = "text-yellow-400";
    lightBg = "bg-yellow-400/10";
    powerSaved = "100%";
  } else if (sensorData.LightState === 1) {
    lightStatusText = "Standby (30%)";
    lightColor = "text-blue-400";
    lightBg = "bg-blue-400/10";
    powerSaved = "70%";
  } else if (sensorData.LightState === 2) {
    lightStatusText = "Vehicle (100%)";
    lightColor = "text-red-500";
    lightBg = "bg-red-500/10";
    powerSaved = "0%";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-8 selection:bg-blue-500/30">
      
      {/* Header Section */}
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Self-Powered Smart Road
          </h1>
          <p className="text-slate-400 mt-2 text-sm tracking-wide uppercase">
            Mar Athanasius College of Engineering • EEE Microgrid Prototype
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
          <span className="relative flex h-3 w-3 mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-300">Live Firebase Telemetry</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* 1. Battery & Power Hub */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <h2 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs">Battery System</h2>
          <div className="flex justify-between items-end mb-2">
            <div className="text-5xl font-bold text-slate-100">{Number(sensorData.Voltage).toFixed(2)}<span className="text-2xl text-slate-500 ml-1">V</span></div>
            <div className="text-emerald-400 font-semibold">{batteryPercentage}%</div>
          </div>
          {/* Battery Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${batteryPercentage}%` }}></div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <div className="text-slate-500 text-xs uppercase">Power Draw</div>
              <div className="text-lg text-slate-300 font-medium">{power_mW} mW</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs uppercase">Status</div>
              <div className={`text-lg font-medium ${isCharging ? 'text-amber-400' : 'text-blue-400'}`}>
                {isCharging ? 'Charging' : 'Discharging'}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Solar Array */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <h2 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs">Solar Tracking Array</h2>
          <div className="text-5xl font-bold text-amber-400 mb-6 flex items-baseline">
            {Number(sensorData.Solar).toFixed(2)}<span className="text-2xl text-amber-400/50 ml-1">V</span>
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Servo Actuator</span>
              <span className="text-emerald-400 text-sm font-medium">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Generation</span>
              <span className="text-slate-300 text-sm">{sensorData.Solar > 0.5 ? 'Active' : 'Idle'}</span>
            </div>
          </div>
        </div>

        {/* 3. Piezo Footpath */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <h2 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs">Kinetic Footpath</h2>
          <div className="text-5xl font-bold text-purple-400 mb-6 flex items-baseline">
            {Number(sensorData.Piezo).toFixed(2)}<span className="text-2xl text-purple-400/50 ml-1">V</span>
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Impact Detected</span>
              <span className="text-slate-300 text-sm font-medium">{stepCount} Steps</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Rectifier Circuit</span>
              <span className="text-emerald-400 text-sm font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* 4. Smart Streetlights */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-1 ${lightBg.replace('/10', '')}`}></div>
          <h2 className="text-slate-400 font-medium mb-6 uppercase tracking-wider text-xs">Road Lighting</h2>
          <div className={`inline-flex px-4 py-2 rounded-lg font-bold text-2xl mb-6 border ${lightColor} ${lightBg} border-current/20`}>
            {lightStatusText}
          </div>
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Energy Saved</span>
              <span className="text-emerald-400 text-sm font-medium">{powerSaved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Laser Break-Beam</span>
              <span className="text-slate-300 text-sm font-medium">Armed</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}