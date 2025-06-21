# commandpalette
A GNOME shell extension that implements a vs code style but sytem wide command palette.
#### planned features:
- [ ] keybindings
- [ ] custom commands to trigger scripts
- [ ] suggestions/autocompletion
- [ ] history

## quickstart
from `~/.local/share/gnome-shell/extensions` run `git clone ...` and rename folder to `commandpalette@herrderkekse.github.com`

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
