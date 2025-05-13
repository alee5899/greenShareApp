import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { follow, unfollowApi } from "../../../apis/memberApi";
import MessageButton from "../../../components/MessageButton";
import CustomText from "../../../components/common/CustomText";
import { useFocusEffect, useLocalSearchParams } from "expo-router";

const FollowList = () => {
  const [followList, setFollowList] = useState([]);
  const { userEmail } = useLocalSearchParams();
  const fetchFollowList = () => {
    follow(userEmail)
      .then((res) => {
        setFollowList(res.data);
      })
      .catch((error) => {
        console.log("팔로우 API 오류:", error);
      });
  };

  useFocusEffect(
    useCallback(() => {
      if (!userEmail) return;
      fetchFollowList();
    }, [userEmail])
  );

  const unfollow = (toUserEmail) => {
    unfollowApi(toUserEmail, userEmail)
      .then(() => {
        setFollowList((prevList) =>
          prevList.filter((user) => user.toUserEmail !== toUserEmail)
        );
      })
      .catch((err) => {
        console.log("언팔로우 오류:", err);
      });
  };

  return (
    <ScrollView style={styles.container}>
      <FlatList
        data={followList}
        keyExtractor={(item) => item.toUserEmail}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>📧 이메일</Text>
                <Text style={styles.email}>{item.toUserEmail}</Text>
              </View>

              <MessageButton receiver={item.toUserEmail} />
              <TouchableOpacity
                style={styles.unfollowBtn}
                onPress={() => unfollow(item.toUserEmail)}
              >
                <CustomText style={styles.unfollowText} weight="Bold">
                  언팔로우
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>팔로우한 사용자가 없습니다.</Text>
        }
        scrollEnabled={false}
      />
    </ScrollView>
  );
};

export default FollowList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2f3542",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    margin: 10,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: "0px 0px 6px lightgray",
  },
  label: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    fontWeight: "500",
    color: "#34495e",
  },
  empty: {
    color: "#b0b0b0",
    textAlign: "center",
    fontSize: 16,
    marginTop: 40,
  },
  unfollowBtn: {
    backgroundColor: "#e74c3c",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  unfollowText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
