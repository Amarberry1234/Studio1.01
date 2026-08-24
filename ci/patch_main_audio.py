from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text()
old = '''func _start_ambient_audio() -> void:\n    var ambience = AudioStreamPlayer.new()\n    ambience.name = "CrashSiteAmbience"\n    var stream = SFX_AMBIENT.duplicate()\n    if stream is AudioStreamWAV:\n        stream.loop_mode = AudioStreamWAV.LOOP_FORWARD\n    ambience.stream = stream\n    ambience.volume_db = -22.0\n    add_child(ambience)\n    ambience.play()\n'''
new = '''func _start_ambient_audio() -> void:\n    var ambience = AudioStreamPlayer.new()\n    ambience.name = "CrashSiteAmbience"\n    if SFX_AMBIENT is AudioStreamWAV:\n        SFX_AMBIENT.loop_mode = AudioStreamWAV.LOOP_FORWARD\n    ambience.stream = SFX_AMBIENT\n    ambience.volume_db = -22.0\n    add_child(ambience)\n    ambience.play()\n\nfunc _exit_tree() -> void:\n    for child in get_children():\n        if child is AudioStreamPlayer:\n            child.stop()\n            child.stream = null\n'''
if old not in s:
    raise SystemExit('ambient audio block not found')
p.write_text(s.replace(old, new, 1))
