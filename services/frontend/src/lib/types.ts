export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  status: string;
  message?: string;
  data: { user: User };
}

export interface UploadResponse {
  status: string;
  task_id: string;
  image_path: string;
  user_id: number;
}

export interface Caption {
  id: number;
  task_id: string;
  user_id: number;
  image_path: string;
  caption: string;
  created_at: string;
}

export type UploadStatus = 'uploading' | 'processing' | 'done' | 'error';

export interface PendingUpload {
  taskId: string;
  filename: string;
  imagePath: string;
  status: UploadStatus;
  preview: string;
  uploadedAt: number;
}
