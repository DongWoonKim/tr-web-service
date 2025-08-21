# ---------- Build stage ----------
FROM gradle:8.8-jdk21 AS build
WORKDIR /app

# Gradle wrapper & 스크립트 먼저 복사 (캐시 최적화)
COPY gradlew ./
COPY gradle gradle
COPY settings.gradle .
COPY build.gradle .

# 의존성만 먼저 받아 캐시화
RUN ./gradlew --no-daemon dependencies

# 소스 복사 후 빌드 (테스트는 CI에서 돌린다고 가정)
COPY src src
RUN ./gradlew --no-daemon clean bootJar -x test

# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre
WORKDIR /app

# 빌드 산출물 복사 (산출물명이 변할 수 있어 와일드카드)
COPY --from=build /app/build/libs/*.jar /app/app.jar

# JVM 옵션
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8001

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]