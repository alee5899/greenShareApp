import React, { useCallback, useState } from "react";
import { Image, ActivityIndicator } from "react-native";
import { axiosInstance } from "../apis/axiosInstance";
import { useFocusEffect } from "@react-navigation/native";

const ProfileImageViewer = ({ userEmail, size = 60, style }) => {
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
    return <ActivityIndicator size="small" />;
  }

  return (
    <Image
      source={
        imageData
          ? { uri: `data:image/png;base64,${imageData}` }
          : require("../assets/images/default-profile.png") // 기본 이미지 경로
      }
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#E3F3E8", // 자연스러운 연한 초록 계열 (로딩 전 기본 색)
        ...style
      }}
    />
  );
};

export default ProfileImageViewer;
