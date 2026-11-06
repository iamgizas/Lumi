import { useEffect, useState } from "react";
import { clearToken, getToken } from "../src/auth/token";
import { router } from "expo-router";
import { createTask, deleteTask, getMe, getTasks, setTaskCompleted } from "../src/api/client";
import { Button, FlatList, Pressable, Text, View, TextInput } from "react-native";

type Task = {
    id: string;
    title: string;
    completedAt: string | null;
}

export default function Home() {
    const [name, setName] = useState<string | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function handleError(err: unknown) {
        if (err instanceof Error && err.message === 'unauthorized') {
            await clearToken();
            router.replace('/login');
            return;
        }
        setError('Algo deu errado. Tente novamente')
    }

    useEffect(() => {
        async function load() {
            const token = await getToken();
            if (!token) {
                router.replace('/login');
                return;
            }
            try {
                const [user, list] = await Promise.all([getMe(token), getTasks(token)]);
                setName(user.name);
                setTasks(list);
            } catch (err) {
                await handleError(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Executa ação e depois recarrega lista
    async function run(action: (token: string) => Promise<unknown>) {
        const token = await getToken();
        if (!token) {
            router.replace('/login');
            return;
        }
        try {
            setError(null);
            await action(token);
            setTasks(await getTasks(token));
        } catch (err) {
            await handleError(err);
        }
    }

    async function handleAdd() {
        const title = newTitle.trim();
        if (!title) return;
        setNewTitle('');
        await run((token) => createTask(token, title));
    }

    async function handleLogout() {
        await clearToken();
        router.replace('/login');
    }

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text>Carregando...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, padding: 24, paddingTop: 16, gap: 12 }}>
            <Text style={{ fontSize: 20, fontWeight: '600' }}>Olá, {name}!</Text>

            <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput 
                    placeholder="Nova tarefa"
                    value={newTitle}
                    onChangeText={setNewTitle}
                    onSubmitEditing={handleAdd}
                    style={{ flex: 1, borderWidth: 1, padding: 12, borderRadius: 8 }}               
                />
                <Button  title="Adicionar" onPress={handleAdd} />
            </View>

            {error && <Text style={{ color: 'red' }}>{error}</Text> }

            <FlatList
                data={tasks}
                keyExtractor={(task) => task.id}
                ListEmptyComponent={<Text>Nenhuma tarefa ainda.</Text>}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                     <Pressable
                        style={{ flex: 1, paddingVertical: 10 }}
                         onPress={() => run((token) => setTaskCompleted(token, item.id, !item.completedAt))}
                     >
                        <Text style={{ textDecorationLine: item.completedAt ? 'line-through' : 'none' }}>
                            {item.title}
                        </Text>
                    </Pressable>
                        <Button title="Apagar" onPress={() => run((token) => deleteTask(token, item.id))} />
                    </View>
        )}
      />

      <Button title="Sair" onPress={handleLogout} />
        </View>
    )
}