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

function get_student($pdo, $idNumber) {
  $stmt = $pdo->prepare('SELECT * FROM students WHERE id_number = ? LIMIT 1');
  $stmt->execute([$idNumber]);
  $student = $stmt->fetch();
  return $student ?: null;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

if ($method === 'GET') {
  if (isset($_GET['id_number'])) {
    $student = get_student($pdo, $_GET['id_number']);
    echo json_encode($student ? student_public_fields($student) : null);
    exit;
  }

  $stmt = $pdo->query('SELECT id, id_number, first_name, last_name, middle_name, email, course_program, course_level, address, profile_picture, remaining_session, total_points, created_at, updated_at FROM students ORDER BY created_at DESC');
  echo json_encode($stmt->fetchAll());
  exit;
}

if ($method === 'POST' && $action === 'login') {
  $data = read_json();
  $idNumber = trim($data['id_number'] ?? '');
  $password = $data['password'] ?? '';
  $student = get_student($pdo, $idNumber);

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

if ($method === 'POST' && $action === 'bulk') {
  $students = read_json();
  if (!is_array($students)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid students payload.']);
    exit;
  }

  $stmt = $pdo->prepare(
    'INSERT INTO students (id_number, first_name, last_name, middle_name, email, course_program, course_level, password, address, profile_picture, remaining_session, total_points, created_at)
     VALUES (:id_number, :first_name, :last_name, :middle_name, :email, :course_program, :course_level, :password, :address, :profile_picture, :remaining_session, :total_points, :created_at)
     ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), middle_name = VALUES(middle_name), email = VALUES(email), course_program = VALUES(course_program), course_level = VALUES(course_level), password = VALUES(password), address = VALUES(address), profile_picture = VALUES(profile_picture), remaining_session = VALUES(remaining_session), total_points = VALUES(total_points)'
  );

  foreach ($students as $student) {
    if (empty($student['id_number'])) continue;
    $existingStudent = get_student($pdo, $student['id_number']);
    $passwordToSave = $student['password'] ?? '';
    if ($passwordToSave === '' && $existingStudent) {
      $passwordToSave = $existingStudent['password'];
    }

    $stmt->execute([
      ':id_number' => $student['id_number'],
      ':first_name' => $student['first_name'] ?? '',
      ':last_name' => $student['last_name'] ?? '',
      ':middle_name' => $student['middle_name'] ?? '',
      ':email' => $student['email'] ?? '',
      ':course_program' => $student['course_program'] ?? '',
      ':course_level' => $student['course_level'] ?? '',
      ':password' => $passwordToSave,
      ':address' => $student['address'] ?? '',
      ':profile_picture' => $student['profile_picture'] ?? null,
      ':remaining_session' => $student['remaining_session'] ?? 30,
      ':total_points' => $student['total_points'] ?? 0,
      ':created_at' => isset($student['created_at']) ? date('Y-m-d H:i:s', strtotime($student['created_at'])) : date('Y-m-d H:i:s')
    ]);
  }

  echo json_encode(['success' => true, 'message' => 'Students saved successfully.']);
  exit;
}

if ($method === 'POST') {
  $data = read_json();
  $idNumber = trim($data['id_number'] ?? '');

  if ($idNumber === '' || empty($data['first_name']) || empty($data['last_name']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required student fields.']);
    exit;
  }

  if (get_student($pdo, $idNumber)) {
    echo json_encode(['success' => false, 'message' => 'User with this ID number already exists!']);
    exit;
  }

  $stmt = $pdo->prepare(
    'INSERT INTO students (id_number, first_name, last_name, middle_name, email, course_program, course_level, password, address, profile_picture, remaining_session, total_points, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  $stmt->execute([
    $idNumber,
    $data['first_name'],
    $data['last_name'],
    $data['middle_name'] ?? '',
    $data['email'] ?? '',
    $data['course_program'] ?? '',
    $data['course_level'] ?? '',
    password_hash($data['password'], PASSWORD_DEFAULT),
    $data['address'] ?? '',
    $data['profile_picture'] ?? null,
    $data['remaining_session'] ?? 30,
    $data['total_points'] ?? 0,
    isset($data['created_at']) ? date('Y-m-d H:i:s', strtotime($data['created_at'])) : date('Y-m-d H:i:s')
  ]);

  echo json_encode(['success' => true, 'message' => 'Registration successful! Please login.']);
  exit;
}

if ($method === 'PUT') {
  $data = read_json();
  $idNumber = trim($_GET['id_number'] ?? ($data['id_number'] ?? ''));

  if ($idNumber === '' || !get_student($pdo, $idNumber)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'User not found!']);
    exit;
  }

  $allowed = ['first_name', 'last_name', 'middle_name', 'email', 'course_program', 'course_level', 'address', 'profile_picture', 'remaining_session', 'total_points'];
  $sets = [];
  $params = [];

  foreach ($allowed as $field) {
    if (array_key_exists($field, $data)) {
      $sets[] = "$field = ?";
      $params[] = $data[$field];
    }
  }

  if (!empty($data['password'])) {
    $sets[] = 'password = ?';
    $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
  }

  if (!$sets) {
    echo json_encode(['success' => true, 'message' => 'No changes to save.']);
    exit;
  }

  $params[] = $idNumber;
  $stmt = $pdo->prepare('UPDATE students SET ' . implode(', ', $sets) . ' WHERE id_number = ?');
  $stmt->execute($params);

  echo json_encode(['success' => true, 'message' => 'Profile updated successfully!', 'user' => student_public_fields(get_student($pdo, $idNumber))]);
  exit;
}

if ($method === 'DELETE') {
  $idNumber = trim($_GET['id_number'] ?? '');
  $stmt = $pdo->prepare('DELETE FROM students WHERE id_number = ?');
  $stmt->execute([$idNumber]);
  echo json_encode(['success' => $stmt->rowCount() > 0, 'message' => $stmt->rowCount() > 0 ? 'User deleted successfully!' : 'User not found!']);
  exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
?>
