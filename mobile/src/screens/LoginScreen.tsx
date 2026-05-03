import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const LoginScreen = ({ navigation }: any) => (
  <View style={styles.container}>
    <Text style={styles.logo}>🎓 Jarvis</Text>
    <Text style={styles.title}>Welcome to your English Coach</Text>
    <TouchableOpacity 
      style={styles.button}
      onPress={() => navigation.navigate('Jarvis')}
    >
      <Text style={styles.buttonText}>Start Learning</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1e', justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { fontSize: 48, fontWeight: 'bold', color: '#06b6d4', marginBottom: 10 },
  title: { fontSize: 18, color: '#888', marginBottom: 40, textAlign: 'center' },
  button: { backgroundColor: '#06b6d4', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});
