<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Acl;

use Espo\Core\Acl\AccessChecker;
use Espo\Core\InjectableFactory;
use Espo\Core\Portal\Acl\AccessChecker\AccessCheckerFactory as PortalAccessCheckerFactory;
use Espo\Core\Portal\AclManager as PortalAclManager;
use Espo\Core\Utils\Metadata;
use Espo\Modules\RecordLock\Tools\RecordLock\LockFieldProvider;
use Espo\Modules\RecordLock\Tools\RecordLock\LockGuard;

/**
 * Portal counterpart of LockAwareAccessCheckerFactory. Portal users get the
 * override permission from their portal roles.
 */
class LockAwarePortalAccessCheckerFactory extends PortalAccessCheckerFactory
{
    public function __construct(
        Metadata $metadata,
        InjectableFactory $injectableFactory,
        private LockFieldProvider $lockFieldProvider,
        private LockGuard $lockGuard,
    ) {
        parent::__construct($metadata, $injectableFactory);
    }

    public function create(string $scope, PortalAclManager $aclManager): AccessChecker
    {
        $checker = parent::create($scope, $aclManager);

        if (!$this->lockFieldProvider->hasFields($scope)) {
            return $checker;
        }

        return new LockAwareAccessChecker($checker, $this->lockGuard, $aclManager, $scope);
    }
}
