import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
  Pressable,
} from "react-native";
import { getStories, removeLike } from "../../../apis/plantStory";
import {
  getUserRoleFromToken,
  getUserSubFromToken,
} from "../../../redux/authHelper";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message"; // Toast import
import CommunityItem from "../../../components/CommunityItem";
import { useRouter } from "expo-router";
import { Octicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";

// 화면 너비 가져오기
const screenWidth = Dimensions.get("window").width;

const ProfileHomeScreen = () => {
  const router = useRouter();
  const [boardList, setBoardList] = useState([]); // 게시물 목록 상태
  const [loading, setLoading] = useState(false); // 로딩 상태
  const [userEmail, setUserEmail] = useState(null); // 사용자 이메일 상태
  const [userRole, setUserRole] = useState(null); // 사용자 역할 상태
  //const [likeLoading, setLikeLoading] = useState({}); // 각 게시물의 좋아요 요청 상태 관리

  // 사용자 정보 가져옴
  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        try {
          const token = await SecureStore.getItemAsync("accessToken");

          if (token) {
            const email = getUserSubFromToken(token);
            const role = getUserRoleFromToken(token);

            setUserEmail(email);
            setUserRole(role);
          }
        } catch (error) {
          console.error("사용자 정보 로드 실패:", error);
          Alert.alert("오류", "사용자 정보를 가져오는 데 실패했습니다.");
        }
      };

      fetchUserInfo();
    }, [])
  ); // 빈 배열로, 컴포넌트가 마운트될 때 한 번만 실행

  // 게시물 목록 가져오기
  useFocusEffect(
    useCallback(() => {
      const fetchStories = async () => {
        setLoading(true);
        try {
          const response = await getStories();
          setBoardList(response.data);
        } catch (error) {
          alert("오류", "게시물 목록을 가져오는 데 실패했습니다.");
        } finally {
          setLoading(false);
        }
      };

      fetchStories();
    }, [])
  );

  // 팔로우 바뀌면 화면에 반영
  const changeFollowStatus = (followId) => {
    const newBoardList = boardList.map((item) => {
      if (item.userEmail === followId) {
        return {
          ...item,
          isFollow: item.isFollow === "Y" ? "N" : "Y",
        };
      }
      return item;
    });

    setBoardList([...newBoardList]);
  };

  return (
    <LinearGradient
      colors={["white", "white"]} // ✅ 연한 민트-연두
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {loading ? (
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      ) : (
        <FlatList
          data={boardList}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/community/detail",
                  params: { boardNum: item.boardNum },
                });
              }}
            >
              <CommunityItem
                item={item}
                changeFollowStatus={changeFollowStatus}
              />
            </Pressable>
          )}
          keyExtractor={(item) => item.boardNum.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <Pressable
        style={styles.writeBtn}
        onPress={() => router.push("/community/reg-commu")}
      >
        <Octicons name="pencil" size={28} color="white" />
      </Pressable>
    </LinearGradient>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  item: {
    marginBottom: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: "#888",
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    color: "#444",
  },
  imageContainer: {
    width: screenWidth - 32,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: undefined,
    aspectRatio: 1.5,
    borderRadius: 8,
  },
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  likeCount: {
    marginLeft: 8,
    fontSize: 16,
    color: "#444",
  },
  writeBtn: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#007bff",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8, // Android 그림자
    shadowColor: "#000", // iOS 그림자
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});

export default ProfileHomeScreen;
