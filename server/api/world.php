<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../core/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';
$user = require_user();

function json_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

/**
 * Pagal GDD: aktyvų veikėją laikom kliento pusėje (localStorage), bet čia
 * reikalaujam character_id į requeste ir tikrinam nuosavybę server-side.
 */
function get_owned_character(int $user_id, int $cid): ?array {
  $stmt = pdo()->prepare("SELECT id,user_id,name,pos_x,pos_y,map_id FROM characters WHERE id=? AND user_id=? LIMIT 1");
  $stmt->execute([$cid, $user_id]);
  $ch = $stmt->fetch();
  return $ch ?: null;
}

switch ($action) {
  case 'bootstrap':
    if ($method !== 'GET') json_response(405, ['error' => 'method_not_allowed']);
    $cid = (int)($_GET['character_id'] ?? 0);
    if ($cid <= 0) json_response(422, ['error'=>'invalid_input']);

    $ch = get_owned_character((int)$user['id'], $cid);
    if (!$ch) json_response(404, ['error'=>'character_not_found']);

    // žemėlapio parametrai (kol kas fiksuoti; vėliau – iš DB ar map manifest)
    $tileSize = 32;
    json_response(200, [
      'tileSize' => $tileSize,
      'map_id'   => $ch['map_id'],
      'spawn'    => ['x'=>(int)$ch['pos_x'], 'y'=>(int)$ch['pos_y']],
      // klientas pasiims JSON žemėlapį iš public_html/maps/{map_id}.json
    ]);
    break;

  case 'save_pos':
    if ($method !== 'POST') json_response(405, ['error' => 'method_not_allowed']);
    $in = json_body();
    $cid = (int)($in['character_id'] ?? 0);
    $x   = (int)($in['x'] ?? 0);
    $y   = (int)($in['y'] ?? 0);
    $map = trim($in['map_id'] ?? '');

    if ($cid <= 0 || $map === '') json_response(422, ['error'=>'invalid_input']);
    $ch = get_owned_character((int)$user['id'], $cid);
    if (!$ch) json_response(404, ['error'=>'character_not_found']);

    $stmt = pdo()->prepare("UPDATE characters SET pos_x=?, pos_y=?, map_id=? WHERE id=?");
    $stmt->execute([$x, $y, $map, $cid]);
    json_response(200, ['ok'=>true]);
    break;

  default:
    json_response(404, ['error'=>'not_found']);
}
