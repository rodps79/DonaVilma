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
  ImageIcon,
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
  Printer,
  ClipboardList,
  CheckSquare,
  Square,
  PlusCircle,
  Coins
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
  inputCompact: "w-full bg-white border border-slate-200 text-slate-700 text-xs rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 transition-all outline-none shadow-sm font-medium h-7 print:border-none print:bg-transparent print:p-0 print:h-auto print:text-right print:shadow-none",
  label: "block mb-1 text-xs font-semibold text-slate-500 uppercase tracking-wide",
  labelCompact: "block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5",
  card: "bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-slate-900/5 print:shadow-none print:ring-1 print:ring-slate-200",
  tableHeader: "bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider text-left py-3 px-4 border-b border-slate-100 print:bg-slate-100 print:text-slate-900",
  tableCell: "py-3 px-4 text-sm text-slate-600 border-b border-slate-50 group-hover:bg-slate-50/50 transition-colors print:border-slate-200",
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
    if (value !== parsedLocal) setLocalStr(value?.toString() ?? '');
  }, [value]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setLocalStr(newVal);
    if (newVal === '') { onValueChange(0); return; }
    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) onValueChange(parsed);
  };
  return <input type="number" value={localStr} onChange={handleChange} step={allowDecimals ? "0.01" : "1"} className={className} {...props} />;
};

const Card: React.FC<{ children?: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties; onClick?: () => void; }> = ({ children, className = "", id, style, onClick }) => (
  <div id={id} className={`${STYLES.card} ${className}`} style={style} onClick={onClick}>{children}</div>
);

const Button = ({ onClick, children, variant = 'primary', className = "" }: any) => {
  const baseStyle = "px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-sm print:hidden";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300",
    secondary: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-slate-900",
    danger: "bg-red-50 text-red-600 ring-1 ring-red-100 hover:bg-red-100",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700 shadow-none"
  };
  return <button onClick={onClick} className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}>{children}</button>;
};

const NavItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg transition-all duration-200 group ${active ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
    <Icon size={20} className={active ? "text-white" : "text-slate-500 group-hover:text-white"} />
    <span className={`hidden lg:inline text-sm font-medium`}>{label}</span>
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
   const baseClass = `px-2 py-1 rounded border transition-all duration-200 text-[10px] font-semibold uppercase tracking-wide flex items-center gap-2`;
   const activeClass = active ? (color ? colors[color] : 'bg-blue-50 border-blue-200 text-blue-700') : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300';
   return <button onClick={onClick} className={`${baseClass} ${activeClass}`}>{label}{cost && <div className="ml-1">{cost}</div>}</button>;
};

const TaskCostDisplay = ({ room, taskKey, unitPrices }: { room: Room; taskKey: string; unitPrices: UnitPrice[] }) => {
  const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);
  let price = unitPrices.find(p => p.applyTo === taskKey);
  if (!price) return null;
  let quantity = 0;
  // @ts-ignore
  if (!room.tasks[taskKey]) return null;
  if (taskKey.includes('floor')) quantity = floorArea;
  else if (taskKey.includes('wall')) quantity = wallAreaNet;
  else if (taskKey.includes('ceiling')) quantity = ceilingArea;
  if (quantity <= 0) return null;
  const total = quantity * (price.priceLabor + price.priceMaterial);
  return <span className="text-[9px] font-bold bg-white/50 px-1 rounded">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(total)}</span>;
};

// --- View Components ---
const DashboardView = ({ calculations, scheduleData }: any) => {
  const { totalLabor, totalMaterial, grandTotal, disciplineData, totalArea, costPerSqm, roomCostData, contingency, economySimulation } = calculations;
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const handlePrint = () => window.print();

  return (
    <div className="space-y-8 animate-fade-in pb-12 print:space-y-4 print:pb-0 dashboard-print-container">
       <section className="flex justify-between items-end mb-6 print:hidden">
          <div><h2 className="text-2xl font-bold text-slate-800">Visão Geral do Projeto</h2><p className="text-slate-500 text-sm">Resumo financeiro e estrutural da reforma.</p></div>
          <Button onClick={handlePrint} variant="secondary"><Printer size={18}/> Imprimir Dashboard</Button>
       </section>
       <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 border-l-4 border-blue-600"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Custo Total</p><h3 className="text-2xl font-black text-slate-800 mt-1">{f(grandTotal)}</h3><div className="mt-2 text-xs text-slate-400"> + {f(contingency)} (reserva)</div></Card>
              <Card className="p-5 border-l-4 border-violet-600"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Custo/m²</p><h3 className="text-2xl font-black text-slate-800 mt-1">{f(costPerSqm)}</h3><div className="mt-2 text-xs text-slate-400">{totalArea.toFixed(2)}m² construídos</div></Card>
              <Card className="p-5 border-l-4 border-emerald-500"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Material</p><h3 className="text-2xl font-black text-emerald-600 mt-1">{f(totalMaterial)}</h3><div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${(totalMaterial / grandTotal) * 100}%` }}></div></div></Card>
              <Card className="p-5 border-l-4 border-amber-500"><p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Mão de Obra</p><h3 className="text-2xl font-black text-amber-600 mt-1">{f(totalLabor)}</h3><div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden"><div className="bg-amber-500 h-full" style={{ width: `${(totalLabor / grandTotal) * 100}%` }}></div></div></Card>
       </section>
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
               <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart4 size={18} className="text-blue-500"/> Ranking de Custo por Ambiente</h4>
                  <div className="h-[400px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roomCostData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                           <Tooltip formatter={(v: number) => f(v)} cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                           <Bar dataKey="material" name="Material" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={12} />
                           <Bar dataKey="labor" name="Mão de Obra" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
            </div>
            <div className="space-y-8">
               <Card className="p-6">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2"><PieChartIcon size={18} className="text-blue-500"/> Distribuição</h4>
                  <div className="h-48 w-full relative mb-4">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={disciplineData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                              {disciplineData.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#eab308', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'][index % 8]} />))}
                           </Pie>
                           <Tooltip formatter={(v: number) => f(v)} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </Card>
               <Card className="p-6 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100">
                   <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2"><TrendingDown size={18}/> Potencial de Economia</h4>
                   <p className="text-xs text-emerald-600 mb-4">Reduzindo 20% em acabamentos estéticos.</p>
                   <div className="flex items-end justify-between"><span className="text-3xl font-black text-emerald-600">-{f(economySimulation)}</span></div>
               </Card>
            </div>
       </div>
    </div>
  );
};

const DetailedRoomView = ({ rooms }: { rooms: Room[] }) => {
  const [selectedFloor, setSelectedFloor] = useState<'subsolo' | 'terreo'>('terreo');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [adjustmentValue, setAdjustmentValue] = useState<number>(0);

  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    const ids = [
      'b1_a1','b1_a2','b1_a3','b1_a4','b1_b1','b1_b2','b1_b3','b1_c1','b1_c2','b1_c3','b1_c4','b1_c5','b1_c6','b1_c7','b1_c8','b1_c9',
      'b2_a1','b2_a2','b2_a3','b2_a4','b2_a5','b2_b1','b2_b2','b2_b3','b2_c1','b2_c2','b2_c3','b2_c4','b2_c5','b2_c6','b2_c7','b2_d1','b2_d2',
      'lav_a1','lav_a2','lav_a3','lav_b1','lav_b2','lav_b3','lav_c1','lav_c2','lav_c3','lav_c4','lav_c5','lav_c6',
      'coz_a1','coz_a2','coz_a3','coz_b1','coz_b2','coz_b3','coz_c1','coz_c2','coz_c3','coz_c4','coz_c5','coz_c6',
      'sal_a1','sal_a2','sal_b1','sal_b2',
      'd1_a1','d1_a2','d1_b1','d1_b2',
      'd2_a1','d2_a2','d2_b1','d2_b2','d2_c1','d2_d1','d2_d2',
      'ads_a1','ads_b1',
      'cor_a1', 'cor_a2', 'cor_b1',
      'cir_a1', 'cir_b1', 'cir_b2', 'cir_c1',
      'gar_a1', 'gar_b1', 'gar_c1', 'gar_c2', 'gar_d1',
      'jss_a1', 'jss_b1',
      'fss_a1', 'fss_b1', 'fss_c1', 'fss_d1',
      'cozss_a1', 'cozss_b1', 'cozss_b2', 'cozss_c1', 'cozss_c2', 'cozss_d1',
      'bss_a1', 'bss_b1', 'bss_b2', 'bss_b3', 'bss_c1', 'bss_d1', 'bss_d2', 'bss_d3', 'bss_d4', 'bss_d5', 'bss_d6', 'bss_d7',
      'dss_a1', 'dss_b1', 'dss_c1',
      'css_a1', 'css_b1', 'css_c1',
      'c1ss_a1', 'c1ss_b1',
      'c2ss_a1', 'c2ss_b1'
    ];
    ids.forEach(id => { state[id] = true; });
    return state;
  });

  const filteredRooms = rooms.filter(r => r.type === selectedFloor);
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const toggleItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DATA = useMemo(() => ({
    'Banheiro 1': {
      info: '4,40 m² / 22,70 m² parede',
      sections: {
        A: [
          { id: 'b1_a1', label: 'Demolição (Piso + Paredes): 27,10 m² × R$ 60,00', mat: 0, mo: 1626.00 },
          { id: 'b1_a2', label: 'Remoção de Louças e Box (Pacote)', mat: 0, mo: 400.00 },
          { id: 'b1_a3', label: 'Impermeabilização: 6,26 m² × R$ 130,00', mat: 406.90, mo: 406.90 },
          { id: 'b1_a4', label: 'Regularização e Contrapiso: 4,40 m² × R$ 80,00', mat: 176.00, mo: 176.00 },
        ],
        B: [
          { id: 'b1_b1', label: 'Piso (Porcelanato + Insumos): 4,40 m² × R$ 225,00', mat: 520.00, mo: 470.00 },
          { id: 'b1_b2', label: 'Paredes (Porcelanato + Insumos): 22,70 m² × R$ 225,00', mat: 2782.00, mo: 2325.50 },
          { id: 'b1_b3', label: 'Pintura Teto: 4,40 m² × R$ 95,00', mat: 209.00, mo: 209.00 },
        ],
        C: [
          { id: 'b1_c1', label: 'Vaso Sanitário C.A. (Instalado)', mat: 650.00, mo: 150.00 },
          { id: 'b1_c2', label: 'Gabinete + Cuba + Torneira (Instalados)', mat: 880.00, mo: 200.00 },
          { id: 'b1_c3', label: 'Ducha Higiênica (Instalada)', mat: 180.00, mo: 70.00 },
          { id: 'b1_c4', label: 'Chuveiro Elétrico (Instalado)', mat: 250.00, mo: 80.00 },
          { id: 'b1_c5', label: 'Box Vidro Temperado (Instalado)', mat: 1000.00, mo: 300.00 },
          { id: 'b1_c6', label: 'Kit Acessórios + Espelho (Instalados)', mat: 400.00, mo: 100.00 },
          { id: 'b1_c7', label: 'Porta Completa (Instalada)', mat: 700.00, mo: 300.00 },
          { id: 'b1_c8', label: 'Hidráulica (Troca Parcial + MO)', mat: 630.00, mo: 1200.00 },
          { id: 'b1_c9', label: 'Limpeza e Entulho (Pacote)', mat: 0, mo: 300.00 },
        ]
      }
    },
    'Banheiro 2': {
      info: '2,24 m² / 15 m² parede',
      sections: {
        A: [
          { id: 'b2_a1', label: 'Demolição Piso: 2,24 m² × R$ 60,00', mat: 0, mo: 134.40 },
          { id: 'b2_a2', label: 'Demolição Parede: 15,00 m² × R$ 60,00', mat: 0, mo: 900.00 },
          { id: 'b2_a3', label: 'Remoção Louças/Box (Pacote)', mat: 0, mo: 400.00 },
          { id: 'b2_a4', label: 'Impermeabilização (Piso + 1,5m Box): 5,40 m² × R$ 130,00', mat: 351, mo: 351 },
          { id: 'b2_a5', label: 'Regularização/Contrapiso: 2,24 m² × R$ 80,00', mat: 89.6, mo: 89.6 },
        ],
        B: [
          { id: 'b2_b1', label: 'Piso Porcelanato + Insumos: 2,24 m² × R$ 225,00', mat: 291.20, mo: 212.80 },
          { id: 'b2_b2', label: 'Parede Porcelanato + Insumos: 15,00 m² × R$ 225,00', mat: 1950.00, mo: 1425.00 },
          { id: 'b2_b3', label: 'Pintura Teto: 2,24 m² × R$ 95,00', mat: 106.40, mo: 106.40 },
        ],
        C: [
          { id: 'b2_c1', label: 'Vaso Sanitário C.A. (Mat 650 + MO 150)', mat: 650, mo: 150 },
          { id: 'b2_c2', label: 'Gabinete + Cuba + Torneira (Mat 880 + MO 200)', mat: 880, mo: 200 },
          { id: 'b2_c3', label: 'Ducha Higiênica (Mat 180 + MO 70)', mat: 180, mo: 70 },
          { id: 'b2_c4', label: 'Chuveiro Elétrico (Mat 250 + MO 80)', mat: 250, mo: 80 },
          { id: 'b2_c5', label: 'Box Vidro Temperado (Mat 1000 + MO 300)', mat: 1000, mo: 300 },
          { id: 'b2_c6', label: 'Kit Acessórios + Espelho (Mat 400 + MO 100)', mat: 400, mo: 100 },
          { id: 'b2_c7', label: 'Porta Completa (Mat 700 + MO 300)', mat: 700, mo: 300 },
        ],
        D: [
          { id: 'b2_d1', label: 'Troca Parcial Hidráulica (Mat 630 + MO 1200)', mat: 630, mo: 1200 },
          { id: 'b2_d2', label: 'Limpeza e Entulho (Pacote)', mat: 0, mo: 300 },
        ]
      }
    },
    'Lavanderia': {
      info: '4,00 m² / 21,40 m² parede',
      sections: {
        A: [
          { id: 'lav_a1', label: 'Demolição (Piso + Paredes): 25,40 m² × R$ 60,00', mat: 0, mo: 1524.00 },
          { id: 'lav_a2', label: 'Impermeabilização (Piso + Rodapé): 5,20 m² × R$ 130,00', mat: 338.00, mo: 338.00 },
          { id: 'lav_a3', label: 'Regularização e Contrapiso: 4,00 m² × R$ 80,00', mat: 160.00, mo: 160.00 },
        ],
        B: [
          { id: 'lav_b1', label: 'Piso (Revestimento + Insumos): 4,00 m² × R$ 225,00', mat: 520.00, mo: 380.00 },
          { id: 'lav_b2', label: 'Paredes (Revestimento + Insumos): 21,40 m² × R$ 225,00', mat: 2782.00, mo: 2033.00 },
          { id: 'lav_b3', label: 'Pintura Teto: 4,00 m² × R$ 95,00', mat: 190.00, mo: 190.00 },
        ],
        C: [
          { id: 'lav_c1', label: 'Tanque + Torneira (Instalados)', mat: 600.00, mo: 150.00 },
          { id: 'lav_c2', label: 'Ponto Máquina Lavar (Instalado)', mat: 300.00, mo: 300.00 },
          { id: 'lav_c3', label: 'Armário / Prateleiras (Instalados)', mat: 600.00, mo: 180.00 },
          { id: 'lav_c4', label: 'Hidráulica Geral (Troca Parcial)', mat: 500.00, mo: 750.00 },
          { id: 'lav_c5', label: 'Porta Interna Completa (Instalada)', mat: 700.00, mo: 300.00 },
          { id: 'lav_c6', label: 'Limpeza e Entulho (Pacote)', mat: 0, mo: 300.00 },
        ]
      }
    },
    'Cozinha': {
      info: '9,36 m² / 31,82 m² parede',
      sections: {
        A: [
          { id: 'coz_a1', label: 'Demolição (Piso + Paredes): 41,18 m² × R$ 60,00', mat: 0, mo: 2470.80 },
          { id: 'coz_a2', label: 'Impermeabilização (Piso + Rodapé): 11,20 m² × R$ 130,00', mat: 728.00, mo: 728.00 },
          { id: 'coz_a3', label: 'Regularização e Contrapiso: 9,36 m² × R$ 80,00', mat: 374.40, mo: 374.40 },
        ],
        B: [
          { id: 'coz_b1', label: 'Piso (Revestimento + Insumos): 9,36 m² × R$ 225,00', mat: 1216.80, mo: 889.20 },
          { id: 'coz_b2', label: 'Paredes (Revestimento + Insumos): 31,82 m² × R$ 225,00', mat: 4136.60, mo: 3022.90 },
          { id: 'coz_b3', label: 'Pintura Teto: 9,36 m² × R$ 95,00', mat: 444.60, mo: 444.60 },
        ],
        C: [
          { id: 'coz_c1', label: 'Bancada de Granito (2,50m linear)', mat: 1800.00, mo: 400.00 },
          { id: 'coz_c2', label: 'Cuba Inox + Torneira Gourmet', mat: 750.00, mo: 200.00 },
          { id: 'coz_c3', label: 'Armários Planejados (Est. Intermediária)', mat: 5500.00, mo: 1000.00 },
          { id: 'coz_c4', label: 'Hidráulica (Pia, Filtro e Esgoto)', mat: 500.00, mo: 900.00 },
          { id: 'coz_c5', label: 'Porta Interna Completa (Instalada)', mat: 700.00, mo: 300.00 },
          { id: 'coz_c6', label: 'Limpeza e Entulho (Rateio)', mat: 0, mo: 400.00 },
        ]
      }
    },
    'Sala': {
      info: '8,55 m² / 28,22 m² parede',
      sections: {
        A: [
          { id: 'sal_a1', label: 'Forro PVC: 8,55 m² × R$ 115,00', mat: 590.00, mo: 392.96 },
          { id: 'sal_a2', label: 'Pintura paredes: 28,22 m² × R$ 95,00', mat: 1340.64, mo: 1340.64 },
        ],
        B: [
          { id: 'sal_b1', label: 'Porta interna completa (Material + Instalação)', mat: 700.00, mo: 300.00 },
          { id: 'sal_b2', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 200.00 },
        ]
      }
    },
    'Corredor': {
      info: '5,35 m² / 26,00 m² parede',
      sections: {
        A: [
          { id: 'cor_a1', label: 'Rampa em concreto: 4,5 m² × R$ 200,00', mat: 450.00, mo: 450.00 },
          { id: 'cor_a2', label: 'Pintura paredes: 26,00 m² × R$ 95,00', mat: 1235.19, mo: 1235.19 },
        ],
        B: [
          { id: 'cor_b1', label: 'Forro PVC no teto: 5,48 m² × R$ 115,00', mat: 315.10, mo: 315.10 },
        ]
      }
    },
    'Circulação': {
      info: '3,30 m² / 17,04 m² parede',
      sections: {
        A: [
          { id: 'cir_a1', label: 'Demolição piso cerâmico: 3,30 m² × R$ 60,00', mat: 0, mo: 198.00 },
        ],
        B: [
          { id: 'cir_b1', label: 'Pintura paredes (massa + tinta): 17,04 m² × R$ 95,00', mat: 809.40, mo: 809.40 },
          { id: 'cir_b2', label: 'Pintura teto (massa + tinta): 3,30 m² × R$ 95,00', mat: 156.75, mo: 156.75 },
        ],
        C: [
          { id: 'cir_c1', label: 'Piso laminado completo: 3,30 m² × R$ 170,00', mat: 396.00, mo: 165.00 },
        ]
      }
    },
    'Garagem': {
      info: '21,75 m² / 36,00 m² parede',
      sections: {
        A: [
          { id: 'gar_a1', label: 'Demolição revestimento cerâmico de paredes: 18,0 m² × R$ 60,00', mat: 0, mo: 1080.00 },
        ],
        B: [
          { id: 'gar_b1', label: 'Pintura paredes (massa + tinta): 36,0 m² × R$ 95,00', mat: 1710.00, mo: 1710.00 },
        ],
        C: [
          { id: 'gar_c1', label: 'Pintura teto (massa + tinta): 21,75 m² × R$ 95,00', mat: 1033.12, mo: 1033.12 },
          { id: 'gar_c2', label: 'Tratamento extra de teto desplacando: 21,75 m² × R$ 40,00', mat: 435.00, mo: 435.00 },
        ],
        D: [
          { id: 'gar_d1', label: 'Pintura portão em grade: 13,0 m² × R$ 120,00', mat: 780.00, mo: 780.00 },
        ]
      }
    },
    'Jardim-SS': {
      info: '9,31 m² / 26,44 m² parede',
      sections: {
        A: [
          { id: 'jss_a1', label: 'Pintura de paredes (massa + tinta): 26,44 m² × R$ 95,00', mat: 1255.90, mo: 1255.90 },
        ],
        B: [
          { id: 'jss_b1', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 100.00 },
        ]
      }
    },
    'Fundo-SS': {
      info: '23,93 m² / 40,00 m² parede',
      sections: {
        A: [
          { id: 'fss_a1', label: 'Pintura paredes (massa + tinta): 40,0 m² × R$ 95,00', mat: 1900.00, mo: 1900.00 },
        ],
        B: [
          { id: 'fss_b1', label: 'Remoção teto desplacando + novo tratamento: 23,93 m² × R$ 40,00', mat: 478.60, mo: 478.60 },
        ],
        C: [
          { id: 'fss_c1', label: 'Tratamento / regularização de contrapiso irregular: 23,93 m² × R$ 80,00', mat: 957.20, mo: 957.20 },
        ],
        D: [
          { id: 'fss_d1', label: 'Tanque + torneira + instalação completa (Pacote)', mat: 500.00, mo: 250.00 },
        ]
      }
    },
    'Cozinha-SS': {
      info: '9,94 m² / 30,00 m² parede',
      sections: {
        A: [
          { id: 'cozss_a1', label: 'Demolição cerâmica das paredes: 30,0 m² × R$ 60,00', mat: 0, mo: 1800.00 },
        ],
        B: [
          { id: 'cozss_b1', label: 'Tratamento extra teto (remoção + reboco): 9,94 m² × R$ 40,00', mat: 0, mo: 397.72 },
          { id: 'cozss_b2', label: 'Pintura teto (massa + tinta): 9,94 m² × R$ 95,00', mat: 472.29, mo: 472.29 },
        ],
        C: [
          { id: 'cozss_c1', label: 'Pintura paredes (massa + tinta): 30,0 m² × R$ 95,00', mat: 1425.00, mo: 1425.00 },
          { id: 'cozss_c2', label: 'Revestimento cerâmico novo paredes: 30,0 m² × R$ 225,00', mat: 3375.00, mo: 3375.00 },
        ],
        D: [
          { id: 'cozss_d1', label: 'Porta interna completa (Material + Instalação)', mat: 700.00, mo: 300.00 },
        ]
      }
    },
    'Banheiro-SS': {
      info: '2,19 m² / 12,00 m² parede',
      sections: {
        A: [
          { id: 'bss_a1', label: 'Demolição cerâmica das paredes: 12,0 m² × R$ 60,00', mat: 0, mo: 720.00 },
        ],
        B: [
          { id: 'bss_b1', label: 'Revestimento cerâmico novo paredes: 12,0 m² × R$ 225,00', mat: 1350.00, mo: 1350.00 },
          { id: 'bss_b2', label: 'Pintura paredes (massa + tinta): 12,0 m² × R$ 95,00', mat: 570.00, mo: 570.00 },
          { id: 'bss_b3', label: 'Pintura teto (massa + tinta): 2,19 m² × R$ 95,00', mat: 104.24, mo: 104.24 },
        ],
        C: [
          { id: 'bss_c1', label: 'Porta interna completa (Material + Instalação)', mat: 700.00, mo: 300.00 },
        ],
        D: [
          { id: 'bss_d1', label: 'Vaso sanitário (C.A.)', mat: 650.00, mo: 150.00 },
          { id: 'bss_d2', label: 'Gabinete + cuba + torneira', mat: 880.00, mo: 200.00 },
          { id: 'bss_d3', label: 'Ducha higiênica', mat: 180.00, mo: 70.00 },
          { id: 'bss_d4', label: 'Chuveiro elétrico', mat: 250.00, mo: 80.00 },
          { id: 'bss_d5', label: 'Box vidro temperado', mat: 1000.00, mo: 300.00 },
          { id: 'bss_d6', label: 'Kit acessórios + espelho', mat: 400.00, mo: 100.00 },
          { id: 'bss_d7', label: 'Hidráulica geral (troca parcial)', mat: 630.00, mo: 1200.00 },
        ]
      }
    },
    'Dormitório-SS': {
      info: '11,82 m² / 26,00 m² parede',
      sections: {
        A: [
          { id: 'dss_a1', label: 'Pintura de paredes (massa + tinta): 26,0 m² × R$ 95,00', mat: 1235.00, mo: 1235.00 },
        ],
        B: [
          { id: 'dss_b1', label: 'Porta interna completa (Material + Instalação)', mat: 700.00, mo: 300.00 },
        ],
        C: [
          { id: 'dss_c1', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 150.00 },
        ]
      }
    },
    'Circulação-SS': {
      info: '3,40 m² / 10,00 m² parede tratada',
      sections: {
        A: [
          { id: 'css_a1', label: 'Demolição cerâmica das paredes (10 m²) × R$ 60,00', mat: 0, mo: 600.00 },
        ],
        B: [
          { id: 'css_b1', label: 'Tratamento + pintura (massa + tinta): 10,0 m² × R$ 95,00', mat: 475.00, mo: 475.00 },
        ],
        C: [
          { id: 'css_c1', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 120.00 },
        ]
      }
    },
    'Corredor 1-SS': {
      info: '2,70 m² / 18,00 m² parede',
      sections: {
        A: [
          { id: 'c1ss_a1', label: 'Pintura paredes (massa + tinta): 18,0 m² × R$ 95,00', mat: 855.00, mo: 855.00 },
        ],
        B: [
          { id: 'c1ss_b1', label: 'Limpeza e pequenos entulhos (rateio)', mat: 0, mo: 100.00 },
        ]
      }
    },
    'Corredor 2-SS': {
      info: '5,20 m² / 52,00 m² parede',
      sections: {
        A: [
          { id: 'c2ss_a1', label: 'Pintura paredes (massa + tinta): 52,0 m² × R$ 95,00', mat: 2470.00, mo: 2470.00 },
        ],
        B: [
          { id: 'c2ss_b1', label: 'Limpeza e pequenos entulhos (rateio)', mat: 0, mo: 150.00 },
        ]
      }
    },
    'Dormitório 1': {
      info: '8,09 m² / 28,46 m² parede',
      sections: {
        A: [
          { id: 'd1_a1', label: 'Forro gesso liso: 8,09 m² × R$ 130,00', mat: 526.11, mo: 526.11 },
          { id: 'd1_a2', label: 'Pintura paredes: 28,46 m² × R$ 95,00', mat: 1352.04, mo: 1352.04 },
        ],
        B: [
          { id: 'd1_b1', label: 'Porta interna completa (Material + Instalação)', mat: 700.00, mo: 300.00 },
          { id: 'd1_b2', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 200.00 },
        ]
      }
    },
    'Dormitório 2': {
      info: '6,00 m² / 27,00 m² parede',
      sections: {
        A: [
          { id: 'd2_a1', label: 'Demolição piso cerâmico: 6,00 m² × R$ 60,00', mat: 0, mo: 360.00 },
          { id: 'd2_a2', label: 'Demolição parede cerâmica: 27,00 m² × R$ 60,00', mat: 0, mo: 1620.00 },
        ],
        B: [
          { id: 'd2_b1', label: 'Pintura teto (massa + tinta): 6,00 m² × R$ 95,00', mat: 285.00, mo: 285.00 },
          { id: 'd2_b2', label: 'Pintura paredes (massa + tinta): 27,00 m² × R$ 95,00', mat: 1282.50, mo: 1282.50 },
        ],
        C: [
          { id: 'd2_c1', label: 'Piso laminado completo: 6,00 m² × R$ 170,00', mat: 720.00, mo: 300.00 },
        ],
        D: [
          { id: 'd2_d1', label: 'Porta interna completa (Mat + Inst): R$ 1.000,00', mat: 700.00, mo: 300.00 },
          { id: 'd2_d2', label: 'Limpeza e entulho (Rateio): R$ 250,00', mat: 0, mo: 250.00 },
        ]
      }
    },
    'Área de Serviço': {
      info: '8,86 m² / 69,02 m² parede',
      sections: {
        A: [
          { id: 'ads_a1', label: 'Pintura de paredes: 69,02 m² × R$ 95,00', mat: 3278.45, mo: 3278.45 },
        ],
        B: [
          { id: 'ads_b1', label: 'Limpeza e pequenos entulhos (Rateio)', mat: 0, mo: 100.00 },
        ]
      }
    }
  }), []);

  // Consolidação Global do Detalhamento
  const globalTotals = useMemo(() => {
    let mat = 0;
    let mo = 0;
    rooms.forEach(room => {
      const roomData = DATA[room.name as keyof typeof DATA];
      if (roomData) {
        Object.values(roomData.sections).flat().forEach((item: any) => {
          if (checkedItems[item.id]) {
            mat += item.mat;
            mo += item.mo;
          }
        });
      }
    });
    return { mat, mo, total: mat + mo };
  }, [rooms, DATA, checkedItems]);

  const currentData = selectedRoom ? (DATA[selectedRoom.name as keyof typeof DATA] || null) : null;

  const currentTotals = useMemo(() => {
    let mat = 0;
    let mo = 0;
    if (currentData) {
      Object.values(currentData.sections).flat().forEach((item: any) => {
        if (checkedItems[item.id]) { mat += item.mat; mo += item.mo; }
      });
    }
    return { mat, mo, total: mat + mo + adjustmentValue };
  }, [currentData, checkedItems, adjustmentValue]);

  const handlePrint = () => window.print();

  const RowItem: React.FC<{ item: any }> = ({ item }) => (
    <tr className={`hover:bg-slate-50 transition-all cursor-pointer group ${!checkedItems[item.id] ? 'opacity-40 select-none' : ''}`} onClick={() => toggleItem(item.id)}>
      <td className="py-2.5 px-2 w-10"><div className="flex items-center justify-center">{checkedItems[item.id] ? <CheckSquare size={20} className="text-blue-600" /> : <Square size={20} className="text-slate-300" />}</div></td>
      <td className="py-2.5 px-3 text-slate-600 text-sm font-medium">{item.label}</td>
      <td className="py-2.5 px-3 text-right font-bold text-slate-800 text-sm whitespace-nowrap">{f(item.mat + item.mo)}</td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-800">Detalhamento por Ambiente</h2>
          <p className="text-slate-500 text-sm">Escopo detalhado e interativo por ambiente.</p>
        </div>
        
        {/* Painel de Consolidação Global */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 print:hidden overflow-hidden">
          <div className="px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 min-w-[120px]">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter mb-0.5">Mat. Detalhamento</p>
            <p className="text-sm font-black text-emerald-700">{f(globalTotals.mat)}</p>
          </div>
          <div className="px-4 py-2 bg-amber-50 rounded-xl border border-amber-100 min-w-[120px]">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-tighter mb-0.5">MO Detalhamento</p>
            <p className="text-sm font-black text-amber-700">{f(globalTotals.mo)}</p>
          </div>
          <div className="px-5 py-2 bg-slate-900 rounded-xl shadow-lg min-w-[140px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total Consolidado</p>
            <p className="text-base font-black text-white">{f(globalTotals.total)}</p>
          </div>
          <Button onClick={handlePrint} variant="secondary" className="h-full ml-1"><Printer size={18} /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 lg:col-span-1 space-y-6 print:hidden">
          <div>
            <label className={STYLES.label}>Pavimento</label>
            <div className="flex gap-2 mt-2">
              {['subsolo', 'terreo'].map(p => (
                <button key={p} onClick={() => { setSelectedFloor(p as any); setSelectedRoomId(null); }} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase border ${selectedFloor === p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{p}</button>
              ))}
            </div>
          </div>
          <div>
            <label className={STYLES.label}>Ambiente</label>
            <div className="space-y-1 mt-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              {filteredRooms.map(room => {
                const isCalculated = !!DATA[room.name as keyof typeof DATA];
                return (
                  <button 
                    key={room.id} 
                    onClick={() => setSelectedRoomId(room.id)} 
                    className={`w-full text-left px-3 py-3 rounded-lg text-sm transition-all flex items-center justify-between group border-l-4 ${
                      selectedRoomId === room.id 
                        ? 'bg-blue-50 text-blue-700 font-bold border-blue-600' 
                        : isCalculated 
                          ? 'bg-emerald-50/40 text-slate-700 hover:bg-emerald-50 border-emerald-400' 
                          : 'text-slate-600 hover:bg-slate-50 border-transparent'
                    }`}
                  >
                    <span>{room.name}</span>
                    <ChevronRight size={14} className={selectedRoomId === room.id ? 'opacity-100' : 'opacity-0'} />
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {currentData ? (
            <div className="space-y-6">
                <Card className="p-0 overflow-hidden border-t-4 border-blue-600" id="detail-card">
                  <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div><h3 className="text-2xl font-bold text-slate-800">{selectedRoom?.name}</h3><p className="text-sm text-slate-500">{currentData.info}</p></div>
                    <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-end ring-4 ring-white">
                       <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-1">Custo Final Atual</span>
                       <div className="text-3xl font-black">{f(currentTotals.total)}</div>
                    </div>
                  </div>
                  <div className="p-6 space-y-10">
                    {Object.entries(currentData.sections).map(([key, items]: [string, any]) => (
                      <section key={key}>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                          <span className="bg-slate-800 text-white w-5 h-5 flex items-center justify-center rounded-sm text-[10px]">{key}</span>
                          {key === 'A' ? 'Demolição / Estrutura' : key === 'B' ? 'Revestimentos e Pintura' : key === 'C' ? 'Acabamentos' : 'Componentes e Entulho'}
                        </h4>
                        <table className="w-full">
                          <tbody className="divide-y divide-slate-50">{items.map((item: any) => <RowItem key={item.id} item={item} />)}</tbody>
                        </table>
                      </section>
                    ))}
                    <section className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col md:flex-row items-center justify-between gap-6 print:hidden">
                       <div className="flex items-center gap-4"><div className="bg-blue-600 text-white p-3 rounded-xl shadow-lg"><Coins size={24}/></div><div><h4 className="text-lg font-bold text-slate-800">Ajuste Manual</h4><p className="text-xs text-slate-500 font-medium">Extra ou Desconto</p></div></div>
                       <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200"><span className="font-bold text-slate-400 pl-2">R$</span><SmartNumberInput value={adjustmentValue} onValueChange={setAdjustmentValue} className="text-xl font-black text-slate-800 w-32 outline-none p-2 text-right" placeholder="0,00" /></div>
                    </section>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t-2 border-slate-100">
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 text-center"><p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Subtotal Materiais</p><p className="text-2xl font-black text-emerald-700">{f(currentTotals.mat)}</p></div>
                      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 text-center"><p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Subtotal Mão de Obra</p><p className="text-2xl font-black text-amber-700">{f(currentTotals.mo)}</p></div>
                      <div className="p-5 bg-slate-900 rounded-2xl flex flex-col items-center text-center shadow-xl"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Consolidado</p><p className="text-2xl font-black text-white">{f(currentTotals.total)}</p></div>
                    </div>
                  </div>
                </Card>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
              <div className="text-center">
                <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Info size={40} className="text-blue-400" /></div>
                <h3 className="text-xl font-bold text-slate-600">Selecione um Ambiente</h3>
                <p className="text-slate-400 mt-2">Ambientes com realce verde possuem memorial detalhado disponível.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RoomsView = ({ rooms, unitPrices, fixedCosts, highlightedRoomId, setHighlightedRoomId, addRoom, updateRoom, updateRoomTask, deleteRoom }: any) => {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-slate-800">Ambientes</h2><p className="text-slate-500 text-sm">Gerencie as dimensões e tarefas de cada cômodo.</p></div>
        <Button onClick={addRoom}><Plus size={18} /> Novo Ambiente</Button>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rooms.map((room: Room) => (
          <Card key={room.id} id={`room-card-${room.id}`} className={`p-0 overflow-hidden transition-all duration-500 ${highlightedRoomId === room.id ? 'ring-2 ring-blue-500 shadow-xl' : ''}`} onClick={() => highlightedRoomId === room.id && setHighlightedRoomId(null)}>
             <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-start">
                <div className="flex-1 mr-4"><label className={STYLES.labelCompact}>Nome do Ambiente</label><input type="text" value={room.name} onChange={(e) => updateRoom(room.id, 'name', e.target.value)} className={`${STYLES.input} font-bold text-lg py-1 px-2 -ml-2 bg-transparent border-transparent hover:border-slate-200`} /></div>
                <button onClick={() => deleteRoom(room.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={16} /></button>
             </div>
             <div className="p-4 grid grid-cols-4 gap-4 border-b border-slate-50">
                <div><label className={STYLES.labelCompact}>Largura (m)</label><SmartNumberInput value={room.width} onValueChange={(v) => updateRoom(room.id, 'width', v)} className={STYLES.inputSmall} /></div>
                <div><label className={STYLES.labelCompact}>Comp. (m)</label><SmartNumberInput value={room.length} onValueChange={(v) => updateRoom(room.id, 'length', v)} className={STYLES.inputSmall} /></div>
                <div><label className={STYLES.labelCompact}>Pé Dir. (m)</label><SmartNumberInput value={room.height} onValueChange={(v) => updateRoom(room.id, 'height', v)} className={STYLES.inputSmall} /></div>
                <div><label className={STYLES.labelCompact}>Desc. (m²)</label><SmartNumberInput value={room.deductionArea} onValueChange={(v) => updateRoom(room.id, 'deductionArea', v)} className={STYLES.inputSmall} /></div>
             </div>
             <div className="p-4 space-y-4">
                <div><h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Hammer size={12}/> Demolição</h5><div className="flex flex-wrap gap-2">
                      <TaskToggle label="Piso" active={room.tasks.demo_floor} onClick={() => updateRoomTask(room.id, 'demo_floor', !room.tasks.demo_floor)} cost={<TaskCostDisplay room={room} taskKey="demo_floor" unitPrices={unitPrices} />} color="rose" />
                      <TaskToggle label="Parede" active={room.tasks.demo_wall} onClick={() => updateRoomTask(room.id, 'demo_wall', !room.tasks.demo_wall)} cost={<TaskCostDisplay room={room} taskKey="demo_wall" unitPrices={unitPrices} />} color="rose" />
                </div></div>
                <div className="grid grid-cols-2 gap-4">
                   <div><h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Grid size={12}/> Piso</h5><div className="flex flex-col gap-1.5">
                          <TaskToggle label="Contrapiso" active={room.tasks.ref_floor_screed} onClick={() => updateRoomTask(room.id, 'ref_floor_screed', !room.tasks.ref_floor_screed)} cost={<TaskCostDisplay room={room} taskKey="ref_floor_screed" unitPrices={unitPrices} />} color="orange" />
                          <TaskToggle label="Cerâmica" active={room.tasks.ref_floor_ceramic} onClick={() => updateRoomTask(room.id, 'ref_floor_ceramic', !room.tasks.ref_floor_ceramic)} cost={<TaskCostDisplay room={room} taskKey="ref_floor_ceramic" unitPrices={unitPrices} />} color="emerald" />
                   </div></div>
                   <div><h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Maximize2 size={12}/> Teto</h5><div className="flex flex-col gap-1.5">
                          <TaskToggle label="Pintura" active={room.tasks.ref_ceiling_paint} onClick={() => updateRoomTask(room.id, 'ref_ceiling_paint', !room.tasks.ref_ceiling_paint)} cost={<TaskCostDisplay room={room} taskKey="ref_ceiling_paint" unitPrices={unitPrices} />} color="cyan" />
                   </div></div>
                </div>
             </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

const PricesView = ({ unitPrices, fixedCosts, updatePrice, updateFixedCost, addFixedCost, deleteFixedCost }: any) => {
  const handlePrint = () => window.print();
  return (
    <div className="space-y-8 animate-fade-in pb-20 print:pb-0">
       <div className="flex justify-between items-center print:hidden"><h2 className="text-2xl font-bold text-slate-800">Custos & Composições</h2><Button onClick={handlePrint} variant="secondary"><Printer size={18}/> Imprimir Lista</Button></div>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-0 overflow-hidden"><div className="p-4 bg-slate-50 border-b border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2"><DollarSign size={18} className="text-blue-500"/> Composições Unitárias</h3></div><div className="overflow-x-auto">
                <table className="w-full text-left text-sm"><thead className={STYLES.tableHeader}><tr><th>Item</th><th>Unid.</th><th className="text-right">M. Obra</th><th className="text-right">Material</th></tr></thead>
                   <tbody className="divide-y divide-slate-50">{unitPrices.map((price: UnitPrice) => (
                         <tr key={price.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-700">{price.item} <span className="text-[10px] text-slate-400 block font-normal">{price.category}</span></td><td className="px-4 py-3 text-slate-500 text-xs">{price.unit}</td><td className="px-4 py-3 text-right"><SmartNumberInput value={price.priceLabor} onValueChange={(v) => updatePrice(price.id, 'priceLabor', v)} className={`${STYLES.inputCompact} w-20 ml-auto`} /></td><td className="px-4 py-3 text-right"><SmartNumberInput value={price.priceMaterial} onValueChange={(v) => updatePrice(price.id, 'priceMaterial', v)} className={`${STYLES.inputCompact} w-20 ml-auto`} /></td></tr>
                      ))}</tbody></table></div></Card>
          <Card className="p-0 overflow-hidden flex flex-col"><div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2"><BoxSelect size={18} className="text-purple-500"/> Custos Fixos</h3><Button onClick={addFixedCost} variant="secondary" className="text-xs py-1 px-2 h-8"><Plus size={14}/> Adicionar</Button></div><div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm"><thead className={STYLES.tableHeader}><tr><th>Item</th><th className="w-20 text-center">Qtd.</th><th className="text-right">M. Obra</th><th className="text-right">Mat.</th><th className="w-8"></th></tr></thead>
                   <tbody className="divide-y divide-slate-50">{fixedCosts.map((fc: FixedCost) => (
                         <tr key={fc.id} className="hover:bg-slate-50"><td className="px-4 py-2"><input type="text" value={fc.item} onChange={(e) => updateFixedCost(fc.id, 'item', e.target.value)} className={`${STYLES.inputCompact} font-medium`} /></td><td className="px-2 py-2"><SmartNumberInput value={fc.quantity} onValueChange={(v) => updateFixedCost(fc.id, 'quantity', v)} className={`${STYLES.inputCompact} text-center`} /></td><td className="px-2 py-2"><SmartNumberInput value={fc.priceLaborUnit} onValueChange={(v) => updateFixedCost(fc.id, 'priceLaborUnit', v)} className={`${STYLES.inputCompact} text-right`} /></td><td className="px-2 py-2"><SmartNumberInput value={fc.priceMaterialUnit} onValueChange={(v) => updateFixedCost(fc.id, 'priceMaterialUnit', v)} className={`${STYLES.inputCompact} text-right`} /></td><td className="px-2 py-2 text-center"><button onClick={() => deleteFixedCost(fc.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button></td></tr>
                      ))}</tbody></table></div></Card>
       </div>
    </div>
  );
};

const ScheduleView = ({ scheduleData, setEditingTask }: any) => {
   return (
      <div className="space-y-6 animate-fade-in pb-20">
         <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-bold text-slate-800">Cronograma Físico</h2><p className="text-slate-500 text-sm">Previsão de duração e sequenciamento.</p></div><div className="text-right"><div className="text-3xl font-black text-blue-600">{scheduleData.totalDays} <span className="text-sm font-medium text-slate-400">dias</span></div></div></div>
         <Card className="p-6 overflow-x-auto"><div className="min-w-[800px]"><div className="flex mb-4 border-b border-slate-100 pb-2"><div className="w-48 flex-shrink-0 text-xs font-bold text-slate-400 uppercase">Atividade</div><div className="flex-1 relative h-6">
                     {Array.from({ length: Math.ceil(scheduleData.totalDays / 5) + 2 }).map((_, i) => (<div key={i} className="absolute text-[10px] text-slate-300 border-l border-slate-100 pl-1 h-full" style={{ left: `${(i * 5 / scheduleData.totalDays) * 100}%` }}>Dia {i * 5}</div>))}
                  </div></div><div className="space-y-3">{scheduleData.tasks.map((task: Task) => (<div key={task.id} className="flex items-center group"><div className="w-48 flex-shrink-0 pr-4"><div className="text-sm font-bold text-slate-700 truncate">{task.name}</div><div className="text-[10px] text-slate-400">{task.duration} dias</div></div><div className="flex-1 relative h-8 bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:bg-slate-100" onClick={() => setEditingTask(task)}><div className={`absolute top-1 bottom-1 rounded-md ${task.color} opacity-80 group-hover:opacity-100 transition-all flex items-center px-2`} style={{ left: `${(task.startDay / scheduleData.totalDays) * 100}%`, width: `${Math.max((task.duration / scheduleData.totalDays) * 100, 1)}%` }}><span className="text-[10px] font-bold text-white truncate">{task.duration}d</span></div></div></div>))}</div></div></Card>
      </div>
   );
};

const SynthesisView = ({ rooms, unitPrices, fixedCosts }: any) => {
  const f = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const fn = (val: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
  const tableData = useMemo(() => {
    return rooms.map((room: Room) => {
      const { floorArea, wallAreaNet } = getRoomDimensions(room);
      let demoCost = 0, refazimentoCost = 0;
      unitPrices.forEach((price: UnitPrice) => {
        let quantity = 0;
        // @ts-ignore
        if (room.tasks[price.applyTo]) {
           if (price.applyTo.includes('floor')) quantity = floorArea;
           else if (price.applyTo.includes('wall')) quantity = wallAreaNet;
           else if (price.applyTo.includes('ceiling')) quantity = floorArea; 
        }
        if (quantity > 0) {
           const total = quantity * (price.priceLabor + price.priceMaterial);
           if (price.category === 'Demolição') demoCost += total; else refazimentoCost += total;
        }
      });
      return { ...room, floorArea, wallAreaNet, demoCost, refazimentoCost };
    });
  }, [rooms, unitPrices, fixedCosts]);
  return (<div className="space-y-6 animate-fade-in pb-20"><Card className="p-0 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-xs whitespace-nowrap"><thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider"><tr><th className="px-4 py-3 font-bold">Ambiente</th><th className="px-4 py-3 font-bold text-right">Piso (m²)</th><th className="px-4 py-3 font-bold text-right">Parede (m²)</th><th className="px-4 py-3 font-bold text-right text-rose-600">Demolição ($)</th><th className="px-4 py-3 font-bold text-right text-emerald-600">Refazimento ($)</th></tr></thead><tbody className="divide-y divide-slate-50">{tableData.map((row: any) => (<tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold text-blue-600">{row.name}</td><td className="px-4 py-3 text-right">{fn(row.floorArea)}</td><td className="px-4 py-3 text-right">{fn(row.wallAreaNet)}</td><td className="px-4 py-3 text-right font-medium text-rose-600">{f(row.demoCost)}</td><td className="px-4 py-3 text-right font-medium text-emerald-600">{f(row.refazimentoCost)}</td></tr>))}</tbody></table></div></Card></div>);
};

const FloorPlanView = ({ floorPlanImage, setFloorPlanImage }: any) => {
   const [activePlan, setActivePlan] = useState<string | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         const reader = new FileReader();
         reader.onload = (event) => { setFloorPlanImage(event.target?.result as string); setActivePlan(null); };
         reader.readAsDataURL(file);
      }
   };
   const projectPlans = [{ id: 'ss', name: 'Planta Subsolo', url: 'https://i.postimg.cc/3Rskd5GL/Planta_Vilma_SS.png' }, { id: 'terreo', name: 'Planta Térreo', url: 'https://i.postimg.cc/vBJ4cFnj/Planta_Vilma_Terreo.png' }];
   const currentDisplay = activePlan ? projectPlans.find(p => p.id === activePlan)?.url : floorPlanImage;
   return (<div className="space-y-6 animate-fade-in pb-20 h-full"><div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-slate-800">Planta Baixa</h2></div><div className="flex gap-2"><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" /><Button onClick={() => fileInputRef.current?.click()} variant="secondary"><Upload size={18}/> Upload</Button></div></div><div className="flex gap-4 mb-2">{projectPlans.map(plan => (<button key={plan.id} onClick={() => setActivePlan(plan.id)} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${activePlan === plan.id ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600'}`}>{plan.name}</button>))}</div><Card className="flex-1 min-h-[600px] overflow-hidden relative flex items-center justify-center bg-slate-100">{currentDisplay ? (<div className="w-full h-full overflow-auto p-4"><img src={currentDisplay} alt="Planta" className="mx-auto shadow-2xl rounded-sm" /></div>) : (<div className="text-center text-slate-400"><MapIcon size={48} className="mx-auto mb-2 opacity-50" /><p>Selecione uma planta.</p></div>)}</Card></div>);
};

const EditTaskModal = ({ task, onClose, onSave }: any) => {
   const [duration, setDuration] = useState(task.duration);
   const [startDay, setStartDay] = useState(task.startDay);
   const handleSave = () => { onSave(task.id, { duration: Number(duration), startDay: Number(startDay) }); };
   return (<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]"><Card className="w-96 p-6 shadow-2xl"><h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Edit2 size={18}/> Editar</h3><div className="space-y-4"><div><label className={STYLES.label}>Duração</label><input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className={STYLES.input} /></div><div><label className={STYLES.label}>Início (Dia)</label><input type="number" value={startDay} onChange={(e) => setStartDay(e.target.value)} className={STYLES.input} /></div></div><div className="flex gap-3 mt-6"><Button onClick={onClose} variant="secondary" className="flex-1">Cancelar</Button><Button onClick={handleSave} className="flex-1">Salvar</Button></div></Card></div>);
};

// --- Main App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [unitPrices, setUnitPrices] = useState<UnitPrice[]>(INITIAL_PRICES);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(INITIAL_FIXED_COSTS);
  const [highlightedRoomId, setHighlightedRoomId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);

  const updateRoom = (id: string, field: string, value: any) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };
  const updateRoomTask = (roomId: string, taskKey: string, value: boolean) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, tasks: { ...r.tasks, [taskKey]: value } } : r));
  };
  const deleteRoom = (id: string) => setRooms(prev => prev.filter(r => r.id !== id));
  const addRoom = () => {
    const newRoom: Room = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Novo Ambiente',
      type: 'terreo',
      width: 0, length: 0, height: 2.7, deductionArea: 0, switchCount: 0, socketCount: 0,
      tasks: {
        demo_floor: false, demo_wall: false, demo_ceiling: false,
        ref_floor_ceramic: false, ref_floor_screed: false,
        ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: false,
        ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
      }
    };
    setRooms([...rooms, newRoom]);
  };

  const updatePrice = (id: string, field: string, value: number) => {
    setUnitPrices(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const updateFixedCost = (id: string, field: string, value: any) => {
    setFixedCosts(prev => prev.map(fc => fc.id === id ? { ...fc, [field]: value } : fc));
  };
  const addFixedCost = () => {
    const newFC: FixedCost = { id: Date.now().toString(), item: 'Novo Item', quantity: 0, priceLaborUnit: 0, priceMaterialUnit: 0 };
    setFixedCosts([...fixedCosts, newFC]);
  };
  const deleteFixedCost = (id: string) => setFixedCosts(prev => prev.filter(fc => fc.id !== id));

  const calculations = useMemo(() => {
    let totalLabor = 0;
    let totalMaterial = 0;
    let totalArea = 0;
    const roomCostData: any[] = [];
    const categories: Record<string, number> = {};

    rooms.forEach(room => {
      const { floorArea, wallAreaNet, ceilingArea } = getRoomDimensions(room);
      totalArea += floorArea;
      let roomLabor = 0;
      let roomMaterial = 0;

      unitPrices.forEach(p => {
        // @ts-ignore
        if (room.tasks[p.applyTo]) {
          let qty = 0;
          if (p.applyTo.includes('floor')) qty = floorArea;
          else if (p.applyTo.includes('wall')) qty = wallAreaNet;
          else if (p.applyTo.includes('ceiling')) qty = ceilingArea;
          
          const lCost = qty * p.priceLabor;
          const mCost = qty * p.priceMaterial;
          roomLabor += lCost;
          roomMaterial += mCost;
          categories[p.category] = (categories[p.category] || 0) + lCost + mCost;
        }
      });
      roomCostData.push({ name: room.name, labor: roomLabor, material: roomMaterial, total: roomLabor + roomMaterial });
      totalLabor += roomLabor;
      totalMaterial += roomMaterial;
    });

    fixedCosts.forEach(fc => {
      const lCost = fc.quantity * fc.priceLaborUnit;
      const mCost = fc.quantity * fc.priceMaterialUnit;
      totalLabor += lCost;
      totalMaterial += mCost;
      categories['Itens Globais'] = (categories['Itens Globais'] || 0) + lCost + mCost;
    });

    const grandTotal = totalLabor + totalMaterial;
    const costPerSqm = totalArea > 0 ? grandTotal / totalArea : 0;
    const disciplineData = Object.entries(categories).map(([name, value]) => ({ name, value }));
    const contingency = grandTotal * 0.1;
    const economySimulation = grandTotal * 0.15;

    return { totalLabor, totalMaterial, grandTotal, disciplineData, totalArea, costPerSqm, roomCostData: roomCostData.sort((a,b) => b.total - a.total), contingency, economySimulation };
  }, [rooms, unitPrices, fixedCosts]);

  const scheduleData = useMemo(() => {
    const tasks: Task[] = [
      { id: '1', name: 'Demolição', duration: 5, startDay: 0, color: 'bg-rose-500', dependency: null },
      { id: '2', name: 'Infraestrutura', duration: 10, startDay: 5, color: 'bg-blue-500', dependency: '1' },
      { id: '3', name: 'Acabamentos', duration: 15, startDay: 15, color: 'bg-emerald-500', dependency: '2' },
    ];
    return { tasks, totalDays: 30 };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <aside className="w-full lg:w-64 bg-slate-900 text-white p-6 space-y-8 print:hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-blue-600 p-2 rounded-lg"><Calculator size={24}/></div>
          <h1 className="text-xl font-bold tracking-tight">Reforma Pro</h1>
        </div>
        <nav className="space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={Home} label="Ambientes" active={activeTab === 'rooms'} onClick={() => setActiveTab('rooms')} />
          <NavItem icon={ClipboardList} label="Detalhamento" active={activeTab === 'detailed'} onClick={() => setActiveTab('detailed')} />
          <NavItem icon={DollarSign} label="Preços" active={activeTab === 'prices'} onClick={() => setActiveTab('prices')} />
          <NavItem icon={Calendar} label="Cronograma" active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
          <NavItem icon={FileText} label="Síntese" active={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} />
          <NavItem icon={MapIcon} label="Planta" active={activeTab === 'floorplan'} onClick={() => setActiveTab('floorplan')} />
        </nav>
      </aside>
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardView calculations={calculations} scheduleData={scheduleData} />}
        {activeTab === 'rooms' && <RoomsView rooms={rooms} unitPrices={unitPrices} fixedCosts={fixedCosts} highlightedRoomId={highlightedRoomId} setHighlightedRoomId={setHighlightedRoomId} addRoom={addRoom} updateRoom={updateRoom} updateRoomTask={updateRoomTask} deleteRoom={deleteRoom} />}
        {activeTab === 'detailed' && <DetailedRoomView rooms={rooms} />}
        {activeTab === 'prices' && <PricesView unitPrices={unitPrices} fixedCosts={fixedCosts} updatePrice={updatePrice} updateFixedCost={updateFixedCost} addFixedCost={addFixedCost} deleteFixedCost={deleteFixedCost} />}
        {activeTab === 'schedule' && <ScheduleView scheduleData={scheduleData} setEditingTask={setEditingTask} />}
        {activeTab === 'synthesis' && <SynthesisView rooms={rooms} unitPrices={unitPrices} fixedCosts={fixedCosts} />}
        {activeTab === 'floorplan' && <FloorPlanView floorPlanImage={floorPlanImage} setFloorPlanImage={setFloorPlanImage} />}
      </main>
      {editingTask && <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} onSave={() => setEditingTask(null)} />}
    </div>
  );
};

export default App;