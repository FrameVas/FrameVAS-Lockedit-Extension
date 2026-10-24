<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock;

use Espo\Core\Acl\AccessChecker\AccessCheckerFactory;
use Espo\Core\Binding\Binder;
use Espo\Core\Binding\BindingProcessor;
use Espo\Core\Portal\Acl\AccessChecker\AccessCheckerFactory as PortalAccessCheckerFactory;
use Espo\Modules\RecordLock\Acl\LockAwareAccessCheckerFactory;
use Espo\Modules\RecordLock\Acl\LockAwarePortalAccessCheckerFactory;

/**
 * Makes the ACL use lock-aware access checker factories, so the lock is
 * enforced by every backend operation that checks edit or delete access:
 * update, inline edit, mass update, import update, merge, link/unlink, delete.
 */
class Binding implements BindingProcessor
{
    public function process(Binder $binder): void
    {
        $binder->bindImplementation(AccessCheckerFactory::class, LockAwareAccessCheckerFactory::class);
        $binder->bindImplementation(PortalAccessCheckerFactory::class, LockAwarePortalAccessCheckerFactory::class);
    }
}
