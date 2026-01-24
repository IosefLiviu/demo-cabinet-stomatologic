import { useRef, useState, Suspense, useCallback, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Environment, Html, ContactShadows, useGLTF, Tube } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Pencil, MousePointer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface DiagnosticPoint {
  id: string;
  position: [number, number, number];
  label: string;
}

export interface DiagnosticLine {
  id: string;
  points: [number, number, number][];
  label: string;
}

interface Tooth3DViewerProps {
  toothNumber: number;
  status: string;
  statusColor?: string;
  diagnosticPoints: DiagnosticPoint[];
  diagnosticLines?: DiagnosticLine[];
  onAddDiagnostic: (position: [number, number, number], label: string) => void;
  onAddDiagnosticLine?: (points: [number, number, number][], label: string) => void;
  onRemoveDiagnostic: (id: string) => void;
  onRemoveDiagnosticLine?: (id: string) => void;
}

// Model paths for each tooth type
const MODEL_PATHS = {
  molar: '/models/molar/scene.gltf',
  premolar: '/models/premolar/scene.gltf',
  canine: '/models/canine/scene.gltf',
  incisor: '/models/incisor/scene.gltf',
};

// Preload all models
useGLTF.preload(MODEL_PATHS.molar);
useGLTF.preload(MODEL_PATHS.premolar);
useGLTF.preload(MODEL_PATHS.canine);
useGLTF.preload(MODEL_PATHS.incisor);

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

// 3D Tube component for diagnostic lines
function DiagnosticTube({ points, label }: { points: [number, number, number][]; label: string }) {
  if (points.length < 2) return null;
  
  const curve = useMemo(() => {
    const vectors = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
  }, [points]);

  // Get middle point for label
  const midPoint = useMemo(() => {
    return curve.getPoint(0.5);
  }, [curve]);

  return (
    <group>
      <Tube args={[curve, 64, 0.03, 8, false]}>
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444" 
          emissiveIntensity={0.3}
          roughness={0.3}
        />
      </Tube>
      {/* End caps */}
      <mesh position={points[0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={points[points.length - 1]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      {/* Label at midpoint */}
      <Html
        position={[midPoint.x, midPoint.y + 0.15, midPoint.z]}
        className="pointer-events-none"
        style={{ transform: 'translate(-50%, -100%)' }}
      >
        <div className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap max-w-[150px] truncate">
          {label}
        </div>
      </Html>
    </group>
  );
}

// Drawing line preview during drag
function DrawingPreview({ points }: { points: [number, number, number][] }) {
  if (points.length < 2) return null;
  
  const curve = useMemo(() => {
    const vectors = points.map(p => new THREE.Vector3(...p));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.5);
  }, [points]);

  return (
    <Tube args={[curve, 64, 0.03, 8, false]}>
      <meshStandardMaterial 
        color="#22c55e" 
        emissive="#22c55e" 
        emissiveIntensity={0.5}
        transparent
        opacity={0.7}
      />
    </Tube>
  );
}

// Convert world point to local coordinates within the group
function worldToLocal(
  worldPoint: THREE.Vector3, 
  groupRef: React.RefObject<THREE.Group>,
  scale: number
): [number, number, number] {
  if (!groupRef.current) {
    return [worldPoint.x, worldPoint.y, worldPoint.z];
  }

  // Ensure matrices are up-to-date (important on mobile/touch where frame timing differs)
  groupRef.current.updateWorldMatrix(true, false);
  
  // Create inverse matrix of the group's world transform
  const inverseMatrix = new THREE.Matrix4();
  inverseMatrix.copy(groupRef.current.matrixWorld).invert();
  
  // Transform world point to local space
  const localPoint = worldPoint.clone().applyMatrix4(inverseMatrix);
  
  // Apply scale back (since we divide by scale when rendering)
  return [localPoint.x * scale, localPoint.y * scale, localPoint.z * scale];
}

// Interactive 3D Tooth Mesh using loaded GLTF model
function ToothMesh({ 
  toothNumber, 
  statusColor,
  diagnosticPoints,
  diagnosticLines,
  onPointClick,
  selectedPoint,
  drawMode,
  isDrawing,
  drawingPoints,
  pendingLine,
  onDrawStart,
  onDrawMove,
  onDrawEnd,
  orbitControlsRef,
}: { 
  toothNumber: number;
  statusColor?: string;
  diagnosticPoints: DiagnosticPoint[];
  diagnosticLines: DiagnosticLine[];
  onPointClick: (position: [number, number, number]) => void;
  selectedPoint: [number, number, number] | null;
  drawMode: 'point' | 'line';
  isDrawing: boolean;
  drawingPoints: [number, number, number][];
  pendingLine: [number, number, number][] | null;
  onDrawStart: (position: [number, number, number]) => void;
  onDrawMove: (position: [number, number, number]) => void;
  onDrawEnd: () => void;
  orbitControlsRef: React.RefObject<any>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const toothType = getToothType(toothNumber);
  const deciduous = isDeciduous(toothNumber);
  const lower = isLowerTooth(toothNumber);
  
  // Load the 3D model
  const { scene } = useGLTF(MODEL_PATHS[toothType]);
  
  // Clone the scene to avoid sharing issues
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    
    // Apply custom material if status color is provided
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          const originalMaterial = child.material as THREE.MeshStandardMaterial;
          const newMaterial = new THREE.MeshPhysicalMaterial({
            color: statusColor || originalMaterial.color || '#f8f6f0',
            roughness: 0.2,
            metalness: 0.02,
            clearcoat: 0.5,
            clearcoatRoughness: 0.2,
            map: originalMaterial.map,
            normalMap: originalMaterial.normalMap,
          });
          child.material = newMaterial;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      }
    });
    
    return clone;
  }, [scene, statusColor]);
  
  // Update emissive on hover
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
        child.material.emissive = new THREE.Color(hovered ? '#ffffff' : '#000000');
        child.material.emissiveIntensity = hovered ? 0.1 : 0;
      }
    });
  }, [hovered, clonedScene]);
  
  // Center the model by computing bounding box
  useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.sub(center);
  }, [clonedScene]);

  // Handle pointer down - start drawing or add point
  const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const point = event.point;
    // Convert world point to local coordinates within the group
    const localPoint = worldToLocal(point, meshRef, deciduous ? 0.35 : 0.4);
    
    if (drawMode === 'line') {
      // Disable orbit controls while drawing
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = false;
      }
      onDrawStart(localPoint);
    } else {
      onPointClick(localPoint);
    }
  }, [drawMode, onPointClick, onDrawStart, orbitControlsRef, deciduous]);

  // Handle pointer move - continue drawing
  const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (isDrawing && drawMode === 'line') {
      const point = event.point;
      // Convert world point to local coordinates within the group
      const localPoint = worldToLocal(point, meshRef, deciduous ? 0.35 : 0.4);
      onDrawMove(localPoint);
    }
  }, [isDrawing, drawMode, onDrawMove, deciduous]);

  // Handle pointer up - finish drawing
  const handlePointerUp = useCallback(() => {
    if (isDrawing && drawMode === 'line') {
      // Re-enable orbit controls
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = true;
      }
      onDrawEnd();
    }
  }, [isDrawing, drawMode, onDrawEnd, orbitControlsRef]);

  // Scale and positioning
  const scale = deciduous ? 0.35 : 0.4;

  return (
    <group 
      ref={meshRef} 
      rotation={[lower ? 0 : Math.PI, 0, 0]}
      position={[0, 0, 0]}
      scale={scale}
    >
      {/* Main tooth model */}
      <primitive 
        object={clonedScene}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Diagnostic Lines (Tubes) */}
      {diagnosticLines.map((line) => (
        <DiagnosticTube 
          key={line.id} 
          points={line.points.map(p => [p[0] / scale, p[1] / scale, p[2] / scale] as [number, number, number])} 
          label={line.label} 
        />
      ))}

      {/* Drawing preview - while actively drawing */}
      {isDrawing && drawingPoints.length >= 2 && (
        <DrawingPreview 
          points={drawingPoints.map(p => [p[0] / scale, p[1] / scale, p[2] / scale] as [number, number, number])} 
        />
      )}

      {/* Pending line preview - after drawing, waiting for label */}
      {pendingLine && pendingLine.length >= 2 && (
        <DrawingPreview 
          points={pendingLine.map(p => [p[0] / scale, p[1] / scale, p[2] / scale] as [number, number, number])} 
        />
      )}

      {/* Diagnostic Points Markers - larger on mobile for touch */}
      {diagnosticPoints.map((point) => (
        <group key={point.id} position={point.position.map(p => p / scale) as [number, number, number]}>
          <mesh>
            {/* Larger sphere for better touch targets */}
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
          </mesh>
          <Html
            position={[0.2, 0.2, 0]}
            className="pointer-events-none"
            style={{ transform: 'translate(-50%, -100%)' }}
          >
            <div className="bg-destructive text-destructive-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-lg whitespace-nowrap max-w-[100px] sm:max-w-[150px] truncate">
              {point.label}
            </div>
          </Html>
        </group>
      ))}

      {/* Selected point indicator - larger for mobile visibility */}
      {selectedPoint && (
        <mesh position={selectedPoint.map(p => p / scale) as [number, number, number]}>
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
        <span>Se încarcă modelul 3D...</span>
      </div>
    </Html>
  );
}

export function Tooth3DViewer({ 
  toothNumber, 
  status,
  statusColor,
  diagnosticPoints,
  diagnosticLines = [],
  onAddDiagnostic,
  onAddDiagnosticLine,
  onRemoveDiagnostic,
  onRemoveDiagnosticLine,
}: Tooth3DViewerProps) {
  const [selectedPoint, setSelectedPoint] = useState<[number, number, number] | null>(null);
  const [newDiagnostic, setNewDiagnostic] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [drawMode, setDrawMode] = useState<'point' | 'line'>('point');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<[number, number, number][]>([]);
  const [pendingLine, setPendingLine] = useState<[number, number, number][] | null>(null);
  const orbitControlsRef = useRef<any>(null);

  const handlePointClick = useCallback((position: [number, number, number]) => {
    if (drawMode === 'point') {
      setSelectedPoint(position);
      setIsAdding(true);
    }
  }, [drawMode]);

  const handleDrawStart = useCallback((position: [number, number, number]) => {
    setIsDrawing(true);
    setDrawingPoints([position]);
  }, []);

  const handleDrawMove = useCallback((position: [number, number, number]) => {
    setDrawingPoints(prev => {
      // Only add point if it's far enough from the last point (to avoid too many points)
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const dist = Math.sqrt(
          Math.pow(position[0] - last[0], 2) +
          Math.pow(position[1] - last[1], 2) +
          Math.pow(position[2] - last[2], 2)
        );
        if (dist < 0.02) return prev; // Skip if too close
      }
      return [...prev, position];
    });
  }, []);

  const handleDrawEnd = useCallback(() => {
    setIsDrawing(false);
    if (drawingPoints.length >= 2) {
      setPendingLine(drawingPoints);
      setIsAdding(true);
    }
    setDrawingPoints([]);
  }, [drawingPoints]);

  const handleAddDiagnostic = useCallback(() => {
    if (drawMode === 'point' && selectedPoint && newDiagnostic.trim()) {
      onAddDiagnostic(selectedPoint, newDiagnostic.trim());
      setNewDiagnostic('');
      setSelectedPoint(null);
      setIsAdding(false);
    } else if (drawMode === 'line' && pendingLine && newDiagnostic.trim() && onAddDiagnosticLine) {
      onAddDiagnosticLine(pendingLine, newDiagnostic.trim());
      setNewDiagnostic('');
      setPendingLine(null);
      setIsAdding(false);
    }
  }, [drawMode, selectedPoint, pendingLine, newDiagnostic, onAddDiagnostic, onAddDiagnosticLine]);

  const handleCancel = useCallback(() => {
    setSelectedPoint(null);
    setPendingLine(null);
    setNewDiagnostic('');
    setIsAdding(false);
    setDrawingPoints([]);
    setIsDrawing(false);
  }, []);

  const totalDiagnostics = diagnosticPoints.length + diagnosticLines.length;

  return (
    <div className="flex flex-col w-full h-full touch-none">
      {/* 3D Canvas Container - responsive height */}
      <div className="relative flex-1 min-h-[280px] sm:min-h-[350px]">
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          className="rounded-lg bg-gradient-to-b from-slate-900 to-slate-800 touch-none"
          style={{ touchAction: 'none' }}
        >
          <Suspense fallback={<LoadingFallback />}>
            {/* Lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
            <directionalLight position={[-5, 3, -5]} intensity={0.6} />
            <pointLight position={[0, 3, 3]} intensity={0.5} color="#fff5e6" />
            
            {/* Environment for realistic reflections */}
            <Environment preset="studio" />
            
            {/* Contact shadow for grounding */}
            <ContactShadows 
              position={[0, -1.5, 0]} 
              opacity={0.4} 
              scale={4} 
              blur={2} 
              far={2} 
            />
            
            {/* The 3D Tooth */}
            <ToothMesh 
              toothNumber={toothNumber}
              statusColor={statusColor}
              diagnosticPoints={diagnosticPoints}
              diagnosticLines={diagnosticLines}
              onPointClick={handlePointClick}
              selectedPoint={selectedPoint}
              drawMode={drawMode}
              isDrawing={isDrawing}
              drawingPoints={drawingPoints}
              pendingLine={pendingLine}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              orbitControlsRef={orbitControlsRef}
            />
            
            {/* Controls - enable touch for mobile */}
            <OrbitControls 
              ref={orbitControlsRef}
              enablePan={false}
              minDistance={1}
              maxDistance={10}
              minPolarAngle={Math.PI * 0.1}
              maxPolarAngle={Math.PI * 0.9}
              touches={{
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_ROTATE
              }}
            />
          </Suspense>
        </Canvas>

        {/* Drawing mode toggle - larger touch targets on mobile */}
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border">
          <Button
            size="sm"
            variant={drawMode === 'point' ? 'default' : 'ghost'}
            className="h-10 w-10 sm:h-8 sm:w-auto sm:px-2 p-0"
            onClick={() => setDrawMode('point')}
            title="Mod punct"
          >
            <MousePointer className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            size="sm"
            variant={drawMode === 'line' ? 'default' : 'ghost'}
            className="h-10 w-10 sm:h-8 sm:w-auto sm:px-2 p-0"
            onClick={() => setDrawMode('line')}
            title="Mod linie (drag)"
          >
            <Pencil className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Instructions overlay - responsive text */}
        <div className="absolute top-2 sm:top-3 left-24 sm:left-24 right-2 sm:right-3 flex justify-between items-start pointer-events-none">
          <div className="hidden sm:block bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
            {drawMode === 'point' ? (
              <p>🖱️ Trage pentru a roti | 🔍 Scroll zoom | 📍 Click = punct</p>
            ) : (
              <p>✏️ Ține apăsat și trage | 🔍 Scroll zoom | 💡 Eliberează = linie</p>
            )}
          </div>
          {/* Mobile instructions - shorter */}
          <div className="sm:hidden bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-muted-foreground">
            {drawMode === 'point' ? '📍 Tap = punct' : '✏️ Trage = linie'}
          </div>
          <div className={cn(
            "px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium",
            statusColor ? 'text-white' : 'text-foreground bg-muted'
          )} style={statusColor ? { backgroundColor: statusColor } : undefined}>
            {status}
          </div>
        </div>

        {/* Attribution kept in license.txt files per CC-BY-4.0 requirements */}
      </div>

      {/* Diagnostic input panel - BELOW the canvas, mobile optimized */}
      {isAdding && (selectedPoint || pendingLine) && (
        <div className="mt-2 sm:mt-3 bg-muted/50 rounded-lg p-2 sm:p-3 border animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {drawMode === 'line' ? 'Adaugă diagnostic linie' : 'Adaugă diagnostic punct'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newDiagnostic}
              onChange={(e) => setNewDiagnostic(e.target.value)}
              placeholder={drawMode === 'line' ? 'ex: Canal radicular...' : 'Diagnostic...'}
              className="flex-1 text-base sm:text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddDiagnostic();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddDiagnostic} disabled={!newDiagnostic.trim()} className="flex-1 sm:flex-none h-10 sm:h-8">
                Adaugă
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel} className="flex-1 sm:flex-none h-10 sm:h-8">
                Anulează
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic items list - BELOW the canvas, mobile optimized */}
      {totalDiagnostics > 0 && !isAdding && (
        <div className="mt-2 sm:mt-3 bg-muted/50 rounded-lg p-2 border max-h-[100px] sm:max-h-[120px] overflow-y-auto">
          <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 px-1">
            Diagnostice ({totalDiagnostics})
          </div>
          <div className="space-y-1">
            {/* Points */}
            {diagnosticPoints.map((point) => (
              <div 
                key={point.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 sm:py-1.5 rounded-md bg-background/50 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{point.label}</span>
                </div>
                <button
                  onClick={() => onRemoveDiagnostic(point.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-sm p-1 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))}
            {/* Lines */}
            {diagnosticLines.map((line) => (
              <div 
                key={line.id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 sm:py-1.5 rounded-md bg-background/50 hover:bg-background transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-0.5 bg-destructive rounded flex-shrink-0" />
                  <span className="text-xs sm:text-sm truncate">{line.label}</span>
                </div>
                {onRemoveDiagnosticLine && (
                  <button
                    onClick={() => onRemoveDiagnosticLine(line.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors text-sm p-1 flex-shrink-0"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
