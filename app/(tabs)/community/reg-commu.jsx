import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";
import * as ImagePicker from "expo-image-picker"; // 이미지 선택 라이브러리
import * as ImageManipulator from "expo-image-manipulator"; // 이미지 리사이즈/압축
import { axiosInstance } from "../../../apis/axiosInstance";
import Toast from "react-native-toast-message"; // 성공/오류 알림 메시지

const FarmerCommunityInsert = () => {
  const router = useRouter(); // 페이지 이동을 위한 훅
  const editorRef = useRef(null); // 에디터 조작용 참조

  const [title, setTitle] = useState(""); // 제목 입력 값
  const [content, setContent] = useState(""); // 본문 입력 값
  const [loading, setLoading] = useState(false); // 로딩 표시 상태

  // ✅ 이미지 삽입 핸들러
  const imageHandler = async () => {
    try {
      // 이미지 갤러리 열기 (mediaTypes 없이 사용)
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true, // 사용자가 자를 수 있도록 허용
        aspect: [4, 3], // 자를 때 기본 비율
        quality: 1, // 원본 품질로 불러오기
      });

      // 사용자가 이미지를 선택했을 때만 처리
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;

        // 파일 이름이 .jpg 또는 .jpeg로 끝나는지 검사
        if (!imageUri.endsWith(".jpg") && !imageUri.endsWith(".jpeg")) {
          Alert.alert("오류", "JPG 파일만 업로드할 수 있습니다.");
          return;
        }

        // 이미지 압축 및 리사이징
        const manipulated = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1024 } }], // 너비 최대 1024로 제한
          {
            compress: 0.7, // 70% 압축
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true, // base64로 변환 (에디터 삽입용)
          }
        );

        // 에디터에 이미지 삽입
        const base64Image = `data:image/jpeg;base64,${manipulated.base64}`;
        editorRef.current?.insertHTML(
          `<img src="${base64Image}" style="max-width:100%;height:auto;" />`
        );
      }
    } catch (error) {
      Alert.alert("오류", "이미지를 불러오는 중 문제가 발생했습니다.");
      console.log("이미지 오류:", error.message);
    }
  };

  // ✅ 게시글 작성 요청
  const sendInsert = () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("알림", "제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setLoading(true); // 로딩 시작

    axiosInstance
      .post("/plantStories", {
        title,
        content,
      })
      .then(() => {
        Toast.show({
          type: "success",
          text1: "성공",
          text2: "게시글이 등록되었습니다!",
          position: "top",
        });
        router.push("/community"); // 등록 후 목록으로 이동
      })
      .catch((error) => {
        console.error("등록 오류:", error.response?.data || error.message);
        Alert.alert("에러", "등록 중 오류가 발생했습니다.");
      })
      .finally(() => {
        setLoading(false); // 로딩 끝
      });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>이야기를 올려주세요!</Text>

      {/* 제목 입력 */}
      <View style={styles.titleBox}>
        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.input}
          placeholder="제목을 입력하세요"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* 본문 입력 (에디터) */}
      <RichEditor
        ref={editorRef}
        initialContentHTML=""
        placeholder="내용을 입력하세요"
        style={styles.editor}
        initialHeight={400}
        onChange={(html) => setContent(html)}
      />

      {/* 에디터 도구 모음 */}
      <RichToolbar
        editor={editorRef}
        actions={[
          actions.insertImage,
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
        ]}
        onPressAddImage={imageHandler}
      />

      {/* 버튼 영역 */}
      <View style={styles.btnContainer}>
        <Button title="목록 가기" onPress={() => router.push("/community")} />
        <Button title="작성 완료" onPress={sendInsert} />
      </View>

      {/* 로딩 표시 */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#4CAF50"
          style={{ marginTop: 20 }}
        />
      )}

      {/* 알림 메시지 표시 */}
      <Toast />
    </ScrollView>
  );
};

export default FarmerCommunityInsert;

// ✅ 스타일 설정
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
    flexGrow: 1,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
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
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  editor: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 12,
    height: 400,
  },
  btnContainer: {
    marginTop: 20,
    gap: 16,
  },
});
