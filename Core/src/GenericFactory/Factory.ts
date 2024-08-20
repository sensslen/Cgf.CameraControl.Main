import { IBuilder } from './IBuilder';
import { IConfig } from '../Configuration/IConfig';
import { IDisposable } from './IDisposable';
import { ILogger } from '../Logger/ILogger';

export class Factory<TConcrete extends IDisposable> implements IDisposable {
    private _builders: { [key: string]: IBuilder<TConcrete> } = {};
    private _instances: { [key: number]: TConcrete } = {};

    public get(instance: number): TConcrete | undefined {
        return this._instances[instance];
    }

    public async parseConfig(config: IConfig, logger: ILogger): Promise<void> {
        if (this._instances[config.instance]) {
            logger.log(`Factory: Instance for index:${config.instance} is already available`);
            return;
        }

        const builder = this._builders[config.type];
        if (builder === undefined) {
            logger.error(`Factory: Could not find builder for type:${config.type}`);
        } else {
            try {
                const instance = await builder.build(config);
                this._instances[config.instance] = instance;
            } catch (error) {
                logger.error(
                    `Factory: building instance from configuration(${JSON.stringify(config)}) failed with (${error})`
                );
            }
        }
    }

    public async builderAdd(builder: IBuilder<TConcrete>, logger: ILogger): Promise<void> {
        try {
            const supportedTypes = await builder.supportedTypes();
            supportedTypes.forEach((type) => {
                if (this._builders[type] === undefined) {
                    this._builders[type] = builder;
                }
            });
        } catch (error) {
            logger.error(`Factory: Failed to add builder - ${error}`);
        }
    }

    public async dispose(): Promise<void> {
        for (const key in this._instances) {
            if (Object.prototype.hasOwnProperty.call(this._instances, key)) {
                try {
                    await this._instances[key].dispose();
                } catch {
                    // catch left empty on purpose, as we dispose on best effort
                }
            }
        }
    }
}
