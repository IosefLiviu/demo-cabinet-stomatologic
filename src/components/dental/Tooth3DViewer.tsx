import { useRef, useState, Suspense, useCallback } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
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
  
  // Gentle rotation animation
  useFrame((state) => {
    if (meshRef.current && !hovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  // Handle click on tooth to add diagnostic point
  const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point = event.point;
    onPointClick([point.x, point.y, point.z]);
  }, [onPointClick]);

  // Crown color based on status
  const crownColor = statusColor ? statusColor : '#f5f5f0';
  const rootColor = '#e8d4b8';
  const scale = deciduous ? 0.7 : 1;

  return (
    <group ref={meshRef} rotation={[lower ? Math.PI : 0, 0, 0]} scale={scale}>
      {/* Main tooth body based on type */}
      {toothType === 'molar' && (
        <group>
          {/* Molar Crown - wider, with cusps */}
          <mesh 
            position={[0, 0.3, 0]} 
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <boxGeometry args={[0.9, 0.6, 0.7]} />
            <meshStandardMaterial 
              color={crownColor} 
              roughness={0.3}
              metalness={0.1}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={hovered ? 0.1 : 0}
            />
          </mesh>
          {/* Cusps */}
          {[[-0.25, 0.65, -0.2], [0.25, 0.65, -0.2], [-0.25, 0.65, 0.2], [0.25, 0.65, 0.2]].map((pos, i) => (
            <mesh key={i} position={pos as [number, number, number]} onClick={handleClick}>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial color={crownColor} roughness={0.3} />
            </mesh>
          ))}
          {/* Roots - 3 roots for molars */}
          <mesh position={[-0.25, -0.4, 0]}>
            <coneGeometry args={[0.15, 0.8, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.25, -0.4, -0.15]}>
            <coneGeometry args={[0.12, 0.7, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
          </mesh>
          <mesh position={[0.25, -0.4, 0.15]}>
            <coneGeometry args={[0.12, 0.7, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
          </mesh>
        </group>
      )}

      {toothType === 'premolar' && (
        <group>
          {/* Premolar Crown */}
          <mesh 
            position={[0, 0.3, 0]} 
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <cylinderGeometry args={[0.35, 0.4, 0.6, 8]} />
            <meshStandardMaterial 
              color={crownColor} 
              roughness={0.3}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={hovered ? 0.1 : 0}
            />
          </mesh>
          {/* Two cusps */}
          <mesh position={[-0.1, 0.65, 0]} onClick={handleClick}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={crownColor} roughness={0.3} />
          </mesh>
          <mesh position={[0.1, 0.65, 0]} onClick={handleClick}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial color={crownColor} roughness={0.3} />
          </mesh>
          {/* Single or bifurcated root */}
          <mesh position={[0, -0.35, 0]}>
            <coneGeometry args={[0.18, 0.7, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
          </mesh>
        </group>
      )}

      {toothType === 'canine' && (
        <group>
          {/* Canine Crown - pointed */}
          <mesh 
            position={[0, 0.3, 0]} 
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <coneGeometry args={[0.3, 0.7, 8]} />
            <meshStandardMaterial 
              color={crownColor} 
              roughness={0.3}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={hovered ? 0.1 : 0}
            />
          </mesh>
          {/* Long single root */}
          <mesh position={[0, -0.45, 0]}>
            <coneGeometry args={[0.15, 0.9, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
          </mesh>
        </group>
      )}

      {toothType === 'incisor' && (
        <group>
          {/* Incisor Crown - flat and wide */}
          <mesh 
            position={[0, 0.25, 0]} 
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            <boxGeometry args={[0.5, 0.5, 0.25]} />
            <meshStandardMaterial 
              color={crownColor} 
              roughness={0.3}
              emissive={hovered ? '#ffffff' : '#000000'}
              emissiveIntensity={hovered ? 0.1 : 0}
            />
          </mesh>
          {/* Rounded edge */}
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={handleClick}>
            <cylinderGeometry args={[0.12, 0.25, 0.25, 16]} />
            <meshStandardMaterial color={crownColor} roughness={0.3} />
          </mesh>
          {/* Single root */}
          <mesh position={[0, -0.35, 0]}>
            <coneGeometry args={[0.12, 0.7, 8]} />
            <meshStandardMaterial color={rootColor} roughness={0.5} />
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
