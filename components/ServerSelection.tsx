import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Server, servers as initialServers } from '../database/servers';

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
  // Local copy of servers so we can add new ones
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [newServerName, setNewServerName] = useState('');

  // Sort servers alphabetically
  const sortedServers = [...servers].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Check if newServerName is valid and unique
  const newServerNameTrimmed = newServerName.trim();
  const nameExists = servers.some(
    (server) => server.name.toLowerCase() === newServerNameTrimmed.toLowerCase()
  );
  const canAddNewServer = newServerNameTrimmed.length > 0 && !nameExists;

  const toggleSelectServer = (server: Server) => {
    if (selectedServers.find((s) => s.id === server.id)) {
      setSelectedServers(selectedServers.filter((s) => s.id !== server.id));
    } else {
      setSelectedServers([...selectedServers, server]);
    }
  };

  // Add new server to list and select it
  const addNewServer = () => {
    if (!canAddNewServer) return;

    const newServer: Server = {
      id: Math.random().toString(36).substr(2, 9),
      name: newServerNameTrimmed,
    };

    setServers([...servers, newServer]);
    setSelectedServers([...selectedServers, newServer]);
    setNewServerName('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.header}>Select Servers Working Today</Text>

        {/* Input to add new server */}
        <View style={styles.addServerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add new server name"
            value={newServerName}
            onChangeText={setNewServerName}
            autoCorrect={false}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.addButton, !canAddNewServer && styles.disabled]}
            disabled={!canAddNewServer}
            onPress={addNewServer}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Servers grid */}
        <ScrollView contentContainerStyle={styles.grid}>
          {sortedServers.map((server) => {
            const selected = selectedServers.find((s) => s.id === server.id);
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
          style={[
            styles.nextButton,
            selectedServers.length === 0 && styles.disabled,
          ]}
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
    marginBottom: 20,
  },
  disabled: {
    backgroundColor: '#aaa',
  },
  nextText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  addServerContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#2196f3',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
