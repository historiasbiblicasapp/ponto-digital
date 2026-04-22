import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CustomersPage = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", observation: "" });
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (customer: { name: string; phone: string; observation: string; id?: string }) => {
      if (customer.id) {
        const { error } = await supabase.from("customers").update({ name: customer.name, phone: customer.phone, observation: customer.observation } as any).eq("id", customer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert({ name: customer.name, phone: customer.phone, observation: customer.observation } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      setEditing(null);
      setForm({ name: "", phone: "", observation: "" });
      toast.success("Cliente salvo!");
    },
    onError: () => toast.error("Erro ao salvar cliente"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente removido!");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate({ ...form, id: editing?.id });
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, phone: c.phone || "", observation: c.observation || "" });
    setOpen(true);
  };

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Cadastro de clientes</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setForm({ name: "", phone: "", observation: "" }); }} className="w-full h-14 text-lg touch-manipulation">
              <Plus className="w-5 h-5 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader><DialogTitle className="text-xl">{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label className="text-base">Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-12 text-base" /></div>
              <div className="space-y-2"><Label className="text-base">Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-12 text-base" /></div>
              <div className="space-y-2"><Label className="text-base">Observação</Label><Textarea value={form.observation} onChange={(e) => setForm({ ...form, observation: e.target.value })} placeholder="Anotações sobre o cliente..." className="min-h-[80px]" /></div>
              <Button type="submit" className="w-full h-12 text-lg" disabled={upsertMutation.isPending}>Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-12 text-base" />

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.observation}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum cliente encontrado</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomersPage;
