<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Classes\RecordHooks\Note;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\Hook\DeleteHook;
use Espo\Core\Record\DeleteParams;
use Espo\Modules\RecordLock\Tools\RecordLock\StreamLockChecker;
use Espo\ORM\Entity;

/**
 * @implements DeleteHook<\Espo\Entities\Note>
 */
class StreamLockBeforeDelete implements DeleteHook
{
    public function __construct(private StreamLockChecker $checker) {}

    /**
     * @throws Forbidden
     */
    public function process(Entity $entity, DeleteParams $params): void
    {
        $this->checker->check($entity);
    }
}
