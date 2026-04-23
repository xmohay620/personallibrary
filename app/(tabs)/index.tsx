import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import db, { initDatabase } from '../../database';

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
  currentPage: string;
}

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // حقول التعديل
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editPage, setEditPage] = useState('');

  // جلب البيانات من SQL
  const loadBooks = () => {
    try {
      initDatabase(); // التأكد من وجود الجدول
      const allRows = db.getAllSync('SELECT * FROM books') as Book[];
      setBooks(allRows);
    } catch (e) {
      console.error("Error loading from DB", e);
    }
  };

  useFocusEffect(useCallback(() => { loadBooks(); }, []));

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setEditTitle(book.title);
    setEditAuthor(book.author);
    setEditStatus(book.status);
    setEditPage(book.currentPage || '0');
    setEditModalVisible(true);
  };

  const handleUpdateBook = () => {
    if (!selectedBook) return;
    try {
      const pageValue = editStatus === 'Currently Reading' ? editPage : '0';
      // تحديث البيانات باستخدام SQL Update
      db.runSync(
        'UPDATE books SET title = ?, author = ?, status = ?, currentPage = ? WHERE id = ?',
        [editTitle, editAuthor, editStatus, pageValue, selectedBook.id]
      );
      loadBooks(); // تحديث الشاشة
      setEditModalVisible(false);
    } catch (e) { console.error(e); }
  };

  const deleteBook = (id: number) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          db.runSync('DELETE FROM books WHERE id = ?', [id]);
          loadBooks();
      }}
    ]);
  };

  const renderSection = (status: string, title: string) => {
    const filtered = books.filter(b => b.status === status);
    if (filtered.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionHeader}>{title} ({filtered.length})</Text>
        {filtered.map(item => (
          <View key={item.id} style={styles.bookCard}>
            <View style={styles.bookInfo}>
              <Text style={styles.bookTitle}>{item.title}</Text>
              <Text style={styles.bookAuthor}>by {item.author}</Text>
              {item.status === 'Currently Reading' && (
                <Text style={styles.pageInfo}>Current Page: {item.currentPage}</Text>
              )}
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteBook(item.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}><Text style={styles.headerTitle}>My Library 📚</Text></View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {books.length === 0 ? (
          <Text style={styles.emptyMsg}>Your library is empty. Add your first book!</Text>
        ) : (
          <>
            {renderSection('Currently Reading', 'Currently Reading 📖')}
            {renderSection('Want to Read', 'Want to Read ⏳')}
            {renderSection('Read', 'Completed Books ✅')}
          </>
        )}
      </ScrollView>

      {/* Modal التعديل */}
      <Modal visible={editModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Book Details</Text>
            <Text style={styles.inputLabel}>Title:</Text>
            <TextInput style={styles.modalInput} value={editTitle} onChangeText={setEditTitle} />
            <Text style={styles.inputLabel}>Author:</Text>
            <TextInput style={styles.modalInput} value={editAuthor} onChangeText={setEditAuthor} />
            <Text style={styles.inputLabel}>Status:</Text>
            <View style={styles.statusRow}>
              {['Read', 'Currently Reading', 'Want to Read'].map(s => (
                <TouchableOpacity key={s} style={[styles.statusOption, editStatus === s && styles.statusOptionActive]} onPress={() => setEditStatus(s)}>
                  <Text style={[styles.statusOptionText, editStatus === s && styles.statusOptionTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {editStatus === 'Currently Reading' && (
              <TextInput style={styles.modalInput} keyboardType="numeric" value={editPage} onChangeText={setEditPage} />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateBook}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-book')}>
        <Text style={styles.addButtonText}>+ Add New Book</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', marginTop: 40 },
  header: { padding: 20, backgroundColor: '#0F172A', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  scrollContent: { padding: 15 },
  sectionContainer: { marginBottom: 25 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingBottom: 5 },
  bookCard: { backgroundColor: '#FFFFFF', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 3 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 17, fontWeight: 'bold', color: '#1E293B' },
  bookAuthor: { fontSize: 14, color: '#64748B' },
  pageInfo: { fontSize: 13, color: '#3B82F6', fontWeight: 'bold', marginTop: 5 },
  cardActions: { justifyContent: 'space-around', alignItems: 'flex-end' },
  editBtn: { backgroundColor: '#F1F5F9', padding: 6, borderRadius: 6, marginBottom: 5 },
  editBtnText: { color: '#334155', fontWeight: 'bold', fontSize: 12 },
  deleteBtn: { backgroundColor: '#FEE2E2', padding: 6, borderRadius: 6 },
  deleteBtnText: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  addButton: { backgroundColor: '#2563EB', padding: 16, margin: 20, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  emptyMsg: { textAlign: 'center', color: '#94A3B8', marginTop: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  inputLabel: { fontWeight: 'bold', color: '#475569', marginBottom: 5 },
  modalInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 10, marginBottom: 15 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statusOption: { flex: 1, padding: 8, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, marginHorizontal: 2, alignItems: 'center' },
  statusOptionActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  statusOptionText: { fontSize: 10, color: '#64748B' },
  statusOptionTextActive: { color: '#FFFFFF' },
  modalActions: { flexDirection: 'row' },
  updateBtn: { backgroundColor: '#10B981', flex: 1, padding: 15, borderRadius: 10, marginRight: 5, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#EF4444', flex: 1, padding: 15, borderRadius: 10, marginLeft: 5, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontWeight: 'bold' }
});