import { Link} from 'expo-router';
import { Text, View } from 'react-native';

export default function Home() {
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text>Lumi</Text>
            <Link href="/login">Ir para o login</Link>
        </View>
    );
}