// types.ts
export interface DownloadResumableDownloadResult {
    uri: string;
    status: 'downloaded';
    headers: Record<string, string>;
    md5?: string;
  }

export interface ApiResponse {
    link: string;
    title: string;
    filesize: number; // in bytes
    progress: number;
    duration: number;
    status: string;
    msg: string;
  }
  