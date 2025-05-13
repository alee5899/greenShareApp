import React, { useState, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import * as SecureStore from "expo-secure-store";
import { logoutReducer } from "../redux/authSlice";
import logo from "./../assets/images/greenshare.png";
import { AntDesign } from "@expo/vector-icons";

const Header = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const auth = useSelector((state) => state.auth);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState(""); // ✅ 사용자 이름 상태

  useEffect(() => {
    const fetchUserName = async () => {
      const name = await getUserNameFromToken();
      if (name) setUserName(name);
    };


    fetchUserName();
  }, []);

  const handleLogout = () => {
    SecureStore.deleteItemAsync("accessToken")
      .then(() => {
        setShowLogoutModal(false);
        dispatch(logoutReducer());
        router.replace("/");
      })
      .catch((error) => console.error("SecureStore 오류:", error));
  };

  const getUserNameFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;

      const payload = token.split(".")[1];
      const decodedPayload = decodeURIComponent(escape(atob(payload))); // base64 디코딩
      const decoded = JSON.parse(decodedPayload);
      console.log("Decoded name:", decoded.userName);
      return decoded.userName;
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  return (
    <>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <View style={styles.loginStatus}>
          {auth.isLogin ? (
            <>
              <Text>{userName} 님 반갑습니다.</Text>
              <Pressable onPress={() => setShowLogoutModal(true)}>
                <Text style={{ color: "#EF4444", fontWeight: "bold" }}>
                  로그아웃
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => router.push("/auth/login")}>
                <Text>로그인</Text>
              </Pressable>
              <Pressable onPress={() => router.push("/auth/join")}>
                <Text>회원가입</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      {/* 로그아웃 모달 */}
      {showLogoutModal && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalIcon}>
              <AntDesign name="logout" size={32} color="#10B981" />
            </View>
            <Text style={styles.modalText}>로그아웃 하시겠어요?</Text>
            <View style={styles.modalButtons}>
              <Pressable style={styles.confirmBtn} onPress={handleLogout}>
                <Text style={{ color: "#fff" }}>확인</Text>
              </Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={{ color: "#555" }}>취소</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </>
  );
};

export default Header;

const styles = StyleSheet.create({
  headerContainer: {
    height: 40,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    alignItems: "center",
  },
  loginStatus: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  logo: {
    height: 30,
    width: 130,
  },
  // 모달 스타일
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
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    elevation: 10,
  },
  modalText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
  },
  confirmBtn: {
    backgroundColor: "#EF4444",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelBtn: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
});
