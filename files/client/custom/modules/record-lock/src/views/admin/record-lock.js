/*
 * Record Lock extension for EspoCRM.
 *
 * Administration > Record Lock. Lists lock fields of all entities and lets an
 * administrator add, change or turn off a lock field. The same settings are
 * also available in Entity Manager > Fields (Boolean fields).
 */
define('record-lock:views/admin/record-lock', ['view'], function (View) {

    return class extends View {

        templateContent = `
            <div class="page-header">
                <h3>
                    <a href="#Admin">{{translate 'Administration'}}</a>
                    <span class="breadcrumb-separator"><span></span></span>
                    {{translate 'Record Lock' scope='Admin'}}
                </h3>
            </div>

            <div class="record-lock-admin">
                <p>{{translate 'adminIntro' category='messages' scope='RecordLock'}}</p>

                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title">{{translate 'Lock fields' scope='RecordLock'}}</h4>
                    </div>
                    <div class="panel-body">
                        {{#if groupList.length}}
                        <div class="table-responsive">
                        <table class="table record-lock-table">
                            <thead>
                                <tr>
                                    <th>{{translate 'Entity' scope='RecordLock'}}</th>
                                    <th style="width: 12%;" title="{{listIconHelp}}">
                                        {{translate 'Icon in lists' scope='RecordLock'}}
                                    </th>
                                    <th style="width: 12%;" title="{{kanbanIconHelp}}">
                                        {{translate 'Icon in kanban' scope='RecordLock'}}
                                    </th>
                                    <th style="width: 12%;" title="{{lockStreamHelp}}">
                                        {{translate 'Lock stream' scope='RecordLock'}}
                                    </th>
                                    <th>{{translate 'Field' scope='RecordLock'}}</th>
                                    <th>{{translate 'Removal while locked' scope='RecordLock'}}</th>
                                    <th style="width: 1%;"></th>
                                </tr>
                            </thead>
                            <tbody>
                            {{#each groupList}}
                                {{#each fieldList}}
                                <tr data-entity-type="{{../entityType}}" data-field="{{field}}">
                                    {{#if @first}}
                                    <td rowspan="{{../rowCount}}">
                                        <a href="#Admin/entityManager/scope={{../entityType}}">{{../entityLabel}}</a>
                                    </td>
                                    <td rowspan="{{../rowCount}}">
                                        <input
                                            type="checkbox"
                                            class="form-checkbox"
                                            data-name="listIcon"
                                            data-entity-type="{{../entityType}}"
                                            aria-label="{{../listIconLabel}}"
                                            {{#if ../listIcon}}checked{{/if}}
                                        >
                                    </td>
                                    <td rowspan="{{../rowCount}}">
                                        {{#if ../hasKanban}}
                                        <input
                                            type="checkbox"
                                            class="form-checkbox"
                                            data-name="kanbanIcon"
                                            data-entity-type="{{../entityType}}"
                                            aria-label="{{../kanbanIconLabel}}"
                                            {{#if ../kanbanIcon}}checked{{/if}}
                                        >
                                        {{else}}
                                        <span class="text-muted" title="{{../noKanbanText}}">&mdash;</span>
                                        {{/if}}
                                    </td>
                                    <td rowspan="{{../rowCount}}">
                                        {{#if ../hasStream}}
                                        <input
                                            type="checkbox"
                                            class="form-checkbox"
                                            data-name="lockStream"
                                            data-entity-type="{{../entityType}}"
                                            aria-label="{{../lockStreamLabel}}"
                                            {{#if ../lockStream}}checked{{/if}}
                                        >
                                        {{else}}
                                        <span class="text-muted" title="{{../noStreamText}}">&mdash;</span>
                                        {{/if}}
                                    </td>
                                    {{/if}}
                                    <td>
                                        <a
                                            href="#Admin/fieldManager/scope={{../entityType}}&field={{field}}"
                                        >{{fieldLabel}}</a>
                                    </td>
                                    <td>
                                        {{#if allowRemoval}}
                                            {{translate 'Allowed' scope='RecordLock'}}
                                        {{else}}
                                            {{translate 'Blocked' scope='RecordLock'}}
                                        {{/if}}
                                    </td>
                                    <td style="white-space: nowrap;">
                                        <button
                                            type="button"
                                            class="btn btn-default btn-sm"
                                            data-action="toggleRemoval"
                                            data-entity-type="{{../entityType}}"
                                            data-field="{{field}}"
                                        >{{#if allowRemoval}}{{translate 'Block removal' scope='RecordLock'}}{{else}}{{translate 'Allow removal' scope='RecordLock'}}{{/if}}</button>
                                        <button
                                            type="button"
                                            class="btn btn-default btn-sm"
                                            data-action="turnOff"
                                            data-entity-type="{{../entityType}}"
                                            data-field="{{field}}"
                                        >{{translate 'Turn off' scope='RecordLock'}}</button>
                                    </td>
                                </tr>
                                {{/each}}
                            {{/each}}
                            </tbody>
                        </table>
                        </div>
                        <p class="text-muted small" style="margin-bottom: 0;">
                            {{listIconHelp}}<br>
                            {{kanbanIconHelp}}<br>
                            {{lockStreamHelp}}<br>
                            {{translate 'entityOptionsNote' category='messages' scope='RecordLock'}}
                        </p>
                        {{else}}
                        <p class="text-muted">{{translate 'noLockFields' category='messages' scope='RecordLock'}}</p>
                        {{/if}}
                    </div>
                </div>

                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title">{{translate 'Add a lock field' scope='RecordLock'}}</h4>
                    </div>
                    <div class="panel-body">
                        {{#if entityOptionList.length}}
                        <div class="row">
                            <div class="cell form-group col-sm-4">
                                <label class="control-label" for="record-lock-entity">{{translate 'Entity' scope='RecordLock'}}</label>
                                <select id="record-lock-entity" class="form-control" data-name="entityType">
                                    {{#each entityOptionList}}
                                    <option value="{{value}}">{{label}}</option>
                                    {{/each}}
                                </select>
                            </div>
                            <div class="cell form-group col-sm-4">
                                <label class="control-label" for="record-lock-field">{{translate 'Field' scope='RecordLock'}}</label>
                                <select id="record-lock-field" class="form-control" data-name="field"></select>
                            </div>
                            <div class="cell form-group col-sm-4">
                                <label class="control-label">&nbsp;</label>
                                <div class="checkbox" style="margin-top: 6px;">
                                    <label>
                                        <input type="checkbox" data-name="allowRemoval">
                                        {{translate 'Allow removal when locked' scope='RecordLock'}}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary" data-action="addLock">{{translate 'Add lock field' scope='RecordLock'}}</button>
                        {{else}}
                        <p class="text-muted">{{translate 'noEligibleFields' category='messages' scope='RecordLock'}}</p>
                        {{/if}}
                    </div>
                </div>

                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title">{{translate 'Who can edit locked records' scope='RecordLock'}}</h4>
                    </div>
                    <div class="panel-body">
                        <p>{{translate 'whoCanEdit' category='messages' scope='RecordLock'}}</p>
                        <a href="#Role" class="btn btn-default">{{translate 'Role' category='scopeNamesPlural'}}</a>
                        <a href="#PortalRole" class="btn btn-default">{{translate 'PortalRole' category='scopeNamesPlural'}}</a>
                    </div>
                </div>
            </div>
        `

        setup() {
            this.addActionHandler('addLock', () => this.actionAddLock());
            this.addActionHandler('toggleRemoval', (e, target) => this.actionToggleRemoval(target));
            this.addActionHandler('turnOff', (e, target) => this.actionTurnOff(target));

            this.events['change input[data-name="listIcon"]'] = e =>
                this.saveEntityOption(e.currentTarget.dataset.entityType, 'listIcon', e.currentTarget.checked);

            this.events['change input[data-name="kanbanIcon"]'] = e =>
                this.saveEntityOption(e.currentTarget.dataset.entityType, 'kanbanIcon', e.currentTarget.checked);

            this.events['change input[data-name="lockStream"]'] = e =>
                this.saveEntityOption(e.currentTarget.dataset.entityType, 'lockStream', e.currentTarget.checked);
        }

        data() {
            return {
                groupList: this.getGroupList(),
                listIconHelp: this.translate('listIconHelp', 'messages', 'RecordLock'),
                kanbanIconHelp: this.translate('kanbanIconHelp', 'messages', 'RecordLock'),
                lockStreamHelp: this.translate('lockStreamHelp', 'messages', 'RecordLock'),
                entityOptionList: this.getEntityTypeList().map(entityType => ({
                    value: entityType,
                    label: this.translate(entityType, 'scopeNames'),
                })),
            };
        }

        afterRender() {
            const entitySelect = this.element.querySelector('select[data-name="entityType"]');

            if (!entitySelect) {
                return;
            }

            entitySelect.addEventListener('change', () => this.fillFieldOptions());

            this.fillFieldOptions();
        }

        /**
         * @private
         */
        fillFieldOptions() {
            const entityType = this.element.querySelector('select[data-name="entityType"]').value;
            const fieldSelect = this.element.querySelector('select[data-name="field"]');

            fieldSelect.innerHTML = '';

            this.getAvailableFieldList(entityType).forEach(field => {
                const option = document.createElement('option');

                option.value = field;
                option.textContent = this.translate(field, 'fields', entityType);

                fieldSelect.appendChild(option);
            });
        }

        /**
         * Entity types that are listed in Entity Manager.
         *
         * @private
         * @return {string[]}
         */
        getManagedEntityTypeList() {
            const scopes = this.getMetadata().get('scopes') || {};

            return Object.keys(scopes)
                .filter(scope => {
                    const defs = scopes[scope] || {};

                    return defs.entity && (defs.customizable || defs.object) && !defs.disabled;
                });
        }

        /**
         * @private
         * @param {string} entityType
         * @param {boolean} lockOnly
         * @return {string[]}
         */
        getBoolFieldList(entityType, lockOnly) {
            const fields = this.getMetadata().get(['entityDefs', entityType, 'fields']) || {};

            return Object.keys(fields)
                .filter(field => {
                    const defs = fields[field] || {};

                    if (defs.type !== 'bool' || defs.notStorable || defs.disabled) {
                        return false;
                    }

                    return lockOnly ? !!defs.recordLock : !defs.recordLock;
                })
                .sort((a, b) =>
                    this.translate(a, 'fields', entityType)
                        .localeCompare(this.translate(b, 'fields', entityType))
                );
        }

        /**
         * @private
         * @param {string} entityType
         * @return {string[]}
         */
        getAvailableFieldList(entityType) {
            // 'isLocked' is reserved for the native lock of EspoCRM 10+.
            return this.getBoolFieldList(entityType, false).filter(field => field !== 'isLocked');
        }

        /**
         * @private
         * @return {string[]}
         */
        getEntityTypeList() {
            return this.getManagedEntityTypeList()
                .filter(entityType => this.getAvailableFieldList(entityType).length > 0)
                .sort((a, b) => this.translate(a, 'scopeNames').localeCompare(this.translate(b, 'scopeNames')));
        }

        /**
         * @private
         */
        getItemList() {
            const scopes = this.getMetadata().get('scopes') || {};
            const list = [];

            Object.keys(scopes)
                .filter(scope => scopes[scope] && scopes[scope].entity)
                .forEach(entityType => {
                    this.getBoolFieldList(entityType, true).forEach(field => {
                        list.push({
                            entityType: entityType,
                            field: field,
                            entityLabel: this.translate(entityType, 'scopeNames'),
                            fieldLabel: this.translate(field, 'fields', entityType),
                            allowRemoval: !!this.getMetadata()
                                .get(['entityDefs', entityType, 'fields', field, 'recordLockAllowRemoval']),
                        });
                    });
                });

            return list.sort((a, b) =>
                a.entityLabel.localeCompare(b.entityLabel) || a.fieldLabel.localeCompare(b.fieldLabel)
            );
        }

        /**
         * Lock fields grouped by entity, with the entity-wide settings.
         *
         * @private
         */
        getGroupList() {
            const groupMap = {};
            const groupList = [];

            this.getItemList().forEach(item => {
                let group = groupMap[item.entityType];

                if (!group) {
                    const entityType = item.entityType;

                    group = groupMap[entityType] = {
                        entityType: entityType,
                        entityLabel: item.entityLabel,
                        listIcon: !!this.getMetadata().get(['clientDefs', entityType, 'recordLockListIcon']),
                        kanbanIcon: !!this.getMetadata().get(['clientDefs', entityType, 'recordLockKanbanIcon']),
                        hasKanban: !!this.getMetadata().get(['clientDefs', entityType, 'kanbanViewMode']),
                        lockStream: !!this.getMetadata().get(['scopes', entityType, 'recordLockStream']),
                        hasStream: !!this.getMetadata().get(['scopes', entityType, 'stream']),
                        listIconLabel: this.translate('Icon in lists', 'labels', 'RecordLock') + ': ' + item.entityLabel,
                        lockStreamLabel: this.translate('Lock stream', 'labels', 'RecordLock') + ': ' + item.entityLabel,
                        kanbanIconLabel: this.translate('Icon in kanban', 'labels', 'RecordLock') + ': ' + item.entityLabel,
                        noKanbanText: this.translate('noKanban', 'messages', 'RecordLock'),
                        noStreamText: this.translate('noStream', 'messages', 'RecordLock'),
                        fieldList: [],
                    };

                    groupList.push(group);
                }

                group.fieldList.push(item);
            });

            groupList.forEach(group => group.rowCount = group.fieldList.length);

            return groupList;
        }

        /**
         * @private
         * @param {string} entityType
         * @param {'listIcon'|'kanbanIcon'|'lockStream'} option
         * @param {boolean} value
         */
        saveEntityOption(entityType, option, value) {
            this.request('RecordLock/action/setEntityOptions', {
                entityType: entityType,
                [option]: value,
            }, 'entityOptionsUpdated');
        }

        /**
         * @private
         */
        actionAddLock() {
            const entityType = this.element.querySelector('select[data-name="entityType"]').value;
            const field = this.element.querySelector('select[data-name="field"]').value;
            const allowRemoval = this.element.querySelector('input[data-name="allowRemoval"]').checked;

            if (!entityType || !field) {
                return;
            }

            this.save(entityType, field, true, allowRemoval, 'lockFieldAdded');
        }

        /**
         * @private
         * @param {HTMLElement} target
         */
        actionToggleRemoval(target) {
            const entityType = target.dataset.entityType;
            const field = target.dataset.field;

            const allowRemoval = !!this.getMetadata()
                .get(['entityDefs', entityType, 'fields', field, 'recordLockAllowRemoval']);

            this.save(entityType, field, true, !allowRemoval, 'lockFieldUpdated');
        }

        /**
         * @private
         * @param {HTMLElement} target
         */
        actionTurnOff(target) {
            const entityType = target.dataset.entityType;
            const field = target.dataset.field;

            const message = this.translate('confirmTurnOff', 'messages', 'RecordLock')
                .replace('{field}', this.translate(field, 'fields', entityType))
                .replace('{entity}', this.translate(entityType, 'scopeNames'));

            this.confirm(message, () => {
                this.save(entityType, field, false, false, 'lockFieldTurnedOff');
            });
        }

        /**
         * @private
         */
        save(entityType, field, enabled, allowRemoval, successMessage) {
            this.request('RecordLock/action/setField', {
                entityType: entityType,
                field: field,
                enabled: enabled,
                allowRemoval: allowRemoval,
            }, successMessage);
        }

        /**
         * @private
         * @param {string} url
         * @param {Object} payload
         * @param {string} successMessage
         */
        request(url, payload, successMessage) {
            Espo.Ui.notify(' ... ');

            const controls = this.element.querySelectorAll('button, input[type="checkbox"]');

            controls.forEach(control => control.setAttribute('disabled', 'disabled'));

            Espo.Ajax
                .postRequest(url, payload)
                .then(() => this.getMetadata().loadSkipCache())
                .then(() => {
                    const broadcastChannel = this.getHelper().broadcastChannel;

                    if (broadcastChannel) {
                        broadcastChannel.postMessage('update:metadata');
                    }

                    Espo.Ui.success(this.translate(successMessage, 'messages', 'RecordLock'));

                    return this.reRender();
                })
                .catch(() => this.reRender());
        }
    };
});
