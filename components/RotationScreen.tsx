import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Server } from '../database/servers';

const NUM_BOXES = 13;

// Mock database - replace with your real server database or API fetch
const SERVER_DATABASE: Server[] = [
  { id: '1', name: 'David' },
  { id: '2', name: 'Diana' },
  { id: '3', name: 'Daniel' },
  { id: '4', name: 'Samantha' },
  { id: '5', name: 'Sarah' },
  { id: '6', name: 'Sam' },
  { id: '7', name: 'James' },
  { id: '8', name: 'John' },
  // ...add as many as you want
];

interface RotationScreenProps {
  servers: Server[]; // initial servers prop
  onReset: () => void; // callback to reset to server selection
}

export default function RotationScreen({ servers: initialServers, onReset }: RotationScreenProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [data, setData] = useState<{ [key: string]: string[] }>({});

  const [selectedBox, setSelectedBox] = useState<{
    serverId: string;
    index: number;
    value: string;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [useScrollPicker, setUseScrollPicker] = useState(true);

  const [lastTap, setLastTap] = useState<{
    serverId: string;
    index: number;
    time: number;
  } | null>(null);

  const [menuVisible, setMenuVisible] = useState(false);

  // Add Server Modal with search
  const [addServerModalVisible, setAddServerModalVisible] = useState(false);
  const [newServerName, setNewServerName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServers, setFilteredServers] = useState<Server[]>(SERVER_DATABASE);

  // Initialize empty data structure for tables
  const initializeData = (serverList: Server[]) => {
    const initData = serverList.reduce<{ [key: string]: string[] }>((acc, server) => {
      acc[server.id] = Array(NUM_BOXES).fill('');
      return acc;
    }, {});
    setData(initData);
  };

  useEffect(() => {
    (async () => {
      try {
        const storedServers = await AsyncStorage.getItem('selectedServers');
        const storedData = await AsyncStorage.getItem('rotationData');

        if (!initialServers || initialServers.length === 0) {
          if (storedServers) {
            const parsedServers: Server[] = JSON.parse(storedServers);
            setServers(parsedServers);

            if (storedData) {
              setData(JSON.parse(storedData));
            } else {
              initializeData(parsedServers);
            }
          } else {
            setServers([]);
            setData({});
          }
        } else {
          setServers(initialServers);
          initializeData(initialServers);
        }
      } catch (e) {
        console.error('Failed to load servers or data', e);
        if (initialServers && initialServers.length > 0) {
          setServers(initialServers);
          initializeData(initialServers);
        } else {
          setServers([]);
          setData({});
        }
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('rotationData', JSON.stringify(data));
        await AsyncStorage.setItem('selectedServers', JSON.stringify(servers));
      } catch (e) {
        console.error('Failed to save data', e);
      }
    })();
  }, [data, servers]);

  const findNextBox = () => {
    if (servers.length === 0) return null;

    const counts = servers.map((server) => ({
      serverId: server.id,
      count: data[server.id]?.filter((val) => val !== '').length ?? 0,
    }));

    const minCount = Math.min(...counts.map((c) => c.count));
    const candidates = counts.filter((c) => c.count === minCount);

    for (const server of servers) {
      if (candidates.some((c) => c.serverId === server.id)) {
        const vals = data[server.id];
        const firstEmptyIndex = vals?.findIndex((val) => val === '') ?? -1;
        if (firstEmptyIndex !== -1) {
          return { serverId: server.id, index: firstEmptyIndex };
        }
      }
    }

    return null;
  };

  const nextBox = findNextBox();

  const handleBoxPress = (serverId: string, index: number, value: string) => {
    const now = Date.now();

    if (value !== '') {
      if (
        lastTap &&
        lastTap.serverId === serverId &&
        lastTap.index === index &&
        now - lastTap.time < 300
      ) {
        setSelectedBox({ serverId, index, value });
        setInputValue(value);
        setModalVisible(true);
        setLastTap(null);
      } else {
        setSelectedBox({ serverId, index, value });
        setLastTap({ serverId, index, time: now });
      }
    } else {
      if (selectedBox) {
        const updatedData = { ...data };
        updatedData[selectedBox.serverId][selectedBox.index] = '';
        updatedData[serverId][index] = selectedBox.value;
        setData(updatedData);
        setSelectedBox(null);
        setLastTap(null);
      } else {
        setSelectedBox({ serverId, index, value });
        setInputValue('0');
        setUseScrollPicker(true);
        setModalVisible(true);
        setLastTap(null);
      }
    }
  };

  const handleSubmitInput = () => {
    if (!selectedBox) return;
    const newValue = inputValue.trim().slice(0, 2);
    if (newValue === '') return;

    const updatedData = { ...data };
    updatedData[selectedBox.serverId][selectedBox.index] = newValue;
    setData(updatedData);

    setModalVisible(false);
    setSelectedBox(null);
  };

  const handleDeleteInput = () => {
    if (!selectedBox) return;

    const updatedData = { ...data };
    updatedData[selectedBox.serverId][selectedBox.index] = '';
    setData(updatedData);

    setModalVisible(false);
    setSelectedBox(null);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Rotation',
      'Are you sure you want to reset? This will clear all assignments and take you back to server selection.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('selectedServers');
              await AsyncStorage.removeItem('rotationData');
              setServers([]);
              setData({});
              setMenuVisible(false);
              onReset();
            } catch (e) {
              console.error('Failed to reset data', e);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // New server search logic
  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase();
    setFilteredServers(
      SERVER_DATABASE.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerTerm) &&
          !servers.some((added) => added.id === s.id)
      )
    );
  }, [searchTerm, servers]);

  // Add existing server from database to rotation
  const addExistingServer = (server: Server) => {
    setServers((prev) => [...prev, server]);
    setData((prev) => ({
      ...prev,
      [server.id]: Array(NUM_BOXES).fill(''),
    }));
    setAddServerModalVisible(false);
    setSearchTerm('');
  };

  // Add new server manually if not found
  const addNewServer = () => {
    if (newServerName.trim() === '') return;

    const newServer: Server = {
      id: `server_${Date.now()}`,
      name: newServerName.trim(),
    };

    setServers((prev) => [...prev, newServer]);
    setData((prev) => ({
      ...prev,
      [newServer.id]: Array(NUM_BOXES).fill(''),
    }));

    setNewServerName('');
    setAddServerModalVisible(false);
    setSearchTerm('');
  };

  const renderRow = (serverId: string) => {
    const server = servers.find((s) => s.id === serverId);
    if (!server) return null;

    return (
      <View style={styles.row} key={server.id}>
        <Text style={styles.name}>{server.name.toUpperCase()}:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.inputRow}>
            {data[serverId]?.map((val, index) => {
              const isSelected =
                selectedBox &&
                selectedBox.serverId === serverId &&
                selectedBox.index === index;

              const isNextBox =
                nextBox?.serverId === serverId && nextBox?.index === index;

              return (
            <TouchableOpacity
              key={`${serverId}-${index}`}
              style={styles.boxContainer}
              onPress={() => handleBoxPress(serverId, index, val)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.box,
                  val === '' ? styles.emptyBox : styles.filledBox,
                  isSelected && styles.selectedBoxHighlight,
                  isNextBox && styles.nextBoxHighlight,
                ]}
              >
                <Text style={styles.boxText}>{val}</Text>
              </View>
            </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Server Rotation</Text>
        <TouchableOpacity onPress={() => setMenuVisible((v) => !v)}>
          <Text style={styles.menuButton}>☰</Text>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.menuItem}>Reset Rotation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add Server Button */}
      <TouchableOpacity
        style={styles.addServerButton}
        onPress={() => setAddServerModalVisible(true)}
      >
        <Text style={styles.addServerButtonText}>+ Add Server</Text>
      </TouchableOpacity>

      {servers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text>No servers selected. Please pick servers first.</Text>
          <TouchableOpacity style={styles.pickServersButton} onPress={onReset}>
            <Text style={styles.pickServersButtonText}>Pick Servers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        servers.map((server) => renderRow(server.id))
      )}

      {/* Add Server Modal */}
      <Modal
        visible={addServerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setAddServerModalVisible(false);
          setSearchTerm('');
          setNewServerName('');
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setAddServerModalVisible(false);
            setSearchTerm('');
            setNewServerName('');
          }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>Search Servers</Text>

              <TextInput
                style={styles.searchInput}
                placeholder="Type to search..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                autoFocus
              />

              <FlatList
                data={filteredServers}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 150, marginTop: 8, width: '100%' }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.serverListItem}
                    onPress={() => addExistingServer(item)}
                  >
                    <Text style={{ fontSize: 16 }}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={{ marginVertical: 8, fontStyle: 'italic', color: '#999' }}>
                    No matching servers found.
                  </Text>
                }
              />

              <Text style={{ marginTop: 15, fontWeight: 'bold' }}>Or add new server:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="New server name"
                value={newServerName}
                onChangeText={setNewServerName}
              />
              <Pressable
                style={[styles.submitButton, { marginTop: 10 }]}
                onPress={addNewServer}
              >
                <Text style={styles.submitButtonText}>Add New Server</Text>
              </Pressable>
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>

      {/* Table Number Input Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setSelectedBox(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setModalVisible(false);
            setSelectedBox(null);
          }}
        >
          <TouchableWithoutFeedback
            onPress={(e) => {
              e.stopPropagation();
            }}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Enter table number</Text>

              {useScrollPicker ? (
                <Picker
                  selectedValue={inputValue}
                  onValueChange={(itemValue) => setInputValue(itemValue)}
                  style={styles.picker}
                >
                  {Array.from({ length: 51 }, (_, i) => i.toString()).map((num) => (
                    <Picker.Item key={num} label={num} value={num} />
                  ))}
                </Picker>
              ) : (
                <TextInput
                  style={styles.modalInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={inputValue}
                  onChangeText={setInputValue}
                  autoFocus
                />
              )}

              <TouchableOpacity
                style={styles.toggleInputMode}
                onPress={() => setUseScrollPicker((prev) => !prev)}
              >
                <Text style={{ color: 'blue' }}>
                  {useScrollPicker ? 'Type instead' : 'Use scroll picker'}
                </Text>
              </TouchableOpacity>

              <Pressable style={styles.submitButton} onPress={handleSubmitInput}>
                <Text style={styles.submitButtonText}>Add</Text>
              </Pressable>

              {selectedBox?.value !== '' && (
                <Pressable
                  style={[styles.submitButton, { backgroundColor: '#FF3B30', marginTop: 10 }]}
                  onPress={handleDeleteInput}
                >
                  <Text style={styles.submitButtonText}>Delete</Text>
                </Pressable>
              )}
            </View>
          </TouchableWithoutFeedback>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  menuButton: {
    fontSize: 26,
  },
  menu: {
    position: 'absolute',
    top: 110,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    zIndex: 999,
  },
  menuItem: {
    fontSize: 16,
    paddingVertical: 12,
  },
  addServerButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  addServerButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    marginBottom: 20,
  },
  name: {
    fontSize: 13,
    marginBottom: 7,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
  },
  boxContainer: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  selectedBoxContainer: {
    borderColor: 'blue',
    borderWidth: 2,
    borderStyle: 'dotted',
    backgroundColor: 'rgba(0, 122, 255, 0.1)', // light blue background
  },
  nextBoxHighlight: {
    borderColor: 'orange',
    borderWidth: 2,
    borderStyle: 'dotted',
    backgroundColor: 'rgba(255, 165, 0, 0.15)', // light orange background
  },
  box: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: '#ddd',
    borderStyle: 'dashed',
    borderColor: '#aaa',
    borderWidth: 0,
  },
  filledBox: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ccc',
    borderWidth: 0,
  },
  boxText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    borderBottomWidth: 1,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  picker: {
    width: 200,
    height: 150,
  },
  toggleInputMode: {
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickServersButton: {
    marginTop: 12,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  pickServersButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  searchInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 16,
  },
  serverListItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
