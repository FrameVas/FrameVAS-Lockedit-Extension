/*
 * Record Lock extension for EspoCRM.
 *
 * Loaded at application start (metadata app > client > scriptList). Installs
 * the lock-aware access check before any record view is rendered, so every
 * place that asks "can this user edit/remove this record?" respects the lock.
 */
(function () {
    'use strict';

    var loader = window.Espo && window.Espo.loader;

    var requireFn = loader && typeof loader.require === 'function' ?
        loader.require.bind(loader) :
        window.require;

    if (typeof requireFn !== 'function') {
        return;
    }

    requireFn('record-lock:acl-patch', function (AclPatch) {
        AclPatch.install();
    });
})();
