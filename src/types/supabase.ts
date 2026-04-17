export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contract_equipment: {
        Row: {
          active: boolean | null
          contract_id: string | null
          created_at: string | null
          equipment_model_id: string | null
          id: string
          location: string | null
          serial_number: string | null
        }
        Insert: {
          active?: boolean | null
          contract_id?: string | null
          created_at?: string | null
          equipment_model_id?: string | null
          id?: string
          location?: string | null
          serial_number?: string | null
        }
        Update: {
          active?: boolean | null
          contract_id?: string | null
          created_at?: string | null
          equipment_model_id?: string | null
          id?: string
          location?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_equipment_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_equipment_equipment_model_id_fkey"
            columns: ["equipment_model_id"]
            isOneToOne: false
            referencedRelation: "equipment_models"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_technicians: {
        Row: {
          contract_id: string
          technician_id: string
        }
        Insert: {
          contract_id: string
          technician_id: string
        }
        Update: {
          contract_id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_technicians_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_technicians_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          active: boolean | null
          client: string
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          client: string
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          client?: string
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      equipment_min_stock: {
        Row: {
          contract_equipment_id: string | null
          drum_black_min: number | null
          drum_cyan_min: number | null
          drum_magenta_min: number | null
          drum_yellow_min: number | null
          id: string
          toner_black_min: number | null
          toner_cyan_min: number | null
          toner_magenta_min: number | null
          toner_yellow_min: number | null
        }
        Insert: {
          contract_equipment_id?: string | null
          drum_black_min?: number | null
          drum_cyan_min?: number | null
          drum_magenta_min?: number | null
          drum_yellow_min?: number | null
          id?: string
          toner_black_min?: number | null
          toner_cyan_min?: number | null
          toner_magenta_min?: number | null
          toner_yellow_min?: number | null
        }
        Update: {
          contract_equipment_id?: string | null
          drum_black_min?: number | null
          drum_cyan_min?: number | null
          drum_magenta_min?: number | null
          drum_yellow_min?: number | null
          id?: string
          toner_black_min?: number | null
          toner_cyan_min?: number | null
          toner_magenta_min?: number | null
          toner_yellow_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_min_stock_contract_equipment_id_fkey"
            columns: ["contract_equipment_id"]
            isOneToOne: true
            referencedRelation: "contract_equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_models: {
        Row: {
          brand: string
          capacity_drum_black: number | null
          capacity_drum_cyan: number | null
          capacity_drum_magenta: number | null
          capacity_drum_yellow: number | null
          capacity_toner_black: number | null
          capacity_toner_cyan: number | null
          capacity_toner_magenta: number | null
          capacity_toner_yellow: number | null
          created_at: string | null
          drum_black: string | null
          drum_cyan: string | null
          drum_magenta: string | null
          drum_yellow: string | null
          has_drum: boolean
          id: string
          is_color: boolean
          name: string
          toner_black: string | null
          toner_cyan: string | null
          toner_magenta: string | null
          toner_yellow: string | null
        }
        Insert: {
          brand: string
          capacity_drum_black?: number | null
          capacity_drum_cyan?: number | null
          capacity_drum_magenta?: number | null
          capacity_drum_yellow?: number | null
          capacity_toner_black?: number | null
          capacity_toner_cyan?: number | null
          capacity_toner_magenta?: number | null
          capacity_toner_yellow?: number | null
          created_at?: string | null
          drum_black?: string | null
          drum_cyan?: string | null
          drum_magenta?: string | null
          drum_yellow?: string | null
          has_drum?: boolean
          id?: string
          is_color?: boolean
          name: string
          toner_black?: string | null
          toner_cyan?: string | null
          toner_magenta?: string | null
          toner_yellow?: string | null
        }
        Update: {
          brand?: string
          capacity_drum_black?: number | null
          capacity_drum_cyan?: number | null
          capacity_drum_magenta?: number | null
          capacity_drum_yellow?: number | null
          capacity_toner_black?: number | null
          capacity_toner_cyan?: number | null
          capacity_toner_magenta?: number | null
          capacity_toner_yellow?: number | null
          created_at?: string | null
          drum_black?: string | null
          drum_cyan?: string | null
          drum_magenta?: string | null
          drum_yellow?: string | null
          has_drum?: boolean
          id?: string
          is_color?: boolean
          name?: string
          toner_black?: string | null
          toner_cyan?: string | null
          toner_magenta?: string | null
          toner_yellow?: string | null
        }
        Relationships: []
      }
      equipment_stock_entries: {
        Row: {
          contract_equipment_id: string | null
          created_at: string | null
          drum_black: number | null
          drum_black_in: number | null
          drum_black_out: number | null
          drum_cyan: number | null
          drum_cyan_in: number | null
          drum_cyan_out: number | null
          drum_magenta: number | null
          drum_magenta_in: number | null
          drum_magenta_out: number | null
          drum_yellow: number | null
          drum_yellow_in: number | null
          drum_yellow_out: number | null
          entry_date: string
          id: string
          notes: string | null
          technician_id: string | null
          toner_black: number | null
          toner_black_in: number | null
          toner_black_out: number | null
          toner_cyan: number | null
          toner_cyan_in: number | null
          toner_cyan_out: number | null
          toner_magenta: number | null
          toner_magenta_in: number | null
          toner_magenta_out: number | null
          toner_yellow: number | null
          toner_yellow_in: number | null
          toner_yellow_out: number | null
        }
        Insert: {
          contract_equipment_id?: string | null
          created_at?: string | null
          drum_black?: number | null
          drum_black_in?: number | null
          drum_black_out?: number | null
          drum_cyan?: number | null
          drum_cyan_in?: number | null
          drum_cyan_out?: number | null
          drum_magenta?: number | null
          drum_magenta_in?: number | null
          drum_magenta_out?: number | null
          drum_yellow?: number | null
          drum_yellow_in?: number | null
          drum_yellow_out?: number | null
          entry_date?: string
          id?: string
          notes?: string | null
          technician_id?: string | null
          toner_black?: number | null
          toner_black_in?: number | null
          toner_black_out?: number | null
          toner_cyan?: number | null
          toner_cyan_in?: number | null
          toner_cyan_out?: number | null
          toner_magenta?: number | null
          toner_magenta_in?: number | null
          toner_magenta_out?: number | null
          toner_yellow?: number | null
          toner_yellow_in?: number | null
          toner_yellow_out?: number | null
        }
        Update: {
          contract_equipment_id?: string | null
          created_at?: string | null
          drum_black?: number | null
          drum_black_in?: number | null
          drum_black_out?: number | null
          drum_cyan?: number | null
          drum_cyan_in?: number | null
          drum_cyan_out?: number | null
          drum_magenta?: number | null
          drum_magenta_in?: number | null
          drum_magenta_out?: number | null
          drum_yellow?: number | null
          drum_yellow_in?: number | null
          drum_yellow_out?: number | null
          entry_date?: string
          id?: string
          notes?: string | null
          technician_id?: string | null
          toner_black?: number | null
          toner_black_in?: number | null
          toner_black_out?: number | null
          toner_cyan?: number | null
          toner_cyan_in?: number | null
          toner_cyan_out?: number | null
          toner_magenta?: number | null
          toner_magenta_in?: number | null
          toner_magenta_out?: number | null
          toner_yellow?: number | null
          toner_yellow_in?: number | null
          toner_yellow_out?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_stock_entries_contract_equipment_id_fkey"
            columns: ["contract_equipment_id"]
            isOneToOne: false
            referencedRelation: "contract_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_stock_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_min_stock: {
        Row: {
          contract_id: string
          reams_min: number | null
        }
        Insert: {
          contract_id: string
          reams_min?: number | null
        }
        Update: {
          contract_id?: string
          reams_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_min_stock_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_stock_entries: {
        Row: {
          contract_id: string | null
          created_at: string | null
          entry_date: string
          id: string
          notes: string | null
          reams_current: number
          reams_in: number | null
          reams_out: number | null
          technician_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          reams_current: number
          reams_in?: number | null
          reams_out?: number | null
          technician_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          entry_date?: string
          id?: string
          notes?: string | null
          reams_current?: number
          reams_in?: number | null
          reams_out?: number | null
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paper_stock_entries_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paper_stock_entries_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          id: string
          name: string
          role: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      stock_adjustments: {
        Row: {
          adjusted_by: string | null
          created_at: string | null
          entry_type: string
          equipment_entry_id: string | null
          field_adjusted: string
          id: string
          new_value: number | null
          old_value: number | null
          paper_entry_id: string | null
          reason: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string | null
          entry_type: string
          equipment_entry_id?: string | null
          field_adjusted: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          paper_entry_id?: string | null
          reason: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string | null
          entry_type?: string
          equipment_entry_id?: string | null
          field_adjusted?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          paper_entry_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_adjusted_by_fkey"
            columns: ["adjusted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_equipment_entry_id_fkey"
            columns: ["equipment_entry_id"]
            isOneToOne: false
            referencedRelation: "equipment_stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_adjustments_paper_entry_id_fkey"
            columns: ["paper_entry_id"]
            isOneToOne: false
            referencedRelation: "paper_stock_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string
          contract_equipment_id: string | null
          contract_id: string | null
          current_value: number | null
          id: string
          min_value: number | null
          notified_email: boolean | null
          resolved: boolean | null
          triggered_at: string | null
        }
        Insert: {
          alert_type: string
          contract_equipment_id?: string | null
          contract_id?: string | null
          current_value?: number | null
          id?: string
          min_value?: number | null
          notified_email?: boolean | null
          resolved?: boolean | null
          triggered_at?: string | null
        }
        Update: {
          alert_type?: string
          contract_equipment_id?: string | null
          contract_id?: string | null
          current_value?: number | null
          id?: string
          min_value?: number | null
          notified_email?: boolean | null
          resolved?: boolean | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_contract_equipment_id_fkey"
            columns: ["contract_equipment_id"]
            isOneToOne: false
            referencedRelation: "contract_equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
