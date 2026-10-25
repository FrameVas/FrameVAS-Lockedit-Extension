<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Controllers;

use Espo\Core\Api\Request;
use Espo\Core\Exceptions\BadRequest;
use Espo\Core\Exceptions\Forbidden;
use Espo\Entities\User;
use Espo\Modules\RecordLock\Tools\RecordLock\LockConfigService;

/**
 * Administrator-only actions. Served through EspoCRM's generic
 * `/:controller/action/:action` route, so the extension adds no routes.
 */
class RecordLock
{
    /**
     * @throws Forbidden
     */
    public function __construct(
        private User $user,
        private LockConfigService $service,
    ) {
        if (!$this->user->isAdmin()) {
            throw new Forbidden("Only administrators can configure record locks.");
        }
    }

    /**
     * POST RecordLock/action/setField
     * Body: {entityType: string, field: string, enabled: bool, allowRemoval?: bool}
     *
     * @throws BadRequest
     */
    public function postActionSetField(Request $request): bool
    {
        $data = $request->getParsedBody();

        $entityType = $data->entityType ?? null;
        $field = $data->field ?? null;
        $enabled = $data->enabled ?? null;
        $allowRemoval = $data->allowRemoval ?? false;

        if (!is_string($entityType) || !is_string($field) || !is_bool($enabled) || !is_bool($allowRemoval)) {
            throw new BadRequest("Bad parameters.");
        }

        $this->service->setField($entityType, $field, $enabled, $allowRemoval);

        return true;
    }

    /**
     * POST RecordLock/action/setEntityOptions
     * Body: {entityType: string, listIcon?: bool, lockStream?: bool}
     *
     * @throws BadRequest
     */
    public function postActionSetEntityOptions(Request $request): bool
    {
        $data = $request->getParsedBody();

        $entityType = $data->entityType ?? null;
        $listIcon = $data->listIcon ?? null;
        $lockStream = $data->lockStream ?? null;

        if (
            !is_string($entityType) ||
            ($listIcon !== null && !is_bool($listIcon)) ||
            ($lockStream !== null && !is_bool($lockStream))
        ) {
            throw new BadRequest("Bad parameters.");
        }

        $this->service->setEntityOptions($entityType, $listIcon, $lockStream);

        return true;
    }
}
