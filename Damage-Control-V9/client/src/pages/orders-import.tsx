import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { insertOrderSchema, type InsertOrder, produtos, carriers } from "@shared/schema";
import logoUrl from "@assets/HappyAging_Brandmark_Primary - Black_1761171788534.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { detectCarrierFromTracking } from "@/lib/carrier-detection";
import { CarrierBadge } from "@/components/carrier-badge";

export default function OrdersImport() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<InsertOrder[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const importMutation = useMutation({
    mutationFn: async (orders: InsertOrder[]) => {
      const response = await fetch("/api/orders/bulk", {
        method: "POST",
        body: JSON.stringify({ orders }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to import orders");
      }
      return await response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Importação concluída",
        description: `${data.imported} pedido${data.imported !== 1 ? 's foram importados' : ' foi importado'} com sucesso.`,
      });
      setShowImportDialog(false);
      setImportPreview([]);
      setImportErrors([]);
      navigate("/orders");
    },
    onError: (error: any) => {
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar os pedidos.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processData = (data: any[]) => {
      const errors: string[] = [];
      const orders: InsertOrder[] = [];

      data.forEach((row: any, index: number) => {
        try {
          const trackingUpper = (row["Tracking Number"] || row.trackingNumber || "").toUpperCase();
          const detectedCarrier = detectCarrierFromTracking(trackingUpper);

          const order = insertOrderSchema.parse({
            trackingNumber: trackingUpper,
            orderNumber: row["Order Number"] || row.orderNumber || "",
            produto: row["Produto"] || row.produto || "",
            carrier: detectedCarrier || row.Carrier || row.carrier,
          });

          orders.push(order);
        } catch (error) {
          errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "Erro de validação"}`);
        }
      });

      setImportPreview(orders);
      setImportErrors(errors);
      setShowImportDialog(true);
    };

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processData(results.data);
        },
        error: (error) => {
          toast({
            title: "Erro ao ler arquivo CSV",
            description: error.message,
            variant: "destructive",
          });
        },
      });
    } else if (fileExtension === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processData(jsonData);
        } catch (error) {
          toast({
            title: "Erro ao ler arquivo XLSX",
            description: error instanceof Error ? error.message : "Formato inválido",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Erro ao ler arquivo",
          description: "Não foi possível ler o arquivo XLSX",
          variant: "destructive",
        });
      };
      reader.readAsBinaryString(file);
    } else {
      toast({
        title: "Formato não suportado",
        description: "Por favor, selecione um arquivo CSV ou XLSX",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImport = () => {
    if (importPreview.length > 0) {
      importMutation.mutate(importPreview);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="HappyAging" className="h-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-import-orders-title">
                  Importar Pedidos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Faça upload de planilhas CSV ou XLSX
                </p>
              </div>
            </div>
            <Link href="/orders">
              <Button variant="outline" className="gap-2" data-testid="button-back-orders">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload de Arquivo
              </CardTitle>
              <CardDescription>
                Selecione um arquivo CSV ou XLSX contendo os pedidos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover-elevate border-foreground/20 bg-card"
                  data-testid="label-file-upload"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <FileSpreadsheet className="w-12 h-12 mb-4 text-primary" />
                    <p className="mb-2 text-sm">
                      <span className="font-semibold">Clique para fazer upload</span> ou arraste o arquivo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      CSV ou XLSX (máx. 10MB)
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    id="dropzone-file"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    data-testid="input-file-upload-orders"
                  />
                </label>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-sm">Formato esperado:</h3>
                <p className="text-sm text-muted-foreground">
                  A planilha deve conter as seguintes colunas:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Tracking Number</strong> - Número de rastreamento do pedido</li>
                  <li><strong>Order Number</strong> - Número do pedido</li>
                  <li><strong>Produto</strong> - Nome do produto ({produtos.slice(0, 3).join(", ")}, etc.)</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>Nota:</strong> O carrier será detectado automaticamente a partir do tracking number.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Preview da Importação
            </DialogTitle>
            <DialogDescription>
              Revise os dados antes de importar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {importErrors.length > 0 && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    Erros encontrados ({importErrors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {importErrors.slice(0, 5).map((error, idx) => (
                    <div key={idx} className="text-destructive">{error}</div>
                  ))}
                  {importErrors.length > 5 && (
                    <div className="text-muted-foreground italic">
                      ...e mais {importErrors.length - 5} erros
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {importPreview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    Pedidos válidos ({importPreview.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Tracking Number</th>
                          <th className="pb-2 text-left font-medium">Order Number</th>
                          <th className="pb-2 text-left font-medium">Produto</th>
                          <th className="pb-2 text-left font-medium">Carrier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((order, idx) => (
                          <tr key={idx} className="border-b" data-testid={`row-preview-order-${idx}`}>
                            <td className="py-2" data-testid={`text-preview-tracking-${idx}`}>{order.trackingNumber}</td>
                            <td className="py-2" data-testid={`text-preview-order-number-${idx}`}>{order.orderNumber}</td>
                            <td className="py-2" data-testid={`text-preview-produto-${idx}`}>{order.produto}</td>
                            <td className="py-2" data-testid={`text-preview-carrier-${idx}`}>
                              <CarrierBadge carrier={order.carrier as any} />
                            </td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="py-2 text-center text-muted-foreground italic" data-testid="text-preview-more-orders">
                              ...e mais {importPreview.length - 10} pedidos
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              data-testid="button-cancel-import-orders"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={importPreview.length === 0 || importMutation.isPending}
              data-testid="button-confirm-import-orders"
            >
              {importMutation.isPending ? "Importando..." : `Importar ${importPreview.length} Pedido${importPreview.length !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
