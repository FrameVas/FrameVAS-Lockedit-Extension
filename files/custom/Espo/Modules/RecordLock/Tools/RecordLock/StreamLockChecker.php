<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Tools\RecordLock;

use Espo\Core\AclManager;
use Espo\Core\Exceptions\Error\Body;
use Espo\Core\Exceptions\Forbidden;
use Espo\Core\Utils\Metadata;
use Espo\Entities\Note;
use Espo\Entities\User;
use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Optional stream lock. When "Lock Stream of Locked Records" is enabled for an
 * entity in Entity Manager, users who may not edit a locked record also can't
 * post to its stream, or edit or remove posts there.
 *
 * Applies to user posts only. System notes (updates, status changes) and
 * automation are not affected.
 */
class StreamLockChecker
{
    public const PARAM = 'recordLockStream';

    public function __construct(
        private Metadata $metadata,
        private EntityManager $entityManager,
        private LockFieldProvider $lockFieldProvider,
        private LockGuard $lockGuard,
        private User $user,
        private AclManager $aclManager,
    ) {}

    /**
     * @throws Forbidden
     */
    public function check(Entity $note): void
    {
        if ($note->get('type') !== Note::TYPE_POST) {
            return;
        }

        $parentType = $note->get('parentType');
        $parentId = $note->get('parentId');

        if (!is_string($parentType) || !is_string($parentId) || $parentType === '' || $parentId === '') {
            return;
        }

        if (!$this->metadata->get(['scopes', $parentType, self::PARAM])) {
            return;
        }

        if (!$this->lockFieldProvider->hasFields($parentType)) {
            return;
        }

        $parent = $this->entityManager->getEntityById($parentType, $parentId);

        if (!$parent || !$this->lockGuard->isLocked($parent)) {
            return;
        }

        if ($this->lockGuard->canOverride($this->user, $this->aclManager)) {
            return;
        }

        throw Forbidden::createWithBody(
            'The record is locked. Its stream is closed.',
            Body::create()->withMessageTranslation('streamLocked', 'RecordLock')
        );
    }
}
