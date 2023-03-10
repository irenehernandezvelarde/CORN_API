-- MySQL dump 10.13  Distrib 8.0.32, for Win64 (x86_64)
--
-- Host: containers-us-west-151.railway.app    Database: railway
-- ------------------------------------------------------
-- Server version	8.0.32

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `Buisness`
--

DROP TABLE IF EXISTS `Buisness`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Buisness` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Buisness`
--

LOCK TABLES `Buisness` WRITE;
/*!40000 ALTER TABLE `Buisness` DISABLE KEYS */;
/*!40000 ALTER TABLE `Buisness` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Transactions`
--

DROP TABLE IF EXISTS `Transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Transactions` (
  `id_transaction` int NOT NULL AUTO_INCREMENT,
  `origin` varchar(255) DEFAULT NULL,
  `destiny` varchar(255) DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  `token` varchar(255) DEFAULT NULL,
  `accepted` tinyint(1) DEFAULT NULL,
  `TimeSetup` timestamp NULL DEFAULT NULL,
  `TimeAccept` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_transaction`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Transactions`
--

LOCK TABLES `Transactions` WRITE;
/*!40000 ALTER TABLE `Transactions` DISABLE KEYS */;
INSERT INTO `Transactions` VALUES (2,NULL,'612345678',1,' SSw6gV7vnqP52KxL09MAAnkBPOkbgnOMHxCmcWujZjTZMnPp6ix32uauES0okH1CHY8HpxczraD9s069OwA1akeQrzrvwpsceWZ2Rm6G6zg8AmmuhQaaTSSkcjPQJM3L26mnLtErIiYDvdMuHt3p2yz8mlP14qHtURRlnJ5vMlQaKnEJBwdxUFmcsbGQURng710SeQkD',0,'2023-03-02 02:00:00',NULL),(3,NULL,'612345678',1,' RPe00iR7zc1Nsc6EI2eOJoYTVbPjqRtu2dga5cx3ngzIUFjyFDxrM40fiLUDoZDgewJUPbuCdR88UnUMQEdp5ank2bwt5RPG3X4OumjM5oWG4JnFwn7P016zBM9CKWyMGrgans7G1v2xYXwfYVExtH4aLyxH5kDtlA5leUBWoh9nRxSEN6E9liID4dzdoCzez2L0vxZ8',0,'2023-03-02 14:42:47',NULL),(4,'612345677','612345678',5,'hola',1,'2023-03-02 18:27:55','2023-03-02 17:39:03'),(7,'612345678','612345677',3,' rW1CIKGkSlM1CYdrgV6qh3ud5nXJEqewAzJ1bI1Rvr7Mi83ASkNSRz1FNrVs8ixDq9UwQH2d68uHg7IVuirAcKMYmG5uml5WyUL8',1,'2023-03-02 17:44:43','2023-03-02 17:54:07');
/*!40000 ALTER TABLE `Transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `phone` int NOT NULL,
  `name` text,
  `surname` text,
  `email` text,
  `password` text,
  `token` text,
  `balance` double DEFAULT NULL,
  `state` text,
  `lastChange` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'1','1','1','1',NULL,1,'Rebutjat',NULL),(2,'2','2','2','2',NULL,15,'No_verificat',NULL),(3,'3','3','3','3',NULL,75,'Per_verificar',NULL),(4,'4','4','4','4',NULL,0,NULL,NULL),(612345677,'Pablo','Munuera','pmunuera@gmail.com','P@ssw0rd',' $gp0fsdKUTaLrH7%:ujibPJ?l*Z<+e',101,'Acceptat',NULL),(612345678,'Marc','Gomez','mgomez@gmail.com','P@ssw0rd',NULL,101,'Acceptat',NULL),(612345688,'Irene','Hernandez','ihernandez@gmail.com','P@ssw0rd',NULL,100,'Acceptat',NULL),(661234567,'Ines','Tresada','itresada@gmail.com','1234',' KdmFP%-UQ*As38%&nP*qVw4x1YVl:q',50,'Acceptat',NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2023-03-09 20:21:31
