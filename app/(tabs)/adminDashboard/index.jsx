import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { cropList, IMAGE_PATH } from "../../../apis/memberApi";




import axios from "axios";
import { useFonts } from "expo-font";
import { Colors } from "react-native/Libraries/NewAppScreen";
import { colors } from "../../../constants/colorConstant";
import CustomText from "./../../../components/common/CustomText";
import { useNavigation, useRouter } from "expo-router";

const ProfileHomeScreen = () => {
  const [list, setList] = useState([]);
  const [imagePath, setImagePath] = useState(""); // 이미지 경로를 저장할 상태
  const router = useRouter();

  useEffect(() => {
    axios
      .get("http://10.0.2.2:8080/plants")
      .then((res) => {
        setList(res.data);
        console.log("✅ 서버 응답:");
      })
      .catch((err) => {
        console.error("❌ API 호출 실패:", err.message);
      });
  }, []);

  useEffect(() => {
    if (list.length > 0) {
      console.log("🟢 list 변경됨");
    }
  }, [list]);

  return (
    <ScrollView style={styles.mainCon}>
      {list.map((crop, i) => {
        return (
          <TouchableOpacity
            key={i}
            style={styles.infoCon}
            onPress={() => {
              router.push(
                `/adminDashboard/${crop.id}`
              ); /* 선택한 작물로 들어가는 거 */
            }}
          >
            <View style={styles.picCon}>
              <Image
                source={{ uri: `http://10.0.2.2:8080/images/${crop.imgName}` }}
                style={{ width: 200, height: 200 }}
              />
            </View>

            <View style={styles.textCon}>
              {/* 작물 이름 */}
              <View style={styles.titleCon}>
                <Text style={[styles.grey, styles.fontBlack, styles.font15]}>
                  {crop.crop}
                </Text>
              </View>

              {/* 생육 환경 */}
              <View style={styles.textBox}>
                <View style={styles.textBoxSon}>
                  <Text style={[styles.green, styles.fontBlack, styles.font08]}>
                    온도
                  </Text>
                  <Text
                    style={[
                      styles.white,
                      styles.fontBlack,
                      styles.font08,
                      styles.box,
                    ]}
                  >{`${crop.tempMin}~${crop.tempMax}℃`}</Text>
                </View>
                <View style={styles.textBoxSon}>
                  <Text style={[styles.green, styles.fontBlack, styles.font08]}>
                    습도
                  </Text>
                  <CustomText
                    style={[
                      styles.white,
                      styles.fontBlack,
                      styles.font08,
                      styles.box,
                    ]}
                  >{`${crop.humidMin}~${crop.humidMax}%`}</CustomText>
                </View>
                <View style={styles.textBoxSon}>
                  <Text style={[styles.green, styles.fontBlack, styles.font08]}>
                    조도(adc)
                  </Text>
                  <Text
                    style={[
                      styles.white,
                      styles.fontBlack,
                      styles.font08,
                      styles.box,
                    ]}
                  >{`${crop.adcMin}~${crop.adcMax}`}</Text>
                </View>
                <View style={styles.textBoxSon}>
                  <Text style={[styles.green, styles.fontBlack, styles.font08]}>
                    토양
                  </Text>
                  <Text
                    style={[
                      styles.white,
                      styles.fontBlack,
                      styles.font08,
                      styles.box,
                    ]}
                  >{`${crop.soilMin}~${crop.soilMax}%`}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default ProfileHomeScreen;

const styles = StyleSheet.create({
  mainCon: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20, // padding을 주면 내용이 부모 영역에 맞게 설정
  },
  picCon: {
    /* 이미지 컨테이너 */ width: "100" /* 가로 크기 */,
    height: "100" /* 세로 크기 */,
    overflow: "hidden" /* 나가는 부분 자르기 */,
    justifyContent: "center", // 세로 중앙
    alignItems: "center",
  },
  subCon: {
    width: "100%",
  },
  titleCon: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoCon: {
    flexDirection: "row",
    width: "100%",
    height: 120,
    justifyContent: "space-evenly",
    backgroundColor: "white",
    alignItems: "center",
    borderRadius: 10,
    boxShadow: "0px 0px 6px lightgray",
    marginBottom: 10,
    marginTop: 7,
  },
  textCon: {},
  textBox: {
    flexDirection: "row",
    width: "240",
    justifyContent: "space-between",
  },
  textBoxSon: {},

  font08: {
    /*  폰트사이즈 작게 */ fontSize: 12,
  },
  font15: {
    fontSize: 18,
  },

  fontLight: {
    /* 폰트 라이트 */ fontFamily: "Pretendard-light",
  },

  fontBlack: {
    /* 폰트 블랙 */ fontFamily: "Pretendard-Black",
  },

  green: {
    /* 폰트컬러 메인그린 */ color: colors.MAIN,
  },

  white: {
    color: "white",
  },
  box: {
    backgroundColor: colors.MAIN,
    paddingHorizontal: 3,
    borderRadius: 5,
    justifyContent: "center",
  },
});
