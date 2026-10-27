/*
 * Record Lock extension for EspoCRM.
 *
 * "Icon in kanban": shows a lock in the bottom right corner of the Kanban
 * card of a locked record. Enabled per entity on the Record Lock page.
 */
define(
    'record-lock:kanban-patch',
    ['views/record/kanban-item', 'record-lock:lock-helper'],
    function (KanbanItemView, Helper) {

    const FLAG = '__recordLockKanbanInstalled';
    const PARAM = 'recordLockKanbanIcon';
    const ICON_CLASS = 'record-lock-kanban-icon';

    const isEnabled = (metadata, entityType) => {
        if (!metadata.get(['clientDefs', entityType, PARAM])) {
            return false;
        }

        const fields = metadata.get(['entityDefs', entityType, 'fields']) || {};

        return Object.keys(fields).some(name => {
            const defs = fields[name] || {};

            return defs.type === 'bool' && defs.recordLock && !defs.notStorable;
        });
    };

    /**
     * Adds, shows or hides the icon. It floats right in the card's last row,
     * so card content wraps around it instead of being covered.
     */
    const apply = view => {
        const root = view.element || (view.$el && view.$el[0]);
        const body = root ? root.querySelector('.panel-body') : null;

        if (!body) {
            return;
        }

        const isLocked = Helper.isLocked(view.model);
        let icon = body.querySelector('.' + ICON_CLASS);

        if (isLocked && !icon) {
            const title = view.translate('indicatorTitle', 'messages', 'RecordLock');

            icon = document.createElement('span');
            icon.className = 'fas fa-lock pull-right ' + ICON_CLASS;
            icon.title = title;
            icon.setAttribute('aria-label', title);
            icon.style.opacity = '0.7';
            icon.style.marginLeft = '6px';

            const rows = body.querySelectorAll(':scope > div');
            const lastRow = rows.length ? rows[rows.length - 1] : body;

            lastRow.prepend(icon);
        }

        if (icon) {
            icon.classList.toggle('hidden', !isLocked);
        }
    };

    return {
        /**
         * @return {boolean} True if installed by this call.
         */
        install() {
            const proto = KanbanItemView && KanbanItemView.prototype;

            if (!proto || typeof proto.setup !== 'function' || proto[FLAG]) {
                return false;
            }

            const originalSetup = proto.setup;
            const originalAfterRender = proto.afterRender;

            proto.setup = function () {
                const result = originalSetup.apply(this, arguments);

                if (this.model && this.model.entityType && isEnabled(this.getMetadata(), this.model.entityType)) {
                    this.recordLockKanbanIcon = true;

                    const update = () => {
                        Helper.capture(this.model);

                        if (this.isRendered()) {
                            apply(this);
                        }
                    };

                    this.listenTo(this.model, 'sync', update);

                    this.listenTo(this.model, 'change', (m, options) => {
                        if (options && options.sync) {
                            update();
                        }
                    });
                }

                return result;
            };

            proto.afterRender = function () {
                const result = typeof originalAfterRender === 'function' ?
                    originalAfterRender.apply(this, arguments) : undefined;

                if (this.recordLockKanbanIcon) {
                    try {
                        apply(this);
                    } catch (e) {
                        console.error('Record Lock:', e);
                    }
                }

                return result;
            };

            proto[FLAG] = true;

            return true;
        },
    };
});
