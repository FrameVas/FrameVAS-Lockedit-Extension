<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Tools\RecordLock;

use Espo\Core\Acl\Table;
use Espo\Core\AclManager;
use Espo\Entities\User;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Decides whether a record is locked and whether a user may bypass the lock.
 *
 * The lock state is always taken from the stored (fetched) values, never from
 * unsaved input. This way a user cannot unlock a record by sending the lock
 * field as false in the same request, and a user may lock a record that is
 * currently not locked.
 */
class LockGuard
{
    public const PERMISSION = 'recordLockPermission';

    public function __construct(
        private LockFieldProvider $fieldProvider,
        private EntityManager $entityManager,
    ) {}

    /**
     * Whether a user is not allowed to edit a record because of a lock.
     */
    public function isEditBlocked(User $user, Entity $entity, AclManager $aclManager): bool
    {
        if ($this->getActiveLockFields($entity) === []) {
            return false;
        }

        return !$this->canOverride($user, $aclManager);
    }

    /**
     * Whether a user is not allowed to remove a record because of a lock.
     */
    public function isRemoveBlocked(User $user, Entity $entity, AclManager $aclManager): bool
    {
        $activeFields = $this->getActiveLockFields($entity);

        if ($activeFields === []) {
            return false;
        }

        $fieldMap = $this->fieldProvider->getFields($entity->getEntityType());

        $removalAllowed = true;

        foreach ($activeFields as $field) {
            if (!($fieldMap[$field] ?? false)) {
                $removalAllowed = false;

                break;
            }
        }

        if ($removalAllowed) {
            return false;
        }

        return !$this->canOverride($user, $aclManager);
    }

    /**
     * Whether a user may edit locked records. Administrators always can.
     */
    public function canOverride(User $user, AclManager $aclManager): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $aclManager->getPermissionLevel($user, self::PERMISSION) === Table::LEVEL_YES;
    }

    /**
     * Whether a record is locked (by stored values).
     */
    public function isLocked(Entity $entity): bool
    {
        return $this->getActiveLockFields($entity) !== [];
    }

    /**
     * Get lock fields that are currently enabled in the stored record.
     *
     * @return string[]
     */
    public function getActiveLockFields(Entity $entity): array
    {
        if ($entity->isNew()) {
            return [];
        }

        $fieldMap = $this->fieldProvider->getFields($entity->getEntityType());

        if ($fieldMap === []) {
            return [];
        }

        $active = [];
        $notFetched = [];

        foreach (array_keys($fieldMap) as $field) {
            if (!$entity->hasAttribute($field)) {
                continue;
            }

            if ($entity->hasFetched($field)) {
                if ($entity->getFetched($field)) {
                    $active[] = $field;
                }

                continue;
            }

            $notFetched[] = $field;
        }

        if ($notFetched !== []) {
            foreach ($this->loadStoredValues($entity, $notFetched) as $field => $value) {
                if ($value) {
                    $active[] = $field;
                }
            }
        }

        return $active;
    }

    /**
     * @param string[] $fields
     * @return array<string, mixed>
     */
    private function loadStoredValues(Entity $entity, array $fields): array
    {
        if (!$entity->hasId()) {
            return [];
        }

        $stored = $this->entityManager
            ->getRDBRepository($entity->getEntityType())
            ->select(['id', ...$fields])
            ->where(['id' => $entity->getId()])
            ->findOne();

        if (!$stored) {
            return [];
        }

        $result = [];

        foreach ($fields as $field) {
            $result[$field] = $stored->get($field);
        }

        return $result;
    }
}
