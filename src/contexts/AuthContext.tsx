import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const createDeviceId = () => {
  const stored = localStorage.getItem("device_id");
  if (stored) return stored;
  const newId = "device_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem("device_id", newId);
  return newId;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAndCreateSession = async (userId: string) => {
    const deviceId = createDeviceId();
    
    const { data: existingSessions } = await supabase
      .from("user_sessions")
      .select("id, device_id")
      .eq("user_id", userId);

    const existingDevice = existingSessions?.find(s => s.device_id === deviceId);
    
    if (existingDevice) {
      await supabase
        .from("user_sessions")
        .update({ last_active: new Date().toISOString() })
        .eq("id", existingDevice.id);
    } else {
      const { error } = await supabase
        .from("user_sessions")
        .insert({ user_id: userId, device_id: deviceId });
      
      if (error) {
        if (error.message.includes("Limite de 2 dispositivos")) {
          throw new Error("Limite de 2 dispositivos simultâneos atingido");
        }
        console.error("Session error:", error);
      }
    }
  };

  const removeSession = async (userId: string) => {
    const deviceId = localStorage.getItem("device_id");
    if (!deviceId || !userId) return;
    
    await supabase
      .from("user_sessions")
      .delete()
      .eq("user_id", userId)
      .eq("device_id", deviceId);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        checkAndCreateSession(session.user.id).catch(err => {
          if (err.message.includes("Limite")) {
            toast.error("Limite de 2 dispositivos simultâneos atingido");
            supabase.auth.signOut();
          }
        });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      
      if (session?.user) {
        checkAndCreateSession(session.user.id).catch(err => {
          if (err.message.includes("Limite")) {
            toast.error("Limite de 2 dispositivos simultâneos atingido");
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    if (data.session?.user) {
      await checkAndCreateSession(data.session.user.id);
    }
  };

  const signOut = async () => {
    if (session?.user) {
      await removeSession(session.user.id);
    }
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
