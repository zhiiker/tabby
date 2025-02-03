import { Injectable } from '@angular/core'
import { HostAppService, Platform, TranslateService } from 'tabby-core'

import { ShellProvider, Shell } from 'tabby-local'

import { WSLShellProvider } from './wsl'
import { PowerShellCoreShellProvider } from './powershellCore'
import { WindowsStockShellsProvider } from './windowsStock'

/** @hidden */
@Injectable()
export class WindowsDefaultShellProvider extends ShellProvider {
    private providers: ShellProvider[]

    constructor (
        psc: PowerShellCoreShellProvider,
        wsl: WSLShellProvider,
        stock: WindowsStockShellsProvider,
        private hostApp: HostAppService,
        private translate: TranslateService,
    ) {
        super()
        this.providers = [
            psc,
            wsl,
            stock,
        ]
    }

    async provide (): Promise<Shell[]> {
        if (this.hostApp.platform !== Platform.Windows) {
            return []
        }
        // Figure out a sensible default
        const shellLists = await Promise.all(this.providers.map(x => x.provide()))
        for (const list of shellLists) {
            if (list.length) {
                const shell = list[list.length - 1]

                return [{
                    ...shell,
                    id: 'default',
                    name: this.translate.instant('OS default ({name})', shell),
                    hidden: true,
                }]
            }
        }

        return []
    }
}
