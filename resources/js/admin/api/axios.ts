import axios from 'axios';

const httpClient = axios.create({
    baseURL: '/api/admin',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Add CSRF token to requests
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    httpClient.defaults.headers.common['X-CSRF-TOKEN'] = token;
}

export default httpClient;
