import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CommandPalettePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        // Load commands initially
        let commands = _loadConfig(settings.get_string('config-path'));


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

            // Refresh UI when config path changes
            commands = _loadConfig(configPathRow.text);
            console.log('commands', commands);
            _refreshCommandsUI();
        });
        group.add(configPathRow);



        // --- Commands UI ---
        const commandsBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 10 });
        group.add(commandsBox);
        _refreshCommandsUI();



        // --- Add Command button ---
        const addCmdBtn = new Adw.ButtonRow({ title: 'Add Command' });
        addCmdBtn.connect('activated', () => {
            commands.push({ name: '', script: '', args: [] });
            _refreshCommandsUI();
            _saveConfig(configPathRow.text, commands);
        });
        group.add(addCmdBtn);



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

            const cmdgroup = new Adw.PreferencesGroup({
                title: `Command ${index + 1}` || 'New Command',
            });

            // Name
            const cmdnameRow = new Adw.EntryRow({
                title: 'Command Name',
                text: command.name || '',
                visible: true,
            });
            cmdnameRow.connect('changed', () => {
                commands[index].name = cmdnameRow.text;
                _saveConfig(configPathRow.text, commands);
            });
            cmdgroup.add(cmdnameRow);

            // Script
            const cmdscriptRow = new Adw.EntryRow({
                title: 'Script',
                text: command.script || '',
                visible: true,
            });
            cmdscriptRow.connect('changed', () => {
                commands[index].script = cmdscriptRow.text;
                _saveConfig(configPathRow.text, commands);
            });
            cmdgroup.add(cmdscriptRow);

            // Args
            const cmdargsRow = new Adw.EntryRow({
                title: 'Args (comma separated)',
                text: (command.args || []).join(', '),
                visible: true,
            });
            cmdargsRow.connect('changed', () => {
                commands[index].args = cmdargsRow.text.split(',').map(s => s.trim()).filter(Boolean);
                _saveConfig(configPathRow.text, commands);
            });
            cmdgroup.add(cmdargsRow);


            // Remove button
            const removeBtn = new Adw.ButtonRow({
                title: 'Remove Command',
            });
            removeBtn.add_css_class('destructive-action');
            removeBtn.connect('activated', () => {
                commands.splice(index, 1);
                _refreshCommandsUI();
                _saveConfig(configPathRow.text, commands);
            });
            cmdgroup.add(removeBtn);

            return cmdgroup;
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
