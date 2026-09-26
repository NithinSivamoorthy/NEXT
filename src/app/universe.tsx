import { Redirect, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniverseScreen from '../features/universe/UniverseScreen';
import { useExperience } from '../features/experience/ExperienceProvider';

export default function UniverseRoute() {
  const { state, dispatch } = useExperience();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (!state.enteredUniverse) return <Redirect href="/" />;
  return <View style={{ flex: 1, backgroundColor: '#000' }}>
    <UniverseScreen />
    {__DEV__ && <Pressable accessibilityRole="button" accessibilityLabel="Replay introduction, development only" onPress={() => { dispatch({ type: 'reset' }); router.replace('/'); }} style={{ position: 'absolute', bottom: insets.bottom + 12, right: 22, minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}><Text style={{ color: '#aaa8a4', fontSize: 12 }}>Replay intro</Text></Pressable>}
  </View>;
}
