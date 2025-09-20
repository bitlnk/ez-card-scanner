export interface BusinessCard {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  notes: string;
  imageBase64?: string;
  qrData?: string;
  createdAt: Date;
  source: 'camera' | 'qr' | 'manual';
}

export interface ApiResponse {
  success: boolean;
  data: any;
  message?: string;
}
