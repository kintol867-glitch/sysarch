<?php
require_once 'db.php';

function read_json() {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function student_public_fields($student) {
  unset($student['password']);
  return $student;
}

function get_student($supabase, $idNumber) {
  $result = $supabase->get('students', ['id_number' => $idNumber]);
  return is_array($result) && count($result) > 0 ? $result[0] : null;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET all students or specific student
if ($method === 'GET') {
  if (isset($_GET['id_number'])) {
    $student = get_student($supabase, $_GET['id_number']);
    echo json_encode($student ? student_public_fields($student) : null);
    exit;
  }

  // Get all students
  $result = $supabase->get('students');
  echo json_encode(is_array($result) ? $result : []);
  exit;
}

// LOGIN
if ($method === 'POST' && $action === 'login') {
  $data = read_json();
  $idNumber = trim($data['id_number'] ?? '');
  $password = $data['password'] ?? '';
  $student = get_student($supabase, $idNumber);

  if (!$student) {
    echo json_encode(['success' => false, 'message' => 'User not found. Please register first.']);
    exit;
  }

  $storedPassword = $student['password'] ?? '';
  $validPassword = password_verify($password, $storedPassword) || hash_equals($storedPassword, $password);

  if (!$validPassword) {
    echo json_encode(['success' => false, 'message' => 'Invalid password. Please try again.']);
    exit;
  }

  echo json_encode([
    'success' => true,
    'message' => 'Login successful! Welcome, ' . $student['first_name'] . '!',
    'user' => student_public_fields($student)
  ]);
  exit;
}

// BULK INSERT/UPDATE
if ($method === 'POST' && $action === 'bulk') {
  $students = read_json();
  if (!is_array($students)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid students payload.']);
    exit;
  }

  $successCount = 0;
  foreach ($students as $student) {
    if (empty($student['id_number'])) continue;
    
    $existingStudent = get_student($supabase, $student['id_number']);
    $passwordToSave = $student['password'] ?? '';
    if ($passwordToSave === '' && $existingStudent) {
      $passwordToSave = $existingStudent['password'];
    } else {
      $passwordToSave = password_hash($passwordToSave, PASSWORD_DEFAULT);
    }

    $insertData = [
      'id_number' => $student['id_number'],
      'first_name' => $student['first_name'] ?? '',
      'last_name' => $student['last_name'] ?? '',
      'middle_name' => $student['middle_name'] ?? '',
      'email' => $student['email'] ?? '',
      'course_program' => $student['course_program'] ?? '',
      'course_level' => $student['course_level'] ?? '',
      'password' => $passwordToSave,
      'address' => $student['address'] ?? '',
      'profile_picture' => $student['profile_picture'] ?? null,
      'remaining_session' => $student['remaining_session'] ?? 30,
      'total_points' => $student['total_points'] ?? 0,
      'total_sessions' => $student['total_sessions'] ?? 0,
      'total_hours' => $student['total_hours'] ?? 0
    ];

    if ($existingStudent) {
      $supabase->patch('students', $insertData, 'id_number', $student['id_number']);
    } else {
      $supabase->post('students', $insertData);
    }
    $successCount++;
  }

  echo json_encode(['success' => true, 'message' => "Saved $successCount students successfully."]);
  exit;
}

// REGISTER (new student)
if ($method === 'POST') {
  $data = read_json();
  $idNumber = trim($data['id_number'] ?? '');

  if ($idNumber === '' || empty($data['first_name']) || empty($data['last_name']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required student fields.', 'debug' => 'PHP validation failed']);
    exit;
  }

  // Check if user already exists
  $existing = get_student($supabase, $idNumber);
  if ($existing) {
    echo json_encode(['success' => false, 'message' => 'User with this ID number already exists!']);
    exit;
  }

  $insertData = [
    'id_number' => $idNumber,
    'first_name' => $data['first_name'],
    'last_name' => $data['last_name'],
    'middle_name' => $data['middle_name'] ?? '',
    'email' => $data['email'] ?? '',
    'course_program' => $data['course_program'] ?? '',
    'course_level' => $data['course_level'] ?? '',
    'password' => password_hash($data['password'], PASSWORD_DEFAULT),
    'address' => $data['address'] ?? '',
    'profile_picture' => $data['profile_picture'] ?? null,
    'remaining_session' => $data['remaining_session'] ?? 30,
    'total_points' => $data['total_points'] ?? 0
  ];

  $result = $supabase->post('students', $insertData);
  
  if (isset($result['error'])) {
    http_response_code(400);
    error_log('Supabase error: ' . json_encode($result));
    echo json_encode(['success' => false, 'message' => 'Database error: ' . ($result['message'] ?? 'Unknown error')]);
    exit;
  }
  
  if (is_null($result)) {
    http_response_code(400);
    error_log('Supabase returned null');
    echo json_encode(['success' => false, 'message' => 'Registration failed: Database returned no response']);
    exit;
  }

  echo json_encode(['success' => true, 'message' => 'Registration successful! Please login.', 'data' => $insertData]);
  exit;
}

// UPDATE user profile
if ($method === 'PUT') {
  $data = read_json();
  $idNumber = trim($_GET['id_number'] ?? ($data['id_number'] ?? ''));

  if ($idNumber === '' || !get_student($supabase, $idNumber)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found!']);
    exit;
  }

  $allowed = ['first_name', 'last_name', 'middle_name', 'email', 'course_program', 'course_level', 'address', 'profile_picture', 'remaining_session', 'total_points', 'total_sessions', 'total_hours'];
  $updateData = [];

  foreach ($allowed as $field) {
    if (array_key_exists($field, $data)) {
      $updateData[$field] = $data[$field];
    }
  }

  if (!empty($data['password'])) {
    $updateData['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
  }

  if (!$updateData) {
    echo json_encode(['success' => true, 'message' => 'No changes to save.']);
    exit;
  }

  $supabase->patch('students', $updateData, 'id_number', $idNumber);
  $updated = get_student($supabase, $idNumber);

  echo json_encode(['success' => true, 'message' => 'Profile updated successfully!', 'user' => student_public_fields($updated)]);
  exit;
}

// DELETE student
if ($method === 'DELETE') {
  $idNumber = trim($_GET['id_number'] ?? '');
  $deleted = $supabase->delete('students', 'id_number', $idNumber);
  echo json_encode(['success' => $deleted, 'message' => $deleted ? 'User deleted successfully!' : 'User not found!']);
  exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
?>
