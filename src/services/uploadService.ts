import api from './api';
import axios from 'axios';

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  try {
    const res = await api.post<{ url: string }>('/uploads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.url;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg: string =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message;
      throw new Error(msg);
    }
    throw err;
  }
}
