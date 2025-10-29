import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
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
  AlertTriangle,
  FileDown,
  Plus,
  TrendingUp,
  Trash2
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
import { Badge } from "@/components/ui/badge";
import { exportToCSV } from "@/lib/export";
import { type Ticket, type Carrier, type DamageType, type Produto, carriers, damageTypes, produtos } from "@shared/schema";
import { getCarrierColor, getProdutoColor } from "@/lib/carrier-detection";
import logoUrl from "@assets/HappyAging_Brandmark_Primary - Black_1761171788534.png";
import rLogoUrl from "@assets/WhatsApp Image 2025-10-27 at 18.46.32_ed19553d_1761601654456.jpg";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [carrierFilter, setCarrierFilter] = useState<Carrier | "all">("all");
  const [damageFilter, setDamageFilter] = useState<DamageType | "all">("all");
  const [produtoFilter, setProdutoFilter] = useState<Produto | "all">("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tickets", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete tickets");
      }
      return await response.json();
    },
    onSuccess: (data: { deletedCount: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Tickets deletados",
        description: `${data.deletedCount} ticket${data.deletedCount !== 1 ? 's foram' : ' foi'} removido${data.deletedCount !== 1 ? 's' : ''} com sucesso.`,
      });
      setShowDeleteDialog(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar os tickets. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const filteredTickets = tickets.filter(ticket => {
    const carrierMatch = carrierFilter === "all" || ticket.carrier === carrierFilter;
    const damageMatch = damageFilter === "all" || ticket.damageTypes.includes(damageFilter);
    const produtoMatch = produtoFilter === "all" || ticket.produto === produtoFilter;
    return carrierMatch && damageMatch && produtoMatch;
  });

  const ticketsByCarrier = carriers.map(carrier => ({
    name: carrier,
    value: filteredTickets.filter(t => t.carrier === carrier).length,
    color: getCarrierColor(carrier).text
  }));

  const ticketsByDamage = damageTypes.map(damage => ({
    name: damage,
    value: filteredTickets.filter(t => t.damageTypes.includes(damage)).length
  }));

  const ticketsByProduto = produtos.map(produto => ({
    name: produto,
    value: filteredTickets.filter(t => t.produto === produto).length
  })).filter(p => p.value > 0);

  const ticketsByDate = filteredTickets
    .reduce((acc, ticket) => {
      const date = new Date(ticket.dateReported).toLocaleDateString();
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ date, count: 1 });
      }
      return acc;
    }, [] as { date: string; count: number }[])
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-30);

  const recentTickets = [...filteredTickets]
    .sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime())
    .slice(0, 10);

  const topCarrier = ticketsByCarrier.reduce((max, carrier) => 
    carrier.value > max.value ? carrier : max,
    { name: "-", value: 0 }
  );

  const topDamage = ticketsByDamage.reduce((max, damage) => 
    damage.value > max.value ? damage : max,
    { name: "-", value: 0 }
  );

  const topProduto = ticketsByProduto.length > 0 
    ? ticketsByProduto.reduce((max, produto) => 
        produto.value > max.value ? produto : max,
        { name: "-", value: 0 }
      )
    : { name: "-", value: 0 };

  const handleExport = () => {
    exportToCSV(filteredTickets);
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
                <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">
                  Dashboard de Avarias
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gestão e análise de pedidos com avarias
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/orders">
                <Button variant="outline" data-testid="button-go-orders">
                  Pedidos
                </Button>
              </Link>
              <Link href="/new">
                <Button data-testid="button-new-ticket" className="gap-2 border-2 border-primary">
                  <Plus className="w-4 h-4" />
                  Novo Ticket
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
              title="Total de Tickets"
              value={filteredTickets.length}
              icon={Package}
              testId="kpi-total-tickets"
            />
            <KPICard
              title="Carrier com Mais Tickets"
              value={topCarrier.name}
              icon={TrendingUp}
              description={`${topCarrier.value} ticket${topCarrier.value !== 1 ? 's' : ''}`}
              testId="kpi-top-carrier"
            />
            <KPICard
              title="Avaria Mais Frequente"
              value={topDamage.name}
              icon={AlertTriangle}
              description={`${topDamage.value} ocorrência${topDamage.value !== 1 ? 's' : ''}`}
              testId="kpi-top-damage"
            />
            <KPICard
              title="Produto com Mais Tickets"
              value={topProduto.name}
              icon={Package}
              description={`${topProduto.value} ticket${topProduto.value !== 1 ? 's' : ''}`}
              testId="kpi-top-produto"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={carrierFilter} onValueChange={(v) => setCarrierFilter(v as Carrier | "all")}>
                <SelectTrigger className="w-[180px] bg-card border-2 border-foreground/60 font-medium shadow-sm" data-testid="select-carrier-filter">
                  <SelectValue placeholder="Filtrar por Carrier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Carriers</SelectItem>
                  {carriers.map(carrier => (
                    <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={damageFilter} onValueChange={(v) => setDamageFilter(v as DamageType | "all")}>
                <SelectTrigger className="w-[200px] bg-card border-2 border-foreground/60 font-medium shadow-sm" data-testid="select-damage-filter">
                  <SelectValue placeholder="Filtrar por Avaria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Avarias</SelectItem>
                  {damageTypes.map(damage => (
                    <SelectItem key={damage} value={damage}>{damage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={produtoFilter} onValueChange={(v) => setProdutoFilter(v as Produto | "all")}>
                <SelectTrigger className="w-[200px] bg-card border-2 border-foreground/60 font-medium shadow-sm" data-testid="select-produto-filter">
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
                data-testid="button-export"
              >
                <FileDown className="w-4 h-4" />
                Exportar CSV
              </Button>

              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
                data-testid="button-delete-all"
                disabled={tickets.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Limpar Todos
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets por Carrier</CardTitle>
                <CardDescription>Distribuição de avarias por transportadora</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketsByCarrier}>
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
                      {ticketsByCarrier.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Avaria</CardTitle>
                <CardDescription>Distribuição por tipo de dano</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ticketsByDamage}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                      label={({ name, percent }) => {
                        const percentage = (percent * 100).toFixed(1);
                        return `${name}: ${percentage}%`;
                      }}
                      labelLine={{
                        stroke: "hsl(var(--foreground))",
                        strokeWidth: 1
                      }}
                    >
                      {ticketsByDamage.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(var(--chart-${(index % 5) + 1}))`}
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
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Tickets por Produto</CardTitle>
                <CardDescription>Distribuição de avarias por produto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketsByProduto}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="name" 
                      className="text-xs" 
                      angle={-45}
                      textAnchor="end"
                      height={120}
                    />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {ticketsByProduto.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getProdutoColor(entry.name as Produto)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Volume de Tickets
                </CardTitle>
                <CardDescription>Tickets reportados nos últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={ticketsByDate}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)"
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tickets Recentes</CardTitle>
              <CardDescription>Últimos 10 tickets registrados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTickets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum ticket encontrado</p>
                  <p className="text-sm mt-2">Adicione um novo ticket para começar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-sm">Ticket ID</th>
                        <th className="pb-3 font-medium text-sm">Pedido</th>
                        <th className="pb-3 font-medium text-sm">Produto</th>
                        <th className="pb-3 font-medium text-sm">Service</th>
                        <th className="pb-3 font-medium text-sm">Carrier</th>
                        <th className="pb-3 font-medium text-sm">Tipo de Avaria</th>
                        <th className="pb-3 font-medium text-sm">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTickets.map((ticket) => (
                        <tr
                          key={ticket.id}
                          className="border-b hover-elevate"
                          data-testid={`row-ticket-${ticket.ticketId}`}
                        >
                          <td className="py-3 font-mono text-sm" data-testid={`text-ticket-id-${ticket.ticketId}`}>
                            {ticket.ticketId}
                          </td>
                          <td className="py-3 text-sm">{ticket.orderNumber}</td>
                          <td className="py-3 text-sm">{ticket.produto}</td>
                          <td className="py-3 text-xs">{ticket.service}</td>
                          <td className="py-3">
                            <CarrierBadge carrier={ticket.carrier as Carrier} />
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {ticket.damageTypes.map((damage, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {damage}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {new Date(ticket.dateReported).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} registrado{tickets.length !== 1 ? 's' : ''} serão permanentemente removido{tickets.length !== 1 ? 's' : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteAllMutation.isPending ? "Deletando..." : "Deletar Todos"}
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
