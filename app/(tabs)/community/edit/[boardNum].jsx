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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDetailStories, upDateStories } from '../../../../apis/plantStory';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import Toast from 'react-native-toast-message';

const EditScreen = () => {
  const { boardNum } = useLocalSearchParams();
  const router = useRouter();
  const editorRef = useRef(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      await upDateStories(Number(boardNum), { title, content });

      Toast.show({
        type: 'success',
        text1: '수정 완료',
        text2: '게시글이 성공적으로 수정되었습니다!',
        position: 'top',
      });

      setTimeout(() => {
        router.replace(`/community/detail?boardNum=${boardNum}`);
      }, 1500);
    } catch (error) {
      console.error('게시글 수정 실패:', error.response?.data || error.message);
      Alert.alert('수정 실패', '게시글 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // JPG 파일만 허용
        if (!imageUri.endsWith('.jpg') && !imageUri.endsWith('.jpeg')) {
          Alert.alert('오류', 'JPG 파일만 업로드할 수 있습니다.');
          return;
        }

        // 이미지 리사이즈 및 압축 + base64 변환
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1024 } }],
          {
            compress: 0.7,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const base64Image = `data:image/jpeg;base64,${manipulated.base64}`;
        editorRef.current?.insertHTML(
          `<img src="${base64Image}" style="max-width:100%;height:auto;" />`
        );
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 불러오는 중 문제가 발생했습니다.');
      console.log('이미지 오류:', error.message);
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>게시글 수정</Text>

      <View style={styles.titleBox}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <RichEditor
        ref={editorRef}
        initialContentHTML={content}
        placeholder="내용을 입력하세요"
        style={styles.editor}
        initialHeight={400}
        onChange={(html) => setContent(html)}
      />

      <RichToolbar
        editor={editorRef}
        actions={[actions.insertImage, actions.setBold, actions.setItalic, actions.setUnderline]}
        onPressAddImage={handleInsertImage}
      />

      <View style={styles.btnContainer}>
        <Button title="저장하기" onPress={handleSave} />
      </View>

      <Toast />
    </ScrollView>
  );
};

export default EditScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
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
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  titleBox: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
  },
  editor: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 12,
    height: 400,
  },
  btnContainer: {
    marginTop: 20,
    gap: 16,
  },
});
