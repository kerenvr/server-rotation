import React, { useState } from 'react';
import RotationScreen from '../../components/RotationScreen';
import ServerSelection from '../../components/ServerSelection';
import { Server } from '../../database/servers';

export default function App() {
  const [selectedServers, setSelectedServers] = useState<Server[]>([]);
  const [showRotation, setShowRotation] = useState(false);

  if (!showRotation) {
    return (
      <ServerSelection
        selectedServers={selectedServers}
        setSelectedServers={setSelectedServers}
        onConfirm={() => setShowRotation(true)}
      />
    );
  }

  return (
    <RotationScreen
      servers={selectedServers}
      onReset={() => {
        setSelectedServers([]);
        setShowRotation(false);
      }}
    />
  );
}
