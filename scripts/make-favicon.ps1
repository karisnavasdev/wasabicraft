Add-Type -AssemblyName System.Drawing

$src = Join-Path $PSScriptRoot '..\123.png'
$root = Join-Path $PSScriptRoot '..'

function Save-ResizedPng([string]$path, [int]$size) {
  $img = [System.Drawing.Bitmap]::FromFile($src)
  $out = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($img, 0, 0, $size, $size)
  $g.Dispose()
  $out.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
  $img.Dispose()
}

Save-ResizedPng (Join-Path $root 'favicon-32x32.png') 32
Save-ResizedPng (Join-Path $root 'apple-touch-icon.png') 180

$icon = [System.Drawing.Icon]::FromHandle(
  ([System.Drawing.Bitmap]::FromFile((Join-Path $root 'favicon-32x32.png'))).GetHicon()
)
$stream = [System.IO.File]::Create((Join-Path $root 'favicon.ico'))
$icon.Save($stream)
$stream.Close()
$icon.Dispose()

Write-Output 'Favicons created'
