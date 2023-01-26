/*
Sequence database structure - v1
24th Jan 2023
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for Games
-- ----------------------------
DROP TABLE IF EXISTS `Games`;
CREATE TABLE `Games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) COLLATE utf8_bin DEFAULT NULL,
  `status` enum('waitingForPlayers','active','ended') COLLATE utf8_bin NOT NULL,
  `cardsP1` varchar(1024) COLLATE utf8_bin DEFAULT NULL,
  `cardsP2` varchar(1024) COLLATE utf8_bin DEFAULT NULL,
  `cards` varchar(1024) COLLATE utf8_bin DEFAULT NULL,
  `cardPos` int(11) DEFAULT NULL,
  `nextPlayer` int(11) DEFAULT NULL,
  `winner` int(11) DEFAULT NULL,
  `boardState` varchar(1024) COLLATE utf8_bin DEFAULT NULL,
  `Player1Id` int(11) DEFAULT NULL,
  `Player2Id` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for Users
-- ----------------------------
DROP TABLE IF EXISTS `Users`;
CREATE TABLE `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `deviceUUID` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

SET FOREIGN_KEY_CHECKS = 1;
