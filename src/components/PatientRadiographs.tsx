import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Upload,
  Download,
  Trash2,
  Image,
  Calendar,
  FileImage,
  Loader2,
  X,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Check,
  HardDrive,
  TrendingDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  usePatientRadiographs,
  PatientRadiograph,
  RadiographType,
  RADIOGRAPH_TYPE_LABELS,
  StorageStats,
} from '@/hooks/usePatientRadiographs';
import { formatBytes } from '@/lib/imageCompression';

interface PatientRadiographsProps {
  patientId: string;
  patientName: string;
}

export function PatientRadiographs({ patientId, patientName }: PatientRadiographsProps) {
  const {
    radiographs,
    storageStats,
    loading,
    uploading,
    fetchRadiographs,
    uploadRadiograph,
    deleteRadiograph,
    downloadRadiograph,
  } = usePatientRadiographs(patientId);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [radiographToDelete, setRadiographToDelete] = useState<PatientRadiograph | null>(null);

  // Compare mode state
  const [compareMode, setCompareMode] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<PatientRadiograph[]>([]);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [radiographType, setRadiographType] = useState<RadiographType | ''>('');
  const [takenAt, setTakenAt] = useState('');
  const [compressionQuality, setCompressionQuality] = useState<'high' | 'medium' | 'economic'>('medium');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRadiographs();
  }, [fetchRadiographs]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const result = await uploadRadiograph(selectedFile, {
      description: description || undefined,
      radiograph_type: radiographType || undefined,
      taken_at: takenAt || undefined,
      compressionQuality,
    });

    if (result) {
      resetUploadForm();
      setUploadDialogOpen(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDescription('');
    setRadiographType('');
    setTakenAt('');
    setCompressionQuality('medium');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmDelete = async () => {
    if (radiographToDelete) {
      await deleteRadiograph(radiographToDelete);
      setDeleteDialogOpen(false);
      setRadiographToDelete(null);
    }
  };

  const openViewer = (index: number) => {
    if (compareMode) {
      toggleCompareSelection(radiographs[index]);
    } else {
      setSelectedIndex(index);
      setViewerOpen(true);
    }
  };

  const navigateViewer = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedIndex((i) => (i > 0 ? i - 1 : radiographs.length - 1));
    } else {
      setSelectedIndex((i) => (i < radiographs.length - 1 ? i + 1 : 0));
    }
  };

  const toggleCompareSelection = (radiograph: PatientRadiograph) => {
    setSelectedForCompare((prev) => {
      const isSelected = prev.some((r) => r.id === radiograph.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== radiograph.id);
      }
      if (prev.length >= 2) {
        // Replace the oldest selection
        return [prev[1], radiograph];
      }
      return [...prev, radiograph];
    });
  };

  const startCompare = () => {
    if (selectedForCompare.length === 2) {
      setCompareDialogOpen(true);
    }
  };

  const exitCompareMode = () => {
    setCompareMode(false);
    setSelectedForCompare([]);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedRadiograph = radiographs[selectedIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with upload button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Radiografii ({radiographs.length})
        </h4>
        <div className="flex gap-2">
          {radiographs.length >= 2 && !compareMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCompareMode(true)}
            >
              <Columns2 className="h-4 w-4 mr-2" />
              Compară
            </Button>
          )}
          {compareMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={exitCompareMode}
              >
                <X className="h-4 w-4 mr-2" />
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={selectedForCompare.length !== 2}
                onClick={startCompare}
              >
                <Columns2 className="h-4 w-4 mr-2" />
                Compară ({selectedForCompare.length}/2)
              </Button>
            </>
          )}
          {!compareMode && (
            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Încarcă
            </Button>
          )}
        </div>
      </div>

      {/* Storage Statistics */}
      {radiographs.length > 0 && storageStats.totalSize > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Spațiu utilizat</p>
              <p className="text-sm font-medium">{formatBytes(storageStats.totalSize)}</p>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
            <FileImage className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Dimensiune originală</p>
              <p className="text-sm font-medium">{formatBytes(storageStats.originalSize)}</p>
            </div>
          </div>
          {storageStats.savedSize > 0 && (
            <>
              <div className="bg-green-500/10 rounded-lg p-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600">Spațiu economisit</p>
                  <p className="text-sm font-medium text-green-700">{formatBytes(storageStats.savedSize)}</p>
                </div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs text-green-600">Rata compresie</p>
                  <p className="text-sm font-medium text-green-700">{storageStats.compressionRatio.toFixed(1)}x</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Compare mode instructions */}
      {compareMode && (
        <div className="bg-primary/10 text-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2">
          <Columns2 className="h-4 w-4" />
          Selectează 2 radiografii pentru comparație
        </div>
      )}

      {/* Radiographs grid */}
      {radiographs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Nu există radiografii încărcate</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Încarcă prima radiografie
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {radiographs.map((radiograph, index) => {
            const isSelectedForCompare = selectedForCompare.some((r) => r.id === radiograph.id);
            const selectionOrder = selectedForCompare.findIndex((r) => r.id === radiograph.id) + 1;
            
            return (
              <div
                key={radiograph.id}
                className={`group relative rounded-lg border bg-card overflow-hidden transition-all ${
                  compareMode 
                    ? isSelectedForCompare 
                      ? 'border-primary ring-2 ring-primary/30' 
                      : 'hover:border-primary/50 cursor-pointer'
                    : 'hover:border-primary/50'
                }`}
              >
                {/* Selection indicator for compare mode */}
                {compareMode && isSelectedForCompare && (
                  <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {selectionOrder}
                  </div>
                )}

                {/* Thumbnail */}
                <button
                  onClick={() => openViewer(index)}
                  className="w-full aspect-square bg-muted flex items-center justify-center cursor-pointer"
                >
                  {radiograph.url ? (
                    <img
                      src={radiograph.url}
                      alt={radiograph.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                  {!compareMode && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="h-6 w-6 text-white" />
                    </div>
                  )}
                  {compareMode && (
                    <div className={`absolute inset-0 transition-colors flex items-center justify-center ${
                      isSelectedForCompare ? 'bg-primary/20' : 'bg-black/0 group-hover:bg-black/20'
                    }`}>
                      {isSelectedForCompare ? (
                        <Check className="h-8 w-8 text-primary" />
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-full border-2 border-white bg-black/30" />
                        </div>
                      )}
                    </div>
                  )}
                </button>

                {/* Info */}
                <div className="p-2 space-y-1">
                  {radiograph.radiograph_type && (
                    <Badge variant="secondary" className="text-xs">
                      {RADIOGRAPH_TYPE_LABELS[radiograph.radiograph_type as RadiographType] ||
                        radiograph.radiograph_type}
                    </Badge>
                  )}
                  {radiograph.taken_at && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(radiograph.taken_at), 'd MMM yyyy', { locale: ro })}
                    </div>
                  )}
                  {radiograph.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {radiograph.description}
                    </p>
                  )}
                </div>

                {/* Actions - hide in compare mode */}
                {!compareMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadRadiograph(radiograph);
                      }}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRadiographToDelete(radiograph);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Încarcă radiografie</DialogTitle>
            <DialogDescription>
              Adaugă o nouă radiografie pentru {patientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* File input */}
            <div className="space-y-2">
              <Label>Fișier</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
              />
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            {/* Type select */}
            <div className="space-y-2">
              <Label>Tip radiografie</Label>
              <Select
                value={radiographType}
                onValueChange={(v) => setRadiographType(v as RadiographType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează tipul" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RADIOGRAPH_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date taken */}
            <div className="space-y-2">
              <Label>Data efectuării</Label>
              <Input
                type="date"
                value={takenAt}
                onChange={(e) => setTakenAt(e.target.value)}
              />
            </div>

            {/* Compression quality */}
            <div className="space-y-2">
              <Label>Calitate compresie</Label>
              <Select
                value={compressionQuality}
                onValueChange={(v) => setCompressionQuality(v as 'high' | 'medium' | 'economic')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex flex-col">
                      <span>Calitate înaltă</span>
                      <span className="text-xs text-muted-foreground">Max 3000px, 92% calitate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col">
                      <span>Medie (recomandat)</span>
                      <span className="text-xs text-muted-foreground">Max 2048px, 85% calitate</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="economic">
                    <div className="flex flex-col">
                      <span>Economică</span>
                      <span className="text-xs text-muted-foreground">Max 1600px, 75% calitate</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descriere (opțional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Control post-tratament canal..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se încarcă...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Încarcă
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            {/* Navigation */}
            {radiographs.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateViewer('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white"
                  onClick={() => navigateViewer('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setViewerOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Image */}
            {selectedRadiograph?.url && (
              <div className="bg-black flex items-center justify-center min-h-[400px] max-h-[70vh]">
                <img
                  src={selectedRadiograph.url}
                  alt={selectedRadiograph.file_name}
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
            )}

            {/* Info bar */}
            {selectedRadiograph && (
              <div className="p-4 bg-card border-t flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {selectedRadiograph.radiograph_type && (
                      <Badge>
                        {RADIOGRAPH_TYPE_LABELS[selectedRadiograph.radiograph_type as RadiographType]}
                      </Badge>
                    )}
                    {selectedRadiograph.taken_at && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(selectedRadiograph.taken_at), 'd MMMM yyyy', { locale: ro })}
                      </span>
                    )}
                  </div>
                  {selectedRadiograph.description && (
                    <p className="text-sm">{selectedRadiograph.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedRadiograph.file_name} • {formatFileSize(selectedRadiograph.file_size)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadRadiograph(selectedRadiograph)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRadiographToDelete(selectedRadiograph);
                      setDeleteDialogOpen(true);
                      setViewerOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Șterge
                  </Button>
                </div>
              </div>
            )}

            {/* Counter */}
            {radiographs.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {selectedIndex + 1} / {radiographs.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={(open) => {
        setCompareDialogOpen(open);
        if (!open) {
          exitCompareMode();
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Columns2 className="h-5 w-5" />
              Comparație radiografii
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setCompareDialogOpen(false);
                exitCompareMode();
              }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 divide-x">
            {selectedForCompare.map((radiograph, index) => (
              <div key={radiograph.id} className="flex flex-col">
                {/* Header */}
                <div className="p-3 bg-muted/50 border-b">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? 'Înainte' : 'După'}
                    </Badge>
                    {radiograph.radiograph_type && (
                      <Badge variant="outline">
                        {RADIOGRAPH_TYPE_LABELS[radiograph.radiograph_type as RadiographType]}
                      </Badge>
                    )}
                  </div>
                  {radiograph.taken_at && (
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(radiograph.taken_at), 'd MMMM yyyy', { locale: ro })}
                    </div>
                  )}
                  {radiograph.description && (
                    <p className="text-xs text-muted-foreground mt-1">{radiograph.description}</p>
                  )}
                </div>
                
                {/* Image */}
                <div className="flex-1 bg-black flex items-center justify-center min-h-[400px] max-h-[60vh]">
                  {radiograph.url ? (
                    <img
                      src={radiograph.url}
                      alt={radiograph.file_name}
                      className="max-w-full max-h-[60vh] object-contain"
                    />
                  ) : (
                    <Image className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                
                {/* Footer */}
                <div className="p-3 border-t flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadRadiograph(radiograph)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Time difference */}
          {selectedForCompare.length === 2 && 
           selectedForCompare[0].taken_at && 
           selectedForCompare[1].taken_at && (
            <div className="p-3 bg-muted/30 border-t text-center text-sm">
              <span className="text-muted-foreground">Diferență de timp: </span>
              <span className="font-medium">
                {(() => {
                  const date1 = new Date(selectedForCompare[0].taken_at!);
                  const date2 = new Date(selectedForCompare[1].taken_at!);
                  const diffDays = Math.abs(Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)));
                  if (diffDays < 30) return `${diffDays} zile`;
                  if (diffDays < 365) return `${Math.round(diffDays / 30)} luni`;
                  return `${(diffDays / 365).toFixed(1)} ani`;
                })()}
              </span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge radiografia?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Radiografia va fi ștearsă permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
