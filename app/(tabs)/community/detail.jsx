import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Alert,
  Dimensions,
  Image,
  TextInput,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getDetailStories,
  deleteStories,
  insertReply,
  replyList,
  deleteReply,
} from "../../../apis/plantStory"; // 게시글/댓글 관련 API 함수들
import RenderHtml from "react-native-render-html"; // 게시글 본문 HTML 렌더링용
import * as SecureStore from "expo-secure-store"; // 토큰 저장소
import { useFocusEffect } from "@react-navigation/native"; // 화면 포커스 감지
import { useSelector } from "react-redux"; // Redux 상태관리
import {
  getUserSubFromToken,
  getUserRoleFromToken,
} from "../../../redux/authHelper"; // 토큰 정보 파싱 함수
import dayjs from "dayjs"; // 날짜 포맷팅용
import { axiosInstance } from "../../../apis/axiosInstance"; // Axios 인스턴스
import ProfileImageViewer from "../../../components/ProfileImageViewer"; // 프로필 이미지 컴포넌트

// 메인 컴포넌트 시작
const DetailScreen = () => {
  const { boardNum } = useLocalSearchParams(); // URL에서 게시글 번호 가져오기
  const router = useRouter(); // 페이지 이동 함수
  const screenWidth = Dimensions.get("window").width; // 현재 화면 너비 가져오기

  //  게시글 & 댓글 상태값 정의
  const [detailData, setDetailData] = useState(null); // 게시글 데이터
  const [loading, setLoading] = useState(true); // 로딩 여부

  const [replyInfo, setReplyInfo] = useState({}); // 댓글 작성 내용
  const [reloadTrigger, setReloadTrigger] = useState(false); // 새로고침 트리거
  const [replies, setReplies] = useState([]); // 댓글 리스트

  const [editMode, setEditMode] = useState(null); // 현재 수정 중인 댓글 ID
  const [editContent, setEditContent] = useState(""); // 수정 중 댓글 내용

  //  내 계정 정보 (Redux에서 가져오기)
  const token = useSelector((state) => state.auth.token);
  const myEmail = getUserSubFromToken(token); // 내 이메일
  const myRole = getUserRoleFromToken(token); // 내 권한

  // 내가 작성한 글인지 + 관리자 권한인지 확인
  const isMyPost =
    detailData?.userEmail?.toLowerCase() === myEmail?.toLowerCase() ||
    myRole === "ROLE_ADMIN";

  /**
   *  게시글 상세 가져오기
   */
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // 로딩 상태 true로 변경
      getDetailStories(Number(boardNum))
        .then((response) => {
          setDetailData(response.data); // 게시글 데이터 저장
        })
        .catch(() => {
          Alert.alert("오류", "게시글을 가져오는 데 실패했습니다.");
        })
        .finally(() => {
          setLoading(false); // 로딩 종료
        });
    }, [boardNum, reloadTrigger])
  );

  /**
   *  댓글 가져오기
   */
  useFocusEffect(
    useCallback(() => {
      replyList(Number(boardNum))
        .then((res) => {
          setReplies(res.data); // 댓글 저장
        })
        .catch((err) => {
          console.error("댓글 불러오기 실패:", err);
        });
    }, [boardNum, reloadTrigger])
  );

  /**
   *  댓글 작성
   */
  const reply = (replyData) => {
    insertReply(replyData)
      .then((res) => {
        const newToken = res.headers?.authorization;
        if (newToken) {
          SecureStore.setItemAsync("accessToken", newToken); // 토큰 갱신
        }
        Alert.alert("성공", "댓글이 등록되었습니다.");
        setReplyInfo({}); // 댓글 입력창 초기화
        setReloadTrigger((prev) => !prev); // 새로고침 트리거
      })
      .catch(() => {
        Alert.alert("오류", "댓글 등록에 실패했습니다.");
      });
  };

  /**
   * 게시글 삭제
   */
  const handleDelete = () => {
    Alert.alert("삭제 확인", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteStories(Number(boardNum))
            .then(() => {
              Alert.alert("삭제 완료", "게시글이 삭제되었습니다.");
              router.back(); // 이전 페이지로 이동
            })
            .catch(() => {
              Alert.alert("삭제 실패", "게시글 삭제 중 오류가 발생했습니다.");
            });
        },
      },
    ]);
  };

  /**
   * 댓글 삭제
   */
  const handleConfirmDeleteReply = (commentId) => {
    Alert.alert("댓글 삭제", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          deleteReply(commentId)
            .then(() => {
              Alert.alert("삭제 완료", "댓글이 삭제되었습니다.");
              setReloadTrigger((prev) => !prev); // 새로고침 트리거
            })
            .catch(() => {
              Alert.alert("삭제 실패", "댓글 삭제 중 오류가 발생했습니다.");
            });
        },
      },
    ]);
  };

  /**
   * 댓글 수정 시작 (버튼 클릭 시 실행)
   */
  const handleEditReply = (item) => {
    setEditMode(item.commentId); // 수정할 댓글 ID
    setEditContent(item.content); // 기존 댓글 내용 세팅
  };

  /**
   * 댓글 수정 저장
   */
  const handleSaveEditedReply = (commentId) => {
    Alert.alert("댓글 수정", "정말 수정하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "수정",
        style: "default",
        onPress: () => {
          axiosInstance
            .put(
              `/plantReplies/${commentId}`,
              {
                content: editContent,
                boardNum: Number(boardNum),
              },
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            .then(() => {
              Alert.alert("성공", "댓글이 수정되었습니다.");
              setEditMode(null); // 수정 모드 해제
              setEditContent(""); // 입력창 초기화
              setReloadTrigger((prev) => !prev); // 새로고침
            })
            .catch(() => {
              Alert.alert("실패", "댓글 수정 중 오류가 발생했습니다.");
            });
        },
      },
    ]);
  };

  /**
   * HTML 이미지 렌더링 (게시글 본문)
   */
  const customRenderers = {
    img: ({ tnode }) => {
      const imageUri = tnode.attributes.src;
      if (!imageUri) return null;
      return (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: screenWidth * 0.9,
            aspectRatio: 1,
            borderRadius: 10,
            marginVertical: 10,
            resizeMode: "cover",
            backgroundColor: "#F0F0F0",
          }}
        />
      );
    },
  };

  // 로딩 화면
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3DA66E" />
        <Text style={styles.loadingText}>불러오는 중...</Text>
      </View>
    );
  }

  /**
   * 게시글 상단 부분 구성 (프로필, 제목, 본문, 댓글 작성창)
   */
  const headerComponent = (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <ProfileImageViewer userEmail={detailData.userEmail} size={60} />
        <View style={{ marginLeft: 12, justifyContent: "center" }}>
          <Text style={styles.writerName}>{detailData.userName}</Text>
          <Text style={styles.postDate}>
            등록일: {dayjs(detailData.regDate).format("YYYY-MM-DD")}
          </Text>
          <Text style={styles.postViews}>
            조회수: {detailData.readCnt ?? "0"}
          </Text>
        </View>
      </View>
      <Text style={styles.title}>{detailData.title || "제목 없음"}</Text>
      <View style={styles.contentArea}>
        {detailData.content ? (
          <RenderHtml
            contentWidth={screenWidth}
            source={{ html: detailData.content }}
            renderers={customRenderers}
          />
        ) : (
          <Text>내용 없음</Text>
        )}
      </View>
      <View style={styles.commentInputContainer}>
        <TextInput
          placeholder="댓글을 입력하세요"
          value={replyInfo.content || ""}
          onChangeText={(text) =>
            setReplyInfo({
              ...replyInfo,
              content: text,
              boardNum: Number(boardNum),
            })
          }
          style={styles.commentInput}
          multiline
        />
        <Pressable
          style={styles.commentButton}
          onPress={() => reply(replyInfo)}
        >
          <Text style={styles.commentButtonText}>댓글 등록</Text>
        </Pressable>
      </View>
    </View>
  );

  /**
   * 게시글 수정/삭제 버튼 (내 글이거나 관리자만 보임)
   */
  const footerComponent = isMyPost && (
    <View style={styles.buttonGroup}>
      <Pressable
        style={styles.editBtn}
        onPress={() => router.push(`/community/edit/${boardNum}`)}
      >
        <Text style={styles.btnText}>수정하기</Text>
      </Pressable>
      <Pressable style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.btnText}>삭제하기</Text>
      </Pressable>
    </View>
  );

  /**
   * 전체 화면 렌더링 (FlatList로 댓글 리스트 표시)
   */
  return (
    <FlatList
      style={styles.container}
      data={replies}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={footerComponent}
      keyExtractor={(item, index) =>
        item.replyNum?.toString() ?? index.toString()
      }
      renderItem={({ item }) => (
        <View style={styles.commentRow}>
          {/* 댓글 작성자 프로필 */}
          <ProfileImageViewer userEmail={item.userEmail} size={50} />
          {/* 댓글 내용 */}
          <View style={styles.commentContentBox}>
            <Text style={styles.commentUser}>
              {item.userName || item.userEmail}
            </Text>
            {editMode === item.commentId ? (
              <>
                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  style={[styles.commentInput, { marginTop: 6 }]}
                />
                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => handleSaveEditedReply(item.commentId)}
                  >
                    <Text style={styles.actionTextGreen}>저장</Text>
                  </Pressable>
                  <Pressable onPress={() => setEditMode(null)}>
                    <Text style={styles.actionTextGray}>취소</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Text style={styles.commentText}>{item.content}</Text>
            )}
            {(item.userEmail === myEmail || myRole === "ROLE_ADMIN") && (
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => handleConfirmDeleteReply(item.commentId)}
                >
                  <Text style={styles.actionTextRed}>삭제</Text>
                </Pressable>
                <Pressable onPress={() => handleEditReply(item)}>
                  <Text style={styles.actionTextGreen}>수정</Text>
                </Pressable>
              </View>
            )}
          </View>
          {/* 댓글 작성일 */}
          <View
            style={{
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.commentDateMini}>
              {dayjs(item.regDate).format("YY.MM.DD")}
            </Text>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <Text style={styles.commentEmpty}>아직 댓글이 없습니다.</Text>
      }
    />
  );
};

export default DetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F8F4",
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 16, color: "#5E716A" },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#D0E6DA",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14, // 위아래 여백 증가
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D0E6DA",
  },
  writerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3A7660",
    marginBottom: 4, // 닉네임 아래 공간 추가
  },
  postDate: {
    fontSize: 12,
    color: "#A3B5A8",
    marginBottom: 2,
  },
  postViews: {
    fontSize: 12,
    color: "#A3B5A8",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2E473D",
    marginTop: 16, // 제목 위쪽 공간 늘림
    marginBottom: 12,
  },
  contentArea: {
    marginBottom: 16,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#A8D0BA",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    backgroundColor: "#ffffff",
    fontSize: 14,
  },
  commentButton: {
    backgroundColor: "#3DA66E",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#A8D0BA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  commentButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 14,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 16, // 위아래 여백 넉넉하게
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DCE8E2",
    backgroundColor: "#F9FCF8",
  },
  commentContentBox: {
    marginLeft: 15, // 프로필 이미지와 내용 간 간격 넓힘
    flex: 1,
  },
  commentUser: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#3A7660",
    marginBottom: 6, // 닉네임과 댓글 내용 사이 간격
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8, // 본문과 버튼 사이 간격
  },
  commentDateMini: {
    fontSize: 10,
    color: "#A3B5A8",
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    marginTop: 8, // 버튼 위쪽 공간 늘림
  },
  actionTextRed: {
    color: "#EF5350",
    fontSize: 12,
    marginRight: 16, // 삭제/수정 버튼 사이 간격 넓힘
  },
  actionTextGreen: {
    color: "#3DA66E",
    fontSize: 12,
    marginRight: 8,
  },
  actionTextGray: {
    color: "#999",
    fontSize: 12,
    marginRight: 8,
  },
  commentEmpty: {
    fontSize: 13,
    color: "#999999",
    textAlign: "center",
    marginVertical: 12,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
    marginBottom: 36,
  },
  editBtn: {
    width: "45%",
    backgroundColor: "#9CCC65",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtn: {
    width: "45%",
    backgroundColor: "#EF5350",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
