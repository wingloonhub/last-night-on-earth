# Tiny static file server for the Last Night on Earth app (no Node needed).
# Serves this folder on http://localhost:8090/ . Stop it by closing the window
# or pressing Ctrl+C.
$root = $PSScriptRoot
$port = 8090
$prefix = "http://localhost:$port/"

$mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8";
  ".js"="application/javascript; charset=utf-8"; ".mjs"="application/javascript; charset=utf-8";
  ".css"="text/css; charset=utf-8"; ".json"="application/json; charset=utf-8";
  ".png"="image/png"; ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".gif"="image/gif";
  ".svg"="image/svg+xml"; ".ico"="image/x-icon"; ".webp"="image/webp";
  ".mp3"="audio/mpeg"; ".wav"="audio/wav"; ".ogg"="audio/ogg";
  ".woff"="font/woff"; ".woff2"="font/woff2"; ".ttf"="font/ttf"; ".txt"="text/plain; charset=utf-8";
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
try {
  $listener.Start()
} catch {
  Write-Host "Could not start on $prefix - $($_.Exception.Message)"
  exit 1
}
Write-Host "Serving '$root' at $prefix  (Ctrl+C to stop)"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
  } catch { break }
  $req = $ctx.Request
  $res = $ctx.Response
  try {
    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath).TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($rel)) { $rel = "index.html" }
    $path = Join-Path $root $rel
    if ((Test-Path $path) -and -not (Get-Item $path).PSIsContainer) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $res.ContentType = $ct
      $res.Headers["Cache-Control"] = "no-cache"
      $res.ContentLength64 = $bytes.Length
      $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
      $res.OutputStream.Write($msg, 0, $msg.Length)
    }
  } catch {
    try { $res.StatusCode = 500 } catch {}
  } finally {
    try { $res.OutputStream.Close() } catch {}
  }
}
