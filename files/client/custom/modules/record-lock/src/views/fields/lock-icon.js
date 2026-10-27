/*
 * Record Lock extension for EspoCRM.
 *
 * List cell showing a lock icon when the record is locked.
 */
define(
    'record-lock:views/fields/lock-icon',
    ['views/fields/base', 'record-lock:lock-helper'],
    function (Dep, Helper) {

    return class extends Dep {

        listTemplateContent = `{{#if isLocked}}<div style="text-align: right;"><span
            class="fas fa-lock record-lock-list-icon"
            title="{{title}}"
            aria-label="{{title}}"
            style="opacity: 0.7;"
        ></span></div>{{/if}}`

        setup() {
            super.setup();

            this.isLockedState = Helper.isLocked(this.model);

            const update = () => {
                const isLocked = Helper.isLocked(this.model);

                if (isLocked === this.isLockedState) {
                    return;
                }

                this.isLockedState = isLocked;

                if (this.isRendered()) {
                    this.reRender();
                }
            };

            this.listenTo(this.model, 'sync', () => {
                Helper.capture(this.model);
                update();
            });

            this.listenTo(this.model, 'change', (m, options) => {
                if (options && options.sync) {
                    Helper.capture(this.model);
                    update();
                }
            });
        }

        data() {
            return {
                isLocked: Helper.isLocked(this.model),
                title: this.translate('indicatorTitle', 'messages', 'RecordLock'),
            };
        }

        getAttributeList() {
            return [];
        }

        fetch() {
            return {};
        }
    };
});
