const API_URL = process.env.EXPO_PUBLIC_API_URL;

export async function login(email: string, password: string) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    console.log('API_URL:', API_URL);

    if (!response.ok) {
        throw new Error('login failed');
    }

    return response.json();
}

export async function getMe(token: string) {
    const response = await fetch(`${API_URL}/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('unauthorized');
    }

    return response.json();
}