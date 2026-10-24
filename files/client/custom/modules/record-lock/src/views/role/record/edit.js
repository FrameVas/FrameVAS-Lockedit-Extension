/*
 * Record Lock extension for EspoCRM.
 */
define(
    'record-lock:views/role/record/edit',
    ['views/role/record/edit', 'record-lock:role-layout'],
    function (Dep, RoleLayout) {

    return class extends Dep {

        // Required since EspoCRM 10 for modifyDetailLayout to be called; ignored by 9.
        hasModifyDetailLayout = true

        modifyDetailLayout(layout) {
            if (typeof super.modifyDetailLayout === 'function') {
                super.modifyDetailLayout(layout);
            }

            RoleLayout.modify(layout);
        }
    };
});
