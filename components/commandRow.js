import Adw from 'gi://Adw';

export class CommandRow {
    constructor(command, index, onChange, onRemove) {
        this.command = command;
        this.index = index;
        this.onChange = onChange; // callback when command data changes
        this.onRemove = onRemove; // callback when remove button is clicked

        this.widget = new Adw.PreferencesGroup({
            title: `Command ${index + 1}` || 'New Command',
        });

        this._buildUI();
    }

    _buildUI() {
        // Command Name row
        this.nameRow = new Adw.EntryRow({
            title: 'Command Name',
            text: this.command.name || '',
            visible: true,
        });
        this.nameRow.connect('changed', () => {
            this.command.name = this.nameRow.text;
            this.onChange(this.index, this.command);
        });
        this.widget.add(this.nameRow);

        // Script row
        this.scriptRow = new Adw.EntryRow({
            title: 'Script',
            text: this.command.script || '',
            visible: true,
        });
        this.scriptRow.connect('changed', () => {
            this.command.script = this.scriptRow.text;
            this.onChange(this.index, this.command);
        });
        this.widget.add(this.scriptRow);

        // Args row
        this.argsRow = new Adw.EntryRow({
            title: 'Args (comma separated)',
            text: (this.command.args || []).join(', '),
            visible: true,
        });
        this.argsRow.connect('changed', () => {
            this.command.args = this.argsRow.text
                .split(',')
                .map(s => s.trim())
                .filter(Boolean);
            this.onChange(this.index, this.command);
        });
        this.widget.add(this.argsRow);

        // Remove button
        this.removeBtn = new Adw.ButtonRow({
            title: 'Remove Command',
        });
        this.removeBtn.add_css_class('destructive-action');
        this.removeBtn.connect('activated', () => {
            this.onRemove(this.index);
        });
        this.widget.add(this.removeBtn);
    }

    getWidget() {
        return this.widget;
    }
}
