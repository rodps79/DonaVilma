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
  ChevronDown,
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
  ZoomOut,
  Droplets,
  Hammer,
  PaintBucket,
  Layers,
  Umbrella,
  DoorOpen,
  Grid,
  TrendingDown,
  AlertTriangle,
  PieChart as PieChartIcon,
  Target,
  BarChart4,
  Activity,
  Printer
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
  Cell,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  AreaChart,
  Area
} from 'recharts';
import { INITIAL_ROOMS, INITIAL_PRICES, INITIAL_FIXED_COSTS } from './constants';
import { Room, UnitPrice, FixedCost, Task, ScheduleOverride } from './types';

// --- Styles Constants ---
const STYLES = {
  input: "w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-2.5 transition-all outline-none hover:bg-white print:hidden",
  inputSmall: "bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-1.5 transition-all outline-none text-center print:border-none print:bg-transparent print:p-0 print:text-right",
  inputCompact: "w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 transition-all outline-none shadow-sm font-medium h-7",
  label: "block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide",
  labelCompact: "block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5",
  card: "bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-slate-900/5",
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
  
  return { floorArea, perimeter, wallAreaNet, wallAreaGross, ceilingArea };
};

// --- Helper Components ---

interface SmartNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onValueChange: (val: number) => void;
  allowDecimals?: boolean;
}

const SmartNumberInput: React.FC<SmartNumberInputProps> = ({ value, onValueChange, allowDecimals = true, className, ...props }) => {
  const [localStr, setLocalStr] = useState(value?.toString() ?? '');

  useEffect(() => {
    const parsedLocal = parseFloat(localStr);
    if (value !== parsedLocal) {
        setLocalStr(value?.toString() ?? '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalStr(newVal);

    if (newVal === '') {
      onValueChange(0);
      return;
    }

    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) {
      onValueChange(parsed);
    }
  };

  return (
    <input
      type="number"
      value={localStr}
      onChange={handleChange}
      step={allowDecimals ? "0.01" : "1"}
      className={className}
      {...props}
    />
  );
};

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
  const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-sm print:hidden";
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

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-all duration-200 group ${
      active 
        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`}
  >
    <Icon size={20} className={active ? "text-white" : "text-slate-500 group-hover:text-white transition-colors"} />
    <span className={`hidden lg:inline text-sm font-medium ${active ? "text-white" : "text-slate-400 group-hover:text-white"}`}>{label}</span>
  </button>
);

const TaskToggle = ({ label, active, onClick, cost, color }: any) => {
   const colors: any = {
      rose: active ? 'bg-rose-100 text-rose-700 border-rose-200' : 'hover:bg-rose-50',
      orange: active ? 'bg-orange-100 text-orange-700 border-orange-200' : 'hover:bg-orange-50',
      emerald: active ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'hover:bg-emerald-50',
      cyan: active ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'hover:bg-cyan-50',
      indigo: active ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'hover:bg-indigo-50',
   };
   
   // Default style if color not provided
   const baseClass = `px-2 py-1 rounded border transition-all duration-200 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-2`;
   const activeClass = active ? (color ? colors[color] : 'bg-blue-50 border-blue-200 text-blue-700') : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300';

   return (
      <button 
         onClick={onClick}
         className={`${baseClass} ${activeClass}`}
      >
         {label}
         {cost && <div className="ml-1 opacity-100">{cost}</div>}
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
  
  let price: UnitPrice | FixedCost | undefined = unitPrices.find(p => p.applyTo === taskKey);
  let isFixed = false;

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
    const taskKeyTyped = taskKey as keyof Room['tasks'];
    if (!room.tasks[taskKeyTyped]) return null;
    
    if (taskKey.includes('floor')) quantity = floorArea;
    else if (taskKey.includes('wall')) quantity = wallAreaNet;
    else if (taskKey.includes('ceiling')) quantity = ceilingArea;
  }

  if (quantity <= 0) return null;

  const pLabor = isFixed ? (price as FixedCost).priceLaborUnit : (price as UnitPrice).priceLabor;
  const pMaterial = isFixed ? (price as FixedCost).priceMaterialUnit : (price as UnitPrice).priceMaterial;

  const labor = quantity * pLabor;
  const material = quantity * pMaterial;
  
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <span className="text-[9px] font-bold bg-white/50 px-1 rounded">
      {f(labor + material)}
    </span>
  );
};

// --- View Components ---

const DashboardView = ({ calculations, rooms, handleNavigateToRoom, scheduleData }: any) => {
  const { 
    totalLabor, totalMaterial, grandTotal, disciplineData, 
    totalArea, costPerSqm, roomCostData, contingency, 
    typeBreakdown, economySimulation 
  } = calculations;

  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Colors for disciplines
  const DISCIPLINE_COLORS: Record<string, string> = {
    'Demolição': '#ef4444',
    'Alvenaria / Refazimento': '#f97316',
    'Reboco & Chapisco': '#eab308',
    'Piso e Revestimento': '#10b981',
    'Pintura': '#06b6d4',
    'Elétrica': '#3b82f6',
    'Hidráulica': '#6366f1',
    'Cobertura / Telhado': '#8b5cf6',
    'Impermeabilização': '#d946ef',
    'Itens Globais': '#64748b'
  };

  // Generate Cash Flow Data
  const cashFlowData = useMemo(() => {
     const tasks = scheduleData.tasks;
     const timeline: any[] = [];
     const maxDay = scheduleData.totalDays;
     
     // Initialize timeline
     for (let i = 0; i <= maxDay; i++) {
        timeline.push({ day: i, cost: 0, accumulated: 0 });
     }

     // Map Disciplines to Task IDs roughly for cost distribution
     const disciplineToTaskMap: Record<string, string> = {
        'Demolição': 'demo',
        'Cobertura / Telhado': 'roof',
        'Elétrica': 'infra',
        'Hidráulica': 'infra',
        'Impermeabilização': 'infra',
        'Alvenaria / Refazimento': 'masonry',
        'Reboco & Chapisco': 'masonry',
        'Piso e Revestimento': 'tiling',
        'Itens Globais': 'install',
        'Pintura': 'painting',
     };

     // Distribute Discipline Costs over Task Durations
     disciplineData.forEach((disc: any) => {
        const taskId = disciplineToTaskMap[disc.name] || 'finish'; // Default to finish if not mapped
        const task = tasks.find((t: any) => t.id === taskId);
        
        if (task && task.duration > 0) {
           const dailyCost = disc.value / task.duration;
           for (let d = 0; d < task.duration; d++) {
              const dayIndex = task.startDay + d;
              if (timeline[dayIndex]) {
                 timeline[dayIndex].cost += dailyCost;
              }
           }
        }
     });

     // Accumulate
     let acc = 0;
     timeline.forEach(point => {
        acc += point.cost;
        point.accumulated = acc;
     });

     return timeline.filter((_, i) => i % 5 === 0); // Sample every 5 days for cleaner chart
  }, [disciplineData, scheduleData]);

  const criticalItems = [
     { name: 'Impermeabilização', risk: 'Alto', reason: 'Infiltrações futuras' },
     { name: 'Elétrica', risk: 'Alto', reason: 'Risco de incêndio/curto' },
     { name: 'Hidráulica', risk: 'Médio', reason: 'Vazamentos e quebra-quebra' },
     { name: 'Telhado', risk: 'Alto', reason: 'Proteção da estrutura' },
     { name: 'Estrutura/Alvenaria', risk: 'Alto', reason: 'Estabilidade' }
  ];

  const DisciplineRow = ({ item, f, DISCIPLINE_COLORS, grandTotal }: any) => {
      // Auto-expand global items or if it contains drywall
      const [isOpen, setIsOpen] = useState(
         item.name === 'Itens Globais' || 
         item.items.some((sub: any) => sub.name.toLowerCase().includes('drywall'))
      );

      return (
         <React.Fragment>
            <tr className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
               <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                     {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                     <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: DISCIPLINE_COLORS[item.name] || '#94a3b8' }}></div>
                     <span className="font-medium text-slate-700 truncate max-w-[100px]">{item.name}</span>
                  </div>
               </td>
               <td className="py-2 px-3 text-right font-bold text-slate-700">
                  {f(item.value)}
               </td>
               <td className="py-2 px-3 text-right text-slate-400">
                  {((item.value / grandTotal) * 100).toFixed(1)}%
               </td>
            </tr>
            {isOpen && item.items.map((sub: any) => (
               <tr key={sub.name} className="bg-slate-50/50 border-b border-slate-50">
                  <td className="py-1 px-3 pl-10">
                     <span className="text-[11px] text-slate-500">{sub.name}</span>
                  </td>
                  <td className="py-1 px-3 text-right text-[11px] font-medium text-slate-600">
                     {f(sub.value)}
                  </td>
                  <td className="py-1 px-3 text-right text-[10px] text-slate-400">
                     {((sub.value / item.value) * 100).toFixed(0)}%
                  </td>
               </tr>
            ))}
         </React.Fragment>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
        
        {/* Header Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-l-4 border-blue-600 bg-gradient-to-br from-white to-blue-50/50">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Custo Total</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{f(grandTotal)}</h3>
                  <div className="mt-2 text-xs text-slate-400"> + {f(contingency)} (reserva)</div>
              </Card>

              <Card className="p-5 border-l-4 border-violet-600">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Custo/m²</p>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{f(costPerSqm)}</h3>
                  <div className="mt-2 text-xs text-slate-400">{totalArea.toFixed(2)}m² construídos</div>
              </Card>

              <Card className="p-5 border-l-4 border-emerald-500">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Material</p>
                  <h3 className="text-2xl font-black text-emerald-600 mt-1">{f(totalMaterial)}</h3>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${(totalMaterial / grandTotal) * 100}%` }}></div>
                  </div>
              </Card>

              <Card className="p-5 border-l-4 border-amber-500">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Mão de Obra</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">{f(totalLabor)}</h3>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${(totalLabor / grandTotal) * 100}%` }}></div>
                  </div>
              </Card>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Column (Charts) */}
            <div className="xl:col-span-2 space-y-8">
               
               {/* Cash Flow */}
               <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/> Planejamento Financeiro (Fluxo de Caixa)
                     </h4>
                     <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Acumulado por Dia</span>
                  </div>
                  <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <defs>
                              <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                 <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                           <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(d) => `Dia ${d}`} />
                           <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} tickFormatter={(v) => `R$${v/1000}k`} />
                           <Tooltip formatter={(v: number) => f(v)} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                           <Area type="monotone" dataKey="accumulated" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCost)" />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 text-center">Estimativa baseada na distribuição linear dos custos das disciplinas ao longo da duração das tarefas do cronograma.</p>
               </Card>

               {/* Room Ranking */}
               <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2">
                     <BarChart4 size={18} className="text-blue-500"/> Ranking de Custo por Ambiente
                  </h4>
                  <div className="h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roomCostData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                           <Tooltip formatter={(v: number) => f(v)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                           <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                           <Bar dataKey="material" name="Material" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={12} />
                           <Bar dataKey="labor" name="Mão de Obra" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>

            </div>

            {/* Side Column (Stats & Lists) */}
            <div className="space-y-8">
               
               {/* Distribution Donut */}
               <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                     <PieChartIcon size={18} className="text-blue-500"/> Distribuição
                  </h4>
                  <div className="h-48 w-full relative mb-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={disciplineData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                           >
                              {disciplineData.map((entry: any, index: number) => (
                                 <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'][index % 8]} />
                              ))}
                           </Pie>
                           <Tooltip formatter={(v: number) => f(v)} />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-slate-400">Por Disciplina</span>
                     </div>
                  </div>
                  <div className="p-0 overflow-hidden h-full flex flex-col">
                     <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Tabela Detalhada</h4>
                     </div>
                     <div className="overflow-y-auto flex-1 p-2 max-h-[300px] custom-scrollbar">
                        <table className="w-full text-xs">
                           <thead className="text-slate-400 font-medium text-left">
                              <tr>
                                 <th className="px-3 py-1 font-normal">Disciplina</th>
                                 <th className="px-3 py-1 font-normal text-right">Total</th>
                                 <th className="px-3 py-1 font-normal text-right">%</th>
                              </tr>
                           </thead>
                           <tbody>
                              {disciplineData.map((item: any) => (
                                 <DisciplineRow key={item.name} item={item} f={f} DISCIPLINE_COLORS={DISCIPLINE_COLORS} grandTotal={grandTotal} />
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </Card>

               {/* Critical Items Table */}
               <Card className="p-0 overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-100">
                     <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={18} className="text-rose-500"/> Itens Críticos
                     </h4>
                  </div>
                  <table className="w-full text-left text-xs">
                     <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                           <th className="px-4 py-2 font-semibold">Item</th>
                           <th className="px-4 py-2 font-semibold">Risco</th>
                           <th className="px-4 py-2 font-semibold text-right">Custo Estimado</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {criticalItems.map(item => {
                           // Find approximate cost from disciplines
                           const cost = disciplineData.find((d: any) => d.name.toLowerCase().includes(item.name.toLowerCase().split('/')[0]))?.value || 0;
                           return (
                              <tr key={item.name} className="group hover:bg-slate-50">
                                 <td className="px-4 py-3">
                                    <div className="font-bold text-slate-700">{item.name}</div>
                                    <div className="text-[10px] text-slate-400">{item.reason}</div>
                                 </td>
                                 <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.risk === 'Alto' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                       {item.risk}
                                    </span>
                                 </td>
                                 <td className="px-4 py-3 text-right font-mono text-slate-600">
                                    {f(cost)}
                                 </td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </Card>

               {/* Economy Sim */}
               <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                   <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <TrendingDown size={18}/> Potencial de Economia
                   </h4>
                   <p className="text-xs text-emerald-600 mb-4">Reduzindo 20% em acabamentos estéticos.</p>
                   <div className="flex items-end justify-between">
                      <span className="text-3xl font-black text-emerald-600">-{f(economySimulation)}</span>
                      <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                         -{((economySimulation / grandTotal) * 100).toFixed(1)}% Total
                      </span>
                   </div>
               </Card>

            </div>
        </div>
    </div>
  );
};

const RoomsView = ({ rooms, unitPrices, fixedCosts, highlightedRoomId, setHighlightedRoomId, addRoom, updateRoom, updateRoomTask, deleteRoom }: any) => {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ambientes</h2>
          <p className="text-slate-500 text-sm">Gerencie as dimensões e tarefas de cada cômodo.</p>
        </div>
        <Button onClick={addRoom}><Plus size={18} /> Novo Ambiente</Button>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rooms.map((room: Room) => (
          <Card 
            key={room.id} 
            id={`room-card-${room.id}`}
            className={`p-0 overflow-hidden transition-all duration-500 ${highlightedRoomId === room.id ? 'ring-2 ring-blue-500 shadow-xl scale-[1.01]' : ''}`}
            onClick={() => highlightedRoomId === room.id && setHighlightedRoomId(null)}
          >
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-start">
                <div className="flex-1 mr-4">
                   <label className={STYLES.labelCompact}>Nome do Ambiente</label>
                   <input 
                      type="text" 
                      value={room.name} 
                      onChange={(e) => updateRoom(room.id, 'name', e.target.value)}
                      className={`${STYLES.input} font-bold text-lg py-1 px-2 -ml-2 bg-transparent hover:bg-white border-transparent hover:border-slate-200`}
                   />
                </div>
                <button onClick={() => deleteRoom(room.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
             </div>
             
             <div className="p-4 grid grid-cols-4 gap-4 border-b border-slate-50">
                <div>
                   <label className={STYLES.labelCompact}>Largura (m)</label>
                   <SmartNumberInput value={room.width} onValueChange={(v) => updateRoom(room.id, 'width', v)} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.labelCompact}>Comp. (m)</label>
                   <SmartNumberInput value={room.length} onValueChange={(v) => updateRoom(room.id, 'length', v)} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.labelCompact}>Pé Dir. (m)</label>
                   <SmartNumberInput value={room.height} onValueChange={(v) => updateRoom(room.id, 'height', v)} className={STYLES.inputSmall} />
                </div>
                <div>
                   <label className={STYLES.labelCompact}>Desc. (m²)</label>
                   <SmartNumberInput value={room.deductionArea} onValueChange={(v) => updateRoom(room.id, 'deductionArea', v)} className={STYLES.inputSmall} />
                </div>
             </div>
             
             <div className="p-4 grid grid-cols-2 gap-4 border-b border-slate-50 bg-slate-50/30">
                 <div>
                    <label className={STYLES.labelCompact}>Interruptores</label>
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-amber-500" />
                       <SmartNumberInput value={room.switchCount} onValueChange={(v) => updateRoom(room.id, 'switchCount', v)} className={STYLES.inputSmall} allowDecimals={false} />
                       <TaskCostDisplay room={room} taskKey="switchCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </div>
                 </div>
                 <div>
                    <label className={STYLES.labelCompact}>Tomadas</label>
                    <div className="flex items-center gap-2">
                       <Plug size={14} className="text-emerald-500" />
                       <SmartNumberInput value={room.socketCount} onValueChange={(v) => updateRoom(room.id, 'socketCount', v)} className={STYLES.inputSmall} allowDecimals={false} />
                       <TaskCostDisplay room={room} taskKey="socketCount" unitPrices={unitPrices} fixedCosts={fixedCosts} />
                    </div>
                 </div>
             </div>

             <div className="p-4 space-y-4">
                {/* Tasks Grouped */}
                <div>
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Hammer size={12}/> Demolição</h5>
                   <div className="flex flex-wrap gap-2">
                      <TaskToggle label="Piso" active={room.tasks.demo_floor} onClick={() => updateRoomTask(room.id, 'demo_floor', !room.tasks.demo_floor)} cost={<TaskCostDisplay room={room} taskKey="demo_floor" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="rose" />
                      <TaskToggle label="Parede" active={room.tasks.demo_wall} onClick={() => updateRoomTask(room.id, 'demo_wall', !room.tasks.demo_wall)} cost={<TaskCostDisplay room={room} taskKey="demo_wall" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="rose" />
                      <TaskToggle label="Teto" active={room.tasks.demo_ceiling} onClick={() => updateRoomTask(room.id, 'demo_ceiling', !room.tasks.demo_ceiling)} cost={<TaskCostDisplay room={room} taskKey="demo_ceiling" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="rose" />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                       <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Grid size={12}/> Piso</h5>
                       <div className="flex flex-col gap-1.5">
                          <TaskToggle label="Contrapiso" active={room.tasks.ref_floor_screed} onClick={() => updateRoomTask(room.id, 'ref_floor_screed', !room.tasks.ref_floor_screed)} cost={<TaskCostDisplay room={room} taskKey="ref_floor_screed" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="orange" />
                          <TaskToggle label="Cerâmica" active={room.tasks.ref_floor_ceramic} onClick={() => updateRoomTask(room.id, 'ref_floor_ceramic', !room.tasks.ref_floor_ceramic)} cost={<TaskCostDisplay room={room} taskKey="ref_floor_ceramic" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="emerald" />
                       </div>
                   </div>
                   <div>
                       <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Maximize2 size={12}/> Teto</h5>
                       <div className="flex flex-col gap-1.5">
                          <TaskToggle label="Reboco" active={room.tasks.ref_ceiling_plaster} onClick={() => updateRoomTask(room.id, 'ref_ceiling_plaster', !room.tasks.ref_ceiling_plaster)} cost={<TaskCostDisplay room={room} taskKey="ref_ceiling_plaster" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="orange" />
                          <TaskToggle label="Gesso" active={room.tasks.ref_ceiling_gypsum} onClick={() => updateRoomTask(room.id, 'ref_ceiling_gypsum', !room.tasks.ref_ceiling_gypsum)} cost={<TaskCostDisplay room={room} taskKey="ref_ceiling_gypsum" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="indigo" />
                          <TaskToggle label="Forro PVC" active={room.tasks.ref_ceiling_pvc} onClick={() => updateRoomTask(room.id, 'ref_ceiling_pvc', !room.tasks.ref_ceiling_pvc)} cost={<TaskCostDisplay room={room} taskKey="ref_ceiling_pvc" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="indigo" />
                          <TaskToggle label="Pintura" active={room.tasks.ref_ceiling_paint} onClick={() => updateRoomTask(room.id, 'ref_ceiling_paint', !room.tasks.ref_ceiling_paint)} cost={<TaskCostDisplay room={room} taskKey="ref_ceiling_paint" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="cyan" />
                       </div>
                   </div>
                </div>

                <div>
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><BoxSelect size={12}/> Paredes</h5>
                   <div className="flex flex-wrap gap-2">
                      <TaskToggle label="Reboco" active={room.tasks.ref_wall_plaster} onClick={() => updateRoomTask(room.id, 'ref_wall_plaster', !room.tasks.ref_wall_plaster)} cost={<TaskCostDisplay room={room} taskKey="ref_wall_plaster" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="orange" />
                      <TaskToggle label="Cerâmica" active={room.tasks.ref_wall_ceramic} onClick={() => updateRoomTask(room.id, 'ref_wall_ceramic', !room.tasks.ref_wall_ceramic)} cost={<TaskCostDisplay room={room} taskKey="ref_wall_ceramic" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="emerald" />
                      <TaskToggle label="Pintura" active={room.tasks.ref_wall_paint} onClick={() => updateRoomTask(room.id, 'ref_wall_paint', !room.tasks.ref_wall_paint)} cost={<TaskCostDisplay room={room} taskKey="ref_wall_paint" unitPrices={unitPrices} fixedCosts={fixedCosts} />} color="cyan" />
                   </div>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PricesView = ({ unitPrices, fixedCosts, updatePrice, updateFixedCost, addFixedCost, deleteFixedCost }: any) => {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-0 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><DollarSign size={18} className="text-blue-500"/> Composições Unitárias</h3>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className={STYLES.tableHeader}>
                      <tr>
                         <th>Item</th>
                         <th>Unid.</th>
                         <th className="text-right">M. Obra (R$)</th>
                         <th className="text-right">Material (R$)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {unitPrices.map((price: UnitPrice) => (
                         <tr key={price.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">{price.item} <span className="text-[10px] text-slate-400 block font-normal">{price.category}</span></td>
                            <td className="px-4 py-3 text-slate-500 text-xs">{price.unit}</td>
                            <td className="px-4 py-3 text-right"><SmartNumberInput value={price.priceLabor} onValueChange={(v) => updatePrice(price.id, 'priceLabor', v)} className={`${STYLES.inputCompact} w-20 ml-auto`} /></td>
                            <td className="px-4 py-3 text-right"><SmartNumberInput value={price.priceMaterial} onValueChange={(v) => updatePrice(price.id, 'priceMaterial', v)} className={`${STYLES.inputCompact} w-20 ml-auto`} /></td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </Card>

          <Card className="p-0 overflow-hidden flex flex-col">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><BoxSelect size={18} className="text-purple-500"/> Custos Fixos / Quantitativos</h3>
                <Button onClick={addFixedCost} variant="secondary" className="text-xs py-1 px-2 h-8"><Plus size={14}/> Adicionar</Button>
             </div>
             <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                   <thead className={STYLES.tableHeader}>
                      <tr>
                         <th>Item</th>
                         <th className="w-20 text-center">Qtd.</th>
                         <th className="text-right">M. Obra</th>
                         <th className="text-right">Mat.</th>
                         <th className="w-8"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {fixedCosts.map((fc: FixedCost) => (
                         <tr key={fc.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2">
                               <input type="text" value={fc.item} onChange={(e) => updateFixedCost(fc.id, 'item', e.target.value)} className={`${STYLES.inputCompact} font-medium`} />
                            </td>
                            <td className="px-2 py-2">
                               <SmartNumberInput value={fc.quantity} onValueChange={(v) => updateFixedCost(fc.id, 'quantity', v)} className={`${STYLES.inputCompact} text-center`} />
                            </td>
                            <td className="px-2 py-2">
                               <SmartNumberInput value={fc.priceLaborUnit} onValueChange={(v) => updateFixedCost(fc.id, 'priceLaborUnit', v)} className={`${STYLES.inputCompact} text-right`} />
                            </td>
                            <td className="px-2 py-2">
                               <SmartNumberInput value={fc.priceMaterialUnit} onValueChange={(v) => updateFixedCost(fc.id, 'priceMaterialUnit', v)} className={`${STYLES.inputCompact} text-right`} />
                            </td>
                            <td className="px-2 py-2 text-center">
                               <button onClick={() => deleteFixedCost(fc.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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
};

const ScheduleView = ({ scheduleData, setEditingTask, scheduleTooltip, setScheduleTooltip }: any) => {
   return (
      <div className="space-y-6 animate-fade-in pb-20">
         <div className="flex justify-between items-center mb-6">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">Cronograma Físico</h2>
               <p className="text-slate-500 text-sm">Previsão de duração e sequenciamento.</p>
            </div>
            <div className="text-right">
               <div className="text-3xl font-black text-blue-600">{scheduleData.totalDays} <span className="text-sm font-medium text-slate-400">dias úteis</span></div>
               <div className="text-xs text-slate-400">Duração estimada</div>
            </div>
         </div>
         
         <Card className="p-6 overflow-x-auto">
            <div className="min-w-[800px]">
               {/* Timeline Header */}
               <div className="flex mb-4 border-b border-slate-100 pb-2">
                  <div className="w-48 flex-shrink-0 text-xs font-bold text-slate-400 uppercase">Atividade</div>
                  <div className="flex-1 relative h-6">
                     {Array.from({ length: Math.ceil(scheduleData.totalDays / 5) + 2 }).map((_, i) => (
                        <div key={i} className="absolute text-[10px] text-slate-300 border-l border-slate-100 pl-1 h-full" style={{ left: `${(i * 5 / scheduleData.totalDays) * 100}%` }}>
                           Dia {i * 5}
                        </div>
                     ))}
                  </div>
               </div>
               
               {/* Tasks */}
               <div className="space-y-3">
                  {scheduleData.tasks.map((task: Task) => (
                     <div key={task.id} className="flex items-center group">
                        <div className="w-48 flex-shrink-0 pr-4">
                           <div className="text-sm font-bold text-slate-700 truncate">{task.name}</div>
                           <div className="text-[10px] text-slate-400">{task.duration} dias • Início: D+{task.startDay}</div>
                        </div>
                        <div className="flex-1 relative h-8 bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setEditingTask(task)}>
                           <div 
                              className={`absolute top-1 bottom-1 rounded-md shadow-sm ${task.color} opacity-80 group-hover:opacity-100 transition-all flex items-center px-2`}
                              style={{ 
                                 left: `${(task.startDay / scheduleData.totalDays) * 100}%`, 
                                 width: `${Math.max((task.duration / scheduleData.totalDays) * 100, 1)}%` 
                              }}
                           >
                              <span className="text-[10px] font-bold text-white drop-shadow-md truncate">{task.duration}d</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </Card>
      </div>
   );
};

const SynthesisView = ({ rooms, unitPrices, fixedCosts }: any) => {
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const fn = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  const tableData = useMemo(() => {
    return rooms.map((room: Room) => {
      const { floorArea, perimeter, wallAreaGross, wallAreaNet } = getRoomDimensions(room);
      let demoCost = 0;
      let refazimentoCost = 0;

      // Variable Costs (Tasks)
      unitPrices.forEach((price: UnitPrice) => {
        let quantity = 0;
        // @ts-ignore
        if (room.tasks[price.applyTo]) {
           if (price.applyTo.includes('floor')) quantity = floorArea;
           else if (price.applyTo.includes('wall')) quantity = wallAreaNet;
           else if (price.applyTo.includes('ceiling')) quantity = floorArea; // Ceiling usually = floor
        }

        if (quantity > 0) {
           const total = quantity * (price.priceLabor + price.priceMaterial);
           if (price.category === 'Demolição') demoCost += total;
           else refazimentoCost += total;
        }
      });

      // Fixed Costs linked to room (Switches/Sockets)
      const switchPrice = fixedCosts.find((fc: FixedCost) => fc.item === 'Ponto Interruptor');
      const socketPrice = fixedCosts.find((fc: FixedCost) => fc.item === 'Ponto Tomada');

      if (switchPrice) {
         refazimentoCost += room.switchCount * (switchPrice.priceLaborUnit + switchPrice.priceMaterialUnit);
      }
      if (socketPrice) {
         refazimentoCost += room.socketCount * (socketPrice.priceLaborUnit + socketPrice.priceMaterialUnit);
      }

      return {
        ...room,
        floorArea,
        perimeter,
        wallAreaGross,
        wallAreaNet,
        demoCost,
        refazimentoCost
      };
    });
  }, [rooms, unitPrices, fixedCosts]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 print:pb-0 print:space-y-4">
       {/* Print specific styles to handle layout issues */}
       <style>{`
         @media print {
           @page { size: landscape; margin: 10mm; }
           body { background: white; -webkit-print-color-adjust: exact; }
           .print-hidden { display: none !important; }
           .print-visible { display: block !important; }
         }
       `}</style>

       <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <FileText className="text-blue-600 print:hidden" size={28} />
             <div>
                <h2 className="text-2xl font-bold text-slate-800">Síntese de Ambientes</h2>
                <p className="text-slate-500 text-sm print:hidden">Detalhamento quantitativo e financeiro por cômodo.</p>
             </div>
          </div>
          <Button onClick={handlePrint} variant="secondary" className="print:hidden">
            <Printer size={18}/> Imprimir / PDF
          </Button>
       </div>

       {/* Print Header */}
       <div className="hidden print:block mb-6 border-b border-slate-900 pb-4">
          <h1 className="text-3xl font-bold text-slate-900">Relatório de Custos de Reforma</h1>
          <p className="text-slate-600">Gerado em: {new Date().toLocaleDateString()}</p>
       </div>

       <Card className="p-0 overflow-hidden print:shadow-none print:border print:border-slate-300">
          <div className="overflow-x-auto print:overflow-visible">
             <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider print:bg-slate-100 print:text-slate-900">
                   <tr>
                      <th className="px-4 py-3 font-bold">Ambiente</th>
                      <th className="px-4 py-3 font-bold text-right">PD (m)</th>
                      <th className="px-4 py-3 font-bold text-right">Área Piso (m²)</th>
                      <th className="px-4 py-3 font-bold text-right">Par. Bruta (m²)</th>
                      <th className="px-4 py-3 font-bold text-right">Par. Útil (m²)</th>
                      <th className="px-4 py-3 font-bold text-right">Perímetro (m)</th>
                      <th className="px-4 py-3 font-bold text-right text-rose-600 print:text-rose-800">Demolição ($)</th>
                      <th className="px-4 py-3 font-bold text-right text-emerald-600 print:text-emerald-800">Refazimento ($)</th>
                      <th className="px-4 py-3 font-bold text-center">Interruptores</th>
                      <th className="px-4 py-3 font-bold text-center">Tomadas</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                   {tableData.map((row: any) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors print:break-inside-avoid">
                         <td className="px-4 py-3 font-bold text-blue-600 print:text-blue-800">{row.name}</td>
                         <td className="px-4 py-3 text-right text-slate-600">{fn(row.height)}</td>
                         <td className="px-4 py-3 text-right text-slate-600">{fn(row.floorArea)}</td>
                         <td className="px-4 py-3 text-right text-slate-400">{fn(row.wallAreaGross)}</td>
                         <td className="px-4 py-3 text-right font-medium text-slate-700">{fn(row.wallAreaNet)}</td>
                         <td className="px-4 py-3 text-right text-slate-400">{fn(row.perimeter)}</td>
                         <td className="px-4 py-3 text-right font-medium text-rose-600 print:text-rose-800">{f(row.demoCost)}</td>
                         <td className="px-4 py-3 text-right font-medium text-emerald-600 print:text-emerald-800">{f(row.refazimentoCost)}</td>
                         <td className="px-4 py-3 text-center text-slate-600">{row.switchCount}</td>
                         <td className="px-4 py-3 text-center text-slate-600">{row.socketCount}</td>
                      </tr>
                   ))}
                </tbody>
                <tfoot className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200 print:bg-slate-100">
                    <tr>
                        <td className="px-4 py-3">TOTAIS</td>
                        <td className="px-4 py-3 text-right">-</td>
                        <td className="px-4 py-3 text-right">{fn(tableData.reduce((a:any,b:any)=>a+b.floorArea,0))}</td>
                        <td className="px-4 py-3 text-right">-</td>
                        <td className="px-4 py-3 text-right">{fn(tableData.reduce((a:any,b:any)=>a+b.wallAreaNet,0))}</td>
                        <td className="px-4 py-3 text-right">-</td>
                        <td className="px-4 py-3 text-right text-rose-700">{f(tableData.reduce((a:any,b:any)=>a+b.demoCost,0))}</td>
                        <td className="px-4 py-3 text-right text-emerald-700">{f(tableData.reduce((a:any,b:any)=>a+b.refazimentoCost,0))}</td>
                        <td className="px-4 py-3 text-center">{tableData.reduce((a:any,b:any)=>a+b.switchCount,0)}</td>
                        <td className="px-4 py-3 text-center">{tableData.reduce((a:any,b:any)=>a+b.socketCount,0)}</td>
                    </tr>
                </tfoot>
             </table>
          </div>
       </Card>
    </div>
  );
};

const FloorPlanView = ({ floorPlanImage, setFloorPlanImage }: any) => {
   const fileInputRef = useRef<HTMLInputElement>(null);
   
   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (event) => setFloorPlanImage(event.target?.result as string);
         reader.readAsDataURL(file);
      }
   };

   return (
      <div className="space-y-6 animate-fade-in pb-20 h-[calc(100vh-100px)]">
         <div className="flex justify-between items-center">
            <div>
               <h2 className="text-2xl font-bold text-slate-800">Planta Baixa</h2>
               <p className="text-slate-500 text-sm">Visualize o projeto.</p>
            </div>
            <div className="flex gap-2">
               <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
               <Button onClick={() => fileInputRef.current?.click()} variant="secondary"><Upload size={18}/> Carregar Planta</Button>
               {floorPlanImage && <Button onClick={() => setFloorPlanImage(null)} variant="danger"><Trash2 size={18}/> Remover</Button>}
            </div>
         </div>
         
         <Card className="flex-1 h-full overflow-hidden relative flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300">
            {floorPlanImage ? (
               <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                  <img src={floorPlanImage} alt="Floor Plan" className="max-w-none shadow-2xl" />
               </div>
            ) : (
               <div className="text-center text-slate-400">
                  <MapIcon size={48} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhuma planta carregada.</p>
               </div>
            )}
         </Card>
      </div>
   );
};

const EditTaskModal = ({ task, availableDeps, onClose, onSave }: any) => {
   const [duration, setDuration] = useState(task.duration);
   const [startDay, setStartDay] = useState(task.startDay);
   const [dependency, setDependency] = useState(task.dependency || '');

   const handleSave = () => {
      onSave(task.id, { duration: Number(duration), startDay: Number(startDay), dependency: dependency || null });
   };

   return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]">
         <Card className="w-96 p-6 shadow-2xl animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Edit2 size={18}/> Editar Atividade</h3>
            <p className="text-sm text-slate-500 mb-4 font-medium">{task.name}</p>
            
            <div className="space-y-4">
               <div>
                  <label className={STYLES.label}>Duração (dias)</label>
                  <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={STYLES.input} />
               </div>
               <div>
                  <label className={STYLES.label}>Início Manual (Dia)</label>
                  <input type="number" value={startDay} onChange={(e) => setStartDay(e.target.value)} className={STYLES.input} />
                  <p className="text-[10px] text-slate-400 mt-1">Deixe 0 para automático baseado na dependência.</p>
               </div>
               <div>
                  <label className={STYLES.label}>Dependência</label>
                  <select value={dependency} onChange={(e) => setDependency(e.target.value)} className={STYLES.input}>
                     <option value="">Nenhuma</option>
                     {availableDeps.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                     ))}
                  </select>
               </div>
            </div>

            <div className="flex gap-3 mt-6">
               <Button onClick={onClose} variant="secondary" className="flex-1">Cancelar</Button>
               <Button onClick={handleSave} className="flex-1">Salvar</Button>
            </div>
         </Card>
      </div>
   );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'prices' | 'synthesis' | 'meeting' | 'schedule' | 'floorplan'>('dashboard');
  
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
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingIds = new Set(parsed.map((fc: FixedCost) => fc.id));
        const missingDefaults = INITIAL_FIXED_COSTS.filter(fc => !existingIds.has(fc.id));
        return [...parsed, ...missingDefaults];
      }
      return INITIAL_FIXED_COSTS;
    } catch {
      return INITIAL_FIXED_COSTS;
    }
  });

  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, ScheduleOverride>>(() => {
    try {
      const saved = localStorage.getItem('reforma_schedule_overrides');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(() => {
    try {
      return localStorage.getItem('reforma_floorplan');
    } catch {
      return null;
    }
  });

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [scheduleTooltip, setScheduleTooltip] = useState<{ visible: boolean; x: number; y: number; content: any } | null>(null);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('reforma_rooms', JSON.stringify(rooms)); }, [rooms]);
  useEffect(() => { localStorage.setItem('reforma_prices', JSON.stringify(unitPrices)); }, [unitPrices]);
  useEffect(() => { localStorage.setItem('reforma_costs', JSON.stringify(fixedCosts)); }, [fixedCosts]);
  useEffect(() => { localStorage.setItem('reforma_schedule_overrides', JSON.stringify(scheduleOverrides)); }, [scheduleOverrides]);
  useEffect(() => {
    if (floorPlanImage) {
        try { localStorage.setItem('reforma_floorplan', floorPlanImage); } 
        catch (e) { console.error("Erro ao salvar imagem", e); alert("Imagem muito grande para salvar."); }
    } else { localStorage.removeItem('reforma_floorplan'); }
  }, [floorPlanImage]);

  // Sync fixedCosts with constants if missing
  useEffect(() => {
    setFixedCosts(prev => {
      const existingIds = new Set(prev.map(fc => fc.id));
      const missing = INITIAL_FIXED_COSTS.filter(fc => !existingIds.has(fc.id));
      if (missing.length > 0) {
        return [...prev, ...missing];
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const totalSwitches = rooms.reduce((acc, r) => acc + (r.switchCount || 0), 0);
    const totalSockets = rooms.reduce((acc, r) => acc + (r.socketCount || 0), 0);
    setFixedCosts(prev => {
      let changed = false;
      const next = prev.map(fc => {
        if (fc.item === 'Ponto Interruptor' && fc.quantity !== totalSwitches) { changed = true; return { ...fc, quantity: totalSwitches }; }
        if (fc.item === 'Ponto Tomada' && fc.quantity !== totalSockets) { changed = true; return { ...fc, quantity: totalSockets }; }
        return fc;
      });
      return changed ? next : prev;
    });
  }, [rooms]);

  // Data Actions
  const handleExportData = () => {
    const data = { rooms, unitPrices, fixedCosts, scheduleOverrides, floorPlanImage, exportedAt: new Date().toISOString(), version: "1.0" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `reforma-backup.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleImportClick = () => fileInputRef.current?.click();
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
        alert('Importado com sucesso!');
      } catch (error) { alert('Erro ao ler arquivo.'); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };
  const handleResetData = () => {
    if (confirm('Tem certeza?')) {
      setRooms(INITIAL_ROOMS); setUnitPrices(INITIAL_PRICES); setFixedCosts(INITIAL_FIXED_COSTS); setScheduleOverrides({}); setFloorPlanImage(null);
    }
  };

  // Helper to categorize items based on the new requirements
  const getDisciplineCategory = (itemName: string, originalCategory: string): string => {
    const lowerName = itemName.toLowerCase();
    
    if (originalCategory === 'Demolição') return 'Demolição';
    if (lowerName.includes('pintura')) return 'Pintura';
    if (lowerName.includes('cerâmica') || lowerName.includes('piso') || lowerName.includes('revestimento') || lowerName.includes('porcelanato') || lowerName.includes('forro pvc')) return 'Piso e Revestimento';
    if (lowerName.includes('reboco') || lowerName.includes('chapisco')) return 'Reboco & Chapisco';
    if (lowerName.includes('contrapiso') || lowerName.includes('gesso') || lowerName.includes('parede') || lowerName.includes('alvenaria') || lowerName.includes('drywall')) return 'Alvenaria / Refazimento';
    if (lowerName.includes('elétrica') || lowerName.includes('interruptor') || lowerName.includes('tomada') || lowerName.includes('quadro')) return 'Elétrica';
    if (lowerName.includes('hidráulica') || lowerName.includes('caixa')) return 'Hidráulica';
    if (lowerName.includes('telhado') || lowerName.includes('cobertura')) return 'Cobertura / Telhado';
    if (lowerName.includes('impermeabilização')) return 'Impermeabilização';
    if (lowerName.includes('portas') || lowerName.includes('janelas') || lowerName.includes('esquadrias')) return 'Itens Globais';
    
    return 'Alvenaria / Refazimento'; // Default fallback
  };

  const getImpactCategory = (discipline: string): 'mandatory' | 'aesthetic' => {
     if (['Demolição', 'Alvenaria / Refazimento', 'Reboco & Chapisco', 'Elétrica', 'Hidráulica', 'Cobertura / Telhado', 'Impermeabilização'].includes(discipline)) {
        return 'mandatory';
     }
     return 'aesthetic';
  };

  // Calculations
  const calculations = useMemo(() => {
    let totalLabor = 0; 
    let totalMaterial = 0; 
    
    // For discipline breakdown
    const disciplineMap: Record<string, { labor: number; material: number; value: number; subItems: Record<string, number> }> = {
      'Demolição': { labor: 0, material: 0, value: 0, subItems: {} },
      'Alvenaria / Refazimento': { labor: 0, material: 0, value: 0, subItems: {} },
      'Reboco & Chapisco': { labor: 0, material: 0, value: 0, subItems: {} },
      'Piso e Revestimento': { labor: 0, material: 0, value: 0, subItems: {} },
      'Pintura': { labor: 0, material: 0, value: 0, subItems: {} },
      'Elétrica': { labor: 0, material: 0, value: 0, subItems: {} },
      'Hidráulica': { labor: 0, material: 0, value: 0, subItems: {} },
      'Cobertura / Telhado': { labor: 0, material: 0, value: 0, subItems: {} },
      'Impermeabilização': { labor: 0, material: 0, value: 0, subItems: {} },
      'Itens Globais': { labor: 0, material: 0, value: 0, subItems: {} }
    };

    // For Decision Support
    let economyPotential = 0;
    const typeBreakdown = { mandatory: 0, aesthetic: 0 };

    // For Room Breakdown
    const roomCosts: any[] = [];
    let totalFloorArea = 0;

    rooms.forEach(room => {
      const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);
      totalFloorArea += floorArea;
      let roomLabor = 0;
      let roomMaterial = 0;

      unitPrices.forEach(price => {
        let quantity = 0; 
        let isActive = false;
        
        if (price.applyTo === 'switchCount' || price.applyTo === 'socketCount') return;

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
          roomLabor += costL;
          roomMaterial += costM;

          // Categorize
          const cat = getDisciplineCategory(price.item, price.category);
          if (disciplineMap[cat]) {
            disciplineMap[cat].labor += costL;
            disciplineMap[cat].material += costM;
            disciplineMap[cat].value += total;

            const subName = price.item;
            if (!disciplineMap[cat].subItems[subName]) disciplineMap[cat].subItems[subName] = 0;
            disciplineMap[cat].subItems[subName] += total;
          }

          // Type Breakdown
          const impactType = getImpactCategory(cat);
          typeBreakdown[impactType] += total;

          // Economy Simulator (Check if it's aesthetic material)
          if (impactType === 'aesthetic') {
             // Simulate 20% savings on materials for aesthetic items
             economyPotential += (costM * 0.20);
          }
        }
      });

      roomCosts.push({
        id: room.id,
        name: room.name,
        floorArea: floorArea,
        total: roomLabor + roomMaterial,
        labor: roomLabor,
        material: roomMaterial,
        costSq: floorArea > 0 ? (roomLabor + roomMaterial) / floorArea : 0
      });
    });

    // Process Fixed Costs
    fixedCosts.forEach(fc => {
      const costL = fc.quantity * fc.priceLaborUnit; 
      const costM = fc.quantity * fc.priceMaterialUnit;
      const total = costL + costM;

      totalLabor += costL; 
      totalMaterial += costM;
      
      const cat = getDisciplineCategory(fc.item, 'Outros');
       if (disciplineMap[cat]) {
          disciplineMap[cat].labor += costL;
          disciplineMap[cat].material += costM;
          disciplineMap[cat].value += total;

          const subName = fc.item;
          if (!disciplineMap[cat].subItems[subName]) disciplineMap[cat].subItems[subName] = 0;
          disciplineMap[cat].subItems[subName] += total;
       }
       
       const impactType = getImpactCategory(cat);
       typeBreakdown[impactType] += total;
       if (impactType === 'aesthetic') {
          economyPotential += (costM * 0.20);
       }

       // Distribute switch/socket costs back to rooms for the room chart
       if (fc.item === 'Ponto Interruptor' || fc.item === 'Ponto Tomada') {
          const isSwitch = fc.item === 'Ponto Interruptor';
          const unitCost = fc.priceLaborUnit + fc.priceMaterialUnit;
          
          roomCosts.forEach(r => {
             const qty = isSwitch ? (rooms.find(rm => rm.id === r.id)?.switchCount || 0) : (rooms.find(rm => rm.id === r.id)?.socketCount || 0);
             if (qty > 0) {
                const addL = qty * fc.priceLaborUnit;
                const addM = qty * fc.priceMaterialUnit;
                r.total += addL + addM;
                r.labor += addL;
                r.material += addM;
                r.costSq = r.floorArea > 0 ? r.total / r.floorArea : 0;
             }
          });
       }
    });

    const grandTotal = totalLabor + totalMaterial;
    const disciplineDataArray = Object.entries(disciplineMap)
      .map(([name, data]) => ({ 
         name, 
         ...data, 
         items: Object.entries(data.subItems)
            .map(([k, v]) => ({ name: k, value: v }))
            .sort((a, b) => b.value - a.value)
      }))
      .sort((a, b) => b.value - a.value); // Sort by highest cost

    return { 
      totalLabor, 
      totalMaterial, 
      grandTotal, 
      disciplineData: disciplineDataArray,
      totalArea: totalFloorArea,
      costPerSqm: totalFloorArea > 0 ? grandTotal / totalFloorArea : 0,
      roomCostData: roomCosts.sort((a, b) => b.total - a.total),
      contingency: grandTotal * 0.10, // 10% contingency
      typeBreakdown,
      economySimulation: economyPotential
    };
  }, [rooms, unitPrices, fixedCosts]);

  // Schedule Logic
  const scheduleData = useMemo(() => {
    const totals = { demoArea: 0, roofArea: 0, infraCount: 0, masonryArea: 0, gypsumArea: 0, tilingArea: 0, paintingArea: 0, installationsCount: 0, electricalFinishCount: 0 };
    rooms.forEach(r => {
      const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(r);
      if (r.tasks.demo_floor) totals.demoArea += floorArea; if (r.tasks.demo_wall) totals.demoArea += wallAreaNet; if (r.tasks.demo_ceiling) totals.demoArea += ceilingArea;
      if (r.tasks.ref_floor_screed) totals.masonryArea += floorArea; if (r.tasks.ref_wall_plaster) totals.masonryArea += wallAreaNet; if (r.tasks.ref_ceiling_plaster) totals.masonryArea += ceilingArea;
      if (r.tasks.ref_ceiling_gypsum) totals.gypsumArea += ceilingArea; if (r.tasks.ref_ceiling_pvc) totals.gypsumArea += ceilingArea;
      if (r.tasks.ref_floor_ceramic) totals.tilingArea += floorArea; if (r.tasks.ref_wall_ceramic) totals.tilingArea += wallAreaNet;
      if (r.tasks.ref_wall_paint) totals.paintingArea += wallAreaNet; if (r.tasks.ref_ceiling_paint) totals.paintingArea += ceilingArea;
    });
    fixedCosts.forEach(fc => {
      const name = fc.item.toLowerCase();
      if (name.includes('telhado')) totals.roofArea += fc.quantity; if (name.includes('hidráulica') || name.includes('elétrica') || name.includes('impermeabilização')) totals.infraCount += 1;
      if (name.includes('portas') || name.includes('janelas')) totals.installationsCount += fc.quantity; if (name.includes('interruptor') || name.includes('tomada')) totals.electricalFinishCount += fc.quantity;
    });
    const RATES = { demo: 20, roof: 20, infra: 5, masonry: 15, gypsum: 20, tiling: 10, install: 2, painting: 30, elecFinish: 15 };
    const baseTasksDefinition = [
      { id: 'demo', name: '1. Demolição & Retirada', qty: totals.demoArea, rate: RATES.demo, defaultDep: null, color: 'bg-rose-500' },
      { id: 'roof', name: '2. Telhado & Estrutura', qty: totals.roofArea, rate: RATES.roof, defaultDep: 'demo', color: 'bg-slate-600' },
      { id: 'infra', name: '3. Infra (Elét/Hidr/Imper)', qty: totals.infraCount * 5, rate: 1, defaultDep: 'demo', color: 'bg-blue-500' },
      { id: 'masonry', name: '4. Reboco e Contrapiso', qty: totals.masonryArea, rate: RATES.masonry, defaultDep: 'infra', color: 'bg-orange-500' },
      { id: 'gypsum', name: '5. Forros (Gesso/PVC)', qty: totals.gypsumArea, rate: RATES.gypsum, defaultDep: 'masonry', color: 'bg-indigo-400' },
      { id: 'tiling', name: '6. Revestimentos (Piso/Par)', qty: totals.tilingArea, rate: RATES.tiling, defaultDep: 'masonry', color: 'bg-emerald-500' },
      { id: 'install', name: '7. Esquadrias e Portas', qty: totals.installationsCount, rate: RATES.install, defaultDep: 'masonry', color: 'bg-yellow-600' },
      { id: 'painting', name: '8. Pintura Geral', qty: totals.paintingArea, rate: RATES.painting, defaultDep: 'tiling', color: 'bg-cyan-500' },
      { id: 'finish', name: '9. Acabamentos Finais', qty: totals.electricalFinishCount, rate: RATES.elecFinish, defaultDep: 'painting', color: 'bg-violet-500' },
    ];
    const activeTasksMap = new Map<string, Task>();
    baseTasksDefinition.forEach(def => {
      const override = scheduleOverrides[def.id];
      const autoDuration = Math.ceil(def.qty / def.rate);
      if (autoDuration <= 0 && !override?.duration) return;
      const finalDuration = override?.duration !== undefined ? override.duration : Math.max(1, autoDuration);
      let finalDep = def.defaultDep;
      if (override && override.dependency !== undefined) finalDep = override.dependency;
      activeTasksMap.set(def.id, { id: def.id, name: def.name, duration: finalDuration, startDay: 0, color: def.color, dependency: finalDep });
    });
    const resolveStartDay = (taskId: string, visited: Set<string>): number => {
       if (visited.has(taskId)) return 0; visited.add(taskId);
       const task = activeTasksMap.get(taskId); if (!task) return 0;
       const override = scheduleOverrides[taskId]; const isDepNull = task.dependency === null;
       if (isDepNull) return override?.startDay || 0;
       if (task.dependency) { const parent = activeTasksMap.get(task.dependency); if (parent) return resolveStartDay(task.dependency, new Set(visited)) + parent.duration; return override?.startDay || 0; }
       return 0;
    };
    const finalTasks: Task[] = [];
    activeTasksMap.forEach(task => { task.startDay = resolveStartDay(task.id, new Set()); finalTasks.push(task); });
    finalTasks.sort((a, b) => a.startDay - b.startDay);
    const maxDay = Math.max(...finalTasks.map(t => t.startDay + t.duration), 0);
    return { tasks: finalTasks, totalDays: maxDay > 0 ? maxDay + 2 : 0 };
  }, [rooms, fixedCosts, scheduleOverrides]);

  const saveTaskChanges = (taskId: string, updates: ScheduleOverride) => {
    setScheduleOverrides(prev => ({ ...prev, [taskId]: { ...prev[taskId], ...updates } }));
    setEditingTask(null);
  };
  const getAvailableDependencies = (currentTaskId: string) => scheduleData.tasks.filter(t => t.id !== currentTaskId).map(t => ({ id: t.id, name: t.name }));

  const addRoom = () => {
    const newRoom: Room = { id: Math.random().toString(36).substr(2, 9), name: `Novo Ambiente ${rooms.length + 1}`, type: 'terreo', width: 3, length: 3, height: 2.6, deductionArea: 2, switchCount: 0, socketCount: 0, tasks: { demo_floor: false, demo_wall: false, demo_ceiling: false, ref_floor_ceramic: false, ref_floor_screed: false, ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true, ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: true, ref_ceiling_pvc: false } };
    setRooms([...rooms, newRoom]);
  };
  const updateRoom = (id: string, field: keyof Room, value: any) => setRooms(rooms.map(r => r.id === id ? { ...r, [field]: value } : r));
  const updateRoomTask = (id: string, task: keyof Room['tasks'], value: boolean) => setRooms(rooms.map(r => r.id === id ? { ...r, tasks: { ...r.tasks, [task]: value } } : r));
  const deleteRoom = (id: string) => setRooms(rooms.filter(r => r.id !== id));
  const updatePrice = (id: string, field: 'priceLabor' | 'priceMaterial', value: number) => setUnitPrices(unitPrices.map(p => p.id === id ? { ...p, [field]: value } : p));
  const updateFixedCost = (id: string, field: keyof FixedCost, value: any) => setFixedCosts(fixedCosts.map(fc => fc.id === id ? { ...fc, [field]: value } : fc));
  const addFixedCost = () => { const newCost: FixedCost = { id: Math.random().toString(36).substr(2, 9), item: 'Novo Item', quantity: 1, priceLaborUnit: 0, priceMaterialUnit: 0 }; setFixedCosts([...fixedCosts, newCost]); };
  const deleteFixedCost = (id: string) => setFixedCosts(fixedCosts.filter(fc => fc.id !== id));
  const handleNavigateToRoom = (roomId: string) => { setActiveTab('rooms'); setHighlightedRoomId(roomId); setTimeout(() => { const element = document.getElementById(`room-card-${roomId}`); if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100); };

  // --- Views Instantiation ---
  
  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
        <aside className="w-20 lg:w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-50 transition-all duration-300 print:hidden">
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
                <div className="bg-blue-600 p-2 rounded-lg"><Home className="text-white" size={24} /></div>
                <span className="ml-3 font-bold text-white text-lg hidden lg:block tracking-tight">Reforma<span className="text-blue-500">Calc</span></span>
            </div>
            <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
                <NavItem icon={BoxSelect} label="Ambientes" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
                <NavItem icon={DollarSign} label="Custos" active={activeTab === 'prices'} onClick={() => setActiveTab('prices')} />
                <NavItem icon={Calendar} label="Cronograma" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                <NavItem icon={MapIcon} label="Planta Baixa" active={activeTab === 'floorplan'} onClick={() => setActiveTab('floorplan')} />
                <NavItem icon={FileText} label="Síntese" active={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} />
            </nav>
            <div className="p-4 border-t border-slate-800 space-y-2">
                <button onClick={handleExportData} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white" title="Exportar"><Download size={20} /><span className="hidden lg:inline text-sm font-medium">Backup</span></button>
                <button onClick={handleImportClick} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white" title="Importar"><Upload size={20} /><span className="hidden lg:inline text-sm font-medium">Restaurar</span></button>
                <button onClick={handleResetData} className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-colors" title="Resetar"><RefreshCcw size={20} /><span className="hidden lg:inline text-sm font-medium">Resetar</span></button>
            </div>
        </aside>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
        <main className="flex-1 ml-20 lg:ml-64 p-4 md:p-8 overflow-x-hidden print:ml-0 print:p-0">
            <div className="max-w-7xl mx-auto">
                {activeTab === 'dashboard' && <DashboardView calculations={calculations} rooms={rooms} fixedCosts={fixedCosts} handleNavigateToRoom={handleNavigateToRoom} scheduleData={scheduleData} />}
                {activeTab === 'rooms' && <RoomsView rooms={rooms} unitPrices={unitPrices} fixedCosts={fixedCosts} highlightedRoomId={highlightedRoomId} setHighlightedRoomId={setHighlightedRoomId} addRoom={addRoom} updateRoom={updateRoom} updateRoomTask={updateRoomTask} deleteRoom={deleteRoom} />}
                {activeTab === 'prices' && <PricesView unitPrices={unitPrices} fixedCosts={fixedCosts} updatePrice={updatePrice} updateFixedCost={updateFixedCost} addFixedCost={addFixedCost} deleteFixedCost={deleteFixedCost} />}
                {activeTab === 'schedule' && <ScheduleView scheduleData={scheduleData} scheduleOverrides={scheduleOverrides} saveTaskChanges={saveTaskChanges} setEditingTask={setEditingTask} scheduleTooltip={scheduleTooltip} setScheduleTooltip={setScheduleTooltip} />}
                {activeTab === 'synthesis' && <SynthesisView rooms={rooms} unitPrices={unitPrices} fixedCosts={fixedCosts} handleNavigateToRoom={handleNavigateToRoom} calculations={calculations} />}
                {activeTab === 'floorplan' && <FloorPlanView floorPlanImage={floorPlanImage} setFloorPlanImage={setFloorPlanImage} />}
            </div>
        </main>
        {editingTask && <EditTaskModal task={editingTask} availableDeps={getAvailableDependencies(editingTask.id)} onClose={() => setEditingTask(null)} onSave={saveTaskChanges} />}
    </div>
  );
}