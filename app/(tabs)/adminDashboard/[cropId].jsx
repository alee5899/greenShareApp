import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import Dashboard from "./dashboard";
import CustomText from "../../../components/common/CustomText";

const CropDetail = () => {
  const { cropId } = useLocalSearchParams();
  const [crop, setCrop] = useState({});

  useEffect(() => {
    axios
      .get(`http://10.0.2.2:8080/plants/${cropId}`)
      .then((res) => {
        setCrop(res.data);
        console.log("✅ 서버 응답:" + res.data);
      })
      .catch((err) => {
        console.error("❌ API 호출 실패:", err.message);
      });
  }, []);

  return (
    <ScrollView style={styles.mainCon}>
      {/* <CustomText>{crop.crop} </CustomText> */}
      <Dashboard id={cropId} cropDetail={crop} />
    </ScrollView>
  );
};

export default CropDetail;

const styles = StyleSheet.create({
  mainCon: {
    flex: 1,
    backgroundColor: "white",
  },
});
