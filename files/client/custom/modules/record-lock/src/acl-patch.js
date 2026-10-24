/*
 * Record Lock extension for EspoCRM.
 *
 * Makes the client-side access check lock-aware. All UI places that decide
 * whether a record can be edited or removed (Edit button, inline edit, list
 * row actions, relationship panel actions, kanban) go through
 * AclManager.checkModel, so they all hide editing for locked records.
 */
define('record-lock:acl-patch', ['acl-manager', 'record-lock:lock-helper'], function (AclManager, Helper) {

    const FLAG = '__recordLockInstalled';

    return {
        /**
         * Install the lock-aware check. Safe to call multiple times.
         *
         * @return {boolean} True if installed by this call.
         */
        install() {
            const proto = AclManager && AclManager.prototype;

            if (!proto || typeof proto.checkModel !== 'function' || proto[FLAG]) {
                return false;
            }

            const originalCheckModel = proto.checkModel;

            proto.checkModel = function (model, action, precise) {
                if (model && (action === 'edit' || action === 'delete')) {
                    try {
                        const blocked = action === 'edit' ?
                            Helper.isEditBlocked(this, model) :
                            Helper.isRemoveBlocked(this, model);

                        if (blocked) {
                            return false;
                        }
                    } catch (e) {
                        console.error('Record Lock:', e);
                    }
                }

                return originalCheckModel.call(this, model, action, precise);
            };

            proto[FLAG] = true;

            return true;
        },
    };
});
