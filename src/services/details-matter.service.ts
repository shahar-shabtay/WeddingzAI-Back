import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export interface Song {
  name: string;
  artist: string;
  explanation: string;
  youtubeLink: string;
}

export interface SongSuggestions {
  songs: Song[];
}

export const getSongSuggestions = async (prompt: string): Promise<SongSuggestions> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await axios.post<SongSuggestions>(
    `${API_URL}/details-matter/suggest`,
    { prompt },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data;
}; 