/*
 * Record Lock extension for EspoCRM.
 *
 * Optional stream lock ("Lock Stream of Locked Records" in Entity Manager).
 * For users who may not edit a locked record, hides the comment box of its
 * stream panel and shows a short notice instead. The server enforces the
 * same rule.
 */
define(
    'record-lock:stream-patch',
    ['views/stream/panel', 'record-lock:lock-helper'],
    function (StreamPanelView, Helper) {

    const FLAG = '__recordLockStreamInstalled';
    const PARAM = 'recordLockStream';

    const isEnabled = (metadata, entityType) => {
        if (!metadata.get(['scopes', entityType, PARAM])) {
            return false;
        }

        const fields = metadata.get(['entityDefs', entityType, 'fields']) || {};

        return Object.keys(fields).some(name => {
            const defs = fields[name] || {};

            return defs.type === 'bool' && defs.recordLock && !defs.notStorable;
        });
    };

    const apply = panel => {
        const root = panel.element || (panel.$el && panel.$el[0]);

        if (!root) {
            return;
        }

        const isBlocked = Helper.isEditBlocked(panel.getAcl(), panel.model);
        const postContainer = root.querySelector('.post-container');

        if (postContainer) {
            postContainer.classList.toggle('hidden', isBlocked || !!panel.postDisabled);
        }

        let notice = root.querySelector('.record-lock-stream-notice');

        if (isBlocked && !notice) {
            notice = document.createElement('div');
            notice.className = 'form-group text-muted record-lock-stream-notice';
            notice.innerHTML = '<span class="fas fa-lock"></span> ' + Handlebars.Utils.escapeExpression(
                panel.translate('streamLockedNotice', 'messages', 'RecordLock')
            );

            postContainer ? postContainer.before(notice) : root.prepend(notice);
        }

        if (notice) {
            notice.classList.toggle('hidden', !isBlocked);
        }
    };

    return {
        /**
         * @return {boolean} True if installed by this call.
         */
        install() {
            const proto = StreamPanelView && StreamPanelView.prototype;

            if (!proto || typeof proto.setup !== 'function' || proto[FLAG]) {
                return false;
            }

            const originalSetup = proto.setup;
            const originalAfterRender = proto.afterRender;
            const originalQuoteReply = proto.quoteReply;

            proto.setup = function () {
                const result = originalSetup.apply(this, arguments);

                const model = this.model;

                if (model && model.entityType && model.id && isEnabled(this.getMetadata(), model.entityType)) {
                    this.recordLockStream = true;

                    Helper.registerStreamParent(model);

                    this.listenTo(model, 'sync', () => {
                        Helper.capture(model);
                        apply(this);
                    });
                }

                return result;
            };

            proto.afterRender = function () {
                const result = typeof originalAfterRender === 'function' ?
                    originalAfterRender.apply(this, arguments) : undefined;

                if (this.recordLockStream) {
                    try {
                        apply(this);
                    } catch (e) {
                        console.error('Record Lock:', e);
                    }
                }

                return result;
            };

            // "Quote Reply" on a post would write into the hidden comment box.
            if (typeof originalQuoteReply === 'function') {
                proto.quoteReply = function () {
                    if (this.recordLockStream && Helper.isEditBlocked(this.getAcl(), this.model)) {
                        Espo.Ui.warning(this.translate('streamLocked', 'messages', 'RecordLock'));

                        return;
                    }

                    return originalQuoteReply.apply(this, arguments);
                };
            }

            proto[FLAG] = true;

            return true;
        },
    };
});
