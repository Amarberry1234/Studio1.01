extends CanvasLayer

var game
var player
var hp_bar: ProgressBar
var xp_bar: ProgressBar
var hp_text: Label
var level_text: Label
var objective_text: Label
var objective_sub: Label
var kill_text: Label
var loot_text: Label
var skill_text: Label
var weapon_text: Label
var boss_bar: ProgressBar
var boss_label: Label
var message_label: Label
var crosshair: Label
var message_timer: Timer

func setup(p_game, p_player) -> void:
    game = p_game
    player = p_player
    _build()

func _panel(parent: Control, pos: Vector2, size: Vector2) -> ColorRect:
    var panel = ColorRect.new()
    panel.position = pos
    panel.size = size
    panel.color = Color(0.025, 0.035, 0.055, 0.82)
    parent.add_child(panel)
    return panel

func _label(parent: Control, text: String, pos: Vector2, size: Vector2, font_size = 20) -> Label:
    var l = Label.new()
    l.text = text
    l.position = pos
    l.size = size
    l.add_theme_font_size_override("font_size", font_size)
    l.add_theme_color_override("font_color", Color("edf5ff"))
    parent.add_child(l)
    return l

func _build() -> void:
    var root = Control.new()
    root.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
    add_child(root)

    var left = _panel(root, Vector2(22, 545), Vector2(390, 150))
    level_text = _label(left, "COMMANDO  LV.1", Vector2(18, 10), Vector2(200, 28), 20)
    hp_text = _label(left, "260 / 260", Vector2(235, 10), Vector2(140, 28), 18)
    hp_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
    hp_bar = ProgressBar.new()
    hp_bar.position = Vector2(18, 43)
    hp_bar.size = Vector2(354, 22)
    hp_bar.show_percentage = false
    hp_bar.max_value = 100.0
    left.add_child(hp_bar)
    xp_bar = ProgressBar.new()
    xp_bar.position = Vector2(18, 78)
    xp_bar.size = Vector2(354, 12)
    xp_bar.show_percentage = false
    xp_bar.max_value = 100.0
    left.add_child(xp_bar)
    loot_text = _label(left, "GEAR POWER  1.00", Vector2(18, 96), Vector2(354, 22), 15)
    kill_text = _label(left, "KILLS  0", Vector2(18, 117), Vector2(120, 22), 15)
    weapon_text = _label(left, "1  ASSAULT RIFLE", Vector2(132, 117), Vector2(240, 22), 15)
    weapon_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT

    var top = _panel(root, Vector2(315, 18), Vector2(650, 90))
    objective_text = _label(top, "OBJECTIVE", Vector2(16, 10), Vector2(618, 30), 23)
    objective_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    objective_sub = _label(top, "Secure the crash site", Vector2(16, 44), Vector2(618, 28), 17)
    objective_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    objective_sub.add_theme_color_override("font_color", Color("9ecbff"))

    var skills = _panel(root, Vector2(430, 635), Vector2(420, 62))
    skill_text = _label(skills, "Q GRENADE     E DASH     R ORBITAL     F INTERACT", Vector2(12, 16), Vector2(396, 30), 16)
    skill_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

    boss_bar = ProgressBar.new()
    boss_bar.position = Vector2(360, 122)
    boss_bar.size = Vector2(560, 20)
    boss_bar.max_value = 100.0
    boss_bar.show_percentage = false
    boss_bar.visible = false
    root.add_child(boss_bar)
    boss_label = _label(root, "BROOD SENTINEL", Vector2(360, 145), Vector2(560, 25), 17)
    boss_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    boss_label.visible = false
    boss_label.add_theme_color_override("font_color", Color("d989ff"))

    message_label = _label(root, "", Vector2(300, 255), Vector2(680, 90), 32)
    message_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    message_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    message_label.add_theme_color_override("font_color", Color("fff2a1"))

    crosshair = _label(root, "+", Vector2.ZERO, Vector2(34, 34), 28)
    crosshair.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
    crosshair.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
    crosshair.mouse_filter = Control.MOUSE_FILTER_IGNORE

    message_timer = Timer.new()
    message_timer.name = "MessageTimer"
    message_timer.one_shot = true
    message_timer.timeout.connect(_on_message_timer_timeout)
    add_child(message_timer)

func _process(_delta: float) -> void:
    if player == null or not is_instance_valid(player):
        return
    hp_bar.value = player.health_ratio() * 100.0
    hp_text.text = "%d / %d" % [int(round(player.health)), int(round(player.max_health))]
    level_text.text = "COMMANDO  LV.%d" % player.level
    xp_bar.value = 100.0 * float(player.xp) / maxf(1.0, float(player.xp_next))
    kill_text.text = "KILLS  %d" % game.total_kills
    loot_text.text = "GEAR POWER  %.2f    DMG %.0f" % [game.gear_power, player.damage]
    weapon_text.text = "%d  %s" % [player.selected_weapon + 1, player.weapon_names[player.selected_weapon]]
    objective_text.text = game.objective_title
    objective_sub.text = game.objective_subtitle
    skill_text.text = "Q %.1fs     E %.1fs     R %.1fs     F INTERACT" % [player.grenade_cooldown, player.dash_cooldown, player.ultimate_cooldown]
    crosshair.position = get_viewport().get_mouse_position() - Vector2(17, 17)
    var boss = game.boss
    if boss != null and is_instance_valid(boss):
        boss_bar.visible = true
        boss_label.visible = true
        boss_bar.value = boss.health_ratio() * 100.0
    else:
        boss_bar.visible = false
        boss_label.visible = false

func show_message(text: String, seconds = 2.4) -> void:
    if message_label == null or not is_instance_valid(message_label):
        return
    message_label.text = text
    if message_timer == null or not is_instance_valid(message_timer):
        return
    message_timer.stop()
    message_timer.wait_time = maxf(0.05, float(seconds))
    message_timer.start()

func _on_message_timer_timeout() -> void:
    if message_label != null and is_instance_valid(message_label):
        message_label.text = ""
