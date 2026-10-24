/*
 * Record Lock extension for EspoCRM.
 *
 * Record edit views (full-page edit and quick edit). When a user without the
 * override permission opens a locked record for editing (for example via a
 * direct link), the form is shown read-only, saving is hidden and a notice
 * explains why.
 */
define(
    'record-lock:handlers/edit-view-setup',
    ['record-lock:lock-helper', 'record-lock:acl-patch'],
    function (Helper, AclPatch) {

    const SAVE_ACTIONS = ['save', 'saveAndContinueEditing', 'saveAndNew'];

    class RecordLockEditViewSetup {

        /**
         * @param {import('views/record/edit').default} view
         */
        constructor(view) {
            this.view = view;
            this.isApplied = false;
        }

        process() {
            const view = this.view;
            const model = view.model;

            if (!model || !Helper.getLockFields(model).length) {
                return;
            }

            AclPatch.install();

            if (model.isNew()) {
                return;
            }

            this.apply();

            view.listenTo(model, 'sync', () => {
                Helper.capture(model);

                this.apply();
            });
        }

        /**
         * @private
         */
        apply() {
            const view = this.view;

            if (this.isApplied || !Helper.isEditBlocked(view.getAcl(), view.model)) {
                return;
            }

            this.isApplied = true;

            if (typeof view.manageAccess === 'function') {
                view.manageAccess();
            }

            view.getFieldList().forEach(field => {
                if (view.recordHelper && view.recordHelper.getFieldStateParam(field, 'readOnly')) {
                    return;
                }

                view.setFieldReadOnly(field);
            });

            SAVE_ACTIONS.forEach(name => this.hide(view, name));

            const modalView = this.getModalView();

            if (modalView) {
                SAVE_ACTIONS.forEach(name => this.hide(modalView, name));
            }

            Espo.Ui.warning(
                view.translate('editBlocked', 'messages', 'RecordLock'),
                {closeButton: true}
            );
        }

        /**
         * @private
         * @return {Object|null}
         */
        getModalView() {
            const parentView = typeof this.view.getParentView === 'function' ?
                this.view.getParentView() : null;

            if (parentView && typeof parentView.hideButton === 'function') {
                return parentView;
            }

            return null;
        }

        /**
         * @private
         */
        hide(view, name) {
            try {
                if (typeof view.hideButton === 'function') {
                    view.hideButton(name);
                }

                if (typeof view.hideActionItem === 'function') {
                    view.hideActionItem(name);
                }
            } catch (e) {
                // The action item is not present in this view.
            }
        }
    }

    return RecordLockEditViewSetup;
});
