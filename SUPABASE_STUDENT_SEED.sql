-- Supabase seed data for students table
-- Run this in Supabase SQL Editor to add 15 sample records

INSERT INTO students (
  id_number,
  first_name,
  last_name,
  middle_name,
  email,
  course_program,
  course_level,
  password,
  address,
  profile_picture,
  remaining_session,
  total_points,
  created_at
) VALUES
('2024-001', 'Ariel', 'Santos', 'L.', 'ariel.santos@student.example.com', 'BSIT', '1', 'password123', 'Block A, Room 5', NULL, 30, 150, NOW() - INTERVAL '15 days'),
('2024-002', 'Beatrice', 'Lopez', 'M.', 'beatrice.lopez@student.example.com', 'BSCS', '2', 'password123', 'Block B, Room 10', NULL, 18, 210, NOW() - INTERVAL '14 days'),
('2024-003', 'Carlo', 'Mendoza', 'J.', 'carlo.mendoza@student.example.com', 'BSIT', '1', 'password123', 'Block C, Room 3', NULL, 25, 120, NOW() - INTERVAL '13 days'),
('2024-004', 'Diane', 'Ramos', 'E.', 'diane.ramos@student.example.com', 'ACT', '1', 'password123', 'Block A, Room 12', NULL, 10, 190, NOW() - INTERVAL '12 days'),
('2024-005', 'Ethan', 'Garcia', 'S.', 'ethan.garcia@student.example.com', 'BSCS', '3', 'password123', 'Block D, Room 2', NULL, 5, 260, NOW() - INTERVAL '11 days'),
('2024-006', 'Faith', 'Torres', 'P.', 'faith.torres@student.example.com', 'BSIT', '2', 'password123', 'Block B, Room 1', NULL, 20, 170, NOW() - INTERVAL '10 days'),
('2024-007', 'Gabriel', 'Cruz', 'L.', 'gabriel.cruz@student.example.com', 'BSCS', '4', 'password123', 'Block C, Room 8', NULL, 12, 230, NOW() - INTERVAL '9 days'),
('2024-008', 'Hazel', 'Reyes', 'F.', 'hazel.reyes@student.example.com', 'ACT', '1', 'password123', 'Block A, Room 22', NULL, 28, 95, NOW() - INTERVAL '8 days'),
('2024-009', 'Ian', 'Delgado', 'N.', 'ian.delgado@student.example.com', 'BSIT', '3', 'password123', 'Block D, Room 11', NULL, 0, 300, NOW() - INTERVAL '7 days'),
('2024-010', 'Jessa', 'Villar', 'C.', 'jessa.villar@student.example.com', 'BSCS', '2', 'password123', 'Block B, Room 15', NULL, 16, 180, NOW() - INTERVAL '6 days'),
('2024-011', 'Kevin', 'Ortega', 'H.', 'kevin.ortega@student.example.com', 'BSIT', '4', 'password123', 'Block C, Room 19', NULL, 8, 240, NOW() - INTERVAL '5 days'),
('2024-012', 'Lexi', 'Marquez', 'G.', 'lexi.marquez@student.example.com', 'BSCS', '1', 'password123', 'Block A, Room 9', NULL, 22, 130, NOW() - INTERVAL '4 days'),
('2024-013', 'Milo', 'Panganiban', 'O.', 'milo.panganiban@student.example.com', 'ACT', '1', 'password123', 'Block D, Room 4', NULL, 14, 205, NOW() - INTERVAL '3 days'),
('2024-014', 'Nina', 'Flores', 'R.', 'nina.flores@student.example.com', 'BSIT', '2', 'password123', 'Block B, Room 6', NULL, 27, 110, NOW() - INTERVAL '2 days'),
('2024-015', 'Omar', 'Serrano', 'D.', 'omar.serrano@student.example.com', 'BSCS', '3', 'password123', 'Block C, Room 7', NULL, 19, 165, NOW() - INTERVAL '1 day');
