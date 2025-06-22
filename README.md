# commandpalette
A GNOME shell extension that implements a vs code style but sytem wide command palette.
#### planned features:
- [ ] keybindings
- [x] custom commands to trigger scripts
- [x] suggestions/autocompletion
- [ ] better suggestions/autocompletion (fuzzy search)
- [ ] history

## quickstart
from `~/.local/share/gnome-shell/extensions` run `git clone ...` and rename folder to `commandpalette@herrderkekse.github.com`

compile the schema by running 
```bash
glib-compile-schemas schemas/gschemas.compiled
```
from the extension directory (the one you just cloned and renamed)

run debug with 
```bash
dbus-run-session -- gnome-shell --nested --wayland
```

the first time you do that you also have to open a terminal **inside** the nested session and run 
```bash
gnome-extensions enable commandpalette@herrderkekse.github.com
```

## TODO
commands are getting run as the user from `/home/{user}`
