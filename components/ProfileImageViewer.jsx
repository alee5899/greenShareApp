import React, { useCallback, useEffect, useState } from "react";
import { View, Image, ActivityIndicator, StyleSheet } from "react-native";
import { axiosInstance } from "../apis/axiosInstance";
import { useFocusEffect } from "@react-navigation/native";

const ProfileImageViewer = ({ userEmail }) => {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchProfileImage = async () => {
    try {
      const res = await axiosInstance.get("/profiles", {
        params: { userEmail },
      });
      setImageData(res.data.imageData);
    } catch (error) {
      console.error("프로필 이미지 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      if (userEmail) {
        fetchProfileImage();
      }
    }, [userEmail])
  );

  if (loading) {
    return <ActivityIndicator />;
  }

  return (
    <View style={styles.container}>
      {imageData ? (
        <Image
          source={{ uri: `data:image/png;base64,${imageData}` }}
          style={styles.image}
        />
      ) : (
        <Image
          source={require("../assets/images/default-profile.png")} // 기본 이미지 경로
          style={styles.image}
        />
      )}
    </View>
  );
};

export default ProfileImageViewer;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ccc",
  },
});
