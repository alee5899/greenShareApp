import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
} from "react-native";
import React, { useCallback, useState } from "react";
import * as SecureStore from "expo-secure-store"; // 토큰을 안전하게 저장하고 꺼내는 라이브러리
import { decode as atob } from "base-64"; // base64 디코딩 (토큰 해석에 필요)
import { useFocusEffect, useRouter } from "expo-router"; // 화면이 포커스될 때마다 실행되는 훅
import { getMyPost } from "../../../apis/plantStory"; // 내 게시글을 가져오는 API
import FollowList from "./followList"; // 팔로우 리스트 컴포넌트
import ProfileImageViewer from "../../../components/ProfileImageViewer.jsx"; // 프로필 이미지 표시 컴포넌트
import ProfileButton from "../../../components/ProfileButton"; // 프로필 버튼 컴포넌트
import CustomText from "../../../components/common/CustomText"; // 커스텀 텍스트 컴포넌트

// 화면의 너비를 가져와서 한 줄에 3개의 이미지가 들어갈 수 있도록 계산
const screenWidth = Dimensions.get("window").width;
const imageSize = Math.floor((screenWidth - 4 * 4) / 3); // 이미지 크기 계산 (여백 포함)

const SerchHomeScreen = () => {
  const [postImages, setPostImages] = useState([]); // 게시글에서 추출한 이미지 목록 저장
  const [user, setUser] = useState(null); // 로그인한 사용자 이메일
  const router = useRouter();

  // 토큰에서 사용자 이메일 추출
  const getUserEmailFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;
      const payload = token.split(".")[1]; // JWT의 두 번째 부분 (payload) 추출
      const decodedPayload = atob(payload); // base64 디코딩
      const decoded = JSON.parse(decodedPayload); // JSON 형태로 파싱
      return decoded.sub; // 이메일 정보
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  // 토큰에서 사용자 이름 추출 (한글 깨짐 방지를 위해 escape + decodeURIComponent 사용)
  const getUserNameFromToken = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) return null;
      const payload = token.split(".")[1];
      const decodedPayload = decodeURIComponent(escape(atob(payload))); // 한글 처리
      const decoded = JSON.parse(decodedPayload);
      return decoded.userName; // 사용자 이름
    } catch (error) {
      console.error("토큰 디코딩 오류:", error);
      return null;
    }
  };

  // HTML 콘텐츠에서 <img> 태그의 src만 추출해서 배열로 반환
  const extractImages = (content) => {
    const regex = /<img[^>]+src=\"([^">]+)\"/g;
    const images = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
      images.push(match[1]); // 이미지 주소만 추출
    }
    return images;
  };

  // 화면에 들어올 때마다 내 게시글 불러오기
  useFocusEffect(
    useCallback(() => {
      getUserEmailFromToken().then((userEmail) => {
        if (!userEmail) return;
        setUser(userEmail); // 사용자 상태 저장
        getMyPost(userEmail)
          .then((res) => {
            //받아온 데이터에서 이미지만 가져오기
            const images = res.data.flatMap((post) =>
              extractImages(post.content).map((url) => ({
                boardNum: post.boardNum,
                thumbnail: url,
              }))
            );
            setPostImages(images); // 이미지 상태 저장
          })
          .catch((err) => console.log("내 글 가져오기 오류:", err));
      });
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      {/* 팔로우 리스트 영역 */}
      <FollowList userEmail={user} />

      {/* 프로필 이미지 + 이름 + 이메일 + 버튼 */}
      <View style={styles.proCon}>
        <ProfileImageViewer userEmail={user} />

        {/* 팔로우 리스트를 컴포넌트로 따로 빼서 버튼을 누르면 호출하도록 변경 */}
        {/* 아래는 팔로우리스트 버튼 만들 예정 */}
        {/* <View style={styles.fontCon}>
          <View>
            <CustomText weight="Bold" size={22}>
              {getUserNameFromToken()}
            </CustomText>
            <CustomText weight="Light" size={14} col="gray">
              {getUserEmailFromToken()}
            </CustomText>
          </View>
          <ProfileButton />
        </View> */}

        <View style={styles.fontCon}>
          <View>
            <CustomText weight="Bold" size={22}>
              {/* 사용자 이름 비동기 호출 → UI에 바로 반영은 어려워서 별도 상태화 추천 */}
              {getUserNameFromToken()}
            </CustomText>
            <CustomText weight="Light" size={14} col="gray">
              {getUserEmailFromToken()}
            </CustomText>
          </View>
          <ProfileButton setUser={setUser} />
        </View>
      </View>

      {/* 피드 제목 */}
      <Text style={styles.title}>마이 스토리</Text>

      {/* 이미지 3열 그리드 형태로 보여주기 */}
      <FlatList
        data={postImages}
        keyExtractor={(item, index) => index.toString()}
        numColumns={3} // 3개씩 보여주기
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.imageBox}
            onPress={() =>
              router.push({
                pathname: "/community/detail",
                params: { boardNum: item.boardNum },
              })
            }
          >
            <Image source={{ uri: item.thumbnail }} style={styles.image} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>작성한 글이 없습니다.</Text>
        }
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

export default SerchHomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2f3542",
  },
  proCon: {
    flexDirection: "row",
    paddingHorizontal: 10,
    gap: 20,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  fontCon: {
    justifyContent: "space-around",
    height: 90,
    width: 120,
    gap: 10,
  },
  grid: {
    alignItems: "center",
  },
  imageBox: {
    width: imageSize,
    height: imageSize,
    margin: 2,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#eee", // 로딩 전에도 박스 형태 보이게
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 40,
    fontSize: 16,
  },
});
