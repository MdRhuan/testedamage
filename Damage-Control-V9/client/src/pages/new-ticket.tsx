import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  Truck,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertTicketSchema, type InsertTicket, carriers, services, produtos, damageTypes, type Carrier, type Service, type Produto } from "@shared/schema";
import { detectCarrierFromTracking, getCarrierColor } from "@/lib/carrier-detection";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CarrierBadge } from "@/components/carrier-badge";

export default function NewTicket() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [detectedCarrier, setDetectedCarrier] = useState<Carrier | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<InsertTicket>({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      ticketId: "",
      orderNumber: "",
      trackingNumber: "",
      carrier: "" as Carrier,
      service: "" as Service,
      produto: "" as Produto,
      ticketUrl: "",
      damageTypes: [],
      dateReported: new Date(),
      observations: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTicket) => {
      return apiRequest("POST", "/api/tickets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Ticket criado com sucesso!",
        description: "O ticket foi registrado no sistema.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (tickets: InsertTicket[]) => {
      return apiRequest("POST", "/api/tickets/bulk", { tickets });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Importação concluída!",
        description: `${data.imported} tickets importados com sucesso.`,
      });
      setShowImportDialog(false);
      setImportPreview([]);
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTrackingChange = (value: string) => {
    const upper = value.toUpperCase();
    form.setValue("trackingNumber", upper);
    
    const carrier = detectCarrierFromTracking(upper);
    setDetectedCarrier(carrier);
    
    if (carrier) {
      form.setValue("carrier", carrier);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const processData = (data: any[]) => {
      const errors: string[] = [];
      const tickets: InsertTicket[] = [];

      data.forEach((row: any, index: number) => {
        try {
          const trackingUpper = (row["Tracking Number"] || row.trackingNumber || "").toUpperCase();
          const detectedCarrier = detectCarrierFromTracking(trackingUpper);
          
          const damageTypesStr = row["Damage Types"] || row.damageTypes || "";
          const damageTypesArray = damageTypesStr
            .split(/[;,]/)
            .map((d: string) => d.trim())
            .filter((d: string) => damageTypes.includes(d as any));

          const ticket = insertTicketSchema.parse({
            ticketId: row["Ticket ID"] || row.ticketId || `TICKET-${Date.now()}-${index}`,
            orderNumber: row["Order Number"] || row.orderNumber || "",
            trackingNumber: trackingUpper,
            carrier: detectedCarrier || row.Carrier || row.carrier,
            service: row["Service"] || row.service || "",
            produto: row["Produto"] || row.produto || "",
            ticketUrl: row["Ticket URL"] || row.ticketUrl || "",
            damageTypes: damageTypesArray.length > 0 ? damageTypesArray : ["Quebrado"],
            dateReported: row["Date Reported"] || row.dateReported 
              ? new Date(row["Date Reported"] || row.dateReported)
              : new Date(),
            observations: row.Observations || row.observations || "",
          });

          tickets.push(ticket);
        } catch (error) {
          errors.push(`Linha ${index + 2}: ${error instanceof Error ? error.message : "Erro de validação"}`);
        }
      });

      setImportPreview(tickets);
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

  const handleBulkImport = () => {
    if (importPreview.length > 0) {
      bulkImportMutation.mutate(importPreview);
    }
  };

  const onSubmit = (data: InsertTicket) => {
    createMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-card">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="gap-2 mb-4"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                Registrar Pedido com Avaria
              </h1>
              <p className="text-sm text-muted-foreground">
                Insira os dados manualmente ou importe uma planilha
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card className="border-2 border-foreground/60">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle>Importar Planilha</CardTitle>
                  <CardDescription>Faça upload de um arquivo CSV ou XLSX</CardDescription>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    data-testid="input-file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 bg-card border-2 border-black font-medium shadow-sm"
                    data-testid="button-import"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Selecionar Arquivo
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="border-2 border-foreground/60">
            <CardHeader>
              <CardTitle>Dados do Ticket</CardTitle>
              <CardDescription>Preencha as informações do pedido com avaria</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="ticketId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ticket ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="56381280"
                              data-testid="input-ticket-id"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="orderNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Number *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="#34357"
                              data-testid="input-order-number"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="trackingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Number *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                handleTrackingChange(e.target.value);
                              }}
                              placeholder="Digite o número de rastreamento"
                              className="font-mono"
                              data-testid="input-tracking-number"
                            />
                            {detectedCarrier && (
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <span className="text-muted-foreground">Carrier detectado:</span>
                                <CarrierBadge carrier={detectedCarrier} />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="carrier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carrier *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-carrier">
                              <SelectValue placeholder="Selecione o carrier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carriers.map((carrier) => (
                              <SelectItem key={carrier} value={carrier}>
                                {carrier}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-service">
                              <SelectValue placeholder="Selecione o serviço" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="produto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Produto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-produto">
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {produtos.map((produto) => (
                              <SelectItem key={produto} value={produto}>
                                {produto}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ticketUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ticket URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://happyaging.gorgias.com/app/views/19510/56381280"
                            data-testid="input-ticket-url"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="damageTypes"
                    render={() => (
                      <FormItem>
                        <FormLabel>Tipo de Avaria *</FormLabel>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {damageTypes.map((type) => (
                            <FormField
                              key={type}
                              control={form.control}
                              name="damageTypes"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(type)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        field.onChange(
                                          checked
                                            ? [...current, type]
                                            : current.filter((t) => t !== type)
                                        );
                                      }}
                                      data-testid={`checkbox-damage-${type.toLowerCase().replace(/\s+/g, "-")}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {type}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateReported"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data Reportada</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            value={field.value instanceof Date 
                              ? field.value.toISOString().slice(0, 16)
                              : new Date().toISOString().slice(0, 16)
                            }
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            data-testid="input-date-reported"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="Descreva os detalhes da avaria..."
                            rows={4}
                            data-testid="textarea-observations"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/")}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="gap-2"
                      data-testid="button-save"
                    >
                      {createMutation.isPending ? (
                        <>Salvando...</>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Salvar Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
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
                    Tickets válidos ({importPreview.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="pb-2 text-left font-medium">Ticket ID</th>
                          <th className="pb-2 text-left font-medium">Pedido</th>
                          <th className="pb-2 text-left font-medium">Produto</th>
                          <th className="pb-2 text-left font-medium">Service</th>
                          <th className="pb-2 text-left font-medium">Tracking</th>
                          <th className="pb-2 text-left font-medium">Carrier</th>
                          <th className="pb-2 text-left font-medium">Avarias</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((ticket, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2 font-mono text-xs">{ticket.ticketId}</td>
                            <td className="py-2">{ticket.orderNumber}</td>
                            <td className="py-2">{ticket.produto}</td>
                            <td className="py-2 text-xs">{ticket.service}</td>
                            <td className="py-2 font-mono text-xs">{ticket.trackingNumber}</td>
                            <td className="py-2">
                              <CarrierBadge carrier={ticket.carrier} showIcon={false} />
                            </td>
                            <td className="py-2">{ticket.damageTypes.join(", ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 10 && (
                      <p className="text-muted-foreground text-xs mt-2 italic">
                        ...e mais {importPreview.length - 10} tickets
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              data-testid="button-cancel-import"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkImport}
              disabled={importPreview.length === 0 || bulkImportMutation.isPending}
              className="gap-2"
              data-testid="button-confirm-import"
            >
              {bulkImportMutation.isPending ? (
                <>Importando...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Importar {importPreview.length} Tickets
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
