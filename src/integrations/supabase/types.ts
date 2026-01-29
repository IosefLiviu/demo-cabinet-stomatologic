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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointment_treatments: {
        Row: {
          appointment_id: string
          co_plata: number | null
          created_at: string
          decont: number | null
          discount_percent: number | null
          duration: number | null
          id: string
          laborator: number | null
          plan_item_id: string | null
          price: number | null
          tooth_data: Json | null
          tooth_numbers: number[] | null
          treatment_id: string | null
          treatment_name: string
        }
        Insert: {
          appointment_id: string
          co_plata?: number | null
          created_at?: string
          decont?: number | null
          discount_percent?: number | null
          duration?: number | null
          id?: string
          laborator?: number | null
          plan_item_id?: string | null
          price?: number | null
          tooth_data?: Json | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name: string
        }
        Update: {
          appointment_id?: string
          co_plata?: number | null
          created_at?: string
          decont?: number | null
          discount_percent?: number | null
          duration?: number | null
          id?: string
          laborator?: number | null
          plan_item_id?: string | null
          price?: number | null
          tooth_data?: Json | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_treatments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_treatments_plan_item_id_fkey"
            columns: ["plan_item_id"]
            isOneToOne: false
            referencedRelation: "treatment_plan_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_treatments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          appointment_date: string
          cabinet_id: number
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          doctor_id: string | null
          duration: number
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_amount: number | null
          patient_id: string
          payment_method: string | null
          price: number | null
          start_time: string
          status: string
          treatment_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          cabinet_id: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          doctor_id?: string | null
          duration?: number
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          patient_id: string
          payment_method?: string | null
          price?: number | null
          start_time: string
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          cabinet_id?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          doctor_id?: string | null
          duration?: number
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_amount?: number | null
          patient_id?: string
          payment_method?: string | null
          price?: number | null
          start_time?: string
          status?: string
          treatment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      cabinets: {
        Row: {
          created_at: string
          doctor: string
          id: number
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          doctor: string
          id?: number
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          doctor?: string
          id?: number
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      cas_budget: {
        Row: {
          created_at: string
          id: string
          initial_budget: number
          month_year: string
          updated_at: string
          used_budget: number
        }
        Insert: {
          created_at?: string
          id?: string
          initial_budget?: number
          month_year: string
          updated_at?: string
          used_budget?: number
        }
        Update: {
          created_at?: string
          id?: string
          initial_budget?: number
          month_year?: string
          updated_at?: string
          used_budget?: number
        }
        Relationships: []
      }
      dental_status: {
        Row: {
          id: string
          notes: string | null
          patient_id: string
          status: Database["public"]["Enums"]["tooth_status"]
          tooth_number: number
          updated_at: string
        }
        Insert: {
          id?: string
          notes?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["tooth_status"]
          tooth_number: number
          updated_at?: string
        }
        Update: {
          id?: string
          notes?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["tooth_status"]
          tooth_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dental_status_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      dental_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          patient_id: string
          tooth_number: number
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          patient_id: string
          tooth_number: number
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          patient_id?: string
          tooth_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dental_status_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_shifts: {
        Row: {
          cabinet_id: number | null
          created_at: string
          doctor_id: string
          end_time: string
          id: string
          notes: string | null
          shift_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          cabinet_id?: number | null
          created_at?: string
          doctor_id: string
          end_time: string
          id?: string
          notes?: string | null
          shift_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          cabinet_id?: number | null
          created_at?: string
          doctor_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          shift_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_shifts_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_shifts_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_time_off: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          doctor_id: string
          end_date: string
          id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          time_off_type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          doctor_id: string
          end_date: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          time_off_type?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          doctor_id?: string
          end_date?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          time_off_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_time_off_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          color: string
          created_at: string
          doctor_code: string | null
          email: string | null
          email_notifications_enabled: boolean | null
          id: string
          is_active: boolean
          name: string
          specialization: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          doctor_code?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          is_active?: boolean
          name: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          doctor_code?: string | null
          email?: string | null
          email_notifications_enabled?: boolean | null
          id?: string
          is_active?: boolean
          name?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      expense_entries: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_id: string
          id: string
          is_paid: boolean | null
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_id: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_id?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "monthly_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      login_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      monthly_expenses: {
        Row: {
          amount: number | null
          created_at: string
          expense_name: string
          id: string
          is_paid: boolean | null
          month_year: string
          paid_at: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          expense_name: string
          id?: string
          is_paid?: boolean | null
          month_year: string
          paid_at?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          expense_name?: string
          id?: string
          is_paid?: boolean | null
          month_year?: string
          paid_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      patient_documents: {
        Row: {
          description: string | null
          document_type: string
          file_path: string
          file_type: string | null
          id: string
          patient_id: string
          title: string
          uploaded_at: string
        }
        Insert: {
          description?: string | null
          document_type: string
          file_path: string
          file_type?: string | null
          id?: string
          patient_id: string
          title: string
          uploaded_at?: string
        }
        Update: {
          description?: string | null
          document_type?: string
          file_path?: string
          file_type?: string | null
          id?: string
          patient_id?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_families: {
        Row: {
          address: string | null
          created_at: string
          family_name: string
          id: string
          notes: string | null
          primary_contact_id: string | null
          primary_phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          family_name: string
          id?: string
          notes?: string | null
          primary_contact_id?: string | null
          primary_phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          family_name?: string
          id?: string
          notes?: string | null
          primary_contact_id?: string | null
          primary_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_families_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_family_members: {
        Row: {
          created_at: string
          family_id: string
          id: string
          is_primary_contact: boolean | null
          patient_id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          is_primary_contact?: boolean | null
          patient_id: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          is_primary_contact?: boolean | null
          patient_id?: string
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "patient_families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_family_members_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_radiographs: {
        Row: {
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          original_file_size: number | null
          patient_id: string
          radiograph_type: string | null
          taken_at: string | null
          tooth_numbers: number[] | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          original_file_size?: number | null
          patient_id: string
          radiograph_type?: string | null
          taken_at?: string | null
          tooth_numbers?: number[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          original_file_size?: number | null
          patient_id?: string
          radiograph_type?: string | null
          taken_at?: string | null
          tooth_numbers?: number[] | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_radiographs_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          city: string | null
          cnp: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          medical_conditions: string[] | null
          medications: string[] | null
          notes: string | null
          phone: string
          registration_number: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          cnp?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          notes?: string | null
          phone: string
          registration_number?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          city?: string | null
          cnp?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          medical_conditions?: string[] | null
          medications?: string[] | null
          notes?: string | null
          phone?: string
          registration_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescription_items: {
        Row: {
          created_at: string
          dosage: string | null
          id: string
          medication: string
          prescription_id: string
          quantity: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          id?: string
          medication: string
          prescription_id: string
          quantity?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          dosage?: string | null
          id?: string
          medication?: string
          prescription_id?: string
          quantity?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prescription_items_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          created_at: string
          diagnostic: string | null
          doctor_id: string | null
          id: string
          judet: string | null
          localitate: string | null
          nr_fisa: string | null
          patient_id: string
          prescription_date: string
          unitate_sanitara: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          diagnostic?: string | null
          doctor_id?: string | null
          id?: string
          judet?: string | null
          localitate?: string | null
          nr_fisa?: string | null
          patient_id: string
          prescription_date?: string
          unitate_sanitara?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          diagnostic?: string | null
          doctor_id?: string | null
          id?: string
          judet?: string | null
          localitate?: string | null
          nr_fisa?: string | null
          patient_id?: string
          prescription_date?: string
          unitate_sanitara?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          must_change_password: boolean | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          must_change_password?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          name: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          cabinet_id: number | null
          created_at: string
          id: string
          item_id: string
          item_name: string
          notes: string | null
          quantity: number
          type: string
        }
        Insert: {
          cabinet_id?: number | null
          created_at?: string
          id?: string
          item_id: string
          item_name: string
          notes?: string | null
          quantity: number
          type: string
        }
        Update: {
          cabinet_id?: number | null
          created_at?: string
          id?: string
          item_id?: string
          item_name?: string
          notes?: string | null
          quantity?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_cabinet_id_fkey"
            columns: ["cabinet_id"]
            isOneToOne: false
            referencedRelation: "cabinets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      tooth_statuses: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      treatment_plan_items: {
        Row: {
          cas: number | null
          completed_appointment_id: string | null
          completed_at: string | null
          created_at: string
          discount_percent: number | null
          doctor_id: string | null
          duration: number | null
          id: string
          laborator: number | null
          paid_amount: number | null
          payment_status: string | null
          price: number | null
          quantity: number | null
          sort_order: number | null
          tooth_number: number | null
          tooth_numbers: number[] | null
          treatment_id: string | null
          treatment_name: string
          treatment_plan_id: string
        }
        Insert: {
          cas?: number | null
          completed_appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          discount_percent?: number | null
          doctor_id?: string | null
          duration?: number | null
          id?: string
          laborator?: number | null
          paid_amount?: number | null
          payment_status?: string | null
          price?: number | null
          quantity?: number | null
          sort_order?: number | null
          tooth_number?: number | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name: string
          treatment_plan_id: string
        }
        Update: {
          cas?: number | null
          completed_appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          discount_percent?: number | null
          doctor_id?: string | null
          duration?: number | null
          id?: string
          laborator?: number | null
          paid_amount?: number | null
          payment_status?: string | null
          price?: number | null
          quantity?: number | null
          sort_order?: number | null
          tooth_number?: number | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name?: string
          treatment_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plan_items_completed_appointment_id_fkey"
            columns: ["completed_appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plan_items_treatment_plan_id_fkey"
            columns: ["treatment_plan_id"]
            isOneToOne: false
            referencedRelation: "treatment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_plans: {
        Row: {
          created_at: string
          discount_percent: number | null
          doctor_id: string | null
          id: string
          next_appointment_date: string | null
          next_appointment_time: string | null
          notes: string | null
          patient_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          doctor_id?: string | null
          id?: string
          next_appointment_date?: string | null
          next_appointment_time?: string | null
          notes?: string | null
          patient_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          doctor_id?: string | null
          id?: string
          next_appointment_date?: string | null
          next_appointment_time?: string | null
          notes?: string | null
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_plans_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_plans_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_records: {
        Row: {
          appointment_id: string | null
          cabinet_id: number | null
          created_at: string
          description: string | null
          diagnosis: string | null
          id: string
          notes: string | null
          patient_id: string
          performed_at: string
          price: number | null
          tooth_numbers: number[] | null
          treatment_id: string | null
          treatment_name: string
        }
        Insert: {
          appointment_id?: string | null
          cabinet_id?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          performed_at?: string
          price?: number | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name: string
        }
        Update: {
          appointment_id?: string | null
          cabinet_id?: number | null
          created_at?: string
          description?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          performed_at?: string
          price?: number | null
          tooth_numbers?: number[] | null
          treatment_id?: string | null
          treatment_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_records_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          cas: number | null
          category: string | null
          co_plata: number | null
          created_at: string
          decont: number | null
          default_duration: number
          default_price: number | null
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          cas?: number | null
          category?: string | null
          co_plata?: number | null
          created_at?: string
          decont?: number | null
          default_duration?: number
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          cas?: number | null
          category?: string | null
          co_plata?: number | null
          created_at?: string
          decont?: number | null
          default_duration?: number
          default_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      no_admins_exist: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      tooth_status:
        | "healthy"
        | "cavity"
        | "filled"
        | "crown"
        | "missing"
        | "implant"
        | "root_canal"
        | "extraction_needed"
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
    Enums: {
      app_role: ["admin", "user"],
      tooth_status: [
        "healthy",
        "cavity",
        "filled",
        "crown",
        "missing",
        "implant",
        "root_canal",
        "extraction_needed",
      ],
    },
  },
} as const
