/*
 * Record Lock extension for EspoCRM.
 *
 * Adds the "Edit Locked Records" permission to the Role and Portal Role
 * forms. The core layout is modified in memory (not replaced), so permissions
 * added by future EspoCRM versions keep showing.
 */
define('record-lock:role-layout', [], function () {

    const FIELD = 'recordLockPermission';

    const isPermissionCell = cell =>
        !!cell && typeof cell === 'object' && typeof cell.name === 'string' && /Permission$/.test(cell.name);

    return {
        /**
         * @param {Object[]} layout A detail layout (panels with rows).
         */
        modify(layout) {
            if (!Array.isArray(layout)) {
                return;
            }

            const hasField = layout.some(panel =>
                panel && Array.isArray(panel.rows) &&
                panel.rows.some(row => Array.isArray(row) && row.some(cell => cell && cell.name === FIELD))
            );

            if (hasField) {
                return;
            }

            let panel = null;

            layout.forEach(item => {
                if (
                    item && Array.isArray(item.rows) &&
                    item.rows.some(row => Array.isArray(row) && row.some(isPermissionCell))
                ) {
                    panel = item;
                }
            });

            if (!panel) {
                panel = {rows: []};
                layout.push(panel);
            }

            const rows = panel.rows;
            const lastRow = rows.length ? rows[rows.length - 1] : null;

            if (Array.isArray(lastRow)) {
                const index = lastRow.indexOf(false);

                if (index !== -1) {
                    lastRow[index] = {name: FIELD};

                    return;
                }
            }

            const width = Array.isArray(lastRow) && lastRow.length ? lastRow.length : 3;
            const row = [{name: FIELD}];

            while (row.length < width) {
                row.push(false);
            }

            rows.push(row);
        },
    };
});
