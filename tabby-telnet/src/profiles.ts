import { Injectable } from '@angular/core'
import { NewTabParameters, PartialProfile, TranslateService, QuickConnectProfileProvider } from 'tabby-core'
import { TelnetProfileSettingsComponent } from './components/telnetProfileSettings.component'
import { TelnetTabComponent } from './components/telnetTab.component'
import { TelnetProfile } from './session'

@Injectable({ providedIn: 'root' })
export class TelnetProfilesService extends QuickConnectProfileProvider<TelnetProfile> {
    id = 'telnet'
    name = 'Telnet'
    supportsQuickConnect = true
    settingsComponent = TelnetProfileSettingsComponent
    configDefaults = {
        options: {
            host: null,
            port: 23,
            inputMode: 'local-echo',
            outputMode: null,
            inputNewlines: null,
            outputNewlines: 'crlf',
            scripts: [],
            input: { backspace: 'backspace' },
        },
        clearServiceMessagesOnConnect: false,
    }

    constructor (private translate: TranslateService) { super() }

    async getBuiltinProfiles (): Promise<PartialProfile<TelnetProfile>[]> {
        return [
            {
                id: `telnet:template`,
                type: 'telnet',
                name: this.translate.instant('Telnet session'),
                icon: 'fas fa-network-wired',
                options: {
                    host: '',
                    port: 23,
                    inputMode: 'readline',
                    outputMode: null,
                    inputNewlines: null,
                    outputNewlines: 'crlf',
                },
                isBuiltin: true,
                isTemplate: true,
            },
            {
                id: `socket:template`,
                type: 'telnet',
                name: this.translate.instant('Raw socket connection'),
                icon: 'fas fa-network-wired',
                options: {
                    host: '',
                    port: 1234,
                },
                isBuiltin: true,
                isTemplate: true,
            },
        ]
    }

    async getNewTabParameters (profile: TelnetProfile): Promise<NewTabParameters<TelnetTabComponent>> {
        return {
            type: TelnetTabComponent,
            inputs: { profile },
        }
    }

    getSuggestedName (profile: TelnetProfile): string|null {
        return this.getDescription(profile) || null
    }

    getDescription (profile: TelnetProfile): string {
        return profile.options.host ? `${profile.options.host}:${profile.options.port}` : ''
    }

    quickConnect (query: string): PartialProfile<TelnetProfile> {
        let host = query
        let port = 23
        if (host.includes('[')) {
            port = parseInt(host.split(']')[1].substring(1))
            host = host.split(']')[0].substring(1)
        } else if (host.includes(':')) {
            port = parseInt(host.split(/:/g)[1])
            host = host.split(':')[0]
        }

        return {
            name: query,
            type: 'telnet',
            options: {
                host,
                port,
                inputMode: 'readline',
                outputNewlines: 'crlf',
            },
        }
    }

    intoQuickConnectString (profile: TelnetProfile): string | null {
        let s = profile.options.host
        if (profile.options.port !== 23) {
            s = `${s}:${profile.options.port}`
        }
        return s
    }
}
