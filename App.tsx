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
  Info,
  X,
  Edit2,
  Clock,
  Link as LinkIcon,
  Maximize2,
  ArrowUpFromLine,
  Minimize2,
  Zap,
  Plug,
  BoxSelect,
  MoreVertical,
  Map as MapIcon,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut
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
  inputCompact: "w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-2.5 py-1.5 transition-all outline-none shadow-sm font-medium",
  label: "block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide",
  labelCompact: "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1",
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

// --- Types for Schedule ---
type ScheduleOverride = {
  duration?: number;
  startDay?: number;
  dependency?: string | null; // null = no dependency
};

type Task = { 
  id: string; 
  name: string; 
  startDay: number; 
  duration: number; 
  color: string; 
  dependency?: string | null; 
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
    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
      {f(labor + material)}
    </span>
  );
};

// --- Edit Task Modal Component (Extracted) ---
interface EditTaskModalProps {
  task: Task;
  availableDeps: { id: string; name: string }[];
  onClose: () => void;
  onSave: (id: string, updates: ScheduleOverride) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, availableDeps, onClose, onSave }) => {
  // Local state for the modal form
  const [duration, setDuration] = useState(task.duration);
  const [dependency, setDependency] = useState<string | null>(task.dependency || null);
  const [startDay, setStartDay] = useState(task.startDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4 ring-1 ring-slate-900/5">
        <div className="flex justify-between items-start mb-6">
          <div>
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Edit2 size={18} className="text-blue-500" />
               Editar Atividade
             </h3>
             <p className="text-sm text-slate-500">{task.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Dependency Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
               <LinkIcon size={14} /> Dependência (Predecessora)
            </label>
            <select 
              className={STYLES.input}
              value={dependency || ''}
              onChange={(e) => {
                  const val = e.target.value === '' ? null : e.target.value;
                  setDependency(val);
                  // If switching to manual (no dep), default start day to current calculated start day
                  if (val === null) setStartDay(task.startDay);
              }}
            >
              <option value="">-- Sem Dependência (Manual) --</option>
              {availableDeps.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              A atividade iniciará automaticamente após o fim da tarefa selecionada.
            </p>
          </div>

          {/* Start Day (Only if no dependency) */}
          <div className={dependency ? 'opacity-50 pointer-events-none' : ''}>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
               <Calendar size={14} /> Dia de Início
            </label>
            <input 
              type="number" 
              min="0"
              value={startDay}
              onChange={(e) => setStartDay(Math.max(0, parseInt(e.target.value) || 0))}
              className={STYLES.input}
              disabled={!!dependency}
            />
            {dependency && <span className="text-[10px] text-blue-500">Calculado automaticamente pela dependência.</span>}
          </div>

          {/* Duration */}
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
               <Clock size={14} /> Duração (Dias)
            </label>
            <input 
              type="number" 
              min="1"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className={STYLES.input}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
          <Button variant="ghost" onClick={onClose} className="flex-1 justify-center">Cancelar</Button>
          <Button 
              onClick={() => onSave(task.id, { duration, dependency, startDay: dependency ? undefined : startDay })} 
              className="flex-1 justify-center"
          >
              Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
};

// --- Application ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'prices' | 'synthesis' | 'meeting' | 'schedule' | 'floorplan'>('dashboard');
  
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

  // Schedule Overrides State
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, ScheduleOverride>>(() => {
    try {
      const saved = localStorage.getItem('reforma_schedule_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Floor Plan Image State
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('reforma_floorplan');
    } catch {
      return null;
    }
  });

  // Modal State
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Tooltip State (Moved to Top Level to fix Hook Rule #310)
  const [scheduleTooltip, setScheduleTooltip] = useState<{ visible: boolean; x: number; y: number; content: any } | null>(null);

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

  useEffect(() => {
    localStorage.setItem('reforma_schedule_overrides', JSON.stringify(scheduleOverrides));
  }, [scheduleOverrides]);

  useEffect(() => {
    if (floorPlanImage) {
        try {
            localStorage.setItem('reforma_floorplan', floorPlanImage);
        } catch (e) {
            console.error("Erro ao salvar imagem (provavelmente muito grande):", e);
            alert("Atenção: A imagem é muito grande para salvar no navegador. Ela será perdida ao recarregar. Tente uma imagem menor.");
        }
    } else {
        localStorage.removeItem('reforma_floorplan');
    }
  }, [floorPlanImage]);

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
      scheduleOverrides,
      floorPlanImage, // Include image in backup
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
        if (data.scheduleOverrides) setScheduleOverrides(data.scheduleOverrides);
        if (data.floorPlanImage) setFloorPlanImage(data.floorPlanImage);
        
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
      setScheduleOverrides({});
      setFloorPlanImage(null);
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

  // --- Schedule Calculations (Revised with Overrides) ---
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

    fixedCosts.forEach(fc => {
      const name = fc.item.toLowerCase();
      if (name.includes('telhado')) totals.roofArea += fc.quantity;
      if (name.includes('hidráulica') || name.includes('elétrica (infra') || name.includes('impermeabilização')) totals.infraCount += 1;
      if (name.includes('portas') || name.includes('janelas')) totals.installationsCount += fc.quantity;
      if (name.includes('interruptor') || name.includes('tomada')) totals.electricalFinishCount += fc.quantity;
    });

    const RATES = {
      demo: 20, roof: 20, infra: 5, masonry: 15, gypsum: 20,
      tiling: 10, install: 2, painting: 30, elecFinish: 15
    };

    // 2. Define Base Tasks (Automatic Definitions)
    // Structure: { id, name, defaultDuration, defaultDependency }
    const baseTasksDefinition = [
      { id: 'demo', name: '1. Demolição & Retirada', qty: totals.demoArea, rate: RATES.demo, defaultDep: null, color: 'bg-rose-500' },
      { id: 'roof', name: '2. Telhado & Estrutura', qty: totals.roofArea, rate: RATES.roof, defaultDep: 'demo', color: 'bg-slate-600' },
      { id: 'infra', name: '3. Infra (Elét/Hidr/Imper)', qty: totals.infraCount * 5, rate: 1, defaultDep: 'demo', color: 'bg-blue-500' }, // hacky rate adjust
      { id: 'masonry', name: '4. Reboco e Contrapiso', qty: totals.masonryArea, rate: RATES.masonry, defaultDep: 'infra', color: 'bg-orange-500' },
      { id: 'gypsum', name: '5. Forros (Gesso/PVC)', qty: totals.gypsumArea, rate: RATES.gypsum, defaultDep: 'masonry', color: 'bg-indigo-400' },
      { id: 'tiling', name: '6. Revestimentos (Piso/Par)', qty: totals.tilingArea, rate: RATES.tiling, defaultDep: 'masonry', color: 'bg-emerald-500' },
      { id: 'install', name: '7. Esquadrias e Portas', qty: totals.installationsCount, rate: RATES.install, defaultDep: 'masonry', color: 'bg-yellow-600' },
      { id: 'painting', name: '8. Pintura Geral', qty: totals.paintingArea, rate: RATES.painting, defaultDep: 'tiling', color: 'bg-cyan-500' },
      { id: 'finish', name: '9. Acabamentos Finais', qty: totals.electricalFinishCount, rate: RATES.elecFinish, defaultDep: 'painting', color: 'bg-violet-500' },
    ];

    // 3. Build Final Task List combining Auto + Overrides
    const activeTasksMap = new Map<string, Task>();

    // First pass: Instantiate objects with duration overrides
    baseTasksDefinition.forEach(def => {
      // Logic to determine if task exists: Quantity > 0 OR user manually set a duration > 0 (even if qty is 0, user might want to add it manually)
      const override = scheduleOverrides[def.id];
      const autoDuration = Math.ceil(def.qty / def.rate);
      
      // If auto duration is 0 and no override duration, skip it.
      if (autoDuration <= 0 && !override?.duration) return;

      const finalDuration = override?.duration !== undefined ? override.duration : Math.max(1, autoDuration); // Min 1 day if active
      
      // Determine Dependency
      // If override.dependency is null -> No dependency
      // If override.dependency is undefined -> Use defaultDep
      // If override.dependency is string -> Use string
      let finalDep = def.defaultDep;
      if (override && override.dependency !== undefined) {
         finalDep = override.dependency;
      }

      activeTasksMap.set(def.id, {
        id: def.id,
        name: def.name,
        duration: finalDuration,
        startDay: 0, // Calculated next
        color: def.color,
        dependency: finalDep
      });
    });

    // 4. Resolve Dates (Topological/Recursive resolve)
    // Helper to prevent infinite loops
    const resolveStartDay = (taskId: string, visited: Set<string>): number => {
       if (visited.has(taskId)) return 0; // Cycle detected, fallback
       visited.add(taskId);

       const task = activeTasksMap.get(taskId);
       if (!task) return 0;

       // If manual start day is set and NO dependency (or dep is explicitly null in override logic)
       const override = scheduleOverrides[taskId];
       // Check if dependency is effectively null (either overridden to null, or default was null and not overridden)
       const isDepNull = task.dependency === null;
       
       if (isDepNull) {
          return override?.startDay || 0;
       }

       // Has dependency
       if (task.dependency) {
         const parentId = task.dependency;
         const parent = activeTasksMap.get(parentId);
         if (parent) {
           return resolveStartDay(parentId, new Set(visited)) + parent.duration;
         }
         // If parent is not active, treat as no dependency
         return override?.startDay || 0;
       }
       
       return 0;
    };

    // Calculate start day for all
    const finalTasks: Task[] = [];
    activeTasksMap.forEach(task => {
       task.startDay = resolveStartDay(task.id, new Set());
       finalTasks.push(task);
    });

    // Sort by start day for visualization
    finalTasks.sort((a, b) => a.startDay - b.startDay);

    const maxDay = Math.max(...finalTasks.map(t => t.startDay + t.duration), 0);
    const totalDays = maxDay > 0 ? maxDay + 2 : 0; 

    return { tasks: finalTasks, totalDays };
  }, [rooms, fixedCosts, scheduleOverrides]);

  // --- Actions for Schedule Editing ---

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
  };

  const saveTaskChanges = (taskId: string, updates: ScheduleOverride) => {
    setScheduleOverrides(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...updates
      }
    }));
    setEditingTask(null);
  };

  const getAvailableDependencies = (currentTaskId: string) => {
    return scheduleData.tasks
      .filter(t => t.id !== currentTaskId) // Can't depend on self
      .map(t => ({ id: t.id, name: t.name }));
  };

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

  // NOTE: EditTaskModal moved outside App to prevent re-creation on every render

  const ScheduleView = () => {
    // Uses data lifted to App level to avoid conditional hooks
    const { tasks, totalDays } = scheduleData;
    // NOTE: Tooltip state removed from here to fix Hook error #310

    return (
      <div className="space-y-6 animate-fade-in pb-12" key={activeTab}>
        {/* Modal rendered by parent conditionally */}
        
        <Card className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Cronograma Estimado</h2>
              <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
                Este cronograma é uma projeção baseada nas quantidades levantadas. <br/>
                <span className="text-blue-600 font-medium">Clique nas barras para editar a duração ou mudar as dependências.</span>
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
                        <div className="w-64 flex-shrink-0 p-4 text-sm font-medium text-slate-700 border-r border-slate-200 bg-white group-hover:bg-slate-50 sticky left-0 z-10 truncate flex items-center gap-2" title={task.name}>
                          {task.name}
                          {/* Indicator if modified */}
                          {scheduleOverrides[task.id] && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="Modificado manualmente"></div>}
                        </div>
                        <div className="flex-1 relative h-14 my-auto">
                            {/* Grid Lines */}
                            {totalDays > 0 && Array.from({ length: Math.ceil(totalDays / 5) }).map((_, i) => (
                              <div key={i} className="absolute h-full border-r border-slate-100 border-dashed" style={{ left: `${((i * 5) / totalDays) * 100}%` }}></div>
                            ))}
                            
                            {/* Bar */}
                            <button 
                              onClick={() => handleTaskClick(task)}
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setScheduleTooltip({
                                    visible: true,
                                    x: rect.left + (rect.width / 2),
                                    y: rect.top,
                                    content: { name: task.name, duration: task.duration, start: task.startDay, end: task.startDay + task.duration }
                                });
                              }}
                              onMouseLeave={() => setScheduleTooltip(null)}
                              className={`absolute top-3 h-8 rounded-lg shadow-sm ${task.color} opacity-90 hover:opacity-100 transition-all flex items-center px-3 ring-1 ring-black/5 hover:scale-[1.01] hover:ring-2 hover:ring-blue-400 cursor-pointer origin-left z-10`}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            >
                              <span className="text-[10px] text-white font-bold drop-shadow-sm whitespace-nowrap overflow-hidden">
                                {task.duration}d
                              </span>
                            </button>
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
                O cronograma é gerado automaticamente com base em predecessoras padrão. 
                Ao alterar uma dependência, todas as datas subsequentes serão recalculadas automaticamente.
              </div>
           </div>
        </Card>

        {/* Custom Floating Tooltip Portal */}
        {scheduleTooltip && (
            <div 
                className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-2 animate-fade-in"
                style={{ left: scheduleTooltip.x, top: scheduleTooltip.y }}
            >
                <div className="bg-slate-900 text-white text-xs rounded-lg py-2 px-3 shadow-xl flex flex-col gap-1 min-w-[120px]">
                    <span className="font-bold border-b border-slate-700 pb-1 mb-1">{scheduleTooltip.content.name}</span>
                    <div className="flex justify-between gap-4 text-slate-300">
                        <span>Duração:</span>
                        <span className="text-white font-mono">{scheduleTooltip.content.duration} dias</span>
                    </div>
                    <div className="flex justify-between gap-4 text-slate-300">
                        <span>Início:</span>
                        <span className="text-white font-mono">Dia {scheduleTooltip.content.start + 1}</span>
                    </div>
                     <div className="flex justify-between gap-4 text-slate-300">
                        <span>Fim:</span>
                        <span className="text-white font-mono">Dia {scheduleTooltip.content.end}</span>
                    </div>
                    <div className="text-[10px] text-blue-400 mt-1 italic text-center">Clique para editar</div>
                    {/* Arrow */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-slate-900 rotate-45"></div>
                </div>
            </div>
        )}
      </div>
    );
  };

  const FloorPlanView = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [scale, setScale] = useState(1);

    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check size (e.g. limit to 4MB for localStorage safety)
        if (file.size > 4 * 1024 * 1024) {
            alert("A imagem é muito grande (>4MB). Por favor, use uma imagem menor para garantir que ela seja salva.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setFloorPlanImage(result);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12" key={activeTab}>
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Planta Baixa de Referência</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Armazene a imagem do projeto aqui para consulta rápida durante o orçamento.
                    </p>
                </div>
                {floorPlanImage && (
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
                            <ZoomOut size={18} />
                        </Button>
                        <Button variant="secondary" onClick={() => setScale(s => Math.min(3, s + 0.1))}>
                            <ZoomIn size={18} />
                        </Button>
                        <Button variant="danger" onClick={() => setFloorPlanImage(null)}>
                            <Trash2 size={18} /> Remover
                        </Button>
                    </div>
                )}
            </div>

            <Card className="p-0 min-h-[600px] flex items-center justify-center bg-slate-100 overflow-hidden relative border border-slate-200">
                {!floorPlanImage ? (
                    <div className="text-center p-12">
                        <div className="bg-white p-6 rounded-full inline-flex mb-6 shadow-sm">
                            <ImageIcon size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhuma planta cadastrada</h3>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">
                            Faça o upload da imagem da planta baixa (JPG, PNG) para tê-la sempre à mão enquanto edita os ambientes.
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()} className="mx-auto">
                            <Upload size={20} /> Carregar Planta Baixa
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                    </div>
                ) : (
                    <div className="overflow-auto w-full h-full p-4 flex items-start justify-center cursor-move" style={{ maxHeight: '80vh' }}>
                        <img 
                            src={floorPlanImage} 
                            alt="Planta Baixa" 
                            className="transition-transform duration-200 origin-top shadow-xl rounded-lg bg-white"
                            style={{ transform: `scale(${scale})` }}
                        />
                    </div>
                )}
            </Card>
            
            {floorPlanImage && (
                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-center gap-3 border border-blue-100">
                    <Info size={20} />
                    <span>Esta imagem está salva no seu navegador e será incluída no backup de dados.</span>
                </div>
            )}
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rooms.map((room) => {
          const { floorArea, wallAreaNet } = getRoomDimensions(room);
          const isHighlighted = highlightedRoomId === room.id;
          const roomTotal = getRoomTotalCost(room);
          
          return (
            <Card 
              key={room.id} 
              id={`room-card-${room.id}`}
              onClick={() => setHighlightedRoomId(room.id)}
              className={`overflow-hidden scroll-mt-48 transition-all duration-500 hover:shadow-lg border border-transparent hover:border-slate-200 ${isHighlighted ? 'ring-2 ring-blue-500 shadow-xl scale-[1.01]' : ''}`}
            >
              {/* Compact Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-white">
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <input 
                        type="text" 
                        value={room.name}
                        onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                        className="bg-transparent font-bold text-slate-800 text-base focus:bg-white focus:ring-2 focus:ring-blue-100 rounded px-1.5 py-0.5 -ml-1.5 w-full sm:w-auto min-w-[150px] transition-all"
                        placeholder="Nome do Ambiente"
                    />
                     <select 
                      value={room.type}
                      onChange={(e) => updateRoom(room.id, 'type', e.target.value)}
                      className="bg-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-wider rounded-md px-2 py-1 border-none focus:ring-0 cursor-pointer hover:bg-slate-200 w-fit"
                     >
                       <option value="subsolo">Subsolo</option>
                       <option value="terreo">Térreo</option>
                       <option value="superior">Superior</option>
                     </select>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="text-right bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100/50">
                        <span className="block text-[9px] text-emerald-600/70 font-bold uppercase tracking-widest">Custo Est.</span>
                        <span className="text-sm font-black text-emerald-600 leading-none">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(roomTotal)}
                        </span>
                     </div>
                     <button onClick={() => deleteRoom(room.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} />
                     </button>
                  </div>
              </div>

              {/* Symmetrical Dimensions Grid */}
              <div className="p-5 border-b border-slate-100">
                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {/* Field 1: Largura */}
                    <div>
                        <label className={STYLES.labelCompact}>Largura</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.05" 
                                value={room.width} 
                                onChange={(e) => updateRoom(room.id, 'width', parseFloat(e.target.value))} 
                                className={STYLES.inputCompact}
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium pointer-events-none">m</span>
                        </div>
                    </div>
                    
                    {/* Field 2: Comprimento */}
                    <div>
                        <label className={STYLES.labelCompact}>Comprimento</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.05" 
                                value={room.length} 
                                onChange={(e) => updateRoom(room.id, 'length', parseFloat(e.target.value))} 
                                className={STYLES.inputCompact}
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium pointer-events-none">m</span>
                        </div>
                    </div>

                    {/* Field 3: Pé Direito */}
                    <div>
                        <label className={STYLES.labelCompact}>Pé Direito</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.05" 
                                value={room.height} 
                                onChange={(e) => updateRoom(room.id, 'height', parseFloat(e.target.value))} 
                                className={STYLES.inputCompact}
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium pointer-events-none">m</span>
                        </div>
                    </div>

                    {/* Field 4: Vãos */}
                    <div>
                        <label className={STYLES.labelCompact}>Desc. Vãos</label>
                        <div className="relative">
                            <input 
                                type="number" step="0.01" 
                                value={room.deductionArea} 
                                onChange={(e) => updateRoom(room.id, 'deductionArea', parseFloat(e.target.value))} 
                                className={`${STYLES.inputCompact} text-slate-500`}
                            />
                            <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium pointer-events-none">m²</span>
                        </div>
                    </div>

                    {/* Field 5: Interruptores */}
                    <div className="relative group">
                        <label className={`${STYLES.labelCompact} flex items-center gap-1 text-yellow-600/80`}>
                            <Zap size={10} className="fill-yellow-500 text-yellow-500" /> Interruptores
                        </label>
                        <input 
                            type="number" min="0" 
                            value={room.switchCount} 
                            onChange={(e) => updateRoom(room.id, 'switchCount', parseInt(e.target.value) || 0)} 
                            className={`${STYLES.inputCompact} border-yellow-200 focus:border-yellow-400 focus:ring-yellow-100`}
                        />
                        <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                             <TaskCostDisplay room={room} taskKey="switchCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </div>
                    </div>

                    {/* Field 6: Tomadas */}
                    <div className="relative group">
                        <label className={`${STYLES.labelCompact} flex items-center gap-1 text-yellow-600/80`}>
                            <Plug size={10} className="text-yellow-600" /> Tomadas
                        </label>
                        <input 
                            type="number" min="0" 
                            value={room.socketCount} 
                            onChange={(e) => updateRoom(room.id, 'socketCount', parseInt(e.target.value) || 0)} 
                            className={`${STYLES.inputCompact} border-yellow-200 focus:border-yellow-400 focus:ring-yellow-100`}
                        />
                        <div className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                             <TaskCostDisplay room={room} taskKey="socketCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </div>
                    </div>
                 </div>

                 {/* Calculated Areas Footer */}
                 <div className="mt-4 pt-3 border-t border-dashed border-slate-100 flex items-center justify-end gap-6 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5" title="Área de Piso = Largura x Comprimento">
                        <BoxSelect size={12} className="text-slate-300" />
                        <span>Piso: <strong className="text-slate-600">{floorArea.toFixed(2)} m²</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Área de Parede = (Perímetro x Altura) - Vãos">
                        <Maximize2 size={12} className="text-slate-300" />
                        <span>Parede: <strong className="text-slate-600">{wallAreaNet.toFixed(2)} m²</strong></span>
                    </div>
                 </div>
              </div>

              {/* Task Groups */}
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
                
                {/* Group: Demolition */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
                  <h5 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1 px-1">
                    Demolição
                  </h5>
                  <div className="space-y-2">
                    {[
                        { key: 'demo_floor', label: 'Piso' },
                        { key: 'demo_wall', label: 'Parede' },
                        { key: 'demo_ceiling', label: 'Teto' }
                    ].map(task => (
                        <label key={task.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-rose-300 cursor-pointer transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-rose-500 checked:border-rose-500 transition-colors cursor-pointer" />
                                    <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-rose-600 transition-colors">{task.label}</span>
                            </div>
                            <TaskCostDisplay room={room} taskKey={task.key} unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </label>
                    ))}
                  </div>
                </div>

                {/* Group: Floor/Ceiling */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
                  <h5 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 px-1">
                    Piso & Teto
                  </h5>
                  <div className="space-y-2">
                    {[
                        { key: 'ref_floor_screed', label: 'Contrapiso' },
                        { key: 'ref_floor_ceramic', label: 'Cerâmica' },
                        { key: 'ref_ceiling_gypsum', label: 'Gesso' },
                        { key: 'ref_ceiling_plaster', label: 'Reboco Teto' },
                        { key: 'ref_ceiling_paint', label: 'Pintura Teto' },
                        { key: 'ref_ceiling_pvc', label: 'Forro PVC' },
                    ].map((task) => (
                        <label key={task.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 cursor-pointer transition-all group">
                             <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer" />
                                    <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-blue-600 transition-colors truncate max-w-[80px]">{task.label}</span>
                            </div>
                            <TaskCostDisplay room={room} taskKey={task.key} unitPrices={unitPrices} fixedCosts={fixedCosts} />
                        </label>
                    ))}
                  </div>
                </div>

                {/* Group: Walls */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
                  <h5 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1 px-1">
                    Paredes
                  </h5>
                  <div className="space-y-2">
                     {[
                        { key: 'ref_wall_plaster', label: 'Reboco' },
                        { key: 'ref_wall_ceramic', label: 'Cerâmica' },
                        { key: 'ref_wall_paint', label: 'Pintura' },
                    ].map(task => (
                        <label key={task.key} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-orange-300 cursor-pointer transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" checked={room.tasks[task.key as keyof typeof room.tasks]} onChange={(e) => updateRoomTask(room.id, task.key as keyof Room['tasks'], e.target.checked)} 
                                    className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-orange-500 checked:border-orange-500 transition-colors cursor-pointer" />
                                    <svg className="absolute w-2.5 h-2.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <span className="text-xs font-medium text-slate-600 group-hover:text-orange-600 transition-colors">{task.label}</span>
                            </div>
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

  const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon size={20} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
      <span className="hidden lg:inline font-medium text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
        <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-50 transition-all duration-300">
            {/* Header */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Home className="text-white" size={24} />
                </div>
                <span className="ml-3 font-bold text-white text-lg hidden lg:block tracking-tight">Reforma<span className="text-blue-500">Calc</span></span>
            </div>

            {/* Nav */}
            <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavItem icon={BoxSelect} label="Ambientes" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
                <NavItem icon={DollarSign} label="Custos" active={activeTab === 'prices'} onClick={() => setActiveTab('prices')} />
                <NavItem icon={Calendar} label="Cronograma" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                <NavItem icon={MapIcon} label="Planta Baixa" active={activeTab === 'floorplan'} onClick={() => setActiveTab('floorplan')} />
                <NavItem icon={FileText} label="Síntese" active={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} />
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 space-y-2">
                <button onClick={handleExportData} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white" title="Exportar Backup">
                    <Download size={20} />
                    <span className="hidden lg:inline text-sm font-medium">Backup</span>
                </button>
                <button onClick={handleImportClick} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white" title="Importar Backup">
                    <Upload size={20} />
                    <span className="hidden lg:inline text-sm font-medium">Restaurar</span>
                </button>
                <button onClick={handleResetData} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors" title="Resetar Dados">
                    <RefreshCcw size={20} />
                    <span className="hidden lg:inline text-sm font-medium">Resetar</span>
                </button>
            </div>
        </aside>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

        <main className="flex-1 ml-20 lg:ml-64 p-4 md:p-8 overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'rooms' && <RoomsView />}
                {activeTab === 'prices' && <PricesView />}
                {activeTab === 'schedule' && <ScheduleView />}
                {activeTab === 'synthesis' && <SynthesisView />}
                {activeTab === 'floorplan' && <FloorPlanView />}
            </div>
        </main>

        {editingTask && (
            <EditTaskModal 
                task={editingTask} 
                availableDeps={getAvailableDependencies(editingTask.id)} 
                onClose={() => setEditingTask(null)} 
                onSave={saveTaskChanges} 
            />
        )}
    </div>
  );
}