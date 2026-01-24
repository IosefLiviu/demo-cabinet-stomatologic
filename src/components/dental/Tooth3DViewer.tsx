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

// Procedural 3D tooth geometry based on tooth type
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

// Create realistic tooth geometry using LatheGeometry for smooth organic shapes
function createToothGeometry(toothType: 'molar' | 'premolar' | 'canine' | 'incisor') {
  const points: THREE.Vector2[] = [];
  
  if (toothType === 'molar') {
    // Molar profile - wide crown with multiple roots
    points.push(new THREE.Vector2(0, -0.9));      // Root tip
    points.push(new THREE.Vector2(0.08, -0.85));
    points.push(new THREE.Vector2(0.12, -0.7));
    points.push(new THREE.Vector2(0.15, -0.5));   // Root neck
    points.push(new THREE.Vector2(0.18, -0.3));
    points.push(new THREE.Vector2(0.35, -0.1));   // CEJ (cervical line)
    points.push(new THREE.Vector2(0.45, 0.1));    // Crown begins
    points.push(new THREE.Vector2(0.5, 0.25));
    points.push(new THREE.Vector2(0.48, 0.4));    // Crown bulge
    points.push(new THREE.Vector2(0.42, 0.5));
    points.push(new THREE.Vector2(0.35, 0.55));   // Occlusal surface start
    points.push(new THREE.Vector2(0.25, 0.52));
    points.push(new THREE.Vector2(0.15, 0.58));   // Cusp
    points.push(new THREE.Vector2(0.08, 0.5));
    points.push(new THREE.Vector2(0, 0.55));      // Central fissure
  } else if (toothType === 'premolar') {
    // Premolar profile - smaller crown with 2 cusps
    points.push(new THREE.Vector2(0, -0.85));
    points.push(new THREE.Vector2(0.06, -0.8));
    points.push(new THREE.Vector2(0.1, -0.6));
    points.push(new THREE.Vector2(0.12, -0.4));
    points.push(new THREE.Vector2(0.15, -0.2));
    points.push(new THREE.Vector2(0.28, 0));      // CEJ
    points.push(new THREE.Vector2(0.35, 0.15));
    points.push(new THREE.Vector2(0.38, 0.3));
    points.push(new THREE.Vector2(0.35, 0.45));
    points.push(new THREE.Vector2(0.28, 0.55));   // Cusp
    points.push(new THREE.Vector2(0.15, 0.48));
    points.push(new THREE.Vector2(0.08, 0.55));   // Second cusp
    points.push(new THREE.Vector2(0, 0.5));
  } else if (toothType === 'canine') {
    // Canine profile - pointed single cusp
    points.push(new THREE.Vector2(0, -0.95));     // Long root
    points.push(new THREE.Vector2(0.05, -0.9));
    points.push(new THREE.Vector2(0.1, -0.7));
    points.push(new THREE.Vector2(0.12, -0.5));
    points.push(new THREE.Vector2(0.14, -0.3));
    points.push(new THREE.Vector2(0.18, -0.1));
    points.push(new THREE.Vector2(0.3, 0.1));     // CEJ
    points.push(new THREE.Vector2(0.35, 0.25));
    points.push(new THREE.Vector2(0.32, 0.4));
    points.push(new THREE.Vector2(0.25, 0.55));
    points.push(new THREE.Vector2(0.15, 0.65));
    points.push(new THREE.Vector2(0.08, 0.72));
    points.push(new THREE.Vector2(0, 0.78));      // Sharp cusp tip
  } else {
    // Incisor profile - flat edge
    points.push(new THREE.Vector2(0, -0.8));
    points.push(new THREE.Vector2(0.05, -0.75));
    points.push(new THREE.Vector2(0.08, -0.6));
    points.push(new THREE.Vector2(0.1, -0.4));
    points.push(new THREE.Vector2(0.12, -0.2));
    points.push(new THREE.Vector2(0.22, 0));      // CEJ
    points.push(new THREE.Vector2(0.3, 0.15));
    points.push(new THREE.Vector2(0.32, 0.3));
    points.push(new THREE.Vector2(0.3, 0.45));
    points.push(new THREE.Vector2(0.25, 0.55));
    points.push(new THREE.Vector2(0.2, 0.58));    // Incisal edge
    points.push(new THREE.Vector2(0, 0.6));
  }
  
  return new THREE.LatheGeometry(points, 32);
}

// Realistic Tooth Materials
function useToothMaterials(statusColor: string | undefined, hovered: boolean) {
  return useMemo(() => {
    // Enamel material (crown) - slightly translucent, pearly
    const enamelColor = statusColor || '#f8f6f0';
    const enamel = new THREE.MeshPhysicalMaterial({
      color: enamelColor,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      transmission: 0.05,
      thickness: 0.5,
      emissive: hovered ? '#ffffff' : '#000000',
      emissiveIntensity: hovered ? 0.15 : 0,
    });
    
    // Dentin/Root material - more yellow, rougher
    const dentin = new THREE.MeshStandardMaterial({
      color: '#e8d8c0',
      roughness: 0.6,
      metalness: 0,
    });
    
    return { enamel, dentin };
  }, [statusColor, hovered]);
}

// Interactive 3D Tooth Mesh with realistic geometry
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
  
  const { enamel, dentin } = useToothMaterials(statusColor, hovered);
  
  // Create the tooth geometry
  const toothGeometry = useMemo(() => createToothGeometry(toothType), [toothType]);
  
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

  return (
    <group ref={meshRef} rotation={[lower ? Math.PI : 0, 0, 0]} scale={scale}>
      {/* Main tooth body */}
      <mesh 
        geometry={toothGeometry}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={statusColor || '#f8f6f0'}
          roughness={0.15}
          metalness={0.02}
          clearcoat={0.6}
          clearcoatRoughness={0.2}
          emissive={hovered ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered ? 0.12 : 0}
        />
      </mesh>
      
      {/* Add extra geometry for molars - additional cusps */}
      {toothType === 'molar' && (
        <group>
          {/* Extra cusp bumps */}
          {[
            [-0.2, 0.5, -0.15],
            [0.2, 0.5, -0.15],
            [-0.2, 0.5, 0.15],
            [0.2, 0.5, 0.15],
          ].map((pos, i) => (
            <mesh 
              key={i} 
              position={pos as [number, number, number]} 
              onClick={handleClick}
              castShadow
            >
              <sphereGeometry args={[0.12, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshPhysicalMaterial
                color={statusColor || '#f8f6f0'}
                roughness={0.15}
                metalness={0.02}
                clearcoat={0.6}
              />
            </mesh>
          ))}
          {/* Central fissure groove */}
          <mesh position={[0, 0.48, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.02, 8, 32]} />
            <meshStandardMaterial color="#d4c4a8" roughness={0.8} />
          </mesh>
        </group>
      )}
      
      {/* Add second cusp for premolars */}
      {toothType === 'premolar' && (
        <group>
          <mesh position={[-0.12, 0.5, 0]} onClick={handleClick} castShadow>
            <sphereGeometry args={[0.1, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial
              color={statusColor || '#f8f6f0'}
              roughness={0.15}
              metalness={0.02}
              clearcoat={0.6}
            />
          </mesh>
          <mesh position={[0.12, 0.5, 0]} onClick={handleClick} castShadow>
            <sphereGeometry args={[0.08, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial
              color={statusColor || '#f8f6f0'}
              roughness={0.15}
              metalness={0.02}
              clearcoat={0.6}
            />
          </mesh>
        </group>
      )}
      
      {/* Root bifurcation for molars */}
      {toothType === 'molar' && (
        <group>
          {/* Additional roots */}
          <mesh position={[-0.15, -0.7, 0.1]} rotation={[0.15, 0, 0.1]}>
            <coneGeometry args={[0.08, 0.4, 12]} />
            <meshStandardMaterial color="#e0d0b8" roughness={0.5} />
          </mesh>
          <mesh position={[0.15, -0.7, 0.1]} rotation={[0.15, 0, -0.1]}>
            <coneGeometry args={[0.08, 0.4, 12]} />
            <meshStandardMaterial color="#e0d0b8" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.7, -0.12]} rotation={[-0.15, 0, 0]}>
            <coneGeometry args={[0.07, 0.35, 12]} />
            <meshStandardMaterial color="#e0d0b8" roughness={0.5} />
          </mesh>
        </group>
      )}

      {/* Diagnostic Points Markers */}
      {diagnosticPoints.map((point) => (
        <group key={point.id} position={point.position}>
          <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Html
            position={[0.15, 0.15, 0]}
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
          <sphereGeometry args={[0.1, 16, 16]} />
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
        camera={{ position: [0, 0, 3], fov: 50 }}
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
            position={[0, -1.2, 0]} 
            opacity={0.4} 
            scale={3} 
            blur={2} 
            far={2} 
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
            minDistance={2}
            maxDistance={5}
            minPolarAngle={Math.PI * 0.2}
            maxPolarAngle={Math.PI * 0.8}
          />
        </Suspense>
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
          <p>🖱️ Trage pentru a roti</p>
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
