import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDetailStories, upDateStories } from '../../../../apis/plantStory';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker'; // 📸 이미지 선택 기능 추가

const EditScreen = () => {
  const { boardNum } = useLocalSearchParams();
  const router = useRouter();
  const editorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          if (!boardNum || isNaN(Number(boardNum))) {
            throw new Error('유효하지 않은 boardNum입니다.');
          }

          const res = await getDetailStories(Number(boardNum));

          if (!res?.data) {
            throw new Error('게시글 데이터를 받지 못했습니다.');
          }

          setTitle(res.data.title || '');
          setContent(res.data.content || '');
        } catch (error) {
          console.error('게시글 불러오기 실패:', error);
          Alert.alert('오류', '게시글을 불러오지 못했습니다.');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [boardNum])
  );

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('입력 확인', '제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await upDateStories(Number(boardNum), { title, content });
      setShowModal(true);
    } catch (error) {
      console.error('게시글 수정 실패:', error.response?.data || error.message);
      Alert.alert('수정 실패', '게시글 수정 중 오류가 발생했습니다.');
    }
  };

  const handleInsertImage = async () => {
    try {
      // 이미지 라이브러리 열기
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        editorRef.current?.insertImage(imageUri);
      }
    } catch (error) {
      console.error('이미지 선택 실패:', error);
      Alert.alert('오류', '이미지를 선택하지 못했습니다.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>게시글 수정</Text>

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="제목을 입력하세요"
        />

        <Text style={styles.label}>내용</Text>

        <View style={styles.editorContainer}>
          <RichEditor
            ref={editorRef}
            initialContentHTML={content}
            onChange={(html) => setContent(html)}
            placeholder="내용을 입력하세요"
            style={styles.editor}
            initialHeight={300}
          />
        </View>

        <RichToolbar
          editor={editorRef}
          actions={[
            actions.insertImage,
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
          ]}
          style={styles.toolbar}
          onPressAddImage={handleInsertImage} // ✨ 이미지 삽입 핸들러 연결
        />

        <Button title="저장하기" onPress={handleSave} />
      </ScrollView>

      {showModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIcon}>
              <Text style={{ fontSize: 32, color: "#10B981" }}>✔</Text>
            </View>
            <Text style={styles.modalTitle}>수정 완료!</Text>
            <Text style={styles.modalDesc}>게시글이 성공적으로 수정되었습니다.</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => {
                setShowModal(false);
                router.replace(`/community/detail?boardNum=${boardNum}`);
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>확인</Text>
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
};

export default EditScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
    marginTop: 12,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  editorContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  editor: {
    flex: 1,
    minHeight: 300,
    fontSize: 16,
    padding: 10,
  },
  toolbar: {
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#D1FAE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#10B981",
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#10B981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
