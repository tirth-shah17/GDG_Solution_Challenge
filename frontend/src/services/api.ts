const API_BASE_URL = 'http://localhost:8000/api';

export const uploadMedia = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE_URL}/upload/`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

export const startScan = async () => {
  const response = await fetch(`${API_BASE_URL}/scan/`, {
    method: 'POST',
  });
  return response.json();
};

export const getResults = async () => {
  const response = await fetch(`${API_BASE_URL}/results/`);
  return response.json();
};
