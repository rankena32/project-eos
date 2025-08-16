<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../core/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path   = $_GET['action'] ?? ''; // pvz., /api/auth.php?action=register

// JSON body helper
function json_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

switch ($path) {
  case 'register':
    if ($method !== 'POST') json_response(405, ['error'=>'method_not_allowed']);
    $in = json_body();
    $email = trim(strtolower($in['email'] ?? ''));
    $pass  = $in['password'] ?? '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($pass) < 6) {
      json_response(422, ['error'=>'invalid_input']);
    }
    $stmt = pdo()->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) json_response(409, ['error'=>'email_in_use']);

    $hash = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = pdo()->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    $stmt->execute([$email, $hash]);
    $user_id = (int)pdo()->lastInsertId();
    issue_session($user_id);
    json_response(201, ['ok'=>true, 'user_id'=>$user_id]);
    break;

  case 'login':
    if ($method !== 'POST') json_response(405, ['error'=>'method_not_allowed']);
    $in = json_body();
    $email = trim(strtolower($in['email'] ?? ''));
    $pass  = $in['password'] ?? '';
    $stmt = pdo()->prepare("SELECT id,password_hash,status FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $u = $stmt->fetch();
    if (!$u || !password_verify($pass, $u['password_hash']) || $u['status'] !== 'active') {
      json_response(401, ['error'=>'invalid_credentials']);
    }
    if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
      $new = password_hash($pass, PASSWORD_DEFAULT);
      pdo()->prepare("UPDATE users SET password_hash=? WHERE id=?")->execute([$new, $u['id']]);
    }
    pdo()->prepare("UPDATE users SET last_login_at=NOW() WHERE id=?")->execute([$u['id']]);
    issue_session((int)$u['id']);
    json_response(200, ['ok'=>true]);
    break;

  case 'me':
    if ($method !== 'GET') json_response(405, ['error'=>'method_not_allowed']);
    $u = current_user();
    json_response(200, ['user'=>$u]);
    break;

  case 'logout':
    if ($method !== 'POST') json_response(405, ['error'=>'method_not_allowed']);
    destroy_session();
    json_response(200, ['ok'=>true]);
    break;

  default:
    json_response(404, ['error'=>'not_found']);
}
