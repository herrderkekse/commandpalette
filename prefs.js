import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CommandPalettePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Command Palette Settings',
        });

        // --- Shortcut field ---
        const shortcutRow = new Adw.EntryRow({
            title: 'Shortcut',
            text: settings.get_strv('shortcut').join(', '),
            visible: true,
        });
        shortcutRow.connect('changed', () => {
            const val = shortcutRow.text.trim();
            settings.set_strv('shortcut', val ? [val] : []);
        });
        group.add(shortcutRow);



        // --- Config path field ---
        const configPathRow = new Adw.EntryRow({
            title: 'Config Path',
            text: settings.get_string('config-path'),
            visible: true,
        });
        configPathRow.connect('changed', () => {
            const val = configPathRow.text.trim();
            settings.set_string('config-path', val);
        });
        group.add(configPathRow);



        // --- Commands UI ---
        // Add UI to edit commands from config.json
        const commandsBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });

        // Load commands initially
        let commands = _loadConfig(settings.get_string('config-path'));

        // Refresh UI when config path changes
        configPathRow.connect('changed', () => {
            commands = _loadConfig(configPathRow.text);
            console.log('commands', commands);
            _refreshCommandsUI();
        });

        // Add commandsBox below config path row
        group.add(commandsBox);

        // Add "Add Command" button
        const addCmdBtn = new Gtk.Button({ label: 'Add Command' });
        addCmdBtn.connect('clicked', () => {
            commands.push({ name: '', script: '', args: [] });
            _refreshCommandsUI();
            _saveConfig(configPathRow.text, commands);
        });
        group.add(addCmdBtn);

        _refreshCommandsUI();


        // Add group to page, and page to window
        page.add(group);
        window.add(page);


        function _loadConfig(configPath) {
            // load config.json
            if (configPath.startsWith('~')) {
                configPath = configPath.replace('~', GLib.get_home_dir());
            }

            try {
                let [ok, contents] = GLib.file_get_contents(configPath);
                if (!ok) {
                    console.log('Failed to read config file');
                    return [];
                }

                let rawConfig = JSON.parse(imports.byteArray.toString(contents));

                // Assign a unique ID to each entry (based on index)
                return rawConfig.map((cmd, idx) => ({
                    ...cmd,
                    id: `cmd-${idx}`
                }));

            } catch (e) {
                console.log(`Failed to load config: ${e}`);
                return [];
            }
        }

        function _saveConfig(configPath, data) {
            if (configPath.startsWith('~')) {
                configPath = configPath.replace('~', GLib.get_home_dir());
            }
            try {
                const jsonStr = JSON.stringify(data, null, 4);
                GLib.file_set_contents(configPath, jsonStr);
            } catch (e) {
                log(`Failed to save config: ${e}`);
            }
        }

        function _createCommandRow(command, index) {
            const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin_bottom: 10 });

            // Name
            const nameRow = new Adw.EntryRow({ title: 'Name', text: command.name || '' });
            nameRow.connect('changed', () => {
                commands[index].name = nameRow.text;
                _saveConfig(configPathRow.text, commands);
            });
            box.append(nameRow);

            // Script
            const scriptRow = new Adw.EntryRow({ title: 'Script', text: command.script || '' });
            scriptRow.connect('changed', () => {
                commands[index].script = scriptRow.text;
                _saveConfig(configPathRow.text, commands);
            });
            box.append(scriptRow);

            // Args
            const argsRow = new Adw.EntryRow({
                title: 'Args (comma separated)',
                text: (command.args || []).join(', '),
            });
            argsRow.connect('changed', () => {
                commands[index].args = argsRow.text.split(',').map(s => s.trim()).filter(Boolean);
                _saveConfig(configPathRow.text, commands);
            });
            box.append(argsRow);

            // Remove button
            const removeBtn = new Gtk.Button({ label: 'Remove Command', halign: Gtk.Align.END });
            removeBtn.connect('clicked', () => {
                commands.splice(index, 1);
                _refreshCommandsUI();
                _saveConfig(configPathRow.text, commands);
            });
            box.append(removeBtn);

            return box;
        }

        function _removeAllChildren(container) {
            let child = container.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                container.remove(child);
                child = next;
            }
        }

        function _refreshCommandsUI() {
            _removeAllChildren(commandsBox);
            commands.forEach((cmd, i) => {
                commandsBox.append(_createCommandRow(cmd, i));
            });
        }


    }
}
