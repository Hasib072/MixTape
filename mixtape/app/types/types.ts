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
  
  declare module 'expo-music-info-2' {
    export interface MusicInfoOptions {
      title?: boolean;
      album?: boolean;
      artist?: boolean;
      genre?: boolean;
      picture?: boolean;
    }
  
    export interface PictureData {
      description?: string;
      pictureData: string; // data URI string
    }
  
    export interface MusicMetadata {
      title?: string;
      album?: string;
      artist?: string;
      genre?: string;
      picture?: PictureData;
    }
  
    export function getMusicInfoAsync(
      uri: string,
      options?: MusicInfoOptions
    ): Promise<MusicMetadata>;
  }
  