import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Package,
  FileDown,
  Plus,
  Trash2,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { KPICard } from "@/components/kpi-card";
import { CarrierBadge } from "@/components/carrier-badge";
import { type Order, type Carrier, type Produto, carriers, produtos } from "@shared/schema";
import { getCarrierColor, getProdutoColor } from "@/lib/carrier-detection";
import logoUrl from "@assets/HappyAging_Brandmark_Primary - Black_1761171788534.png";
import rLogoUrl from "@assets/WhatsApp Image 2025-10-27 at 18.46.32_ed19553d_1761601654456.jpg";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function OrdersDashboard() {
  const [carrierFilter, setCarrierFilter] = useState<Carrier | "all">("all");
  const [produtoFilter, setProdutoFilter] = useState<Produto | "all">("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/orders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete orders");
      }
      return await response.json();
    },
    onSuccess: (data: { deletedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedidos deletados",
        description: `${data.deletedCount} pedido${data.deletedCount !== 1 ? 's foram' : ' foi'} removido${data.deletedCount !== 1 ? 's' : ''} com sucesso.`,
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar os pedidos. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders.filter(order => {
    const carrierMatch = carrierFilter === "all" || order.carrier === carrierFilter;
    const produtoMatch = produtoFilter === "all" || order.produto === produtoFilter;
    return carrierMatch && produtoMatch;
  });

  const ordersByCarrier = carriers.map(carrier => ({
    name: carrier,
    value: filteredOrders.filter(o => o.carrier === carrier).length,
    color: getCarrierColor(carrier).text
  }));

  const ordersByProduto = produtos.map(produto => ({
    name: produto,
    value: filteredOrders.filter(o => o.produto === produto).length
  })).filter(p => p.value > 0);

  const topCarrier = ordersByCarrier.reduce((max, carrier) => 
    carrier.value > max.value ? carrier : max,
    { name: "-", value: 0 }
  );

  const topProduto = ordersByProduto.length > 0 
    ? ordersByProduto.reduce((max, produto) => 
        produto.value > max.value ? produto : max,
        { name: "-", value: 0 }
      )
    : { name: "-", value: 0 };

  const handleExport = () => {
    const csvHeaders = ["Tracking Number", "Order Number", "Produto", "Carrier", "Data Importação"];
    const csvRows = filteredOrders.map(order => [
      order.trackingNumber,
      order.orderNumber,
      order.produto,
      order.carrier,
      new Date(order.dateImported).toLocaleString("pt-BR")
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportado com sucesso",
      description: `${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's foram' : ' foi'} exportado${filteredOrders.length !== 1 ? 's' : ''}.`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="HappyAging" className="h-8" />
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-orders-title">
                  Dashboard de Pedidos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Análise de pedidos por carrier e produto
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button variant="outline" data-testid="button-back-avarias">
                  Avarias
                </Button>
              </Link>
              <Link href="/orders/import">
                <Button data-testid="button-import-orders" className="gap-2 border-2 border-primary">
                  <Upload className="w-4 h-4" />
                  Importar Pedidos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <KPICard
              title="Total de Pedidos"
              value={filteredOrders.length}
              icon={Package}
              testId="kpi-total-orders"
            />
            <KPICard
              title="Carrier com Mais Pedidos"
              value={topCarrier.name}
              icon={Package}
              description={`${topCarrier.value} pedido${topCarrier.value !== 1 ? 's' : ''}`}
              testId="kpi-top-carrier-orders"
            />
            <KPICard
              title="Produto Mais Pedido"
              value={topProduto.name}
              icon={Package}
              description={`${topProduto.value} pedido${topProduto.value !== 1 ? 's' : ''}`}
              testId="kpi-top-produto-orders"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={carrierFilter} onValueChange={(v) => setCarrierFilter(v as Carrier | "all")}>
                <SelectTrigger className="w-[180px] bg-card border-2 border-foreground/60 font-medium shadow-sm" data-testid="select-carrier-filter-orders">
                  <SelectValue placeholder="Filtrar por Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Carriers</SelectItem>
                  {carriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={produtoFilter} onValueChange={(v) => setProdutoFilter(v as Produto | "all")}>
                <SelectTrigger className="w-[200px] bg-card border-2 border-foreground/60 font-medium shadow-sm" data-testid="select-produto-filter-orders">
                  <SelectValue placeholder="Filtrar por Produto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Produtos</SelectItem>
                  {produtos.map(produto => (
                    <SelectItem key={produto} value={produto}>{produto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                onClick={handleExport}
                className="gap-2 bg-card border-2 border-foreground/60 font-medium shadow-sm"
                data-testid="button-export-orders"
              >
                <FileDown className="w-4 h-4" />
                Exportar CSV
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
                data-testid="button-delete-all-orders"
                disabled={orders.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Limpar Todos
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Carrier</CardTitle>
                <CardDescription>Distribuição de pedidos por transportadora</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ordersByCarrier}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {ordersByCarrier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Produto</CardTitle>
                <CardDescription>Distribuição por produto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ordersByProduto}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#9caf88"
                      dataKey="value"
                    >
                      {ordersByProduto.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getProdutoColor(entry.name as Produto)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimos Pedidos</CardTitle>
              <CardDescription>Pedidos importados recentemente</CardDescription>
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
                      <th className="pb-2 text-left font-medium">Data Importação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.slice(0, 10).map((order) => (
                      <tr key={order.id} className="border-b hover-elevate" data-testid={`row-order-${order.id}`}>
                        <td className="py-3" data-testid={`text-tracking-${order.id}`}>{order.trackingNumber}</td>
                        <td className="py-3" data-testid={`text-order-number-${order.id}`}>{order.orderNumber}</td>
                        <td className="py-3" data-testid={`text-produto-${order.id}`}>{order.produto}</td>
                        <td className="py-3" data-testid={`text-carrier-${order.id}`}>
                          <CarrierBadge carrier={order.carrier as Carrier} />
                        </td>
                        <td className="py-3 text-muted-foreground" data-testid={`text-date-${order.id}`}>
                          {new Date(order.dateImported).toLocaleString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Nenhum pedido encontrado. Importe pedidos para começar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os {orders.length} pedidos serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-orders">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover-elevate"
              data-testid="button-confirm-delete-orders"
            >
              Deletar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-4 right-4 z-50">
        <img 
          src={rLogoUrl} 
          alt="Logo R" 
          className="w-16 h-16 object-contain opacity-80"
          data-testid="img-logo-r"
        />
      </div>
    </div>
  );
}
