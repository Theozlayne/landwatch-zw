$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$ffmpeg = 'C:\Users\HP GB\Documents\Bots\graii-promo\node_modules\ffmpeg-static\ffmpeg.exe'
$outRoot = Join-Path $root '..\promo_output'
$sceneRoot = Join-Path $outRoot 'landwatch-scenes-v3'
$font = 'C\:/Windows/Fonts/bahnschrift.ttf'
$gold = 'B8944A'
$green = '06291A'
$admin = 'C:\Users\HP GB\Videos\Screen Recordings\admin.mp4'
$investigator = 'C:\Users\HP GB\Videos\Screen Recordings\investigator.mp4'
$citizen = 'C:\Users\HP GB\Downloads\citizen.mp4'

New-Item -ItemType Directory -Force -Path $sceneRoot | Out-Null

function Invoke-Ffmpeg([string[]]$Arguments) {
  & $ffmpeg @Arguments
  if ($LASTEXITCODE -ne 0) { throw "FFmpeg failed with exit code $LASTEXITCODE" }
}

function New-Card([string]$output, [double]$duration, [string]$eyebrow, [string]$headline, [string]$subline) {
  $fadeOut = [Math]::Max(0.2, $duration - 0.65)
  $filter = "drawbox=x=0:y=0:w=1920:h=14:color=0x${gold}:t=fill,drawbox=x=0:y=1066:w=1920:h=14:color=0x${gold}:t=fill,drawtext=fontfile='$font':text='$eyebrow':fontcolor=0x${gold}:fontsize=31:x=(w-text_w)/2:y=370,drawtext=fontfile='$font':text='$headline':fontcolor=white:fontsize=70:x=(w-text_w)/2:y=445,drawtext=fontfile='$font':text='$subline':fontcolor=0xD6E8DE:fontsize=34:x=(w-text_w)/2:y=550,fade=t=in:st=0:d=0.45,fade=t=out:st=${fadeOut}:d=0.65,format=yuv420p"
  Invoke-Ffmpeg @('-hide_banner','-loglevel','error','-f','lavfi','-i',"color=c=0x${green}:s=1920x1080:r=30:d=$duration",'-vf',$filter,'-an','-t',"$duration",'-c:v','libx264','-preset','fast','-crf','19','-r','30','-movflags','+faststart','-y',$output)
}

function New-Scene([string]$source, [string]$output, [double]$start, [double]$duration, [string]$eyebrow, [string]$headline, [string]$subline, [bool]$portrait = $false, [double]$speed = 1.0) {
  $fadeOut = [Math]::Max(0.2, $duration - 0.4)
  $inputDuration = $duration * $speed
  if ($portrait) {
    $filter = "[0:v]setpts=PTS/$speed,split=2[backgroundSource][screenSource];[backgroundSource]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=28,eq=brightness=-0.38:saturation=0.55[bg];[screenSource]scale=540:1000:force_original_aspect_ratio=decrease,setsar=1[screen];[bg][screen]overlay=(W-w)/2:(H-h)/2,drawbox=x=70:y=850:w=1120:h=165:color=black@0.78:t=fill,drawbox=x=70:y=850:w=8:h=165:color=0x${gold}:t=fill,drawtext=fontfile='$font':text='$eyebrow':fontcolor=0x${gold}:fontsize=24:x=106:y=888,drawtext=fontfile='$font':text='$headline':fontcolor=white:fontsize=38:x=106:y=932,drawtext=fontfile='$font':text='$subline':fontcolor=white@0.78:fontsize=22:x=106:y=980,fade=t=in:st=0:d=0.25,fade=t=out:st=${fadeOut}:d=0.4,format=yuv420p[v]"
  } else {
    $filter = "[0:v]setpts=PTS/$speed,split=2[backgroundSource][screenSource];[backgroundSource]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=24,eq=brightness=-0.42:saturation=0.62[bg];[screenSource]scale=1800:1000:force_original_aspect_ratio=decrease,setsar=1[screen];[bg][screen]overlay=(W-w)/2:(H-h)/2,drawbox=x=70:y=850:w=1120:h=165:color=black@0.78:t=fill,drawbox=x=70:y=850:w=8:h=165:color=0x${gold}:t=fill,drawtext=fontfile='$font':text='$eyebrow':fontcolor=0x${gold}:fontsize=24:x=106:y=888,drawtext=fontfile='$font':text='$headline':fontcolor=white:fontsize=38:x=106:y=932,drawtext=fontfile='$font':text='$subline':fontcolor=white@0.78:fontsize=22:x=106:y=980,fade=t=in:st=0:d=0.25,fade=t=out:st=${fadeOut}:d=0.4,format=yuv420p[v]"
  }
  Invoke-Ffmpeg @('-hide_banner','-loglevel','error','-ss',"$start",'-t',"$inputDuration",'-i',$source,'-filter_complex',$filter,'-map','[v]','-an','-t',"$duration",'-c:v','libx264','-preset','fast','-crf','19','-r','30','-movflags','+faststart','-y',$output)
}

$scenes = @()
$card = Join-Path $sceneRoot '00-intro.mp4'
if (-not (Test-Path $card)) { New-Card $card 3.0 'LANDWATCH ZW' 'A connected public service' 'From citizen report to field action' }
$scenes += $card

$definitions = @(
  @{ file=$admin; start=0; duration=9; eyebrow='THE WORKFLOW'; headline='A REPORT BECOMES A CASE'; subline='LandWatch brings every role into one view.'; portrait=$false; speed=1.15 },
  @{ file=$citizen; start=0; duration=9; eyebrow='STEP 1 · CITIZEN LOGIN'; headline='ENTER THE CITIZEN PORTAL'; subline='Sign in securely to submit and follow a report.'; portrait=$true; speed=1.0 },
  @{ file=$citizen; start=58; duration=14; eyebrow='STEP 2 · REPORT SUBMISSION'; headline='DESCRIBE WHAT YOU OBSERVE'; subline='Choose a category, location and supporting evidence.'; portrait=$true; speed=1.0 },
  @{ file=$citizen; start=104; duration=10; eyebrow='STEP 3 · REVIEW AND SEND'; headline='CONFIRM THE REPORT'; subline='Check the details, then submit for official review.'; portrait=$true; speed=0.9 },
  @{ file=$admin; start=43; duration=12; eyebrow='STEP 4 · MINISTRY REVIEW'; headline='REVIEW THE CASE'; subline='Officials check the information and decide the next action.'; portrait=$false; speed=1.1 },
  @{ file=$admin; start=72; duration=10; eyebrow='STEP 5 · CASE ASSIGNMENT'; headline='SELECT THE FIELD INSPECTOR'; subline='Route the case to the responsible officer.'; portrait=$false; speed=1.0 },
  @{ file=$investigator; start=0; duration=10; eyebrow='STEP 6 · INSPECTOR WORKSPACE'; headline='OPEN ASSIGNED CASES'; subline='The field officer sees the work requiring attention.'; portrait=$false; speed=1.1 },
  @{ file=$investigator; start=34; duration=12; eyebrow='STEP 7 · CASE REVIEW'; headline='CHECK EVIDENCE AND LOCATION'; subline='Review the report before recording field observations.'; portrait=$false; speed=1.0 },
  @{ file=$investigator; start=66; duration=14; eyebrow='STEP 8 · INVESTIGATION FINDINGS'; headline='UPDATE THE CASE'; subline='Record observations, severity and recommended action.'; portrait=$false; speed=0.9 },
  @{ file=$investigator; start=132; duration=10; eyebrow='STEP 9 · STATUS UPDATE'; headline='KEEP THE WORKFLOW MOVING'; subline='Change the case status and confirm the official update.'; portrait=$false; speed=0.85 },
  @{ file=$citizen; start=118; duration=10; eyebrow='STEP 10 · CITIZEN FOLLOW-UP'; headline='STAY INFORMED'; subline='Citizens can see how their case progresses.'; portrait=$true; speed=0.9 }
)

$index = 1
foreach ($definition in $definitions) {
  $scene = Join-Path $sceneRoot ("{0:D2}-scene.mp4" -f $index)
  if (-not (Test-Path $scene)) { New-Scene $definition.file $scene $definition.start $definition.duration $definition.eyebrow $definition.headline $definition.subline $definition.portrait $definition.speed }
  $scenes += $scene
  $index++
}

$outro = Join-Path $sceneRoot '99-outro.mp4'
if (-not (Test-Path $outro)) { New-Card $outro 4.0 'LANDWATCH ZW' 'REPORT RESPONSIBLY. REVIEW CAREFULLY.' 'Protect our future.' }
$scenes += $outro

$concat = Join-Path $root 'landwatch-hybrid-concat-v3.txt'
$scenes | ForEach-Object { "file '$($_.Replace('\','/'))'" } | Set-Content -LiteralPath $concat -Encoding ascii
$silent = Join-Path $outRoot 'landwatchzw_hybrid_promo_tutorial_silent_v2.mp4'
Invoke-Ffmpeg @('-hide_banner','-loglevel','error','-f','concat','-safe','0','-i',$concat,'-c','copy','-movflags','+faststart','-y',$silent)
Write-Output $silent
