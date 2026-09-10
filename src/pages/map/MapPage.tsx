import { AppText } from "@/components/AppText";
import { ImagePlaceholder } from "@/components/ui/ImagePlaceholder";
import { colors } from "@/constants/colors";
import { favoriteRegionSpots } from "@/constants/regionDetails";
import { recommendations } from "@/constants/recommendations";
import { type RegionId } from "@/constants/regions";
import { InteractiveKoreaMap } from "@/features/map/components/InteractiveKoreaMap";
import { TravelProofConsentModal } from "@/features/map/components/TravelProofConsentModal";
import { useMapData } from "@/features/map/useMapData";
import {
  loadTravelProofConsent,
  saveTravelProofConsent,
} from "@/lib/auth/tokenStorage";
import { Entypo } from "@expo/vector-icons";
import { type Href, Link, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

const MapPage = () => {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>();
  const [isConsentVisible, setIsConsentVisible] = useState(false);
  // undefined = 저장소에서 읽는 중. 읽기 전에 눌리면 동의를 안 받은 것처럼
  // 다루지 않도록 로딩 상태를 구분한다.
  const [hasConsented, setHasConsented] = useState<boolean>();
  const favoriteCount = favoriteRegionSpots.length;
  const { data } = useMapData();
  const progress = data?.summary.progress;
  const progressPercent = progress?.percent ?? 0;
  const progressCollected = progress?.collected ?? 0;
  const progressTotal = progress?.total ?? 0;
  const score = data?.summary.score ?? 0;
  const nationalRank = data?.summary.nationalRank ?? 0;
  const regionPercents = useMemo(() => {
    return Object.fromEntries(
      data?.provinces.map((province) => [
        province.provinceCode,
        province.percent,
      ]) ?? [],
    );
  }, [data?.provinces]);
  const todayRecommendations =
    data?.todayDiscoveries.map((item) => ({
      id: item.placeId,
      title: item.name,
      location: item.address,
      imageUrl: item.imageUrl,
      accent: colors.primary,
      icon: "location-dot" as const,
    })) ?? recommendations;
  useEffect(() => {
    let cancelled = false;

    loadTravelProofConsent().then((consented) => {
      if (!cancelled) {
        setHasConsented(consented);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const goToCertification = () => {
    router.push("/photo");
  };

  const startCertification = () => {
    if (hasConsented === undefined) {
      return;
    }

    if (hasConsented) {
      goToCertification();
      return;
    }

    setIsConsentVisible(true);
  };

  const confirmConsent = async () => {
    setHasConsented(true);
    setIsConsentVisible(false);
    await saveTravelProofConsent();
    goToCertification();
  };

  const openRegionDetail = (regionId: RegionId | undefined) => {
    if (!regionId) {
      return;
    }

    setSelectedRegionId(regionId);
    router.push({
      pathname: "/map/region/[id]",
      params: { id: regionId },
    });
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-background"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full ">
          <View className="flex-row items-center justify-between gap-3.5">
            <View className="flex-1 flex-row items-center gap-3.5">
              <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-muted">
                <Image
                  source={{
                    uri: "https://i.namu.wiki/i/vDDaVK4wm1-vPZgAOI65rbhLhr1vPCzBgoRKSS7mEFx4IH2vtHvvMN41Umw-taptksIW_WqnjwOdcGbAMpAmrQ.webp",
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="flex-1 gap-1">
                <AppText variant="subtitle">여행 수집가</AppText>

                <AppText variant="caption" color="muted">
                  대한민국 여행 수집 진행률
                </AppText>
                <View className="flex-row items-center gap-1 ">
                  <AppText color="primary" className="font-extrabold">
                    {progressPercent}%
                  </AppText>
                  <View className="h-2.5  flex-1 overflow-hidden rounded-full bg-surface">
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </View>
                </View>

                <AppText variant="caption">
                  {progressCollected}
                  <AppText color="muted" variant="caption">
                    {" "}
                    / {progressTotal} 여행지
                  </AppText>
                </AppText>
              </View>
            </View>

            <View className="items-end gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="찜한 여행지 보기"
                className="flex-row items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-2"
                onPress={() => router.push("/map/favorites" as Href)}
              >
                <Entypo name="heart" size={16} color={colors.primary} />
                <AppText
                  color="primary"
                  size={13}
                  style={{ fontWeight: "800" }}
                >
                  찜 {favoriteCount}
                </AppText>
              </Pressable>

              <View className="items-center justify-center gap-1 rounded-[18px] border border-muted bg-background p-3.5">
                <AppText color="muted" size={12}>
                  총 여행 점수 {score}점
                </AppText>
                <AppText variant="subtitle">전국 {nationalRank}위</AppText>
              </View>
            </View>
          </View>

          <View className="relative pb-12">
            <InteractiveKoreaMap
              selectedRegionId={selectedRegionId}
              regionPercents={regionPercents}
              onRegionPress={openRegionDetail}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="여행 인증하기"
              className="absolute bottom-2.5 right-3 h-20 w-20 items-center justify-center rounded-full border-2 border-primary/95 bg-primary/85"
              onPress={startCertification}
            >
              <Entypo name="camera" size={30} color={colors.foreground} />
              <AppText
                variant="body"
                style={{ fontWeight: "bold", fontSize: 16 }}
              >
                인증하기
              </AppText>
            </Pressable>
          </View>

          <View className="gap-4 border-t border-foreground/10 pt-[22px]">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Entypo name="location-pin" size={24} color={colors.primary} />
                <AppText variant="subtitle">오늘의 추천 여행지</AppText>
              </View>
              {/* <Link href="/map/list" asChild>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="추천 여행지 더보기"
                  className="flex-row items-center gap-1"
                >
                  <AppText color="muted">더보기</AppText>
                  <Entypo name="chevron-right" size={20} color={colors.muted} />
                </Pressable>
              </Link> */}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-3 pr-5">
                {todayRecommendations.map((item) => (
                  <Link
                    key={item.id}
                    href={{
                      pathname: "/map/list/[id]",
                      params: { id: item.id },
                    }}
                    asChild
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${item.title} 추천 여행지 보기`}
                      className="w-[168px] overflow-hidden rounded-xl border border-foreground/10 bg-surface"
                    >
                      {"imageUrl" in item && item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          className="h-[102px] w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <ImagePlaceholder className="h-[102px] w-full" />
                      )}
                      <View className="gap-1.5 p-3">
                        <AppText className="text-base font-bold leading-[22px]">
                          {item.title}
                        </AppText>
                        <View className="flex-row items-center gap-1">
                          <Entypo
                            name="location-pin"
                            size={16}
                            color={colors.primary}
                          />
                          <AppText color="primary" size={13}>
                            {item.location}
                          </AppText>
                        </View>
                      </View>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <TravelProofConsentModal
        visible={isConsentVisible}
        onClose={() => setIsConsentVisible(false)}
        onConfirm={confirmConsent}
      />
    </>
  );
};

export default MapPage;
