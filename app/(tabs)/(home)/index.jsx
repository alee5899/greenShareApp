import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  Modal,
} from "react-native";
import React, { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  deleteLike,
  getPopularPosts,
  insertLike,
} from "../../../apis/plantStory";
import dayjs from "dayjs";
import { AntDesign } from "@expo/vector-icons";
import { useSelector } from "react-redux";

const HomeScreen = () => {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLogin = useSelector((state) => state.auth.isLogin);

  const [showLoginModal, setShowLoginModal] = useState(false);

  const screenWidth = Dimensions.get("window").width;

  const extractThumbnail = (html) => {
    const regex = /<img[^>]+src=\"([^\">]+)\"/i;
    const match = regex.exec(html);
    return match?.[1] ?? null;
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getPopularPosts()
        .then((res) => {
          setPosts(res.data);
        })
        .catch((err) => {
          console.error("인기글 조회 실패:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }, [])
  );

  const toggleLike = (boardNum, index) => {
    const updatedPosts = [...posts];
    const post = updatedPosts[index];

    if (post.isLiked) {
      deleteLike(boardNum)
        .then(() => {
          post.likeCnt -= 1;
          post.isLiked = false;
          setPosts(updatedPosts);
        })
        .catch((error) => {
          console.error("좋아요 해제 실패:", error);
        });
    } else {
      insertLike(boardNum)
        .then(() => {
          post.likeCnt += 1;
          post.isLiked = true;
          setPosts(updatedPosts);
        })
        .catch((error) => {
          console.error("좋아요 등록 실패:", error);
        });
    }
  };

  const renderItem = ({ item, index }) => {
    const thumbnail = extractThumbnail(item.content);
    const textContent =
      item.content.replace(/<[^>]+>/g, "").slice(0, 60) + "...";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => router.push(`/community/${item.boardNum}`)}
        >
          <View style={styles.row}>
            {thumbnail && (
              <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
            )}
            <View style={styles.textBox}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.preview}>{textContent}</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.metaContainer}>
          <Text style={styles.meta}>작성자: {item.userEmail}</Text>

          {/* ✅ 좋아요 하트 */}
          <TouchableOpacity
            onPress={() => {
              if (!isLogin) {
                setShowLoginModal(true);
                return;
              }
              toggleLike(item.boardNum, index);
            }}
          >
            <View style={styles.likeRow}>
              <AntDesign
                name={item.isLiked ? "heart" : "hearto"}
                size={16}
                color={item.isLiked ? "red" : "#5e7b61"}
              />
              <Text style={[styles.meta, { marginLeft: 4 }]}>
                {item.likeCnt}개
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.meta}>
            📅 {dayjs(item.regDate).format("YYYY.MM.DD")}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🌿 오늘의 인기글 Top10 (좋아요 기준)</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#3b6342" />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.boardNum.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listCon}
        />
      )}
      <Modal
        transparent={true}
        visible={showLoginModal}
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>로그인 후 이용 가능합니다!</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3b6342",
    marginBottom: 20,
    textAlign: "center",
  },
  listCon: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#c9e4ca",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  textBox: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2c5f2d",
    marginBottom: 4,
  },
  preview: {
    fontSize: 14,
    color: "#444",
  },
  metaContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  meta: {
    fontSize: 13,
    color: "#5e7b61",
    marginBottom: 3,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  modalButton: {
    backgroundColor: "#3DA66E",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});
