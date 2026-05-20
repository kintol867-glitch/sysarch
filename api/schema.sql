CREATE DATABASE IF NOT EXISTS ccs_sitin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ccs_sitin_db;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_number VARCHAR(50) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100) DEFAULT '',
  email VARCHAR(150) DEFAULT '',
  course_program VARCHAR(50) DEFAULT '',
  course_level VARCHAR(20) DEFAULT '',
  password VARCHAR(255) NOT NULL,
  address TEXT,
  profile_picture LONGTEXT,
  remaining_session INT DEFAULT 30,
  total_points INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
