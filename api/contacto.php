<?php
/**
 * Monetix Digital — receptor del formulario de contacto.
 *
 * Recibe el POST del formulario, valida los datos y envía un correo
 * a la dirección de contacto. Responde siempre en JSON.
 *
 * Configuración: revisa las constantes de abajo antes de subirlo.
 */

declare(strict_types=1);

const DESTINATARIO   = 'hola@monetixdigital.com';
// El remitente debe ser una cuenta del propio dominio o el correo acabará en spam.
const REMITENTE      = 'no-reply@monetixdigital.com';
const REMITENTE_NOMBRE = 'Web Monetix Digital';
// Copia de seguridad de cada solicitud, por si falla el correo. Vacío para desactivar.
const LOG_FILE       = __DIR__ . '/../.data/solicitudes.log';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function responder(int $codigo, array $cuerpo): void
{
    http_response_code($codigo);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}

/** Limpia un valor de entrada y lo recorta a una longitud máxima. */
function campo(string $clave, int $max = 300): string
{
    $valor = $_POST[$clave] ?? '';
    if (!is_string($valor)) {
        return '';
    }
    $valor = trim($valor);
    // Quitamos saltos de línea de los campos de una sola línea: evitan inyección de cabeceras.
    if ($max <= 300) {
        $valor = str_replace(["\r", "\n"], ' ', $valor);
    }
    return mb_substr($valor, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    responder(405, ['ok' => false, 'error' => 'Método no permitido.']);
}

// Trampa antispam: si el campo oculto viene relleno, es un bot.
// Devolvemos éxito para no darle pistas.
if (campo('web') !== '') {
    responder(200, ['ok' => true]);
}

$nombre   = campo('nombre', 120);
$clinica  = campo('clinica', 160);
$email    = campo('email', 180);
$telefono = campo('telefono', 40);
$ciudad   = campo('ciudad', 120);
$sector   = campo('sector', 60);
$mensaje  = campo('mensaje', 3000);
$acepta   = isset($_POST['privacidad']);

$errores = [];

if ($nombre === '')  { $errores[] = 'nombre'; }
if ($clinica === '') { $errores[] = 'clinica'; }
if ($ciudad === '')  { $errores[] = 'ciudad'; }
if ($sector === '')  { $errores[] = 'sector'; }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { $errores[] = 'email'; }
if (!$acepta) { $errores[] = 'privacidad'; }

if ($errores) {
    responder(422, [
        'ok'      => false,
        'error'   => 'Faltan datos obligatorios o hay algún campo mal.',
        'campos'  => $errores,
    ]);
}

$sectoresValidos = ['Clínica dental', 'Centro de estética', 'Medicina estética', 'Otro'];
if (!in_array($sector, $sectoresValidos, true)) {
    $sector = 'Otro';
}

$fecha = date('d/m/Y H:i');
$ip    = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';

$asunto = sprintf('Nueva solicitud de diagnóstico: %s (%s)', $clinica, $ciudad);

$cuerpo = <<<TEXTO
Nueva solicitud desde monetixdigital.com

Nombre:    {$nombre}
Clínica:   {$clinica}
Tipo:      {$sector}
Ciudad:    {$ciudad}
Email:     {$email}
Teléfono:  {$telefono}

Mensaje:
{$mensaje}

--
Recibido el {$fecha} desde la IP {$ip}.
TEXTO;

// Guardamos una copia en disco antes de intentar el envío.
if (LOG_FILE !== '') {
    $dir = dirname(LOG_FILE);
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    @file_put_contents(
        LOG_FILE,
        '[' . date('c') . '] ' . str_replace("\n", ' | ', $cuerpo) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );
}

$cabeceras = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: ' . sprintf('=?UTF-8?B?%s?= <%s>', base64_encode(REMITENTE_NOMBRE), REMITENTE),
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion(),
];

$asuntoCodificado = '=?UTF-8?B?' . base64_encode($asunto) . '?=';

$enviado = @mail(
    DESTINATARIO,
    $asuntoCodificado,
    $cuerpo,
    implode("\r\n", $cabeceras),
    '-f' . REMITENTE
);

if (!$enviado) {
    responder(500, [
        'ok'    => false,
        'error' => 'No se ha podido enviar el correo.',
    ]);
}

responder(200, ['ok' => true]);
