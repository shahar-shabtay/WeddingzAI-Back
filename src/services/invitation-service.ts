import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

export interface Invitation {
  _id: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
}

export const createInvitation = async (prompt: string): Promise<Invitation> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No auth token found');
  }

  const response = await axios.post<Invitation>(
    `${API_URL}/invitation/create`,
    { prompt },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
};
