<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

namespace Espo\Modules\RecordLock\Metadata;

use Espo\Core\Utils\Metadata\AdditionalBuilder;
use stdClass;

/**
 * Runs when metadata is built. Makes lock fields mandatory in record list
 * queries, so the lock state is known wherever records are listed (list
 * views, relationship panels, kanban, dashlets, API) even when the lock
 * field is not a column on the layout.
 *
 * Applies to every lock field, however it was configured.
 */
class LockAttributesBuilder implements AdditionalBuilder
{
    public function build(stdClass $data): void
    {
        $entityDefsMap = $data->entityDefs ?? null;

        if (!$entityDefsMap instanceof stdClass) {
            return;
        }

        /** @var array<string, string[]> $lockFieldMap */
        $lockFieldMap = [];

        foreach (get_object_vars($entityDefsMap) as $entityType => $entityDefs) {
            $fieldList = $this->getLockFieldList($entityDefs);

            if ($fieldList !== []) {
                $lockFieldMap[$entityType] = $fieldList;
            }
        }

        if ($lockFieldMap === []) {
            return;
        }

        if (!isset($data->recordDefs) || !$data->recordDefs instanceof stdClass) {
            $data->recordDefs = (object) [];
        }

        foreach ($lockFieldMap as $entityType => $fieldList) {
            $recordDefs = $this->obtainObject($data->recordDefs, $entityType);

            $recordDefs->mandatoryAttributeList = $this->merge($recordDefs->mandatoryAttributeList ?? [], $fieldList);
        }

        // Relationship panels listing records of a lockable entity type.
        foreach (get_object_vars($entityDefsMap) as $entityType => $entityDefs) {
            $links = $entityDefs->links ?? null;

            if (!$links instanceof stdClass) {
                continue;
            }

            foreach (get_object_vars($links) as $link => $linkDefs) {
                $foreignEntityType = $linkDefs->entity ?? null;

                if (!is_string($foreignEntityType) || !isset($lockFieldMap[$foreignEntityType])) {
                    continue;
                }

                $recordDefs = $this->obtainObject($data->recordDefs, $entityType);
                $relationships = $this->obtainObject($recordDefs, 'relationships');
                $relationshipDefs = $this->obtainObject($relationships, $link);

                $relationshipDefs->mandatoryAttributeList = $this->merge(
                    $relationshipDefs->mandatoryAttributeList ?? [],
                    $lockFieldMap[$foreignEntityType]
                );
            }
        }
    }

    /**
     * @return string[]
     */
    private function getLockFieldList(mixed $entityDefs): array
    {
        $fields = $entityDefs->fields ?? null;

        if (!$fields instanceof stdClass) {
            return [];
        }

        $list = [];

        foreach (get_object_vars($fields) as $field => $fieldDefs) {
            if (
                $fieldDefs instanceof stdClass &&
                ($fieldDefs->type ?? null) === 'bool' &&
                !empty($fieldDefs->recordLock) &&
                empty($fieldDefs->notStorable)
            ) {
                $list[] = (string) $field;
            }
        }

        return $list;
    }

    private function obtainObject(stdClass $parent, string $key): stdClass
    {
        if (!isset($parent->$key) || !$parent->$key instanceof stdClass) {
            $parent->$key = (object) [];
        }

        return $parent->$key;
    }

    /**
     * @param mixed $existing
     * @param string[] $add
     * @return string[]
     */
    private function merge(mixed $existing, array $add): array
    {
        $existing = is_array($existing) ? $existing : [];

        return array_values(array_unique(array_merge($existing, $add)));
    }
}
