FROM maven:3.9.6-eclipse-temurin-21

WORKDIR /app

COPY . .

RUN mvn clean package -DskipTests


EXPOSE 10000

CMD ["sh", "-c", "java -Dserver.port=${PORT:-10000} -Dserver.address=0.0.0.0 -jar target/explorer-0.0.1-SNAPSHOT.jar"]
# CMD ["java", "-jar", "target/explorer-0.0.1-SNAPSHOT.jar"]