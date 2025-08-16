<?php
declare(strict_types=1);
require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/../core/auth.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

function json_body(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

$user = require_user();

switch ($action) {
  case 'list':
    if ($method !== 'GET') json_response(405, ['error'=>'method_not_allowed']);
    $stmt = pdo()->prepare("SELECT id,name,gender,slot,created_at,last_played_at FROM characters WHERE user_id=? ORDER BY slot ASC");
    $stmt->execute([$user['id']]);
    json_response(200, ['characters'=>$stmt->fetchAll()]);
    break;

  case 'create':
    if ($method !== 'POST') json_response(405, ['error'=>'method_not_allowed']);
    $in = json_body();
    $name = trim($in['name'] ?? '');
    $gender = in_array($in['gender'] ?? 'x', ['m','f','x'], true) ? $in['gender'] : 'x';
    $appearance = $in['appearance'] ?? null;
    $slot = (int)($in['slot'] ?? 1);

    if ($name === '' || $slot < 1 || $slot > 5) {
      json_response(422, ['error'=>'invalid_input']);
    }

    // Ar slot laisvas?
    $stmt = pdo()->prepare("SELECT 1 FROM characters WHERE user_id=? AND (slot=? OR name=?) LIMIT 1");
    $stmt->execute([$user['id'], $slot, $name]);
    if ($stmt->fetch()) json_response(409, ['error'=>'slot_or_name_taken']);

    $stmt = pdo()->prepare("INSERT INTO characters (user_id,name,gender,appearance,slot) VALUES (?,?,?,?,?)");
    $stmt->execute([$user['id'], $name, $gender, $appearance ? json_encode($appearance) : null, $slot]);
    json_response(201, ['ok'=>true, 'character_id'=>(int)pdo()->lastInsertId()]);
    break;

  case 'select':
    if ($method !== 'POST') json_response(405, ['error'=>'method_not_allowed']);
    $in = json_body();
    $cid = (int)($in['character_id'] ?? 0);
    $stmt = pdo()->prepare("SELECT id FROM characters WHERE id=? AND user_id=? LIMIT 1");
    $stmt->execute([$cid, $user['id']]);
    if (!$stmt->fetch()) json_response(404, ['error'=>'character_not_found']);

    // Pažymim paskutinį žaidimą
    pdo()->prepare("UPDATE characters SET last_played_at=NOW() WHERE id=?")->execute([$cid]);
    json_response(200, ['ok'=>true, 'character_id'=>$cid]);
    break;

  case 'get_position':
    if ($method !== 'GET') json_response(405, ['error' => 'method_not_allowed']);
    $charId = (int)($_GET['character_id'] ?? 0);
    if ($charId <= 0) json_response(400, ['error'=>'bad_character_id']);

    $stmt = pdo()->prepare("SELECT id, user_id, map, pos_x, pos_y FROM characters WHERE id = ?");
    $stmt->execute([$charId]);
    $ch = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$ch || (int)$ch['user_id'] !== (int)$user['id']) {
      json_response(404, ['error'=>'character_not_found']);
    }
    unset($ch['user_id']);
    json_response(200, ['character'=>$ch]);
    break;

  case 'save_position':
    if ($method !== 'POST') json_response(405, ['error' => 'method_not_allowed']);
    $in = json_body();
    $charId = (int)($in['character_id'] ?? 0);
    $map   = trim((string)($in['map'] ?? ''));
    $x     = (int)($in['x'] ?? 0);
    $y     = (int)($in['y'] ?? 0);

    if ($charId <= 0 || $map === '') json_response(400, ['error'=>'bad_input']);

    // Minimalios serverinės ribos (apsauga nuo nesąmonių):
    if ($x < 0 || $y < 0 || $x > 10000 || $y > 10000) {
      json_response(422, ['error'=>'coords_out_of_bounds']);
    }

    // Patikrinam, kad veikėjas priklauso vartotojui
    $stmt = pdo()->prepare("SELECT user_id FROM characters WHERE id=?");
    $stmt->execute([$charId]);
    $owner = $stmt->fetchColumn();
    if (!$owner || (int)$owner !== (int)$user['id']) {
      json_response(404, ['error'=>'character_not_found']);
    }

    $stmt = pdo()->prepare("UPDATE characters SET map=?, pos_x=?, pos_y=?, last_played_at=NOW() WHERE id=?");
    $stmt->execute([$map, $x, $y, $charId]);

    json_response(200, ['ok'=>true]);
    break;

  default:
    json_response(400, ['error'=>'unknown_action']);
}
