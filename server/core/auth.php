<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

function issue_session(int $user_id): string {
  $token = bin2hex(random_bytes(32)); // 64 chars
  $expires = (new DateTime())->add(new DateInterval('PT' . (SESSION_LIFETIME_MIN) . 'M'));
  $stmt = pdo()->prepare("INSERT INTO sessions (user_id, token, ip, user_agent, expires_at) VALUES (?,?,?,?,?)");
  $stmt->execute([$user_id, $token, ip_bin(), user_agent(), $expires->format('Y-m-d H:i:s')]);
  set_session_cookie($token);
  return $token;
}

function current_user(): ?array {
  $token = $_COOKIE[SESSION_COOKIE] ?? null;
  if (!$token) return null;
  $stmt = pdo()->prepare("
    SELECT u.id,u.email,u.status
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > NOW()
    LIMIT 1");
  $stmt->execute([$token]);
  $user = $stmt->fetch();
  return $user ?: null;
}

function require_user(): array {
  $user = current_user();
  if (!$user || $user['status'] !== 'active') {
    json_response(401, ['error' => 'unauthorized']);
  }
  return $user;
}

function destroy_session(): void {
  $token = $_COOKIE[SESSION_COOKIE] ?? null;
  if ($token) {
    $stmt = pdo()->prepare("DELETE FROM sessions WHERE token = ?");
    $stmt->execute([$token]);
    setcookie(SESSION_COOKIE, '', time() - 3600, '/');
  }
}
