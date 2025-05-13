import { useFonts } from "expo-font";
/* npm install expo-font 라이브러리 다운받아야함
 */
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/redux/store";
import * as SecureStore from "expo-secure-store";
import { loginReducer, logoutReducer } from "@/redux/authSlice";
import { jwtDecode } from "jwt-decode";

import WebSocketClient from "./(tabs)/follow/WebSocketClient";

import Toast from 'react-native-toast-message';


// 스플래시 화면이 에셋 로딩이 완료될 때까지 유지되도록 설정
SplashScreen.preventAutoHideAsync();

// 인증 상태를 관리하는 컴포넌트
// 앱 실행 직후 토큰이 secureStorage 에 추출
// 추출할 동안 ActivityIndicator(로딩바)보여줌 그리고 추출이 다 되면 원래 그림 그리기 (children)
const AuthManager = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // 토큰 유효성 검사 및 로그인 상태 관리 함수
  const validateAndLoadToken = async () => {
    try {
      // SecureStore에서 토큰 가져오기
      const token = await SecureStore.getItemAsync("accessToken");

      // 토큰이 없으면 함수 종료
      if (!token) {
        return;
      }

      // 유효한 토큰이면 로그인 상태로 설정
      dispatch(loginReducer(token));
    } catch (error) {
      console.error("토큰 검증 중 오류:", error);
      dispatch(logoutReducer());
    } finally {
      // 인증 초기화 완료 표시
      setIsReady(true);
    }
  };

  // 컴포넌트 마운트 시 토큰 검증
  useEffect(() => {
    validateAndLoadToken();
  }, []);

  // 로딩 중 인디케이터 표시
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return children;
};

export default function RootLayout() {



  const [fontsLoaded] = useFonts({
    /* 라이브러리 다운받아야함 */
    "Pretendard-Thin": require("./../assets/fonts/Pretendard-Thin.ttf"),
    "Pretendard-ExtraLight": require("./../assets/fonts/Pretendard-ExtraLight.ttf"),
    "Pretendard-Light": require("./../assets/fonts/Pretendard-Light.ttf"),
    "Pretendard-Regular": require("./../assets/fonts/Pretendard-Regular.ttf"),
    "Pretendard-Medium": require("./../assets/fonts/Pretendard-Medium.ttf"),
    "Pretendard-SemiBold": require("./../assets/fonts/Pretendard-SemiBold.ttf"),
    "Pretendard-Bold": require("./../assets/fonts/Pretendard-Bold.ttf"),
    "Pretendard-ExtraBold": require("./../assets/fonts/Pretendard-ExtraBold.ttf"),
    "Pretendard-Black": require("./../assets/fonts/Pretendard-Black.ttf"),
  });
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // 폰트 로딩 완료 시 스플래시 화면 숨기기
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!loaded) {
    return null;
  }
  // 폰트 로딩 중이면 null 반환

  return (
    <Provider store={store}>
      <AuthManager>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }} />

          <StatusBar style="auto" translucent={false} />
          <Toast />
        </SafeAreaView>
      </AuthManager>
    </Provider>
  );
}