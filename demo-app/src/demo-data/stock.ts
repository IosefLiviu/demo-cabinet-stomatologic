export interface DemoStockItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  price_per_unit: number;
}

export const DEMO_STOCK: DemoStockItem[] = [
  { id: "stk-1", name: "Compozit A2", category: "Materiale", quantity: 15, unit: "seringi", min_quantity: 5, price_per_unit: 85 },
  { id: "stk-2", name: "Mănuși Latex M", category: "Consumabile", quantity: 200, unit: "buc", min_quantity: 50, price_per_unit: 0.5 },
  { id: "stk-3", name: "Anestezie Articaine", category: "Medicamente", quantity: 45, unit: "fiole", min_quantity: 20, price_per_unit: 12 },
  { id: "stk-4", name: "Ace Anestezice 27G", category: "Consumabile", quantity: 80, unit: "buc", min_quantity: 30, price_per_unit: 2.5 },
  { id: "stk-5", name: "Cement Ionomer Sticlă", category: "Materiale", quantity: 8, unit: "seringi", min_quantity: 3, price_per_unit: 120 },
  { id: "stk-6", name: "Freze Diamantate", category: "Instrumente", quantity: 25, unit: "buc", min_quantity: 10, price_per_unit: 18 },
  { id: "stk-7", name: "Sterilizant Suprafețe", category: "Dezinfectante", quantity: 3, unit: "litri", min_quantity: 2, price_per_unit: 45 },
  { id: "stk-8", name: "Gutapercă Cone", category: "Endodonție", quantity: 120, unit: "buc", min_quantity: 40, price_per_unit: 1.8 },
  { id: "stk-9", name: "Bonding Agent", category: "Materiale", quantity: 6, unit: "sticle", min_quantity: 2, price_per_unit: 150 },
  { id: "stk-10", name: "Tăvițe Examinare", category: "Consumabile", quantity: 500, unit: "buc", min_quantity: 100, price_per_unit: 0.3 },
];
