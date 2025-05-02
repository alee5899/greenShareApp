import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { decode as atob } from "base-64"; // 여기가 핵심!

import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { axiosInstance } from "../apis/axiosInstance";
import * as ImageManipulator from "expo-image-manipulator";
import * as SecureStore from "expo-secure-store";
import { colors } from "../constants/colorConstant";

const ProfileButton = ({ setUser }) => {
  /* 이미지 압축 함수 */
  const resizeTo45x45 = async (uri) => {
    try {
      const resizedResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 100, height: 100 } }],
        { base64: true, format: ImageManipulator.SaveFormat.PNG }
      );
      return resizedResult.base64;
    } catch (error) {
      console.error("이미지 리사이즈 실패:", error);
      return null;
    }
  };

  /* 이메일 받아오는 함수 */
  const getUserEmailFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;

      const payload = token.split(".")[1];
      const decodedPayload = atob(payload); // base64 디코딩
      const decoded = JSON.parse(decodedPayload);
      console.log("Decoded email:", decoded.sub);
      return decoded.sub;
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  /* 이미지 선택해서 보내는 함수 */
  const pickAndUploadImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const originalUri = result.assets[0].uri;
      const resizedBase64 = await resizeTo45x45(originalUri);

      const email = await getUserEmailFromToken(); // ← 여기서 await로 이메일 받아오기

      const profileData = {
        userEmail: email,
        imageData: resizedBase64,
      };

      try {
        await axiosInstance.post("/profiles", profileData);
        Alert.alert("업로드 성공");
        setUser(new String(email));
      } catch (error) {
        console.error("업로드 실패:", error);
        Alert.alert("업로드 실패", "서버에 전송 실패");
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickAndUploadImage} style={styles.button}>
        <Text style={styles.buttonText}>프로필 변경</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileButton;
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  button: {
    backgroundColor: colors.MAIN,
    paddingVertical: 6,
    borderRadius: 6,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
