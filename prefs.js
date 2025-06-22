import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';
import { CommandRow } from './components/commandRow.js';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class CommandPalettePrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
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
            commands.push({ name: '', script: '', args: [], id: `cmd-${_getFreeId()}` });
            _refreshCommandsUI();
            _saveConfig(configPathRow.text, commands);
        });
        group.add(addCmdBtn);


        page.add(group);
        window.add(page);



        function onCommandChange(index, updatedCommand) {
            commands[index] = updatedCommand;
            _saveConfig(configPathRow.text, commands);

            // if theres no empty command field at the end, add one
            if (!commands.some(cmd => cmd.name == '' && cmd.script == '' && cmd.args.length == 0)) {
                commands.push({ name: '', script: '', args: [], id: `cmd-${_getFreeId()}` });
                const row = new CommandRow(commands[commands.length - 1], commands.length - 1, onCommandChange, onCommandRemove);
                commandsBox.append(row.getWidget());
            }
        }

        function onCommandRemove(index) {
            commands.splice(index, 1);
            _refreshCommandsUI();
            _saveConfig(configPathRow.text, commands);
        }

        function _refreshCommandsUI() {
            _removeAllChildren(commandsBox);
            commands.forEach((cmd, i) => {
                const row = new CommandRow(cmd, i, onCommandChange, onCommandRemove);
                commandsBox.append(row.getWidget());
            });

            // if theres no empty command field at the end, add one
            if (!commands.some(cmd => cmd.name == '' && cmd.script == '' && cmd.args.length == 0)) {
                commands.push({ name: '', script: '', args: [], id: `cmd-${_getFreeId()}` });
                const row = new CommandRow(commands[commands.length - 1], commands.length - 1, onCommandChange, onCommandRemove);
                commandsBox.append(row.getWidget());
            }
        }

        function _getFreeId() {
            let id = 0;
            while (commands.some(cmd => cmd.id === `cmd-${id}`)) {
                id++;
            }
            return id;
        }

        function _loadConfig(configPath) {
            // load config.json
            if (configPath.startsWith('~')) {
                configPath = configPath.replace('~', GLib.get_home_dir());
            }

            try {
                let [ok, contents] = GLib.file_get_contents(configPath);
                if (!ok) {
                    log('Failed to read config file');
                    return [];
                }

                let rawConfig = JSON.parse(imports.byteArray.toString(contents));

                // Assign a unique ID to each entry (based on index)
                return rawConfig.map((cmd, idx) => ({
                    ...cmd,
                    id: `cmd-${idx}`
                }));

            } catch (e) {
                log(`Failed to load config: ${e}`);
                return [];
            }
        }

        function _saveConfig(configPath, data) {
            if (configPath.startsWith('~')) {
                configPath = configPath.replace('~', GLib.get_home_dir());
            }
            try {
                // remove empty commands
                data = data.filter(cmd => cmd.name !== '' || cmd.script !== '' || cmd.args.length !== 0);

                // remove id from commands
                data = data.map(cmd => {
                    delete cmd.id;
                    return cmd;
                });

                const jsonStr = JSON.stringify(data, null, 4);
                GLib.file_set_contents(configPath, jsonStr);
            } catch (e) {
                log(`Failed to save config: ${e}`);
            }
        }

        function _removeAllChildren(container) {
            let child = container.get_first_child();
            while (child) {
                const next = child.get_next_sibling();
                container.remove(child);
                child = next;
            }
        }


    }
}
