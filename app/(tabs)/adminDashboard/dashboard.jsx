import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";
import CustomText from "../../../components/common/CustomText";
import { colors } from "../../../constants/colorConstant";
import DeviceControl from "../../../components/DeviceControl"; // ✅ 기기 제어 컴포넌트

// 🌟 대시보드 화면 컴포넌트
const Dashboard = ({
  autoRefresh = true, // 자동 새로고침 활성화 여부 (기본값 true)
  refreshInterval = 30000, // 새로고침 주기 (30초)
  customTitle = "환경 센서 요약", // 화면 상단 타이틀
  showStandardInfo = false, // 작물 기준 정보 표시 여부 (현재 사용 안 함)
  cropDetail, // 선택된 작물의 상세 데이터
  id, // 선택된 작물의 ID (cropId)
}) => {
  // 📊 최신 환경 데이터를 저장하는 state
  const [latest, setLatest] = useState({
    temperature: 0,
    illuminance: 0,
    humidity: 0,
    soilMoisture: 0,
    joinDate: "", // 데이터 측정 시간
  });

  // ✅ 작물 기준값과 현재 데이터를 비교하는 함수들
  const isTempOk = (v) => v >= cropDetail.tempMin && v <= cropDetail.tempMax;
  const isHumidOk = (v) => v >= cropDetail.humidMin && v <= cropDetail.humidMax;
  const isSoilOk = (v) => v >= cropDetail.soilMin && v <= cropDetail.soilMax;
  const isLuxOk = (v) => v >= cropDetail.adcMin && v <= cropDetail.adcMax;

  // ✅ 서버에서 최신 환경 데이터 가져오기
  const fetchData = async () => {
    try {
      const res = await axios.get("http://10.0.2.2:8080/environment/latest"); // 로컬 서버 요청
      const latestData = res.data;
      // 받아온 데이터를 state에 저장
      setLatest({
        temperature: latestData.temperature,
        illuminance: latestData.illuminance,
        humidity: latestData.humidity,
        soilMoisture: latestData.soilMoisture,
        joinDate: new Date(latestData.joinDate).toLocaleTimeString(), // 시간만 추출
      });
    } catch (err) {
      console.error("데이터 가져오기 실패:", err.message);
    }
  };

  // ✅ 컴포넌트가 처음 렌더링될 때와, 자동 새로고침 설정 시 데이터 주기적으로 가져오기
  useFocusEffect(
    useCallback(() => {
      fetchData(); // 첫 진입 시 데이터 가져오기
      let interval;
      if (autoRefresh) {
        interval = setInterval(fetchData, refreshInterval);
      } // 주기적 갱신
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [autoRefresh, refreshInterval])
  );

  // ✅ 카드 렌더링 (데이터만 보여주고, 클릭은 없음)
  const renderCard = (label, value, unit, isOk) => (
    <View
      style={[
        styles.card,
        { borderLeftColor: isOk(value) ? "#27B06E" : "red" }, // 기준 충족 여부에 따라 색상 변경
      ]}
    >
      <CustomText style={styles.cardTitle}>{label}</CustomText>
      <CustomText style={styles.statusText}>
        {isOk(value) ? (
          <Text style={styles.green}>● 적정 환경입니다</Text>
        ) : (
          <Text style={styles.red}>● 적정 환경이 아닙니다</Text>
        )}
      </CustomText>
      <CustomText style={styles.cardValue}>
        {value} {unit}
      </CustomText>
    </View>
  );

  // ✅ 화면에 보여질 구성
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 타이틀 */}
      <Text style={styles.title}>
        {customTitle} ({latest.joinDate})
      </Text>

      {/* ✅ 기기 제어 컴포넌트 */}
      <DeviceControl cropId={id} />

      {/* 뒤로가기 버튼 */}
      <Text style={styles.backButton} onPress={() => router.back()}>
        ← 뒤로가기
      </Text>

      {/* 4개의 환경 데이터 카드 */}
      {renderCard("🌡️ 온도", latest.temperature, "°C", isTempOk)}
      {renderCard("💡 조도", latest.illuminance, "ADC", isLuxOk)}
      {renderCard("💧 습도", latest.humidity, "%", isHumidOk)}
      {renderCard("🌱 토양 수분", latest.soilMoisture, "%", isSoilOk)}
    </ScrollView>
  );
};

// ✅ 스타일 정의
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  backButton: {
    color: "#007bff",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 4,
    color: "#333",
  },
  statusText: {
    fontSize: 14,
    marginBottom: 8,
    color: "#666",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  green: {
    color: colors.MAIN,
  },
  red: {
    color: "red",
  },
});

export default Dashboard;
