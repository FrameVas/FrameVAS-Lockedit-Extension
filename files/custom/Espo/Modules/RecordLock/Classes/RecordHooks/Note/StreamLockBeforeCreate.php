<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Classes\RecordHooks\Note;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\Hook\CreateHook;
use Espo\Core\Record\CreateParams;
use Espo\Modules\RecordLock\Tools\RecordLock\StreamLockChecker;
use Espo\ORM\Entity;

/**
 * @implements CreateHook<\Espo\Entities\Note>
 */
class StreamLockBeforeCreate implements CreateHook
{
    public function __construct(private StreamLockChecker $checker) {}

    /**
     * @throws Forbidden
     */
    public function process(Entity $entity, CreateParams $params): void
    {
        $this->checker->check($entity);
    }
}
