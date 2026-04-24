import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import type { Tenant, TenantInsert } from "@/integrations/supabase/multi-tenant"

const AdminTenants = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  console.log("AdminTenants rendered, user:", user)

  return (
    <div>
      <h1>TESTE SIMPLES</h1>
      <p>Se você види isso, a página carregou!</p>
      <button style={{background: 'red', color: 'white', padding: '20px'}}>
        BOTAO VERMELHO
      </button>
    </div>
  )
}

export default AdminTenants