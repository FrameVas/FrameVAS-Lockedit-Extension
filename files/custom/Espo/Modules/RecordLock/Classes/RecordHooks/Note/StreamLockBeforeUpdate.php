<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Classes\RecordHooks\Note;

use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Record\Hook\UpdateHook;
use Espo\Core\Record\UpdateParams;
use Espo\Modules\RecordLock\Tools\RecordLock\StreamLockChecker;
use Espo\ORM\Entity;

/**
 * @implements UpdateHook<\Espo\Entities\Note>
 */
class StreamLockBeforeUpdate implements UpdateHook
{
    public function __construct(private StreamLockChecker $checker) {}

    /**
     * @throws Forbidden
     */
    public function process(Entity $entity, UpdateParams $params): void
    {
        $this->checker->check($entity);
    }
}
