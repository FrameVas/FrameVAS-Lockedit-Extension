<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Tools\RecordLock;

use Espo\Core\DataManager;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Utils\Metadata;

/**
 * Settings changed from Administration > Record Lock: lock fields (the same
 * parameters Entity Manager > Fields saves) and entity-wide options.
 */
class LockConfigService
{
    /** Stored in clientDefs, read by the list views. */
    public const PARAM_LIST_ICON = 'recordLockListIcon';

    public function __construct(
        private Metadata $metadata,
        private DataManager $dataManager,
        private LockFieldProvider $lockFieldProvider,
    ) {}

    /**
     * @throws BadRequest
     */
    public function setField(string $entityType, string $field, bool $enabled, bool $allowRemoval): void
    {
        if (!$this->metadata->get(['scopes', $entityType, 'entity'])) {
            throw new BadRequest("Entity type '$entityType' does not exist.");
        }

        if (!$this->lockFieldProvider->isEligibleField($entityType, $field)) {
            throw new BadRequest("Field '$field' of '$entityType' is not a storable Boolean field.");
        }

        $this->metadata->set('entityDefs', $entityType, [
            'fields' => [
                $field => [
                    LockFieldProvider::PARAM_LOCK => $enabled,
                    LockFieldProvider::PARAM_ALLOW_REMOVAL => $enabled && $allowRemoval,
                ],
            ],
        ]);

        $this->saveAndRefresh();
    }

    /**
     * Entity-wide settings shown on the Record Lock page. A null value leaves
     * the setting unchanged.
     *
     * @throws BadRequest
     */
    public function setEntityOptions(string $entityType, ?bool $listIcon, ?bool $lockStream): void
    {
        if (!$this->metadata->get(['scopes', $entityType, 'entity'])) {
            throw new BadRequest("Entity type '$entityType' does not exist.");
        }

        if ($listIcon === null && $lockStream === null) {
            throw new BadRequest("Nothing to change.");
        }

        if ($listIcon !== null) {
            $this->metadata->set('clientDefs', $entityType, [self::PARAM_LIST_ICON => $listIcon]);
        }

        if ($lockStream !== null) {
            $this->metadata->set('scopes', $entityType, [StreamLockChecker::PARAM => $lockStream]);
        }

        $this->saveAndRefresh();
    }

    private function saveAndRefresh(): void
    {
        $this->metadata->save();

        $this->dataManager->clearCache();
        $this->dataManager->rebuildMetadata();
    }
}
