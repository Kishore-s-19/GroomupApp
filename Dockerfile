FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy Maven wrapper and give permission FIRST
COPY mvnw .
COPY .mvn .mvn
RUN chmod +x mvnw

# Copy pom and download deps
COPY pom.xml .
RUN ./mvnw dependency:go-offline

# Copy source
COPY src ./src

# Build
RUN ./mvnw clean package -DskipTests

EXPOSE 8080
CMD ["java", "-jar", "target/*.jar"]
