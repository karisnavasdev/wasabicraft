Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\123.jpg'
$dst = Join-Path $PSScriptRoot '..\123.png'

function Test-BackgroundColor([System.Drawing.Color]$c) {
  return ($c.R -gt 235 -and $c.G -gt 235 -and $c.B -gt 235)
}

$img = [System.Drawing.Bitmap]::FromFile($src)
$w = $img.Width
$h = $img.Height
$out = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

$transparent = New-Object 'System.Collections.Generic.HashSet[int]'
$queue = New-Object 'System.Collections.Generic.Queue[object]'

function Enqueue-IfBackground([int]$x, [int]$y) {
  $key = ($y * $w) + $x
  if ($transparent.Contains($key)) { return }
  $c = $img.GetPixel($x, $y)
  if (-not (Test-BackgroundColor $c)) { return }
  $transparent.Add($key) | Out-Null
  $queue.Enqueue(@($x, $y))
}

for ($x = 0; $x -lt $w; $x++) {
  Enqueue-IfBackground $x 0
  Enqueue-IfBackground $x ($h - 1)
}
for ($y = 0; $y -lt $h; $y++) {
  Enqueue-IfBackground 0 $y
  Enqueue-IfBackground ($w - 1) $y
}

while ($queue.Count -gt 0) {
  $point = $queue.Dequeue()
  $x = $point[0]
  $y = $point[1]
  if ($x -gt 0) { Enqueue-IfBackground ($x - 1) $y }
  if ($x -lt ($w - 1)) { Enqueue-IfBackground ($x + 1) $y }
  if ($y -gt 0) { Enqueue-IfBackground $x ($y - 1) }
  if ($y -lt ($h - 1)) { Enqueue-IfBackground $x ($y + 1) }
}

for ($y = 0; $y -lt $h; $y++) {
  for ($x = 0; $x -lt $w; $x++) {
    $key = ($y * $w) + $x
    if ($transparent.Contains($key)) {
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
    } else {
      $c = $img.GetPixel($x, $y)
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, $c.R, $c.G, $c.B))
    }
  }
}

$out.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$out.Dispose()
Write-Output "Saved $dst"
