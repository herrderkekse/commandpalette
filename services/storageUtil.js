import GLib from 'gi://GLib';

export function getFreeId(commands) {
    let id = 0;
    while (commands.some(cmd => cmd.id === `cmd-${id}`)) {
        id++;
    }
    return id;
}

export function loadConfig(configPath) {
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

export function saveConfig(configPath, data) {
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