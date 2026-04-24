export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          active: boolean
          max_sessions: number
          logo_url: string | null
          primary_color: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          active?: boolean
          max_sessions?: number
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          active?: boolean
          max_sessions?: number
          logo_url?: string | null
          primary_color?: string | null
          created_at?: string
        }
        Relationships: []
      }
      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          role: "admin" | "user"
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          role?: "admin" | "user"
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          role?: "admin" | "user"
          active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      tenant_customizations: {
        Row: {
          id: string
          tenant_id: string
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          secondary_color: string
          app_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          app_name?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          app_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_customizations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          observation: string | null
          phone: string | null
          tenant_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          observation?: string | null
          phone?: string | null
          tenant_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          observation?: string | null
          phone?: string | null
          tenant_id?: string | null
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          customer_id: string
          description: string | null
          id: string
          service_id: string
          status: "pendente" | "em_andamento" | "concluido" | "cancelado"
          tenant_id: string | null
          total_cost: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          service_id: string
          status?: "pendente" | "em_andamento" | "concluido" | "cancelado"
          tenant_id?: string | null
          total_cost?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          service_id?: string
          status?: "pendente" | "em_andamento" | "concluido" | "cancelado"
          tenant_id?: string | null
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      services: {
        Row: {
          active: boolean
          cost: number
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string | null
        }
        Insert: {
          active?: boolean
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id?: string | null
        }
        Update: {
          active?: boolean
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_id: string
          id: string
          last_active: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          last_active?: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          last_active?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_tenant_session_limit: {
        Args: { p_tenant_id: string }
        Returns: boolean
      }
      create_tenant_user: {
        Args: { p_tenant_id: string; p_email: string; p_password: string; p_role: string }
        Returns: string
      }
    }
    Enums: {
      order_status: "pendente" | "em_andamento" | "concluido" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]