/*
 * Record Lock extension for EspoCRM.
 *
 * Record list views: when "Lock Icon in Lists" is enabled for the entity in
 * Entity Manager, adds a narrow first column that shows a lock icon for
 * locked records. Applies to every record list of that entity (list view,
 * relationship panels, dashlets, record selection).
 */
define('record-lock:handlers/list-view-setup', [], function () {

    const COLUMN = 'recordLockIcon';

    const column = {
        name: COLUMN,
        noLabel: true,
        notSortable: true,
        widthPx: 36,
        view: 'record-lock:views/fields/lock-icon',
    };

    /**
     * @param {Object[]} layout
     * @return {Object[]}
     */
    const addColumn = layout => {
        if (!Array.isArray(layout) || layout.some(item => item && item.name === COLUMN)) {
            return layout;
        }

        return [{...column}, ...layout];
    };

    class RecordLockListViewSetup {

        /**
         * @param {import('views/record/list').default} view
         */
        constructor(view) {
            this.view = view;
        }

        process() {
            const view = this.view;
            const entityType = view.entityType || view.scope ||
                (view.collection && view.collection.entityType);

            if (!entityType || !this.isEnabled(entityType)) {
                return;
            }

            // Layouts loaded from now on.
            const originalFilter = view.filterListLayout;

            view.filterListLayout = function (layout) {
                const filtered = typeof originalFilter === 'function' ?
                    originalFilter.call(this, layout) : layout;

                return addColumn(filtered);
            };

            // A layout passed in options or already loaded.
            if (Array.isArray(view.listLayout)) {
                view.listLayout = addColumn(view.listLayout);
                view._internalLayout = null;
            }
        }

        /**
         * @private
         * @param {string} entityType
         * @return {boolean}
         */
        isEnabled(entityType) {
            const metadata = this.view.getMetadata();

            if (!metadata.get(['clientDefs', entityType, 'recordLockListIcon'])) {
                return false;
            }

            const fields = metadata.get(['entityDefs', entityType, 'fields']) || {};

            return Object.keys(fields).some(name => {
                const defs = fields[name] || {};

                return defs.type === 'bool' && defs.recordLock && !defs.notStorable;
            });
        }
    }

    return RecordLockListViewSetup;
});
