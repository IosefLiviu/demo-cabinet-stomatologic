import { useRef, useState, Suspense, useCallback, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DiagnosticPoint {
  id: string;
  position: [number, number, number];
  label: string;
}

interface Tooth3DViewerProps {
  toothNumber: number;
  status: string;
  statusColor?: string;
  diagnosticPoints: DiagnosticPoint[];
  onAddDiagnostic: (position: [number, number, number], label: string) => void;
  onRemoveDiagnostic: (id: string) => void;
}

// Determine tooth type based on FDI notation
function getToothType(toothNumber: number): 'molar' | 'premolar' | 'canine' | 'incisor' {
  const lastDigit = toothNumber % 10;
  if (lastDigit >= 6 && lastDigit <= 8) return 'molar';
  if (lastDigit >= 4 && lastDigit <= 5) return 'premolar';
  if (lastDigit === 3) return 'canine';
  return 'incisor';
}

function isDeciduous(toothNumber: number): boolean {
  return toothNumber >= 51 && toothNumber <= 85;
}

function isLowerTooth(toothNumber: number): boolean {
  const firstDigit = Math.floor(toothNumber / 10);
  return firstDigit === 3 || firstDigit === 4 || firstDigit === 7 || firstDigit === 8;
}

// Create realistic anatomical tooth geometry using multiple shapes
function createAnatomicalTooth(toothType: 'molar' | 'premolar' | 'canine' | 'incisor'): THREE.Group {
  const group = new THREE.Group();
  
  // Tooth colors
  const enamelColor = '#f5f3ed';
  const dentinColor = '#e8dcc8';
  const rootColor = '#d4c4a8';
  
  const enamelMaterial = new THREE.MeshPhysicalMaterial({
    color: enamelColor,
    roughness: 0.12,
    metalness: 0.02,
    clearcoat: 0.8,
    clearcoatRoughness: 0.15,
  });
  
  const rootMaterial = new THREE.MeshStandardMaterial({
    color: rootColor,
    roughness: 0.5,
    metalness: 0,
  });

  if (toothType === 'molar') {
    // Crown - wide, flat top with cusps
    const crownGeom = new THREE.CylinderGeometry(0.45, 0.42, 0.5, 32);
    const crown = new THREE.Mesh(crownGeom, enamelMaterial);
    crown.position.y = 0.25;
    group.add(crown);
    
    // Add 4 cusps
    const cuspPositions = [
      [-0.18, 0.55, -0.18],
      [0.18, 0.55, -0.18],
      [-0.18, 0.55, 0.18],
      [0.18, 0.55, 0.18],
    ];
    cuspPositions.forEach(pos => {
      const cuspGeom = new THREE.SphereGeometry(0.15, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
      const cusp = new THREE.Mesh(cuspGeom, enamelMaterial);
      cusp.position.set(pos[0], pos[1], pos[2]);
      group.add(cusp);
    });
    
    // Central fissure
    const fissureGeom = new THREE.TorusGeometry(0.12, 0.025, 8, 16);
    const fissureMat = new THREE.MeshStandardMaterial({ color: '#c4b496', roughness: 0.8 });
    const fissure = new THREE.Mesh(fissureGeom, fissureMat);
    fissure.position.y = 0.52;
    fissure.rotation.x = Math.PI / 2;
    group.add(fissure);
    
    // Neck (CEJ)
    const neckGeom = new THREE.CylinderGeometry(0.35, 0.25, 0.15, 24);
    const neck = new THREE.Mesh(neckGeom, enamelMaterial);
    neck.position.y = -0.05;
    group.add(neck);
    
    // 3 Roots
    const rootGeom = new THREE.ConeGeometry(0.1, 0.6, 12);
    const root1 = new THREE.Mesh(rootGeom, rootMaterial);
    root1.position.set(-0.15, -0.45, 0.08);
    root1.rotation.z = 0.1;
    group.add(root1);
    
    const root2 = new THREE.Mesh(rootGeom.clone(), rootMaterial);
    root2.position.set(0.15, -0.45, 0.08);
    root2.rotation.z = -0.1;
    group.add(root2);
    
    const root3 = new THREE.Mesh(rootGeom.clone(), rootMaterial);
    root3.position.set(0, -0.45, -0.12);
    group.add(root3);
    
  } else if (toothType === 'premolar') {
    // Crown - oval shape with 2 cusps
    const crownGeom = new THREE.CylinderGeometry(0.32, 0.3, 0.5, 24);
    const crown = new THREE.Mesh(crownGeom, enamelMaterial);
    crown.position.y = 0.25;
    group.add(crown);
    
    // 2 cusps
    const cusp1Geom = new THREE.SphereGeometry(0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cusp1 = new THREE.Mesh(cusp1Geom, enamelMaterial);
    cusp1.position.set(-0.1, 0.52, 0);
    group.add(cusp1);
    
    const cusp2Geom = new THREE.SphereGeometry(0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cusp2 = new THREE.Mesh(cusp2Geom, enamelMaterial);
    cusp2.position.set(0.1, 0.5, 0);
    group.add(cusp2);
    
    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.25, 0.18, 0.12, 20);
    const neck = new THREE.Mesh(neckGeom, enamelMaterial);
    neck.position.y = -0.03;
    group.add(neck);
    
    // Single root
    const rootGeom = new THREE.ConeGeometry(0.1, 0.7, 12);
    const root = new THREE.Mesh(rootGeom, rootMaterial);
    root.position.y = -0.45;
    group.add(root);
    
  } else if (toothType === 'canine') {
    // Crown - pointed, conical
    const crownGeom = new THREE.ConeGeometry(0.28, 0.65, 24);
    const crown = new THREE.Mesh(crownGeom, enamelMaterial);
    crown.position.y = 0.35;
    group.add(crown);
    
    // Base of crown
    const baseGeom = new THREE.CylinderGeometry(0.28, 0.22, 0.2, 20);
    const base = new THREE.Mesh(baseGeom, enamelMaterial);
    base.position.y = 0;
    group.add(base);
    
    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.2, 0.12, 0.1, 16);
    const neck = new THREE.Mesh(neckGeom, enamelMaterial);
    neck.position.y = -0.12;
    group.add(neck);
    
    // Long single root
    const rootGeom = new THREE.ConeGeometry(0.08, 0.85, 12);
    const root = new THREE.Mesh(rootGeom, rootMaterial);
    root.position.y = -0.55;
    group.add(root);
    
  } else {
    // Incisor - flat, shovel-shaped
    const crownGeom = new THREE.BoxGeometry(0.35, 0.55, 0.15);
    crownGeom.translate(0, 0.28, 0);
    // Round the edges
    const crown = new THREE.Mesh(crownGeom, enamelMaterial);
    group.add(crown);
    
    // Incisal edge - slightly rounded
    const edgeGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 16);
    edgeGeom.rotateZ(Math.PI / 2);
    const edge = new THREE.Mesh(edgeGeom, enamelMaterial);
    edge.position.y = 0.55;
    group.add(edge);
    
    // Neck
    const neckGeom = new THREE.CylinderGeometry(0.15, 0.1, 0.1, 16);
    const neck = new THREE.Mesh(neckGeom, enamelMaterial);
    neck.position.y = -0.03;
    group.add(neck);
    
    // Root
    const rootGeom = new THREE.ConeGeometry(0.07, 0.65, 12);
    const root = new THREE.Mesh(rootGeom, rootMaterial);
    root.position.y = -0.4;
    group.add(root);
  }
  
  return group;
}

// Interactive 3D Tooth Mesh
function ToothMesh({ 
  toothNumber, 
  statusColor,
  diagnosticPoints,
  onPointClick,
  selectedPoint,
}: { 
  toothNumber: number;
  statusColor?: string;
  diagnosticPoints: DiagnosticPoint[];
  onPointClick: (position: [number, number, number]) => void;
  selectedPoint: [number, number, number] | null;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const toothType = getToothType(toothNumber);
  const deciduous = isDeciduous(toothNumber);
  const lower = isLowerTooth(toothNumber);
  
  // Create the anatomical tooth
  const toothGroup = useMemo(() => {
    const tooth = createAnatomicalTooth(toothType);
    
    // Apply status color if present
    if (statusColor) {
      tooth.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (child.material instanceof THREE.MeshPhysicalMaterial) {
            child.material = new THREE.MeshPhysicalMaterial({
              color: statusColor,
              roughness: 0.12,
              metalness: 0.02,
              clearcoat: 0.8,
              clearcoatRoughness: 0.15,
              transparent: true,
              opacity: 0.9,
            });
          }
        }
      });
    }
    
    return tooth;
  }, [toothType, statusColor]);
  
  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current && !hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }
  });

  // Handle click on tooth to add diagnostic point
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point = event.point;
    onPointClick([point.x, point.y, point.z]);
  }, [onPointClick]);

  const scale = deciduous ? 0.8 : 1;

  // Update materials on hover
  useMemo(() => {
    toothGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        if (child.material instanceof THREE.MeshPhysicalMaterial) {
          child.material.emissive = new THREE.Color(hovered ? '#ffffff' : '#000000');
          child.material.emissiveIntensity = hovered ? 0.15 : 0;
        }
      }
    });
  }, [hovered, toothGroup]);

  return (
    <group 
      ref={meshRef} 
      rotation={[lower ? Math.PI : 0, 0, 0]} 
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <primitive object={toothGroup} />

      {/* Diagnostic Points Markers */}
      {diagnosticPoints.map((point) => (
        <group key={point.id} position={point.position}>
          <mesh>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Html
            position={[0.12, 0.12, 0]}
            className="pointer-events-none"
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap max-w-[150px] truncate">
              {point.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Selected point indicator */}
      {selectedPoint && (
        <mesh position={selectedPoint}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.8} transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <Html center>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Se încarcă...</span>
      </div>
    </Html>
  );
}

export function Tooth3DViewer({ 
  toothNumber, 
  status,
  statusColor,
  diagnosticPoints,
  onAddDiagnostic,
  onRemoveDiagnostic,
}: Tooth3DViewerProps) {
  const [selectedPoint, setSelectedPoint] = useState<[number, number, number] | null>(null);
  const [newDiagnostic, setNewDiagnostic] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handlePointClick = useCallback((position: [number, number, number]) => {
    setSelectedPoint(position);
    setIsAdding(true);
  }, []);

  const handleAddDiagnostic = useCallback(() => {
    if (selectedPoint && newDiagnostic.trim()) {
      onAddDiagnostic(selectedPoint, newDiagnostic.trim());
      setNewDiagnostic('');
      setSelectedPoint(null);
      setIsAdding(false);
    }
  }, [selectedPoint, newDiagnostic, onAddDiagnostic]);

  const handleCancel = useCallback(() => {
    setSelectedPoint(null);
    setNewDiagnostic('');
    setIsAdding(false);
  }, []);

  return (
    <div className="relative w-full h-full min-h-[300px]">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        className="rounded-lg bg-gradient-to-b from-slate-900 to-slate-800"
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight position={[-5, 3, -5]} intensity={0.5} />
          <pointLight position={[0, 2, 2]} intensity={0.5} color="#fff5e6" />
          
          {/* Environment for realistic reflections */}
          <Environment preset="studio" />
          
          {/* Contact shadow for grounding */}
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.4} 
            scale={2} 
            blur={2} 
            far={1.5} 
          />
          
          {/* The 3D Tooth */}
          <ToothMesh 
            toothNumber={toothNumber}
            statusColor={statusColor}
            diagnosticPoints={diagnosticPoints}
            onPointClick={handlePointClick}
            selectedPoint={selectedPoint}
          />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false}
            minDistance={1.5}
            maxDistance={5}
            minPolarAngle={Math.PI * 0.15}
            maxPolarAngle={Math.PI * 0.85}
          />
        </Suspense>
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <p>🖱️ Trage pentru a roti</p>
          <p>🔍 Scroll pentru zoom</p>
          <p>📍 Click pe dinte pentru diagnostic</p>
        </div>
        <div className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-medium",
          statusColor ? 'text-white' : 'text-foreground bg-muted'
        )} style={statusColor ? { backgroundColor: statusColor } : undefined}>
          {status}
        </div>
      </div>

      {/* Diagnostic input panel */}
      {isAdding && selectedPoint && (
        <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Adaugă diagnostic</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={newDiagnostic}
              onChange={(e) => setNewDiagnostic(e.target.value)}
              placeholder="Introdu diagnosticul..."
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddDiagnostic();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <Button size="sm" onClick={handleAddDiagnostic} disabled={!newDiagnostic.trim()}>
              Adaugă
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Anulează
            </Button>
          </div>
        </div>
      )}

      {/* Diagnostic points list */}
      {diagnosticPoints.length > 0 && !isAdding && (
        <div className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border max-h-[120px] overflow-y-auto">
          <div className="text-xs font-medium text-muted-foreground mb-1.5 px-1">
            Diagnostice ({diagnosticPoints.length})
          </div>
          <div className="space-y-1">
            {diagnosticPoints.map((point) => (
              <div 
                key={point.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-sm">{point.label}</span>
                </div>
                <button
                  onClick={() => onRemoveDiagnostic(point.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
