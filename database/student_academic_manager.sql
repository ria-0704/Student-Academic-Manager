-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: student_academic_manager
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `evaluations`
--

DROP TABLE IF EXISTS `evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `attempt_id` int NOT NULL,
  `user_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `max_marks` int NOT NULL,
  `breakdown_conceptual` int DEFAULT NULL,
  `breakdown_accuracy` int DEFAULT NULL,
  `breakdown_completeness` int DEFAULT NULL,
  `breakdown_structure` int DEFAULT NULL,
  `breakdown_examples` int DEFAULT NULL,
  `strengths` text,
  `missing_points` text,
  `incorrect_points` text,
  `improvement_suggestions` text,
  `model_answer` longtext,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `attempt_id` (`attempt_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `evaluations_ibfk_1` FOREIGN KEY (`attempt_id`) REFERENCES `mock_attempts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `evaluations_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluations`
--

LOCK TABLES `evaluations` WRITE;
/*!40000 ALTER TABLE `evaluations` DISABLE KEYS */;
INSERT INTO `evaluations` VALUES (1,3,1,1.50,2,8,8,9,6,5,'Correctly identified both types of data independence (physical and logical) and accurately explained the relationship between schema levels for each (physical affecting logical schema, logical affecting external schema).','Explicit mention that application programs remain unaffected when schemas change.','Defining data independence as the \'ability to change data\' is technically incorrect; it refers to the ability to modify the database schema or structure without affecting higher levels or applications.','1. Use precise terminology: refer to \'schema\' or \'database structure\' instead of \'data\'.\n2. Mention the preservation of application programs.\n3. Organize your answer using clear bullet points or separate sentences for better presentation.','Data independence is the ability to modify the database schema at one level without altering the schema at the next higher level or requiring changes to application programs.\n\nIts two types are:\n1. Physical Data Independence: The ability to modify the physical schema (e.g., storage hardware, indexing) without affecting the logical schema.\n2. Logical Data Independence: The ability to modify the logical schema (e.g., adding or modifying tables/attributes) without affecting external schemas or existing application programs.','2026-09-04 07:00:06'),(2,4,2,0.75,2,4,4,3,5,NULL,'Correctly identified that system calls involve a transition/switch between user mode and kernel mode.','1. Definition of a system call as an interface for user programs to request services from the OS kernel. 2. Clear explanation of why it is required (e.g., resource protection, security, controlled access to hardware, abstraction).','Stated that system calls are \'made by the Operating system\' (system calls are initiated by user programs/processes, not the OS itself).','1. Clarify who initiates the call: User applications make system calls to request OS kernel services. 2. Explicitly answer both parts of the prompt: define what it is (an interface/API) and state why it is needed (security, hardware abstraction, and privileged access control).','A system call is a programmatic interface that allows a user application to request services from the operating system kernel.\n\nIt is required to maintain system stability and security. User applications execute in restricted \'user mode\' to prevent unauthorized access to hardware. System calls provide a safe, controlled mechanism to transition the CPU to \'kernel mode\' to perform privileged operations like file I/O, memory allocation, or hardware communication.','2026-09-04 13:33:49'),(3,5,2,0.50,2,3,4,2,3,NULL,'Correctly identified that a system call involves switching from user mode to kernel mode and mentioned the concept of mode bits.','Failed to define a system call as an interface/programmatic way for user applications to request OS services. Did not state the primary purpose (providing controlled and secure access to hardware resources and privileged kernel functions).','Confused the underlying mechanism (mode switching/mode bit) with the definition and purpose of the system call itself.','Ensure you address both parts of the question clearly: first define what the term is (an interface/request mechanism), and then explicitly state its primary purpose (accessing kernel services safely). Avoid relying solely on low-level implementation details like mode bits when asked for a definition.','A system call is a programmatic interface that allows a user-level application to request services directly from the operating system\'s kernel. Its primary purpose is to provide a secure, controlled, and standardized way for user programs to perform privileged operations, such as interacting with hardware devices, managing processes, and performing file I/O operations.','2026-09-07 10:23:27'),(4,6,2,1.00,2,5,4,6,6,6,'Correctly associated DDL with table structure and listed valid DDL statements (CREATE, ALTER) as well as valid DML statements (UPDATE, INSERT).','Failed to mention that DML operates on the actual *data* inside tables rather than the schema/structure.','1. Incorrectly stated that DML manipulates the \'table structure\' (DML manipulates data inside tables, not structure).\n2. Incorrectly categorized \'delete\' under DDL (DELETE is a DML statement).','Make sure to clearly distinguish between schema/structure (DDL) and rows/data (DML). Double-check the classification of SQL commands like DELETE (DML) versus TRUNCATE/DROP (DDL).','1. **Data Definition Language (DDL):** Used to define and modify the database structure/schema.\n   *Example:* `CREATE TABLE Student (id INT, name VARCHAR(50));`\n\n2. **Data Manipulation Language (DML):** Used to insert, modify, delete, and retrieve the actual data stored inside the database tables.\n   *Example:* `INSERT INTO Student VALUES (1, \'John\');`','2026-09-07 10:27:50'),(5,7,2,2.00,2,9,10,8,7,4,'Correctly identified that a database schema represents the structural framework/skeleton (data types and tables) and an instance represents the actual data stored at a specific point in time.','Could have explicitly stated the dynamic vs. static nature (i.e., schema rarely changes, while instance changes frequently with DML operations).','None','For distinction questions, structure your answer using a comparative table or separate bullet points for clarity. Adding a simple real-world or SQL example (e.g., CREATE TABLE vs. table rows) makes the answer complete.','1. Database Schema: The overall logical design, structure, and constraints of the database (e.g., table definitions, data types). It is largely static and changes very rarely.\n2. Database Instance: The actual operational data stored in the database at a specific moment in time (a snapshot). It is dynamic and changes frequently whenever data is inserted, updated, or deleted.','2026-09-07 11:10:35'),(6,8,2,1.00,2,6,9,4,7,2,'Accurately defined the core concept of Data Independence and correctly listed the two types (Physical and Logical).','Failed to provide the distinction between Physical and Logical Data Independence as explicitly requested in the question.','None','Ensure all parts of the question are answered. When asked to \'distinguish\' between concepts, explicitly define or contrast how each type operates (e.g., internal vs. conceptual schema vs. external schema).','Data Independence is the ability to modify a database schema at one level without requiring changes at the next higher level.\n\n1. Physical Data Independence: The capacity to change the internal/physical schema (e.g., storage devices, indexing) without altering the conceptual schema.\n2. Logical Data Independence: The capacity to change the conceptual schema (e.g., adding or removing tables/attributes) without altering the external schema or application programs.','2026-09-07 14:44:50'),(7,9,2,0.00,2,NULL,NULL,NULL,2,NULL,'None related to the question asked. (The provided definition of Data Independence is accurate in isolation, but completely irrelevant to this question).','The entire topic of ACID properties was omitted: Atomicity (all-or-nothing execution), Consistency (maintaining valid database states/constraints), Isolation (preventing concurrency issues), and Durability (permanence of committed data).','The answer discusses Data Independence (Physical and Logical) instead of answering the prompt about ACID properties and transaction integrity.','Read the question carefully before answering. Ensure you address the specific concept requested (ACID properties) rather than an unrelated database topic.','ACID properties ensure database transaction integrity:\n1. Atomicity: Guarantees \'all-or-nothing\' execution; if any part of a transaction fails, the entire transaction is rolled back.\n2. Consistency: Ensures the database transitions from one valid state to another, enforcing all schema rules and constraints.\n3. Isolation: Ensures concurrent transactions execute independently without interfering with each other.\n4. Durability: Guarantees that once a transaction is committed, its changes are permanently saved, even in the event of a system failure.','2026-09-07 14:53:36'),(8,10,2,0.75,2,4,9,3,5,NULL,'Correctly defined data independence and accurately listed its two types (Physical data independence and Logical data independence).','1. Explanation of the Three-Schema Architecture and its three levels (Internal/Physical, Conceptual/Logical, and External/View levels).\n2. Explanation of how mappings between these levels allow schema changes without affecting higher levels, which is how data independence is practically achieved.','None','Make sure to address all parts of the prompt. For questions asking about the three-schema architecture, explicitly list and define the three levels (Internal, Conceptual, External) and explain how schema mappings provide physical and logical data independence.','The Three-Schema Architecture separates the user applications from the physical database across three levels:\n1. External Schema (View Level): Describes user-specific views of the data.\n2. Conceptual Schema (Logical Level): Describes the structure, entities, relationships, and constraints of the entire database.\n3. Internal Schema (Physical Level): Describes physical storage structure and access paths.\n\nData independence is achieved through mappings between these schemas:\n- Physical Data Independence: Modifying the internal schema (e.g., changing index structures) without altering the conceptual schema.\n- Logical Data Independence: Modifying the conceptual schema (e.g., adding an attribute) without altering external schemas or application programs.','2026-09-07 16:17:05'),(9,11,2,0.00,2,1,5,NULL,6,NULL,'The student correctly defined \'Data Independence\' and accurately identified its two types (Physical and Logical Data Independence).','The answer failed to define what an SQL View is (a virtual table created from an SQL query) and did not state any primary advantage of using a view (such as data security, query simplification, or abstraction).','The response is entirely off-topic. Defining general Data Independence without mentioning SQL Views does not answer the question.','Read the question carefully. Focus directly on the specific concept asked (SQL Views) rather than providing generic DBMS definitions.','An SQL view is a virtual table based on the result set of an SQL query. It contains rows and columns like a real table, but does not store data physically itself.\n\nPrimary Advantage: It provides an added layer of security by restricting user access to specific rows and columns of a table, hiding sensitive underlying data.','2026-09-08 16:30:32');
/*!40000 ALTER TABLE `evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exams`
--

DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `subject_name` varchar(255) NOT NULL,
  `exam_date` date NOT NULL,
  `exam_time` time NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  CONSTRAINT `exams_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `exams_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exams`
--

LOCK TABLES `exams` WRITE;
/*!40000 ALTER TABLE `exams` DISABLE KEYS */;
/*!40000 ALTER TABLE `exams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mock_attempts`
--

DROP TABLE IF EXISTS `mock_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mock_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `question_id` int NOT NULL,
  `student_answer` longtext NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `max_marks` int NOT NULL,
  `status` enum('submitted','evaluated') DEFAULT 'submitted',
  `answer_type` enum('typed','handwritten') NOT NULL DEFAULT 'typed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `question_id` (`question_id`),
  CONSTRAINT `mock_attempts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mock_attempts_ibfk_2` FOREIGN KEY (`question_id`) REFERENCES `mock_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mock_attempts`
--

LOCK TABLES `mock_attempts` WRITE;
/*!40000 ALTER TABLE `mock_attempts` DISABLE KEYS */;
INSERT INTO `mock_attempts` VALUES (1,1,1,'conflict serializability means when two process want to work together',NULL,10,'submitted','typed','2026-09-04 06:45:58'),(2,1,2,'b+ tree is preferred as it is high branching factor , resulting in smaller tree height, fewer input output operations. It also keeps data enteries in  sorted order , making range queries and sequential access different ,',NULL,2,'submitted','typed','2026-09-04 06:50:28'),(3,1,5,'data independence means ability to change data , physical and logical are its tyep, physical means changes in physical storage without affecting logical schema , logical means changes in logical schema without affecting external schema',1.50,2,'evaluated','typed','2026-09-04 06:59:30'),(4,2,7,'System call refers to the calls that the Operating system made to switch from one mode to other mode , to switch from user mode to kernel mode.',0.75,2,'evaluated','typed','2026-09-04 13:33:23'),(5,2,8,'system call is a call that is made while switching modes, Either switching from user ode to kernel mode and so on , mode bit can be 0 or 1',0.50,2,'evaluated','typed','2026-09-07 10:23:19'),(6,2,9,'DDL tells the table structure whereas DML tells how to manipulate the table structure , \neq DDL - create , alter , truncate, delete\nDML - update , insert',1.00,2,'evaluated','typed','2026-09-07 10:27:40'),(7,2,10,'database schema is the basic structure of tables , tells datatype of tables whereas instance is the actual data filling that skeleton at any given time .',2.00,2,'evaluated','typed','2026-09-07 11:10:26'),(8,2,13,'Data Independence is the ability to\nchange the database schema at one\nlevel without requiring changes at\nnext higher level.\n\nThere are two types -\n1) Physical data independence\n2) Logical Independence',1.00,2,'evaluated','handwritten','2026-09-07 14:43:43'),(9,2,14,'Data Independence is the ability to change the database schema at one level without requiring changes at next higher level.\n\nThere are two types -\n1) Physical data Independence\n2) Logical Independence',0.00,2,'evaluated','handwritten','2026-09-07 14:52:14'),(10,2,15,'Data Independence is the ability to\nchange the database schema at one\nlevel without requiring changes at\nnext higher level.\n\nThere are two types -\n1) Physical data independence\n2) Logical Independence',0.75,2,'evaluated','handwritten','2026-09-07 16:16:54'),(11,2,16,'Data Independence is the ability to\nchange the database schema at one\nlevel without requiring changes at\nnext higher level.\n\nThere are two types-\n1) Physical data Independence\n2) Logical data Independence',0.00,2,'evaluated','handwritten','2026-09-08 16:29:53');
/*!40000 ALTER TABLE `mock_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mock_questions`
--

DROP TABLE IF EXISTS `mock_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mock_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `unit_id` int DEFAULT NULL,
  `question_text` longtext NOT NULL,
  `difficulty` enum('easy','medium','hard') NOT NULL,
  `question_type` enum('long_answer','short_answer','case_study') NOT NULL,
  `marks` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `mock_questions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mock_questions_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mock_questions_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mock_questions`
--

LOCK TABLES `mock_questions` WRITE;
/*!40000 ALTER TABLE `mock_questions` DISABLE KEYS */;
INSERT INTO `mock_questions` VALUES (1,1,2,NULL,'Explain the concept of conflict serializability in transaction management and describe how a database system uses a precedence (','medium','long_answer',10,'2026-09-04 06:45:03'),(2,1,2,NULL,'Analyze why a B+ Tree index structure is preferred over a Binary Search Tree for secondary storage retrieval','medium','long_answer',2,'2026-09-04 06:47:57'),(3,1,2,NULL,'Given a relation $R(A, B, C, D)$ with functional dependencies','medium','short_answer',2,'2026-09-04 06:56:35'),(4,1,2,NULL,'Given a relation $R(A, B, C, D)$ with functional dependencies $\\{','medium','short_answer',2,'2026-09-04 06:57:59'),(5,1,2,NULL,'Define data independence in a Database Management System (DBMS) and briefly distinguish between its two types.','easy','short_answer',2,'2026-09-04 06:58:15'),(6,2,3,NULL,'','easy','long_answer',2,'2026-09-04 13:32:27'),(7,2,3,NULL,'What is a system call, and why is it required in an operating system','easy','short_answer',2,'2026-09-04 13:32:41'),(8,2,3,NULL,'Define a system call and state its primary purpose in an operating system.','easy','short_answer',2,'2026-09-07 10:22:27'),(9,2,4,NULL,'Differentiate between Data Definition Language (DDL) and Data Manipulation Language (DML), and provide one example of an SQL statement for each.','easy','short_answer',2,'2026-09-07 10:25:44'),(10,2,4,NULL,'Differentiate between a database schema and a database instance.','easy','short_answer',2,'2026-09-07 10:59:49'),(11,2,4,NULL,'Best Fit:**\n    *   Draft 3 (\"Explain the concept of Data','easy','long_answer',2,'2026-09-07 14:18:30'),(12,2,4,NULL,'Explain the concept of Data Independence in Database Management Systems, clearly distinguishing between Logical Data Independence','easy','long_answer',2,'2026-09-07 14:19:39'),(13,2,4,NULL,'Explain the concept of Data Independence in Database Management Systems and briefly distinguish between Physical and Logical Data Independence.','easy','long_answer',2,'2026-09-07 14:35:42'),(14,2,4,NULL,'Explain the concept of ACID properties in a Database Management System and briefly describe the significance of each property in maintaining transaction integrity.','easy','long_answer',2,'2026-09-07 14:46:33'),(15,2,4,NULL,'Explain the three-schema architecture of a Database Management System and discuss how it achieves data independence.','easy','long_answer',2,'2026-09-07 16:15:50'),(16,2,4,NULL,'What is a view in SQL, and what is one primary advantage of using it','easy','short_answer',2,'2026-09-08 16:28:58');
/*!40000 ALTER TABLE `mock_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_materials`
--

DROP TABLE IF EXISTS `study_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `unit_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `stored_filename` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` enum('pdf','ppt','pptx') NOT NULL,
  `file_size` bigint NOT NULL,
  `extracted_text` longtext,
  `study_status` enum('not_started','in_progress','completed') DEFAULT 'not_started',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `study_materials_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `study_materials_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `study_materials_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_materials`
--

LOCK TABLES `study_materials` WRITE;
/*!40000 ALTER TABLE `study_materials` DISABLE KEYS */;
INSERT INTO `study_materials` VALUES (1,2,3,NULL,'Copy of Copy of ch15 - Security','Copy of Copy of ch15 - Security.ppt','ba930919-ce75-4528-9652-fbe2c1708156.ppt','C:\\Projects\\SE proj\\Student-Academic-Manager\\server\\uploads\\2\\general\\ba930919-ce75-4528-9652-fbe2c1708156.ppt','ppt',2627072,NULL,'completed','2026-09-04 13:32:02','2026-09-04 13:32:10');
/*!40000 ALTER TABLE `study_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `study_tasks`
--

DROP TABLE IF EXISTS `study_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `study_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `subject_id` int DEFAULT NULL,
  `unit_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `subject_name` varchar(255) DEFAULT NULL,
  `unit_name` varchar(255) DEFAULT NULL,
  `task_date` date DEFAULT NULL,
  `estimated_duration` int DEFAULT '60',
  `priority` enum('high','medium','low') DEFAULT 'medium',
  `is_completed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `subject_id` (`subject_id`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `study_tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `study_tasks_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL,
  CONSTRAINT `study_tasks_ibfk_3` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `study_tasks`
--

LOCK TABLES `study_tasks` WRITE;
/*!40000 ALTER TABLE `study_tasks` DISABLE KEYS */;
INSERT INTO `study_tasks` VALUES (1,2,NULL,NULL,'System calls','OS','unit 1','2026-09-05',60,'medium',0,'2026-09-04 13:34:53','2026-09-04 13:34:53'),(2,2,NULL,NULL,'Scheduling','OS',NULL,'2026-09-07',120,'low',0,'2026-09-04 13:36:20','2026-09-04 13:36:20');
/*!40000 ALTER TABLE `study_tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `subjects_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (2,1,'Database management system','1','using SQL','2026-09-04 06:29:50','2026-09-04 06:29:50'),(3,2,'Operating System','1',NULL,'2026-09-04 13:31:40','2026-09-04 13:31:40'),(4,2,'DBMS','2','SQL','2026-09-07 10:25:10','2026-09-07 10:25:10');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summaries`
--

DROP TABLE IF EXISTS `summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `summaries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `material_id` int NOT NULL,
  `user_id` int NOT NULL,
  `summary_type` enum('quick_revision','detailed','exam_oriented','simple') NOT NULL,
  `content` longtext NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_material_summary` (`material_id`,`summary_type`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `summaries_ibfk_1` FOREIGN KEY (`material_id`) REFERENCES `study_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `summaries_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summaries`
--

LOCK TABLES `summaries` WRITE;
/*!40000 ALTER TABLE `summaries` DISABLE KEYS */;
/*!40000 ALTER TABLE `summaries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `units` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject_id` int NOT NULL,
  `user_id` int NOT NULL,
  `unit_number` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subject_id` (`subject_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `units_ibfk_1` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `units_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (2,3,2,1,'System calls',NULL,'2026-09-07 10:24:35','2026-09-07 10:24:35');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Avneet','akb@thapar.edu','$2a$12$2qWCxGecxawJ.a.RXmWaKu7jl7gFvOObaXScPqt6W5L7ysChIgc2G','2026-09-04 06:05:22','2026-09-04 06:05:22'),(2,'Demo','demo@thapar.edu','$2a$12$nz1On.MlMr8owsAFZ5iF7eYVIbWtL1DlAN77vpmTsmSb5nNWCBLK6','2026-09-04 13:31:23','2026-09-04 13:31:23'),(3,'Avneet','demo1@thapar.edu','$2a$12$CjvSZJ/h41aQpX5Jijb9XOBQgTEU0HGe6XqwaYz9THjevSZ6tXfSK','2026-09-08 17:22:45','2026-09-08 17:22:45');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-09  0:28:25
