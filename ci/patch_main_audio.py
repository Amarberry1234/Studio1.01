from pathlib import Path
import sys

p = Path(sys.argv[1])
s = p.read_text()

# Track every runtime audio player so shutdown can stop playback before children
# leave the SceneTree. Headless CI does not start audio playback at all.
needle_vars = 'var rng = RandomNumberGenerator.new()\n'
replacement_vars = '''var rng = RandomNumberGenerator.new()\nvar _ambient_player: AudioStreamPlayer = null\nvar _active_sfx: Array[AudioStreamPlayer] = []\nvar _audio_shutting_down = false\n'''
if needle_vars not in s:
    raise SystemExit('rng declaration not found')
s = s.replace(needle_vars, replacement_vars, 1)

old_ambient = '''func _start_ambient_audio() -> void:\n    var ambience = AudioStreamPlayer.new()\n    ambience.name = "CrashSiteAmbience"\n    var stream = SFX_AMBIENT.duplicate()\n    if stream is AudioStreamWAV:\n        stream.loop_mode = AudioStreamWAV.LOOP_FORWARD\n    ambience.stream = stream\n    ambience.volume_db = -22.0\n    add_child(ambience)\n    ambience.play()\n'''
new_ambient = '''func _start_ambient_audio() -> void:\n    if DisplayServer.get_name() == "headless":\n        return\n    _ambient_player = AudioStreamPlayer.new()\n    _ambient_player.name = "CrashSiteAmbience"\n    _ambient_player.stream = SFX_AMBIENT\n    _ambient_player.volume_db = -22.0\n    add_child(_ambient_player)\n    _ambient_player.finished.connect(_restart_ambient_audio)\n    if not tree_exiting.is_connected(_shutdown_audio):\n        tree_exiting.connect(_shutdown_audio)\n    _ambient_player.play()\n\nfunc _restart_ambient_audio() -> void:\n    if _audio_shutting_down:\n        return\n    if is_instance_valid(_ambient_player) and _ambient_player.is_inside_tree():\n        _ambient_player.play()\n'''
if old_ambient not in s:
    raise SystemExit('ambient audio block not found')
s = s.replace(old_ambient, new_ambient, 1)

old_sfx = '''func play_sfx(stream: AudioStream, volume_db = -7.0, pitch = 1.0) -> void:\n    var audio = AudioStreamPlayer.new()\n    audio.stream = stream\n    audio.volume_db = volume_db\n    audio.pitch_scale = pitch\n    add_child(audio)\n    audio.finished.connect(audio.queue_free)\n    audio.play()\n'''
new_sfx = '''func _shutdown_audio() -> void:\n    if _audio_shutting_down:\n        return\n    _audio_shutting_down = true\n    if is_instance_valid(_ambient_player):\n        _ambient_player.stop()\n        _ambient_player.stream = null\n    for audio in _active_sfx:\n        if is_instance_valid(audio):\n            audio.stop()\n            audio.stream = null\n    _active_sfx.clear()\n\nfunc _exit_tree() -> void:\n    _shutdown_audio()\n\nfunc play_sfx(stream: AudioStream, volume_db = -7.0, pitch = 1.0) -> void:\n    if DisplayServer.get_name() == "headless":\n        return\n    if _audio_shutting_down or stream == null:\n        return\n    var audio = AudioStreamPlayer.new()\n    audio.stream = stream\n    audio.volume_db = volume_db\n    audio.pitch_scale = pitch\n    add_child(audio)\n    _active_sfx.append(audio)\n    audio.finished.connect(_on_sfx_finished.bind(audio), CONNECT_ONE_SHOT)\n    audio.play()\n\nfunc _on_sfx_finished(audio: AudioStreamPlayer) -> void:\n    if not is_instance_valid(audio):\n        return\n    audio.stop()\n    audio.stream = null\n    _active_sfx.erase(audio)\n    audio.queue_free()\n'''
if old_sfx not in s:
    raise SystemExit('play_sfx block not found')
s = s.replace(old_sfx, new_sfx, 1)

# Runtime tree ordering. Older payloads put global transforms on fresh Node3D
# instances before adding them to fx_root; Godot 4.7.2 rejects that for look_at.
old_tracer = '''    tracer.mesh = mesh\n    tracer.global_position = (from + to) * 0.5\n    tracer.look_at(to, Vector3.UP)\n    tracer.material_override = make_emissive_material(color, 4.0, 0.15)\n    fx_root.add_child(tracer)\n'''
new_tracer = '''    tracer.mesh = mesh\n    tracer.material_override = make_emissive_material(color, 4.0, 0.15)\n    fx_root.add_child(tracer)\n    tracer.global_position = (from + to) * 0.5\n    tracer.look_at(to, Vector3.UP)\n'''
if old_tracer in s:
    s = s.replace(old_tracer, new_tracer, 1)
elif new_tracer not in s:
    raise SystemExit('tracer ordering block not recognized')

old_flash = '''    flash.mesh = mesh\n    flash.global_position = pos\n    flash.material_override = make_emissive_material(Color("fff09a"), 6.0, 0.1)\n    fx_root.add_child(flash)\n'''
new_flash = '''    flash.mesh = mesh\n    flash.material_override = make_emissive_material(Color("fff09a"), 6.0, 0.1)\n    fx_root.add_child(flash)\n    flash.global_position = pos\n'''
if old_flash in s:
    s = s.replace(old_flash, new_flash, 1)
elif new_flash not in s:
    raise SystemExit('muzzle ordering block not recognized')

p.write_text(s)
