import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>NEXT</Text>
      <Text style={styles.tagline}>Build your universe, one NEXT at a time.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  title: {
    color: '#111',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tagline: {
    marginTop: 12,
    color: '#555',
    fontSize: 16,
    textAlign: 'center',
  },
});
