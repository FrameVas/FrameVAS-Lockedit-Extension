<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Acl;

use Espo\Core\Acl\AccessChecker;
use Espo\Core\Acl\AccessCreateChecker;
use Espo\Core\Acl\AccessDeleteChecker;
use Espo\Core\Acl\AccessEditChecker;
use Espo\Core\Acl\AccessEntityCreateChecker;
use Espo\Core\Acl\AccessEntityCREDSChecker;
use Espo\Core\Acl\AccessEntityDeleteChecker;
use Espo\Core\Acl\AccessEntityEditChecker;
use Espo\Core\Acl\AccessEntityReadChecker;
use Espo\Core\Acl\AccessEntityStreamChecker;
use Espo\Core\Acl\AccessReadChecker;
use Espo\Core\Acl\AccessStreamChecker;
use Espo\Core\Acl\Exceptions\NotImplemented;
use Espo\Core\Acl\ScopeData;
use Espo\Core\Acl\Table;
use Espo\Core\AclManager;
use Espo\Entities\User;
use Espo\Modules\RecordLock\Tools\RecordLock\LockGuard;
use Espo\ORM\Entity;

/**
 * Wraps the access checker of an entity type and adds the record lock rule
 * to the entity-level 'edit' and 'delete' checks.
 *
 * Every other check is delegated to the wrapped checker unchanged. When the
 * wrapped checker does not support a check, the same NotImplemented outcome
 * the AclManager would produce is reproduced, so the behavior for the
 * original checker is preserved.
 */
class LockAwareAccessChecker implements AccessEntityCREDSChecker
{
    public function __construct(
        private AccessChecker $inner,
        private LockGuard $guard,
        private AclManager $aclManager,
        private string $scope,
    ) {}

    public function getInner(): AccessChecker
    {
        return $this->inner;
    }

    public function check(User $user, ScopeData $data): bool
    {
        return $this->inner->check($user, $data);
    }

    public function checkCreate(User $user, ScopeData $data): bool
    {
        return $this->delegateScope(Table::ACTION_CREATE, AccessCreateChecker::class, $user, $data);
    }

    public function checkRead(User $user, ScopeData $data): bool
    {
        return $this->delegateScope(Table::ACTION_READ, AccessReadChecker::class, $user, $data);
    }

    public function checkEdit(User $user, ScopeData $data): bool
    {
        return $this->delegateScope(Table::ACTION_EDIT, AccessEditChecker::class, $user, $data);
    }

    public function checkDelete(User $user, ScopeData $data): bool
    {
        return $this->delegateScope(Table::ACTION_DELETE, AccessDeleteChecker::class, $user, $data);
    }

    public function checkStream(User $user, ScopeData $data): bool
    {
        return $this->delegateScope(Table::ACTION_STREAM, AccessStreamChecker::class, $user, $data);
    }

    public function checkEntityCreate(User $user, Entity $entity, ScopeData $data): bool
    {
        if (!$this->inner instanceof AccessEntityCreateChecker) {
            throw $this->notImplemented(Table::ACTION_CREATE);
        }

        return $this->inner->checkEntityCreate($user, $entity, $data);
    }

    public function checkEntityRead(User $user, Entity $entity, ScopeData $data): bool
    {
        if (!$this->inner instanceof AccessEntityReadChecker) {
            throw $this->notImplemented(Table::ACTION_READ);
        }

        return $this->inner->checkEntityRead($user, $entity, $data);
    }

    public function checkEntityStream(User $user, Entity $entity, ScopeData $data): bool
    {
        if (!$this->inner instanceof AccessEntityStreamChecker) {
            throw $this->notImplemented(Table::ACTION_STREAM);
        }

        return $this->inner->checkEntityStream($user, $entity, $data);
    }

    public function checkEntityEdit(User $user, Entity $entity, ScopeData $data): bool
    {
        if (!$this->inner instanceof AccessEntityEditChecker) {
            throw $this->notImplemented(Table::ACTION_EDIT);
        }

        if (!$this->inner->checkEntityEdit($user, $entity, $data)) {
            return false;
        }

        return !$this->guard->isEditBlocked($user, $entity, $this->aclManager);
    }

    public function checkEntityDelete(User $user, Entity $entity, ScopeData $data): bool
    {
        if (!$this->inner instanceof AccessEntityDeleteChecker) {
            throw $this->notImplemented(Table::ACTION_DELETE);
        }

        if (!$this->inner->checkEntityDelete($user, $entity, $data)) {
            return false;
        }

        return !$this->guard->isRemoveBlocked($user, $entity, $this->aclManager);
    }

    /**
     * Mirrors AclManager::checkScope for an inner checker.
     *
     * @param class-string $interface
     * @throws NotImplemented
     */
    private function delegateScope(string $action, string $interface, User $user, ScopeData $data): bool
    {
        if ($this->inner instanceof $interface) {
            $methodName = 'check' . ucfirst($action);

            return $this->inner->$methodName($user, $data);
        }

        // Backward compatibility path of AclManager::checkScope.
        if (method_exists($this->inner, 'checkScope')) {
            return $this->inner->checkScope($user, $data, $action);
        }

        throw new NotImplemented("No access checker for '$this->scope' action '$action'.");
    }

    private function notImplemented(string $action): NotImplemented
    {
        return new NotImplemented("No entity access checker for '$this->scope' action '$action'.");
    }
}
