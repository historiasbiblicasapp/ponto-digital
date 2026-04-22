import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

const Login = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
      } else {
        await signIn(email, password);
        toast.success("Login realizado com sucesso!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md touch-manipulation">
        <CardHeader className="text-center space-y-6">
          <ShoppingCart className="mx-auto w-24 h-24 text-primary" />
          <CardTitle className="text-3xl font-bold">LF Vendas</CardTitle>
          <p className="text-muted-foreground text-base">{isSignUp ? "Crie sua conta de administrador" : "Faça login para acessar o painel"}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="admin@email.com"
                className="h-12 text-base"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••" 
                minLength={6}
                className="h-12 text-base"
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
              {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="w-full text-center text-base text-muted-foreground py-3 hover:text-foreground transition-colors touch-manipulation"
          >
            {isSignUp ? "Já tem conta? Faça login" : "Primeiro acesso? Crie sua conta"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
