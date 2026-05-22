import { useRouter } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const displayName = user?.profile?.displayName ?? user?.email ?? 'Learner';
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      {/* Minimal top bar with profile access */}
      <View
        style={{
          backgroundColor: '#1E3A8A',
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '800' }}>
          UniLearn
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile')}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#3B82F6',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>
            {initials}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
