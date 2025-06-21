import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';


import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';



const CommandIndicator = GObject.registerClass(
    class CommandIndicator extends PanelMenu.Button {
        _init() {

            super._init(0, 'CommandPalette');

            // Add icon
            let icon = new St.Icon({
                icon_name: 'system-run-symbolic',
                style_class: 'system-status-icon',
            });
            this.add_child(icon);



            /*************** Initialize state variables ***************/
            this._selectedIndex = -1;
            this._CONFIG = Object.freeze(this._loadUserConfig());
            this._COMMANDS = Object.freeze(this._CONFIG.map(cmd => cmd.name));
            this._suggestions = this._COMMANDS;



            /**************** Create overlay elements *****************/
            // main container
            this._overlayBin = new St.BoxLayout({
                style_class: 'container',
                vertical: true,
            });

            // input field
            this._entry = new St.Entry({
                hint_text: 'Type command...',
                can_focus: true,
                x_expand: true,
            });

            // container for input field suggestions
            this._suggestionBox = new St.BoxLayout({
                vertical: true,
                style_class: 'suggestionBox',
                reactive: true,
            });
            // this._suggestionBox.hide();
            this._updateSuggestions();


            // add children to main container
            this._overlayBin.add_child(this._entry);
            this._overlayBin.add_child(this._suggestionBox);



            /*************** Connect event listeners ***************/
            // handle click on icon in top bar
            this.connect('button-press-event', () => {
                this._showOverlay();
                return Clutter.EVENT_STOP;
            });

            // handle updating suggestions
            this._entry.clutter_text.connect('text-changed', () => {
                this._updateSuggestions();
            });

            // handle typing in entry
            this._entry.clutter_text.connect('key-press-event', this._handleKeyPress.bind(this));

        }



        _showOverlay() {
            Main.layoutManager.addTopChrome(this._overlayBin);
            this._entry.show();
            this._entry.grab_key_focus();
        }

        _hideOverlay() {
            this._entry.text = '';
            this._entry.hide();
            Main.layoutManager.removeChrome(this._overlayBin);

        }

        _handleKeyPress(_, event) {
            const sym = event.get_key_symbol();

            if (sym === Clutter.KEY_Return) {
                if (this._selectedIndex !== -1) {
                    this._executeCommand(this._suggestions[this._selectedIndex]);
                    this._selectedIndex = -1;
                    this._highlightSelected();
                    this._hideOverlay();
                    return Clutter.EVENT_STOP;
                }

                // Delay reading `.text` until after the event has fully propagated
                GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                    const command = this._entry.text;
                    this._executeCommand(command);
                    this._hideOverlay();
                    return GLib.SOURCE_REMOVE;
                });
                return Clutter.EVENT_STOP;
            }
            else if (sym === Clutter.KEY_Escape) {
                this._selectedIndex = -1;
                this._highlightSelected();
                this._hideOverlay();
                return Clutter.EVENT_STOP;
            }
            else if (sym === Clutter.KEY_Up) {
                if (this._suggestions.length > 0) {
                    this._selectedIndex = Math.max(0, this._selectedIndex - 1);
                    this._highlightSelected();
                }
                return Clutter.EVENT_STOP;
            }
            else if (sym === Clutter.KEY_Down) {
                if (this._suggestions.length > 0) {
                    this._selectedIndex = Math.min(this._suggestions.length - 1, this._selectedIndex + 1);
                    this._highlightSelected();
                }
                return Clutter.EVENT_STOP;
            }
            else {
                // Let Clutter handle regular typing
                return Clutter.EVENT_PROPAGATE;
            }
        }

        _updateSuggestions() {
            const text = this._entry.text.toLowerCase();
            this._suggestionBox.destroy_all_children();

            const matches = this._COMMANDS.filter(cmd => cmd.startsWith(text));

            if (text === '') {
                // TODO: show history/most used commands
                // return;
            }


            this._suggestions = matches;
            this._selectedIndex = -1;

            matches.forEach((cmd, index) => {
                const label = new St.Label({
                    text: cmd,
                    style_class: 'suggestion-item',
                });

                label.reactive = true;

                label.connect('button-press-event', () => {
                    this._entry.set_text(cmd);
                    this._executeCommand(cmd);
                    this._hideOverlay();
                });

                this._suggestionBox.add_child(label);
            });

            this._highlightSelected();
            if (matches.length === 0) {
                this._suggestionBox.hide();
            }
            else {
                this._suggestionBox.show();
            }

        }

        _highlightSelected() {
            console.log('highlighting ', this._selectedIndex);
            const children = this._suggestionBox.get_children();
            for (let i = 0; i < children.length; i++) {
                if (i === this._selectedIndex) {
                    children[i].add_style_class_name('selected');
                } else {
                    children[i].remove_style_class_name('selected');
                }
            }
        }

        _executeCommand(command) {
            // Implement command execution logic here
            let cmd = this._CONFIG.find(cmd => cmd.name === command);
            Main.notify(`Executing ${command}`, `${cmd.script} with args ${cmd.args}`);
        }

        _loadUserConfig() {
            // load config.json
            let configPath = GLib.build_filenamev([
                GLib.get_home_dir(),
                '.local',
                'share',
                'gnome-shell',
                'extensions',
                'commandpalette@herrderkekse.github.com',
                'config.json',
            ]);

            try {
                let [ok, contents] = GLib.file_get_contents(configPath);
                if (!ok) {
                    console.log('Failed to read config file');
                    // throw new Error("Failed to read config file");
                }

                let config = JSON.parse(imports.byteArray.toString(contents));
                return config;
            } catch (e) {
                console.log(`Failed to load config: ${e}`);
                return null;
            }
        }
    });

export default class CommandPaletteExtension extends Extension {
    enable() {
        this._indicator = new CommandIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
