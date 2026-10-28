import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const ServerUrlModal: React.FC<Props> = ({ visible, onClose }) => {
  const apiBaseUrl = useAuthStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useAuthStore((s) => s.setApiBaseUrl);
  const theme = useAuthStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!urlInput.trim()) return;
    setSaving(true);
    await setApiBaseUrl(urlInput.trim());
    setSaving(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Backend API Server URL
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            When using Expo Go on a physical phone, replace localhost with your computer's Wi-Fi IPv4 address (e.g., http://192.168.1.5:4000/api).
          </Text>

          <TextInput
            value={urlInput}
            onChangeText={setUrlInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://192.168.1.5:4000/api"
            placeholderTextColor="#94A3B8"
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                color: isDark ? '#F8FAFC' : '#0F172A',
                borderColor: isDark ? '#334155' : '#CBD5E1',
              },
            ]}
          />

          <View style={styles.presetRow}>
            <TouchableOpacity
              onPress={() => setUrlInput('http://localhost:4000/api')}
              style={[styles.presetBtn, { borderColor: isDark ? '#334155' : '#CBD5E1' }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#CBD5E1' : '#475569' }}>
                Web / iOS Sim (localhost)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setUrlInput('http://10.0.2.2:4000/api')}
              style={[styles.presetBtn, { borderColor: isDark ? '#334155' : '#CBD5E1' }]}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#CBD5E1' : '#475569' }}>
                Android Emulator (10.0.2.2)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={{ fontWeight: '700', color: isDark ? '#94A3B8' : '#64748B' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>
                {saving ? 'Saving...' : 'Save Server URL'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginBottom: 18,
  },
  presetBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  saveBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
  },
});
