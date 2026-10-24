<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Tools\RecordLock;

use Espo\Core\DataManager;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Utils\Metadata;

/**
 * Turns a Boolean field into a lock field (or back). The parameters are the
 * same ones Entity Manager > Fields saves, so both places stay in sync.
 */
class LockConfigService
{
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

        $this->metadata->save();

        $this->dataManager->clearCache();
        $this->dataManager->rebuildMetadata();
    }
}
