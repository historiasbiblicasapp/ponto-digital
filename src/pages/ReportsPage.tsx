import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Search } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const ReportsPage = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filtered, setFiltered] = useState(false);

  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["report-orders", startDate, endDate, filtered],
    queryFn: async () => {
      let query = supabase
        .from("service_orders")
        .select("*, customers(name, phone), services(name)")
        .order("created_at", { ascending: false });

      if (filtered && startDate) query = query.gte("created_at", `${startDate}T00:00:00`);
      if (filtered && endDate) query = query.lte("created_at", `${endDate}T23:59:59`);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: true,
  });

  const handleFilter = () => {
    setFiltered(true);
    refetch();
  };

  const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_cost), 0);
  const completedOrders = orders.filter((o) => o.status === "concluido").length;

  const exportToPDF = async () => {
    // Dynamic import to keep bundle small
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Vendas", 14, 22);

    if (startDate || endDate) {
      doc.setFontSize(10);
      doc.text(`Período: ${startDate ? format(new Date(startDate + "T12:00:00"), "dd/MM/yyyy") : "Início"} até ${endDate ? format(new Date(endDate + "T12:00:00"), "dd/MM/yyyy") : "Atual"}`, 14, 30);
    }

    doc.setFontSize(10);
    doc.text(`Total de vendas: ${orders.length} | Concluídas: ${completedOrders} | Receita total: R$ ${totalRevenue.toFixed(2)}`, 14, 38);

    autoTable(doc, {
      startY: 45,
      head: [["Data", "Cliente", "Produto", "Descrição", "Valor", "Status"]],
      body: orders.map((o) => [
        format(new Date(o.created_at), "dd/MM/yyyy"),
        (o.customers as any)?.name || "",
        (o.services as any)?.name || "",
        o.description || "",
        `R$ ${Number(o.total_cost).toFixed(2)}`,
        statusLabels[o.status] || o.status,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] },
    });

    doc.save(`relatorio_${startDate || "todos"}_${endDate || "atual"}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-muted-foreground">Filtre vendas por data e exporte para PDF</p>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-base">Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12" />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-12" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleFilter} className="h-12 touch-manipulation"><Search className="w-5 h-5 mr-2" /> Filtrar</Button>
            <Button variant="outline" onClick={exportToPDF} disabled={orders.length === 0} className="h-12 touch-manipulation">
              <FileDown className="w-5 h-5 mr-2" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2 p-3"><CardTitle className="text-xs text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><p className="text-xl font-bold">{orders.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 p-3"><CardTitle className="text-xs text-muted-foreground">Concluídos</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0"><p className="text-xl font-bold text-success">{completedOrders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Receita Total</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-primary">R$ {totalRevenue.toFixed(2)}</p></CardContent>
        </Card>
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="font-medium">{(order.customers as any)?.name}</TableCell>
                    <TableCell>{(order.services as any)?.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{order.description}</TableCell>
                    <TableCell className="font-semibold">R$ {Number(order.total_cost).toFixed(2)}</TableCell>
                    <TableCell><Badge variant="outline">{statusLabels[order.status]}</Badge></TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma venda encontrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
