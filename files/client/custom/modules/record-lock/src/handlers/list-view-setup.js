/*
 * Record Lock extension for EspoCRM.
 *
 * Record list views and Kanban boards of entities with lock fields.
 *
 * - List views: when "Icon in lists" is enabled for the entity on the Record
 *   Lock page, adds a narrow last column, right before the row actions, that
 *   shows a lock icon for locked records (list view, relationship panels,
 *   dashlets, record selection). Placed last so it doesn't get in the way of
 *   resizing the other columns.
 * - Kanban boards: always loads the lock fields with the cards, so the board
 *   knows which records are locked (Kanban queries don't include them by
 *   default), and enables the "Icon in kanban" card icon.
 */
define('record-lock:handlers/list-view-setup', [], function () {

    const COLUMN = 'recordLockIcon';

    const column = {
        name: COLUMN,
        noLabel: true,
        notSortable: true,
        align: 'right',
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

        return [...layout, {...column}];
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

            if (!entityType) {
                return;
            }

            const lockFieldList = this.getLockFieldList(entityType);

            if (!lockFieldList.length) {
                return;
            }

            if (this.isKanban()) {
                return this.setupKanban(lockFieldList);
            }

            if (!view.getMetadata().get(['clientDefs', entityType, 'recordLockListIcon'])) {
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
         * @return {boolean}
         */
        isKanban() {
            const layoutName = this.view.layoutName;

            return typeof layoutName === 'string' && layoutName.indexOf('kanban') === 0;
        }

        /**
         * @private
         * @param {string[]} lockFieldList
         * @return {Promise}
         */
        setupKanban(lockFieldList) {
            const view = this.view;

            const list = Array.isArray(view.mandatorySelectAttributeList) ?
                view.mandatorySelectAttributeList : [];

            lockFieldList.forEach(field => {
                if (!list.includes(field)) {
                    list.push(field);
                }
            });

            view.mandatorySelectAttributeList = list;

            // EspoCRM 9 skips the mandatory list once the layout is loaded, so the
            // lock fields are also added to whatever the view selects. Supports the
            // callback style (9.x) and the promise style (10.x).
            const addLockFields = attributeList => {
                if (Array.isArray(attributeList)) {
                    lockFieldList.forEach(field => {
                        if (!attributeList.includes(field)) {
                            attributeList.push(field);
                        }
                    });
                }

                return attributeList;
            };

            const originalGetSelectAttributeList = view.getSelectAttributeList;

            if (typeof originalGetSelectAttributeList === 'function') {
                view.getSelectAttributeList = function (callback) {
                    const wrappedCallback = typeof callback === 'function' ?
                        attributeList => callback(addLockFields(attributeList)) :
                        undefined;

                    const result = originalGetSelectAttributeList.call(this, wrappedCallback);

                    return result && typeof result.then === 'function' ?
                        result.then(addLockFields) :
                        result;
                };
            }

            return new Promise(resolve => {
                Espo.loader.require('record-lock:kanban-patch', KanbanPatch => {
                    KanbanPatch.install();

                    resolve();
                });
            });
        }

        /**
         * @private
         * @param {string} entityType
         * @return {string[]}
         */
        getLockFieldList(entityType) {
            const fields = this.view.getMetadata().get(['entityDefs', entityType, 'fields']) || {};

            return Object.keys(fields).filter(name => {
                const defs = fields[name] || {};

                return defs.type === 'bool' && defs.recordLock && !defs.notStorable;
            });
        }
    }

    return RecordLockListViewSetup;
});
