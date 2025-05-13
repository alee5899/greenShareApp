import {
  Dimensions, // 사진조절
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import Toast from "react-native-toast-message"; // 알림창
// apis
import { deleteLike, insertLike } from "../apis/plantStory";
import { deleteFollows, insertFollows } from "../apis/follow";
//아이콘
import CustomText from "./common/CustomText";
import { Feather } from "@expo/vector-icons";
import Octicons from "@expo/vector-icons/Octicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Animatable from "react-native-animatable"; // 애니메이션 라이브러리
import ProfileImageViewer from "./ProfileImageViewer";

// 사진 너비 조절
const screenWidth = Dimensions.get("window").width;

const CommunityItem = ({ item, changeFollowStatus }) => {
  const [selectedItem, setSelectedItem] = useState({}); // 게시글을 각각의 게시글
  const [isLiked, setIsLiked] = useState(false); // 좋아요 상태
  const [isFollowed, setIsFollowed] = useState(null); // 팔로우 상태
  const [followList, setFollowList] = useState({
    fromUserEmail: "", // 팔로우 할려는 사람
    toUserEmail: "", // 게시글을 작성한 사람
  });
  const [heartAnimation, setHeartAnimation] = useState(false); // 애니메이션 상태

  // 이메일 추출한 getUserEmailFromToken useEffect 실행
  useEffect(() => {
    getUserEmailFromToken();
  }, []);

  // 토큰에 저장된 이메일 추출
  const getUserEmailFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      setFollowList({
        ...followList,
        toUserEmail: item.userEmail,
        fromUserEmail: decoded.sub,
      });
      return decoded.sub;
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  useEffect(() => {
    setSelectedItem(item); // 게시글을 setSelectedItem에 저장
    setIsLiked(item.isLike === "Y"); // 좋아요가 Y인지 확인 Y이면 좋아요 상태로 바뀜
    setIsFollowed(item.isFollow === "Y"); // 팔로우가 Y인지 확인 Y이면 팔로우 상태로 바뀜
    // item값이 바뀌면 재실행
  }, [item]);

  // 로그인 안하면 팔로우 불가능
  const followInfo = async (boardNum) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) {
      // Toast message 알림창
      Toast.show({
        type: "error",
        position: "top",
        text1: "로그인 필요",
        text2: "팔로우를 누르려면 로그인해야 합니다.",
      });
      return;
    }

    try {
      // 팔로우 취소 / 가능 기능
      if (isFollowed) {
        await deleteFollows(followList.toUserEmail, followList.fromUserEmail); // 팔로우 취소 API
        setIsFollowed(false);
        changeFollowStatus(selectedItem.userEmail);
      } else {
        await insertFollows(selectedItem.userEmail); // 팔로우 가능 API
        setIsFollowed(true);
        changeFollowStatus(selectedItem.userEmail);
      }
    } catch (error) {
      console.error("팔로우 처리 중 오류:", error);
      Toast.show({
        type: "error",
        position: "top",
        text1: "팔로우 처리 실패",
        text2: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  // 이미지 추출 (HTML 태그에서 이미지 URL만 추출)
  const extractImages = (content) => {
    const regex = /<img[^>]+src="([^">]+)"/g;
    const images = [];
    let match;
    // 문자열 계속 찾을 때까지 반복
    while ((match = regex.exec(content)) !== null) {
      images.push(match[1]);
    }
    return images;
  };

  // 좋아요 토글 (클릭 시 상태 변경)
  const handleLikeToggle = async (boardNum) => {
    const token = await SecureStore.getItemAsync("accessToken");
    if (!token) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "로그인 필요",
        text2: "좋아요를 눌르려면 로그인해야 합니다.",
      });
      return;
    }

    try {
      // 좋아요 취소 / 추가
      if (isLiked) {
        await deleteLike(boardNum); // 좋아요 취소 API
        setIsLiked(false);

        // 좋아요 수 감소 처리
        setSelectedItem((prevState) => ({
          ...prevState,
          likeCnt: prevState.likeCnt - 1,
        }));
      } else {
        await insertLike(boardNum); // 좋아요 추가 API
        setIsLiked(true);

        // 좋아요 수 증가 처리
        setSelectedItem((prevState) => ({
          ...prevState,
          likeCnt: prevState.likeCnt + 1,
        }));

        // 좋아요가 추가될 때만 애니메이션 시작
        setHeartAnimation(true);
        setTimeout(() => setHeartAnimation(false), 1000); // 애니메이션 끝나면 상태 초기화
      }
    } catch (error) {
      console.error("좋아요 처리 중 오류:", error);
      Toast.show({
        type: "error",
        position: "top",
        text1: "좋아요 처리 실패",
        text2: "잠시 후 다시 시도해주세요.",
      });
    }
  };

  return (
    <View style={styles.item}>
      <View style={styles.header}>
        <View style={styles.row}>
          <ProfileImageViewer
            userEmail={item.userEmail}
            size={40}
            style={{
              borderWidth: StyleSheet.hairlineWidth,
            }}
          />
          <View>
            <CustomText weight="Medium" size={17}>
              {item.userName}
            </CustomText>
            <CustomText style={styles.email} size={12} weight="Light">
              {item.userEmail}
            </CustomText>
          </View>
        </View>
        {item.userEmail === followList.fromUserEmail ? null : (
          <Pressable onPress={() => followInfo(item.boardNum)}>
            <View
              style={[
                styles.followButton,
                isFollowed && styles.followingButton,
              ]}
            >
              <CustomText
                style={[styles.followText, isFollowed && styles.followingText]}
              >
                {isFollowed ? "팔로잉" : "팔로우"}
              </CustomText>
            </View>
          </Pressable>
        )}
      </View>

      {/* 이미지 주소(url) 추출 */}
      {extractImages(item.content).map((imgUrl, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri: imgUrl }} style={styles.image} />
        </View>
      ))}

      {/* 제목 추출 */}
      <CustomText style={styles.title} weight="Bold">
        {item.title}
      </CustomText>
      <Text style={styles.preview}>
        {/* html 코드 제거 */}
        {item.content.replace(/<[^>]+>/g, "").substring(0, 100)}
      </Text>

      <View style={styles.iconContainer}>
        {/* 좋아요 */}
        <Pressable onPress={() => handleLikeToggle(item.boardNum)}>
          <View style={styles.likeButton}>
            <Text>좋아요</Text>
            <Animatable.View animation={heartAnimation ? "zoomIn" : null}>
              <Octicons
                name={isLiked ? "heart-fill" : "heart"}
                size={20}
                color="red"
              />
            </Animatable.View>
            <Text style={{ color: isLiked ? "red" : "#333" }}>
              {selectedItem.likeCnt}
            </Text>
          </View>
        </Pressable>

        {/* 댓글 */}
        <View style={styles.message}>
          <Text>댓글</Text>
          <Feather
            name="message-circle"
            size={20}
            color="black"
            style={{ transform: [{ scaleX: -1 }] }}
          />
          <Text>{item.replyCnt}</Text>
        </View>

        {/* 조회수 */}
        <View style={styles.viewCountContainer}>
          <Text>조회수</Text>
          <MaterialCommunityIcons name="eye-outline" size={20} color="black" />
          <Text>{item.readCnt}</Text>
        </View>
      </View>
    </View>
  );
};

export default CommunityItem;

const styles = StyleSheet.create({
  item: {
    width: screenWidth, // ✅ 화면 너비만큼 꽉 채우기
    alignSelf: "center", // ✅ 정렬 안전하게 중앙으로
    padding: 16,
    marginBottom: 16,
    borderRadius: 14,
    backgroundColor: "#ffffff",

    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "gray",
    shadowColor: "gray",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5, // Android 그림자
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  followButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 6,
    width: 70,
  },
  followText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  },
  imageContainer: {
    width: screenWidth - 32, // 카드 padding 감안
    alignSelf: "center",
    marginBottom: 12,
  },

  image: {
    width: "100%",
    height: 220, // 너무 크면 비율 깨짐
    resizeMode: "cover", // 이미지 비율 유지하며 채우기
  },

  title: {
    fontSize: 18,
  },

  preview: {
    fontSize: 14,
    color: "#444",
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },

  likeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
  },

  likeCount: {
    marginLeft: 5,
  },
  viewCountContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
  },

  eyeText: {
    marginRight: 3,
    marginLeft: 8,
  },
  message: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  // 팔로우 상태일 때 버튼 스타일
  followingButton: {
    backgroundColor: "#2ab170",
    borderWidth: 0,
  },
  followingText: {
    color: "white",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
