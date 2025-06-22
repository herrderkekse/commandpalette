import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
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

        // Add group to page, and page to window
        page.add(group);
        window.add(page);
    }
}
