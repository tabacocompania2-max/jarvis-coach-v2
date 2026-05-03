import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LineChart, ContributionGraph, ProgressChart } from 'react-native-chart-kit';
import axios from 'axios';

const screenWidth = Dimensions.get('window').width;

interface ProgressData {
  fluency: number[];
  skills: {
    grammar: number;
    vocabulary: number;
    speaking: number;
    listening: number;
  };
  strengths: string[];
  weaknesses: string[];
  totalSessions: number;
  streak: number;
}

interface ChatHistory {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export function ProgressScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProgressData | null>(null);
  const [history, setHistory] = useState<ChatHistory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressRes, historyRes] = await Promise.all([
          axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/student/progress`),
          axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/student/history`)
        ]);
        setData(progressRes.data);
        setHistory(historyRes.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#06b6d4" />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: "#1e1e2e",
    backgroundGradientTo: "#1e1e2e",
    color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const skillsData = {
    labels: ["Grammar", "Vocab", "Speaking"],
    data: [
      (data?.skills.grammar || 0) / 100,
      (data?.skills.vocabulary || 0) / 100,
      (data?.skills.speaking || 0) / 100
    ]
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Perfil de Estudiante</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Resumen */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.streak} 🔥</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{data?.totalSessions}</Text>
            <Text style={styles.statLabel}>Sesiones</Text>
          </View>
        </View>

        {/* Gráfico de Fluidez */}
        <Text style={styles.sectionTitle}>Progreso de Fluidez</Text>
        <LineChart
          data={{
            labels: ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"],
            datasets: [{ data: data?.fluency || [0] }]
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />

        {/* Habilidades */}
        <Text style={styles.sectionTitle}>Análisis de Habilidades</Text>
        <ProgressChart
          data={skillsData}
          width={screenWidth - 40}
          height={220}
          strokeWidth={16}
          radius={32}
          chartConfig={chartConfig}
          hideLegend={false}
          style={styles.chart}
        />

        {/* Fortalezas y Debilidades */}
        <View style={styles.analysisRow}>
          <View style={styles.analysisCard}>
            <Text style={[styles.cardTitle, { color: '#4ade80' }]}>Fortalezas</Text>
            {data?.strengths.map((s, i) => <Text key={i} style={styles.analysisText}>• {s}</Text>)}
          </View>
          <View style={styles.analysisCard}>
            <Text style={[styles.cardTitle, { color: '#f87171' }]}>Debilidades</Text>
            {data?.weaknesses.map((w, i) => <Text key={i} style={styles.analysisText}>• {w}</Text>)}
          </View>
        </View>

        {/* Historial (Tipo ChatGPT) */}
        <Text style={styles.sectionTitle}>Historial de Sesiones</Text>
        {history.map((item) => (
          <TouchableOpacity key={item.id} style={styles.historyCard}>
            <View>
              <Text style={styles.historyTitle}>{item.title}</Text>
              <Text style={styles.historySummary}>{item.summary}</Text>
            </View>
            <Text style={styles.historyDate}>{item.date}</Text>
          </TouchableOpacity>
        ))}
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backText: {
    color: '#06b6d4',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 15,
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 5,
  },
  chart: {
    borderRadius: 15,
    marginVertical: 8,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  analysisCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 15,
    width: '48%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  analysisText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginBottom: 5,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  historyTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  historySummary: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
    maxWidth: '80%',
  },
  historyDate: {
    color: '#64748b',
    fontSize: 12,
  },
});
