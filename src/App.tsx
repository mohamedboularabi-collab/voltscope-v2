/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, ShieldAlert, ShieldCheck, Info, Settings2, Calculator, Plus, Trash2, Home, BookOpen, Sun, Car, Network, ArrowLeft, ChevronRight, LayoutDashboard, Battery, Activity, Gauge, Omega, Receipt, Euro, Shield, Flame, PlugZap, ClipboardList, CheckCircle2, Wrench, AlertTriangle, Lightbulb } from 'lucide-react';

const BREAKER_RATINGS = [6, 10, 16, 20, 32, 40, 63];
const CABLE_SECTIONS = [1.5, 2.5, 4, 6, 10, 16];
const COPPER_RESISTIVITY = 0.017; // Ω·mm²/m (at 20°C standard)
const INVERTER_EFFICIENCY = 0.95; 

const FAULTS = [
  {
    id: 'isolement',
    type: "Défaut d'isolement",
    icon: Shield,
    symptomes: [
      "Différentiel qui disjoncte",
      "Sensations de picotements au contact de masses métalliques",
      "Valeur de tension anormale entre masses et bornes actives",
      "Consommation excessive de courant",
      "Arc électrique à l'ouverture du sectionneur de terre",
      "Disjoncteurs en amont qui disjonctent dans les installations sans différentiel (trop de courant de fuite)"
    ],
    causes: "Câble abimé (clou, vis), humidité ou eau dans les prises/luminaires extérieurs, thermoplongeur détérioré, condensation, détérioration des isolants (rongeurs, surchauffe), inversion terre et phase.",
    risques: "Électrocution (contact direct ou indirect), surconsommation électrique (fuite).",
    appareil: "Mesureur d'isolement (mégohmmètre), pince de courant de fuite.",
    valeurs: "Valeur idéale : ∞ ; Valeur régl. mini : 0.5 MΩ (sous 500V).",
    valeursMesurees: "R < 0.5 MΩ (Fuite vers la terre détectée).",
    solutions: "Remplacement de l'appareil/composant (ballast, résistance), remplacement canalisation, remplacement de câble, étanchéité, assainissement.",
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconColor: 'border-blue-500 text-blue-500'
  },
  {
    id: 'surcharge',
    type: "Surintensité de surcharge",
    icon: Gauge,
    symptomes: [
      "Le disjoncteur tombe après un certain temps (laps de temps long)",
      "Échauffement du disjoncteur et des conducteurs",
      "Possible décoloration ou déformation du disjoncteur concerné",
      "Disjoncteur en amont (compteur) qui disjoncte vu que le courant est trop élevé"
    ],
    causes: "Circuit trop chargé (trop d'appareils), appareil consommant trop de courant (moteur bloqué), calibre disjoncteur insuffisant.",
    risques: "Détérioration de l'installation par surchauffe, incendie.",
    appareil: "Pince ampèremétrique, Ohmmètre (hors tension).",
    valeurs: "I ≤ In (Calibre) ; Résistance ≥ R (230 / Calibre).",
    valeursMesurees: "I > Calibre disjoncteur (ex: 18A pour un C16) ; Résistance plus grande que 3 Ω et moins que la limite (R = 230 / Calibre).",
    solutions: "Délester le circuit, diviser le circuit, adapter calibre/section ou adapter courbe de déclenchement.",
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    iconColor: 'border-orange-500 text-orange-500'
  },
  {
    id: 'court-circuit',
    type: "Surintensité de court-circuit",
    icon: Flame,
    symptomes: [
      "Bruit d'explosion",
      "Réaction immédiate lors du réarmement",
      "Déclenchement en amont",
      "Flash visible"
    ],
    causes: "Contact accidentel entre conducteurs actifs, erreur de raccordement, canalisation percée, appareil défectueux immergé.",
    risques: "Détérioration brutale de l'installation, incendie, brûlures par arc électrique.",
    appareil: "Ohmmètre (impérativement HORS TENSION).",
    valeurs: "Résistance ≥ R (230 / Calibre).",
    valeursMesurees: "R ≤ 3 Ω (Contact direct entre Phase et Neutre).",
    solutions: "Localiser/supprimer point de contact, réparer conducteurs, remplacer appareillage, corriger erreurs câblage.",
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'border-red-500 text-red-500'
  },
  {
    id: 'alimentation',
    type: "Défaut d'alimentation",
    icon: PlugZap,
    symptomes: [
      "Absence tension (installation bipolaire )",
      "Installation fonctionnant partiellement",
      "Baisse puissance lumineuse",
      "Certains appareils ne fonctionnent pas que quand d'autres fonctionnent",
      "Augmentation de voltage pour certains appareils et diminution pour d'autres (rupture neutre)"
    ],
    causes: "Panne réseau GRD, disjoncteur/différentiel déclenché, contacts brûlés, bornes desserrées/oxydées, fil mal inséré, rupture neutre.",
    risques: "Détérioration appareils (sous/survoltage), danger d'électrocution, non-fonctionnement services essentiels.",
    appareil: "Voltmètre ou testeur de tension (sous tension), testeur de continuité (hors tension).",
    valeurs: "230V entre phase et neutre.",
    valeursMesurees: "0 V ou tension anormale (< 210 V ou > 250 V).",
    solutions: "Réarmement, resserrage bornes, remplacement composants (télérupteur, prise), intervention GRD.",
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    iconColor: 'border-purple-500 text-purple-500'
  }
];

interface Appliance {
  id: string;
  name: string;
  power: number;
  hours: number;
  emoji: string;
}

export default function App() {
  const [selectedBreaker, setSelectedBreaker] = useState<number>(16);
  const [voltage, setVoltage] = useState<number>(230);
  const [measuredResistance, setMeasuredResistance] = useState<number | string>('');
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'threshold' | 'icc' | 'consumption' | 'notes' | 'solar' | 'ev-charger' | 'rj45' | 'autonomy'>('home');
  const [selectedFaultId, setSelectedFaultId] = useState<string>(FAULTS[0].id);

  // Icc Calculator State
  const [cableLength, setCableLength] = useState<number>(20);
  const [selectedSection, setSelectedSection] = useState<number>(2.5);

  // Consumption Calculator State
  const [kwhPrice, setKwhPrice] = useState<number>(0.25);
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: '1', name: 'Réfrigérateur', power: 150, hours: 0, emoji: '❄️' },
    { id: '2', name: 'Télévision', power: 100, hours: 0, emoji: '📺' },
    { id: '3', name: 'PC', power: 200, hours: 0, emoji: '💻' },
    { id: '4', name: 'Sèche-linge', power: 2500, hours: 0, emoji: '👕' },
    { id: '5', name: 'Lave-linge', power: 2000, hours: 0, emoji: '🧼' },
    { id: '6', name: 'Switch', power: 10, hours: 0, emoji: '🔌' },
    { id: '7', name: 'Caméra', power: 5, hours: 0, emoji: '📹' },
    { id: '8', name: 'Box Internet', power: 15, hours: 0, emoji: '📡' },
    { id: '9', name: 'Capteur lampe', power: 1, hours: 0, emoji: '💡' },
  ]);
  const [newAppliance, setNewAppliance] = useState({ name: '', power: '', hours: '0', emoji: '🔌' });

  // Solar State
  const [solarPanelPower, setSolarPanelPower] = useState<number>(400); // 400 W
  const [solarPanelCount, setSolarPanelCount] = useState<number>(10); // 10 panels
  const [sunlightHours, setSunlightHours] = useState<number>(4);
  const [solarAppliancePower, setSolarAppliancePower] = useState<number>(1000); // 1000 W
  const [solarTargetConsumption, setSolarTargetConsumption] = useState<number>(15); // 15 kWh/day
  const [solarInstantLoad, setSolarInstantLoad] = useState<number>(2000); // 2000 W
  const [solarBatteryAh, setSolarBatteryAh] = useState<number>(200); // 200 Ah
  const [solarBatteryVoltage, setSolarBatteryVoltage] = useState<number>(12); // 12V

  // Expert Calculator State
  const [expertPower, setExpertPower] = useState<number>(1000);
  const [expertResistance, setExpertResistance] = useState<number>(52.9);
  const [expertCurrent, setExpertCurrent] = useState<number>(4.35);
  const [expertQuantity, setExpertQuantity] = useState<number>(1);
  const [expertLastChange, setExpertLastChange] = useState<'power' | 'resistance' | 'current'>('power');
  
  // Billing State
  const [billingKWh, setBillingKWh] = useState<number>(0);
  const [billingPrice, setBillingPrice] = useState<number>(0.30);

  // EV Charger State
  const [batteryCapacity, setBatteryCapacity] = useState<number>(50); // 50 kWh
  const [chargerPower, setChargerPower] = useState<number>(7.4); // 7.4 kW (typical home wallbox)
  const [currentCharge, setCurrentCharge] = useState<number>(20); // 20%
  const [evPricePerKWh, setEvPricePerKWh] = useState<number>(0.30); // 0.30 €/kWh default

  // RJ45 State
  const [rjStandard] = useState<'T568B'>('T568B');

  const recommendedEVBreaker = useMemo(() => {
    if (chargerPower === 2.3 || chargerPower === 3.7) return 20;
    if (chargerPower === 7.4) return 32;
    
    const intensity = (chargerPower * 1000) / 230;
    const intensityWithMargin = intensity * 1.15;
    return [6, 10, 16, 20, 32, 40, 63].find(r => r >= intensityWithMargin) || 63;
  }, [chargerPower]);

  const minResistance = useMemo(() => {
    if (selectedBreaker <= 0) return Infinity;
    return Number((voltage / selectedBreaker).toFixed(3));
  }, [selectedBreaker, voltage]);

  const maxPower = useMemo(() => {
    return Number((voltage * selectedBreaker).toFixed(0));
  }, [selectedBreaker, voltage]);

  const measuredPower = useMemo(() => {
    const res = Number(measuredResistance);
    if (!res || res <= 0) return 0;
    return Number(((voltage * voltage) / res).toFixed(0));
  }, [measuredResistance, voltage]);

  const measuredCurrent = useMemo(() => {
    const res = Number(measuredResistance);
    if (!res || res <= 0) return 0;
    return Number((voltage / res).toFixed(4));
  }, [measuredResistance, voltage]);

  const iccResult = useMemo(() => {
    // R = rho * (2 * L) / S
    const resistance = (COPPER_RESISTIVITY * (2 * cableLength)) / selectedSection;
    const icc = voltage / resistance;
    // Chute de tension (Voltage Drop) = R * I (using selected breaker current)
    const voltageDrop = resistance * selectedBreaker;
    const voltageDropPercent = (voltageDrop / voltage) * 100;

    return {
      resistance: Number(resistance.toFixed(4)),
      icc: Number(icc.toFixed(2)),
      voltageDrop: Number(voltageDrop.toFixed(2)),
      voltageDropPercent: Number(voltageDropPercent.toFixed(2))
    };
  }, [cableLength, selectedSection, voltage, selectedBreaker]);

  const consumptionTotals = useMemo(() => {
    const dailyWh = appliances.reduce((sum, app) => sum + (app.power * app.hours), 0);
    const dailyKWh = dailyWh / 1000;
    const monthlyKWh = dailyKWh * 30;
    const yearlyKWh = dailyKWh * 365;
    
    const dailyCost = dailyKWh * kwhPrice;
    const monthlyCost = monthlyKWh * kwhPrice;
    const yearlyCost = yearlyKWh * kwhPrice;

    return { dailyKWh, monthlyKWh, yearlyKWh, dailyCost, monthlyCost, yearlyCost };
  }, [appliances, kwhPrice]);

  const addAppliance = (preset?: { name: string, power: number, emoji: string }) => {
    const appliance = preset 
      ? { ...preset, hours: 1 } 
      : { 
          name: newAppliance.name, 
          power: Number(newAppliance.power), 
          hours: Number(newAppliance.hours), 
          emoji: newAppliance.emoji 
        };

    if (appliance.name && appliance.power) {
      setAppliances([
        ...appliances,
        {
          id: Math.random().toString(36).substr(2, 9),
          name: appliance.name,
          power: appliance.power,
          hours: appliance.hours || 0,
          emoji: appliance.emoji || '🔌',
        },
      ]);
      if (!preset) {
        setNewAppliance({ name: '', power: '', hours: '0', emoji: '🔌' });
      }
    }
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter((app) => app.id !== id));
  };

  const updateApplianceHours = (id: string, hours: number) => {
    setAppliances(appliances.map(app => app.id === id ? { ...app, hours } : app));
  };

  const totalSolarPeakPower = useMemo(() => {
    return solarPanelPower * solarPanelCount;
  }, [solarPanelPower, solarPanelCount]);

  const autonomyResults = useMemo(() => {
    const totalWh = solarBatteryAh * solarBatteryVoltage;
    const usableWh = totalWh * 0.8;
    const hours = usableWh / (solarAppliancePower || 1);
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return {
      totalKWh: totalWh / 1000,
      usableKWh: usableWh / 1000,
      h,
      m,
      totalMinutes
    };
  }, [solarBatteryAh, solarBatteryVoltage, solarAppliancePower]);

  const expertResults = useMemo(() => {
    const qty = expertQuantity || 1;
    const U = 230;

    let calcPower = 0;
    let calcCurrent = 0;
    let calcResistance = 0;

    if (expertLastChange === 'power') {
      const totalP = expertPower * qty;
      calcCurrent = totalP / U;
      calcResistance = U / (calcCurrent / qty || 1);
      calcPower = totalP;
    } else if (expertLastChange === 'resistance') {
      const unitI = U / (expertResistance || 1);
      calcCurrent = unitI * qty;
      calcPower = U * calcCurrent;
      calcResistance = expertResistance;
    } else if (expertLastChange === 'current') {
      const totalI = expertCurrent * qty;
      calcPower = U * totalI;
      calcResistance = U / (expertCurrent || 1);
      calcCurrent = totalI;
    }

    const breakers = [6, 10, 16, 20, 25, 32, 40, 63];
    const recommendedBreaker = breakers.find(b => b >= calcCurrent) || (calcCurrent > 63 ? 'Hors Limite' : null);

    return { 
      current: Number(calcCurrent.toFixed(2)), 
      power: Number(calcPower.toFixed(2)), 
      resistance: Number((calcResistance / qty).toFixed(2)),
      unitResistance: Number(calcResistance.toFixed(2)),
      unitPower: Number((calcPower / qty).toFixed(2)),
      unitCurrent: Number((calcCurrent / qty).toFixed(2)),
      recommendedBreaker
    };
  }, [expertPower, expertResistance, expertCurrent, expertQuantity, expertLastChange]);

  const diagnostic = useMemo(() => {
    const res = Number(measuredResistance);
    if (measuredResistance === '' || isNaN(res)) return null;
    
    if (res <= 3) {
      return {
        status: 'SURINTENSITÉ DE COURT-CIRCUIT',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        message: "Danger immédiat ! La résistance est trop faible (≤ 3Ω)."
      };
    } else if (res < minResistance) {
      return {
        status: 'DÉFAUT DE SURINTENSITÉ DE SURCHARGE',
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        message: `Risque de surcharge (< ${minResistance === Infinity ? '∞' : minResistance}Ω).`
      };
    } else {
      return {
        status: 'CIRCUIT OK (FONCTIONNEMENT NORMAL)',
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        message: "Installation conforme."
      };
    }
  }, [measuredResistance, minResistance]);

  const menuItems = [
    { id: 'expert', name: 'Expert', icon: Omega, color: 'violet', desc: 'Loi d\'Ohm & Phase' },
    { id: 'billing', name: 'Facture', icon: Receipt, color: 'sky', desc: 'Facture énergie' },
    { id: 'threshold', name: 'Seuil', icon: ShieldAlert, color: 'indigo', desc: 'Tolérance impédance' },
    { id: 'icc', name: 'Icc', icon: Calculator, color: 'cyan', desc: 'Calcul de court-circuit' },
    { id: 'consumption', name: 'Conso', icon: Activity, color: 'orange', desc: 'Estimation énergétique' },
    { id: 'solar', name: 'Solaire', icon: Sun, color: 'yellow', desc: 'Calcul de production' },
    { id: 'autonomy', name: 'Autonomie', icon: Battery, color: 'amber', desc: 'Batterie' },
    { id: 'ev-charger', name: 'Borne', icon: Car, color: 'emerald', desc: 'Temps de recharge EV' },
    { id: 'rj45', name: 'Câble', icon: Network, color: 'pink', desc: 'Blindage & Câblage' },
    { id: 'notes', name: 'Guide', icon: BookOpen, color: 'blue', desc: 'Dépannage & Rappels' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-text-main font-sans flex flex-col justify-center items-center p-4">
      <AnimatePresence mode="wait">
        {activeTab === 'home' ? (
          <motion.div 
            key="home-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full max-w-[1000px] flex flex-col gap-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-text-main">
                Volt<span className="text-blue-600 underline decoration-blue-200 underline-offset-4">Scope</span>
              </h1>
              <p className="text-text-muted font-medium text-sm md:text-base max-w-md mx-auto">
                Choisissez l'outil de calcul ou de diagnostic que vous souhaitez utiliser ci-dessous.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className="group relative bg-white border border-border-theme/60 p-6 md:p-8 rounded-[32px] transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 text-left flex flex-col items-start gap-4 overflow-hidden"
                >
                  <div className={`p-4 rounded-2xl bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-6 h-6 md:w-8 md:h-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg md:text-xl tracking-tight mb-1">{item.name}</h3>
                    <p className="text-[10px] md:text-xs text-text-muted font-medium leading-tight">{item.desc}</p>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className={`w-5 h-5 text-${item.color}-400`} />
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1.5 w-0 bg-${item.color}-500 group-hover:w-full transition-all duration-500`} />
                </button>
              ))}
              <div className="bg-white/40 border border-dashed border-border-theme p-6 md:p-8 rounded-[32px] flex flex-col items-center justify-center text-text-muted gap-2 opacity-60">
                <Plus className="w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest text-center mt-2">Plus à venir</span>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-[10px] text-text-muted/60 uppercase font-black tracking-[0.3em]">Outils Électricien v2.0</p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tool-screen"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-[1100px] flex flex-col gap-4"
          >
            {/* Top Toolbar */}
            <div className="flex justify-between items-center px-2">
              <button 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-border-theme rounded-xl text-xs font-black uppercase tracking-widest hover:bg-bg-theme transition-colors shadow-sm active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à VoltScope
              </button>
              
              <div className="flex gap-1 p-1 bg-white border border-border-theme rounded-xl shadow-sm overflow-x-auto no-scrollbar max-w-[200px] md:max-w-none">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    title={item.name}
                    className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-lg transition-all ${
                      activeTab === item.id 
                        ? `bg-${item.color}-50 text-${item.color}-600 ring-1 ring-${item.color}-200` 
                        : 'text-text-muted hover:bg-bg-theme'
                    }`}
                  >
                    <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-auto md:h-[680px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_rgba(0,0,0,0.12)] grid grid-cols-1 md:grid-cols-[450px_1fr] overflow-hidden border border-border-theme relative">
              
              {/* Left Panel: Controls */}
              <div className="p-6 md:p-12 border-b md:border-b-0 md:border-r border-border-theme flex flex-col relative bg-white min-h-[500px] md:min-h-0">
                <div className="flex-1 relative">
                  <AnimatePresence mode="wait">
              {activeTab === 'billing' && (
                <motion.div 
                  key="billing-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-sky-600 uppercase">Facture</h2>
                  </div>

                  <div className="space-y-8 overflow-y-auto pr-2">
                    <div className="p-5 bg-sky-50 rounded-2xl border border-sky-100">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black text-sky-700 uppercase tracking-widest">Énergie consommée par jour</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-sky-200">
                           <input 
                              type="number"
                              step="0.1"
                              value={billingKWh}
                              onChange={(e) => setBillingKWh(Number(e.target.value))}
                              className="w-20 text-right font-mono font-bold text-sky-900 outline-none"
                           />
                           <span className="text-[10px] font-bold text-sky-500">kWh</span>
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={billingKWh}
                        onChange={(e) => setBillingKWh(Number(e.target.value))}
                        className="w-full h-2 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600 mb-6"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[2.5, 3, 3.5, 4, 5, 5.5, 6].map((val) => (
                          <button
                            key={val}
                            onClick={() => setBillingKWh(val)}
                            className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${
                              billingKWh === val
                                ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                : 'bg-white border-sky-200 text-sky-700 hover:border-sky-400'
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Tarif Unitaire</span>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                           <input 
                              type="number"
                              step="0.01"
                              value={billingPrice}
                              onChange={(e) => setBillingPrice(Number(e.target.value))}
                              className="w-20 text-right font-mono font-bold text-slate-900 outline-none"
                           />
                           <Euro className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={billingPrice}
                        onChange={(e) => setBillingPrice(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"
                      />
                      <div className="flex justify-between mt-3 px-1 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                        <span>Min (0€)</span>
                        <span>Conseillé (0.30€)</span>
                        <span>Max (2.00€)</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'expert' && (
                <motion.div 
                  key="expert-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col p-6"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-violet-600">Calculatrice Expert</h2>
                  </div>

                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                    {/* Volet 1: Puissance (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'power' 
                          ? 'bg-violet-50 border-violet-200 shadow-sm ring-1 ring-violet-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'power' ? 'text-violet-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'power' && <span className="mr-2 text-violet-500">●</span>}
                          Mode Puissance (W)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-violet-100 text-xs font-mono font-bold text-violet-900 shadow-inner">
                           {expertLastChange === 'power' ? expertPower : expertResults.unitPower} W
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="20000"
                        step="100"
                        value={expertLastChange === 'power' ? expertPower : expertResults.unitPower}
                        onChange={(e) => {
                          setExpertPower(Number(e.target.value));
                          setExpertLastChange('power');
                        }}
                        className="w-full h-1.5 bg-violet-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-violet-400 uppercase tracking-tighter">
                        <span>0 W</span>
                        <span>20 kW</span>
                      </div>
                    </div>

                    {/* Volet 2: Résistance (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'resistance' 
                          ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'resistance' ? 'text-amber-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'resistance' && <span className="mr-2 text-amber-500">●</span>}
                          Mode Résistance (Ω)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-amber-100 text-xs font-mono font-bold text-amber-900 shadow-inner">
                           {expertLastChange === 'resistance' ? expertResistance : expertResults.unitResistance} Ω
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="1000"
                        step="1"
                        value={expertLastChange === 'resistance' ? expertResistance : expertResults.unitResistance}
                        onChange={(e) => {
                          setExpertResistance(Number(e.target.value));
                          setExpertLastChange('resistance');
                        }}
                        className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-amber-400 uppercase tracking-tighter">
                        <span>1 Ω</span>
                        <span>1000 Ω</span>
                      </div>
                    </div>

                    {/* Volet 3: Intensité (Source) */}
                    <div 
                      className={`p-4 rounded-2xl border transition-all duration-300 ${
                        expertLastChange === 'current' 
                          ? 'bg-sky-50 border-sky-200 shadow-sm ring-1 ring-sky-500/10' 
                          : 'bg-white border-border-theme opacity-80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${expertLastChange === 'current' ? 'text-sky-700' : 'text-text-muted'}`}>
                          {expertLastChange === 'current' && <span className="mr-2 text-sky-500">●</span>}
                          Mode Intensité (A)
                        </span>
                        <div className="bg-white px-2 py-1 rounded-lg border border-sky-100 text-xs font-mono font-bold text-sky-900 shadow-inner">
                           {expertLastChange === 'current' ? expertCurrent : expertResults.unitCurrent} A
                        </div>
                      </div>
                      <input 
                        type="range"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={expertLastChange === 'current' ? expertCurrent : expertResults.unitCurrent}
                        onChange={(e) => {
                          setExpertCurrent(Number(e.target.value));
                          setExpertLastChange('current');
                        }}
                        className="w-full h-1.5 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                      />
                      <div className="mt-2 flex justify-between text-[8px] font-bold text-sky-400 uppercase tracking-tighter">
                        <span>0.1 A</span>
                        <span>100 A</span>
                      </div>
                    </div>

                    <div className="bg-bg-theme p-4 rounded-2xl border border-border-theme">
                      <span className="block text-[10px] uppercase tracking-widest text-text-muted font-black mb-2 px-1">Quantité récepteurs en //</span>
                      <input 
                        type="number"
                        min="1"
                        max="50"
                        value={expertQuantity}
                        onChange={(e) => setExpertQuantity(Number(e.target.value))}
                        className="w-full bg-white border border-border-theme rounded-xl px-3 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-violet-500 outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'consumption' && (
                <motion.div 
                  key="consumption-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-orange-600">Consommation</h2>
                  </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
                  {appliances.map((app) => (
                    <div key={app.id} className="p-3 bg-bg-theme rounded-lg border border-border-theme group space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{app.emoji}</span>
                          <div>
                            <div className="font-bold text-sm">{app.name}</div>
                            <div className="text-[10px] text-text-muted uppercase tracking-wider">
                              {app.power}W × {app.hours}h/j = {(app.power * app.hours / 1000).toFixed(2)} kWh
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeAppliance(app.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="range"
                          min="0"
                          max="24"
                          step="0.5"
                          value={app.hours}
                          onChange={(e) => updateApplianceHours(app.id, Number(e.target.value))}
                          className="flex-1 h-1 bg-border-theme rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-[10px] font-mono font-bold text-orange-600 w-8 text-right">{app.hours}h</span>
                      </div>
                    </div>
                  ))}

                  <div className="p-4 bg-accent-blue/5 rounded-lg border border-dashed border-accent-blue/30 space-y-4">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {[
                        // Cuisine
                        { name: 'Four', power: 2500, emoji: '🍕' },
                        { name: 'Plaque', power: 7000, emoji: '🥘' },
                        { name: 'Cafetière', power: 1200, emoji: '☕' },
                        { name: 'Micro-onde', power: 1000, emoji: '🍿' },
                        { name: 'Bouilloire', power: 2000, emoji: '🫖' },
                        { name: 'Frigo', power: 150, emoji: '🧊' },
                        { name: 'Congélo', power: 200, emoji: '🍦' },
                        { name: 'Lave-Vaiss.', power: 1200, emoji: '🍽️' },
                        { name: 'Grille-pain', power: 800, emoji: '🍞' },
                        { name: 'Mixeur', power: 400, emoji: '🥤' },
                        { name: 'Hotte', power: 200, emoji: '🌬️' },
                        
                        // Buanderie & Entretien
                        { name: 'Lave-Linge', power: 2000, emoji: '👕' },
                        { name: 'Sèche-Linge', power: 2500, emoji: '🧺' },
                        { name: 'Fer à rep.', power: 1500, emoji: '💨' },
                        { name: 'Aspirateur', power: 800, emoji: '🧹' },
                        
                        // Chauffage & Clim
                        { name: 'Radiateur', power: 1500, emoji: '🔥' },
                        { name: 'Clim', power: 2000, emoji: '❄️' },
                        { name: 'Sèche-serv.', power: 750, emoji: '🛁' },
                        { name: 'Ventilateur', power: 50, emoji: '🌀' },
                        
                        // High-Tech & Bureau
                        { name: 'TV / Salon', power: 150, emoji: '📺' },
                        { name: 'Console', power: 200, emoji: '🎮' },
                        { name: 'PC Bureau', power: 300, emoji: '🖥️' },
                        { name: 'Laptop', power: 60, emoji: '💻' },
                        { name: 'Box Inter.', power: 20, emoji: '🌐' },
                        { name: 'Chargeur', power: 15, emoji: '🔌' },
                        
                        // Beauté & Santé
                        { name: 'Sèche-cheveux', power: 1800, emoji: '💁' },
                        { name: 'Lisseur', power: 50, emoji: '✨' },
                        
                        // Divers
                        { name: 'Ampoule', power: 10, emoji: '💡' },
                        { name: 'Garage', power: 500, emoji: '🚗' },
                        { name: 'Piscine', power: 1000, emoji: '🏊' },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => addAppliance(preset)}
                          className="flex flex-col items-center justify-center p-2 bg-white border border-border-theme rounded-lg hover:border-accent-blue transition-colors group h-16"
                        >
                          <span className="text-xl mb-0.5 group-hover:scale-110 transition-transform">{preset.emoji}</span>
                          <span className="text-[7px] font-bold uppercase text-text-muted truncate w-full text-center leading-none">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border-theme space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase">Prix du kWh (€)</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={kwhPrice}
                      onChange={(e) => setKwhPrice(Number(e.target.value))}
                      className="w-20 bg-bg-theme border border-border-theme rounded px-2 py-1 text-xs font-mono font-bold text-accent-blue text-right outline-none focus:border-accent-blue"
                    />
                  </div>
                </div>
              </motion.div>
            )}

              {activeTab === 'icc' && (
                <motion.div 
                  key="icc-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-cyan-600">Calculateur court circuit câble</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div>
                      <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-3 font-bold">Section du Câble (mm²)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {CABLE_SECTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedSection(s)}
                            className={`py-2 rounded text-[11px] font-bold transition-all border ${
                              selectedSection === s
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {s} mm²
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Longueur Aller (m)</span>
                        <span className="text-lg font-bold text-cyan-600 font-mono">{cableLength} m</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="200"
                        value={cableLength}
                        onChange={(e) => setCableLength(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-cyan-600 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 20, 50].map((len) => (
                          <button
                            key={len}
                            onClick={() => setCableLength(len)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              cableLength === len
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {len}m
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-text-muted mt-2 italic">
                        Note : Le calcul inclut automatiquement l'aller et le retour (Total : {cableLength * 2}m).
                      </p>
                    </div>

                    <div className="pt-6 border-t border-border-theme space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Résistance Câble</span>
                        <span className="font-mono font-bold text-text-main">{iccResult.resistance} Ω</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Chute de Tension</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-text-main block">{iccResult.voltageDrop} V</span>
                          <span className="text-[10px] text-text-muted">({iccResult.voltageDropPercent}%)</span>
                        </div>
                      </div>

                      <div className="p-4 bg-cyan-600/5 rounded-lg border border-cyan-600/10">
                        <span className="block text-[10px] font-bold text-cyan-600 uppercase mb-1">Courant de Court-Circuit (Icc)</span>
                        <span className="text-3xl font-bold text-cyan-600 font-mono">{iccResult.icc.toLocaleString('fr-FR')} A</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'threshold' && (
                <motion.div 
                  key="threshold-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col justify-between h-full"
                >
                  <div className="space-y-8">
                    <div>
                      <div className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded font-bold text-[10px] mb-4 tracking-wider">
                        SÉCURITÉ ÉLECTRIQUE
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight mb-2">Seuil de Résistance</h1>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-text-muted font-bold">Calibre (A)</span>
                        <span className="text-xl font-bold text-indigo-600 font-mono">{selectedBreaker} A</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="63"
                        step="1"
                        value={selectedBreaker}
                        onChange={(e) => setSelectedBreaker(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {[6, 10, 16, 20, 32, 63].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => setSelectedBreaker(rating)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              selectedBreaker === rating
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {rating}A
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 pt-4 border-t border-border-theme">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-2 font-bold">Tension Réseau (V)</span>
                          <input 
                            type="number"
                            value={voltage}
                            onChange={(e) => setVoltage(Number(e.target.value))}
                            className="text-2xl font-bold font-mono text-indigo-600 border-b-2 border-border-theme pb-1 w-24 outline-none focus:border-indigo-600 transition-colors bg-transparent mb-4"
                          />
                          <div className="flex gap-2">
                            {[230].map((v) => (
                              <button
                                key={v}
                                onClick={() => setVoltage(v)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                  voltage === v
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                                }`}
                              >
                                {v}V
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted mb-2 font-bold">mesure au borne (Ω)</span>
                          <input 
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="---"
                            value={measuredResistance}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || Number(val) >= 0) {
                                setMeasuredResistance(val);
                              }
                            }}
                            className="text-2xl font-bold font-mono text-text-main border-b-2 border-border-theme pb-1 w-24 outline-none focus:border-indigo-600 transition-colors bg-transparent text-right mb-4"
                          />
                          <div className="flex flex-wrap gap-1 justify-end">
                            {[0.1, 1, 5, 10, 50, 500].map((r) => (
                              <button
                                key={r}
                                onClick={() => setMeasuredResistance(r)}
                                className={`px-2 py-1.5 rounded text-[10px] font-bold transition-all border ${
                                  Number(measuredResistance) === r
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                                }`}
                              >
                                {r}Ω
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-theme text-[12px] text-text-muted italic leading-relaxed">
                    Calcul basé sur la loi d'Ohm : R = U / I<br />
                    Pour un disjoncteur de {selectedBreaker}A sous {voltage}V, la résistance doit être supérieure à {minResistance === Infinity ? '∞' : minResistance} Ω.
                  </div>
                </motion.div>
              )}

              {activeTab === 'solar' && (
                <motion.div 
                  key="solar-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-yellow-600">Calculateur Solaire</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    {/* Section: Dimensionnement (Sizing) */}
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">Calcul des Besoins</span>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-blue-600 mb-1.5">Charge Instantanée (W)</span>
                          <div className="space-y-3">
                            <input 
                              type="number"
                              value={solarInstantLoad}
                              onChange={(e) => setSolarInstantLoad(Math.max(0, Number(e.target.value)))}
                              className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input 
                              type="range"
                              min="0"
                              max="10000"
                              step="100"
                              value={solarInstantLoad}
                              onChange={(e) => setSolarInstantLoad(Number(e.target.value))}
                              className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="text-[10px] font-bold text-blue-900/50 uppercase tracking-tighter mb-1">Couverture Instantanée</div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-blue-700 tabular-nums">
                              {solarInstantLoad > 0 ? ((totalSolarPeakPower * INVERTER_EFFICIENCY) / solarInstantLoad * 100).toFixed(1) : '∞'}
                            </span>
                            <span className="text-sm font-bold text-blue-600 uppercase">%</span>
                          </div>
                          <p className="text-[9px] text-blue-500 italic mt-1 leading-tight">
                            Ratio entre puissance crête installée et charge active.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Nb. Panneaux</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{solarPanelCount}</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={solarPanelCount}
                        onChange={(e) => setSolarPanelCount(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[10, 15, 20, 25].map((count) => (
                          <button
                            key={count}
                            onClick={() => setSolarPanelCount(count)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              solarPanelCount === count
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Puissance/Panneau (W)</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{solarPanelPower} W</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1000"
                        step="10"
                        value={solarPanelPower}
                        onChange={(e) => setSolarPanelPower(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[300, 400, 500, 600].map((p) => (
                          <button
                            key={p}
                            onClick={() => setSolarPanelPower(p)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              solarPanelPower === p
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {p}W
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-black mb-1">Puissance Totale (brut cc)</span>
                        <div className="text-xl font-black text-yellow-700 tabular-nums">
                          {(totalSolarPeakPower / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kWp</span>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="block text-[10px] uppercase tracking-[0.2em] text-text-muted font-black">Puissance Totale (Net AC)</span>
                          <span className="text-[9px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">Rendement 95%</span>
                        </div>
                        <div className="text-xl font-black text-text-main tabular-nums">
                          {(totalSolarPeakPower * INVERTER_EFFICIENCY / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kVA</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Ensoleillement (h/jour)</span>
                        <span className="text-lg font-bold text-yellow-600 font-mono">{sunlightHours} h</span>
                      </div>
                      <input 
                        type="range"
                        min="1"
                        max="12"
                        step="0.5"
                        value={sunlightHours}
                        onChange={(e) => setSunlightHours(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-2">
                        {[2, 4, 6, 8].map((h) => (
                          <button
                            key={h}
                            onClick={() => setSunlightHours(h)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              sunlightHours === h
                                ? 'bg-yellow-600 text-white border-yellow-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {h}h
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border-theme space-y-6">
                      <div className="flex flex-col p-4 bg-white rounded-xl border border-border-theme/50 shadow-sm">
                        <span className="text-[10px] font-bold text-text-muted uppercase mb-1">Production Journalière (avec rendement 95%)</span>
                        <span className="text-xl font-black text-text-main tabular-nums">{(totalSolarPeakPower * sunlightHours * INVERTER_EFFICIENCY / 1000).toFixed(2)} <span className="text-sm font-bold text-text-muted">kWh</span></span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'autonomy' && (
                <motion.div 
                  key="autonomy-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-amber-600">Test Autonomie</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest text-center w-full">Configuration Système</span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold mb-3">Tension Batterie (V)</span>
                          <div className="grid grid-cols-3 gap-2 text-[10px]">
                            {[12, 24, 48].map((v) => (
                              <button
                                key={v}
                                onClick={() => setSolarBatteryVoltage(v)}
                                className={`py-2 rounded-lg font-bold transition-all border ${
                                  solarBatteryVoltage === v
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                    : 'bg-white/50 border-amber-200 text-amber-800 hover:border-amber-400'
                                }`}
                              >
                                {v}V
                              </button>
                            ))}
                          </div>
                          <p className="text-[9px] text-amber-700/60 mt-1 italic">
                            {solarBatteryVoltage === 12 ? "< 1000W" : solarBatteryVoltage === 24 ? "2000W - 3000W" : "> 3000W"}
                          </p>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-text-muted uppercase tracking-tight">Capacité Batterie (Ah)</span>
                            <span className="text-xs font-bold text-text-main font-mono">{solarBatteryAh} Ah</span>
                          </div>
                          <input 
                            type="range"
                            min="50"
                            max="1000"
                            step="5"
                            value={solarBatteryAh}
                            onChange={(e) => setSolarBatteryAh(Number(e.target.value))}
                            className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-bold text-text-muted">Puissance appareil (W)</span>
                            <span className="text-xs font-bold text-text-main font-mono">{solarAppliancePower} W</span>
                          </div>
                          <input 
                            type="range"
                            min="0"
                            max="5000"
                            step="1"
                            value={solarAppliancePower}
                            onChange={(e) => setSolarAppliancePower(Number(e.target.value))}
                            className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-600 text-white rounded-lg">
                          <Battery className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-amber-700 uppercase">Capacité Utile</span>
                          <span className="text-lg font-black text-amber-900 font-mono">
                            {(solarBatteryAh * solarBatteryVoltage * 0.8 / 1000).toFixed(1)} kWh
                            <span className="ml-2 text-[10px] font-normal opacity-60"> (80% de décharge)</span>
                          </span>
                          <div className="mt-2 pt-2 border-t border-amber-200/50">
                            <span className="block text-[9px] font-bold text-amber-700/70 uppercase">Capacité Réelle</span>
                            <span className="text-xs font-bold text-amber-800 font-mono">
                              {(solarBatteryAh * solarBatteryVoltage / 1000).toFixed(1)} kWh
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'ev-charger' && (
                <motion.div 
                  key="ev-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-emerald-600">Borne de Recharge</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Batterie (kWh)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{batteryCapacity} kWh</span>
                      </div>
                      <input 
                        type="range"
                        min="20"
                        max="160"
                        step="1"
                        value={batteryCapacity}
                        onChange={(e) => setBatteryCapacity(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
                      />
                      <div className="grid grid-cols-5 gap-1.5">
                        {[20, 50, 80, 100, 160].map((cap) => (
                          <button
                            key={cap}
                            onClick={() => setBatteryCapacity(cap)}
                            className={`py-2 rounded text-[9px] font-bold transition-all border ${
                              batteryCapacity === cap
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {cap}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Puissance Borne (kW)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{chargerPower} kW</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 mb-4">
                        {[2.3, 3.7, 7.4].map((p) => (
                          <button
                            key={p}
                            onClick={() => setChargerPower(p)}
                            className={`py-2 rounded text-[9px] font-bold transition-all border ${
                              chargerPower === p
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <div className="flex-1">
                          <span className="block text-[8px] font-black text-emerald-700 uppercase leading-none mb-1">Disjoncteur préconisé</span>
                          <span className="text-sm font-bold text-emerald-900">{recommendedEVBreaker}A <span className="text-[10px] opacity-60">(courbe C)</span></span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[8px] font-bold text-emerald-700/50 uppercase leading-none mb-1">Intensité</span>
                          <span className="text-xs font-mono font-bold text-emerald-800 tracking-tighter">{((chargerPower * 1000) / 230).toFixed(1)}A</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="block text-[11px] uppercase tracking-widest text-text-muted font-bold">Charge Actuelle (%)</span>
                        <span className="text-lg font-bold text-emerald-600 font-mono">{currentCharge} %</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="99"
                        value={currentCharge}
                        onChange={(e) => setCurrentCharge(Number(e.target.value))}
                        className="w-full h-1.5 bg-border-theme rounded-lg appearance-none cursor-pointer accent-emerald-500 mb-4"
                      />
                      <div className="grid grid-cols-4 gap-1.5">
                        {[10, 20, 50, 80].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setCurrentCharge(pct)}
                            className={`py-2 rounded text-[10px] font-bold transition-all border ${
                              currentCharge === pct
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                : 'bg-white border-border-theme text-text-muted hover:border-text-muted'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                     <div className="pt-6 border-t border-border-theme space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-text-muted uppercase">Énergie à Récupérer</span>
                        <span className="font-mono font-bold text-text-main">{(batteryCapacity * (100 - currentCharge) / 100).toFixed(1)} kWh</span>
                      </div>

                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border-theme">
                        <div className="flex-1">
                          <span className="block text-[10px] font-bold text-text-muted uppercase mb-1">Prix du kWh</span>
                          <div className="flex items-center gap-2">
                             <input 
                              type="number"
                              step="0.01"
                              value={evPricePerKWh}
                              onChange={(e) => setEvPricePerKWh(Number(e.target.value))}
                              className="w-full text-sm font-bold text-emerald-900 outline-none"
                             />
                             <Euro className="w-3 h-3 text-emerald-400" />
                          </div>
                        </div>
                        <input 
                          type="range"
                          min="0"
                          max="2"
                          step="0.01"
                          value={evPricePerKWh}
                          onChange={(e) => setEvPricePerKWh(Number(e.target.value))}
                          className="w-24 h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      <div className="p-4 bg-emerald-600/5 rounded-lg border border-emerald-600/10">
                        <span className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Temps de Charge Estimé</span>
                        <span className="text-3xl font-bold text-emerald-600 font-mono">
                          {Math.floor((batteryCapacity * (100 - currentCharge) / 100) / chargerPower)}h {Math.round((((batteryCapacity * (100 - currentCharge) / 100) / chargerPower) % 1) * 60)}m
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'rj45' && (
                <motion.div 
                  key="rj45-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold tracking-tight text-pink-600">Blindage câble</h2>
                  </div>

                  <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="pt-2">
                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Blindage & Types</span>
                        </div>
                        
                        <div className="text-center py-4 bg-white rounded-xl border border-slate-200 mb-6">
                          <div className="text-2xl font-black text-slate-800 tracking-tighter">
                            <span className="text-pink-600">X</span> / <span className="text-amber-500">XX</span> TP
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="relative pl-4 border-l-2 border-amber-400">
                            <div className="text-[10px] font-bold text-amber-600 uppercase mb-1">Blindage individuel (<span className="text-amber-500">XX</span>)</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">U:</span> <span>Non blindé</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">F:</span> <span>Feuillard Alu</span>
                              </div>
                            </div>
                          </div>

                          <div className="relative pl-4 border-l-2 border-pink-400">
                            <div className="text-[10px] font-bold text-pink-600 uppercase mb-1">Blindage général (<span className="text-pink-500">X</span>)</div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">U:</span> <span>Non blindé</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">F:</span> <span>Feuillard Alu</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="font-bold w-4">S:</span> <span>Tresse cuivre étamé</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                          <Settings2 className="w-4 h-4 text-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Standards Courants</span>
                        </div>

                        <div className="space-y-2">
                          {[
                            { name: 'UTP', desc: 'Non blindé (U/UTP)' },
                            { name: 'U/FTP', desc: 'Paires blindées (Feuillard)' },
                            { name: 'F/FTP', desc: 'Général & Paires blindées' },
                            { name: 'S/UTP', desc: 'Général blindé (Tresse)' },
                            { name: 'SF/UTP', desc: 'Général (Tresse + Feuillard)' },
                            { name: 'SF/FTP', desc: 'Blindage maximum (Grade 3TV)' },
                          ].map((ex) => (
                            <div key={ex.name} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100">
                              <span className="text-xs font-black text-slate-800">{ex.name}</span>
                              <span className="text-[10px] text-slate-500 italic font-medium">{ex.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'notes' && (
                <motion.div 
                  key="notes-panel"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute inset-0 bg-white flex flex-col"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-blue-600">Guide de Dépannage</h2>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {FAULTS.map((fault) => {
                        const Icon = fault.icon;
                        const isSelected = selectedFaultId === fault.id;
                        return (
                          <button
                            key={fault.id}
                            onClick={() => setSelectedFaultId(fault.id)}
                            className={`group relative w-full text-left p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                              isSelected
                                ? `${fault.bg} ${fault.border} shadow-md ring-1 ring-blue-500/10`
                                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                            }`}
                          >
                            {isSelected && (
                              <motion.div 
                                layoutId="active-bg"
                                className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 pointer-events-none" 
                              />
                            )}
                            <div className="relative z-10 flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                                isSelected ? fault.iconColor : 'bg-slate-50 border-slate-100 text-slate-400'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 ${
                                  isSelected ? fault.color : 'text-slate-400'
                                }`}>
                                  {fault.id}
                                </div>
                                <div className={`font-bold text-sm leading-tight truncate ${
                                  isSelected ? 'text-slate-900' : 'text-slate-600'
                                }`}>
                                  {fault.type}
                                </div>
                              </div>
                              <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                                isSelected ? 'text-slate-400 translate-x-0' : 'text-slate-200 -translate-x-2 opacity-0'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border-theme text-[11px] text-text-muted italic">
                    Source : Analyse et Dépannage des Défauts Électriques Résidentiels.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel: Results */}
        <div className="bg-[#FAFBFC] p-6 md:p-12 flex flex-col items-center justify-center text-center relative overflow-y-auto min-h-[400px] md:min-h-0">
          <AnimatePresence mode="wait">
            {activeTab === 'billing' ? (
               <motion.div 
                key="billing-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12 text-center">
                  Total Facturé
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 bg-sky-500/10 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <Euro className="w-16 h-16 text-sky-500 mb-4" />
                    <div className="text-5xl font-black text-sky-600 tabular-nums">
                      {(billingKWh * billingPrice).toFixed(2)}
                      <span className="text-2xl ml-1">€</span>
                    </div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest mt-2">Montant journalier</div>
                  </div>
                </div>

                <div className="w-full max-w-sm space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-border-theme shadow-sm text-center">
                      <div className="text-[10px] font-black text-text-muted uppercase mb-1">Montant Mensuel</div>
                      <div className="text-xl font-bold text-sky-600">{(billingKWh * billingPrice * 30).toFixed(2)} €</div>
                      <div className="text-[8px] text-text-muted uppercase font-bold mt-1">(30 jours)</div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-border-theme shadow-sm text-center">
                      <div className="text-[10px] font-black text-text-muted uppercase mb-1">Montant Annuel</div>
                      <div className="text-xl font-bold text-sky-600">{(billingKWh * billingPrice * 365).toFixed(2)} €</div>
                      <div className="text-[8px] text-text-muted uppercase font-bold mt-1">(365 jours)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-bg-theme/50 p-3 rounded-xl border border-border-theme/50 text-center">
                        <div className="text-[9px] font-black text-text-muted uppercase mb-0.5">Consommation</div>
                        <div className="text-sm font-bold text-text-main">{billingKWh} <span className="text-[10px] text-text-muted">kWh/j</span></div>
                     </div>
                     <div className="bg-bg-theme/50 p-3 rounded-xl border border-border-theme/50 text-center">
                        <div className="text-[9px] font-black text-text-muted uppercase mb-0.5">Taux</div>
                        <div className="text-sm font-bold text-text-main">{billingPrice.toFixed(2)} <span className="text-[10px] text-text-muted">€/kWh</span></div>
                     </div>
                  </div>
                </div>

                <div className="mt-12 text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">
                  Calcul : Énergie (kWh) × Tarif (€/kWh)
                </div>
              </motion.div>
            ) : activeTab === 'notes' ? (
              <motion.div 
                key="notes-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col"
              >
                <div className="flex items-center gap-3 mb-10 self-start">
                  <div className="w-8 h-0.5 bg-blue-600 rounded-full" />
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">
                    Fiche Technique de Dépannage
                  </div>
                </div>

                {(() => {
                  const fault = FAULTS.find(f => f.id === selectedFaultId)!;
                  const Icon = fault.icon;
                  return (
                    <div className="flex-1 w-full overflow-y-auto pr-4 custom-scrollbar space-y-8 text-left">
                      {/* Header Section */}
                      <header className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl border-2 ${fault.iconColor} bg-white shadow-sm`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-2">{fault.type}</h3>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">Réf: {fault.id}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-bold text-slate-400 italic">Diagnostic Expert</span>
                            </div>
                          </div>
                        </div>
                      </header>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        {/* Observation: Symptoms */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 text-blue-600">
                            <ClipboardList className="w-4 h-4" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Observations & Symptômes</h4>
                          </div>
                          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                            {(fault.symptomes as string[]).map((s, idx) => (
                              <div key={idx} className="flex items-start gap-3 group">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover:scale-125 transition-transform" />
                                <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{s}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        <div className="space-y-8">
                          {/* Causes & Risks */}
                          <section className="space-y-4">
                            <div className="flex items-center gap-2 text-amber-600">
                              <AlertTriangle className="w-4 h-4" />
                              <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Analyse des Causes</h4>
                            </div>
                            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100/50">
                              <p className="text-[13px] leading-relaxed text-slate-700 font-medium mb-4">
                                {fault.causes}
                              </p>
                              <div className="pt-4 border-t border-amber-200/50">
                                <span className="block text-[9px] font-black text-red-500 uppercase mb-2">Risque Critique</span>
                                <p className="text-[12px] font-bold text-red-700 leading-relaxed italic">{fault.risques}</p>
                              </div>
                            </div>
                          </section>
                        </div>
                      </div>

                      {/* Diagnostic: Measurement */}
                      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                          <Activity className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Wrench className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Outil de Mesure</span>
                            </div>
                            <p className="text-sm font-bold text-white">{fault.appareil}</p>
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Gauge className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest">Valeur Théorique</span>
                            </div>
                            <p className="text-sm font-mono font-bold text-blue-400">{fault.valeurs}</p>
                          </div>
                          <div className="space-y-3 border-l md:border-l-0 md:pl-0 border-white/10 pl-6">
                            <div className="flex items-center gap-2 text-red-400">
                              <Activity className="w-4 h-4" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Signe de Défaut</span>
                            </div>
                            <p className="text-sm font-bold text-red-300 italic">{fault.valeursMesurees}</p>
                          </div>
                        </div>
                      </section>

                      {/* Resolution: Solutions */}
                      <section className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.15em]">Protocole d'Intervention</h4>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex gap-4 items-start shadow-sm">
                          <div className="w-10 h-10 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center shrink-0">
                            <Lightbulb className="w-5 h-5 text-emerald-600" />
                          </div>
                          <p className="text-sm leading-relaxed font-bold text-emerald-900 pt-1">
                            {fault.solutions}
                          </p>
                        </div>
                      </section>
                    </div>
                  );
                })()}
              </motion.div>
            ) : activeTab === 'expert' ? (
              <motion.div 
                key="expert-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-4 text-center">
                  Résultats Circuit (Parallèle)
                </div>
                
                <div className="bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100 flex items-center gap-2 mb-8">
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">Loi d'ohm pour {expertQuantity} récepteur{expertQuantity > 1 ? 's' : ''} en //</span>
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                  <div className="absolute inset-0 bg-violet-500/5 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="text-4xl font-black text-text-main tabular-nums">
                      {expertResults.current} A
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest mt-1">Intensité Totale</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full max-w-sm mb-8">
                  <div className="text-center p-4 bg-bg-theme rounded-2xl border border-border-theme">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Totale</div>
                    <div className="text-xl font-bold text-text-main">{(expertResults.power / 1000).toFixed(2)} kW</div>
                  </div>
                  <div className="text-center p-4 bg-bg-theme rounded-2xl border border-border-theme">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Résistance Unitaire</div>
                    <div className="text-xl font-bold text-text-main">{expertResults.unitResistance} Ω</div>
                  </div>
                </div>

                <div className="w-full max-w-xs space-y-4">
                  <div className="p-3 bg-white rounded-xl border border-border-theme text-center">
                    <span className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Résistance Équivalente (Total)</span>
                    <span className="text-sm font-bold text-violet-600 font-mono">{expertResults.resistance} Ω</span>
                  </div>

                  {expertResults.recommendedBreaker && (
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center shadow-sm">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-emerald-600" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Protection Conseillée</span>
                      </div>
                      <div className="text-2xl font-black text-emerald-900">
                        {typeof expertResults.recommendedBreaker === 'number' 
                          ? `Disjoncteur ${expertResults.recommendedBreaker}A` 
                          : expertResults.recommendedBreaker}
                      </div>
                      <p className="text-[9px] text-emerald-600 font-bold uppercase mt-1">
                        Pour un courant total de {expertResults.current}A
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : activeTab === 'consumption' ? (
              <motion.div 
                key="consumption-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Analyse de Consommation
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Zap className="w-16 h-16 text-orange-500 mb-4" />
                    <div className="text-4xl font-bold text-text-main">{consumptionTotals.dailyKWh.toFixed(2)}</div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">kWh / Jour</div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-lg px-4">
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Journalier</div>
                    <div className="text-xl font-black text-orange-600">{consumptionTotals.dailyCost.toFixed(2)}€</div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 24h</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Mensuel</div>
                    <div className="text-xl font-black text-orange-600">{consumptionTotals.monthlyCost.toFixed(2)}€</div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 30j</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-2xl border border-border-theme shadow-sm">
                    <div className="text-[9px] font-black text-text-muted uppercase mb-1">Annuel</div>
                    <div className="text-xl font-black text-orange-600">{consumptionTotals.yearlyCost.toFixed(2)}€</div>
                    <div className="text-[7px] text-text-muted uppercase font-bold mt-1 tracking-tighter">Base 365j</div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme w-full max-w-xs text-[10px] text-text-muted italic leading-relaxed text-center">
                  Équation appliquée :<br />
                  Coût = (Σ(W × h/j) / 1000) × Prix du kWh
                </div>
              </motion.div>
            ) : activeTab === 'threshold' ? (
              <motion.div 
                key="resistance-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-6">
                  Résistance Critique (Min)
                </div>
                
                <div className="mb-2">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={minResistance}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[112px] font-black text-text-main leading-none tabular-nums tracking-tighter"
                    >
                      {minResistance === Infinity ? '∞' : minResistance.toLocaleString('fr-FR')}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="text-sm font-black text-text-muted uppercase tracking-[0.3em] mb-12">Ohms (Ω)</div>

                {/* Diagnostic Overlay */}
                <AnimatePresence>
                  {diagnostic && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`mb-12 p-6 rounded-[24px] border-2 shadow-sm ${diagnostic.bg} ${diagnostic.border} ${diagnostic.color} relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Activity className="w-12 h-12" />
                      </div>
                      <div className="uppercase text-[10px] font-black tracking-widest mb-2 opacity-60">État du Circuit</div>
                      <h4 className="text-lg font-black tracking-tight mb-1">{diagnostic.status}</h4>
                      <p className="text-xs font-medium opacity-80 leading-relaxed">{diagnostic.message}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="w-full mt-8">
                  <div className="relative h-10 flex items-center">
                    <div className="w-full h-1 bg-border-theme rounded-full relative">
                      {/* Scale Markers */}
                      {[0, 16, 32, 48, 63].map((val) => {
                        const pos = (val / 63) * 100;
                        const isActive = selectedBreaker === val;
                        return (
                          <div key={val} className="absolute" style={{ left: `${pos}%` }}>
                            <div className={`w-0.5 h-6 -translate-y-1/2 absolute top-1/2 ${isActive ? 'bg-text-main h-8 -top-4 w-1' : 'bg-accent-blue opacity-30'}`} />
                            <div className={`absolute top-6 -translate-x-1/2 text-[10px] ${isActive ? 'font-bold text-text-main' : 'text-text-muted opacity-50'}`}>
                              {val}A
                            </div>
                          </div>
                        );
                      })}

                      {/* Current Breaker Marker */}
                      <motion.div
                        animate={{ left: `${(selectedBreaker / 63) * 100}%` }}
                        className="absolute top-1/2 -translate-y-1/2 w-1 h-10 bg-accent-blue z-10 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'solar' ? (
              <motion.div 
                key="solar-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Estimation Solaire
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-yellow-500/5 rounded-full animate-pulse shadow-lg" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Sun className="w-16 h-16 text-yellow-500 mb-4 animate-[spin_10s_linear_infinite]" />
                    <div className="text-4xl font-bold text-text-main">{(totalSolarPeakPower * sunlightHours * INVERTER_EFFICIENCY / 1000).toFixed(2)}</div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">kWh / Jour (Net)</div>
                    <div className="text-[9px] text-text-muted mt-1 uppercase font-bold italic">Rendement onduleur : 95%</div>
                  </div>
                </div>

                <div className="mt-12 grid grid-cols-2 gap-8 w-full max-w-xs">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Réelle (AC)</div>
                    <div className="text-xl font-bold text-text-main">{(totalSolarPeakPower * INVERTER_EFFICIENCY).toFixed(0)} W</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Couverture Instantanée</div>
                    <div className="text-xl font-bold text-yellow-600">
                      {solarInstantLoad > 0 ? ((totalSolarPeakPower * INVERTER_EFFICIENCY) / solarInstantLoad * 100).toFixed(1) : '∞'}%
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-center w-full max-w-xs pt-6 border-t border-border-theme/40">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Charge Active</div>
                    <div className="text-xl font-bold text-text-main">{solarInstantLoad} W</div>
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'autonomy' ? (
              <motion.div 
                key="autonomy-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full h-full flex flex-col items-center justify-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Simulation Autonomie
                </div>

                <div className="relative w-64 h-64 flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-500/5 rounded-full animate-pulse shadow-lg" />
                  <div className="relative z-10 flex flex-col items-center">
                    <Battery className="w-16 h-16 text-amber-500 mb-4" />
                    <div className="text-4xl font-black text-text-main">
                      {autonomyResults.h}h
                    </div>
                    <div className="text-sm text-text-muted font-bold uppercase tracking-widest">
                      {autonomyResults.m} minutes
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme/40 w-full max-w-xs text-center">
                  <div className="text-[10px] font-bold text-text-muted uppercase mb-1">Puissance Appareil</div>
                  <div className="text-2xl font-black text-text-main">{solarAppliancePower} W</div>
                </div>
              </motion.div>
            ) : activeTab === 'ev-charger' ? (
              <motion.div 
                key="ev-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-8"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Suivi de Recharge
                </div>

                <div className="w-full max-w-xs bg-bg-theme p-6 rounded-2xl border border-border-theme space-y-8">
                  <div className="flex justify-between items-center px-2">
                    <Car className="w-8 h-8 text-emerald-600" />
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-text-muted uppercase">État de charge</div>
                      <div className="text-2xl font-bold text-emerald-600">{currentCharge}%</div>
                    </div>
                  </div>

                  <div className="relative h-4 bg-emerald-100 rounded-full overflow-hidden border border-emerald-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${currentCharge}%` }}
                      className="absolute inset-y-0 left-0 bg-emerald-500 flex items-center justify-end px-2"
                    >
                      <Zap className="w-2.5 h-2.5 text-white animate-pulse" />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Borne</div>
                      <div className="text-sm font-bold text-text-main">{chargerPower} kW</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">Protec.</div>
                      <div className="text-sm font-bold text-emerald-600">{recommendedEVBreaker}A</div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-border-theme">
                      <div className="text-[9px] font-bold text-text-muted uppercase mb-1">À charger</div>
                      <div className="text-sm font-bold text-text-main">{(batteryCapacity * (100 - currentCharge) / 100).toFixed(1)} kWh</div>
                    </div>
                  </div>

                  <div className="w-full p-4 bg-emerald-600 text-white rounded-2xl shadow-lg border border-emerald-500">
                    <div className="text-[10px] font-bold uppercase opacity-80 mb-1">Coût de la Recharge Estimé</div>
                    <div className="flex items-baseline gap-1">
                       <span className="text-3xl font-black tabular-nums">
                         {(batteryCapacity * (100 - currentCharge) / 100 * evPricePerKWh).toFixed(2)}
                       </span>
                       <span className="text-lg font-bold">€ TTC</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-white/20 text-[10px] opacity-80 leading-relaxed font-medium italic">
                      Basé sur {((batteryCapacity * (100 - currentCharge)) / 100).toFixed(1)} kWh à rattraper.
                    </div>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <div className="text-[10px] font-bold text-text-muted uppercase mb-2">Temps de recharge</div>
                  <div className="text-4xl font-bold text-emerald-600">
                    {Math.floor((batteryCapacity * (100 - currentCharge) / 100) / chargerPower)}h {Math.round((((batteryCapacity * (100 - currentCharge) / 100) / chargerPower) % 1) * 60)}m
                  </div>
                </div>
              </motion.div>
            ) : activeTab === 'rj45' ? (
              <motion.div 
                key="rj45-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center pt-4"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-8">
                  Schéma de Câblage T568B
                </div>

                <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-sm w-72">
                  <div className="bg-white border-b-2 border-slate-300 py-3 text-center">
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter">T-568B</h3>
                  </div>
                  
                  <div className="bg-[#fce0d8] p-4 pt-2">
                    <div className="flex justify-between px-2 mb-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                        <div key={n} className="w-6 text-center text-lg font-bold text-slate-700">{n}</div>
                      ))}
                    </div>

                    <div className="flex h-56 items-stretch justify-between px-2 gap-1 mb-2">
                      {[
                        { label: 'O/', color: '#f97316', striped: true },
                        { label: 'O', color: '#f97316', striped: false },
                        { label: 'G/', color: '#22c55e', striped: true },
                        { label: 'B', color: '#2563eb', striped: false },
                        { label: 'B/', color: '#2563eb', striped: true },
                        { label: 'G', color: '#22c55e', striped: false },
                        { label: 'Br/', color: '#78350f', striped: true },
                        { label: 'Br', color: '#78350f', striped: false },
                      ].map((wire, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1">
                          <div className="w-full h-1 bg-slate-400 mb-2 rounded-full" />
                          <div 
                            className="w-full flex-1 rounded-t-sm border border-black/20 shadow-inner overflow-hidden"
                            style={{ 
                              backgroundColor: wire.striped ? '#fff' : wire.color,
                              backgroundImage: wire.striped 
                                ? `repeating-linear-gradient(45deg, transparent, transparent 10px, ${wire.color} 10px, ${wire.color} 20px)`
                                : 'none'
                            }}
                          />
                          <div className="mt-2 text-[11px] font-bold text-slate-700">{wire.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-10 max-w-xs text-[11px] leading-relaxed text-text-muted italic bg-pink-50/50 p-4 rounded-xl border border-pink-100">
                  <Info className="w-4 h-4 text-pink-400 mb-2" />
                  Le standard <strong>T568B</strong> est le plus utilisé en milieu résidentiel et tertiaire. Un câble "droit" utilise le même standard aux deux extrémités.
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="cable-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full flex flex-col items-center"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-text-muted mb-12">
                  Visualisation Câble XVB
                </div>

                {/* Cable Cross-Section Representation */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                  {/* Outer Sheath (Grey) */}
                  <div className="absolute w-full h-full rounded-full bg-[#D1D5DB] shadow-inner border-4 border-[#9CA3AF] flex items-center justify-center">
                    {/* Inner Insulation Layer */}
                    <div className="w-[90%] h-[90%] rounded-full bg-[#F3F4F6] border border-[#E5E7EB] relative">
                      {/* Conductors (3G) */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Earth (Green/Yellow) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            top: '15%'
                          }}
                          className="absolute rounded-full bg-gradient-to-r from-green-500 via-yellow-400 to-green-500 border border-green-600 shadow-sm"
                        />
                        {/* Phase (Brown) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            bottom: '20%',
                            left: '15%'
                          }}
                          className="absolute rounded-full bg-[#78350F] border border-[#451A03] shadow-sm"
                        />
                        {/* Neutral (Blue) */}
                        <div 
                          style={{ 
                            width: `${15 + (selectedSection / 16) * 40}%`, 
                            height: `${15 + (selectedSection / 16) * 40}%`,
                            bottom: '20%',
                            right: '15%'
                          }}
                          className="absolute rounded-full bg-[#1D4ED8] border border-[#1E3A8A] shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 space-y-2">
                  <div className="text-3xl font-bold text-text-main">XVB 3G {selectedSection} mm²</div>
                  <div className="text-sm text-text-muted font-medium">
                    Diamètre approx. : {(Math.sqrt(selectedSection / Math.PI) * 2 * 1.5).toFixed(1)} mm
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border-theme w-full max-w-xs text-[9px] text-text-muted italic leading-relaxed text-center space-y-1">
                  <div>R câble = (ρ × 2L) / S | ρ = 0.017</div>
                  <div>ΔU = R × I (Calibre)</div>
                  <div>Icc = U / R câble</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeTab === 'threshold' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-8 left-12 right-12 grid grid-cols-4 gap-4"
              >
                {[
                  { label: 'P. Limite', value: `${maxPower} W`, icon: Shield, color: 'text-text-main', bg: 'bg-white' },
                  { 
                    label: 'P. Tirée', 
                    value: measuredPower > 0 ? (measuredPower.toLocaleString('fr-FR') + " W") : '---', 
                    icon: Zap, 
                    color: diagnostic ? diagnostic.color : 'text-text-main',
                    bg: diagnostic ? diagnostic.bg : 'bg-white'
                  },
                  { 
                    label: 'Courant (I)', 
                    value: measuredCurrent > 0 ? (measuredCurrent.toLocaleString('fr-FR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + " A") : '---', 
                    icon: Activity, 
                    color: diagnostic ? diagnostic.color : 'text-text-main',
                    bg: diagnostic ? diagnostic.bg : 'bg-white'
                  },
                  { label: 'R. Mesurée', value: `${measuredResistance || '---'} Ω`, icon: Omega, color: 'text-text-main', bg: 'bg-white' }
                ].map((stat) => (
                  <div 
                    key={stat.label} 
                    className={`flex flex-col p-3 rounded-xl border border-border-theme/40 ${stat.bg} shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all duration-300`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-3 h-3 ${stat.color} opacity-70`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-muted">{stat.label}</span>
                    </div>
                    <span className={`text-sm font-black font-mono tracking-tight ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {activeTab === 'home' && (
        <div className="mt-8 text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] opacity-50">
          made by boularabi amine
        </div>
      )}
    </div>
  );
}
