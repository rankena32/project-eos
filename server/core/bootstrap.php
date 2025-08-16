<?php
declare(strict_types=1);

// Basic bootstrap & config (Hostinger: laikom server/ už public_html)
mb_internal_encoding('UTF-8');
date_default_timezone_set('Europe/Copenhagen');

// Paprastas config (galite perkelti į .env ar hostingo slaptus kintamuosius)
const DB_HOST = 'localhost';
const DB_NAME = 'u289562724_project_eos';
const DB_USER = 'u289562724_pakaba';
const DB_PASS = 'Cengas_123';
const SESSION_COOKIE = 'sid';
const SESSION_LIFETIME_MIN = 60 * 24 * 7; // 7 d.

function pdo(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;
  $dsn = 'mysql:host='.DB_HOST.';dbname='.DB_NAME.';charset=utf8mb4';
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);
  return $pdo;
}

function json_response(int $code, array $data): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function ip_bin(): ?string {
  $ip = $_SERVER['REMOTE_ADDR'] ?? null;
  if (!$ip) return null;
  return @inet_pton($ip) ?: null;
}

function user_agent(): ?string {
  return substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255) ?: null;
}

function set_session_cookie(string $token): void {
  setcookie(SESSION_COOKIE, $token, [
    'expires' => time() + (SESSION_LIFETIME_MIN * 60),
    'path' => '/',
    'secure' => isset($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax',
  ]);
}
