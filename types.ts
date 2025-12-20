
export type RoomType = 'subsolo' | 'terreo' | 'superior' | 'externa';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  width: number; // Largura (m)
  length: number; // Comprimento (m)
  height: number; // Pé Direito (m)
  deductionArea: number; // Área de vãos a descontar (m2)
  
  // Added switchCount and socketCount to match project data and addRoom logic
  switchCount: number;
  socketCount: number;

  // Tasks (Boolean toggles matching the spreadsheet columns)
  tasks: {
    // Demolition
    demo_floor: boolean;
    demo_wall: boolean;
    demo_ceiling: boolean;
    
    // Refinishing - Floor
    ref_floor_ceramic: boolean;
    ref_floor_screed: boolean; // Contrapiso
    
    // Refinishing - Wall
    ref_wall_plaster: boolean; // Reboco
    ref_wall_ceramic: boolean;
    ref_wall_paint: boolean;
    
    // Refinishing - Ceiling
    ref_ceiling_gypsum: boolean; // Gesso
    ref_ceiling_plaster: boolean; // Reboco/Chapisco (New)
    ref_ceiling_paint: boolean;
    ref_ceiling_pvc: boolean;
  };
}

export interface UnitPrice {
  id: string;
  category: 'Demolição' | 'Refazimento' | 'Outros';
  item: string;
  unit: string;
  priceLabor: number; // R$/m2 Mão de Obra
  priceMaterial: number; // R$/m2 Material
  applyTo: keyof Room['tasks'] | 'switchCount' | 'socketCount'; // Maps this price to a specific room task or quantity
}

export interface FixedCost {
  id: string;
  item: string;
  quantity: number;
  priceLaborUnit: number;
  priceMaterialUnit: number;
}

export interface SummaryData {
  totalLabor: number;
  totalMaterial: number;
  grandTotal: number;
  categoryBreakdown: { name: string; value: number }[];
}

export interface Task {
  id: string;
  name: string;
  duration: number;
  startDay: number;
  color: string;
  dependency: string | null;
}

export interface ScheduleOverride {
  duration?: number;
  startDay?: number;
  dependency?: string | null;
}