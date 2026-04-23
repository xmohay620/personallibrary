import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db from '../database';

export default function AddBook() {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [currentPage, setCurrentPage] = useState('0');
  const [status, setStatus] = useState('Currently Reading');

  const saveBook = () => {
    if (!title || !author) {
      Alert.alert('Error', 'Please enter Title and Author');
      return;
    }

    try {
      const pageValue = status === 'Currently Reading' ? currentPage : '0';
      
      db.runSync(
        'INSERT INTO books (title, author, status, currentPage) VALUES (?, ?, ?, ?)',
        [title, author, status, pageValue]
      );
      router.back();
    } catch (e) {
      console.error("Error saving to SQL", e);
      Alert.alert('Error', 'Failed to save book');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Book 📖</Text>
      
      <Text style={styles.label}>Book Title</Text>
      <TextInput style={styles.input} placeholder="e.g. Atomic Habits" value={title} onChangeText={setTitle} />
      
      <Text style={styles.label}>Author Name</Text>
      <TextInput style={styles.input} placeholder="e.g. James Clear" value={author} onChangeText={setAuthor} />
      
      {status === 'Currently Reading' && (
        <>
          <Text style={styles.label}>Current Page</Text>
          <TextInput style={styles.input} placeholder="0" value={currentPage} onChangeText={setCurrentPage} keyboardType="numeric" />
        </>
      )}

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {['Read', 'Currently Reading', 'Want to Read'].map((s) => (
          <TouchableOpacity key={s} style={[styles.statusBtn, status === s && styles.activeBtn]} onPress={() => setStatus(s)}>
            <Text style={[styles.statusTxt, status === s && styles.activeTxt]}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={saveBook}><Text style={styles.saveTxt}>Add to Library</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()} style={styles.cancelContainer}><Text style={styles.cancelTxt}>Go Back</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#F8FAFC', marginTop: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#0F172A', marginBottom: 30 },
  label: { fontWeight: 'bold', color: '#475569', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 35 },
  statusBtn: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, marginHorizontal: 3, alignItems: 'center' },
  activeBtn: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  statusTxt: { fontSize: 10, color: '#64748B', fontWeight: 'bold' },
  activeTxt: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: '#10B981', padding: 18, borderRadius: 12, alignItems: 'center' },
  saveTxt: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  cancelContainer: { marginTop: 20 },
  cancelTxt: { textAlign: 'center', color: '#EF4444', fontWeight: 'bold' }
});