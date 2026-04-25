const API_BASE_URL = 'http://localhost:8000/api';

export interface UploadResponse {
  status: string;
  message: string;
  filename: string;
  asset_id: string;
  hash: string;
}

export interface ScanResult {
  file_path: string;
  similarity: number;
  status: string;
}

export interface ScraperResult {
  file_path: string;
  similarity: number;
  status: 'match' | 'no_match';
}

export interface ScraperResponse {
  status: string;
  strategy_used: string;
  total_images_scraped: number;
  matches_found: number;
  similarity_threshold: number;
  results: ScraperResult[];
  message: string;
}

export interface WorkflowRequest {
  mediaId: string;
  mode: 'scan' | 'scrape';
  url?: string;
  threshold?: number;
}

export const uploadMedia = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Upload failed');
  }

  return response.json();
};

export const startScan = async (mediaId: string): Promise<ScanResult[]> => {
  const response = await fetch(`${API_BASE_URL}/scan/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ media_id: mediaId }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Failed to fetch scan results');
  }

  return response.json();
};

export const startScrape = async (
  mediaId: string,
  url: string,
  threshold: number,
): Promise<ScraperResponse> => {
  const response = await fetch(`${API_BASE_URL}/scraper/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media_id: mediaId,
      url,
      similarity_threshold: threshold,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const error = new Error(errData.detail || 'Failed to scrape images') as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return response.json();
};
