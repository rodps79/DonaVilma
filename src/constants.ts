import { Room, UnitPrice, FixedCost } from './types';

export const INITIAL_PRICES: UnitPrice[] = [
  // Demolition
  { id: '1', category: 'Demolição', item: 'Piso', unit: 'm²', priceLabor: 30.00, priceMaterial: 0, applyTo: 'demo_floor' },
  { id: '2', category: 'Demolição', item: 'Parede', unit: 'm²', priceLabor: 30.00, priceMaterial: 0, applyTo: 'demo_wall' },
  { id: '3', category: 'Demolição', item: 'Teto', unit: 'm²', priceLabor: 30.00, priceMaterial: 0, applyTo: 'demo_ceiling' },
  
  // Refinishing - Floor
  { id: '4', category: 'Refazimento', item: 'Cerâmica Piso', unit: 'm²', priceLabor: 50.00, priceMaterial: 80.00, applyTo: 'ref_floor_ceramic' },
  { id: '5', category: 'Refazimento', item: 'Contrapiso', unit: 'm²', priceLabor: 30.00, priceMaterial: 30.00, applyTo: 'ref_floor_screed' },
  
  // Refinishing - Wall
  { id: '6', category: 'Refazimento', item: 'Reboco/Chapisco', unit: 'm²', priceLabor: 30.00, priceMaterial: 20.00, applyTo: 'ref_wall_plaster' },
  { id: '7', category: 'Refazimento', item: 'Cerâmica Parede', unit: 'm²', priceLabor: 50.00, priceMaterial: 80.00, applyTo: 'ref_wall_ceramic' },
  { id: '8', category: 'Refazimento', item: 'Pintura Parede', unit: 'm²', priceLabor: 20.00, priceMaterial: 20.00, applyTo: 'ref_wall_paint' },

  // Refinishing - Ceiling
  { id: '9', category: 'Refazimento', item: 'Forro Gesso', unit: 'm²', priceLabor: 50.00, priceMaterial: 70.00, applyTo: 'ref_ceiling_gypsum' },
  { id: '12', category: 'Refazimento', item: 'Reboco/Chap. Teto', unit: 'm²', priceLabor: 30.00, priceMaterial: 20.00, applyTo: 'ref_ceiling_plaster' },
  { id: '10', category: 'Refazimento', item: 'Pintura Teto', unit: 'm²', priceLabor: 20.00, priceMaterial: 15.00, applyTo: 'ref_ceiling_paint' },
  { id: '11', category: 'Refazimento', item: 'Forro PVC', unit: 'm²', priceLabor: 45.00, priceMaterial: 65.00, applyTo: 'ref_ceiling_pvc' },
];

export const INITIAL_FIXED_COSTS: FixedCost[] = [
  { id: 'f10', item: 'Ponto Interruptor', quantity: 0, priceLaborUnit: 50.00, priceMaterialUnit: 40.00 },
  { id: 'f11', item: 'Ponto Tomada', quantity: 0, priceLaborUnit: 50.00, priceMaterialUnit: 45.00 },
  { id: 'f1', item: 'Portas', quantity: 10, priceLaborUnit: 100, priceMaterialUnit: 400 },
  { id: 'f2', item: 'Janelas', quantity: 11, priceLaborUnit: 100, priceMaterialUnit: 550 },
  { id: 'f12', item: 'Alvenaria Nova (m²)', quantity: 0, priceLaborUnit: 70.00, priceMaterialUnit: 50.00 },
  { id: 'f13', item: 'Drywall (m²)', quantity: 0, priceLaborUnit: 45.00, priceMaterialUnit: 65.00 },
  { id: 'f5', item: 'Impermeabilização', quantity: 21.75, priceLaborUnit: 35.00, priceMaterialUnit: 35.00 },
  { id: 'f6', item: 'Telhado', quantity: 52.00, priceLaborUnit: 45.00, priceMaterialUnit: 80.00 },
  { id: 'f7', item: 'Hidráulica (Geral)', quantity: 1, priceLaborUnit: 2500.00, priceMaterialUnit: 1500.00 },
  { id: 'f8', item: 'Caixa d\'água', quantity: 1, priceLaborUnit: 300.00, priceMaterialUnit: 800.00 },
  { id: 'f9', item: 'Elétrica (Infra/QDC)', quantity: 1, priceLaborUnit: 3500.00, priceMaterialUnit: 2500.00 },
];

export const INITIAL_ROOMS: Room[] = [
  // Subsolo
  {
    id: 'r1',
    name: 'Jardim-SS',
    type: 'subsolo',
    width: 4.35,
    length: 2.14,
    height: 2.60,
    deductionArea: 7.31,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: true,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r2',
    name: 'Fundo-SS',
    type: 'subsolo',
    width: 4.35,
    length: 5.50,
    height: 2.60,
    deductionArea: 11.46,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: true,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: true, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r3',
    name: 'Cozinha-SS',
    type: 'subsolo',
    width: 3.26,
    length: 3.05,
    height: 2.67,
    deductionArea: 4.58,
    switchCount: 1,
    socketCount: 3,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: true,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: true, ref_ceiling_paint: true, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r4',
    name: 'Circulação-SS',
    type: 'subsolo',
    width: 2.56,
    length: 1.33,
    height: 2.15,
    deductionArea: 7.33,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: true, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r5',
    name: 'Banheiro-SS',
    type: 'subsolo',
    width: 1.65,
    length: 1.33,
    height: 2.15,
    deductionArea: 1.05,
    switchCount: 1,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: true, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r6',
    name: 'Dormitório-SS',
    type: 'subsolo',
    width: 3.23,
    length: 3.66,
    height: 2.00,
    deductionArea: 2.02,
    switchCount: 1,
    socketCount: 2,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: true, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r7',
    name: 'Corredor 1-SS',
    type: 'subsolo',
    width: 0.90,
    length: 3.00,
    height: 2.65,
    deductionArea: 3.33,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r8',
    name: 'Corredor 2-SS',
    type: 'subsolo',
    width: 1.00,
    length: 5.20,
    height: 4.50,
    deductionArea: 3.57,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: true, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: true,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  // Térreo
  {
    id: 'r9',
    name: 'Garagem',
    type: 'terreo',
    width: 4.35,
    length: 5.00,
    height: 2.90,
    deductionArea: 18.16,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: true,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: true, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r10',
    name: 'Sala',
    type: 'terreo',
    width: 3.25,
    length: 2.63,
    height: 2.40,
    deductionArea: 5.23,
    switchCount: 1,
    socketCount: 1,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r11',
    name: 'Corredor',
    type: 'terreo',
    width: 1.00,
    length: 3.80,
    height: 2.40,
    deductionArea: 4.67,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r12',
    name: 'Dormitório 1',
    type: 'terreo',
    width: 2.13,
    length: 3.80,
    height: 2.40,
    deductionArea: 3.63,
    switchCount: 1,
    socketCount: 2,
    tasks: {
      demo_floor: true, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: true, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r13',
    name: 'Circulação',
    type: 'terreo',
    width: 2.15,
    length: 1.40,
    height: 2.60,
    deductionArea: 4.53,
    switchCount: 1,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: true,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r14',
    name: 'Banheiro 1',
    type: 'terreo',
    width: 1.95,
    length: 1.40,
    height: 2.50,
    deductionArea: 2.01,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r15',
    name: 'Cozinha',
    type: 'terreo',
    width: 3.12,
    length: 3.00,
    height: 2.73,
    deductionArea: 5.18,
    switchCount: 1,
    socketCount: 7,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: true,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  },
  {
    id: 'r16',
    name: 'Dormitório 2',
    type: 'terreo',
    width: 3.22,
    length: 3.43,
    height: 2.55,
    deductionArea: 4.71,
    switchCount: 2,
    socketCount: 4,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r17',
    name: 'Lavanderia',
    type: 'terreo',
    width: 1.95,
    length: 2.04,
    height: 2.68,
    deductionArea: 5.55,
    switchCount: 1,
    socketCount: 1,
    tasks: {
      demo_floor: false, demo_wall: true, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r18',
    name: 'Banheiro 2',
    type: 'terreo',
    width: 1.10,
    length: 2.04,
    height: 2.68,
    deductionArea: 1.82,
    switchCount: 1,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: false, ref_wall_ceramic: true, ref_wall_paint: false,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: true
    }
  },
  {
    id: 'r19',
    name: 'Área de Serviço',
    type: 'terreo',
    width: 1.00,
    length: 8.86,
    height: 3.50,
    deductionArea: 5.55,
    switchCount: 0,
    socketCount: 0,
    tasks: {
      demo_floor: false, demo_wall: false, demo_ceiling: false,
      ref_floor_ceramic: false, ref_floor_screed: false,
      ref_wall_plaster: true, ref_wall_ceramic: false, ref_wall_paint: true,
      ref_ceiling_gypsum: false, ref_ceiling_plaster: false, ref_ceiling_paint: false, ref_ceiling_pvc: false
    }
  }
];