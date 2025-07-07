import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Server, servers } from '../database/servers';

interface ServerSelectionProps {
  selectedServers: Server[];
  setSelectedServers: (servers: Server[]) => void;
  onConfirm: () => void;
}

export default function ServerSelection({
  selectedServers,
  setSelectedServers,
  onConfirm,
}: ServerSelectionProps) {
  const allServers = servers;

  const sortedServers = [...allServers].sort((a, b) => a.name.localeCompare(b.name));

  const toggleSelectServer = (server: Server) => {
    if (selectedServers.find(s => s.id === server.id)) {
      setSelectedServers(selectedServers.filter(s => s.id !== server.id));
    } else {
      setSelectedServers([...selectedServers, server]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Select Servers Working Today</Text>
        <ScrollView contentContainerStyle={styles.grid}>
          {sortedServers.map((server) => {
            const selected = selectedServers.find(s => s.id === server.id);
            return (
              <TouchableOpacity
                key={server.id}
                style={[styles.serverButton, selected && styles.selected]}
                onPress={() => toggleSelectServer(server)}
              >
                <Text style={styles.serverText}>{server.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.nextButton, selectedServers.length === 0 && styles.disabled]}
          disabled={selectedServers.length === 0}
          onPress={onConfirm}
        >
          <Text style={styles.nextText}>Start Rotation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'white' },
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  serverButton: {
    width: '28%',
    paddingVertical: 10,
    margin: 5,
    backgroundColor: '#eee',
    borderRadius: 20,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#4caf50',
  },
  serverText: {
    fontSize: 14,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 30,
    backgroundColor: '#2196f3',
    paddingVertical: 15,
    borderRadius: 10,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginBottom: 20, // extra margin to avoid gesture bar
  },
  disabled: {
    backgroundColor: '#aaa',
  },
  nextText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
