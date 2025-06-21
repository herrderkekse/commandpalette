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

            // Create overlay entry
            this._entry = new St.Entry({
                hint_text: 'Type command...',
                can_focus: true,
                x_expand: true,
            });

            this._overlayBin = new St.Bin({
                style_class: 'container',
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: true,
                y_expand: true,
                reactive: true,
                can_focus: true,
            });
            this._overlayBin.set_child(this._entry);


            //this._entry.set_position(100, 100);


            // Connect key press event
            this._entry.clutter_text.connect('key-press-event', this._handleKeyPress.bind(this));

            this.connect('button-press-event', () => {
                this._showOverlay();
                return Clutter.EVENT_STOP;
            });
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
                this._hideOverlay();
                return Clutter.EVENT_STOP;
            }
            else {
                // Let Clutter handle regular typing
                return Clutter.EVENT_PROPAGATE;
            }
        }

        _executeCommand(command) {
            // Implement command execution logic here
            Main.notify(`Executing command: ${command}`);
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
