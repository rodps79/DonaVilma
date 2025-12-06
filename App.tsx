import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Home, 
  Settings, 
  Calculator, 
  DollarSign, 
  Plus, 
  Trash2,
  Save,
  FileText,
  Users,
  Download,
  Upload,
  RefreshCcw,
  Calendar,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { INITIAL_ROOMS, INITIAL_PRICES, INITIAL_FIXED_COSTS } from './constants';
import { Room, UnitPrice, FixedCost } from './types';

// --- Styles Constants ---
const STYLES = {
  input: "w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 transition-all outline-none hover:bg-white",
  inputSmall: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-1.5 transition-all outline-none text-center",
  label: "block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide",
  card: "bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-slate-900/5",
  tableHeader: "bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider text-left py-3 px-4 border-b border-slate-100",
  tableCell: "py-3 px-4 text-sm text-slate-600 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors",
};

// --- Helper Functions ---

const getRoomDimensions = (room: Room) => {
  const floorArea = room.width * room.length;
  const perimeter = (room.width + room.length) * 2;
  const wallAreaGross = perimeter * room.height;
  const wallAreaNet = Math.max(0, wallAreaGross - room.deductionArea);
  const ceilingArea = floorArea;
  
  return { floorArea, perimeter, wallAreaNet, ceilingArea };
};

// --- Helper Components ---

interface CardProps {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = "", id, style, onClick }) => (
  <div id={id} className={`${STYLES.card} ${className}`} style={style} onClick={onClick}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "" }: any) => {
  const baseStyle = "px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-sm";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300",
    secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 ring-1 ring-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-none"
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

interface TaskCostDisplayProps { 
  room: Room; 
  taskKey: string;
  unitPrices: UnitPrice[];
  fixedCosts: FixedCost[];
}

const TaskCostDisplay = ({ room, taskKey, unitPrices, fixedCosts }: TaskCostDisplayProps) => {
  const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);
  
  // Find price in UnitPrices first
  let price: UnitPrice | FixedCost | undefined = unitPrices.find(p => p.applyTo === taskKey);
  let isFixed = false;

  // If not found (like switches/sockets which moved), look in fixed costs by name matching
  if (!price && taskKey === 'switchCount') {
     price = fixedCosts.find(fc => fc.item === 'Ponto Interruptor');
     isFixed = true;
  }
  if (!price && taskKey === 'socketCount') {
     price = fixedCosts.find(fc => fc.item === 'Ponto Tomada');
     isFixed = true;
  }

  if (!price) return null;

  let quantity = 0;
  if (taskKey === 'switchCount') quantity = room.switchCount;
  else if (taskKey === 'socketCount') quantity = room.socketCount;
  else if (taskKey in room.tasks) {
    // Type-safe check
    const taskKeyTyped = taskKey as keyof Room['tasks'];
    if (!room.tasks[taskKeyTyped]) return null;
    
    if (taskKey.includes('floor')) quantity = floorArea;
    else if (taskKey.includes('wall')) quantity = wallAreaNet;
    else if (taskKey.includes('ceiling')) quantity = ceilingArea;
  }

  if (quantity <= 0) return null;

  // Handle different structure of FixedCost vs UnitPrice
  const pLabor = isFixed ? (price as FixedCost).priceLaborUnit : (price as UnitPrice).priceLabor;
  const pMaterial = isFixed ? (price as FixedCost).priceMaterialUnit : (price as UnitPrice).priceMaterial;

  const labor = quantity * pLabor;
  const material = quantity * pMaterial;
  
  // Format small currency
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <span className="text-[10px] text-slate-400 font-medium ml-auto bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
      MO: {f(labor)} {material > 0 && `• Mat: ${f(material)}`}
    </span>
  );
};

// --- Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'prices' | 'synthesis' | 'meeting' | 'schedule'>('dashboard');
  
  // --- Initialize State from LocalStorage or Constants ---
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('reforma_rooms');
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>(() => {
    try {
      const saved = localStorage.getItem('reforma_prices');
      return saved ? JSON.parse(saved) : INITIAL_PRICES;
    } catch {
      return INITIAL_PRICES;
    }
  });

  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(() => {
    try {
      const saved = localStorage.getItem('reforma_costs');
      return saved ? JSON.parse(saved) : INITIAL_FIXED_COSTS;
    } catch {
      return INITIAL_FIXED_COSTS;
    }
  });

  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('reforma_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('reforma_prices', JSON.stringify(unitPrices));
  }, [unitPrices]);

  useEffect(() => {
    localStorage.setItem('reforma_costs', JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  // --- Sync Effects (Room Counts -> Fixed Costs) ---
  useEffect(() => {
    const totalSwitches = rooms.reduce((acc, r) => acc + (r.switchCount || 0), 0);
    const totalSockets = rooms.reduce((acc, r) => acc + (r.socketCount || 0), 0);

    setFixedCosts(prev => {
      let changed = false;
      const next = prev.map(fc => {
        if (fc.item === 'Ponto Interruptor' && fc.quantity !== totalSwitches) {
          changed = true;
          return { ...fc, quantity: totalSwitches };
        }
        if (fc.item === 'Ponto Tomada' && fc.quantity !== totalSockets) {
          changed = true;
          return { ...fc, quantity: totalSockets };
        }
        return fc;
      });
      return changed ? next : prev;
    });
  }, [rooms]);

  // --- Data Management Functions ---

  const handleExportData = () => {
    const data = {
      rooms,
      unitPrices,
      fixedCosts,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reforma-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (data.rooms) setRooms(data.rooms);
        if (data.unitPrices) setUnitPrices(data.unitPrices);
        if (data.fixedCosts) setFixedCosts(data.fixedCosts);
        
        alert('Dados importados com sucesso!');
      } catch (error) {
        alert('Erro ao ler o arquivo. Verifique se é um backup válido.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = ''; 
  };

  const handleResetData = () => {
    if (confirm('Tem certeza? Isso apagará todos os dados atuais e restaurará os valores padrão.')) {
      setRooms(INITIAL_ROOMS);
      setUnitPrices(INITIAL_PRICES);
      setFixedCosts(INITIAL_FIXED_COSTS);
    }
  };

  // --- Calculations ---

  const calculations = useMemo(() => {
    let totalLabor = 0;
    let totalMaterial = 0;
    const categoryTotals: Record<string, number> = {};

    // Structure for detailed breakdown by material type
    const detailedGroups: Record<string, { labor: number; material: number }> = {
      'Demolição': { labor: 0, material: 0 },
      'Reboco & Chapisco': { labor: 0, material: 0 },
      'Cerâmicas': { labor: 0, material: 0 },
      'Pintura': { labor: 0, material: 0 },
      'Gesso & Forros': { labor: 0, material: 0 },
      'Instalações & Outros': { labor: 0, material: 0 }
    };

    // 1. Calculate Room-based variable costs
    rooms.forEach(room => {
      const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);

      unitPrices.forEach(price => {
        let quantity = 0;
        let isActive = false;

        // Switches and sockets are now handled in Fixed Costs, so we skip them here
        if (price.applyTo === 'switchCount' || price.applyTo === 'socketCount') {
          return;
        }

        // It's a boolean task key
        // @ts-ignore
        isActive = room.tasks[price.applyTo];
        if (isActive) {
            if (price.applyTo.includes('floor')) quantity = floorArea;
            else if (price.applyTo.includes('wall')) quantity = wallAreaNet;
            else if (price.applyTo.includes('ceiling')) quantity = ceilingArea;
        }

        if (isActive && quantity > 0) {
          const costL = quantity * price.priceLabor;
          const costM = quantity * price.priceMaterial;
          const total = costL + costM;

          totalLabor += costL;
          totalMaterial += costM;
          
          // General Category Total
          categoryTotals[price.category] = (categoryTotals[price.category] || 0) + total;

          // Detailed Grouping Logic
          let group = 'Instalações & Outros';
          const lowerItem = price.item.toLowerCase();
          
          if (price.category === 'Demolição') {
             group = 'Demolição';
          } else if (lowerItem.includes('reboco') || lowerItem.includes('chapisco') || lowerItem.includes('contrapiso')) {
             group = 'Reboco & Chapisco';
          } else if ((lowerItem.includes('cerâmica') || lowerItem.includes('piso')) && !lowerItem.includes('demolição')) {
             group = 'Cerâmicas';
          } else if (lowerItem.includes('pintura')) {
             group = 'Pintura';
          } else if (lowerItem.includes('gesso') || lowerItem.includes('forro')) {
             group = 'Gesso & Forros';
          }
          
          detailedGroups[group].labor += costL;
          detailedGroups[group].material += costM;
        }
      });
    });

    // 2. Calculate Fixed/Unit Costs
    let fixedTotal = 0;
    fixedCosts.forEach(fc => {
      const costL = fc.quantity * fc.priceLaborUnit;
      const costM = fc.quantity * fc.priceMaterialUnit;
      totalLabor += costL;
      totalMaterial += costM;
      fixedTotal += (costL + costM);
      
      // Fixed costs go to 'Instalações & Outros'
      detailedGroups['Instalações & Outros'].labor += costL;
      detailedGroups['Instalações & Outros'].material += costM;
    });
    
    // Add fixed costs to a category called "Instalações & Outros"
    categoryTotals['Instalações & Outros'] = fixedTotal;

    const breakdown = Object.keys(categoryTotals).map(key => ({
      name: key,
      value: categoryTotals[key]
    }));

    const detailedChartData = Object.entries(detailedGroups).map(([name, data]) => ({
      name,
      Labor: data.labor,
      Material: data.material,
      Total: data.labor + data.material
    })).filter(d => d.Total > 0);

    return {
      totalLabor,
      totalMaterial,
      grandTotal: totalLabor + totalMaterial,
      categoryBreakdown: breakdown,
      detailedChartData
    };
  }, [rooms, unitPrices, fixedCosts]);

  // --- Schedule Calculations (Lifted) ---
  const scheduleData = useMemo(() => {
    // 1. Calculate total quantities
    const totals = {
      demoArea: 0,
      roofArea: 0,
      infraCount: 0,
      masonryArea: 0,
      gypsumArea: 0,
      tilingArea: 0,
      paintingArea: 0,
      installationsCount: 0,
      electricalFinishCount: 0
    };

    // From Rooms
    rooms.forEach(r => {
      const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(r);
      if (r.tasks.demo_floor) totals.demoArea += floorArea;
      if (r.tasks.demo_wall) totals.demoArea += wallAreaNet;
      if (r.tasks.demo_ceiling) totals.demoArea += ceilingArea;
      if (r.tasks.ref_floor_screed) totals.masonryArea += floorArea;
      if (r.tasks.ref_wall_plaster) totals.masonryArea += wallAreaNet;
      if (r.tasks.ref_ceiling_plaster) totals.masonryArea += ceilingArea;
      if (r.tasks.ref_ceiling_gypsum) totals.gypsumArea += ceilingArea;
      if (r.tasks.ref_ceiling_pvc) totals.gypsumArea += ceilingArea;
      if (r.tasks.ref_floor_ceramic) totals.tilingArea += floorArea;
      if (r.tasks.ref_wall_ceramic) totals.tilingArea += wallAreaNet;
      if (r.tasks.ref_wall_paint) totals.paintingArea += wallAreaNet;
      if (r.tasks.ref_ceiling_paint) totals.paintingArea += ceilingArea;
    });

    // From Fixed Costs
    fixedCosts.forEach(fc => {
      const name = fc.item.toLowerCase();
      if (name.includes('telhado')) totals.roofArea += fc.quantity;
      if (name.includes('hidráulica') || name.includes('elétrica (infra') || name.includes('impermeabilização')) totals.infraCount += 1;
      if (name.includes('portas') || name.includes('janelas')) totals.installationsCount += fc.quantity;
      if (name.includes('interruptor') || name.includes('tomada')) totals.electricalFinishCount += fc.quantity;
    });

    // 2. Define Productivity Rates
    const RATES = {
      demo: 20, roof: 20, infra: 5, masonry: 15, gypsum: 20,
      tiling: 10, install: 2, painting: 30, elecFinish: 15
    };

    // 3. Build Timeline
    const tasks: { id: string; name: string; startDay: number; duration: number; color: string; dependency?: string }[] = [];

    // Phase 1: Demolition
    const demoDuration = Math.ceil(totals.demoArea / RATES.demo);
    if (demoDuration > 0) tasks.push({ id: 'demo', name: '1. Demolição & Retirada', startDay: 0, duration: Math.max(2, demoDuration), color: 'bg-rose-500' });
    const endDemo = tasks.find(t => t.id === 'demo')?.duration || 0;

    // Phase 2: Structural & Roof
    const roofDuration = Math.ceil(totals.roofArea / RATES.roof);
    let endStructural = endDemo;
    if (roofDuration > 0) {
      tasks.push({ id: 'roof', name: '2. Telhado & Estrutura', startDay: endDemo, duration: Math.max(3, roofDuration), color: 'bg-slate-600', dependency: 'demo' });
      endStructural = endDemo + Math.max(3, roofDuration);
    }

    // Phase 3: Infra
    const infraDuration = totals.infraCount * RATES.infra; 
    let endInfra = endDemo;
    if (infraDuration > 0) {
       tasks.push({ id: 'infra', name: '3. Infra (Elét/Hidr/Imper)', startDay: endDemo + 1, duration: Math.max(2, infraDuration), color: 'bg-blue-500', dependency: 'demo' });
       endInfra = endDemo + 1 + Math.max(2, infraDuration);
    }

    // Phase 4: Masonry
    const startMasonry = Math.max(endStructural, endInfra);
    const masonryDuration = Math.ceil(totals.masonryArea / RATES.masonry);
    let endMasonry = startMasonry;
    if (masonryDuration > 0) {
      tasks.push({ id: 'masonry', name: '4. Reboco e Contrapiso', startDay: startMasonry, duration: Math.max(3, masonryDuration), color: 'bg-orange-500', dependency: 'infra' });
      endMasonry = startMasonry + Math.max(3, masonryDuration);
    }

    // Phase 5: Gypsum
    const gypsumDuration = Math.ceil(totals.gypsumArea / RATES.gypsum);
    let endGypsum = endMasonry;
    if (gypsumDuration > 0) {
       const startGypsum = endMasonry - Math.min(2, Math.floor(masonryDuration * 0.2)); 
       tasks.push({ id: 'gypsum', name: '5. Forros (Gesso/PVC)', startDay: startGypsum, duration: Math.max(2, gypsumDuration), color: 'bg-indigo-400', dependency: 'masonry' });
       endGypsum = startGypsum + Math.max(2, gypsumDuration);
    }

    // Phase 6: Tiling
    const tilingDuration = Math.ceil(totals.tilingArea / RATES.tiling);
    let endTiling = endMasonry;
    if (tilingDuration > 0) {
       const startTiling = endMasonry + 1; 
       tasks.push({ id: 'tiling', name: '6. Revestimentos (Piso/Par)', startDay: startTiling, duration: Math.max(3, tilingDuration), color: 'bg-emerald-500', dependency: 'masonry' });
       endTiling = startTiling + Math.max(3, tilingDuration);
    }

    // Phase 7: Installations
    const installDuration = Math.ceil(totals.installationsCount / RATES.install);
    if (installDuration > 0) {
       tasks.push({ id: 'install', name: '7. Esquadrias e Portas', startDay: endMasonry + 1, duration: Math.max(1, installDuration), color: 'bg-yellow-600', dependency: 'masonry' });
    }

    // Phase 8: Painting
    const startPainting = Math.max(endGypsum, endTiling - 2); 
    const paintingDuration = Math.ceil(totals.paintingArea / RATES.painting);
    let endPainting = startPainting;
    if (paintingDuration > 0) {
       tasks.push({ id: 'painting', name: '8. Pintura Geral', startDay: startPainting, duration: Math.max(3, paintingDuration), color: 'bg-cyan-500', dependency: 'tiling' });
       endPainting = startPainting + Math.max(3, paintingDuration);
    }

    // Phase 9: Finishings
    const elecFinDuration = Math.ceil(totals.electricalFinishCount / RATES.elecFinish);
    if (elecFinDuration > 0) {
      tasks.push({ id: 'finish', name: '9. Acabamentos Finais', startDay: endPainting, duration: Math.max(1, elecFinDuration), color: 'bg-violet-500', dependency: 'painting' });
    }

    const maxDay = Math.max(...tasks.map(t => t.startDay + t.duration), 0);
    const totalDays = maxDay > 0 ? maxDay + 2 : 0; // buffer only if there are tasks

    return { tasks, totalDays };
  }, [rooms, fixedCosts]);

  // --- Cost Helper ---

  const getRoomTotalCost = (room: Room) => {
    const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);
    let total = 0;

    unitPrices.forEach(price => {
      let quantity = 0;
      let isActive = false;

      // Skip switches/sockets from room total as they are now Global
      if (price.applyTo === 'switchCount' || price.applyTo === 'socketCount') {
        return;
      }

      // @ts-ignore
      isActive = room.tasks[price.applyTo];
      if (isActive) {
          if (price.applyTo.includes('floor')) quantity = floorArea;
          else if (price.applyTo.includes('wall')) quantity = wallAreaNet;
          else if (price.applyTo.includes('ceiling')) quantity = ceilingArea;
      }

      if (isActive && quantity > 0) {
        total += quantity * (price.priceLabor + price.priceMaterial);
      }
    });
    
    return total;
  };

  // --- Actions ---

  const addRoom = () => {
    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Novo Ambiente ${rooms.length + 1}`,
      type: 'terreo',
      width: 3,
      length: 3,
      height: 2.6,
      deductionArea: 2,
      switchCount: 0,
      socketCount: 0,
      tasks: {
        demo_floor: false, demo_wall: false, demo_ceiling: false,
        ref_floor_ceramic: false, ref_floor_screed: false,
        ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
        ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: true, ref_ceiling_pvc: false
      }
    };
    setRooms([...rooms, newRoom]);
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
    setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const updateRoomTask = (id: string, task: keyof Room['tasks'], value: boolean) => {
    setRooms(rooms.map(r => r.id === id ? { 
      ...r, 
      tasks: { ...r.tasks, [task]: value } 
    } : r));
  };

  const deleteRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const updatePrice = (id: string, field: 'priceLabor' | 'priceMaterial', value: number) => {
    setUnitPrices(unitPrices.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const updateFixedCost = (id: string, field: keyof FixedCost, value: any) => {
    setFixedCosts(fixedCosts.map(fc => fc.id === id ? { ...fc, [field]: value } : fc));
  };

  const addFixedCost = () => {
    const newCost: FixedCost = {
      id: Math.random().toString(36).substr(2, 9),
      item: 'Novo Item',
      quantity: 1,
      priceLaborUnit: 0,
      priceMaterialUnit: 0
    };
    setFixedCosts([...fixedCosts, newCost]);
  };

  const deleteFixedCost = (id: string) => {
    setFixedCosts(fixedCosts.filter(fc => fc.id !== id));
  };

  const handleNavigateToRoom = (roomId: string) => {
    setActiveTab('rooms');
    setHighlightedRoomId(roomId);
    
    // We need to wait for the view to switch and render
    setTimeout(() => {
      const element = document.getElementById(`room-card-${roomId}`);
      if (element) {
        // scroll-margin-top class on the element handles the sticky header offset
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // --- Views ---

  const ScheduleView = () => {
    // Uses data lifted to App level to avoid conditional hooks
    const { tasks, totalDays } = scheduleData;

    return (
      <div className="space-y-6 animate-fade-in pb-12" key={activeTab}>
        <Card className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Cronograma Estimado</h2>
              <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
                Este cronograma é uma projeção baseada nas quantidades levantadas e produtividade média de uma equipe padrão (2-3 pessoas).
              </p>
            </div>
             <div className="flex flex-col items-end gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[200px]">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Prazo Total</span>
                <span className="text-3xl font-bold text-blue-600">{Math.max(0, totalDays - 2)} Dias</span>
                <span className="text-xs text-slate-400 font-medium">~{Math.ceil((Math.max(0, totalDays - 2)) / 5)} Semanas de obra</span>
             </div>
          </div>

          {/* Gantt Chart Container */}
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium text-lg">Nenhuma atividade geradora de cronograma encontrada.</p>
              <p className="text-sm mt-2">Adicione ambientes e marque tarefas (demolição, revestimentos, etc.) para gerar o cronograma.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/30">
              <div className="min-w-[900px] relative">
                {/* Header Days */}
                <div className="flex border-b border-slate-200 bg-white sticky left-0 z-20">
                  <div className="w-64 flex-shrink-0 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 bg-slate-50/80 sticky left-0 z-20 backdrop-blur-sm">
                    Atividade / Fase
                  </div>
                  <div className="flex-1 flex relative h-12 items-end pb-2">
                    {totalDays > 0 && Array.from({ length: totalDays }).map((_, i) => (
                      (i % 5 === 0 || i === 0) && (
                        <div key={i} className="absolute text-[10px] text-slate-400 border-l border-slate-200 pl-1.5 h-6 flex items-end" style={{ left: `${(i / totalDays) * 100}%` }}>
                          Dia {i + 1}
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100 bg-white">
                  {tasks.map(task => {
                    const leftPercent = totalDays > 0 ? (task.startDay / totalDays) * 100 : 0;
                    const widthPercent = totalDays > 0 ? (task.duration / totalDays) * 100 : 0;
                    
                    return (
                      <div key={task.id} className="flex hover:bg-slate-50 group transition-colors">
                        <div className="w-64 flex-shrink-0 p-4 text-sm font-medium text-slate-700 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 truncate flex items-center" title={task.name}>
                          {task.name}
                        </div>
                        <div className="flex-1 relative h-14 my-auto">
                            {/* Grid Lines */}
                            {totalDays > 0 && Array.from({ length: Math.ceil(totalDays / 5) }).map((_, i) => (
                              <div key={i} className="absolute h-full border-r border-slate-100 border-dashed" style={{ left: `${((i * 5) / totalDays) * 100}%` }}></div>
                            ))}
                            
                            {/* Bar */}
                            <div 
                              className={`absolute top-3 h-8 rounded-lg shadow-sm ${task.color} opacity-90 hover:opacity-100 transition-all flex items-center px-3 ring-1 ring-black/5 hover:scale-[1.01] origin-left`}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            >
                              <span className="text-[10px] text-white font-bold drop-shadow-sm whitespace-nowrap overflow-hidden">
                                {task.duration}d
                              </span>
                            </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
           <div className="mt-8 flex gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900">
              <Info className="flex-shrink-0 text-amber-500 mt-0.5" size={20} />
              <div className="text-sm">
                <strong className="block mb-1 font-semibold">Nota Importante</strong>
                Este cronograma é gerado automaticamente considerando dependências lógicas (Predecessoras). 
                Exemplo: A pintura só inicia após o término do gesso e revestimentos. O prazo real pode variar conforme tamanho da equipe e imprevistos da obra.
              </div>
           </div>
        </Card>
      </div>
    );
  };

  const MeetingView = () => (
    <div className="space-y-8 animate-fade-in pb-12" key={activeTab}>
      <Card className="p-8 border-l-4 border-l-blue-500">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4 text-blue-800 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
               <Users size={32} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Diretrizes para Reunião</h2>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Para garantir que o orçamento gerado seja o mais realista possível, siga o fluxo de trabalho sugerido abaixo antes de aprofundar nos detalhes do projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
          {/* Step 1 */}
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors flex flex-col group">
            <div className="flex items-center gap-4 mb-6">
               <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">1</span>
               <h3 className="text-xl font-bold text-slate-800">Validação de Preços</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm">
              O primeiro passo deve ser sempre na aba <strong>Preços</strong>.
            </p>
            <ul className="space-y-4 text-slate-700 flex-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Valide <strong>TODOS</strong> os itens listados.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Atualize os valores (SINAPI vs Mercado) via <strong>consenso</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Preencham todos os campos obrigatórios.</span>
              </li>
            </ul>
            <Button onClick={() => setActiveTab('prices')} variant="secondary" className="mt-8 w-full justify-center">
             Ir para Preços <ChevronRight size={16} />
           </Button>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors flex flex-col group">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">2</span>
              <h3 className="text-xl font-bold text-slate-800">Conferência de Medidas</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm">
              O segundo passo é na aba <strong>Síntese</strong>.
            </p>
            <ul className="space-y-4 text-slate-700 flex-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Confronte as áreas calculadas com a <strong>planta baixa</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Valide a coerência das metragens de piso, parede e teto.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span><strong>Pequenas diferenças</strong> são normais (arredondamentos/vãos).</span>
              </li>
            </ul>
            <Button onClick={() => setActiveTab('synthesis')} variant="secondary" className="mt-8 w-full justify-center">
             Ir para Síntese <ChevronRight size={16} />
           </Button>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors flex flex-col group">
            <div className="flex items-center gap-4 mb-6">
              <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">3</span>
              <h3 className="text-xl font-bold text-slate-800">Registro de Estimativas</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm">
              O terceiro passo é anotar os valores atuais no <strong>Dashboard</strong>.
            </p>
            <ul className="space-y-4 text-slate-700 flex-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Anote: Custo Total, Materiais e Mão de Obra.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Origem: Inspeção e estimativa inicial.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Estes valores <strong>não são definitivos</strong>.</span>
              </li>
            </ul>
             <Button onClick={() => setActiveTab('dashboard')} variant="secondary" className="mt-8 w-full justify-center">
             Ir para Dashboard <ChevronRight size={16} />
           </Button>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-colors flex flex-col group">
             <div className="flex items-center gap-4 mb-6">
              <span className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">4</span>
              <h3 className="text-xl font-bold text-slate-800">Refinamento do Escopo</h3>
            </div>
            <p className="text-slate-500 mb-6 text-sm">
              O quarto passo é detalhar o serviço na aba <strong>Ambientes</strong>.
            </p>
            <ul className="space-y-4 text-slate-700 flex-1">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Analise cada atividade ambiente por ambiente.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Adicione ou remova tarefas conforme necessário.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                <span>Observe a atualização em <strong>tempo real</strong> e confronte com o Dashboard final.</span>
              </li>
            </ul>
             <Button onClick={() => setActiveTab('rooms')} variant="secondary" className="mt-8 w-full justify-center">
             Ir para Ambientes <ChevronRight size={16} />
           </Button>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-100 flex gap-4 text-amber-900 mt-8">
             <div className="bg-amber-200 p-2 rounded-lg h-fit">
                <Info size={24} className="text-amber-700"/>
             </div>
            <div className="space-y-3">
              <h4 className="font-bold text-lg">Atenção Importante sobre Preços</h4>
              <p>
                <strong>Não confunda Preço Unitário com Aplicação.</strong>
              </p>
              <p className="text-sm opacity-90">
                Nesta etapa inicial de validação, não se preocupe se um determinado item (ex: "Forro de Gesso") será ou não usado na reforma.
                A definição de <strong>ONDE</strong> cada item será aplicado é feita em um terceiro momento, na aba <strong>Ambientes</strong> (Passo 4).
              </p>
              <p className="font-medium bg-white/60 p-3 rounded-lg border border-amber-200/50 text-sm">
                O objetivo inicial (Passo 1) é apenas concordar: <br/>
                <em>"Se formos fazer este serviço, quanto custará o metro quadrado?"</em>
              </p>
            </div>
          </div>
      </Card>
    </div>
  );

  const DashboardView = () => {
    // Prepare data for Room Cost Chart
    const roomCostData = rooms.map(room => ({
      name: room.name,
      cost: getRoomTotalCost(room),
      id: room.id,
      isFixed: false
    }));

    // Add Fixed Cost Bars
    const fixedCostData = fixedCosts.map((fc, index) => ({
      name: fc.item,
      cost: fc.quantity * (fc.priceLaborUnit + fc.priceMaterialUnit),
      id: `fc-${fc.id}`,
      isFixed: true
    })).filter(fc => fc.cost > 0);

    const mergedChartData = [...roomCostData, ...fixedCostData].sort((a, b) => b.cost - a.cost);
    
    return (
      <div className="space-y-8 animate-fade-in pb-12" key={activeTab}>
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 relative overflow-hidden group">
            <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custo Total Estimado</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2 tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.grandTotal)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400">
               <span className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-medium">{rooms.length} Ambientes</span>
               <span>•</span>
               <span>Atualizado agora</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500/10 group-hover:bg-blue-500 transition-colors duration-300"></div>
          </Card>

          <Card className="p-6 relative overflow-hidden group">
             <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Materiais</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2 tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.totalMaterial)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <Calculator size={24} />
              </div>
            </div>
            <div className="mt-6 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(calculations.totalMaterial / calculations.grandTotal) * 100}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 relative overflow-hidden group">
             <div className="flex justify-between items-start z-10 relative">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mão de Obra</p>
                <h3 className="text-3xl font-bold text-amber-600 mt-2 tracking-tight">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.totalLabor)}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                <Settings size={24} />
              </div>
            </div>
             <div className="mt-6 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-1.5 rounded-full transition-all duration-1000" 
                style={{ width: `${(calculations.totalLabor / calculations.grandTotal) * 100}%` }}
              ></div>
            </div>
          </Card>
        </div>

        {/* Room Cost Chart (New) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="p-6 lg:col-span-2">
            <h4 className="text-lg font-bold text-slate-800 mb-6">Custos por Ambiente e Itens Globais</h4>
             <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mergedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} interval={0} angle={-45} textAnchor="end" height={80} tick={{fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} tick={{fill: '#64748b'}} />
                  <Tooltip
                    formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'white' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar
                    dataKey="cost"
                    name="Custo Total"
                    radius={[6, 6, 0, 0]}
                    onClick={(data: any) => {
                      const item = data.payload || data;
                      if (!item.isFixed) handleNavigateToRoom(item.id);
                    }}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    {mergedChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.isFixed ? '#10b981' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-bold text-slate-800 mb-6">Distribuição</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Mão de Obra', value: calculations.totalLabor },
                      { name: 'Materiais', value: calculations.totalMaterial },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip 
                     formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                     contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
               <div className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                 <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Mão de Obra</span>
                 <span className="font-bold text-slate-700">{Math.round((calculations.totalLabor / calculations.grandTotal) * 100)}%</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Materiais</span>
                 <span className="font-bold text-slate-700">{Math.round((calculations.totalMaterial / calculations.grandTotal) * 100)}%</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Detailed Chart (New) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="p-6 lg:col-span-2">
            <h4 className="text-lg font-bold text-slate-800 mb-6">Detalhamento por Tipo (MO vs Materiais)</h4>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.detailedChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} tick={{fill: '#64748b'}} />
                    <Tooltip 
                    formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="Labor" name="Mão de Obra" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Material" name="Materiais" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </Card>

            <Card className="p-6">
                <h4 className="text-lg font-bold text-slate-800 mb-6">Custos por Etapa Geral</h4>
                <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={calculations.categoryBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} fontSize={10} tick={{fill: '#64748b'}} />
                    <Tooltip 
                        formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Total" barSize={20}>
                        {calculations.categoryBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#ec4899', '#f97316'][index % 4]} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* Fixed Costs Breakdown */}
        <Card className="p-0 overflow-hidden mt-6">
            <div className="p-6 border-b border-slate-100">
               <h4 className="text-lg font-bold text-slate-800">Detalhamento de Custos Fixos & Globais</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={STYLES.tableHeader}>
                  <tr>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3 text-center">Quantidade</th>
                    <th className="px-6 py-3 text-right">MO Total</th>
                    <th className="px-6 py-3 text-right">Material Total</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {fixedCosts.map(fc => {
                    const totalL = fc.quantity * fc.priceLaborUnit;
                    const totalM = fc.quantity * fc.priceMaterialUnit;
                    const subtotal = totalL + totalM;
                    return (
                      <tr key={fc.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 font-medium text-slate-700">{fc.item}</td>
                        <td className="px-6 py-4 text-center text-slate-600 bg-slate-50/50 m-1 rounded">{fc.quantity}</td>
                        <td className="px-6 py-4 text-right text-amber-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalL)}</td>
                        <td className="px-6 py-4 text-right text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalM)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
        </Card>
      </div>
    );
  };

  const SynthesisView = () => {
    // Helper to calculate costs per room
    const synthesisData = rooms.map(room => {
      const { floorArea, wallAreaNet, ceilingArea, perimeter } = getRoomDimensions(room);

      let demoValue = 0;
      let refValue = 0;

      unitPrices.forEach(price => {
        let quantity = 0;
        let isActive = false;

        // Skip global items for room breakdown
        if (price.applyTo === 'switchCount' || price.applyTo === 'socketCount') {
          return;
        }

        // @ts-ignore
        isActive = room.tasks[price.applyTo];
        if (isActive) {
            if (price.applyTo.includes('floor')) quantity = floorArea;
            else if (price.applyTo.includes('wall')) quantity = wallAreaNet;
            else if (price.applyTo.includes('ceiling')) quantity = ceilingArea;
        }

        if (isActive && quantity > 0) {
          const totalItemCost = quantity * (price.priceLabor + price.priceMaterial);
          if (price.category === 'Demolição') {
            demoValue += totalItemCost;
          } else {
            refValue += totalItemCost;
          }
        }
      });

      return {
        ...room,
        floorArea,
        perimeter,
        wallAreaGross: perimeter * room.height,
        wallAreaNet,
        demoValue,
        refValue
      };
    });

    // Calculate totals
    const totals = synthesisData.reduce((acc, curr) => ({
      floorArea: acc.floorArea + curr.floorArea,
      wallAreaGross: acc.wallAreaGross + curr.wallAreaGross,
      wallAreaNet: acc.wallAreaNet + curr.wallAreaNet,
      perimeter: acc.perimeter + curr.perimeter,
      demoValue: acc.demoValue + curr.demoValue,
      refValue: acc.refValue + curr.refValue,
      switchCount: acc.switchCount + curr.switchCount,
      socketCount: acc.socketCount + curr.socketCount
    }), {
      floorArea: 0,
      wallAreaGross: 0,
      wallAreaNet: 0,
      perimeter: 0,
      demoValue: 0,
      refValue: 0,
      switchCount: 0,
      socketCount: 0
    });

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    // Calculate total fixed costs
    const totalFixedCosts = fixedCosts.reduce((acc, fc) => acc + (fc.quantity * (fc.priceLaborUnit + fc.priceMaterialUnit)), 0);

    return (
      <div className="space-y-8 animate-fade-in pb-12" key={activeTab}>
        <div className="flex justify-between items-end">
           <h2 className="text-2xl font-bold text-slate-800">Síntese Legendada</h2>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className={STYLES.tableHeader}>
                <tr>
                  <th className="px-6 py-4 min-w-[150px]">Ambiente</th>
                  <th className="px-4 py-4 text-center">PD (m)</th>
                  <th className="px-4 py-4 text-center">Área Piso (m²)</th>
                  <th className="px-4 py-4 text-center">Par. Bruta (m²)</th>
                  <th className="px-4 py-4 text-center">Par. Útil (m²)</th>
                  <th className="px-4 py-4 text-center">Perímetro (m)</th>
                  <th className="px-4 py-4 text-right">Demolição ($)</th>
                  <th className="px-4 py-4 text-right">Refazimento ($)</th>
                  <th className="px-4 py-4 text-center">Interruptores</th>
                  <th className="px-4 py-4 text-center">Tomadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {synthesisData.map((data) => (
                  <tr key={data.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-3 font-medium text-blue-600">
                      <button 
                        onClick={() => handleNavigateToRoom(data.id)}
                        className="hover:text-blue-700 hover:underline focus:outline-none text-left w-full font-semibold"
                      >
                        {data.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">{data.height.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{data.floorArea.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{data.wallAreaGross.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-600 font-medium bg-slate-50/50">{data.wallAreaNet.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-400">{data.perimeter.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-rose-600/80">{formatCurrency(data.demoValue)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600/80">{formatCurrency(data.refValue)}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{data.switchCount}</td>
                    <td className="px-4 py-3 text-center text-slate-600">{data.socketCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td className="px-6 py-4 uppercase text-xs tracking-wider">TOTAL AMBIENTES</td>
                  <td className="px-4 py-4 text-center">-</td>
                  <td className="px-4 py-4 text-center">{totals.floorArea.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">{totals.wallAreaGross.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">{totals.wallAreaNet.toFixed(2)}</td>
                  <td className="px-4 py-4 text-center">{totals.perimeter.toFixed(2)}</td>
                  <td className="px-4 py-4 text-right text-rose-700">{formatCurrency(totals.demoValue)}</td>
                  <td className="px-4 py-4 text-right text-emerald-700">{formatCurrency(totals.refValue)}</td>
                  <td className="px-4 py-4 text-center">{totals.switchCount}</td>
                  <td className="px-4 py-4 text-center">{totals.socketCount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
        
        <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-800 mb-6">Custos Fixos e Itens Globais</h3>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className={STYLES.tableHeader}>
                    <tr>
                        <th className="px-6 py-4">Item Global</th>
                        <th className="px-6 py-4 text-center">Quantidade</th>
                        <th className="px-6 py-4 text-right">Custo Unitário Total</th>
                         <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                    {fixedCosts.map(fc => {
                        const unitTotal = fc.priceLaborUnit + fc.priceMaterialUnit;
                        const subtotal = fc.quantity * unitTotal;
                        return (
                        <tr key={fc.id} className="hover:bg-slate-50 group">
                            <td className="px-6 py-4 font-medium text-slate-700">{fc.item}</td>
                            <td className="px-6 py-4 text-center text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded">{fc.quantity}</span></td>
                            <td className="px-6 py-4 text-right text-slate-500">{formatCurrency(unitTotal)}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(subtotal)}</td>
                        </tr>
                        );
                    })}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-right uppercase text-xs tracking-wider">Total Itens Globais</td>
                            <td className="px-6 py-4 text-right">{formatCurrency(totalFixedCosts)}</td>
                        </tr>
                         <tr className="bg-blue-50/50">
                            <td colSpan={3} className="px-6 py-6 text-right uppercase text-blue-700 text-sm">Custo Total da Obra (Ambientes + Globais)</td>
                            <td className="px-6 py-6 text-right text-blue-700 text-xl font-black">
                                {formatCurrency(totals.demoValue + totals.refValue + totalFixedCosts)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
                </div>
            </Card>
        </div>
      </div>
    );
  };

  const RoomsView = () => (
    <div className="space-y-8 animate-fade-in pb-12" key={activeTab}>
      <div className="flex justify-between items-center sticky top-20 z-10 bg-slate-100/90 backdrop-blur py-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-slate-200/50">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Ambientes & Escopo</h2>
           <p className="text-slate-500 text-sm">Gerencie as dimensões e tarefas de cada cômodo.</p>
        </div>
        <Button onClick={addRoom}>
          <Plus size={20} />
          <span className="hidden sm:inline">Adicionar Ambiente</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {rooms.map((room) => {
          const { floorArea, wallAreaNet } = getRoomDimensions(room);
          const isHighlighted = highlightedRoomId === room.id;
          const roomTotal = getRoomTotalCost(room);
          
          return (
            <Card 
              key={room.id} 
              id={`room-card-${room.id}`}
              onClick={() => setHighlightedRoomId(room.id)}
              className={`overflow-hidden scroll-mt-48 transition-all duration-500 ${isHighlighted ? 'ring-2 ring-blue-500 shadow-xl scale-[1.01]' : ''}`}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 p-6 flex flex-wrap gap-6 justify-between items-start">
                <div className="flex items-start gap-6 flex-1 flex-wrap">
                  <div className="w-full md:w-1/3 min-w-[200px]">
                    <label className={STYLES.label}>Nome do Ambiente</label>
                    <input 
                      type="text" 
                      value={room.name}
                      onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                      className={`${STYLES.input} font-semibold text-lg`}
                    />
                  </div>
                  <div className="w-32">
                     <label className={STYLES.label}>Piso</label>
                     <select 
                      value={room.type}
                      onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                      className={STYLES.input}
                     >
                       <option value="subsolo">Subsolo</option>
                       <option value="terreo">Térreo</option>
                       <option value="superior">Superior</option>
                     </select>
                  </div>
                </div>
                 
                 <div className="flex flex-col items-end gap-2">
                    <div className="flex flex-col items-end justify-center bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-2 min-w-[160px]">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total Estimado</span>
                        <span className="text-xl font-bold text-emerald-700">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(roomTotal)}
                        </span>
                    </div>
                     <Button variant="ghost" onClick={() => deleteRoom(room.id)} className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 h-auto">
                        <Trash2 size={14} className="mr-1" /> Excluir
                    </Button>
                 </div>
              </div>

              {/* Dimensions */}
              <div className="p-6 bg-white grid grid-cols-2 md:grid-cols-5 gap-6 border-b border-slate-100">
                <div>
                   <label className={STYLES.label}>Largura (m)</label>
                   <input type="number" step="0.05" value={room.width} onChange={(e) => updateRoom(room.id, 'width', parseFloat(e.target.value))} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.label}>Comprimento (m)</label>
                   <input type="number" step="0.05" value={room.length} onChange={(e) => updateRoom(room.id, 'length', parseFloat(e.target.value))} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.label}>Pé Direito (m)</label>
                   <input type="number" step="0.05" value={room.height} onChange={(e) => updateRoom(room.id, 'height', parseFloat(e.target.value))} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.label}>Desc. Vãos (m²)</label>
                   <input type="number" step="0.01" value={room.deductionArea} onChange={(e) => updateRoom(room.id, 'deductionArea', parseFloat(e.target.value))} className={STYLES.inputSmall} />
                </div>
                <div className="flex flex-col justify-center text-xs text-slate-500 bg-slate-50 rounded-lg px-3 border border-slate-100">
                  <div className="flex justify-between py-1 border-b border-slate-200/50"><span>Área Piso:</span> <strong>{floorArea.toFixed(2)} m²</strong></div>
                  <div className="flex justify-between py-1"><span>Área Parede:</span> <strong>{wallAreaNet.toFixed(2)} m²</strong></div>
                </div>
              </div>

              {/* Electrical Counts (New) */}
              <div className="px-6 py-4 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-slate-100">
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                   <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xs">
                        INT
                   </div>
                   <div className="flex-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Interruptores</label>
                        <TaskCostDisplay room={room} taskKey="switchCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                   </div>
                   <input 
                     type="number" 
                     min="0" 
                     value={room.switchCount} 
                     onChange={(e) => updateRoom(room.id, 'switchCount', parseInt(e.target.value) || 0)} 
                     className="w-16 border border-slate-200 rounded p-1 text-sm text-center focus:ring-2 focus:ring-yellow-400 outline-none" 
                   />
                </div>
                <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 font-bold text-xs">
                        TOM
                   </div>
                   <div className="flex-1">
                        <label className="text-xs font-bold text-slate-700 uppercase">Tomadas</label>
                        <TaskCostDisplay room={room} taskKey="socketCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                   </div>
                   <input 
                     type="number" 
                     min="0"
                     value={room.socketCount} 
                     onChange={(e) => updateRoom(room.id, 'socketCount', parseInt(e.target.value) || 0)} 
                     className="w-16 border border-slate-200 rounded p-1 text-sm text-center focus:ring-2 focus:ring-yellow-400 outline-none" 
                   />
                </div>
              </div>

              {/* Tasks */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Demolition Column */}
                <div>
                  <h5 className="text-xs font-bold text-rose-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div> Demolição
                  </h5>
                  <div className="space-y-3">
                    {[
                        { key: 'demo_floor', label: 'Demolição Piso' },
                        { key: 'demo_wall', label: 'Demolição Parede' },
                        { key: 'demo_ceiling', label: 'Demolição Teto' }
                    ].map(task => (
                        <label key={task.key} className="flex items-center gap-3 cursor-pointer hover:bg-rose-50/50 p-2 rounded-lg transition-colors group">
                            <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300" />
                            <span className="text-sm text-slate-600 font-medium group-hover:text-rose-700">{task.label}</span>
                            <TaskCostDisplay room={room} taskKey={task.key} unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </label>
                    ))}
                  </div>
                </div>

                {/* Refinishing Floor/Ceiling */}
                <div>
                  <h5 className="text-xs font-bold text-blue-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> Piso & Teto
                  </h5>
                  <div className="space-y-3">
                    {[
                        { key: 'ref_floor_screed', label: 'Contrapiso' },
                        { key: 'ref_floor_ceramic', label: 'Cerâmica Piso' },
                        { key: 'ref_ceiling_gypsum', label: 'Gesso (Teto)' },
                        { key: 'ref_ceiling_plaster', label: 'Reboco Teto' },
                        { key: 'ref_ceiling_paint', label: 'Pintura Teto' },
                        { key: 'ref_ceiling_pvc', label: 'Forro PVC' },
                    ].map((task, idx) => (
                         <React.Fragment key={task.key}>
                            {idx === 2 && <div className="h-px bg-slate-100 my-2"></div>}
                            <label className="flex items-center gap-3 cursor-pointer hover:bg-blue-50/50 p-2 rounded-lg transition-colors group">
                                <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300" />
                                <span className="text-sm text-slate-600 font-medium group-hover:text-blue-700">{task.label}</span>
                                <TaskCostDisplay room={room} taskKey={task.key} unitPrices={unitPrices} fixedCosts={fixedCosts} />
                            </label>
                        </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Refinishing Wall */}
                <div>
                  <h5 className="text-xs font-bold text-orange-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div> Paredes
                  </h5>
                  <div className="space-y-3">
                     {[
                        { key: 'ref_wall_plaster', label: 'Reboco Parede' },
                        { key: 'ref_wall_ceramic', label: 'Cerâmica Parede' },
                        { key: 'ref_wall_paint', label: 'Pintura Parede' },
                    ].map(task => (
                        <label key={task.key} className="flex items-center gap-3 cursor-pointer hover:bg-orange-50/50 p-2 rounded-lg transition-colors group">
                            <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300" />
                            <span className="text-sm text-slate-600 font-medium group-hover:text-orange-700">{task.label}</span>
                            <TaskCostDisplay room={room} taskKey={task.key} unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </label>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const PricesView = () => (
    <div className="space-y-8 animate-fade-in pb-12" key={activeTab}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Tabela de Preços Unitários</h2>
           <p className="text-slate-500 text-sm">Defina os custos base para cada serviço.</p>
        </div>
        <div className="text-xs font-medium text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center gap-2">
           <Info size={16} />
           Edite os valores abaixo para recalcular todo o orçamento automaticamente.
        </div>
      </div>

      {/* Unit Prices Table */}
      <Card className="overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={STYLES.tableHeader}>
              <tr>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4 text-center">Unidade</th>
                <th className="px-6 py-4 text-right w-40">Mão de Obra (R$)</th>
                <th className="px-6 py-4 text-right w-40">Material (R$)</th>
                <th className="px-6 py-4 text-right w-40">Total (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {unitPrices.map((price) => (
                <tr key={price.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3 font-medium text-slate-400 uppercase text-xs tracking-wider">{price.category}</td>
                  <td className="px-6 py-3 font-semibold text-slate-700">{price.item}</td>
                  <td className="px-6 py-3 text-center text-slate-500 bg-slate-50/50 m-1">{price.unit}</td>
                  <td className="px-6 py-3 text-right">
                    <input
                      type="number"
                      step="0.50"
                      value={price.priceLabor}
                      onChange={(e) => updatePrice(price.id, 'priceLabor', parseFloat(e.target.value))}
                      className="w-24 text-right bg-transparent border-b border-slate-200 hover:border-blue-400 focus:border-blue-500 outline-none transition-colors py-1"
                    />
                  </td>
                  <td className="px-6 py-3 text-right">
                    <input
                      type="number"
                      step="0.50"
                      value={price.priceMaterial}
                      onChange={(e) => updatePrice(price.id, 'priceMaterial', parseFloat(e.target.value))}
                      className="w-24 text-right bg-transparent border-b border-slate-200 hover:border-blue-400 focus:border-blue-500 outline-none transition-colors py-1"
                    />
                  </td>
                  <td className="px-6 py-3 text-right font-bold text-slate-800 bg-slate-50/30">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price.priceLabor + price.priceMaterial)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-between items-center pt-8 border-t border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800">Custos Fixos e Globais</h2>
         <Button onClick={addFixedCost}>
           <Plus size={18} /> Adicionar Item
         </Button>
      </div>
      
      <Card className="overflow-hidden shadow-md">
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className={STYLES.tableHeader}>
              <tr>
                <th className="px-6 py-4">Item Global</th>
                <th className="px-6 py-4 text-center">Qtd</th>
                <th className="px-6 py-4 text-right w-36">MO Unit. (R$)</th>
                <th className="px-6 py-4 text-right w-36">Mat. Unit. (R$)</th>
                 <th className="px-6 py-4 text-right">Subtotal</th>
                <th className="px-6 py-4 text-center w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {fixedCosts.map((fc) => {
                 const isAuto = fc.item === 'Ponto Interruptor' || fc.item === 'Ponto Tomada';
                 return (
                    <tr key={fc.id} className="hover:bg-slate-50 group">
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={fc.item}
                          onChange={(e) => updateFixedCost(fc.id, 'item', e.target.value)}
                          disabled={isAuto}
                          className={`w-full bg-transparent border-none focus:ring-0 p-0 ${isAuto ? 'text-slate-500 italic cursor-not-allowed' : 'text-slate-700 font-semibold'}`}
                        />
                         {isAuto && <span className="text-[10px] text-blue-500 font-medium block mt-1">Automático (Soma dos Ambientes)</span>}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          value={fc.quantity}
                          onChange={(e) => updateFixedCost(fc.id, 'quantity', parseFloat(e.target.value))}
                          disabled={isAuto}
                          className={`w-16 text-center border rounded p-1 mx-auto ${isAuto ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none'}`}
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                         <input
                          type="number"
                          step="10"
                          value={fc.priceLaborUnit}
                          onChange={(e) => updateFixedCost(fc.id, 'priceLaborUnit', parseFloat(e.target.value))}
                          className="w-24 text-right bg-transparent border-b border-slate-200 hover:border-blue-400 focus:border-blue-500 outline-none transition-colors py-1"
                        />
                      </td>
                      <td className="px-6 py-3 text-right">
                         <input
                          type="number"
                          step="10"
                          value={fc.priceMaterialUnit}
                          onChange={(e) => updateFixedCost(fc.id, 'priceMaterialUnit', parseFloat(e.target.value))}
                          className="w-24 text-right bg-transparent border-b border-slate-200 hover:border-blue-400 focus:border-blue-500 outline-none transition-colors py-1"
                        />
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800 bg-slate-50/30">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fc.quantity * (fc.priceLaborUnit + fc.priceMaterialUnit))}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {!isAuto && (
                          <button onClick={() => deleteFixedCost(fc.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                 );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar Navigation */}
      <aside className="bg-slate-900 text-white w-full md:w-72 flex-shrink-0 flex flex-col shadow-2xl z-20">
        <div className="p-8 border-b border-slate-800/50 bg-gradient-to-b from-slate-800 to-slate-900">
          <h1 className="text-xl font-black flex items-center gap-3 tracking-tight">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-900/50">
                <LayoutDashboard className="text-white" size={20} />
            </div>
            ReformaCalc <span className="text-blue-500 font-light">Pro</span>
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Planejamento</div>
          <button 
            onClick={() => setActiveTab('meeting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'meeting' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={18} className={activeTab === 'meeting' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Sugestão Reunião
          </button>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'prices' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <DollarSign size={18} className={activeTab === 'prices' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Tabela de Preços
          </button>

          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Projeto</div>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Home size={18} className={activeTab === 'dashboard' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Dashboard Geral
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'rooms' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calculator size={18} className={activeTab === 'rooms' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Ambientes
          </button>
          
           <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-6">Relatórios</div>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={18} className={activeTab === 'schedule' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Cronograma
          </button>
          <button 
            onClick={() => setActiveTab('synthesis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${activeTab === 'synthesis' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={18} className={activeTab === 'synthesis' ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
            Síntese Legendada
          </button>
        </nav>
        
        {/* Data Management Section in Sidebar */}
        <div className="p-4 bg-slate-950">
          <div className="space-y-2">
            <button onClick={handleExportData} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Download size={14} />
              Backup Dados
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <Upload size={14} />
              Restaurar
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            <button onClick={handleResetData} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors mt-2">
              <RefreshCcw size={14} />
              Resetar Tudo
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-600 text-center font-mono">
          v1.4.0 • Design Refresh
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-slate-100 scroll-smooth">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-5 sticky top-0 z-30 flex justify-between items-center shadow-sm">
             <div>
                <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight flex items-center gap-2">
                    {activeTab === 'prices' ? 'Tabela de Preços' : 
                        activeTab === 'synthesis' ? 'Síntese Legendada' : 
                        activeTab === 'meeting' ? 'Sugestão para Reunião' : 
                        activeTab === 'schedule' ? 'Cronograma Estimado' :
                        activeTab === 'rooms' ? 'Gerenciador de Ambientes' :
                        'Dashboard Geral'}
                </h2>
             </div>
             <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Custo Total Estimado</p>
                  <p className="text-2xl font-black text-slate-800 leading-none">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.grandTotal)}
                  </p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
                <button onClick={handleExportData} title="Salvar Backup" className="p-2.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-blue-200">
                  <Save size={20} />
                </button>
             </div>
        </header>

        <div className="p-6 md:p-10 max-w-[1600px] mx-auto">
          {activeTab === 'dashboard' && DashboardView()}
          {activeTab === 'rooms' && RoomsView()}
          {activeTab === 'synthesis' && SynthesisView()}
          {activeTab === 'prices' && PricesView()}
          {activeTab === 'meeting' && MeetingView()}
          {activeTab === 'schedule' && ScheduleView()}
        </div>
      </main>
    </div>
  );
}