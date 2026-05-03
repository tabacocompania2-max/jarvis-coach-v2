import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MediaPlayerProps {
  mediaType?: 'music' | 'podcast';
  title?: string;
  artist?: string;
  onPress?: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  mediaType,
  title,
  artist,
  onPress,
}) => {
  if (!mediaType || !title) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>
          {mediaType === 'podcast' ? '📻' : '🎵'}
        </Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {artist && <Text style={styles.artist}>{artist}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.playButton}
        onPress={onPress}
      >
        <Text style={styles.playIcon}>▶️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#e0e0e0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  artist: {
    color: '#888',
    fontSize: 12,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#06b6d4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 20,
  },
});
