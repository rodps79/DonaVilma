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
  Calendar
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

const Card: React.FC<{ children?: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties; onClick?: () => void }> = ({ children, className = "", id, style, onClick }) => (
  <div id={id} className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`} style={style} onClick={onClick}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = 'primary', className = "" }: any) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>
      {children}
    </button>
  );
};

// Moved outside App to prevent re-creation on every render
const TaskCostDisplay: React.FC<{ 
  room: Room; 
  taskKey: string;
  unitPrices: UnitPrice[];
  fixedCosts: FixedCost[];
}> = ({ room, taskKey, unitPrices, fixedCosts }) => {
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
    <span className="text-[10px] text-slate-400 font-medium ml-auto">
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
    if (demoDuration > 0) tasks.push({ id: 'demo', name: '1. Demolição & Retirada', startDay: 0, duration: Math.max(2, demoDuration), color: 'bg-red-500' });
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
      tasks.push({ id: 'finish', name: '9. Acabamentos Finais', startDay: endPainting, duration: Math.max(1, elecFinDuration), color: 'bg-purple-500', dependency: 'painting' });
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
      <div className="space-y-6 animate-fade-in">
        <Card className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Cronograma Estimado</h2>
              <p className="text-slate-500 text-sm mt-1">
                Baseado nas quantidades levantadas e produtividade média de equipe padrão (2-3 pessoas).
              </p>
            </div>
             <div className="text-right bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Prazo Total</p>
                <p className="text-2xl font-bold text-slate-800">{Math.max(0, totalDays - 2)} Dias Úteis</p>
                <p className="text-xs text-slate-500">~{Math.ceil((Math.max(0, totalDays - 2)) / 5)} Semanas</p>
             </div>
          </div>

          {/* Gantt Chart Container */}
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <p>Nenhuma atividade geradora de cronograma encontrada.</p>
              <p className="text-sm mt-2">Adicione ambientes e marque tarefas (demolição, revestimentos, etc.) para gerar o cronograma.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-lg pb-4">
              <div className="min-w-[800px] relative">
                {/* Header Days */}
                <div className="flex border-b border-slate-200 bg-slate-50 sticky left-0">
                  <div className="w-64 flex-shrink-0 p-3 text-xs font-bold text-slate-500 border-r border-slate-200 bg-slate-50 sticky left-0 z-10">
                    ATIVIDADE / FASE
                  </div>
                  <div className="flex-1 flex relative h-10">
                    {totalDays > 0 && Array.from({ length: totalDays }).map((_, i) => (
                      (i % 5 === 0 || i === 0) && (
                        <div key={i} className="absolute text-[10px] text-slate-400 border-l border-slate-200 pl-1 h-full flex items-center" style={{ left: `${(i / totalDays) * 100}%` }}>
                          Dia {i + 1}
                        </div>
                      )
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-100">
                  {tasks.map(task => {
                    const leftPercent = totalDays > 0 ? (task.startDay / totalDays) * 100 : 0;
                    const widthPercent = totalDays > 0 ? (task.duration / totalDays) * 100 : 0;
                    
                    return (
                      <div key={task.id} className="flex hover:bg-slate-50 group">
                        <div className="w-64 flex-shrink-0 p-3 text-sm font-medium text-slate-700 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 truncate" title={task.name}>
                          {task.name}
                        </div>
                        <div className="flex-1 relative h-12 my-auto">
                            {/* Grid Lines */}
                            {totalDays > 0 && Array.from({ length: Math.ceil(totalDays / 5) }).map((_, i) => (
                              <div key={i} className="absolute h-full border-r border-slate-100 border-dashed" style={{ left: `${((i * 5) / totalDays) * 100}%` }}></div>
                            ))}
                            
                            {/* Bar */}
                            <div 
                              className={`absolute top-2 h-8 rounded-md shadow-sm ${task.color} opacity-90 hover:opacity-100 transition-all flex items-center px-2`}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            >
                              <span className="text-[10px] text-white font-bold drop-shadow-md whitespace-nowrap overflow-hidden">
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
          
           <div className="mt-6 bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800 border border-yellow-200">
              <strong>Nota:</strong> Este cronograma é gerado automaticamente considerando dependências lógicas (Predecessoras). 
              Exemplo: A pintura só inicia após o término do gesso e revestimentos. O prazo real pode variar conforme tamanho da equipe e imprevistos.
           </div>
        </Card>
      </div>
    );
  };

  const MeetingView = () => (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-8 space-y-8 border-l-4 border-blue-500">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-blue-700">
            <Users size={32} />
            <h2 className="text-2xl font-bold">Diretrizes para Melhor Aproveitamento</h2>
          </div>
          <p className="text-slate-600 text-lg leading-relaxed">
            Para garantir que o orçamento gerado seja o mais realista possível, siga o fluxo de trabalho sugerido abaixo antes de aprofundar nos detalhes do projeto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          {/* Step 1 */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
              Validação de Preços
            </h3>
            <p className="text-slate-600 mb-4">
              O primeiro passo deve ser sempre na aba <strong>Preços</strong>.
            </p>
            <ul className="space-y-3 text-slate-700 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Valide <strong>TODOS</strong> os itens listados.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Atualize os valores (SINAPI vs Mercado) via <strong>consenso</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Preencham todos os campos.</span>
              </li>
            </ul>
            <Button onClick={() => setActiveTab('prices')} className="mt-6 w-full justify-center">
             Ir para Preços
           </Button>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Conferência de Medidas
            </h3>
            <p className="text-slate-600 mb-4">
              O segundo passo é na aba <strong>Síntese</strong>.
            </p>
            <ul className="space-y-3 text-slate-700 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Confronte as áreas calculadas com a <strong>planta baixa</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Valide a coerência das metragens de piso, parede e teto.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span><strong>Pequenas diferenças</strong> são normais (arredondamentos/vãos).</span>
              </li>
            </ul>
            <Button onClick={() => setActiveTab('synthesis')} className="mt-6 w-full justify-center">
             Ir para Síntese
           </Button>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
              Registro de Estimativas
            </h3>
            <p className="text-slate-600 mb-4">
              O terceiro passo é anotar os valores atuais no <strong>Dashboard</strong>.
            </p>
            <ul className="space-y-3 text-slate-700 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Anote: Custo Total, Materiais e Mão de Obra.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Origem: Inspeção e estimativa inicial (por Rodrigo).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Estes valores <strong>não são definitivos</strong>.</span>
              </li>
            </ul>
             <Button onClick={() => setActiveTab('dashboard')} className="mt-6 w-full justify-center">
             Ir para Dashboard
           </Button>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
              Refinamento do Escopo
            </h3>
            <p className="text-slate-600 mb-4">
              O quarto passo é detalhar o serviço na aba <strong>Ambientes</strong>.
            </p>
            <ul className="space-y-3 text-slate-700 flex-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Analise cada atividade ambiente por ambiente.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Adicione ou remova tarefas conforme necessário.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">•</span>
                <span>Observe a atualização em <strong>tempo real</strong> e confronte com o Dashboard final.</span>
              </li>
            </ul>
             <Button onClick={() => setActiveTab('rooms')} className="mt-6 w-full justify-center">
             Ir para Ambientes
           </Button>
          </div>
        </div>

        <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
             <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <span className="bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">!</span>
              Atenção Importante sobre Preços
            </h3>
            <div className="space-y-4 text-amber-900/80">
              <p>
                <strong>Não confunda Preço Unitário com Aplicação.</strong>
              </p>
              <p>
                Nesta etapa inicial de validação, não se preocupe se um determinado item (ex: "Forro de Gesso") será ou não usado na reforma.
                A definição de <strong>ONDE</strong> cada item será aplicado é feita em um terceiro momento, na aba <strong>Ambientes</strong> (Passo 4).
              </p>
              <p className="font-medium bg-white/50 p-3 rounded-lg border border-amber-200/50">
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
      <div className="space-y-6 animate-fade-in">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Custo Total Estimado</p>
                <h3 className="text-3xl font-bold text-slate-800 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.grandTotal)}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-400">Baseado em {rooms.length} ambientes</div>
          </Card>

          <Card className="p-6 border-l-4 border-emerald-500">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Materiais</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.totalMaterial)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <Calculator size={24} />
              </div>
            </div>
            <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2" 
                style={{ width: `${(calculations.totalMaterial / calculations.grandTotal) * 100}%` }}
              ></div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-amber-500">
             <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Mão de Obra</p>
                <h3 className="text-2xl font-bold text-amber-700 mt-2">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.totalLabor)}
                </h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                <Settings size={24} />
              </div>
            </div>
             <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-2" 
                style={{ width: `${(calculations.totalLabor / calculations.grandTotal) * 100}%` }}
              ></div>
            </div>
          </Card>
        </div>

        {/* Room Cost Chart (New) */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-6">Custos por Ambiente e Itens Globais</h4>
           <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mergedChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} interval={0} angle={-45} textAnchor="end" height={80} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar
                  dataKey="cost"
                  name="Custo Total"
                  radius={[4, 4, 0, 0]}
                  onClick={(data: any) => {
                    const item = data.payload || data;
                    if (!item.isFixed) handleNavigateToRoom(item.id);
                  }}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {mergedChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isFixed ? '#10b981' : '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
              <span className="text-slate-600">Ambientes (Construção)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
              <span className="text-slate-600">Custos Fixos e Globais</span>
            </div>
          </div>
        </Card>

        {/* Detailed Chart (New) */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-6">Detalhamento por Tipo (MO vs Materiais)</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calculations.detailedChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip 
                  formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Bar dataKey="Labor" name="Mão de Obra" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Material" name="Materiais" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Breakdown Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-6">Custos por Etapa Geral</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calculations.categoryBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-6">Distribuição Total</h4>
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
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Fixed Costs Breakdown */}
        <Card className="p-6 mt-6">
            <h4 className="text-lg font-semibold text-slate-800 mb-6">Detalhamento de Custos Fixos & Globais</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Item</th>
                    <th className="px-6 py-3 text-center">Quantidade</th>
                    <th className="px-6 py-3 text-right">MO Total</th>
                    <th className="px-6 py-3 text-right">Material Total</th>
                    <th className="px-6 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fixedCosts.map(fc => {
                    const totalL = fc.quantity * fc.priceLaborUnit;
                    const totalM = fc.quantity * fc.priceMaterialUnit;
                    const subtotal = totalL + totalM;
                    return (
                      <tr key={fc.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 font-medium text-slate-700">{fc.item}</td>
                        <td className="px-6 py-3 text-center text-slate-600">{fc.quantity}</td>
                        <td className="px-6 py-3 text-right text-amber-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalL)}</td>
                        <td className="px-6 py-3 text-right text-emerald-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalM)}</td>
                        <td className="px-6 py-3 text-right font-bold text-slate-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</td>
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Síntese Legendada</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 min-w-[150px]">Ambiente</th>
                  <th className="px-4 py-3 text-center">PD (m)</th>
                  <th className="px-4 py-3 text-center">Área Piso (m²)</th>
                  <th className="px-4 py-3 text-center">Par. Bruta (m²)</th>
                  <th className="px-4 py-3 text-center">Par. Útil (m²)</th>
                  <th className="px-4 py-3 text-center">Perímetro (m)</th>
                  <th className="px-4 py-3 text-right">Demolição ($)</th>
                  <th className="px-4 py-3 text-right">Refazimento ($)</th>
                  <th className="px-4 py-3 text-center">Interruptores</th>
                  <th className="px-4 py-3 text-center">Tomadas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {synthesisData.map((data) => (
                  <tr key={data.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-blue-600">
                      <button 
                        onClick={() => handleNavigateToRoom(data.id)}
                        className="hover:underline focus:outline-none text-left w-full"
                      >
                        {data.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.height.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.floorArea.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.wallAreaGross.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.wallAreaNet.toFixed(2)}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.perimeter.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(data.demoValue)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(data.refValue)}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.switchCount}</td>
                    <td className="px-4 py-3 text-center text-slate-700">{data.socketCount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-200">
                <tr>
                  <td className="px-6 py-3">TOTAL AMBIENTES</td>
                  <td className="px-4 py-3 text-center">-</td>
                  <td className="px-4 py-3 text-center">{totals.floorArea.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{totals.wallAreaGross.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{totals.wallAreaNet.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{totals.perimeter.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totals.demoValue)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(totals.refValue)}</td>
                  <td className="px-4 py-3 text-center">{totals.switchCount}</td>
                  <td className="px-4 py-3 text-center">{totals.socketCount}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
        
        <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Custos Fixos e Itens Globais</h3>
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
                    <tr>
                        <th className="px-6 py-3">Item Global</th>
                        <th className="px-6 py-3 text-center">Quantidade</th>
                        <th className="px-6 py-3 text-right">Custo Unitário Total</th>
                         <th className="px-6 py-3 text-right">Subtotal</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {fixedCosts.map(fc => {
                        const unitTotal = fc.priceLaborUnit + fc.priceMaterialUnit;
                        const subtotal = fc.quantity * unitTotal;
                        return (
                        <tr key={fc.id} className="hover:bg-slate-50">
                            <td className="px-6 py-3 font-medium text-slate-700">{fc.item}</td>
                            <td className="px-6 py-3 text-center text-slate-600">{fc.quantity}</td>
                            <td className="px-6 py-3 text-right text-slate-600">{formatCurrency(unitTotal)}</td>
                            <td className="px-6 py-3 text-right font-medium text-slate-800">{formatCurrency(subtotal)}</td>
                        </tr>
                        );
                    })}
                    </tbody>
                    <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-200">
                        <tr>
                            <td colSpan={3} className="px-6 py-3 text-right uppercase">Total Itens Globais</td>
                            <td className="px-6 py-3 text-right">{formatCurrency(totalFixedCosts)}</td>
                        </tr>
                         <tr>
                            <td colSpan={3} className="px-6 py-3 text-right uppercase text-blue-600 text-base">Custo Total da Obra (Ambientes + Globais)</td>
                            <td className="px-6 py-3 text-right text-blue-600 text-base">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Ambientes & Escopo</h2>
        <Button onClick={addRoom}>
          <Plus size={20} />
          Adicionar Ambiente
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {rooms.map((room) => {
          const { floorArea, wallAreaNet } = getRoomDimensions(room);
          const isHighlighted = highlightedRoomId === room.id;
          const roomTotal = getRoomTotalCost(room);
          
          return (
            <Card 
              key={room.id} 
              id={`room-card-${room.id}`}
              onClick={() => setHighlightedRoomId(room.id)}
              className={`overflow-hidden scroll-mt-32 transition-all duration-500 ${isHighlighted ? 'ring-4 ring-blue-500 shadow-xl scale-[1.01]' : ''}`}
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap gap-4 justify-between items-center">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-1/3 min-w-[200px]">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome do Ambiente</label>
                    <input 
                      type="text" 
                      value={room.name}
                      onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="w-32">
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Piso</label>
                     <select 
                      value={room.type}
                      onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm"
                     >
                       <option value="subsolo">Subsolo</option>
                       <option value="terreo">Térreo</option>
                       <option value="superior">Superior</option>
                     </select>
                  </div>
                  {/* Room Cost Display */}
                  <div className="flex-1 flex flex-col items-end justify-center bg-emerald-50/50 border border-emerald-100 rounded px-4 py-1 ml-4 min-w-[150px]">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total do Ambiente</span>
                      <span className="text-xl font-bold text-slate-700">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(roomTotal)}
                      </span>
                  </div>
                </div>
                <Button variant="danger" onClick={() => deleteRoom(room.id)} className="text-sm px-3 py-1">
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Dimensions */}
              <div className="p-4 bg-white grid grid-cols-2 md:grid-cols-5 gap-4 border-b border-slate-100">
                <div>
                   <label className="block text-xs text-slate-500 mb-1">Largura (m)</label>
                   <input type="number" step="0.05" value={room.width} onChange={(e) => updateRoom(room.id, 'width', parseFloat(e.target.value))} className="w-full border border-slate-200 rounded p-1 text-sm" />
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1">Comprimento (m)</label>
                   <input type="number" step="0.05" value={room.length} onChange={(e) => updateRoom(room.id, 'length', parseFloat(e.target.value))} className="w-full border border-slate-200 rounded p-1 text-sm" />
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1">Pé Direito (m)</label>
                   <input type="number" step="0.05" value={room.height} onChange={(e) => updateRoom(room.id, 'height', parseFloat(e.target.value))} className="w-full border border-slate-200 rounded p-1 text-sm" />
                </div>
                <div>
                   <label className="block text-xs text-slate-500 mb-1">Desc. Vãos (m²)</label>
                   <input type="number" step="0.01" value={room.deductionArea} onChange={(e) => updateRoom(room.id, 'deductionArea', parseFloat(e.target.value))} className="w-full border border-slate-200 rounded p-1 text-sm" />
                </div>
                <div className="flex flex-col justify-center text-xs text-slate-400 bg-slate-50 rounded px-2">
                  <span>Área Piso: {floorArea.toFixed(2)} m²</span>
                  <span>Área Parede: {wallAreaNet.toFixed(2)} m²</span>
                </div>
              </div>

              {/* Electrical Counts (New) */}
              <div className="px-4 py-2 bg-slate-50/50 grid grid-cols-2 gap-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                   <label className="text-xs text-slate-500 whitespace-nowrap w-24">Interruptores:</label>
                   <input 
                     type="number" 
                     min="0" 
                     value={room.switchCount} 
                     onChange={(e) => updateRoom(room.id, 'switchCount', parseInt(e.target.value) || 0)} 
                     className="w-20 border border-slate-200 rounded p-1 text-sm bg-white" 
                   />
                   <TaskCostDisplay room={room} taskKey="switchCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                </div>
                <div className="flex items-center gap-2">
                   <label className="text-xs text-slate-500 whitespace-nowrap w-24">Tomadas:</label>
                   <input 
                     type="number" 
                     min="0"
                     value={room.socketCount} 
                     onChange={(e) => updateRoom(room.id, 'socketCount', parseInt(e.target.value) || 0)} 
                     className="w-20 border border-slate-200 rounded p-1 text-sm bg-white" 
                   />
                   <TaskCostDisplay room={room} taskKey="socketCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                </div>
              </div>

              {/* Tasks */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Demolition Column */}
                <div>
                  <h5 className="text-sm font-bold text-red-600 mb-3 uppercase tracking-wider border-b border-red-100 pb-1">Demolição</h5>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.demo_floor} onChange={(e) => updateRoomTask(room.id, 'demo_floor', e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                      <span className="text-sm text-slate-700">Piso</span>
                      <TaskCostDisplay room={room} taskKey="demo_floor" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.demo_wall} onChange={(e) => updateRoomTask(room.id, 'demo_wall', e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                      <span className="text-sm text-slate-700">Parede</span>
                      <TaskCostDisplay room={room} taskKey="demo_wall" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-red-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.demo_ceiling} onChange={(e) => updateRoomTask(room.id, 'demo_ceiling', e.target.checked)} className="rounded text-red-600 focus:ring-red-500" />
                      <span className="text-sm text-slate-700">Teto</span>
                      <TaskCostDisplay room={room} taskKey="demo_ceiling" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                  </div>
                </div>

                {/* Refinishing Floor/Ceiling */}
                <div>
                  <h5 className="text-sm font-bold text-blue-600 mb-3 uppercase tracking-wider border-b border-blue-100 pb-1">Piso & Teto</h5>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_floor_screed} onChange={(e) => updateRoomTask(room.id, 'ref_floor_screed', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">Contrapiso</span>
                      <TaskCostDisplay room={room} taskKey="ref_floor_screed" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_floor_ceramic} onChange={(e) => updateRoomTask(room.id, 'ref_floor_ceramic', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">Cerâmica Piso</span>
                      <TaskCostDisplay room={room} taskKey="ref_floor_ceramic" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_ceiling_gypsum} onChange={(e) => updateRoomTask(room.id, 'ref_ceiling_gypsum', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">Gesso (Teto)</span>
                      <TaskCostDisplay room={room} taskKey="ref_ceiling_gypsum" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_ceiling_plaster} onChange={(e) => updateRoomTask(room.id, 'ref_ceiling_plaster', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">Reboco/Chap. (Teto)</span>
                      <TaskCostDisplay room={room} taskKey="ref_ceiling_plaster" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_ceiling_paint} onChange={(e) => updateRoomTask(room.id, 'ref_ceiling_paint', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">Pintura (Teto)</span>
                      <TaskCostDisplay room={room} taskKey="ref_ceiling_paint" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_ceiling_pvc} onChange={(e) => updateRoomTask(room.id, 'ref_ceiling_pvc', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-700">PVC (Teto)</span>
                      <TaskCostDisplay room={room} taskKey="ref_ceiling_pvc" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                  </div>
                </div>

                {/* Refinishing Wall */}
                <div>
                  <h5 className="text-sm font-bold text-orange-600 mb-3 uppercase tracking-wider border-b border-orange-100 pb-1">Paredes</h5>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_wall_plaster} onChange={(e) => updateRoomTask(room.id, 'ref_wall_plaster', e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-slate-700">Reboco</span>
                      <TaskCostDisplay room={room} taskKey="ref_wall_plaster" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_wall_ceramic} onChange={(e) => updateRoomTask(room.id, 'ref_wall_ceramic', e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-slate-700">Cerâmica Parede</span>
                      <TaskCostDisplay room={room} taskKey="ref_wall_ceramic" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-1 rounded">
                      <input type="checkbox" checked={room.tasks.ref_wall_paint} onChange={(e) => updateRoomTask(room.id, 'ref_wall_paint', e.target.checked)} className="rounded text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-slate-700">Pintura Parede</span>
                      <TaskCostDisplay room={room} taskKey="ref_wall_paint" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </label>
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Custos Unitários (R$/m²)</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Categoria</th>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3 text-right">MO (R$)</th>
                  <th className="px-6 py-3 text-right">Material (R$)</th>
                  <th className="px-6 py-3 text-right">Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unitPrices.map((price) => (
                  <tr key={price.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700">{price.category}</td>
                    <td className="px-6 py-3">{price.item}</td>
                    <td className="px-6 py-3 text-right">
                      <input 
                        type="number" 
                        value={price.priceLabor} 
                        onChange={(e) => updatePrice(price.id, 'priceLabor', parseFloat(e.target.value))}
                        className="w-24 text-right border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                       <input 
                        type="number" 
                        value={price.priceMaterial} 
                        onChange={(e) => updatePrice(price.id, 'priceMaterial', parseFloat(e.target.value))}
                        className="w-24 text-right border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-800">
                      {(price.priceLabor + price.priceMaterial).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-slate-800">Custos Fixos / Quantidades</h2>
          <Button onClick={addFixedCost}>
            <Plus size={20} />
            Adicionar Custo
          </Button>
        </div>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3 text-center">Quantidade</th>
                  <th className="px-6 py-3 text-right">MO Unit. (R$)</th>
                  <th className="px-6 py-3 text-right">Mat. Unit. (R$)</th>
                  <th className="px-6 py-3 text-right">Subtotal (R$)</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixedCosts.map((fc) => (
                  <tr key={fc.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-700">
                      <input 
                        type="text" 
                        value={fc.item} 
                        onChange={(e) => updateFixedCost(fc.id, 'item', e.target.value)}
                        className="w-full bg-transparent border-b border-transparent focus:border-blue-500 outline-none hover:border-slate-300 transition-colors"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                       <input 
                        type="number" 
                        step="0.01"
                        value={fc.quantity} 
                        onChange={(e) => updateFixedCost(fc.id, 'quantity', parseFloat(e.target.value))}
                        // Disable manual input for Switches/Sockets as they are synced
                        disabled={fc.item === 'Ponto Interruptor' || fc.item === 'Ponto Tomada'}
                        className={`w-20 text-center border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none ${fc.item === 'Ponto Interruptor' || fc.item === 'Ponto Tomada' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                       <input 
                        type="number" 
                        value={fc.priceLaborUnit} 
                        onChange={(e) => updateFixedCost(fc.id, 'priceLaborUnit', parseFloat(e.target.value))}
                        className="w-24 text-right border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                       <input 
                        type="number" 
                        value={fc.priceMaterialUnit} 
                        onChange={(e) => updateFixedCost(fc.id, 'priceMaterialUnit', parseFloat(e.target.value))}
                        className="w-24 text-right border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-right font-medium text-slate-800">
                      {(fc.quantity * (fc.priceLaborUnit + fc.priceMaterialUnit)).toFixed(2)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button 
                        onClick={() => deleteFixedCost(fc.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-500" />
            ReformaCalc
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('meeting')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'meeting' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            Sugestão para Reunião
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Home size={20} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'rooms' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calculator size={20} />
            Ambientes
          </button>
          <button 
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Calendar size={20} />
            Cronograma
          </button>
          <button 
            onClick={() => setActiveTab('synthesis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'synthesis' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <FileText size={20} />
            Síntese
          </button>
          <button 
            onClick={() => setActiveTab('prices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'prices' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <DollarSign size={20} />
            Preços
          </button>
        </nav>
        
        {/* Data Management Section in Sidebar */}
        <div className="p-4 bg-slate-800/50">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dados</h3>
          <div className="space-y-2">
            <button onClick={handleExportData} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors">
              <Download size={16} />
              Exportar
            </button>
            <button onClick={handleImportClick} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors">
              <Upload size={16} />
              Importar
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
            <button onClick={handleResetData} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors">
              <RefreshCcw size={16} />
              Resetar
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          v1.2.0 (Fix)
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-semibold text-slate-800 capitalize">
               {activeTab === 'prices' ? 'Tabela de Preços' : 
                activeTab === 'synthesis' ? 'Síntese Legendada' : 
                activeTab === 'meeting' ? 'Sugestão para Reunião' : 
                activeTab === 'schedule' ? 'Cronograma Estimado' :
                activeTab}
             </h2>
             <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-slate-500">Total Estimado</p>
                  <p className="text-lg font-bold text-blue-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculations.grandTotal)}
                  </p>
                </div>
                <button onClick={handleExportData} title="Salvar Backup" className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200">
                  <Save size={20} />
                </button>
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
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