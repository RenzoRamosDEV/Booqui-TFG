FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /build
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q package -DskipTests

FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S booqi && adduser -S booqi -G booqi
WORKDIR /app
COPY --from=build /build/target/booking-service-1.0.0-SNAPSHOT.jar /app/app.jar
USER booqi
EXPOSE 8082
HEALTHCHECK --interval=15s --timeout=3s --start-period=40s --retries=5 CMD wget -qO- http://localhost:8082/actuator/health || exit 1
ENTRYPOINT ["java","-jar","/app/app.jar"]
