<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Acl;

use Espo\Core\Acl\AccessChecker;
use Espo\Core\Acl\AccessChecker\AccessCheckerFactory;
use Espo\Core\AclManager;
use Espo\Core\InjectableFactory;
use Espo\Core\Utils\Metadata;
use Espo\Modules\RecordLock\Tools\RecordLock\LockFieldProvider;
use Espo\Modules\RecordLock\Tools\RecordLock\LockGuard;

/**
 * Creates access checkers as the core factory does, wrapping them with the
 * record lock rule for entity types that have at least one lock field.
 * Entity types without lock fields get the original checker untouched.
 */
class LockAwareAccessCheckerFactory extends AccessCheckerFactory
{
    public function __construct(
        Metadata $metadata,
        InjectableFactory $injectableFactory,
        private LockFieldProvider $lockFieldProvider,
        private LockGuard $lockGuard,
    ) {
        parent::__construct($metadata, $injectableFactory);
    }

    public function create(string $scope, AclManager $aclManager): AccessChecker
    {
        $checker = parent::create($scope, $aclManager);

        if (!$this->lockFieldProvider->hasFields($scope)) {
            return $checker;
        }

        return new LockAwareAccessChecker($checker, $this->lockGuard, $aclManager, $scope);
    }
}
