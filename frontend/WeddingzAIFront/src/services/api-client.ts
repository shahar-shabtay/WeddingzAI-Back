import axios from 'axios';

const backend_url = "http://localhost:5000/api";

const apiClient = axios.create({
    baseURL: backend_url,
    headers: { 'Content-Type': 'application/json' },
});

export default apiClient;
