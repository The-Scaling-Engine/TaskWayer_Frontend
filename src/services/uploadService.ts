import api from './api';

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<{ url: string }>('/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.url;
}
