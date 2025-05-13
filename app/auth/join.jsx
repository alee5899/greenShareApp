import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import { api_join } from "../../apis/memberApi";
import { useNavigation } from "@react-navigation/native";
import AntDesign from "@expo/vector-icons/AntDesign";

const Join = () => {
  const [modalVisible, setModalVisible] = useState(false);

  const [joinData, setJoinData] = useState({
    userEmail: "",
    userName: "",
    userPassword: "",
    confirmPassword: "",
    tel1: "",
    tel2: "",
    tel3: "",
    gender: "",
  });

  function handleChange(text, name) {
    setJoinData({
      ...joinData,
      [name]: text,
    });
  }

  const handleJoin = () => {
    const {
      userEmail,
      userPassword,
      confirmPassword,
      tel1,
      tel2,
      tel3,
      userName,
    } = joinData;
    const userTel = `${tel1}-${tel2}-${tel3}`;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    const telRegex = /^\d+$/;

    if (!emailRegex.test(userEmail)) {
      Alert.alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (!passwordRegex.test(userPassword)) {
      Alert.alert("비밀번호는 영문+숫자 포함 6자리 이상이어야 합니다.");
      return;
    }

    if (userPassword !== confirmPassword) {
      Alert.alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (
      !tel1 ||
      !tel2 ||
      !tel3 ||
      !telRegex.test(tel1) ||
      !telRegex.test(tel2) ||
      !telRegex.test(tel3)
    ) {
      Alert.alert("전화번호를 숫자로 정확히 입력해주세요.");
      return;
    }

    const dataToSend = {
      userEmail,
      userName,
      userPassword,
      userTel,
    };

    api_join(dataToSend)
      .then((res) => {
        console.log("회원가입 성공:", res.data);
        setModalVisible(true); // ✅ 모달 표시
      })
      .catch((e) => {
        console.error("회원가입 실패:", e);
        Alert.alert("회원가입 오류 발생");
      });
  };

  const handleGenderSelect = (selectedGender) => {
    setJoinData({ ...joinData, gender: selectedGender });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>회원가입</Text>

        <TextInput
          style={styles.input}
          placeholder="이메일을 입력하세요"
          value={joinData.userEmail}
          onChangeText={(text) => handleChange(text, "userEmail")}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="닉네임 입력"
          value={joinData.userName}
          onChangeText={(text) => handleChange(text, "userName")}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 영문+숫자 6자리 이상 입력하세요"
          value={joinData.userPassword}
          onChangeText={(text) => handleChange(text, "userPassword")}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호 중복확인"
          value={joinData.confirmPassword}
          onChangeText={(text) => handleChange(text, "confirmPassword")}
          secureTextEntry
        />

        <Text style={styles.subTitle}>성별</Text>
        <View style={styles.genderWrapper}>
          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => handleGenderSelect("male")}
          >
            <View
              style={[
                styles.checkBox,
                joinData.gender === "male" && styles.checkedBox,
              ]}
            />
            <Text style={styles.genderLabel}>남자</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.genderOption}
            onPress={() => handleGenderSelect("female")}
          >
            <View
              style={[
                styles.checkBox,
                joinData.gender === "female" && styles.checkedBox,
              ]}
            />
            <Text style={styles.genderLabel}>여자</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subTitle}>전화번호</Text>
        <View style={styles.phoneWrapper}>
          <TextInput
            style={styles.phoneInput}
            placeholder="010"
            maxLength={3}
            keyboardType="number-pad"
            value={joinData.tel1}
            onChangeText={(text) => handleChange(text, "tel1")}
          />
          <Text style={styles.dash}>-</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="1234"
            maxLength={4}
            keyboardType="number-pad"
            value={joinData.tel2}
            onChangeText={(text) => handleChange(text, "tel2")}
          />
          <Text style={styles.dash}>-</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="5678"
            maxLength={4}
            keyboardType="number-pad"
            value={joinData.tel3}
            onChangeText={(text) => handleChange(text, "tel3")}
          />

          <Modal visible={modalVisible} transparent animationType="fade">
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.5)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "80%",
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  padding: 24,
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.25,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: "#D1FAE5", // 연한 초록 배경
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <AntDesign name="checkcircleo" size={40} color="#10B981" />
                </View>

                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: "#10B981",
                    marginBottom: 8,
                  }}
                >
                  등록 완료!
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#555",
                    textAlign: "center",
                    marginBottom: 20,
                  }}
                >
                  회원가입이 성공적으로 완료되었습니다.
                </Text>

                <Pressable
                  style={{
                    width: "100%",
                    backgroundColor: "#10B981",
                    paddingVertical: 10,
                    borderRadius: 8,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    setModalVisible(false);
                    navigation.navigate("/"); // ✅ 홈으로 이동
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: "white" }}>
                    확인
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleJoin}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Join;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    marginTop: 8,
  },
  phoneWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  phoneInput: {
    flex: 1,
    height: 50,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: "center",
  },
  dash: {
    marginHorizontal: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#8ED2B2",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  genderWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#8ED2B2",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedBox: {
    backgroundColor: "#8ED2B2",
  },
  genderLabel: {
    fontSize: 16,
  },
});
