import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  Dimensions,
  Pressable,
} from "react-native";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useRoute } from "@react-navigation/native";
import { axiosInstance } from "./../../../apis/axiosInstance";
import { styles } from "./../../../node_modules/react-native-toast-message/lib/src/components/AnimatedContainer.styles";
import CustomText from "./../../../components/common/CustomText";
import Feather from "@expo/vector-icons/Feather";

const WebSocketClient = () => {
  const route = useRoute();
  const [sender, setSender] = useState(null); /* 센더 설정 */
  const [receiver, setReceiver] = useState(null); /* 리시버 설정 */
  const [threadId, setThread] = useState(null); /* 쓰레드 아이디 설정 */
  const [messages, setMessages] = useState([]); /* 메세제리스트 받아오기 */
  const [messageContent, setMessageContent] =
    useState(""); /* 메세지 내용부분 */
  const [client, setClient] = useState(null); /* 소켓 클라이언트 설정 */
  const [connected, setConnected] = useState(false); // 연결 상태 추적
  const utcDate = new Date().toISOString(); /* 자바 서버 시간포멧 */
  const date = new Date(utcDate); /* 채팅창에 보일 날자 */
  const flatListRef = useRef(null); // FlatList의 ref를 설정
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const handleScroll = (event) => {
    const { contentOffset } = event.nativeEvent;
    // 아주 위쪽(top)에 도달했을 때만 이전 내용 불러오기 (스크롤 y 좌표 기준)
    if (contentOffset.y <= 50 && !loadingOlderMessages && hasMoreMessages) {
      loadOlderMessages(); /* 이전 메세지 불러오는 함수 */
    }
  };

  const prevLastMessageIdRef = useRef(null); /* 마지막 메세지 아이디 기억하기 */

  useEffect(() => {
    /* 메세지가 새로 추가 되면 맨밑으로 스크롤 가게 */
    if (!messages || messages.length === 0)
      return; /* 메세지가 없고 메세지리스트가 없으면 리턴 */

    const lastMessage =
      messages[messages.length - 1]; /* 마지막 메세지의 위치 */
    const prevLastId =
      prevLastMessageIdRef.current; /* 마지막 아이디에 맞춘 useRef */

    const isNewMessageFromSender =
      lastMessage?.sender ===
        sender /* 마지막으로 보낸 메세지가 내가 보낸 것인지 판단 */ &&
      lastMessage?.id !== prevLastId; /* 이 메시지가 새로 추가된 것인지 확인  */

    const isInitialRender = !prevLastId; /* 첫 렌더시 맨밑으로  */

    if ((isNewMessageFromSender || isInitialRender) && flatListRef.current) {
      /* 마지막 메세지가 내가 보낸 것이고  flatList의 참조가 있으면*/
      setTimeout(() => {
        flatListRef.current.scrollToEnd({
          animated: true,
        }); /* 맨밑으로 스크롤 내림 */
      }, 100);
    }

    // 무조건 현재 마지막 메시지 id는 기억해 둔다
    prevLastMessageIdRef.current = lastMessage?.id;
  }, [messages]);

  // 한국 시간 (KST) 기준으로 변환
  const koreaTime = date.toLocaleString("ko-KR", {
    /* 한국 시간을 받아오는 변수 */ timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  /* 한국시간으로 표시해주는 함수*/
  const formatToKoreanTime = (isoTimestamp) => {
    const date = new Date(isoTimestamp);
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit" /* 시간 */,
      minute: "2-digit" /* 분 */,
      hour12: true /* 12시간으로 오전 오후 나누기*/,
    });
  };

  // 출력 포맷을 "yyyy-MM-dd HH:mm:ss"처럼 정제
  const formatted = koreaTime.replace(
    /* 시간 정규식 자바에 맞춰줌 */
    /(\d{4})\. (\d{2})\. (\d{2})\. (오전|오후) (\d{1,2}):(\d{2}):(\d{2})/,
    (_, year, month, day, period, hour, minute, second) => {
      let hour24 = parseInt(hour, 10);

      if (period === "오전" && hour24 === 12) {
        hour24 = 0; /* 오전 없앰 12시간 넘으면 */
      } else if (period === "오후" && hour24 !== 12) {
        hour24 += 12; /* 오후 없앰 */
      }

      return `${year}-${month}-${day} ${String(hour24).padStart(
        2,
        "0"
      )}:${minute}:${second}`;
    }
  );

  useEffect(() => {
    /* 이전 라우트에서 파람스로 변수 받아오는 useEffect */
    if (route.params) {
      const { sender, receiver } = route.params; /* 센더와 리시버 두개 받아옴 */
      setSender(sender); /* 샌더 설정 */
      setReceiver(receiver); /* 리시버 설정 */
    }
  }, [route.params]);

  const loadOlderMessages = async () => {
    /* 이전 메세지 로딩하는 함수 */
    setLoadingOlderMessages(true);
    const oldestMessageId = messages[0]?.id;
    /* 마지막 메세지아이디는 = 현재 메세지리스트의 처음 */
    if (!oldestMessageId) return; /* 마지막메세지아이디가 없으면 리턴 */
    try {
      /* 이전 메세지를 더 받아올 API */
      const res = await axiosInstance.get("/messages/more", {
        params: {
          /* 보내는사람, 받는사람 -> 쓰레드 아이디 조회 */ sender,
          receiver,
          lastMessageId: oldestMessageId /* 이전 메세지를 기준으로 */,
          limit: 20 /* 20개 더 조회 */,
        },
      });

      const olderMessages =
        res.data; /* 이전 메세지를 받아올 변수 olderMessages */

      if (olderMessages.length === 0) {
        setHasMoreMessages(false); // 더 이상 불러올 메시지가 없음
      } else {
        setMessages((prev) => [...olderMessages.reverse(), ...prev]);
        /* 이전 메세지를 역순으로 해서 최신 메세지와 결합해줌 */
      }
    } catch (e) {
      console.error("과거 메시지 로딩 실패:", e);
    }

    setLoadingOlderMessages(false);
  };

  useEffect(() => {
    /* 처음 화면을 켰을때 메세지를 받아오는 유즈이펙트 */
    if (!sender || !receiver) return;

    const loadInitialMessages = async () => {
      /* 처음에 메세지 받아오기 */
      try {
        const res = await axiosInstance.get("/messages/more", {
          params: {
            sender,
            receiver,
            limit: 20 /* 20개 조회 */,
          },
        });
        console.log(res.data);
        setMessages(res.data.reverse());
        // 최신순 → 오래된 순으로 바꿔서 화면에 맞게
      } catch (e) {
        console.error("초기 메시지 로딩 실패:", e);
      }
    };

    loadInitialMessages();
  }, [sender, receiver]);

  useEffect(() => {
    if (!sender || !receiver) return; /* 센더와 리시버 없으면 리턴 */

    axiosInstance
      .get("/messages/threadFind", {
        /* 쓰레드를 조회하는 API */ params: { sender, receiver },
      }) /* 조회해서 쓰레드아이디 필요한 곳에 제공함 */
      .then((res) => setThread(res.data))
      .catch((e) => console.log(e));
  }, [sender, receiver]);

  // 웹소켓 클라이언트 설정
  useEffect(() => {
    const stompClient = new Client({
      webSocketFactory: () => new SockJS("http://10.0.2.2:8080/ws"),
      connectHeaders: {},
      debug: (str) => console.log(str),
      onConnect: () => {
        console.log("Connected to WebSocket");
        setConnected(true);
        stompClient.subscribe("/topic/messages", (messageOutput) => {
          const message = JSON.parse(messageOutput.body);
          setMessages((prevMessages /* 이전 메세지 */) => [
            ...prevMessages,
            message /* 새로운 메세지 */,
          ]);
        });
      },
      onStompError: (frame) => {
        console.error("STOMP Error:", frame);
      },
    });

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, []);

  const sendMessage = () => {
    /* 메세지 보내기 함수 */
    if (client && connected && messageContent && sender && receiver) {
      const message = {
        /* 일단 새로운 메세지 통을 만듬 */ threadId /* 쓰레드 아이디 */,
        sender /* 보내는 사람 */,
        receiver /* 받는사람 */,
        content: messageContent /* (채팅input에서 적히는 부분) */,
        timestamp:
          formatted /* 리액트에서 자바에 맞게 설정한 시간을 넣어준다. */,
      };
      client.publish({
        /* 메세지를 보내는 웹소켓*/
        /* 이 안에 메세지 저장하는 쿼리를 실행하는 내용이 있음 */
        destination: "/app/sendMessage",
        body: JSON.stringify(message),
      });
      setMessageContent("");
    } else {
      console.warn("STOMP 연결 전 메시지를 전송할 수 없습니다.");
    }
  };

  return (
    <View style={loStyles.mainCon}>
      {/* 메세지 목록 */}
      <View style={loStyles.msgCon}>
        {/* 메세지리스트를 맵돌릴거 */}
        <FlatList
          ref={
            flatListRef
          } /* 플렛리스트를 래퍼런스로 설정 스크롤 설정을 위해서 */
          data={messages} /* 받아오는 데이터는 메세지리스트 */
          onScroll={
            handleScroll
          } /* 스크롤 컨트롤하는 함수 새 메세지 추가시 맨밑으로 */
          scrollEventThrottle={100}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => {
            /* 보내는사람이 센더인지 판단 */
            /* 센더인지 왜 판단하는가? 센더인 사람을 오른쪽에 메세지 리시버는 왼쪽에
            배치하기 위해서 */
            const isSender = item.sender === sender;
            /* 현재 분이 몇분인지 (분 단위로 채팅을 표시할거기 때문) */
            const currentMinute = item.timestamp?.slice(0, 16);

            /* 다음 이 몇분인지 */
            const nextMinute =
              index < messages.length - 1
                ? messages[index + 1].timestamp?.slice(0, 16)
                : null;

            const isLastInMinute = currentMinute !== nextMinute; /*  */
            return (
              <>
                <View /* 채팅 말풍선 */
                  style={[
                    loStyles.messageBubble,
                    /* 보내는 사람은 오른쪽에 받는 사람은 왼쪽에 배치 */
                    isSender ? loStyles.myMessage : loStyles.otherMessage,
                  ]}
                >
                  <CustomText /* 메세지 텍스트 부분 */
                    weight="SemiBold"
                    style={[
                      /* 스타일 */ loStyles.messageText,
                      isSender
                        ? loStyles.white /* 센더일시 흰색 */
                        : loStyles.black /* 리시버일시 검은색 */,
                    ]}
                  >
                    {item.content} {/* 실제 메세지 텍스트 */}
                  </CustomText>
                </View>
                {isLastInMinute && (
                  <CustomText
                    weight="Medium"
                    style={[
                      loStyles.timestamp,
                      isSender
                        ? loStyles.timestampRight
                        : loStyles.timestampLeft,
                    ]}
                  >
                    {formatToKoreanTime(item.timestamp)}
                  </CustomText>
                )}
              </>
            );
          }}
          contentContainerStyle={{ paddingBottom: 10 }} // 입력창 안 가리도록
        />
      </View>

      {/* 입력창 */}
      <View style={loStyles.inputContainer}>
        <TextInput
          style={[loStyles.input, { fontFamily: "Pretendard-Medium" }]}
          placeholder="메세지 입력"
          value={messageContent}
          onChangeText={setMessageContent}
        />
        {messageContent ? (
          <Pressable
            style={[loStyles.sendBTN, loStyles.green]}
            color="#27B06E"
            onPress={sendMessage}
          >
            <CustomText weight="Bold" col="white" size={20}>
              ↑
            </CustomText>
          </Pressable>
        ) : (
          <Pressable
            style={[loStyles.sendBTN, loStyles.gray]}
            color="#27B06E"
            onPress={sendMessage}
          >
            <CustomText weight="Bold" size={20}>
              ↑
            </CustomText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default WebSocketClient;

const screenHeight = Dimensions.get("window").height;
const screenWidth = Dimensions.get("window").width;
const loStyles = StyleSheet.create({
  mainCon: {
    /* 메인 컨테이너 */ flex: 1,
    backgroundColor: "#fff" /* 백그라운드 컬러 */,
  },
  msgCon: {
    /* 메세지 컨테이너 */ flex: 1,
    paddingHorizontal: 11 /* 양옆 패딩을 주어 메세지가 띄어지게함 */,
  },
  inputContainer: {
    /* 인풋 및 버튼을 담고 있는 컨테이너 */ flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  input: {
    /* 채팅 입력창 */ flex: 1,
    height: 40 /* 채팅창 높이 */,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "gray",
    width: "100%",
    borderRadius: 20,
    paddingLeft: 20,
  },
  messageBubble: {
    /* 말풍선 디자인틀 */ maxWidth: "80%",
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: "column", // 세로로 배치
    alignItems: "flex-start", // 좌측 정렬
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  myMessage: {
    /* 내가 보낸 말풍선 */ backgroundColor: "#27B06E",
    alignSelf: "flex-end",
  },
  otherMessage: {
    /* 상대방이 보낸 말풍선 */ backgroundColor: "#EAEAEA",
    alignSelf: "flex-start",
  },
  messageText: {
    /* 말풍선 폰트 */ fontSize: 16,
  },
  timestamp: {
    /* 메세지 시간 폰트 설정 */ fontSize: 11,
    color: "gray",
    marginTop: 0, // 메시지와 시간 간격 조정
    textAlign: "right", // 오른쪽 정렬 (필요시 조정)
    marginBottom: 10,
  },
  timestampRight: {
    /* 내가 보낸 메세지일 경우 오른쪽에 배치 */ paddingRight: 5,
    alignSelf: "flex-end", // 보낸 메시지의 시간을 오른쪽 정렬
  },

  timestampLeft: {
    /* 상대가 보낸 메세지일 경우 왼쪽에 배치 */ paddingLeft: 5,
    alignSelf: "flex-start", // 받은 메시지의 시간을 왼쪽 정렬
  },
  white: {
    /* 흰색 */ color: "white",
  },
  black: {
    /* 검은색 */ color: "#374151",
  },
  sendBTN: {
    /* 메세지 전송 버튼 디자인 공용틀 */ width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    position: "absolute",
    right: 15,
  },
  green: {
    backgroundColor: "#27B06E",
  },
  gray: {
    backgroundColor: "#E2E8F0",
  },
});
