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
} from '@/hooks/usePatientRadiographs';

interface PatientRadiographsProps {
  patientId: string;
  patientName: string;
}

export function PatientRadiographs({ patientId, patientName }: PatientRadiographsProps) {
  const {
    radiographs,
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

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [radiographType, setRadiographType] = useState<RadiographType | ''>('');
  const [takenAt, setTakenAt] = useState('');
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
    setSelectedIndex(index);
    setViewerOpen(true);
  };

  const navigateViewer = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedIndex((i) => (i > 0 ? i - 1 : radiographs.length - 1));
    } else {
      setSelectedIndex((i) => (i < radiographs.length - 1 ? i + 1 : 0));
    }
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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          Radiografii ({radiographs.length})
        </h4>
        <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Încarcă
        </Button>
      </div>

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
          {radiographs.map((radiograph, index) => (
            <div
              key={radiograph.id}
              className="group relative rounded-lg border bg-card overflow-hidden hover:border-primary/50 transition-colors"
            >
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="h-6 w-6 text-white" />
                </div>
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

              {/* Actions */}
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
            </div>
          ))}
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
