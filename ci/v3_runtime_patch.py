from pathlib import Path
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "project")
p = root / "scripts" / "main_3d.gd"
s = p.read_text(encoding="utf-8")

old_sound = '    var s=SFX_RIFLE; if index==1:s=SFX_SHOTGUN; elif index==2:s=SFX_PULSE; play_sfx(s,-8.0,1.0)'
new_sound = '''    var s = SFX_RIFLE\n    if index == 1:\n        s = SFX_SHOTGUN\n    elif index == 2:\n        s = SFX_PULSE\n    play_sfx(s, -8.0, 1.0)'''
if old_sound in s:
    s = s.replace(old_sound, new_sound)

old_relay = '''    if mission_phase==3 and p.global_position.distance_to(relay_node.global_position)<4.0:\n        mission_phase=4; p.has_power_core=false; uplinks_active=0; for u in uplinks: u.visible=true; objective_title="MISSION 05 // OPEN THE SKY"; objective_text="Activate uplinks — 0 / 2"; show_message("RELAY ONLINE — ACTIVATE BOTH UPLINKS",2.0); return'''
new_relay = '''    if mission_phase == 3 and p.global_position.distance_to(relay_node.global_position) < 4.0:\n        mission_phase = 4\n        p.has_power_core = false\n        uplinks_active = 0\n        for u in uplinks:\n            u.visible = true\n        objective_title = "MISSION 05 // OPEN THE SKY"\n        objective_text = "Activate uplinks — 0 / 2"\n        show_message("RELAY ONLINE — ACTIVATE BOTH UPLINKS", 2.0)\n        return'''
if old_relay in s:
    s = s.replace(old_relay, new_relay)

p.write_text(s, encoding="utf-8")
print("AMARBERRY_V3_RUNTIME_PATCH: APPLIED")
