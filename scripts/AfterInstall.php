<?php
/************************************************************************
 * Record Lock extension for EspoCRM.
 ************************************************************************/

use Espo\Core\Container;
use Espo\Core\DataManager;

class AfterInstall
{
    /**
     * EspoCRM rebuilds the database (adding the role permission columns) as part
     * of the installation. Only the cache timestamp is updated here, so browsers
     * reload the client scripts and metadata.
     *
     * @param array<string, mixed> $params
     */
    public function run(Container $container, array $params = []): void
    {
        /** @var DataManager $dataManager */
        $dataManager = $container->getByClass(DataManager::class);

        $dataManager->updateCacheTimestamp();
    }
}
