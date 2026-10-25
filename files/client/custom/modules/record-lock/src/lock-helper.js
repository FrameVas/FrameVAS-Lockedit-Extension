/*
 * Record Lock extension for EspoCRM.
 *
 * Shared logic: which fields lock a record, whether a record is locked and
 * whether the current user may bypass the lock.
 *
 * The lock state is taken from values last received from the server, not from
 * unsaved form input, so ticking the lock field in a form does not make the
 * form read-only before the record is saved.
 */
define('record-lock:lock-helper', [], function () {

    const PERMISSION = 'recordLockPermission';

    /** @type {WeakMap<Object, {name: string, allowRemoval: boolean}[]>} */
    const fieldListCache = new WeakMap();

    /** @type {WeakMap<Object, Object.<string, boolean>>} */
    const storedStateMap = new WeakMap();

    /**
     * Records whose stream lock is enabled, shown in a stream panel.
     * Used to tell whether posts in that stream may be edited.
     *
     * @type {Map<string, Object>}
     */
    const streamParentMap = new Map();
    const STREAM_PARENT_LIMIT = 100;

    class RecordLockHelper {

        /**
         * Lock fields of a model's entity type.
         *
         * @param {import('model').default} model
         * @return {{name: string, allowRemoval: boolean}[]}
         */
        static getLockFields(model) {
            const fieldDefs = model && model.defs && model.defs.fields;

            if (!fieldDefs || typeof fieldDefs !== 'object') {
                return [];
            }

            let list = fieldListCache.get(fieldDefs);

            if (list) {
                return list;
            }

            list = Object.keys(fieldDefs)
                .filter(name => {
                    const defs = fieldDefs[name] || {};

                    return defs.type === 'bool' && !!defs.recordLock && !defs.notStorable;
                })
                .map(name => ({
                    name: name,
                    allowRemoval: !!fieldDefs[name].recordLockAllowRemoval,
                }));

            fieldListCache.set(fieldDefs, list);

            return list;
        }

        /**
         * Re-read the stored lock state from the model's current attributes.
         * To be called when the model has just been synced with the server.
         *
         * @param {import('model').default} model
         */
        static capture(model) {
            const state = storedStateMap.get(model) || {};

            RecordLockHelper.getLockFields(model).forEach(item => {
                state[item.name] = model.get(item.name) === true;
            });

            storedStateMap.set(model, state);
        }

        /**
         * @private
         * @param {import('model').default} model
         * @return {Object.<string, boolean>}
         */
        static getStoredState(model) {
            let state = storedStateMap.get(model);

            if (state) {
                return state;
            }

            RecordLockHelper.capture(model);

            state = storedStateMap.get(model);

            if (typeof model.on === 'function') {
                model.on('sync', () => RecordLockHelper.capture(model));

                model.on('change', (m, options) => {
                    if (options && options.sync) {
                        RecordLockHelper.capture(model);
                    }
                });
            }

            return state;
        }

        /**
         * Lock fields that are enabled in the stored record.
         *
         * @param {import('model').default} model
         * @return {{name: string, allowRemoval: boolean}[]}
         */
        static getActiveLockFields(model) {
            if (!model || typeof model.isNew !== 'function' || model.isNew()) {
                return [];
            }

            const fieldList = RecordLockHelper.getLockFields(model);

            if (!fieldList.length) {
                return [];
            }

            const state = RecordLockHelper.getStoredState(model);

            return fieldList.filter(item => state[item.name]);
        }

        /**
         * @param {import('model').default} model
         * @return {boolean}
         */
        static isLocked(model) {
            return RecordLockHelper.getActiveLockFields(model).length > 0;
        }

        /**
         * Whether the user may edit locked records. Administrators always can.
         *
         * @param {import('acl-manager').default} acl
         * @return {boolean}
         */
        static canOverride(acl) {
            const user = typeof acl.getUser === 'function' ? acl.getUser() : null;

            if (user && typeof user.isAdmin === 'function' && user.isAdmin()) {
                return true;
            }

            return acl.getPermissionLevel(PERMISSION) === 'yes';
        }

        /**
         * @param {import('acl-manager').default} acl
         * @param {import('model').default} model
         * @return {boolean}
         */
        static isEditBlocked(acl, model) {
            if (!RecordLockHelper.isLocked(model)) {
                return false;
            }

            return !RecordLockHelper.canOverride(acl);
        }

        /**
         * Remember a record whose stream panel is shown and whose stream lock is enabled.
         *
         * @param {import('model').default} model
         */
        static registerStreamParent(model) {
            const key = model.entityType + ':' + model.id;

            streamParentMap.delete(key);
            streamParentMap.set(key, model);

            if (streamParentMap.size > STREAM_PARENT_LIMIT) {
                streamParentMap.delete(streamParentMap.keys().next().value);
            }
        }

        /**
         * Whether a stream post may not be edited or removed because its record is locked.
         *
         * @param {import('acl-manager').default} acl
         * @param {import('model').default} note
         * @return {boolean}
         */
        static isNoteBlocked(acl, note) {
            if (!note || note.entityType !== 'Note' || note.get('type') !== 'Post') {
                return false;
            }

            const parent = streamParentMap.get(note.get('parentType') + ':' + note.get('parentId'));

            if (!parent) {
                return false;
            }

            return RecordLockHelper.isEditBlocked(acl, parent);
        }

        /**
         * @param {import('acl-manager').default} acl
         * @param {import('model').default} model
         * @return {boolean}
         */
        static isRemoveBlocked(acl, model) {
            const activeList = RecordLockHelper.getActiveLockFields(model);

            if (!activeList.length) {
                return false;
            }

            if (activeList.every(item => item.allowRemoval)) {
                return false;
            }

            return !RecordLockHelper.canOverride(acl);
        }
    }

    return RecordLockHelper;
});
