-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 16, 2023 at 07:49 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendanceapp`
--

-- --------------------------------------------------------

--
-- Table structure for table `account_details`
--

CREATE TABLE `account_details` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `dept` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `deviceid` varchar(255) DEFAULT NULL,
  `regid` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account_details`
--

INSERT INTO `account_details` (`id`, `email`, `password`, `role`, `name`, `dept`, `location`, `deviceid`, `regid`) VALUES
(1, 'pradeep@gmail.com', '$2b$10$x6g6.83Ejc5acLOrQY/AEeAl9fNXABigNWKCZ0fZgdcxshijkfwre', 'student', 'Pradeep P', 'CSE', 'ab3', '$2b$10$f36dOkaOJdDlygNox/yGWe.wJcKowcwoFfLddsSGKDjNI1tftmfIa', 'CB.EN.U4CSE20646'),
(2, 'guru@gmail.com', '$2b$10$x6g6.83Ejc5acLOrQY/AEeAl9fNXABigNWKCZ0fZgdcxshijkfwre', 'faculty', 'Guru Prakash', 'CSE', 'ab3', '$2b$10$6uIMcM2pKPXKpiHgcF3XWuGo9DZqoy/0POJjg3XGAG/7ZwLFtOGxm', 'CB.EN.FAC.CSE122'),
(3, 'mukuntan@gmail.com', '$2b$10$x6g6.83Ejc5acLOrQY/AEeAl9fNXABigNWKCZ0fZgdcxshijkfwre', 'student', 'Mukuntan K U', 'CSE', 'ab3', '$2b$10$feQRD890oK6j1ouu4B4Otu.JTRCRqXFMIlhwYxdy9ZInhLVk3csVu', 'CB.EN.U4CSE20041'),
(4, 'rohith@gmail.com', '$2b$10$x6g6.83Ejc5acLOrQY/AEeAl9fNXABigNWKCZ0fZgdcxshijkfwre', 'student', 'Rohith P', 'CSE', 'ab3', NULL, 'CB.EN.U4CSE20055');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `log_id` int(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `base` varchar(255) NOT NULL,
  `current` varchar(255) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `date_time` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`log_id`, `email`, `base`, `current`, `reason`, `date_time`) VALUES
(1, 'mukuntanku23@gmail.com', 'ab3', 'gb', NULL, '2023-11-23 01:28:33'),
(2, 'mukuntanku23@gmail.com', 'ab3', 'gb', NULL, '2023-11-23 01:31:48'),
(3, 'mukuntanku23@gmail.com', 'ab3', 'gb', NULL, '2023-11-23 16:51:02'),
(4, 'mukuntanku23@gmail.com', 'ab3', 'gb', NULL, '2023-11-23 16:52:07'),
(5, 'mukuntanku23@gmail.com', 'ab3', 'gb', NULL, '2023-11-29 15:07:04'),
(6, 'guru@gmail.com', 'ab3', 'ab3', NULL, '2023-12-01 09:48:38');

-- --------------------------------------------------------

--
-- Table structure for table `event`
--

CREATE TABLE `event` (
  `id` int(11) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `regid` varchar(255) NOT NULL,
  `course_code` varchar(255) DEFAULT NULL,
  `class_date` varchar(255) NOT NULL,
  `random_code` varchar(255) DEFAULT NULL,
  `teacher_latitude` float DEFAULT NULL,
  `teacher_longitude` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event`
--

INSERT INTO `event` (`id`, `email`, `regid`, `course_code`, `class_date`, `random_code`, `teacher_latitude`, `teacher_longitude`) VALUES
(16, 'guru@gmail.com', 'CB.EN.FAC.CSE122', '19CSE463', '2023-12-01', '47647', 10.906, 76.8982),
(17, 'guru@gmail.com', 'CB.EN.FAC.CSE122', '19CSE401', '2023-12-14', '30218', 10.9061, 76.8978);

-- --------------------------------------------------------

--
-- Table structure for table `students_attendance_logs`
--

CREATE TABLE `students_attendance_logs` (
  `id` int(11) NOT NULL,
  `regid` varchar(255) NOT NULL,
  `course_code` varchar(255) NOT NULL,
  `date` varchar(255) NOT NULL,
  `fac_regid` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `students_attendance_logs`
--

INSERT INTO `students_attendance_logs` (`id`, `regid`, `course_code`, `date`, `fac_regid`) VALUES
(17, 'CB.EN.U4CSE20646', '19CSE401', '2023-11-29', 'CB.EN.FAC.CSE122'),
(18, 'CB.EN.U4CSE20041', '19CSE401', '2023-12-14', 'CB.EN.FAC.CSE122');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account_details`
--
ALTER TABLE `account_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `event`
--
ALTER TABLE `event`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `students_attendance_logs`
--
ALTER TABLE `students_attendance_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account_details`
--
ALTER TABLE `account_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `log_id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `event`
--
ALTER TABLE `event`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `students_attendance_logs`
--
ALTER TABLE `students_attendance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
