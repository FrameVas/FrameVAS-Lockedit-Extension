/*
 * Record Lock extension for EspoCRM.
 *
 * Record detail views: shows a "Locked" indicator and switches the view
 * between read-only and editable when the lock state changes after a save
 * or a refresh.
 */
define(
    'record-lock:handlers/detail-view-setup',
    ['record-lock:lock-helper', 'record-lock:acl-patch', 'record-lock:stream-patch'],
    function (Helper, AclPatch, StreamPatch) {

    const INDICATOR = 'recordLockIndicator';

    class RecordLockDetailViewSetup {

        /**
         * @param {import('views/record/detail').default} view
         */
        constructor(view) {
            this.view = view;
            /** @type {Object.<string, boolean>} */
            this.lockedFieldMap = {};
        }

        process() {
            const view = this.view;
            const model = view.model;

            if (!model || !Helper.getLockFields(model).length) {
                return;
            }

            // Fallback in case the startup script could not install the patches.
            StreamPatch.install();

            if (AclPatch.install() && typeof view.manageAccess === 'function') {
                view.manageAccess();
            }

            if (model.isNew()) {
                return;
            }

            const acl = view.getAcl();

            let isLocked = Helper.isLocked(model);
            let isBlocked = Helper.isEditBlocked(acl, model);

            // Placed after the actions button group (Edit and the "..." menu).
            view.on('after:render', () => this.renderIndicator());

            view.listenTo(model, 'sync', () => {
                Helper.capture(model);

                const nowLocked = Helper.isLocked(model);
                const nowBlocked = Helper.isEditBlocked(acl, model);

                if (nowLocked !== isLocked) {
                    isLocked = nowLocked;

                    this.renderIndicator();
                }

                if (nowBlocked === isBlocked) {
                    return;
                }

                isBlocked = nowBlocked;

                nowBlocked ? this.lock() : this.unlock();
            });
        }

        /**
         * Renders the "Locked" indicator right after the actions button group,
         * or hides it when the record is not locked.
         *
         * @private
         */
        renderIndicator() {
            const view = this.view;
            const root = view.element || (view.$el && view.$el[0]);

            if (!root) {
                return;
            }

            const container = root.querySelector('.detail-button-container .sub-container');

            if (!container) {
                return;
            }

            let indicator = container.querySelector(`:scope > [data-name="${INDICATOR}"]`);

            if (!indicator) {
                const label = view.translate('Locked', 'labels', 'RecordLock');

                indicator = document.createElement('button');
                indicator.type = 'button';
                indicator.className = 'btn btn-text record-lock-indicator';
                indicator.dataset.name = INDICATOR;
                indicator.title = view.translate('indicatorTitle', 'messages', 'RecordLock');
                indicator.style.marginLeft = '4px';
                indicator.innerHTML = '<span class="fas fa-lock"></span> ' +
                    Handlebars.Utils.escapeExpression(label);

                indicator.addEventListener('click', () => this.showInfo());

                const actionsGroup = container.querySelector(':scope > .actions-btn-group');

                actionsGroup ?
                    actionsGroup.after(indicator) :
                    container.prepend(indicator);
            }

            indicator.classList.toggle('hidden', !Helper.isLocked(view.model));
        }

        /**
         * @private
         */
        showInfo() {
            const view = this.view;
            const model = view.model;

            const fieldLabels = Helper.getActiveLockFields(model)
                .map(item => view.translate(item.name, 'fields', model.entityType))
                .join(', ');

            const key = Helper.canOverride(view.getAcl()) ? 'lockedCanEdit' : 'lockedCannotEdit';

            const message = view.translate(key, 'messages', 'RecordLock')
                .replace('{fields}', fieldLabels);

            Espo.Ui.notify(message, 'info', 8000, {closeButton: true});
        }

        /**
         * @private
         */
        lock() {
            const view = this.view;

            view.manageAccess();

            view.getFieldList().forEach(field => {
                if (view.recordHelper && view.recordHelper.getFieldStateParam(field, 'readOnly')) {
                    return;
                }

                this.lockedFieldMap[field] = true;

                view.setFieldReadOnly(field);
            });

            this.refreshPanelActions(true);
        }

        /**
         * @private
         */
        unlock() {
            const view = this.view;

            view.manageAccess();

            Object.keys(this.lockedFieldMap).forEach(field => {
                delete this.lockedFieldMap[field];

                view.setFieldNotReadOnly(field);
            });

            // Fields rendered read-only because the record was locked on load.
            if (typeof view.setNotReadOnly === 'function') {
                view.setNotReadOnly(true);
            }
        }

        /**
         * Re-apply access to relationship panel actions (Select, Create, Unlink).
         *
         * @private
         * @param {boolean} readOnly
         */
        refreshPanelActions(readOnly) {
            [this.view.getBottomView(), this.view.getSideView()].forEach(panelsView => {
                if (!panelsView || typeof panelsView.setNotReadOnly !== 'function') {
                    return;
                }

                panelsView.setNotReadOnly(true);

                if (readOnly && typeof panelsView.setReadOnly === 'function') {
                    panelsView.setReadOnly();
                }
            });
        }
    }

    return RecordLockDetailViewSetup;
});
