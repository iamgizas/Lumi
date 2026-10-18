import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { login } from "../src/api/client";
import { saveToken } from "../src/auth/token";
import { router } from "expo-router";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    async function handleLogin() {
        setError(null);
        try {
            const data = await login(email, password);
            console.log('Resposta do login:', data);
            await saveToken(data.token);
            router.replace('/');
        } catch (err) {
            console.log('Erro ao efetuar login:', err)
            setError('Não foi possível entrar. Confira email e senha.')
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 24, gap: 12}}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
            />
            <TextInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
            />
            {error && <Text style={{ color: 'red'}}>{error}</Text>}
            <Button title="Entrar" onPress={handleLogin} />
        </View>
    )
}