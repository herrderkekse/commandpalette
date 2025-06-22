# commandpalette
A GNOME shell extension that implements a vs code style but sytem wide command palette.
#### planned features:
- [x] keybindings
- [x] custom commands to trigger scripts
- [x] suggestions/autocompletion
- [ ] better suggestions/autocompletion (fuzzy search)
- [ ] history

## quickstart
from `~/.local/share/gnome-shell/extensions` run `git clone ...` and rename folder to `commandpalette@herrderkekse.github.com`

compile the schema by running 
```bash
glib-compile-schemas schemas/
```
from the extension directory (the one you just cloned and renamed)

## debugging and development
run debug environment with 
```bash
dbus-run-session -- gnome-shell --nested --wayland
```
Then enable the extension by opening a terminal **inside** the nested session and run 
```bash
gnome-extensions enable commandpalette@herrderkekse.github.com
```
To view any changes you made to the extension, you have to reload the extension by running 
```bash
gnome-extensions reset commandpalette@herrderkekse.github.com
gnome-extensions enable commandpalette@herrderkekse.github.com
```
If you made changes to the schema, you have to recompile it by running 
```bash
glib-compile-schemas schemas/
```
from the extensions root directory.


## TODO
commands are getting run as the user from `/home/{user}`
