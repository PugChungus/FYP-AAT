-- MySQL dump 10.13  Distrib 8.0.27, for Win64 (x86_64)
--
-- Host: localhost    Database: major_project_db
-- ------------------------------------------------------
-- Server version	8.0.27

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `public_key`
--

DROP TABLE IF EXISTS `public_key`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `public_key` (
  `public_key_id` int NOT NULL AUTO_INCREMENT,
  `public_key` text NOT NULL,
  `account_id` int NOT NULL,
  `date_created` datetime NOT NULL,
  PRIMARY KEY (`public_key_id`),
  KEY `account_id_idx` (`account_id`),
  CONSTRAINT `account_id` FOREIGN KEY (`account_id`) REFERENCES `user_account` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_key`
--

LOCK TABLES `public_key` WRITE;
/*!40000 ALTER TABLE `public_key` DISABLE KEYS */;
INSERT INTO `public_key` VALUES (17,'-----BEGIN PUBLIC KEY-----\r\nMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAqdYUbPXYpY5nNVun3v/e2E3t6+xrzSZuyYfmuK/A6va+cpHpCd65VXc0PMNl9AC9oQuKkn69bXnLlx/Rtgth2t8uF+1Fnp4Q6fQLbThII06mGIQ+o5s43LHCPsJtRqw5+W+cbgucuZb6LQtiCRtKz6GRtNEwDCcJ/BnpK9hEbWaNfFJ/IFRYW2oQD/Z9R3E7NsIQ0vnb/PWiCnJIqVSTkhMsSVixiucO75MADeKtbn+rGvBjd1RzyvPBw+QlzKhXJtd+QhvSE1PUMypTeGTSaGITSh4n80yGJovagpfHhDYVW2FPiucxkYahXvJ9CY+o3ihr12rPm0zS4ndQ5dlKr4oqmJgnQ4Y+gifMJwHpT7mj9pmiBU4jeaZk+bCPtrihjmD3Nf1UNThKc6cpvvhaULAYsqvIQ4vX1/fYwCGnvzXsvJvYDaX6EsOq7eVRffX7cVZlsoG7h4cQhtb/4al3jRgJf3+v93WPRJwaHFB8htbhtIJplRxC3Ft6KFxe+h9ET0XaKJBUFlLOq1B0A5Y9w5tiXjP6JaItl0k7R0nJX5VTw6HEycroPkejcDTKP315FzakkbWm0dy6wdTcbKVQZX7Mt0QpGxBOPw9vlUnB5AEjQFLhtOBGYyjfZABsFnFm1JLGrhgris6ILX/TVjHtKxE2duuosh6ttpGaFxeQCBECAwEAAQ==\r\n-----END PUBLIC KEY-----',56,'2023-12-27 21:18:06');
/*!40000 ALTER TABLE `public_key` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-01-05 16:54:31
