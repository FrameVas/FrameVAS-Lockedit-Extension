<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 *
 * Provides record-level edit protection controlled by a Boolean field.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Tools\RecordLock;

use Espo\Core\Utils\Metadata;

/**
 * Resolves which Boolean fields of an entity type act as lock fields.
 *
 * A field acts as a lock field when its definition is of the `bool` type,
 * it is storable and it has the `recordLock` parameter set to true.
 * The `recordLockAllowRemoval` parameter allows removing records locked by that field.
 */
class LockFieldProvider
{
    public const PARAM_LOCK = 'recordLock';
    public const PARAM_ALLOW_REMOVAL = 'recordLockAllowRemoval';

    /**
     * Fields reserved by EspoCRM itself (the native lock of EspoCRM 10+).
     * Not offered as lock fields, to keep both mechanisms separate.
     */
    public const RESERVED_FIELD_LIST = ['isLocked'];

    /** @var array<string, array<string, bool>> */
    private array $cache = [];

    public function __construct(
        private Metadata $metadata,
    ) {}

    /**
     * Get lock fields of an entity type.
     *
     * @return array<string, bool> A field name => whether removal is allowed while locked by the field.
     */
    public function getFields(string $entityType): array
    {
        if (!array_key_exists($entityType, $this->cache)) {
            $this->cache[$entityType] = $this->load($entityType);
        }

        return $this->cache[$entityType];
    }

    public function hasFields(string $entityType): bool
    {
        return $this->getFields($entityType) !== [];
    }

    /**
     * Whether a field can serve as a lock field (a storable Boolean field).
     */
    public function isEligibleField(string $entityType, string $field): bool
    {
        if (in_array($field, self::RESERVED_FIELD_LIST, true)) {
            return false;
        }

        $defs = $this->metadata->get(['entityDefs', $entityType, 'fields', $field]);

        return is_array($defs) && $this->isEligibleDefs($defs);
    }

    /**
     * @return array<string, bool>
     */
    private function load(string $entityType): array
    {
        $fieldDefsMap = $this->metadata->get(['entityDefs', $entityType, 'fields']);

        if (!is_array($fieldDefsMap)) {
            return [];
        }

        $result = [];

        foreach ($fieldDefsMap as $field => $defs) {
            if (!is_array($defs) || !$this->isEligibleDefs($defs)) {
                continue;
            }

            if (empty($defs[self::PARAM_LOCK])) {
                continue;
            }

            $result[(string) $field] = !empty($defs[self::PARAM_ALLOW_REMOVAL]);
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $defs
     */
    private function isEligibleDefs(array $defs): bool
    {
        return ($defs['type'] ?? null) === 'bool' && empty($defs['notStorable']);
    }
}
