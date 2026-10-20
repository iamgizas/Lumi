import { useEffect, useState } from "react";
import { clearToken, getToken } from "../src/auth/token";
import { router } from "expo-router";
import { getMe } from "../src/api/client";
import { Button, Text, View } from "react-native";

export default function Home() {
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const token = await getToken();
            if (!token) {
                router.replace('/login');
                return;
            }
            try {
                const user = await getMe(token);
                setName(user.name);
            } catch {
                await clearToken();
                router.replace('/login');
            }
        }
        load();
    }, []);

    async function handleLogout() {
        await clearToken();
        router.replace('/login');
    }

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Text>{name ? `Olá, ${name}!` : 'Carregando...'}</Text>
            <Button title="Sair" onPress={handleLogout}/>
        </View>
    )
}