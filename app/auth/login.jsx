import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from "react-native";
import React, { useState } from "react";
import { api_login } from "../../apis/memberApi";
import { useRouter } from "expo-router";
import { useDispatch } from "react-redux";
import * as SecureStore from "expo-secure-store";
import { loginReducer } from "../../redux/authSlice";
import { AntDesign } from "@expo/vector-icons"; // ✅ 아이콘 사용

const Login = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const [modalType, setModalType] = useState("success"); // "success" | "error"

  const [loginData, setLoginData] = useState({
    userEmail: "",
    userPassword: "",
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalText, setModalText] = useState("");

  const loginData1 = (text, name) => {
    setLoginData({
      ...loginData,
      [name]: text,
    });
  };

  const login = () => {
    api_login(loginData)
      .then((res) => {
        const token = res.headers.authorization;

        if (!token) {
          setModalType("error");
          setModalText("이메일 또는 비밀번호를 확인해주세요.");
          setModalVisible(true);
          return;
        }

        // ✅ JWT 디코딩해서 user 정보 추출
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload)); // RN에서는 base-64 라이브러리 사용할 수도 있음
        const user = {
          userEmail: decodedPayload.sub,
          userName: decodedPayload.userName,
          userRole: decodedPayload.role,
        };

        // ✅ 토큰 저장
        SecureStore.setItemAsync("accessToken", token)
          .then(() => {
            dispatch(
              loginReducer({
                token: token,
                user: user,
              })
            );

            setModalType("success");
            setModalText(`환영합니다`);
            setModalVisible(true); // 성공 모달
          })
          .catch((e) => {
            console.log("토큰 저장 오류:", e);
            setModalType("error");
            setModalText("토큰 저장 중 오류가 발생했습니다.");
            setModalVisible(true);
          });
      })
      .catch((e) => {
        console.log("로그인 요청 실패:", e);
        setModalType("error");
        setModalText("이메일이나 비밀번호를 다시 입력하세요!");
        setModalVisible(true); // 실패 모달
      });
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.container}>
        <Text style={styles.login}>LOGIN</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="이메일 입력하세요"
            value={loginData.userEmail}
            onChangeText={(text) => loginData1(text, "userEmail")}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력하세요"
            value={loginData.userPassword}
            onChangeText={(text) => loginData1(text, "userPassword")}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={login}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View
              style={[
                styles.modalIconWrapper,
                {
                  backgroundColor:
                    modalType === "success" ? "#DBEAFE" : "#FECACA",
                },
              ]}
            >
              <AntDesign
                name={modalType === "success" ? "checkcircleo" : "closecircleo"}
                size={40}
                color={modalType === "success" ? "#3B82F6" : "#EF4444"}
              />
            </View>
            <Text style={styles.modalTitle}>
              {modalType === "success" ? "로그인 성공!" : "로그인 실패"}
            </Text>
            <Text style={styles.modalText}>{modalText}</Text>
            <Pressable
              style={[
                styles.modalButton,
                {
                  backgroundColor:
                    modalType === "success" ? "#3B82F6" : "#EF4444",
                },
              ]}
              onPress={() => {
                setModalVisible(false);
                if (modalType === "success") router.replace("/");
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "bold" }}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Login;

const styles = StyleSheet.create({
  login: {
    fontSize: 60,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 2,
  },
  safearea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: "white",
    marginTop: 100,
  },
  inputWrapper: {
    marginTop: 30,
    marginBottom: 30,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 15,
    borderColor: "#ccc",
  },
  input: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    margin: 5,
    borderRadius: 5,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: "#8ED2B2",
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  // ✅ 모달 스타일 추가
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
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
  modalIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#3B82F6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
