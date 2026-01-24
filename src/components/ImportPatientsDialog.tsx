import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImportPatientsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  total: number;
  inserted: number;
  duplicates: number;
  skipped: number;
  errors: string[];
}

export function ImportPatientsDialog({ open, onClose, onSuccess }: ImportPatientsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const csvContent = await file.text();
      
      const { data, error } = await supabase.functions.invoke("import-patients", {
        body: { csvContent },
      });

      if (error) throw error;

      setResult(data as ImportResult);
      
      if (data.inserted > 0) {
        toast({
          title: "Import reușit",
          description: `${data.inserted} pacienți au fost importați`,
        });
        onSuccess();
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Eroare la import",
        description: error.message || "Nu s-a putut importa fișierul",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Pacienți din CSV</DialogTitle>
          <DialogDescription>
            Încarcă un fișier CSV pentru a importa pacienți în baza de date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Upload Area */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-primary">
                <FileText className="h-8 w-8" />
                <span className="font-medium">{file.name}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click pentru a selecta un fișier CSV
                </p>
              </div>
            )}
          </div>

          {/* Import Result */}
          {result && (
            <div className="space-y-3 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                {result.inserted > 0 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">Rezultat Import</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Total rânduri:</div>
                <div className="font-medium">{result.total}</div>
                
                <div>Pacienți importați:</div>
                <div className="font-medium text-green-600">{result.inserted}</div>
                
                <div>Duplicate (existente):</div>
                <div className="font-medium text-yellow-600">{result.duplicates}</div>
                
                <div>Sărite (date lipsă):</div>
                <div className="font-medium text-muted-foreground">{result.skipped}</div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-2 text-xs text-destructive">
                  <p className="font-medium">Erori:</p>
                  <ul className="list-disc list-inside">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {result ? "Închide" : "Anulează"}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Se importă...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importă
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
