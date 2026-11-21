# Capturing real screens from the phone

All commands are from Git Bash on Windows unless marked PowerShell. Captures go straight into the
video's `capture/` folder with descriptive names.

## Connect

```powershell
adb devices -l                       # expect "device", not "offline"
adb mdns services                    # wireless debugging: find the _adb-tls-connect port
adb connect <ip>:<port>
```

`offline` that survives `adb reconnect offline`: toggle Wireless debugging off and on, then connect
to the newly advertised port. If only `_adb-tls-pairing` is advertised, run `adb pair <ip>:<port>`.

Check the build you are filming: `adb shell dumpsys package dev.varuntej.aura | grep -E "versionName|versionCode"`.
Film the version you are promoting; Play may not have rolled it out to the phone yet.

## Prepare the phone

- Sign in to the demo account (no real memories, contacts or chats on screen).
- Do Not Disturb on so banners stay out of shots: `adb shell cmd notification set_dnd priority`
  (turn it off afterwards with `set_dnd off`).
- Never film the lock screen or launcher with a personal wallpaper.

## Capture

```bash
export MSYS_NO_PATHCONV=1            # Git Bash otherwise rewrites /sdcard to C:/Program Files/Git/sdcard
adb exec-out screencap -p > capture/your-aura.png
adb shell screenrecord --bit-rate 16000000 --time-limit 40 /sdcard/rec.mp4 &   # start, then drive the app
adb shell input tap 540 1200         # coordinates in physical pixels (adb shell wm size)
adb shell input text "What%sshould%sI%sfocus%son%sthis%sweek?"    # %s is a space
adb pull /sdcard/rec.mp4 capture/chat-focus-week.mp4               # only AFTER the time limit has passed
adb shell rm /sdcard/rec.mp4
```

Gotchas seen in practice:

- Pulling a recording before `screenrecord` finishes gives a file with no moov atom ("Invalid data"). Wait for the time limit, then pull again.
- `uiautomator dump` fails with "could not get idle state" while the voice orb animates. Navigate by screenshot coordinates instead.
- The keyboard moves buttons: re-screenshot after typing before tapping Send.
- Screen recordings are variable frame rate (~115 fps). Recipes resample with `-vf fps=30`.
- Find where things happen in a recording with a timestamped contact sheet:
  `ffmpeg -i capture/x.mp4 -vf "fps=4,scale=216:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=red,tile=8x5" -frames:v 1 sheet.jpg`

## After capture

Delete any capture that shows personal data before committing. Keep only the files the recipe uses.
