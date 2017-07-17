-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: 127.0.0.1    Database: ty_cmdb
-- ------------------------------------------------------
-- Server version	5.7.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `work_order_production`
--

DROP TABLE IF EXISTS `work_order_schema`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `work_order_schema` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schema_name` varchar(100) COLLATE utf8_bin NOT NULL COMMENT '数据表名称',
  `update_target` varchar(45) NOT NULL COMMENT '升级对象：',
  `update_type` varchar(45) NOT NULL COMMENT '升级类型：',
  `update_note` text COLLATE utf8_bin NOT NULL COMMENT '操作备注',
  `update_step` text COLLATE utf8_bin NOT NULL COMMENT '操作步骤',
  `sql_file` varchar(1000) COLLATE utf8_bin DEFAULT NULL COMMENT 'sql附件',
  `send_user` varchar(45) COLLATE utf8_bin DEFAULT NULL COMMENT '工单提交者',
  `accept_user` varchar(45) COLLATE utf8_bin DEFAULT NULL COMMENT '工单处理者',
  `accept_user_last` varchar(45) COLLATE utf8_bin DEFAULT NULL COMMENT '最终处理人',
  `work_order_timeline` text COLLATE utf8_bin COMMENT '工单的操作历史记录',
  `order_type` varchar(45) COLLATE utf8_bin NOT NULL COMMENT '工单处理状态:\n	待处理、已通过，\n	待确认、未通过，\n	待确认、已通过，\n	已确认、未通过，\n	已确认、再次提交;',
  `tester_action` text COLLATE utf8_bin COMMENT '测试意见',
  `proer_action` text COLLATE utf8_bin COMMENT '产品意见',
  `reason` text COLLATE utf8_bin COMMENT '运维意见',
  `create_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '工单创建时间',
  `handle_time` varchar(45) COLLATE utf8_bin DEFAULT NULL COMMENT '工单处理时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-07-12 11:34:46
