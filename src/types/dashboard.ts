
export interface Category {
  id: string;
  name: string;
  is_visible: boolean;
  sequence: number;
  user_id: string;
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
  description: string | null;
  image_url: string | null;
  category_id: string | null;
}

export interface Profile {
  id: string;
  company_name: string | null;
  profile_image_url: string | null;
  whatsapp_number: string | null;
}

export interface SetupStep {
  number: number;
  title: string;
  action: string;
  completed: boolean;
  onClick?: () => void;
}
